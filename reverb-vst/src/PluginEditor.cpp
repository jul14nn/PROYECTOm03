#include "PluginEditor.h"

namespace diablo
{

namespace
{
    constexpr int editorWidth  = 780;
    constexpr int editorHeight = 520;
}

DiabloVerbEditor::DiabloVerbEditor (DiabloVerbProcessor& p)
    : AudioProcessorEditor (p), processor (p)
{
    setLookAndFeel (&lookAndFeel);

    configureKnob (mixKnob, mixLabel, "MEZCLA", ParamID::mix);
    configureKnob (decayKnob, decayLabel, "DECAY", ParamID::decay);
    configureKnob (predelayKnob, predelayLabel, "PRE-DELAY", ParamID::predelay);
    configureKnob (darkKnob, darkLabel, "OSCURIDAD", ParamID::dark);
    configureKnob (lowcutKnob, lowcutLabel, "GRAVES FUERA", ParamID::lowcut);
    configureKnob (duckKnob, duckLabel, "DUCKING", ParamID::duck);
    configureKnob (widthKnob, widthLabel, "ANCHO", ParamID::width);

    syncBox.addItemList ({ "Libre", "1/64", "1/32", "1/16", "1/8" }, 1);
    addAndMakeVisible (syncBox);
    syncAttachment = std::make_unique<ComboAttachment> (processor.apvts, ParamID::sync, syncBox);

    syncLabel.setText ("SYNC", juce::dontSendNotification);
    syncLabel.setJustificationType (juce::Justification::centred);
    syncLabel.setColour (juce::Label::textColourId, palette::sun);
    addAndMakeVisible (syncLabel);

    addAndMakeVisible (pactoButton);
    pactoAttachment = std::make_unique<ButtonAttachment> (processor.apvts, ParamID::pacto, pactoButton);

    bpmLabel.setJustificationType (juce::Justification::centredRight);
    bpmLabel.setColour (juce::Label::textColourId, palette::bone.withAlpha (0.75f));
    addAndMakeVisible (bpmLabel);

    setSize (editorWidth, editorHeight);
    startTimerHz (8);
}

DiabloVerbEditor::~DiabloVerbEditor()
{
    setLookAndFeel (nullptr);
}

void DiabloVerbEditor::configureKnob (juce::Slider& knob, juce::Label& label,
                                      const juce::String& name, const char* paramID)
{
    knob.setSliderStyle (juce::Slider::RotaryHorizontalVerticalDrag);
    knob.setTextBoxStyle (juce::Slider::TextBoxBelow, false, 78, 18);
    addAndMakeVisible (knob);
    sliderAttachments.push_back (
        std::make_unique<SliderAttachment> (processor.apvts, paramID, knob));

    label.setText (name, juce::dontSendNotification);
    label.setJustificationType (juce::Justification::centred);
    label.setColour (juce::Label::textColourId, palette::sun);
    addAndMakeVisible (label);
}

void DiabloVerbEditor::timerCallback()
{
    const bool pacto = processor.apvts.getRawParameterValue (ParamID::pacto)->load() > 0.5f;
    const int bpm = (int) std::lround (processor.getCurrentBpm());

    bpmLabel.setText (pacto
                          ? juce::String (bpm) + " BPM · pre-delay 1/64 · decay al tempo"
                          : juce::String (bpm) + " BPM",
                      juce::dontSendNotification);

    // Con el pacto sellado, el diablo lleva estos mandos.
    for (auto* c : std::initializer_list<juce::Component*> {
             &decayKnob, &decayLabel, &predelayKnob, &predelayLabel,
             &darkKnob, &darkLabel, &lowcutKnob, &lowcutLabel,
             &duckKnob, &duckLabel, &syncBox, &syncLabel })
    {
        c->setEnabled (! pacto);
        c->setAlpha (pacto ? 0.35f : 1.0f);
    }
}

void DiabloVerbEditor::resized()
{
    pactoButton.setBounds (getWidth() - 208, 26, 180, 46);
    bpmLabel.setBounds (getWidth() - 328, 76, 300, 20);

    // Fila principal: cuatro knobs grandes.
    const int bigSize = 128;
    const int bigTop = 168;
    const int bigGap = (getWidth() - 4 * bigSize) / 5;
    juce::Slider* bigKnobs[] = { &mixKnob, &decayKnob, &predelayKnob, &darkKnob };
    juce::Label* bigLabels[] = { &mixLabel, &decayLabel, &predelayLabel, &darkLabel };
    for (int i = 0; i < 4; ++i)
    {
        const int x = bigGap + i * (bigSize + bigGap);
        bigLabels[i]->setBounds (x, bigTop, bigSize, 18);
        bigKnobs[i]->setBounds (x, bigTop + 20, bigSize, bigSize + 20);
    }

    // Segunda fila: tres knobs pequeños + selector de sync.
    const int smallSize = 96;
    const int smallTop = 356;
    const int cell = getWidth() / 4;
    juce::Slider* smallKnobs[] = { &lowcutKnob, &duckKnob, &widthKnob };
    juce::Label* smallLabels[] = { &lowcutLabel, &duckLabel, &widthLabel };
    for (int i = 0; i < 3; ++i)
    {
        const int x = cell * i + (cell - smallSize) / 2;
        smallLabels[i]->setBounds (x, smallTop, smallSize, 18);
        smallKnobs[i]->setBounds (x, smallTop + 20, smallSize, smallSize + 20);
    }
    syncLabel.setBounds (cell * 3 + (cell - 110) / 2, smallTop, 110, 18);
    syncBox.setBounds (cell * 3 + (cell - 110) / 2, smallTop + 52, 110, 30);
}

void DiabloVerbEditor::buildBackground()
{
    background = juce::Image (juce::Image::ARGB, getWidth(), getHeight(), true);
    juce::Graphics g (background);
    auto bounds = getLocalBounds().toFloat();
    juce::Random rng (666);

    // Tinta negra con resplandor rojo desde abajo, como cabina en llamas.
    g.fillAll (palette::ink);
    juce::ColourGradient glow (palette::bloodDeep.withAlpha (0.55f),
                               bounds.getCentreX(), bounds.getBottom() + 120.0f,
                               palette::ink.withAlpha (0.0f),
                               bounds.getCentreX(), bounds.getCentreY() - 60.0f, true);
    g.setGradientFill (glow);
    g.fillAll();

    // Trama de medios tonos: puntos que crecen hacia abajo (efecto serigrafía).
    for (int yy = 8; yy < getHeight(); yy += 14)
    {
        const float rowNorm = (float) yy / (float) getHeight();
        for (int xx = 8 + (yy / 14 % 2) * 7; xx < getWidth(); xx += 14)
        {
            const float dotSize = 0.6f + 2.6f * rowNorm * rowNorm;
            g.setColour (palette::blood.withAlpha (0.05f + 0.13f * rowNorm));
            g.fillEllipse ((float) xx, (float) yy, dotSize, dotSize);
        }
    }

    // Llamas recortadas en la base.
    juce::Path flames;
    flames.startNewSubPath (0.0f, bounds.getBottom());
    const int humps = 14;
    for (int i = 0; i <= humps; ++i)
    {
        const float x = bounds.getWidth() * (float) i / (float) humps;
        const float h = 18.0f + rng.nextFloat() * 46.0f;
        flames.quadraticTo (x - bounds.getWidth() / (float) humps * 0.5f,
                            bounds.getBottom() - h, x, bounds.getBottom() - 6.0f);
    }
    flames.lineTo (bounds.getBottomRight());
    flames.closeSubPath();
    g.setColour (palette::bloodDeep.withAlpha (0.7f));
    g.fillPath (flames);
    g.setColour (palette::flame.withAlpha (0.22f));
    g.fillPath (flames, juce::AffineTransform::translation (4.0f, 6.0f));

    // El diablo del póster, asomado tras los mandos (silueta, cuernos y ojos).
    const float dx = 596.0f, dy = 96.0f, ds = 1.05f;
    juce::Path devil;
    devil.startNewSubPath (dx - 52.0f, dy + 66.0f);
    devil.cubicTo (dx - 66.0f, dy + 14.0f, dx - 50.0f, dy - 16.0f, dx - 34.0f, dy - 4.0f);   // sien izq.
    devil.cubicTo (dx - 46.0f, dy - 42.0f, dx - 28.0f, dy - 66.0f, dx - 20.0f, dy - 72.0f);  // cuerno izq.
    devil.cubicTo (dx - 24.0f, dy - 46.0f, dx - 16.0f, dy - 26.0f, dx - 8.0f, dy - 20.0f);
    devil.cubicTo (dx + 8.0f, dy - 26.0f, dx + 16.0f, dy - 46.0f, dx + 12.0f, dy - 72.0f);   // cuerno der.
    devil.cubicTo (dx + 20.0f, dy - 66.0f, dx + 38.0f, dy - 42.0f, dx + 26.0f, dy - 4.0f);
    devil.cubicTo (dx + 42.0f, dy - 16.0f, dx + 58.0f, dy + 14.0f, dx + 44.0f, dy + 66.0f);  // sien der.
    devil.cubicTo (dx + 34.0f, dy + 96.0f, dx + 12.0f, dy + 112.0f, dx - 4.0f, dy + 112.0f); // barbilla
    devil.cubicTo (dx - 20.0f, dy + 112.0f, dx - 42.0f, dy + 96.0f, dx - 52.0f, dy + 66.0f);
    devil.closeSubPath();

    const auto devilTransform =
        juce::AffineTransform::scale (ds, ds, dx, dy);
    g.setColour (palette::bloodDeep.withAlpha (0.9f));
    g.fillPath (devil, devilTransform.translated (5.0f, 4.0f)); // tinta desfasada
    g.setColour (palette::blood);
    g.fillPath (devil, devilTransform);

    // Ojos amarillos entornados y sonrisa.
    auto eye = [&g] (float ex, float ey, bool flip)
    {
        juce::Path p;
        p.startNewSubPath (ex - 14.0f, ey + 3.0f);
        p.quadraticTo (ex, ey - (flip ? 9.0f : 7.0f), ex + 14.0f, ey - 2.0f);
        p.quadraticTo (ex + 4.0f, ey + 8.0f, ex - 14.0f, ey + 3.0f);
        p.closeSubPath();
        g.setColour (palette::sun);
        g.fillPath (p);
        g.setColour (palette::ink);
        g.fillEllipse (ex - 2.0f, ey - 1.0f, 5.0f, 5.0f);
    };
    eye (dx - 24.0f, dy + 38.0f, false);
    eye (dx + 18.0f, dy + 38.0f, true);

    juce::Path grin;
    grin.startNewSubPath (dx - 22.0f, dy + 78.0f);
    grin.quadraticTo (dx - 3.0f, dy + 92.0f, dx + 18.0f, dy + 76.0f);
    g.setColour (palette::ink.withAlpha (0.85f));
    g.strokePath (grin, juce::PathStrokeType (3.5f, juce::PathStrokeType::curved,
                                              juce::PathStrokeType::rounded));

    // Marco de póster con doble tinta.
    g.setColour (palette::bloodDeep);
    g.drawRect (bounds.reduced (7.0f).translated (2.5f, 2.0f), 2.0f);
    g.setColour (palette::sun.withAlpha (0.9f));
    g.drawRect (bounds.reduced (9.0f), 2.0f);
}

void DiabloVerbEditor::paint (juce::Graphics& g)
{
    if (! background.isValid())
        buildBackground();
    g.drawImageAt (background, 0, 0);

    DiabloLookAndFeel::drawMisprintText (g, "DIABLO VERB",
                                         { 30, 22, 520, 62 }, 58.0f);

    g.setFont (juce::Font (juce::FontOptions (14.0f, juce::Font::bold)));
    g.setColour (palette::sun);
    g.drawText ("EL REVERB DE LA VOZ · PERFECTO · SIEMPRE",
                34, 88, 500, 20, juce::Justification::centredLeft);

    g.setFont (juce::Font (juce::FontOptions (11.0f, juce::Font::bold)));
    g.setColour (palette::bone.withAlpha (0.45f));
    g.drawText ("KR ESTUDIO · PLATE DATTORRO · DUCKING AUTOMÁTICO · SELLA EL PACTO Y CANTA",
                0, getHeight() - 30, getWidth(), 16, juce::Justification::centred);
}

} // namespace diablo
