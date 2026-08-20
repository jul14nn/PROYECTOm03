#include "PluginProcessor.h"
#include "PluginEditor.h"

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

void HimalayaCampfireAudioProcessor::prepareToPlay (double, int)
{
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
    // canales de salida que no tengan entrada correspondiente.
    juce::ScopedNoDenormals noDenormals;

    for (auto ch = getTotalNumInputChannels(); ch < getTotalNumOutputChannels(); ++ch)
        buffer.clear (ch, 0, buffer.getNumSamples());
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
