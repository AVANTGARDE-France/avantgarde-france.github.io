/* =========================================================
   AVANT-GARDE — PAGE MANIFESTE
   js/manifeste.js

   Lecteur vocal Kokoro :
   - 100 % local dans le navigateur
   - aucun MP3 permanent
   - aucune API payante
   - WebGPU si disponible, WASM sinon
   - génération par morceaux pour commencer la lecture rapidement
========================================================= */

const SLUG = "manifeste";
const KOKORO_MODEL = "onnx-community/Kokoro-82M-v1.0-ONNX";
const KOKORO_VOICE = "ff_siwis";
const KOKORO_CDN = "https://cdn.jsdelivr.net/npm/kokoro-js@1.2.1/+esm";
const TRANSFORMERS_CDN = "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.5.1/+esm";
const KOKORO_VOICE_URL = "https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX/resolve/main/voices/ff_siwis.bin";
const KOKORO_STYLE_DIM = 256;
const KOKORO_SAMPLE_RATE = 24000;

const titleElement =
    document.getElementById("editorialTitle");

const contentElement =
    document.getElementById("editorialContent");

let kokoro = null;
let audioContext = null;
let activeSource = null;

let currentGeneration = 0;
let chunks = [];
let chunkIndex = 0;

let playing = false;
let paused = false;
let loading = false;
let initialisationFaite = false;

let espeakPromise = null;

function contenuPreRenduDisponible() {
    if (!contentElement) return false;

    const source = contentElement.dataset.contentSource;
    const texte = (contentElement.textContent || "").trim();

    return source === "supabase" && texte.length > 0;
}

async function phonemiserFrancais(texte) {
    if (!espeakPromise) {
        espeakPromise = import("https://cdn.jsdelivr.net/npm/espeak-ng@1.0.2/+esm")
            .then(function (module) {
                return module.default || module;
            });
    }

    const ESpeakNg = await espeakPromise;

    const moteur = await ESpeakNg({
        arguments: [
            "--phonout",
            "generated",
            '--sep=""',
            "-q",
            "-b=1",
            "--ipa=3",
            "-v",
            "fr-fr",
            JSON.stringify(texte)
        ]
    });

    const phonemes = moteur.FS.readFile(
        "generated",
        { encoding: "utf8" }
    );

    return String(phonemes || "").trim();
}

async function chargerManifeste() {

    if (!contentElement) return;

    if (contenuPreRenduDisponible()) {
        initialiserLecteurManifeste();
        return;
    }

    try {

        const { supabase } = await import("./supabase.js");

        const { data, error } =
            await supabase
                .from("other_contents")
                .select("id, slug, titre, contenu_html, updated_at")
                .eq("slug", SLUG)
                .order("id", { ascending: true })
                .limit(1);

        if (error) throw error;

        const contenu =
            Array.isArray(data) && data.length
                ? data[0]
                : null;

        if (!contenu) {
            afficherErreur("Le manifeste n'est pas encore disponible.");
            return;
        }

        if (titleElement && contenu.titre) {
            titleElement.textContent = contenu.titre;
        }

        contentElement.innerHTML =
            contenu.contenu_html || "";

        initialiserLecteurManifeste();

        if (!contenu.contenu_html?.trim()) {
            afficherErreur("Le manifeste n'est pas encore disponible.");
        }

    } catch (error) {

        console.error("AVANT-GARDE — MANIFESTE :", error);
        afficherErreur("Impossible de charger le manifeste.");

    }
}

function afficherErreur(message) {

    if (!contentElement) return;

    contentElement.innerHTML = "";

    const element =
        document.createElement("p");

    element.className = "editorial-error";
    element.textContent = message;

    contentElement.appendChild(element);
}

