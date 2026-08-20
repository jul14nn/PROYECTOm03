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
