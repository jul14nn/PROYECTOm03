#pragma once

#include <atomic>
#include <juce_audio_processors/juce_audio_processors.h>

namespace ID
{
static const juce::ParameterID intensity { "intensity", 1 };
}

//==============================================================================
// Plugin puramente visual: el audio pasa sin modificarse. El parámetro
// "intensity" es automatizable desde el DAW y decide cuánto reacciona la
// animación; el nivel del audio que atraviesa el plugin decide cuándo (ver
// getCurrentLevel y PluginEditor).
class HimalayaCampfireAudioProcessor : public juce::AudioProcessor
{
public:
    HimalayaCampfireAudioProcessor();
    ~HimalayaCampfireAudioProcessor() override = default;

    void prepareToPlay (double sampleRate, int samplesPerBlock) override;
    void releaseResources() override {}

    bool isBusesLayoutSupported (const BusesLayout& layouts) const override;

    void processBlock (juce::AudioBuffer<float>&, juce::MidiBuffer&) override;
    using AudioProcessor::processBlock;

    juce::AudioProcessorEditor* createEditor() override;
    bool hasEditor() const override { return true; }

    const juce::String getName() const override { return JucePlugin_Name; }

    bool acceptsMidi() const override { return false; }
    bool producesMidi() const override { return false; }
    bool isMidiEffect() const override { return false; }
    double getTailLengthSeconds() const override { return 0.0; }

    int getNumPrograms() override { return 1; }
    int getCurrentProgram() override { return 0; }
    void setCurrentProgram (int) override {}
    const juce::String getProgramName (int) override { return {}; }
    void changeProgramName (int, const juce::String&) override {}

    void getStateInformation (juce::MemoryBlock& destData) override;
    void setStateInformation (const void* data, int sizeInBytes) override;

    juce::AudioProcessorValueTreeState state;

    // Nivel del audio que atraviesa el plugin, ya mapeado a 0..1 para la
    // interfaz. Lo escribe el hilo de audio y lo lee el editor, de ahí el
    // atomic: nunca bloquea processBlock.
    float getCurrentLevel() const noexcept { return currentLevel.load (std::memory_order_relaxed); }

private:
    static juce::AudioProcessorValueTreeState::ParameterLayout createParameterLayout();

    std::atomic<float> currentLevel { 0.0f };
    float levelDecay = 0.0f;

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR (HimalayaCampfireAudioProcessor)
};