function initialiserLecteurManifeste() {

    if (initialisationFaite) return;

    const reader =
        document.getElementById("manifesteReader");

    const playButton =
        document.getElementById("manifesteReaderPlay");

    const stopButton =
        document.getElementById("manifesteReaderStop");

    if (!reader || !playButton || !stopButton || !contentElement) {
        return;
    }

    playButton.addEventListener(
        "click",
        basculerLecture
    );

    stopButton.addEventListener(
        "click",
        arreterLecture
    );

    initialisationFaite = true;

    mettreAJourInterface();
    setStatus("Prêt");
    console.log("AVANT-GARDE — lecteur initialisé");
}

function extraireTexte() {

    const clone =
        contentElement.cloneNode(true);

    clone.querySelectorAll(
        "script, style, button, .manifeste-reader"
    ).forEach(function (element) {
        element.remove();
    });

    return (clone.textContent || "")
        .replace(/\s+/g, " ")
        .trim();
}

function construireMorceaux(texte) {

    if (!texte) return [];

    const phrases =
        texte
            .split(/(?<=[.!?…])\s+/)
            .map(function (phrase) {
                return phrase.trim();
            })
            .filter(Boolean);

    const resultat = [];
    let courant = "";

    phrases.forEach(function (phrase) {

        /*
           Kokoro fonctionne mieux avec des segments modestes.
           On évite les très longs blocs qui peuvent provoquer
           des erreurs de génération ou des délais excessifs.
        */
        if (
            courant &&
            courant.length + phrase.length + 1 > 420
        ) {
            resultat.push(courant);
            courant = "";
        }

        /*
           Une phrase exceptionnellement longue est découpée
           proprement plutôt que de dépasser la limite.
        */
        if (phrase.length > 420) {

            const mots =
                phrase.split(/\s+/);

            mots.forEach(function (mot) {

                if (
                    courant &&
                    courant.length + mot.length + 1 > 420
                ) {
                    resultat.push(courant);
                    courant = "";
                }

                courant =
                    courant
                        ? courant + " " + mot
                        : mot;
            });

            return;
        }

        courant =
            courant
                ? courant + " " + phrase
                : phrase;
    });

    if (courant) {
        resultat.push(courant);
    }

    return resultat;
}

