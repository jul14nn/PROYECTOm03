#include "PluginProcessor.h"
#include "PluginEditor.h"

#include <cmath>

juce::AudioProcessorValueTreeState::ParameterLayout HimalayaCampfireAudioProcessor::createParameterLayout()
{
    juce::AudioProcessorValueTreeState::ParameterLayout layout;

    layout.add (std::make_unique<juce::AudioParameterFloat> (
        ID::intensity,
        "Intensity",
        juce::NormalisableRange<float> { 0.0f, 1.0f },
        0.45f,
        juce::AudioParameterFloatAttributes{}.withLabel ("%")));

    return layout;
}

HimalayaCampfireAudioProcessor::HimalayaCampfireAudioProcessor()
    : AudioProcessor (BusesProperties()
                           .withInput ("Input", juce::AudioChannelSet::stereo(), true)
                           .withOutput ("Output", juce::AudioChannelSet::stereo(), true)),
      state (*this, nullptr, "STATE", createParameterLayout())
{
}

void HimalayaCampfireAudioProcessor::prepareToPlay (double sampleRate, int)
{
    levelDecay = 0.0f;
    currentLevel.store (0.0f, std::memory_order_relaxed);
    playheadSeconds.store (-1.0, std::memory_order_relaxed);

    captureBuffer.prepare (sampleRate,
                           juce::jmax (1, getTotalNumInputChannels()),
                           captureSeconds);
}

bool HimalayaCampfireAudioProcessor::isBusesLayoutSupported (const BusesLayout& layouts) const
{
    if (layouts.getMainOutputChannelSet() != juce::AudioChannelSet::mono()
        && layouts.getMainOutputChannelSet() != juce::AudioChannelSet::stereo())
        return false;

    return layouts.getMainOutputChannelSet() == layouts.getMainInputChannelSet();
}

void HimalayaCampfireAudioProcessor::processBlock (juce::AudioBuffer<float>& buffer, juce::MidiBuffer&)
{
    // Plugin puramente visual: no se toca el audio, solo se limpian los
    // canales de salida que no tengan entrada correspondiente...
    juce::ScopedNoDenormals noDenormals;

    for (auto ch = getTotalNumInputChannels(); ch < getTotalNumOutputChannels(); ++ch)
        buffer.clear (ch, 0, buffer.getNumSamples());

    // ...y se mide su nivel para que la animación siga a la música.
    const auto numSamples = buffer.getNumSamples();
    const auto numChannels = juce::jmin (getTotalNumInputChannels(), buffer.getNumChannels());

    if (numSamples <= 0 || numChannels <= 0)
        return;

    float sumOfSquares = 0.0f;

    for (int ch = 0; ch < numChannels; ++ch)
    {
        const auto magnitude = buffer.getRMSLevel (ch, 0, numSamples);
        sumOfSquares += magnitude * magnitude;
    }

    const auto rms = std::sqrt (sumOfSquares / (float) numChannels);

    // A decibelios y de ahí a 0..1 sobre un rango útil de mezcla (-48..0 dB),
    // que reacciona mucho mejor que el valor lineal: a niveles normales de
    // mezcla el RMS lineal apenas se despega de cero.
    const auto dB = juce::Decibels::gainToDecibels (rms, -60.0f);
    const auto normalised = juce::jlimit (0.0f, 1.0f, juce::jmap (dB, -48.0f, 0.0f, 0.0f, 1.0f));

    // Caída suave: el ataque lo aplica la interfaz, aquí solo evitamos que el
    // valor se desplome entre bloques y produzca parpadeo.
    levelDecay = juce::jmax (normalised, levelDecay * 0.82f);
    currentLevel.store (levelDecay, std::memory_order_relaxed);

    // Y se guarda el audio para poder extraerlo después.
    captureBuffer.push (buffer);

    if (auto* head = getPlayHead())
        if (const auto position = head->getPosition())
            if (const auto seconds = position->getTimeInSeconds())
                playheadSeconds.store (*seconds, std::memory_order_relaxed);
}

void HimalayaCampfireAudioProcessor::getStateInformation (juce::MemoryBlock& destData)
{
    if (auto xml = state.copyState().createXml())
        copyXmlToBinary (*xml, destData);
}

void HimalayaCampfireAudioProcessor::setStateInformation (const void* data, int sizeInBytes)
{
    if (auto xml = getXmlFromBinary (data, sizeInBytes))
        state.replaceState (juce::ValueTree::fromXml (*xml));
}

juce::AudioProcessorEditor* HimalayaCampfireAudioProcessor::createEditor()
{
    return new HimalayaCampfireAudioProcessorEditor (*this);
}

juce::AudioProcessor* JUCE_CALLTYPE createPluginFilter()
{
    return new HimalayaCampfireAudioProcessor();
}
