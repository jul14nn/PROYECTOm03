#pragma once

#include "ExtractionJob.h"
#include "ExtractorSettings.h"
#include "PluginProcessor.h"

#include <juce_gui_extra/juce_gui_extra.h>

//==============================================================================
// El editor incrusta la interfaz web (WebUI/) y hace de puente entre ella y el
// extractor: la web pide capturar, el editor saca el fragmento del
// CaptureBuffer, lanza el ExtractionJob y le devuelve progreso y resultados
// por eventos.
struct SinglePageBrowser : juce::WebBrowserComponent
{
    using WebBrowserComponent::WebBrowserComponent;

    bool pageAboutToLoad (const juce::String& newURL) override;
};

class HimalayaCampfireAudioProcessorEditor : public juce::AudioProcessorEditor,
                                             private juce::Timer
{
public:
    explicit HimalayaCampfireAudioProcessorEditor (HimalayaCampfireAudioProcessor&);
    ~HimalayaCampfireAudioProcessorEditor() override;

    std::optional<juce::WebBrowserComponent::Resource> getResource (const juce::String& url);

    void paint (juce::Graphics&) override;
    void resized() override;

private:
    // Empuja el nivel de audio a la interfaz web. Solo emite si el navegador
    // está visible, así un editor cerrado no cuesta nada.
    void timerCallback() override;

    //==============================================================================
    // Funciones que la interfaz web puede invocar (ver withNativeFunction).
    juce::var buildStatus() const;
    void handleGetStatus (const juce::Array<juce::var>& args, juce::WebBrowserComponent::NativeFunctionCompletion complete);
    void handleSetSetting (const juce::Array<juce::var>& args, juce::WebBrowserComponent::NativeFunctionCompletion complete);
    void handleExtract (const juce::Array<juce::var>& args, juce::WebBrowserComponent::NativeFunctionCompletion complete);
    void handleReveal (const juce::Array<juce::var>& args, juce::WebBrowserComponent::NativeFunctionCompletion complete);

    // Etiqueta con el minuto de la canción ("1-04"), para nombrar los archivos.
    juce::String makeLabel() const;

    HimalayaCampfireAudioProcessor& processorRef;

    ExtractorSettings settings;
    ExtractionJob extraction;

    float lastSentLevel = -1.0f;

    juce::WebSliderRelay intensitySliderRelay { "intensity" };

    SinglePageBrowser webComponent {
        juce::WebBrowserComponent::Options {}
            .withBackend (juce::WebBrowserComponent::Options::Backend::webview2)
            .withWinWebView2Options (
                juce::WebBrowserComponent::Options::WinWebView2 {}
                    .withUserDataFolder (juce::File::getSpecialLocation (juce::File::SpecialLocationType::tempDirectory)))
            .withNativeIntegrationEnabled()
            .withOptionsFrom (intensitySliderRelay)
            .withNativeFunction ("getStatus",
                                 [this] (auto& args, auto complete) { handleGetStatus (args, std::move (complete)); })
            .withNativeFunction ("setSetting",
                                 [this] (auto& args, auto complete) { handleSetSetting (args, std::move (complete)); })
            .withNativeFunction ("extract",
                                 [this] (auto& args, auto complete) { handleExtract (args, std::move (complete)); })
            .withNativeFunction ("reveal",
                                 [this] (auto& args, auto complete) { handleReveal (args, std::move (complete)); })
            .withResourceProvider ([this] (const auto& url) { return getResource (url); })
    };

    juce::WebSliderParameterAttachment intensityAttachment;

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR (HimalayaCampfireAudioProcessorEditor)
};
