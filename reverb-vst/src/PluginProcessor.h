#pragma once

#include <juce_audio_processors/juce_audio_processors.h>
#include <juce_dsp/juce_dsp.h>

#include "dsp/PlateReverb.h"
#include "dsp/Ducker.h"

namespace diablo
{

namespace ParamID
{
    inline constexpr const char* mix      = "mix";
    inline constexpr const char* decay    = "decay";
    inline constexpr const char* predelay = "predelay";
    inline constexpr const char* sync     = "sync";
    inline constexpr const char* dark     = "dark";
    inline constexpr const char* lowcut   = "lowcut";
    inline constexpr const char* duck     = "duck";
    inline constexpr const char* width    = "width";
    inline constexpr const char* pacto    = "pacto";
}

class DiabloVerbProcessor : public juce::AudioProcessor
{
public:
    DiabloVerbProcessor();

    void prepareToPlay (double sampleRate, int samplesPerBlock) override;
    void releaseResources() override {}
    bool isBusesLayoutSupported (const BusesLayout& layouts) const override;
    void processBlock (juce::AudioBuffer<float>&, juce::MidiBuffer&) override;

    juce::AudioProcessorEditor* createEditor() override;
    bool hasEditor() const override { return true; }

    const juce::String getName() const override { return "Diablo Verb"; }
    bool acceptsMidi() const override { return false; }
    bool producesMidi() const override { return false; }
    double getTailLengthSeconds() const override { return 8.0; }

    int getNumPrograms() override { return 1; }
    int getCurrentProgram() override { return 0; }
    void setCurrentProgram (int) override {}
    const juce::String getProgramName (int) override { return {}; }
    void changeProgramName (int, const juce::String&) override {}

    void getStateInformation (juce::MemoryBlock& destData) override;
    void setStateInformation (const void* data, int sizeInBytes) override;

    juce::AudioProcessorValueTreeState apvts;

    /** Último BPM leído del host (para mostrarlo en el editor). */
    float getCurrentBpm() const { return lastBpm.load(); }

private:
    static juce::AudioProcessorValueTreeState::ParameterLayout createLayout();

    /** ms de pre-delay para una figura sincronizada (índice del combo "sync"). */
    static float syncedPredelayMs (int syncChoice, double bpm, float freeMs);

    PlateReverb plate;
    Ducker ducker;
    juce::dsp::StateVariableTPTFilter<float> sendHighpass, sendLowpass;
    DelayLine preDelayLine;

    juce::SmoothedValue<float> wetGain, dryGain, widthAmount, preDelaySamples;

    double currentSampleRate = 48000.0;
    std::atomic<float> lastBpm { 120.0f };

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR (DiabloVerbProcessor)
};

} // namespace diablo
