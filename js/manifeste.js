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
const TRANSFORMERS_CDN = "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.5.1/+esm";
const PHONEMIZER_CDN = "https://cdn.jsdelivr.net/npm/phonemizer@1.2.1/+esm";
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

        /*
           IMPORTANT :
           kokoro-js 1.2.1 expose officiellement les voix anglaises
           dans sa liste VOICES et refuse ff_siwis avant même la génération.
           Le fichier ff_siwis.bin existe pourtant bien dans le modèle
           Kokoro-82M-ONNX.

           On contourne donc uniquement cette limitation de l'enveloppe
           kokoro-js et on utilise directement les mêmes briques
           Transformers.js + phonemizer que Kokoro.
        */
        const transformers = await import(TRANSFORMERS_CDN);
        const phonemizer = await import(PHONEMIZER_CDN);

        const StyleTextToSpeech2Model =
            transformers.StyleTextToSpeech2Model;

        const AutoTokenizer =
            transformers.AutoTokenizer;

        const Tensor =
            transformers.Tensor;

        if (
            !StyleTextToSpeech2Model ||
            !AutoTokenizer ||
            !Tensor ||
            !phonemizer?.phonemize
        ) {
            throw new Error(
                "Les composants Kokoro nécessaires sont introuvables."
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

        setStatus(
            device === "webgpu"
                ? "Chargement du modèle GPU…"
                : "Chargement du modèle…"
        );

        const [model, tokenizer] =
            await Promise.all([
                StyleTextToSpeech2Model.from_pretrained(
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
                ),
                AutoTokenizer.from_pretrained(
                    KOKORO_MODEL,
                    {
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
                )
            ]);

        setStatus("Chargement de la voix française…");

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
                "Le fichier de voix française est vide."
            );
        }

        /*
           On garde une petite API interne compatible avec le reste
           du lecteur actuel : moteur.generate(texte, options).
        */
        kokoro = {
            async generate(text, options) {

                const speed =
                    Number.isFinite(options?.speed)
                        ? options.speed
                        : 1;

                const phonemeArray =
                    await phonemizer.phonemize(
                        text,
                        "fr-fr"
                    );

                const phonemes =
                    Array.isArray(phonemeArray)
                        ? phonemeArray.join(" ")
                        : String(phonemeArray || "");

                if (!phonemes.trim()) {
                    throw new Error(
                        "La phonémisation française a retourné un texte vide."
                    );
                }

                const tokenized =
                    tokenizer(
                        phonemes,
                        {
                            truncation: true
                        }
                    );

                const input_ids =
                    tokenized.input_ids;

                const nombreTokens =
                    Math.min(
                        Math.max(
                            input_ids.dims.at(-1) - 2,
                            0
                        ),
                        509
                    );

                const offset =
                    nombreTokens *
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
                        "Le vecteur de style ff_siwis est incomplet."
                    );
                }

                const outputs =
                    await model({
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
                    !outputs ||
                    !outputs.waveform ||
                    !outputs.waveform.data
                ) {
                    throw new Error(
                        "Kokoro n'a pas retourné de forme d'onde."
                    );
                }

                return {
                    data: outputs.waveform.data,
                    sample_rate: KOKORO_SAMPLE_RATE
                };
            }
        };

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

