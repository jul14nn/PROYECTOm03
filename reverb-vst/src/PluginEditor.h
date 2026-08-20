#pragma once

#include "PluginProcessor.h"
#include "DiabloLookAndFeel.h"

namespace diablo
{

class DiabloVerbEditor : public juce::AudioProcessorEditor,
                         private juce::Timer
{
public:
    explicit DiabloVerbEditor (DiabloVerbProcessor&);
    ~DiabloVerbEditor() override;

    void paint (juce::Graphics&) override;
    void resized() override;

private:
    void timerCallback() override;
    void buildBackground();
    void configureKnob (juce::Slider&, juce::Label&, const juce::String& name,
                        const char* paramID);

    DiabloVerbProcessor& processor;
    DiabloLookAndFeel lookAndFeel;

    juce::Slider mixKnob, decayKnob, predelayKnob, darkKnob, lowcutKnob, duckKnob, widthKnob;
    juce::Label mixLabel, decayLabel, predelayLabel, darkLabel, lowcutLabel, duckLabel, widthLabel;
    juce::ComboBox syncBox;
    juce::Label syncLabel;
    juce::ToggleButton pactoButton { "MODO PACTO" };
    juce::Label bpmLabel;

    using SliderAttachment = juce::AudioProcessorValueTreeState::SliderAttachment;
    using ComboAttachment  = juce::AudioProcessorValueTreeState::ComboBoxAttachment;
    using ButtonAttachment = juce::AudioProcessorValueTreeState::ButtonAttachment;

    std::vector<std::unique_ptr<SliderAttachment>> sliderAttachments;
    std::unique_ptr<ComboAttachment> syncAttachment;
    std::unique_ptr<ButtonAttachment> pactoAttachment;

    juce::Image background;

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR (DiabloVerbEditor)
};

} // namespace diablo
