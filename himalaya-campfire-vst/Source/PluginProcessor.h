#pragma once

#include <atomic>
#include <juce_audio_processors/juce_audio_processors.h>

#include "CaptureBuffer.h"

namespace ID
{
static const juce::ParameterID intensity { "intensity", 1 };
}

//==============================================================================
// Extractor de one-shots con cara de plugin visual.
//
// El audio pasa sin modificarse, pero el plugin va guardando los últimos
// segundos que lo atraviesan (ver CaptureBuffer): cuando oyes la nota que
// quieres, pulsas y el fragmento ya está grabado. De ahí salen el MIDI y el
// WAV one-shot, que genera el extractor en un proceso aparte (ExtractionJob).
//
// El parámetro "intensity" es automatizable y decide cuánto reacciona la
// animación; el nivel del audio decide cuándo.
class HimalayaCampfireAudioProcessor : public juce::AudioProcessor
{
public:
    // Segundos de audio que se conservan hacia atrás. Suficiente para
    // reaccionar sin pasarse de memoria: a 48 kHz estéreo son unos 11 MB.
    static constexpr double captureSeconds = 30.0;

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

    // Últimos segundos de audio, para extraer de ellos.
    const CaptureBuffer& getCaptureBuffer() const noexcept { return captureBuffer; }

    // Posición del cabezal en la canción, en segundos, o -1 si el host no la
    // da (por ejemplo si está parado). Sirve para etiquetar la captura con el
    // minuto real de la canción, no con el instante dentro del fragmento.
    double getPlayheadSeconds() const noexcept { return playheadSeconds.load (std::memory_order_relaxed); }

private:
    static juce::AudioProcessorValueTreeState::ParameterLayout createParameterLayout();

    std::atomic<float> currentLevel { 0.0f };
    float levelDecay = 0.0f;

    CaptureBuffer captureBuffer;
    std::atomic<double> playheadSeconds { -1.0 };

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR (HimalayaCampfireAudioProcessor)
};
