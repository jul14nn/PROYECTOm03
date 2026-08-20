#pragma once

#include <algorithm>
#include <cmath>
#include <vector>

namespace diablo
{

/**
 * Línea de retardo circular. Convención: read(d) devuelve la muestra escrita
 * hace d muestras (leer ANTES de escribir la muestra actual => z^-d exacto).
 */
class DelayLine
{
public:
    void prepare (int maxDelaySamples)
    {
        int n = 1;
        while (n < maxDelaySamples + 8)
            n <<= 1;
        buffer.assign ((size_t) n, 0.0f);
        mask = n - 1;
        writeIndex = 0;
    }

    void clear() { std::fill (buffer.begin(), buffer.end(), 0.0f); }

    void write (float v)
    {
        buffer[(size_t) (writeIndex & mask)] = v;
        ++writeIndex;
    }

    float read (int delay) const
    {
        return buffer[(size_t) ((writeIndex - delay) & mask)];
    }

    float readFrac (float delay) const
    {
        const int   d0 = (int) delay;
        const float frac = delay - (float) d0;
        const float a = read (d0);
        const float b = read (d0 + 1);
        return a + frac * (b - a);
    }

private:
    std::vector<float> buffer;
    int mask = 0;
    int writeIndex = 0;
};

/** Allpass de celosía (Schroeder), con lectura modulada opcional y taps. */
class Allpass
{
public:
    void prepare (int maxDelaySamples, float gainToUse)
    {
        line.prepare (maxDelaySamples + 64);
        length = maxDelaySamples;
        gain = gainToUse;
    }

    void clear() { line.clear(); }

    float process (float x)
    {
        const float d = line.read (length);
        const float w = x + gain * d;
        line.write (w);
        return d - gain * w;
    }

    float processModulated (float x, float delaySamples)
    {
        const float d = line.readFrac (delaySamples);
        const float w = x + gain * d;
        line.write (w);
        return d - gain * w;
    }

    /** Lee el buffer interno (para los taps de salida del plate). */
    float tap (int delay) const { return line.read (delay); }

private:
    DelayLine line;
    int length = 1;
    float gain = 0.5f;
};

/**
 * Reverb de placa según Dattorro (1997), el algoritmo clásico para voz:
 * difusores de entrada + tanque en ocho con allpasses modulados, damping
 * y taps de salida repartidos. Mono in, estéreo out.
 */
class PlateReverb
{
public:
    void prepare (double sampleRate)
    {
        sr = sampleRate;
        scale = (float) (sampleRate / referenceRate);

        auto s = [this] (float d) { return std::max (1, (int) std::lround (d * scale)); };

        inDiffusion1.prepare (s (142.0f), 0.75f);
        inDiffusion2.prepare (s (107.0f), 0.75f);
        inDiffusion3.prepare (s (379.0f), 0.625f);
        inDiffusion4.prepare (s (277.0f), 0.625f);

        excursion = 12.0f * scale;

        modApA.prepare (s (672.0f) + (int) excursion + 8, 0.70f);
        modApB.prepare (s (908.0f) + (int) excursion + 8, 0.70f);
        delayA1.prepare (s (4453.0f));
        delayB1.prepare (s (4217.0f));
        apA.prepare (s (1800.0f), 0.50f);
        apB.prepare (s (2656.0f), 0.50f);
        delayA2.prepare (s (3720.0f));
        delayB2.prepare (s (3163.0f));

        lenModA = (float) s (672.0f);
        lenModB = (float) s (908.0f);
        lenDelayA1 = s (4453.0f);
        lenDelayB1 = s (4217.0f);
        lenDelayA2 = s (3720.0f);
        lenDelayB2 = s (3163.0f);

        // Taps de salida (tabla del artículo de Dattorro).
        tapL[0] = s (266.0f);  tapL[1] = s (2974.0f); tapL[2] = s (1913.0f);
        tapL[3] = s (1996.0f); tapL[4] = s (1990.0f); tapL[5] = s (187.0f);
        tapL[6] = s (1066.0f);
        tapR[0] = s (353.0f);  tapR[1] = s (3627.0f); tapR[2] = s (1228.0f);
        tapR[3] = s (2673.0f); tapR[4] = s (2111.0f); tapR[5] = s (335.0f);
        tapR[6] = s (121.0f);

        lfoInc = (float) (2.0 * 3.14159265358979 * 0.9 / sampleRate);
        reset();
    }

