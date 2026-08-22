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
    configureKnob (deessKnob, deessLabel, "ANTI-ESES", ParamID::deess);

    syncBox.addItemList ({ "Libre", "1/64", "1/32", "1/16", "1/8" }, 1);
    addAndMakeVisible (syncBox);
    syncAttachment = std::make_unique<ComboAttachment> (processor.apvts, ParamID::sync, syncBox);

    syncLabel.setText ("SYNC", juce::dontSendNotification);
    syncLabel.setJustificationType (juce::Justification::centred);
    syncLabel.setColour (juce::Label::textColourId, palette::sun);
    addAndMakeVisible (syncLabel);

    addAndMakeVisible (pactoButton);
    pactoAttachment = std::make_unique<ButtonAttachment> (processor.apvts, ParamID::pacto, pactoButton);

    for (int i = 0; i < processor.getNumPrograms(); ++i)
        presetBox.addItem (processor.getProgramName (i), i + 1);
    presetBox.setTextWhenNothingSelected ("Presets");
    presetBox.onChange = [this]
    {
        const int index = presetBox.getSelectedId() - 1;
        if (index >= 0)
            processor.setCurrentProgram (index);
    };
    addAndMakeVisible (presetBox);

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

    // Los literales con acentos y puntos medios van como UTF-8 explícito: si se
    // dejan como const char*, algunos compiladores los interpretan como Latin-1
    // y en la GUI aparecen mojibake del tipo "Â·".
    bpmLabel.setText (pacto
                          ? juce::String (bpm)
                                + juce::String (juce::CharPointer_UTF8 (" BPM · pre-delay 1/64 · decay al tempo"))
                          : juce::String (bpm) + " BPM",
                      juce::dontSendNotification);

    // Con el pacto sellado, el diablo lleva estos mandos.
    for (auto* c : std::initializer_list<juce::Component*> {
             &decayKnob, &decayLabel, &predelayKnob, &predelayLabel,
             &darkKnob, &darkLabel, &lowcutKnob, &lowcutLabel,
             &duckKnob, &duckLabel, &deessKnob, &deessLabel,
             &syncBox, &syncLabel })
    {
        c->setEnabled (! pacto);
        c->setAlpha (pacto ? 0.35f : 1.0f);
    }
}

