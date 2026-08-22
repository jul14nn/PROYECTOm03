cmake_minimum_required(VERSION 3.22)

project(DiabloVerb VERSION 1.0.0 LANGUAGES C CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# JUCE se descarga solo la primera vez. Para usar una copia local:
#   cmake -B build -DFETCHCONTENT_SOURCE_DIR_JUCE=/ruta/a/JUCE
include(FetchContent)
FetchContent_Declare(
    JUCE
    GIT_REPOSITORY https://github.com/juce-framework/JUCE.git
    GIT_TAG        8.0.4
    GIT_SHALLOW    TRUE
)
FetchContent_MakeAvailable(JUCE)

juce_add_plugin(DiabloVerb
    COMPANY_NAME "KR Estudio"
    PRODUCT_NAME "Diablo Verb"
    PLUGIN_MANUFACTURER_CODE Kres
    PLUGIN_CODE Dvrb
    FORMATS VST3 Standalone
    VST3_CATEGORIES Fx Reverb
    IS_SYNTH FALSE
    NEEDS_MIDI_INPUT FALSE
    NEEDS_MIDI_OUTPUT FALSE
    IS_MIDI_EFFECT FALSE
    COPY_PLUGIN_AFTER_BUILD FALSE
)

target_sources(DiabloVerb PRIVATE
    src/PluginProcessor.cpp
    src/PluginEditor.cpp
)

target_compile_definitions(DiabloVerb PUBLIC
    JUCE_WEB_BROWSER=0
    JUCE_USE_CURL=0
    JUCE_VST3_CAN_REPLACE_VST2=0
    JUCE_DISPLAY_SPLASH_SCREEN=0
)

target_link_libraries(DiabloVerb
    PRIVATE
        juce::juce_audio_utils
        juce::juce_dsp
    PUBLIC
        juce::juce_recommended_config_flags
        juce::juce_recommended_lto_flags
        juce::juce_recommended_warning_flags
)

# Herramienta de documentación: guarda PNGs de la GUI real sin abrir un DAW.
#   cmake -B build -DDIABLOVERB_BUILD_SHOTS=ON
#   xvfb-run -a ./build/DiabloVerbShots_artefacts/DiabloVerbShots frames 24
option(DIABLOVERB_BUILD_SHOTS "Compila la herramienta de capturas de la GUI" OFF)

if(DIABLOVERB_BUILD_SHOTS)
    juce_add_console_app(DiabloVerbShots PRODUCT_NAME "DiabloVerbShots")

    target_sources(DiabloVerbShots PRIVATE
        tools/RenderShots.cpp
        src/PluginProcessor.cpp
        src/PluginEditor.cpp
    )

    target_compile_definitions(DiabloVerbShots PRIVATE
        JUCE_WEB_BROWSER=0
        JUCE_USE_CURL=0
        JUCE_DISPLAY_SPLASH_SCREEN=0
        JUCE_MODAL_LOOPS_PERMITTED=1
        JucePlugin_Name="Diablo Verb"
        JucePlugin_IsSynth=0
        JucePlugin_IsMidiEffect=0
        JucePlugin_WantsMidiInput=0
        JucePlugin_ProducesMidiOutput=0
        JucePlugin_VersionString="1.0.0"
        JucePlugin_ManufacturerCode=0x4b726573
        JucePlugin_PluginCode=0x44767262
    )

    target_link_libraries(DiabloVerbShots PRIVATE
        juce::juce_audio_utils
        juce::juce_dsp
        juce::juce_recommended_config_flags
        juce::juce_recommended_warning_flags
    )
endif()
