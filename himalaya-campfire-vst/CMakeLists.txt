cmake_minimum_required(VERSION 3.22)

project(HimalayaCampfirePlugin VERSION 1.0.0)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

include(FetchContent)
FetchContent_Declare(
    JUCE
    GIT_REPOSITORY https://github.com/juce-framework/JUCE.git
    GIT_TAG 9.0.1
    GIT_SHALLOW TRUE
)
FetchContent_MakeAvailable(JUCE)

juce_add_plugin(HimalayaCampfire
    COMPANY_NAME "Himalaya Campfire"
    PLUGIN_MANUFACTURER_CODE Hcfp
    PLUGIN_CODE Fire
    FORMATS VST3 Standalone
    PRODUCT_NAME "Himalaya Campfire"
    IS_SYNTH FALSE
    NEEDS_MIDI_INPUT FALSE
    NEEDS_MIDI_OUTPUT FALSE
    IS_MIDI_EFFECT FALSE
    EDITOR_WANTS_KEYBOARD_FOCUS TRUE
    NEEDS_WEB_BROWSER TRUE
    NEEDS_WEBVIEW2 TRUE
    NEEDS_CURL FALSE)

juce_add_binary_data(HimalayaCampfireWebUI
    SOURCES
        WebUI/index.html
        WebUI/style.css
        WebUI/noise.js
        WebUI/scene.js
        WebUI/fire.js
        WebUI/knob.js
        WebUI/app.js
        WebUI/vendor/rough.js
        WebUI/vendor/juce-webview-interop.js)

target_sources(HimalayaCampfire
    PRIVATE
        Source/PluginProcessor.cpp
        Source/PluginEditor.cpp)

target_compile_definitions(HimalayaCampfire
    PUBLIC
        JUCE_WEB_BROWSER=1
        JUCE_USE_CURL=0
        JUCE_VST3_CAN_REPLACE_VST2=0)

if(WIN32)
    # El backend WebView2 en Windows se enlaza estáticamente para no depender
    # de que WebView2Loader.dll viaje suelto junto al VST3. Requiere que el
    # paquete NuGet Microsoft.Web.WebView2 esté disponible en build-time
    # (ver JUCE_WEBVIEW2_PACKAGE_LOCATION en el workflow de CI).
    target_compile_definitions(HimalayaCampfire
        PUBLIC
            JUCE_USE_WIN_WEBVIEW2=1
            JUCE_USE_WIN_WEBVIEW2_WITH_STATIC_LINKING=1)
endif()

target_link_libraries(HimalayaCampfire
    PRIVATE
        HimalayaCampfireWebUI
        juce::juce_audio_utils
        juce::juce_gui_extra
    PUBLIC
        juce::juce_recommended_config_flags
        juce::juce_recommended_lto_flags
        juce::juce_recommended_warning_flags)
