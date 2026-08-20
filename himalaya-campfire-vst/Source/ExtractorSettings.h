#pragma once

#include <juce_core/juce_core.h>
#include <juce_data_structures/juce_data_structures.h>

//==============================================================================
// Rutas del extractor (intérprete de Python, carpeta del paquete y carpeta de
// salida). Se guardan a nivel de máquina, no dentro del proyecto: apuntan a
// dónde está instalado el extractor en este ordenador, así que no tendría
// sentido que viajaran con el archivo del DAW.
class ExtractorSettings
{
public:
    ExtractorSettings()
    {
        juce::PropertiesFile::Options options;
        options.applicationName = "AngelWhisper";
        options.filenameSuffix = ".settings";
        options.folderName = "AngelWhisper";
        options.osxLibrarySubFolder = "Application Support";

        properties = std::make_unique<juce::PropertiesFile> (options);
    }

    juce::File getPython() const
    {
        const auto stored = properties->getValue ("python");
        return stored.isNotEmpty() ? juce::File (stored) : findPython();
    }

    juce::File getExtractorDirectory() const
    {
        return juce::File (properties->getValue ("extractor"));
    }

    juce::File getOutputDirectory() const
    {
        const auto stored = properties->getValue ("output");

        if (stored.isNotEmpty())
            return juce::File (stored);

        return juce::File::getSpecialLocation (juce::File::userMusicDirectory)
                   .getChildFile ("Angel Whisper");
    }

    void set (const juce::String& key, const juce::String& value)
    {
        properties->setValue (key, value);
        properties->saveIfNeeded();
    }

    // ¿Están las rutas completas y apuntando a algo que existe?
    bool isReady() const
    {
        return getPython().existsAsFile()
            && getExtractorDirectory().getChildFile ("extractor").isDirectory();
    }

    // Explica qué falta, para poder decírselo al usuario en la interfaz en
    // lugar de fallar en silencio al pulsar extraer.
    juce::String describeProblem() const
    {
        if (! getPython().existsAsFile())
            return "No encuentro el intérprete de Python. Indícalo en Ajustes.";

        if (! getExtractorDirectory().getChildFile ("extractor").isDirectory())
            return "La carpeta indicada no contiene el paquete 'extractor'. "
                   "Debe ser la carpeta midi-audio-extractor del repositorio.";

        return {};
    }

private:
    // Busca un Python razonable para no obligar a configurarlo si ya hay uno
    // instalado en las rutas habituales.
    static juce::File findPython()
    {
        juce::StringArray candidates;

       #if JUCE_WINDOWS
        candidates.add ("python.exe");
        candidates.add ("python3.exe");
       #else
        candidates.add ("/opt/homebrew/bin/python3");
        candidates.add ("/usr/local/bin/python3");
        candidates.add ("/usr/bin/python3");
       #endif

        for (const auto& candidate : candidates)
        {
            const juce::File asPath (candidate);

            if (asPath.existsAsFile())
                return asPath;
        }

       #if JUCE_WINDOWS
        // En Windows lo normal es que esté en el PATH y no en una ruta fija.
        return juce::File::getSpecialLocation (juce::File::invokedExecutableFile)
                   .getSiblingFile ("python.exe").existsAsFile()
                   ? juce::File::getSpecialLocation (juce::File::invokedExecutableFile).getSiblingFile ("python.exe")
                   : juce::File();
       #else
        return {};
       #endif
    }

    std::unique_ptr<juce::PropertiesFile> properties;

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR (ExtractorSettings)
};
