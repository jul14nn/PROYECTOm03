#pragma once

#include <algorithm>
#include <cmath>

namespace diablo
{

/**
 * Ducking automático: sigue la envolvente de la voz seca y atenúa la cola
 * del reverb mientras se canta, dejándola florecer en los huecos. Es el
 * truco clásico para que la voz quede grande y a la vez inteligible.
 */
class Ducker
{
public:
    void prepare (double sampleRate)
    {
        attackCoeff  = std::exp (-1.0f / (0.005f * (float) sampleRate));
        releaseCoeff = std::exp (-1.0f / (0.220f * (float) sampleRate));
        envelope = 0.0f;
    }

    void setAmountDb (float db) { amountDb = std::clamp (db, 0.0f, 24.0f); }

    /** Devuelve la ganancia (0..1) a aplicar a la señal wet en esta muestra. */
    float processGain (float dryAbs)
    {
        const float coeff = dryAbs > envelope ? attackCoeff : releaseCoeff;
        envelope = coeff * envelope + (1.0f - coeff) * dryAbs;

        const float envDb = 20.0f * std::log10 (std::max (envelope, 1.0e-6f));
        // Por debajo de -45 dBFS no hay ducking; a partir de -5 dBFS es total.
        const float amount = std::clamp ((envDb + 45.0f) / 40.0f, 0.0f, 1.0f);
        return std::pow (10.0f, -(amountDb * amount) / 20.0f);
    }

private:
    float attackCoeff = 0.0f, releaseCoeff = 0.0f;
    float envelope = 0.0f;
    float amountDb = 6.0f;
};

} // namespace diablo
