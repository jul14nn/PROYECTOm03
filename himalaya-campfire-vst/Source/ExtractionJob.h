#pragma once

#include <atomic>
#include <functional>
#include <memory>
#include <juce_audio_formats/juce_audio_formats.h>
#include <juce_core/juce_core.h>
#include <juce_events/juce_events.h>

//==============================================================================
// Ejecuta una extracción en segundo plano: escribe el fragmento capturado a
// un WAV temporal, lanza el extractor (`extractor.plugin_service`) y va
// traduciendo sus líneas JSON en callbacks.
//
// El trabajo pesado (separación de fuentes y transcripción) son modelos de
// aprendizaje automático que viven en Python; van en un proceso aparte para
// que el DAW no se quede bloqueado y para no cargar cientos de megas de
// runtime dentro del plugin.
class ExtractionJob : private juce::Thread
{
public:
    struct Settings
    {
        juce::File pythonExecutable;
        juce::File extractorDirectory;   // carpeta que contiene el paquete `extractor`
        juce::File outputDirectory;
        juce::String instrument { "piano" };
        bool separate = false;
        double offsetSeconds = 0.0;      // instante dentro del fragmento
        juce::String label { "captura" };
    };

    // Todos los callbacks llegan por el hilo de mensajes.
    std::function<void (const juce::String& stage, const juce::String& message)> onProgress;
    std::function<void (const juce::var& result)> onFinished;
    std::function<void (const juce::String& message)> onError;

    ExtractionJob() : juce::Thread ("Angel Whisper extraction") {}

    ~ExtractionJob() override
    {
        // Los mensajes ya encolados no deben tocar este objeto al despertar.
        alive->store (false);
        cancel();
    }

    bool isBusy() const { return isThreadRunning(); }

    // Toma el fragmento por valor para poder quedárselo sin copiarlo otra vez:
    // son decenas de MB y esto corre en el hilo de mensajes.
    bool start (juce::AudioBuffer<float> audio, double sampleRateToUse, Settings jobSettings)
    {
        if (isThreadRunning())
            return false;

        captured = std::move (audio);
        sampleRate = sampleRateToUse;
        settings = std::move (jobSettings);
        sawResult = false;
        lastNoise.clear();

        startThread (juce::Thread::Priority::normal);
        return true;
    }

    void cancel()
    {
        signalThreadShouldExit();

        {
            const juce::ScopedLock lock (processLock);

            if (process != nullptr)
                process->kill();
        }

        stopThread (4000);
    }

private:
    void run() override
    {
        const auto captureFile = writeCaptureToDisk();

        if (captureFile == juce::File())
        {
            report ([] (auto& self) {
                if (self.onError)
                    self.onError ("No se pudo guardar el fragmento capturado en disco.");
            });
            return;
        }

        if (! threadShouldExit())
            runExtractor (captureFile);

        captureFile.deleteFile();
    }

    juce::File writeCaptureToDisk()
    {
        if (captured.getNumSamples() <= 0 || sampleRate <= 0.0)
            return {};

        const auto file = juce::File::getSpecialLocation (juce::File::tempDirectory)
                              .getChildFile ("angel-whisper-captura-"
                                             + juce::String (juce::Time::currentTimeMillis()) + ".wav");

        std::unique_ptr<juce::OutputStream> stream (file.createOutputStream());

        if (stream == nullptr)
            return {};

        juce::WavAudioFormat format;
        const auto options = juce::AudioFormatWriterOptions{}
                                 .withSampleRate (sampleRate)
                                 .withNumChannels (captured.getNumChannels())
                                 .withBitsPerSample (24);

        // Si tiene éxito, createWriterFor se queda con el stream.
        auto writer = format.createWriterFor (stream, options);

        if (writer == nullptr)
            return {};

        if (! writer->writeFromAudioSampleBuffer (captured, 0, captured.getNumSamples()))
        {
            writer.reset();
            file.deleteFile();
            return {};
        }

        writer.reset();  // cierra y vuelca la cabecera antes de que lo lea Python
        return file;
    }

    juce::StringArray buildCommand (const juce::File& captureFile) const
    {
        // Se arranca con un bootstrap en vez de `-m extractor` porque `-m`
        // exige que el paquete esté en el path, y la alternativa (cambiar el
        // directorio de trabajo) afectaría al proceso entero del DAW, no solo
        // a este plugin.
        const auto bootstrap = "import sys; sys.path.insert(0, r'''"
                             + settings.extractorDirectory.getFullPathName()
                             + "'''); from extractor.plugin_service import plugin_extract; plugin_extract()";

        juce::StringArray args;
        args.add (settings.pythonExecutable.getFullPathName());
        args.add ("-c");
        args.add (bootstrap);
        args.add (captureFile.getFullPathName());
        args.add ("--offset");
        args.add (juce::String (settings.offsetSeconds, 4));
        args.add ("--instrument");
        args.add (settings.instrument);
        args.add (settings.separate ? "--separate" : "--no-separate");
        args.add ("--label");
        args.add (settings.label);
        args.add ("--out-dir");
        args.add (settings.outputDirectory.getFullPathName());
        return args;
    }

