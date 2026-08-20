#pragma once

#include <juce_dsp/juce_dsp.h>
#include <algorithm>
#include <cmath>

namespace diablo
{

/**
 * De-esser del envío: divide la señal en dos bandas con Linkwitz-Riley
 * (suma plana) y comprime solo la banda de las eses (~4.8 kHz arriba)
 * antes de entrar al plate. La voz seca no se toca: solo evita que la
 * cola del reverb escupa "chsss" con cada sibilante.
 */
class DeEsser
{
public:
    void prepare (double sampleRate)
    {
        juce::dsp::ProcessSpec spec { sampleRate, 512, 1 };
        low.prepare (spec);
        low.setType (juce::dsp::LinkwitzRileyFilterType::lowpass);
        low.setCutoffFrequency (crossoverHz);
        high.prepare (spec);
        high.setType (juce::dsp::LinkwitzRileyFilterType::highpass);
        high.setCutoffFrequency (crossoverHz);

        attackCoeff  = std::exp (-1.0f / (0.0008f * (float) sampleRate));
        releaseCoeff = std::exp (-1.0f / (0.080f * (float) sampleRate));
        envelope = 0.0f;
    }

    void reset()
    {
        low.reset();
        high.reset();
        envelope = 0.0f;
    }

    /** 0 = apagado, 1 = a saco. */
    void setAmount (float amount01) { amount = std::clamp (amount01, 0.0f, 1.0f); }

    float process (float x)
    {
        const float lo = low.processSample (0, x);
        const float hi = high.processSample (0, x);

        const float rectified = std::abs (hi);
        const float coeff = rectified > envelope ? attackCoeff : releaseCoeff;
        envelope = coeff * envelope + (1.0f - coeff) * rectified;

        const float envDb = 20.0f * std::log10 (std::max (envelope, 1.0e-6f));
        const float overDb = std::max (0.0f, envDb - thresholdDb);
        const float reductionDb = std::min (overDb * 0.85f, 18.0f) * amount;

        return lo + hi * std::pow (10.0f, -reductionDb / 20.0f);
    }

private:
    static constexpr float crossoverHz = 4800.0f;
    static constexpr float thresholdDb = -30.0f;

    juce::dsp::LinkwitzRileyFilter<float> low, high;
    float attackCoeff = 0.0f, releaseCoeff = 0.0f;
    float envelope = 0.0f;
    float amount = 0.6f;
};

} // namespace diablo
