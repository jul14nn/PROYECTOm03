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
    addAndMakeVisible (webComponent);
    webComponent.goToURL (juce::WebBrowserComponent::getResourceProviderRoot());

    setResizable (true, true);
    setResizeLimits (480, 320, 3840, 2160);
    setSize (900, 560);

    startTimerHz (30);
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

void HimalayaCampfireAudioProcessorEditor::paint (juce::Graphics& g)
{
    g.fillAll (juce::Colours::black);
}

void HimalayaCampfireAudioProcessorEditor::resized()
{
    webComponent.setBounds (getLocalBounds());
}
