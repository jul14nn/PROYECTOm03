#include "PluginProcessor.h"
#include "PluginEditor.h"

namespace diablo
{

// Presets de fábrica. El primero es el pacto; el resto son ajustes manuales.
static const Preset factoryPresets[] = {
    //  nombre        pacto   mix  decay  pre   dark  lowcut duck width deess sync
    { "Modo Pacto",   true,  25.0f, 1.9f, 40.0f, 45.0f, 130.0f, 6.0f, 100.0f, 60.0f, 0 },
    { "Capilla",      false, 18.0f, 1.1f, 20.0f, 60.0f, 150.0f, 4.0f,  90.0f, 55.0f, 0 },
    { "Placa 80s",    false, 28.0f, 2.6f, 60.0f, 20.0f, 110.0f, 6.0f, 110.0f, 70.0f, 0 },
    { "Estadio",      false, 32.0f, 4.8f, 90.0f, 40.0f, 140.0f, 8.0f, 120.0f, 50.0f, 0 },
};

DiabloVerbProcessor::DiabloVerbProcessor()
    : AudioProcessor (BusesProperties()
                          .withInput ("Input", juce::AudioChannelSet::stereo(), true)
                          .withOutput ("Output", juce::AudioChannelSet::stereo(), true)),
      apvts (*this, nullptr, "PARAMS", createLayout())
{
}

juce::AudioProcessorValueTreeState::ParameterLayout DiabloVerbProcessor::createLayout()
{
    using P = juce::AudioParameterFloat;
    juce::AudioProcessorValueTreeState::ParameterLayout layout;

    layout.add (std::make_unique<P> (
        juce::ParameterID { ParamID::mix, 1 }, "Mezcla",
        juce::NormalisableRange<float> (0.0f, 100.0f, 0.1f), 25.0f,
        juce::AudioParameterFloatAttributes().withLabel ("%")));

    layout.add (std::make_unique<P> (
        juce::ParameterID { ParamID::decay, 1 }, "Decay",
        juce::NormalisableRange<float> (0.3f, 8.0f, 0.01f, 0.5f), 1.9f,
        juce::AudioParameterFloatAttributes().withLabel ("s")));

    layout.add (std::make_unique<P> (
        juce::ParameterID { ParamID::predelay, 1 }, "Pre-delay",
        juce::NormalisableRange<float> (0.0f, 250.0f, 0.1f), 40.0f,
        juce::AudioParameterFloatAttributes().withLabel ("ms")));

    layout.add (std::make_unique<juce::AudioParameterChoice> (
        juce::ParameterID { ParamID::sync, 1 }, "Sync pre-delay",
        juce::StringArray { "Libre", "1/64", "1/32", "1/16", "1/8" }, 0));

    layout.add (std::make_unique<P> (
        juce::ParameterID { ParamID::dark, 1 }, "Oscuridad",
        juce::NormalisableRange<float> (0.0f, 100.0f, 0.1f), 45.0f,
        juce::AudioParameterFloatAttributes().withLabel ("%")));

    layout.add (std::make_unique<P> (
        juce::ParameterID { ParamID::lowcut, 1 }, "Graves fuera",
        juce::NormalisableRange<float> (40.0f, 400.0f, 1.0f, 0.5f), 120.0f,
        juce::AudioParameterFloatAttributes().withLabel ("Hz")));

    layout.add (std::make_unique<P> (
        juce::ParameterID { ParamID::duck, 1 }, "Ducking",
        juce::NormalisableRange<float> (0.0f, 12.0f, 0.1f), 6.0f,
        juce::AudioParameterFloatAttributes().withLabel ("dB")));

    layout.add (std::make_unique<P> (
        juce::ParameterID { ParamID::width, 1 }, "Ancho",
        juce::NormalisableRange<float> (0.0f, 120.0f, 1.0f), 100.0f,
        juce::AudioParameterFloatAttributes().withLabel ("%")));

    layout.add (std::make_unique<P> (
        juce::ParameterID { ParamID::deess, 1 }, "Anti-eses",
        juce::NormalisableRange<float> (0.0f, 100.0f, 0.1f), 60.0f,
        juce::AudioParameterFloatAttributes().withLabel ("%")));

    layout.add (std::make_unique<juce::AudioParameterBool> (
        juce::ParameterID { ParamID::pacto, 1 }, "Modo Pacto", true));

    return layout;
}

void DiabloVerbProcessor::prepareToPlay (double sampleRate, int samplesPerBlock)
{
    currentSampleRate = sampleRate;

    plate.prepare (sampleRate);
    ducker.prepare (sampleRate);
    deEsser.prepare (sampleRate);
    preDelayLine.prepare ((int) std::ceil (0.3 * sampleRate));

    juce::dsp::ProcessSpec spec { sampleRate, (juce::uint32) samplesPerBlock, 1 };
    sendHighpass.prepare (spec);
    sendHighpass.setType (juce::dsp::StateVariableTPTFilterType::highpass);
    sendLowpass.prepare (spec);
    sendLowpass.setType (juce::dsp::StateVariableTPTFilterType::lowpass);

    wetGain.reset (sampleRate, 0.05);
    dryGain.reset (sampleRate, 0.05);
    widthAmount.reset (sampleRate, 0.05);
    preDelaySamples.reset (sampleRate, 0.12);
}

bool DiabloVerbProcessor::isBusesLayoutSupported (const BusesLayout& layouts) const
{
    const auto& in = layouts.getMainInputChannelSet();
    const auto& out = layouts.getMainOutputChannelSet();
    if (in != out)
        return false;
    return in == juce::AudioChannelSet::mono() || in == juce::AudioChannelSet::stereo();
}

float DiabloVerbProcessor::syncedPredelayMs (int syncChoice, double bpm, float freeMs)
{
    if (syncChoice <= 0)
        return freeMs;

    const double beatMs = 60000.0 / std::max (20.0, bpm); // negra
    const double divisors[] = { 1.0, 16.0, 8.0, 4.0, 2.0 }; // -, 1/64, 1/32, 1/16, 1/8
    return (float) std::min (250.0, beatMs / divisors[std::min (syncChoice, 4)]);
}

void DiabloVerbProcessor::processBlock (juce::AudioBuffer<float>& buffer, juce::MidiBuffer&)
{
    juce::ScopedNoDenormals noDenormals;

    double bpm = 120.0;
    if (auto* head = getPlayHead())
        if (auto position = head->getPosition())
            if (auto hostBpm = position->getBpm())
                bpm = *hostBpm;
    lastBpm.store ((float) bpm);

    const bool pacto = apvts.getRawParameterValue (ParamID::pacto)->load() > 0.5f;

    const float mixPct   = apvts.getRawParameterValue (ParamID::mix)->load();
    const float widthPct = apvts.getRawParameterValue (ParamID::width)->load();

    float decaySeconds, preMs, darkPct, lowcutHz, duckDb, deessPct;
    if (pacto)
    {
        // La "receta del reverb perfecto", ligada al tempo del proyecto:
        // pre-delay de 1/64 (separa la voz de la cola sin sonar a eco),
        // decay de unas 4 negras (respira con la canción), cola filtrada
        // y ducking para que nunca pise la letra.
        const float beatSec = (float) (60.0 / bpm);
        preMs        = syncedPredelayMs (1, bpm, 40.0f);
        decaySeconds = std::clamp (4.0f * beatSec, 1.2f, 3.2f);
        darkPct      = 45.0f;
        lowcutHz     = 130.0f;
        duckDb       = 6.0f;
        deessPct     = 60.0f;
    }
    else
    {
        decaySeconds = apvts.getRawParameterValue (ParamID::decay)->load();
        preMs        = syncedPredelayMs ((int) apvts.getRawParameterValue (ParamID::sync)->load(),
                                         bpm,
                                         apvts.getRawParameterValue (ParamID::predelay)->load());
        darkPct  = apvts.getRawParameterValue (ParamID::dark)->load();
        lowcutHz = apvts.getRawParameterValue (ParamID::lowcut)->load();
        duckDb   = apvts.getRawParameterValue (ParamID::duck)->load();
        deessPct = apvts.getRawParameterValue (ParamID::deess)->load();
    }

    plate.setDecaySeconds (decaySeconds);
    plate.setDamping (0.05f + 0.60f * darkPct / 100.0f);
    ducker.setAmountDb (duckDb);
    deEsser.setAmount (deessPct / 100.0f);
    sendHighpass.setCutoffFrequency (lowcutHz);
    sendLowpass.setCutoffFrequency (12000.0f * std::pow (2200.0f / 12000.0f, darkPct / 100.0f));

    // Mezcla equipotente para que subir el reverb no dispare el volumen.
    const float mixNorm = mixPct / 100.0f;
    wetGain.setTargetValue (std::sin (mixNorm * juce::MathConstants<float>::halfPi));
    dryGain.setTargetValue (std::cos (mixNorm * juce::MathConstants<float>::halfPi));
    widthAmount.setTargetValue (widthPct / 100.0f);
    preDelaySamples.setTargetValue (std::max (1.0f, preMs * 0.001f * (float) currentSampleRate));

    const int numSamples  = buffer.getNumSamples();
    const int numChannels = buffer.getNumChannels();

    auto* left  = buffer.getWritePointer (0);
    auto* right = numChannels > 1 ? buffer.getWritePointer (1) : nullptr;

    for (int i = 0; i < numSamples; ++i)
    {
        const float inL = left[i];
        const float inR = right != nullptr ? right[i] : inL;
        const float mono = 0.5f * (inL + inR);

        float send = sendHighpass.processSample (0, mono);
        send = sendLowpass.processSample (0, send);
        send = deEsser.process (send);

        const float delayed = preDelayLine.readFrac (preDelaySamples.getNextValue());
        preDelayLine.write (send);

        float wetL = 0.0f, wetR = 0.0f;
        plate.process (delayed, wetL, wetR);

        const float duckGain = ducker.processGain (std::abs (mono));

        const float w   = widthAmount.getNextValue();
        const float mid  = 0.5f * (wetL + wetR);
        const float side = 0.5f * (wetL - wetR) * w;
        wetL = mid + side;
        wetR = mid - side;

        const float wet = wetGain.getNextValue() * duckGain;
        const float dry = dryGain.getNextValue();

        left[i] = inL * dry + wetL * wet;
        if (right != nullptr)
            right[i] = inR * dry + wetR * wet;
    }
}

int DiabloVerbProcessor::getNumPrograms()
{
    return (int) (sizeof (factoryPresets) / sizeof (factoryPresets[0]));
}

const juce::String DiabloVerbProcessor::getProgramName (int index)
{
    if (index < 0 || index >= getNumPrograms())
        return {};
    return factoryPresets[index].name;
}

void DiabloVerbProcessor::setCurrentProgram (int index)
{
    if (index < 0 || index >= getNumPrograms())
        return;
    currentProgram = index;
    const auto& preset = factoryPresets[index];

    auto apply = [this] (const char* id, float value)
    {
        if (auto* param = apvts.getParameter (id))
            param->setValueNotifyingHost (param->convertTo0to1 (value));
    };

    apply (ParamID::pacto, preset.pacto ? 1.0f : 0.0f);
    apply (ParamID::mix, preset.mix);
    apply (ParamID::decay, preset.decay);
    apply (ParamID::predelay, preset.predelayMs);
    apply (ParamID::sync, (float) preset.sync);
    apply (ParamID::dark, preset.dark);
    apply (ParamID::lowcut, preset.lowcut);
    apply (ParamID::duck, preset.duck);
    apply (ParamID::width, preset.width);
    apply (ParamID::deess, preset.deess);
}

void DiabloVerbProcessor::getStateInformation (juce::MemoryBlock& destData)
{
    if (auto xml = apvts.copyState().createXml())
        copyXmlToBinary (*xml, destData);
}

void DiabloVerbProcessor::setStateInformation (const void* data, int sizeInBytes)
{
    if (auto xml = getXmlFromBinary (data, sizeInBytes))
        if (xml->hasTagName (apvts.state.getType()))
            apvts.replaceState (juce::ValueTree::fromXml (*xml));
}

juce::AudioProcessorEditor* DiabloVerbProcessor::createEditor()
{
    return new DiabloVerbEditor (*this);
}

} // namespace diablo

// Punto de entrada que JUCE exige para crear el plugin.
juce::AudioProcessor* JUCE_CALLTYPE createPluginFilter()
{
    return new diablo::DiabloVerbProcessor();
}
