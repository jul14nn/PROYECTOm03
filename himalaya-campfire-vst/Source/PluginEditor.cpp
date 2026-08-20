#include "PluginEditor.h"
#include "BinaryData.h"

namespace
{
const char* mimeForExtension (const juce::String& extension)
{
    static const std::unordered_map<juce::String, const char*> mimeMap {
        { "html", "text/html" },
        { "js", "text/javascript" },
        { "css", "text/css" },
        { "json", "application/json" },
        { "svg", "image/svg+xml" },
        { "png", "image/png" },
    };

    if (const auto it = mimeMap.find (extension.toLowerCase()); it != mimeMap.end())
        return it->second;

    return "application/octet-stream";
}

juce::String extensionOf (const juce::String& filename)
{
    return filename.fromLastOccurrenceOf (".", false, false);
}

std::vector<std::byte> toBytes (const char* data, int size)
{
    const auto* bytePtr = reinterpret_cast<const std::byte*> (data);
    return { bytePtr, bytePtr + size };
}
} // namespace

bool SinglePageBrowser::pageAboutToLoad (const juce::String& newURL)
{
    return newURL == getResourceProviderRoot();
}

std::optional<juce::WebBrowserComponent::Resource> HimalayaCampfireAudioProcessorEditor::getResource (const juce::String& url)
{
    // Los recursos se sirven desde WebUI/, embebidos en el binario vía
    // BinaryData (ver juce_add_binary_data en CMakeLists.txt), buscando por
    // nombre de archivo original (sin subcarpeta, tal y como los indexa
    // BinaryData::originalFilenames).
    const auto requestedPath = url == "/" ? juce::String { "index.html" }
                                          : url.fromFirstOccurrenceOf ("/", false, false);
    const auto filename = requestedPath.fromLastOccurrenceOf ("/", false, false);

    for (int i = 0; i < BinaryData::namedResourceListSize; ++i)
    {
        if (juce::String (BinaryData::originalFilenames[i]) == filename)
        {
            int size = 0;
            const auto* data = BinaryData::getNamedResource (BinaryData::namedResourceList[i], size);

            if (data == nullptr)
                return std::nullopt;

            return juce::WebBrowserComponent::Resource { toBytes (data, size),
                                                          juce::String (mimeForExtension (extensionOf (filename))) };
        }
    }

    return std::nullopt;
}

HimalayaCampfireAudioProcessorEditor::HimalayaCampfireAudioProcessorEditor (HimalayaCampfireAudioProcessor& p)
    : AudioProcessorEditor (&p),
      processorRef (p),
      intensityAttachment (*processorRef.state.getParameter (ID::intensity.getParamID()),
                           intensitySliderRelay,
                           processorRef.state.undoManager)
{
    extraction.onProgress = [this] (const juce::String& stage, const juce::String& message)
    {
        auto* payload = new juce::DynamicObject();
        payload->setProperty ("stage", stage);
        payload->setProperty ("message", message);
        webComponent.emitEventIfBrowserIsVisible ("extractProgress", juce::var { payload });
    };

    extraction.onFinished = [this] (const juce::var& result)
    {
        webComponent.emitEventIfBrowserIsVisible ("extractResult", result);
    };

    extraction.onError = [this] (const juce::String& message)
    {
        auto* payload = new juce::DynamicObject();
        payload->setProperty ("message", message);
        webComponent.emitEventIfBrowserIsVisible ("extractError", juce::var { payload });
    };

    addAndMakeVisible (webComponent);
    webComponent.goToURL (juce::WebBrowserComponent::getResourceProviderRoot());

    setResizable (true, true);
    setResizeLimits (620, 420, 3840, 2160);
    setSize (980, 620);

    startTimerHz (30);
}

HimalayaCampfireAudioProcessorEditor::~HimalayaCampfireAudioProcessorEditor()
{
    stopTimer();
    extraction.cancel();
}

void HimalayaCampfireAudioProcessorEditor::timerCallback()
{
    const auto level = processorRef.getCurrentLevel();

    // Silencio sostenido: deja de emitir en vez de repetir ceros.
    if (level <= 0.0005f && lastSentLevel <= 0.0005f)
        return;

    lastSentLevel = level;
    // var{float} sería ambiguo (double/int/bool): se pasa como double.
    webComponent.emitEventIfBrowserIsVisible ("audioLevel", juce::var { (double) level });
}