    void reset()
    {
        inDiffusion1.clear(); inDiffusion2.clear();
        inDiffusion3.clear(); inDiffusion4.clear();
        modApA.clear(); modApB.clear();
        delayA1.clear(); delayB1.clear();
        apA.clear(); apB.clear();
        delayA2.clear(); delayB2.clear();
        lpIn = lpA = lpB = 0.0f;
        fbA = fbB = 0.0f;
        lfoPhase = 0.0f;
    }

    /** Tiempo de caída aproximado (RT60) en segundos. */
    void setDecaySeconds (float seconds)
    {
        seconds = std::max (0.1f, seconds);
        // El bucle del tanque tarda ~0.36 s por vuelta (independiente del SR)
        // y el multiplicador de decay se aplica dos veces por rama.
        const float loopTime = 0.36f;
        decay = std::pow (10.0f, -3.0f * loopTime / (2.0f * seconds));
        decay = std::clamp (decay, 0.0f, 0.985f);
    }

    /** 0 = brillante, 1 = muy oscuro. */
    void setDamping (float d01) { damping = std::clamp (d01, 0.0f, 0.98f); }

    void process (float in, float& outL, float& outR)
    {
        // Paso de banda de entrada muy suave (bandwidth 0.9995 del artículo).
        lpIn += 0.9995f * (in - lpIn);

        float x = inDiffusion1.process (lpIn);
        x = inDiffusion2.process (x);
        x = inDiffusion3.process (x);
        x = inDiffusion4.process (x);

        lfoPhase += lfoInc;
        if (lfoPhase > 6.28318531f)
            lfoPhase -= 6.28318531f;
        const float modA = lenModA + excursion * 0.5f * (1.0f + std::sin (lfoPhase));
        const float modB = lenModB + excursion * 0.5f * (1.0f + std::sin (lfoPhase + 2.1f));

        // Rama A del tanque (realimentada desde la rama B, y viceversa).
        float a = modApA.processModulated (x + fbB * decay, modA);
        const float dA1 = delayA1.read (lenDelayA1);
        delayA1.write (a);
        lpA += (1.0f - damping) * (dA1 - lpA);
        a = apA.process (lpA * decay);
        const float dA2 = delayA2.read (lenDelayA2);
        delayA2.write (a);
        fbA = dA2;

        // Rama B.
        float b = modApB.processModulated (x + fbA * decay, modB);
        const float dB1 = delayB1.read (lenDelayB1);
        delayB1.write (b);
        lpB += (1.0f - damping) * (dB1 - lpB);
        b = apB.process (lpB * decay);
        const float dB2 = delayB2.read (lenDelayB2);
        delayB2.write (b);
        fbB = dB2;

        outL = 0.6f * (  delayB1.read (tapL[0]) + delayB1.read (tapL[1])
                       - apB.tap (tapL[2])      + delayB2.read (tapL[3])
                       - delayA1.read (tapL[4]) - apA.tap (tapL[5])
                       - delayA2.read (tapL[6]));

        outR = 0.6f * (  delayA1.read (tapR[0]) + delayA1.read (tapR[1])
                       - apA.tap (tapR[2])      + delayA2.read (tapR[3])
                       - delayB1.read (tapR[4]) - apB.tap (tapR[5])
                       - delayB2.read (tapR[6]));
    }

private:
    static constexpr double referenceRate = 29761.0;

    double sr = 48000.0;
    float scale = 1.0f;
    float decay = 0.7f;
    float damping = 0.3f;
    float excursion = 12.0f;

    Allpass inDiffusion1, inDiffusion2, inDiffusion3, inDiffusion4;
    Allpass modApA, modApB, apA, apB;
    DelayLine delayA1, delayA2, delayB1, delayB2;

    float lenModA = 672.0f, lenModB = 908.0f;
    int lenDelayA1 = 4453, lenDelayB1 = 4217, lenDelayA2 = 3720, lenDelayB2 = 3163;
    int tapL[7] {}, tapR[7] {};

    float lpIn = 0.0f, lpA = 0.0f, lpB = 0.0f;
    float fbA = 0.0f, fbB = 0.0f;
    float lfoPhase = 0.0f, lfoInc = 0.0f;
};

} // namespace diablo