async function chargerKokoro() {

    if (kokoro) return kokoro;

    if (loading) {
        while (loading && !kokoro) {
            await new Promise(function (resolve) {
                window.setTimeout(resolve, 100);
            });
        }
        if (kokoro) return kokoro;
    }

    loading = true;
    setStatus("Chargement du moteur…");

    try {

        /*
           On laisse kokoro-js charger le modèle et le tokenizer,
           car cette partie fonctionne déjà correctement dans le navigateur.

           Le problème de ff_siwis vient uniquement de sa whitelist de voix :
           generate() refuse la voix française avant l'inférence.

           Nous conservons donc le moteur chargé par kokoro-js et remplaçons
           uniquement sa méthode generate() par l'équivalent direct qui :
           1. phonémise en français ;
           2. tokenise ;
           3. charge ff_siwis.bin ;
           4. appelle directement le modèle Kokoro.
        */
        const kokoroModule =
            await import(KOKORO_CDN);

        const KokoroTTS =
            kokoroModule.KokoroTTS;

        if (!KokoroTTS) {
            throw new Error(
                "KokoroTTS introuvable dans kokoro-js."
            );
        }

        const webGpuDisponible =
            "gpu" in navigator &&
            !!navigator.gpu;

        const device =
            webGpuDisponible
                ? "webgpu"
                : "wasm";

        const dtype =
            device === "webgpu"
                ? "fp32"
                : "q8";

        const moteur =
            await KokoroTTS.from_pretrained(
                KOKORO_MODEL,
                {
                    dtype,
                    device,
                    progress_callback: function (progress) {

                        if (
                            progress &&
                            typeof progress.progress === "number"
                        ) {
                            setStatus(
                                "Chargement " +
                                Math.round(progress.progress) +
                                "%"
                            );
                        }
                    }
                }
            );

        setStatus("Chargement de la voix française…");

        const transformers =
            await import(TRANSFORMERS_CDN);

        const Tensor =
            transformers.Tensor;

        if (!Tensor) {
            throw new Error(
                "Tensor introuvable dans Transformers.js."
            );
        }

        const response =
            await fetch(KOKORO_VOICE_URL);

        if (!response.ok) {
            throw new Error(
                "Impossible de charger ff_siwis.bin (" +
                response.status +
                ")."
            );
        }

        const voiceBuffer =
            await response.arrayBuffer();

        const voiceData =
            new Float32Array(voiceBuffer);

        if (!voiceData.length) {
            throw new Error(
                "Le fichier ff_siwis.bin est vide."
            );
        }

        /*
           Le tokenizer est celui réellement chargé par kokoro-js.
           Le modèle est également celui réellement chargé par kokoro-js.
           On ne recrée donc pas une seconde instance lourde.
        */
        moteur.generate =
            async function (text, options) {

                const speed =
                    Number.isFinite(options?.speed)
                        ? options.speed
                        : 1;

                setStatus("Phonémisation française…");

                const phonemes = await phonemiserFrancais(text);

                if (!phonemes || !String(phonemes).trim()) {
                    throw new Error("eSpeak NG n'a retourné aucun phonème français.");
                }

                console.log("AVANT-GARDE — phonèmes français :", phonemes);

                const tokenized =
                    moteur.tokenizer(
                        String(phonemes),
                        {
                            truncation: true
                        }
                    );

                const input_ids =
                    tokenized.input_ids;

                const numTokens =
                    Math.min(
                        Math.max(
                            input_ids.dims.at(-1) - 2,
                            0
                        ),
                        509
                    );

                const offset =
                    numTokens *
                    KOKORO_STYLE_DIM;

                const style =
                    voiceData.slice(
                        offset,
                        offset + KOKORO_STYLE_DIM
                    );

                if (
                    style.length !==
                    KOKORO_STYLE_DIM
                ) {
                    throw new Error(
                        "Le style vocal ff_siwis est incomplet pour ce segment."
                    );
                }

                const result =
                    await moteur.model({
                        input_ids,
                        style: new Tensor(
                            "float32",
                            style,
                            [1, KOKORO_STYLE_DIM]
                        ),
                        speed: new Tensor(
                            "float32",
                            [speed],
                            [1]
                        )
                    });

                if (
                    !result ||
                    !result.waveform ||
                    !result.waveform.data
                ) {
                    throw new Error(
                        "Le modèle Kokoro n'a pas retourné de piste audio."
                    );
                }

                return {
                    data: result.waveform.data,
                    sample_rate: KOKORO_SAMPLE_RATE
                };
            };

        /*
           Marque le moteur comme prêt uniquement après avoir chargé
           explicitement la voix française.
        */
        kokoro = moteur;
        loading = false;

        setStatus("Moteur prêt");

        return kokoro;

    } catch (error) {

        loading = false;
        kokoro = null;

        console.error(
            "AVANT-GARDE — Kokoro :",
            error
        );

        setStatus(
            "Erreur de chargement."
        );

        throw error;
    }
}



async function basculerLecture() {
    console.log("AVANT-GARDE — lecture demandée");
    if (playing && !paused) {
        pauseLecture();
        return;
    }
    if (paused) {
        reprendreLecture();
        return;
    }

    try {
        const texte = extraireTexte();
        if (!texte) throw new Error("Aucun texte à lire.");
        chunks = construireMorceaux(texte);
        if (!chunks.length) throw new Error("Aucun morceau à lire.");

        currentGeneration++;
        chunkIndex = 0;
        playing = true;
        paused = false;
        mettreAJourInterface();

        await chargerKokoro();
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        await audioContext.resume();
        await lireMorceau(currentGeneration);
    } catch (error) {
        playing = false;
        paused = false;
        mettreAJourInterface();
        setStatus("Erreur de lecture.");
        console.error("AVANT-GARDE — lecture :", error);
    }
}