//==============================================================================
juce::var HimalayaCampfireAudioProcessorEditor::buildStatus() const
{
    auto* status = new juce::DynamicObject();

    status->setProperty ("python", settings.getPython().getFullPathName());
    status->setProperty ("extractor", settings.getExtractorDirectory().getFullPathName());
    status->setProperty ("output", settings.getOutputDirectory().getFullPathName());
    status->setProperty ("ready", settings.isReady());
    status->setProperty ("problem", settings.describeProblem());
    status->setProperty ("busy", extraction.isBusy());
    status->setProperty ("capturedSeconds", processorRef.getCaptureBuffer().getAvailableSeconds());
    status->setProperty ("playhead", processorRef.getPlayheadSeconds());

    return juce::var { status };
}

void HimalayaCampfireAudioProcessorEditor::handleGetStatus (const juce::Array<juce::var>&,
                                                            juce::WebBrowserComponent::NativeFunctionCompletion complete)
{
    complete (buildStatus());
}

void HimalayaCampfireAudioProcessorEditor::handleSetSetting (const juce::Array<juce::var>& args,
                                                             juce::WebBrowserComponent::NativeFunctionCompletion complete)
{
    if (args.size() >= 2)
        settings.set (args[0].toString(), args[1].toString());

    complete (buildStatus());
}

void HimalayaCampfireAudioProcessorEditor::handleReveal (const juce::Array<juce::var>& args,
                                                         juce::WebBrowserComponent::NativeFunctionCompletion complete)
{
    if (args.size() >= 1)
    {
        const juce::File target (args[0].toString());

        if (target.existsAsFile())
            target.revealToUser();
        else if (target.isDirectory())
            target.revealToUser();
    }

    complete (juce::var (true));
}

juce::String HimalayaCampfireAudioProcessorEditor::makeLabel() const
{
    const auto playhead = processorRef.getPlayheadSeconds();

    if (playhead < 0.0)
        return juce::Time::getCurrentTime().formatted ("captura-%H%M%S");

    const auto totalSeconds = (int) playhead;
    return juce::String (totalSeconds / 60) + "-" + juce::String (totalSeconds % 60).paddedLeft ('0', 2);
}

void HimalayaCampfireAudioProcessorEditor::handleExtract (const juce::Array<juce::var>& args,
                                                          juce::WebBrowserComponent::NativeFunctionCompletion complete)
{
    const auto fail = [&complete] (const juce::String& message)
    {
        auto* payload = new juce::DynamicObject();
        payload->setProperty ("started", false);
        payload->setProperty ("message", message);
        complete (juce::var { payload });
    };

    if (extraction.isBusy())
        return fail ("Ya hay una extracción en marcha.");

    if (! settings.isReady())
        return fail (settings.describeProblem());

    juce::AudioBuffer<float> snapshot;

    if (! processorRef.getCaptureBuffer().snapshot (snapshot))
        return fail ("Todavía no ha pasado audio por el plugin. Reproduce la canción y vuelve a intentarlo.");

    const auto sampleRate = processorRef.getCaptureBuffer().getSampleRate();
    const auto capturedSeconds = (double) snapshot.getNumSamples() / juce::jmax (1.0, sampleRate);

    ExtractionJob::Settings jobSettings;
    jobSettings.pythonExecutable = settings.getPython();
    jobSettings.extractorDirectory = settings.getExtractorDirectory();
    jobSettings.outputDirectory = settings.getOutputDirectory();
    jobSettings.instrument = args.size() >= 1 ? args[0].toString() : juce::String ("piano");
    jobSettings.separate = args.size() >= 2 && (bool) args[1];
    jobSettings.label = makeLabel();

    // La interfaz pide "hace N segundos"; aquí se traduce a un instante dentro
    // del fragmento, que es lo que entiende el extractor.
    const auto secondsAgo = args.size() >= 3 ? (double) args[2] : 0.5;
    jobSettings.offsetSeconds = juce::jlimit (0.0, capturedSeconds, capturedSeconds - secondsAgo);

    jobSettings.outputDirectory.createDirectory();

    if (! extraction.start (std::move (snapshot), sampleRate, std::move (jobSettings)))
        return fail ("No se pudo iniciar la extracción.");

    auto* payload = new juce::DynamicObject();
    payload->setProperty ("started", true);
    payload->setProperty ("label", makeLabel());
    payload->setProperty ("capturedSeconds", capturedSeconds);
    complete (juce::var { payload });
}

void HimalayaCampfireAudioProcessorEditor::paint (juce::Graphics& g)
{
    g.fillAll (juce::Colours::black);
}

void HimalayaCampfireAudioProcessorEditor::resized()
{
    webComponent.setBounds (getLocalBounds());
}
