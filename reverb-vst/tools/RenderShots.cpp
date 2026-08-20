/*
    Herramienta de documentación: instancia el plugin sin DAW, mueve los mandos
    y guarda una secuencia de PNG con la GUI real. Sirve para las capturas del
    README y para ver la animación de los knobs sin abrir FL Studio.

    Uso:  DiabloVerbShots <carpeta-de-salida> [numero-de-frames]
*/

#include <juce_gui_basics/juce_gui_basics.h>

#include "../src/PluginProcessor.h"
#include "../src/PluginEditor.h"

namespace
{
    void setParam (diablo::DiabloVerbProcessor& processor, const char* id, float value)
    {
        if (auto* param = processor.apvts.getParameter (id))
            param->setValueNotifyingHost (param->convertTo0to1 (value));
    }
}

int main (int argc, char** argv)
{
    if (argc < 2)
    {
        std::fprintf (stderr, "uso: DiabloVerbShots <carpeta-de-salida> [frames]\n");
        return 1;
    }

    const juce::ScopedJuceInitialiser_GUI juceInit;

    const juce::File outDir (juce::File::getCurrentWorkingDirectory()
                                 .getChildFile (juce::String (argv[1])));
    outDir.createDirectory();

    const int numFrames = argc > 2 ? juce::jlimit (1, 240, std::atoi (argv[2])) : 24;

    diablo::DiabloVerbProcessor processor;
    processor.prepareToPlay (48000.0, 512);

    std::unique_ptr<juce::AudioProcessorEditor> editor (processor.createEditor());
    editor->setBounds (0, 0, editor->getWidth(), editor->getHeight());

    for (int frame = 0; frame < numFrames; ++frame)
    {
        const float t = (float) frame / (float) numFrames;          // 0..1 cíclico
        const float wave = std::sin (t * juce::MathConstants<float>::twoPi);
        const bool pacto = t < 0.5f;

        setParam (processor, diablo::ParamID::pacto, pacto ? 1.0f : 0.0f);
        setParam (processor, diablo::ParamID::mix, 28.0f + 20.0f * wave);
        setParam (processor, diablo::ParamID::width, 90.0f + 30.0f * wave);

        if (! pacto)
        {
            const float u = (t - 0.5f) * 2.0f;                       // 0..1 en la 2ª mitad
            setParam (processor, diablo::ParamID::decay, 0.8f + 4.0f * u);
            setParam (processor, diablo::ParamID::predelay, 10.0f + 120.0f * u);
            setParam (processor, diablo::ParamID::dark, 15.0f + 70.0f * u);
            setParam (processor, diablo::ParamID::lowcut, 60.0f + 220.0f * u);
            setParam (processor, diablo::ParamID::duck, 12.0f * u);
            setParam (processor, diablo::ParamID::deess, 100.0f * u);
        }

        // Deja correr el hilo de mensajes para que los attachments y el timer
        // del editor (etiqueta de BPM, atenuado de mandos) se pongan al día.
        juce::MessageManager::getInstance()->runDispatchLoopUntil (150);

        const auto image = editor->createComponentSnapshot (editor->getLocalBounds(), false);
        const auto file = outDir.getChildFile (juce::String::formatted ("frame_%03d.png", frame));
        file.deleteFile();

        juce::FileOutputStream stream (file);
        if (! stream.openedOk())
        {
            std::fprintf (stderr, "no se pudo escribir %s\n", file.getFullPathName().toRawUTF8());
            return 1;
        }

        juce::PNGImageFormat png;
        png.writeImageToStream (image, stream);
        std::printf ("%s\n", file.getFullPathName().toRawUTF8());
    }

    editor.reset();
    return 0;
}
