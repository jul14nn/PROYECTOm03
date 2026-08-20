#pragma once

#include <atomic>
#include <cmath>
#include <juce_audio_basics/juce_audio_basics.h>

//==============================================================================
// Buffer circular con los últimos segundos de audio que han atravesado el
// plugin. Es lo que convierte a este plugin en un extractor: cuando oyes la
// nota que quieres, el fragmento ya está grabado y no hay que volver a
// reproducir nada ni buscar el archivo original.
//
// Escribe el hilo de audio y lee el de mensajes. La lectura no bloquea al
// hilo de audio: como mucho, un puñado de muestras del extremo más reciente
// pueden quedar a medio escribir, algo inaudible en un fragmento de decenas
// de segundos y preferible a meter un lock en processBlock.
class CaptureBuffer
{
public:
    void prepare (double sampleRateToUse, int numChannels, double seconds)
    {
        sampleRate = sampleRateToUse;
        const auto capacity = juce::jmax (1, (int) std::ceil (sampleRateToUse * seconds));

        buffer.setSize (juce::jmax (1, numChannels), capacity, false, true, true);
        buffer.clear();
        writePos.store (0, std::memory_order_release);
        totalWritten.store (0, std::memory_order_release);
    }

    // Llamar solo desde el hilo de audio.
    void push (const juce::AudioBuffer<float>& source) noexcept
    {
        const auto capacity = buffer.getNumSamples();
        const auto numSamples = source.getNumSamples();

        if (capacity <= 0 || numSamples <= 0)
            return;

        const auto channels = juce::jmin (buffer.getNumChannels(), source.getNumChannels());
        auto pos = writePos.load (std::memory_order_relaxed);

        // Un bloque mayor que el buffer entero solo puede dejar su cola.
        const auto startInSource = juce::jmax (0, numSamples - capacity);
        const auto toCopy = numSamples - startInSource;

        for (int offset = 0; offset < toCopy;)
        {
            const auto chunk = juce::jmin (toCopy - offset, capacity - pos);

            for (int ch = 0; ch < channels; ++ch)
                buffer.copyFrom (ch, pos, source, ch, startInSource + offset, chunk);

            offset += chunk;
            pos = (pos + chunk) % capacity;
        }

        writePos.store (pos, std::memory_order_release);
        totalWritten.fetch_add ((juce::int64) toCopy, std::memory_order_release);
    }

    // Vuelca el contenido en orden cronológico: la muestra más antigua
    // primero y la más reciente al final. Para el hilo de mensajes.
    bool snapshot (juce::AudioBuffer<float>& destination) const
    {
        const auto capacity = buffer.getNumSamples();
        const auto written = totalWritten.load (std::memory_order_acquire);

        if (capacity <= 0 || written <= 0)
            return false;

        // Aún no ha dado la vuelta: solo hay audio hasta writePos.
        const auto available = (int) juce::jmin ((juce::int64) capacity, written);
        const auto pos = writePos.load (std::memory_order_acquire);
        const auto channels = buffer.getNumChannels();

        destination.setSize (channels, available, false, false, true);

        const auto readStart = (pos - available + capacity) % capacity;
        const auto firstChunk = juce::jmin (available, capacity - readStart);

        for (int ch = 0; ch < channels; ++ch)
        {
            destination.copyFrom (ch, 0, buffer, ch, readStart, firstChunk);

            if (const auto rest = available - firstChunk; rest > 0)
                destination.copyFrom (ch, firstChunk, buffer, ch, 0, rest);
        }

        return true;
    }

    double getSampleRate() const noexcept { return sampleRate; }

    // Segundos de audio disponibles ahora mismo (hasta llenar el buffer).
    double getAvailableSeconds() const noexcept
    {
        if (sampleRate <= 0.0)
            return 0.0;

        const auto written = totalWritten.load (std::memory_order_acquire);
        const auto available = juce::jmin ((juce::int64) buffer.getNumSamples(), written);
        return (double) available / sampleRate;
    }

private:
    juce::AudioBuffer<float> buffer;
    std::atomic<int> writePos { 0 };
    std::atomic<juce::int64> totalWritten { 0 };
    double sampleRate = 0.0;
};
