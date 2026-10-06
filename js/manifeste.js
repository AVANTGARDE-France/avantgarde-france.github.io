/* =========================================================
   AVANT-GARDE — PAGE MANIFESTE
   js/manifeste.js

   Lecteur vocal :
   - Kokoro-82M directement dans le navigateur
   - aucune API payante
   - aucun MP3 permanent
   - aucune voix native Chrome/Edge
   - WebGPU si disponible, WASM sinon
   - le modèle est téléchargé une seule fois puis mis en cache
========================================================= */

import { supabase } from "./supabase.js";

const SLUG = "manifeste";
const KOKORO_MODEL = "onnx-community/Kokoro-82M-v1.0-ONNX";
const KOKORO_VOICE = "ff_siwis";
const KOKORO_CDN = "https://cdn.jsdelivr.net/npm/kokoro-js@1.2.1/+esm";

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

function contenuPreRenduDisponible() {
    if (!contentElement) return false;

    const html = contentElement.innerHTML?.trim();

    return !!html &&
        !contentElement.querySelector(".editorial-loading");
}

async function chargerManifeste() {

    if (!contentElement) return;

    if (contenuPreRenduDisponible()) {
        initialiserLecteurManifeste();
        return;
    }

    try {

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

    /*
       Le moteur Kokoro n'est volontairement PAS chargé ici.
       Il ne sera téléchargé que lorsque le visiteur demande une lecture.
    */
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

        if (
            courant &&
            courant.length + phrase.length + 1 > 650
        ) {
            resultat.push(courant);
            courant = "";
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

        const module =
            await import(KOKORO_CDN);

        const KokoroTTS =
            module.KokoroTTS;

        if (!KokoroTTS) {
            throw new Error(
                "KokoroTTS introuvable dans kokoro-js."
            );
        }

        const device =
            "gpu" in navigator && navigator.gpu
                ? "webgpu"
                : "wasm";

        setStatus(
            device === "webgpu"
                ? "Préparation de la voix…"
                : "Préparation de la voix (mode compatible)…"
        );

        kokoro =
            await KokoroTTS.from_pretrained(
                KOKORO_MODEL,
                {
                    dtype: device === "webgpu"
                        ? "fp16"
                        : "q8",
                    device,
                    progress_callback: function (progress) {

                        if (
                            progress &&
                            typeof progress.progress === "number"
                        ) {
                            const value =
                                Math.round(
                                    progress.progress
                                );

                            setStatus(
                                "Chargement " +
                                value +
                                "%"
                            );
                        }
                    }
                }
            );

        loading = false;

        return kokoro;

    } catch (error) {

        loading = false;
        kokoro = null;

        console.error(
            "AVANT-GARDE — Kokoro :",
            error
        );

        setStatus(
            "Impossible de charger la voix."
        );

        throw error;
    }
}

function obtenirAudioContext() {

    if (!audioContext) {

        const AudioContextClass =
            window.AudioContext ||
            window.webkitAudioContext;

        if (!AudioContextClass) {
            throw new Error(
                "Web Audio API indisponible."
            );
        }

        audioContext =
            new AudioContextClass();
    }

    return audioContext;
}

function convertirEnBuffer(audio) {

    const context =
        obtenirAudioContext();

    const audioBuffer =
        context.createBuffer(
            1,
            audio.data.length,
            audio.sample_rate
        );

    audioBuffer
        .getChannelData(0)
        .set(audio.data);

    return audioBuffer;
}

function jouerBuffer(audioBuffer, generation) {

    return new Promise(function (resolve) {

        if (
            generation !== currentGeneration ||
            !playing
        ) {
            resolve(false);
            return;
        }

        const context =
            obtenirAudioContext();

        const source =
            context.createBufferSource();

        source.buffer =
            audioBuffer;

        source.connect(
            context.destination
        );

        activeSource = source;

        source.onended =
            function () {

                if (
                    activeSource === source
                ) {
                    activeSource = null;
                }

                resolve(
                    generation === currentGeneration
                );
            };

        source.start(0);
    });
}

async function lireAvecKokoro() {

    const generation =
        ++currentGeneration;

    const texte =
        extraireTexte();

    chunks =
        construireMorceaux(texte);

    chunkIndex = 0;

    if (!chunks.length) {
        setStatus("Aucun texte à lire.");
        terminerLecture();
        return;
    }

    try {

        const moteur =
            await chargerKokoro();

        if (
            generation !== currentGeneration ||
            !playing
        ) {
            return;
        }

        const context =
            obtenirAudioContext();

        if (context.state === "suspended") {
            await context.resume();
        }

        /*
           Kokoro produit les morceaux progressivement.
           Le navigateur commence donc à parler avant que
           tout le manifeste ait été synthétisé.
        */
        const splitterModule =
            await import(KOKORO_CDN);

        const TextSplitterStream =
            splitterModule.TextSplitterStream;

        if (!TextSplitterStream) {
            throw new Error(
                "TextSplitterStream introuvable."
            );
        }

        const splitter =
            new TextSplitterStream();

        const stream =
            moteur.stream(
                splitter,
                {
                    voice: KOKORO_VOICE,
                    speed: 0.94
                }
            );

        const alimentation =
            (async function () {

                for (
                    let i = 0;
                    i < chunks.length;
                    i++
                ) {

                    if (
                        generation !== currentGeneration ||
                        !playing
                    ) {
                        return;
                    }

                    splitter.push(
                        chunks[i]
                    );
                }

                splitter.close();
            })();

        for await (
            const resultat of stream
        ) {

            if (
                generation !== currentGeneration ||
                !playing
            ) {
                return;
            }

            chunkIndex++;

            setStatus(
                "Lecture " +
                chunkIndex +
                "/" +
                chunks.length
            );

            const audioBuffer =
                convertirEnBuffer(
                    resultat.audio
                );

            const continueLecture =
                await jouerBuffer(
                    audioBuffer,
                    generation
                );

            if (!continueLecture) {
                return;
            }
        }

        await alimentation;

        if (
            generation === currentGeneration &&
            playing
        ) {
            terminerLecture();
        }

    } catch (error) {

        if (
            generation !== currentGeneration
        ) {
            return;
        }

        console.error(
            "AVANT-GARDE — Lecture Kokoro :",
            error
        );

        terminerLecture();
        setStatus(
            "Erreur de lecture."
        );
    }
}

async function basculerLecture() {

    if (playing && !paused) {

        paused = true;

        if (audioContext) {
            await audioContext.suspend();
        }

        mettreAJourInterface();
        setStatus("Pause");
        return;
    }

    if (playing && paused) {

        paused = false;

        if (audioContext) {
            await audioContext.resume();
        }

        mettreAJourInterface();
        setStatus("Lecture");

        return;
    }

    playing = true;
    paused = false;

    mettreAJourInterface();

    try {

        await lireAvecKokoro();

    } catch (error) {

        console.error(
            "AVANT-GARDE — Lecteur :",
            error
        );

        terminerLecture();
        setStatus(
            "Lecture indisponible."
        );
    }
}

function arreterLecture() {

    currentGeneration++;

    playing = false;
    paused = false;
    chunkIndex = 0;

    if (activeSource) {

        try {
            activeSource.stop();
        } catch (_) {}

        activeSource = null;
    }

    if (audioContext) {

        try {
            audioContext.suspend();
        } catch (_) {}
    }

    mettreAJourInterface();
    setStatus("Prêt");
}

function terminerLecture() {

    playing = false;
    paused = false;
    chunkIndex = 0;

    if (activeSource) {
        activeSource = null;
    }

    mettreAJourInterface();
    setStatus("Terminé");
}

function setStatus(message) {

    const element =
        document.getElementById(
            "manifesteReaderStatus"
        );

    if (element) {
        element.textContent = message;
    }
}

function mettreAJourInterface() {

    const playButton =
        document.getElementById(
            "manifesteReaderPlay"
        );

    const playLabel =
        document.getElementById(
            "manifesteReaderPlayLabel"
        );

    if (!playButton) return;

    if (playing && !paused) {

        playButton.setAttribute(
            "aria-label",
            "Mettre en pause"
        );

        if (playLabel) {
            playLabel.textContent = "Pause";
        }

        return;
    }

    if (playing && paused) {

        playButton.setAttribute(
            "aria-label",
            "Reprendre la lecture"
        );

        if (playLabel) {
            playLabel.textContent = "Reprendre";
        }

        return;
    }

    playButton.setAttribute(
        "aria-label",
        "Écouter le manifeste"
    );

    if (playLabel) {
        playLabel.textContent = "Écouter";
    }
}

if (
    document.readyState === "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        chargerManifeste,
        { once: true }
    );

} else {

    chargerManifeste();

}