void DiabloVerbEditor::resized()
{
    pactoButton.setBounds (getWidth() - 208, 26, 180, 46);
    presetBox.setBounds (getWidth() - 208, 82, 180, 26);
    bpmLabel.setBounds (getWidth() - 368, 112, 340, 20);

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

    // Segunda fila: cuatro knobs pequeños + selector de sync.
    const int smallSize = 92;
    const int smallTop = 356;
    const int cell = getWidth() / 5;
    juce::Slider* smallKnobs[] = { &lowcutKnob, &duckKnob, &deessKnob, &widthKnob };
    juce::Label* smallLabels[] = { &lowcutLabel, &duckLabel, &deessLabel, &widthLabel };
    for (int i = 0; i < 4; ++i)
    {
        const int x = cell * i + (cell - smallSize) / 2;
        smallLabels[i]->setBounds (x - 6, smallTop, smallSize + 12, 18);
        smallKnobs[i]->setBounds (x, smallTop + 20, smallSize, smallSize + 20);
    }
    syncLabel.setBounds (cell * 4 + (cell - 110) / 2, smallTop, 110, 18);
    syncBox.setBounds (cell * 4 + (cell - 110) / 2, smallTop + 52, 110, 30);
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

    // Llamas recortadas en la base. Se quedan bajas para no comerse el pie.
    juce::Path flames;
    flames.startNewSubPath (0.0f, bounds.getBottom());
    const int humps = 16;
    for (int i = 0; i <= humps; ++i)
    {
        const float x = bounds.getWidth() * (float) i / (float) humps;
        const float h = 8.0f + rng.nextFloat() * 20.0f;
        flames.quadraticTo (x - bounds.getWidth() / (float) humps * 0.5f,
                            bounds.getBottom() - h, x, bounds.getBottom() - 4.0f);
    }
    flames.lineTo (bounds.getBottomRight());
    flames.closeSubPath();
    g.setColour (palette::bloodDeep.withAlpha (0.75f));
    g.fillPath (flames);
    g.setColour (palette::flame.withAlpha (0.25f));
    g.fillPath (flames, juce::AffineTransform::translation (4.0f, 4.0f));

    // El diablo del póster, asomado en la cabecera entre el título y el botón.
    const float dx = 490.0f, dy = 66.0f, ds = 0.88f;

    // Orejas puntiagudas, detrás de la cara.
    juce::Path ears;
    ears.startNewSubPath (dx - 44.0f, dy + 20.0f);
    ears.lineTo (dx - 84.0f, dy + 4.0f);
    ears.lineTo (dx - 46.0f, dy + 46.0f);
    ears.closeSubPath();
    ears.startNewSubPath (dx + 36.0f, dy + 20.0f);
    ears.lineTo (dx + 76.0f, dy + 4.0f);
    ears.lineTo (dx + 38.0f, dy + 46.0f);
    ears.closeSubPath();

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

    const auto devilTransform = juce::AffineTransform::scale (ds, ds, dx, dy);
    g.setColour (palette::bloodDeep.withAlpha (0.9f));
    g.fillPath (ears, devilTransform.translated (5.0f, 4.0f));
    g.fillPath (devil, devilTransform.translated (5.0f, 4.0f)); // tinta desfasada
    g.setColour (palette::bloodDeep);
    g.fillPath (ears, devilTransform);
    g.setColour (palette::blood);
    g.fillPath (devil, devilTransform);

    // Ojos amarillos entornados, con el mismo desfase de tinta que la cara.
    auto eye = [&g, &devilTransform] (float ex, float ey, bool mirrored)
    {
        const float tilt = mirrored ? -1.0f : 1.0f;
        juce::Path p;
        p.startNewSubPath (ex - 16.0f, ey + 4.0f * tilt);
        p.quadraticTo (ex, ey - 11.0f, ex + 16.0f, ey - 4.0f * tilt);
        p.quadraticTo (ex + 2.0f, ey + 9.0f, ex - 16.0f, ey + 4.0f * tilt);
        p.closeSubPath();
        g.setColour (palette::ink.withAlpha (0.65f));
        g.fillPath (p, devilTransform.translated (2.5f, 2.0f));
        g.setColour (palette::sun);
        g.fillPath (p, devilTransform);

        juce::Path pupil;
        pupil.addEllipse (ex - 3.0f, ey - 3.5f, 6.0f, 7.0f);
        g.setColour (palette::ink);
        g.fillPath (pupil, devilTransform);
    };
    eye (dx - 26.0f, dy + 40.0f, false);
    eye (dx + 20.0f, dy + 40.0f, true);

    // Sonrisa con dientes de sierra, como en el póster.
    juce::Path grin;
    grin.startNewSubPath (dx - 26.0f, dy + 74.0f);
    grin.quadraticTo (dx - 4.0f, dy + 94.0f, dx + 22.0f, dy + 70.0f);
    grin.lineTo (dx + 22.0f, dy + 76.0f);
    for (int tooth = 5; tooth >= 0; --tooth)
    {
        const float u = (float) tooth / 6.0f;
        const float tx = dx - 26.0f + 48.0f * u;
        const float ty = dy + 78.0f + 12.0f * std::sin (u * juce::MathConstants<float>::pi);
        grin.lineTo (tx + 4.0f, ty - 7.0f);
        grin.lineTo (tx, ty);
    }
    grin.closeSubPath();
    g.setColour (palette::ink.withAlpha (0.8f));
    g.fillPath (grin, devilTransform.translated (2.0f, 2.0f));
    g.setColour (palette::bone.withAlpha (0.92f));
    g.fillPath (grin, devilTransform);

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
    g.drawText (juce::CharPointer_UTF8 ("EL REVERB DE LA VOZ · PERFECTO · SIEMPRE"),
                34, 88, 500, 20, juce::Justification::centredLeft);

    g.setFont (juce::Font (juce::FontOptions (11.0f, juce::Font::bold)));
    g.setColour (palette::bone.withAlpha (0.55f));
    g.drawText (juce::CharPointer_UTF8 ("KR ESTUDIO · PLATE DATTORRO · DUCKING AUTOMÁTICO · SELLA EL PACTO Y CANTA"),
                0, getHeight() - 26, getWidth(), 16, juce::Justification::centred);
}

} // namespace diablo
