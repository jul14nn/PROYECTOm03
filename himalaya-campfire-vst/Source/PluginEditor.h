#pragma once

#include "PluginProcessor.h"
#include <juce_gui_extra/juce_gui_extra.h>

//==============================================================================
// El editor incrusta la interfaz web (WebUI/) que dibuja la fogata. La
// dirección de "dev server" solo se usa si se cambia goToURL en el .cpp para
// depurar con `npm run dev`-style live reload; en producción se sirve todo
// desde BinaryData vía withResourceProvider.
struct SinglePageBrowser : juce::WebBrowserComponent
{
    using WebBrowserComponent::WebBrowserComponent;

    bool pageAboutToLoad (const juce::String& newURL) override;
};

class HimalayaCampfireAudioProcessorEditor : public juce::AudioProcessorEditor
{
public:
    explicit HimalayaCampfireAudioProcessorEditor (HimalayaCampfireAudioProcessor&);

    std::optional<juce::WebBrowserComponent::Resource> getResource (const juce::String& url);

    void paint (juce::Graphics&) override;
    void resized() override;

private:
    HimalayaCampfireAudioProcessor& processorRef;

    juce::WebSliderRelay intensitySliderRelay { "intensity" };

    SinglePageBrowser webComponent {
        juce::WebBrowserComponent::Options {}
            .withBackend (juce::WebBrowserComponent::Options::Backend::webview2)
            .withWinWebView2Options (
                juce::WebBrowserComponent::Options::WinWebView2 {}
                    .withUserDataFolder (juce::File::getSpecialLocation (juce::File::SpecialLocationType::tempDirectory)))
            .withNativeIntegrationEnabled()
            .withOptionsFrom (intensitySliderRelay)
            .withResourceProvider ([this] (const auto& url) { return getResource (url); })
    };

    juce::WebSliderParameterAttachment intensityAttachment;

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR (HimalayaCampfireAudioProcessorEditor)
};