async function lireMorceau(generation) {
    if (!playing || paused || generation !== currentGeneration) return;
    if (chunkIndex >= chunks.length) {
        playing = false;
        paused = false;
        chunkIndex = 0;
        mettreAJourInterface();
        setStatus("Lecture terminée");
        return;
    }

    setStatus("Lecture " + (chunkIndex + 1) + " / " + chunks.length + "…");
    const audio = await kokoro.generate(chunks[chunkIndex], { voice: KOKORO_VOICE, speed: 1 });

    if (!playing || paused || generation !== currentGeneration) return;

    const data = audio.data || audio.waveform;
    const sampleRate = audio.sample_rate || KOKORO_SAMPLE_RATE;
    if (!data || !data.length) throw new Error("Audio Kokoro vide.");

    const clean = new Float32Array(data.length);
    for (let i = 0; i < data.length; i++) {
        const value = Number(data[i]);
        clean[i] = Number.isFinite(value) ? Math.max(-1, Math.min(1, value)) : 0;
    }

    const buffer = audioContext.createBuffer(1, clean.length, sampleRate);
    buffer.copyToChannel(clean, 0);

    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);
    activeSource = source;

    source.onended = function () {
        if (activeSource !== source) return;
        activeSource = null;
        if (playing && !paused && generation === currentGeneration) {
            chunkIndex++;
            lireMorceau(generation).catch(function (error) {
                playing = false;
                setStatus("Erreur de lecture.");
                console.error("AVANT-GARDE — morceau suivant :", error);
                mettreAJourInterface();
            });
        }
    };

    source.start(0);
}

function pauseLecture() {
    if (!playing) return;
    paused = true;
    if (activeSource) {
        try { activeSource.stop(); } catch (_) {}
        activeSource = null;
    }
    if (audioContext && audioContext.state === "running") {
        audioContext.suspend().catch(function () {});
    }
    setStatus("En pause");
    mettreAJourInterface();
}

function reprendreLecture() {
    if (!playing || !paused) return;
    paused = false;
    if (audioContext) {
        audioContext.resume().catch(function (error) {
            console.error("AVANT-GARDE — reprise audio :", error);
        });
    }
    setStatus("Reprise…");
    mettreAJourInterface();
    lireMorceau(currentGeneration).catch(function (error) {
        playing = false;
        paused = false;
        setStatus("Erreur de lecture.");
        console.error("AVANT-GARDE — reprise :", error);
        mettreAJourInterface();
    });
}

function arreterLecture() {
    currentGeneration++;
    playing = false;
    paused = false;
    chunkIndex = 0;
    if (activeSource) {
        try { activeSource.stop(); } catch (_) {}
        activeSource = null;
    }
    if (audioContext && audioContext.state === "running") {
        audioContext.suspend().catch(function () {});
    }
    setStatus("Arrêté");
    mettreAJourInterface();
}

function setStatus(message) {
    const status = document.getElementById("manifesteReaderStatus");
    if (status) status.textContent = message;
}

function mettreAJourInterface() {
    const button = document.getElementById("manifesteReaderPlay");
    const label = document.getElementById("manifesteReaderPlayLabel");
    if (!button) return;

    if (playing && !paused) {
        if (label) label.textContent = "Pause";
        button.setAttribute("aria-label", "Mettre en pause");
    } else if (paused) {
        if (label) label.textContent = "Reprendre";
        button.setAttribute("aria-label", "Reprendre la lecture");
    } else {
        if (label) label.textContent = "Écouter";
        button.setAttribute("aria-label", "Écouter le manifeste");
    }
}

function demarrerPageManifeste() {
    console.log("AVANT-GARDE — manifeste.js chargé");
    chargerManifeste().catch(function (error) {
        console.error("AVANT-GARDE — initialisation manifeste :", error);
    });
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", demarrerPageManifeste, { once: true });
} else {
    demarrerPageManifeste();
}
