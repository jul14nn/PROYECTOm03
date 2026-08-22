#pragma once

#include <juce_gui_basics/juce_gui_basics.h>

namespace diablo
{

// Paleta "póster infernal": negro tinta, rojos diablo y amarillo serigrafía.
namespace palette
{
    const juce::Colour ink       { 0xff0d0507 };
    const juce::Colour blood     { 0xffc41e18 };
    const juce::Colour bloodDeep { 0xff6e0f0c };
    const juce::Colour flame     { 0xffe8422a };
    const juce::Colour sun       { 0xfff2c421 };
    const juce::Colour bone      { 0xfff3e9d4 };
}

/**
 * Look & feel del póster: knobs negros con arco rojo y aguja amarilla,
 * tipografía gorda y textos con desfase de "misprint".
 */
class DiabloLookAndFeel : public juce::LookAndFeel_V4
{
public:
    DiabloLookAndFeel()
    {
        setColour (juce::Slider::textBoxTextColourId, palette::bone);
        setColour (juce::Slider::textBoxOutlineColourId, juce::Colours::transparentBlack);
        setColour (juce::Slider::textBoxBackgroundColourId, juce::Colours::transparentBlack);
        setColour (juce::Slider::textBoxHighlightColourId, palette::blood.withAlpha (0.5f));
        setColour (juce::Label::textColourId, palette::bone);
        setColour (juce::ComboBox::backgroundColourId, palette::ink.brighter (0.06f));
        setColour (juce::ComboBox::textColourId, palette::sun);
        setColour (juce::ComboBox::outlineColourId, palette::bloodDeep);
        setColour (juce::ComboBox::arrowColourId, palette::flame);
        setColour (juce::PopupMenu::backgroundColourId, palette::ink.brighter (0.04f));
        setColour (juce::PopupMenu::textColourId, palette::bone);
        setColour (juce::PopupMenu::highlightedBackgroundColourId, palette::bloodDeep);
        setColour (juce::PopupMenu::highlightedTextColourId, palette::sun);
        setColour (juce::TextEditor::focusedOutlineColourId, palette::flame);
    }

    juce::Font getLabelFont (juce::Label&) override
    {
        return juce::Font (juce::FontOptions (13.0f, juce::Font::bold));
    }

    void drawRotarySlider (juce::Graphics& g, int x, int y, int width, int height,
                           float sliderPos, float rotaryStartAngle, float rotaryEndAngle,
                           juce::Slider&) override
    {
        auto bounds = juce::Rectangle<float> ((float) x, (float) y, (float) width, (float) height)
                          .reduced (6.0f);
        const float size = juce::jmin (bounds.getWidth(), bounds.getHeight());
        bounds = bounds.withSizeKeepingCentre (size, size);
        const auto centre = bounds.getCentre();
        const float radius = size * 0.5f;
        const float angle = rotaryStartAngle + sliderPos * (rotaryEndAngle - rotaryStartAngle);

        // Sombra "misprint": el mismo disco desplazado en rojo.
        g.setColour (palette::bloodDeep.withAlpha (0.85f));
        g.fillEllipse (bounds.translated (2.5f, 2.0f));

        // Cuerpo del knob.
        g.setColour (juce::Colour (0xff1a0e10));
        g.fillEllipse (bounds);
        g.setColour (palette::blood);
        g.drawEllipse (bounds.reduced (1.0f), 2.0f);

        // Trama de medios tonos en el borde inferior del disco.
        g.setColour (palette::blood.withAlpha (0.35f));
        for (int ring = 0; ring < 3; ++ring)
        {
            const float rr = radius * (0.62f + 0.1f * (float) ring);
            for (int dot = 0; dot < 10; ++dot)
            {
                const float a = juce::MathConstants<float>::pi * (0.25f + 0.5f * (float) dot / 9.0f)
                                + juce::MathConstants<float>::halfPi;
                const float dotSize = 2.6f - 0.6f * (float) ring;
                g.fillEllipse (centre.x + rr * std::cos (a) - dotSize * 0.5f,
                               centre.y + rr * std::sin (a) - dotSize * 0.5f,
                               dotSize, dotSize);
            }
        }

        // Arco de recorrido y arco de valor.
        juce::Path track;
        track.addCentredArc (centre.x, centre.y, radius + 4.5f, radius + 4.5f,
                             0.0f, rotaryStartAngle, rotaryEndAngle, true);
        g.setColour (palette::bloodDeep);
        g.strokePath (track, juce::PathStrokeType (3.0f, juce::PathStrokeType::curved,
                                                   juce::PathStrokeType::rounded));

        juce::Path value;
        value.addCentredArc (centre.x, centre.y, radius + 4.5f, radius + 4.5f,
                             0.0f, rotaryStartAngle, angle, true);
        g.setColour (palette::flame);
        g.strokePath (value, juce::PathStrokeType (3.0f, juce::PathStrokeType::curved,
                                                   juce::PathStrokeType::rounded));

        // Aguja amarilla, como una llama.
        juce::Path needle;
        needle.addRoundedRectangle (-2.0f, -radius + 3.0f, 4.0f, radius * 0.55f, 2.0f);
        g.setColour (palette::sun);
        g.fillPath (needle, juce::AffineTransform::rotation (angle).translated (centre));

        g.setColour (palette::sun.withAlpha (0.9f));
        g.fillEllipse (centre.x - 3.0f, centre.y - 3.0f, 6.0f, 6.0f);
    }

    void drawToggleButton (juce::Graphics& g, juce::ToggleButton& button,
                           bool highlighted, bool) override
    {
        auto bounds = button.getLocalBounds().toFloat().reduced (2.0f);
        const bool on = button.getToggleState();

        // Sello desplazado (misprint) detrás del botón.
        g.setColour ((on ? palette::sun : palette::bloodDeep).withAlpha (0.55f));
        g.fillRoundedRectangle (bounds.translated (3.0f, 3.0f), 10.0f);

        g.setColour (on ? palette::blood : juce::Colour (0xff1a0e10));
        g.fillRoundedRectangle (bounds, 10.0f);
        g.setColour (on ? palette::sun : palette::bloodDeep);
        g.drawRoundedRectangle (bounds, 10.0f, 2.0f);

        if (highlighted)
        {
            g.setColour (juce::Colours::white.withAlpha (0.06f));
            g.fillRoundedRectangle (bounds, 10.0f);
        }

        g.setFont (juce::Font (juce::FontOptions (17.0f, juce::Font::bold)));
        const auto text = button.getButtonText();
        // Texto con doble impresión.
        g.setColour ((on ? palette::ink : palette::blood).withAlpha (0.8f));
        g.drawText (text, bounds.translated (1.5f, 1.0f), juce::Justification::centred);
        g.setColour (on ? palette::sun : palette::bone.withAlpha (0.8f));
        g.drawText (text, bounds, juce::Justification::centred);
    }

    /** Título con desfase de tintas: pasada roja, pasada amarilla, pasada hueso. */
    static void drawMisprintText (juce::Graphics& g, const juce::String& text,
                                  juce::Rectangle<int> area, float fontSize,
                                  juce::Justification just = juce::Justification::centredLeft)
    {
        g.setFont (juce::Font (juce::FontOptions (fontSize, juce::Font::bold)));
        g.setColour (palette::blood.withAlpha (0.9f));
        g.drawText (text, area.translated (-3, 2), just);
        g.setColour (palette::sun.withAlpha (0.85f));
        g.drawText (text, area.translated (3, -2), just);
        g.setColour (palette::bone);
        g.drawText (text, area, just);
    }
};

} // namespace diablo