    void runExtractor (const juce::File& captureFile)
    {
        auto child = std::make_unique<juce::ChildProcess>();

        if (! child->start (buildCommand (captureFile),
                            juce::ChildProcess::wantStdOut | juce::ChildProcess::wantStdErr))
        {
            report ([] (auto& self) {
                if (self.onError)
                    self.onError ("No se pudo lanzar el extractor. Revisa en los ajustes la ruta de "
                                  "Python y la de la carpeta midi-audio-extractor.");
            });
            return;
        }

        {
            const juce::ScopedLock lock (processLock);
            process = std::move (child);
        }

        // El puntero solo lo reinicia este mismo hilo, más abajo, así que se
        // puede leer fuera del lock; mantenerlo tomado durante todo el bucle
        // dejaría a cancel() esperando para siempre.
        readEvents (getProcess());

        juce::uint32 exitCode = 0;

        {
            const juce::ScopedLock lock (processLock);

            if (process != nullptr)
            {
                process->waitForProcessToFinish (10000);
                exitCode = process->getExitCode();
                process.reset();
            }
        }

        if (! sawResult && ! threadShouldExit())
        {
            const auto detail = lastNoise.isNotEmpty()
                                    ? lastNoise
                                    : "código de salida " + juce::String ((int) exitCode);

            report ([detail] (auto& self) {
                if (self.onError)
                    self.onError ("El extractor terminó sin devolver resultado (" + detail + ").");
            });
        }
    }

    juce::ChildProcess* getProcess() const
    {
        const juce::ScopedLock lock (processLock);
        return process.get();
    }

    // Lee la salida del proceso y va emitiendo cada línea JSON completa.
    void readEvents (juce::ChildProcess* child)
    {
        if (child == nullptr)
            return;

        juce::String pending;
        char chunk[4096];

        while (! threadShouldExit())
        {
            const auto bytesRead = child->readProcessOutput (chunk, (int) sizeof (chunk));

            if (bytesRead <= 0)
            {
                if (! child->isRunning())
                    break;

                juce::Thread::sleep (20);
                continue;
            }

            pending += juce::String::fromUTF8 (chunk, bytesRead);

            for (;;)
            {
                const auto newline = pending.indexOfChar ('\n');

                if (newline < 0)
                    break;

                handleLine (pending.substring (0, newline).trim());
                pending = pending.substring (newline + 1);
            }
        }

        handleLine (pending.trim());
    }

    void handleLine (const juce::String& line)
    {
        if (line.isEmpty())
            return;

        // El extractor reserva stdout para el protocolo, pero por stderr llega
        // el ruido de las librerías: se guarda solo para poder explicar un
        // fallo, nunca se interpreta.
        if (! line.startsWithChar ('{'))
        {
            lastNoise = line;
            return;
        }

        const auto parsed = juce::JSON::parse (line);

        if (! parsed.isObject())
            return;

        const auto event = parsed.getProperty ("event", {}).toString();

        if (event == "progress")
        {
            const auto stage = parsed.getProperty ("stage", {}).toString();
            const auto message = parsed.getProperty ("message", {}).toString();

            report ([stage, message] (auto& self) {
                if (self.onProgress)
                    self.onProgress (stage, message);
            });
        }
        else if (event == "result")
        {
            sawResult = true;
            report ([parsed] (auto& self) { if (self.onFinished) self.onFinished (parsed); });
        }
        else if (event == "error")
        {
            sawResult = true;
            const auto message = parsed.getProperty ("message", {}).toString();
            report ([message] (auto& self) { if (self.onError) self.onError (message); });
        }
    }

    // Los callbacks tocan la interfaz, así que salen por el hilo de mensajes.
    // La bandera compartida evita que un mensaje ya encolado despierte sobre
    // un trabajo que entretanto se ha destruido.
    template <typename Fn>
    void report (Fn&& fn)
    {
        juce::MessageManager::callAsync (
            [flag = alive, self = this, callback = std::forward<Fn> (fn)]
            {
                if (flag->load())
                    callback (*self);
            });
    }

    std::shared_ptr<std::atomic<bool>> alive { std::make_shared<std::atomic<bool>> (true) };

    juce::AudioBuffer<float> captured;
    double sampleRate = 0.0;
    Settings settings;

    juce::CriticalSection processLock;
    std::unique_ptr<juce::ChildProcess> process;

    juce::String lastNoise;
    bool sawResult = false;

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR (ExtractionJob)
};
