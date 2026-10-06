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

        const module =
            await import(KOKORO_CDN);

        const KokoroTTS =
            module.KokoroTTS;

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

        /*
           La documentation officielle recommande fp32
           pour WebGPU. On garde q8 pour WASM afin de
           limiter la mémoire nécessaire.
        */
        const dtype =
            device === "webgpu"
                ? "fp32"
                : "q8";

        setStatus(
            device === "webgpu"
                ? "Préparation de la voix…"
                : "Préparation de la voix…"
        );

        kokoro =
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

    if (
        !audio ||
        !audio.data ||
        !audio.sample_rate
    ) {
        throw new Error(
            "Kokoro n'a pas retourné de données audio valides."
        );
    }

    const context =
        obtenirAudioContext();

    const donnees =
        audio.data instanceof Float32Array
            ? audio.data
            : Float32Array.from(audio.data);

    const audioBuffer =
        context.createBuffer(
            1,
            donnees.length,
            audio.sample_rate
        );

    audioBuffer
        .getChannelData(0)
        .set(donnees);

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

        activeSource =
            source;

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
        terminerLecture();
        setStatus("Aucun texte à lire.");
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
           IMPORTANT :
           on utilise generate() morceau par morceau plutôt
           que tts.stream(). C'est plus robuste dans le navigateur
           et conforme à l'API officielle de kokoro-js.
        */
        for (
            let index = 0;
            index < chunks.length;
            index++
        ) {

            if (
                generation !== currentGeneration ||
                !playing
            ) {
                return;
            }

            chunkIndex =
                index + 1;

            setStatus(
                "Préparation " +
                chunkIndex +
                "/" +
                chunks.length
            );

            const audio =
                await moteur.generate(
                    chunks[index],
                    {
                        voice: KOKORO_VOICE,
                        speed: 0.94
                    }
                );

            if (
                generation !== currentGeneration ||
                !playing
            ) {
                return;
            }

            const audioBuffer =
                convertirEnBuffer(audio);

            setStatus(
                "Lecture " +
                chunkIndex +
                "/" +
                chunks.length
            );

            const continuer =
                await jouerBuffer(
                    audioBuffer,
                    generation
                );

            if (!continuer) {
                return;
            }
        }

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

    activeSource = null;

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

if (document.readyState === "loading") {

    document.addEventListener(
        "DOMContentLoaded",
        chargerManifeste,
        { once: true }
    );

} else {

    chargerManifeste();

}
