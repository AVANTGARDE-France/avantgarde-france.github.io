/* =========================================================
   AVANT-GARDE — PAGE MANIFESTE
   Lecteur vocal Kokoro / voix française ff_siwis
========================================================= */

const KOKORO_MODEL = "onnx-community/Kokoro-82M-v1.0-ONNX";
const KOKORO_VOICE = "ff_siwis";
const KOKORO_CDN = "https://cdn.jsdelivr.net/npm/kokoro-js@1.2.1/+esm";
const FRENCH_PHONEMIZER_CDN = "https://cdn.jsdelivr.net/npm/phonemizer@1.2.1/+esm";
const KOKORO_SAMPLE_RATE = 24000;
const KOKORO_STYLE_DIM = 256;

const contentElement = document.getElementById("editorialContent");

let kokoro = null;
let phonemizeFrancais = null;
let audioContext = null;
let activeSource = null;
let currentGeneration = 0;
let chunks = [];
let chunkIndex = 0;
let playing = false;
let paused = false;
let loading = false;

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

function deverrouillerAudioDansLeGeste() {
    try {
        if (!audioContext) {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (!AudioContextClass) {
                throw new Error("Web Audio API indisponible.");
            }
            audioContext = new AudioContextClass();
        }

        const buffer = audioContext.createBuffer(1, 1, audioContext.sampleRate);
        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContext.destination);
        source.start(0);

        if (audioContext.state === "suspended") {
            audioContext.resume().catch(function (error) {
                console.warn("AVANT-GARDE — AudioContext resume :", error);
            });
        }

        return true;
    } catch (error) {
        console.error("AVANT-GARDE — déverrouillage audio :", error);
        return false;
    }
}

function extraireTexte() {
    if (!contentElement) return "";

    const clone = contentElement.cloneNode(true);

    clone.querySelectorAll(
        "script, style, noscript, #manifesteReader, .manifeste-reader, button"
    ).forEach(function (element) {
        element.remove();
    });

    return String(clone.innerText || clone.textContent || "")
        .replace(/\u00a0/g, " ")
        .replace(/[ \t]+/g, " ")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}

function construireMorceaux(texte) {
    const limite = 850;
    const paragraphes = String(texte || "")
        .split(/\n{2,}/)
        .map(function (p) {
            return p.replace(/\s+/g, " ").trim();
        })
        .filter(Boolean);

    const resultat = [];
    let courant = "";

    paragraphes.forEach(function (paragraphe) {
        const candidat = courant ? courant + " " + paragraphe : paragraphe;

        if (candidat.length <= limite) {
            courant = candidat;
            return;
        }

        if (courant) {
            resultat.push(courant);
            courant = "";
        }

        if (paragraphe.length <= limite) {
            courant = paragraphe;
            return;
        }

        const phrases =
            paragraphe.match(/[^.!?…]+[.!?…]+(?:["»”']+)?|[^.!?…]+$/g) ||
            [paragraphe];

        phrases.forEach(function (phrase) {
            const propre = phrase.trim();
            if (!propre) return;

            const test = courant ? courant + " " + propre : propre;

            if (test.length <= limite) {
                courant = test;
            } else {
                if (courant) resultat.push(courant);

                if (propre.length <= limite) {
                    courant = propre;
                } else {
                    for (let i = 0; i < propre.length; i += limite) {
                        resultat.push(propre.slice(i, i + limite).trim());
                    }
                    courant = "";
                }
            }
        });
    });

    if (courant) resultat.push(courant);

    return resultat.filter(function (morceau) {
        return morceau && morceau.length > 2;
    });
}

async function chargerKokoro() {
    if (kokoro && phonemizeFrancais) return kokoro;

    if (loading) {
        while (loading && (!kokoro || !phonemizeFrancais)) {
            await new Promise(function (resolve) {
                setTimeout(resolve, 100);
            });
        }
        if (kokoro && phonemizeFrancais) return kokoro;
    }

    loading = true;

    try {
        setStatus("Chargement du moteur vocal…");

        const modules = await Promise.all([
            import(KOKORO_CDN),
            import(FRENCH_PHONEMIZER_CDN)
        ]);

        const KokoroTTS = modules[0].KokoroTTS;
        const phonemize = modules[1].phonemize;

        if (!KokoroTTS) {
            throw new Error("KokoroTTS introuvable.");
        }

        if (typeof phonemize !== "function") {
            throw new Error("Phonémiseur eSpeak français introuvable.");
        }

        const webGpuDisponible =
            "gpu" in navigator && !!navigator.gpu;

        const device = webGpuDisponible ? "webgpu" : "wasm";
        const dtype = device === "webgpu" ? "fp32" : "q8";

        kokoro = await KokoroTTS.from_pretrained(KOKORO_MODEL, {
            dtype: dtype,
            device: device,
            progress_callback: function (progress) {
                if (progress && typeof progress.progress === "number") {
                    setStatus(
                        "Chargement du moteur " +
                        Math.round(progress.progress) +
                        "%"
                    );
                }
            }
        });

        phonemizeFrancais = phonemize;

        if (typeof kokoro.list_voices === "function") {
            const voices = kokoro.list_voices();
            console.log("AVANT-GARDE — voix Kokoro disponibles :", voices);
        }

        setStatus("Moteur vocal prêt.");
        loading = false;
        return kokoro;
    } catch (error) {
        loading = false;
        kokoro = null;
        phonemizeFrancais = null;
        console.error("AVANT-GARDE — initialisation Kokoro :", error);
        throw error;
    }
}

async function genererAudioFrancais(texte) {
    if (!kokoro || typeof phonemizeFrancais !== "function") {
        throw new Error("Moteur vocal non initialisé.");
    }

    setStatus("Préparation du français…");

    /*
       Kokoro.js utilise le phonémiseur eSpeak NG.
       Pour la voix française ff_siwis, le code langue attendu
       est fr-fr. Nous utilisons donc exactement le même moteur
       de phonémisation que Kokoro.js, et non @piper-plus/g2p.
    */
    const resultatPhonemique = await phonemizeFrancais(texte, "fr-fr");
    const textePhonemique = Array.isArray(resultatPhonemique)
        ? resultatPhonemique.join(" ")
        : String(resultatPhonemique || "").trim();

    if (!textePhonemique) {
        throw new Error("Le phonémiseur français n'a retourné aucun phonème.");
    }

    console.log("AVANT-GARDE — phonèmes français Kokoro :", textePhonemique);

    const tokenized = kokoro.tokenizer(textePhonemique, {
        truncation: true
    });

    if (!tokenized || !tokenized.input_ids) {
        throw new Error("Tokenisation française impossible.");
    }

    /*
       generate_from_ids() permet d'utiliser directement ff_siwis,
       même si la validation de generate() de kokoro-js 1.2.1
       ne reconnaît que les préfixes a/b.
    */
    return kokoro.generate_from_ids(tokenized.input_ids, {
        voice: KOKORO_VOICE,
        speed: 1
    });
}

async function lireMorceau(generation) {
    if (!playing || paused || generation !== currentGeneration) return;

    if (chunkIndex >= chunks.length) {
        playing = false;
        paused = false;
        chunkIndex = 0;
        mettreAJourInterface();
        setStatus("Lecture terminée.");
        return;
    }

    const numero = chunkIndex + 1;
    setStatus("Génération audio " + numero + "/" + chunks.length + "…");
    console.log(
        "AVANT-GARDE — génération du morceau",
        numero,
        "/",
        chunks.length
    );

    const audio = await genererAudioFrancais(chunks[chunkIndex]);

    if (!playing || paused || generation !== currentGeneration) return;

    const data = audio && (audio.data || audio.waveform);
    const sampleRate =
        (audio && (audio.sampling_rate || audio.sample_rate)) ||
        KOKORO_SAMPLE_RATE;

    if (!data || !data.length) {
        throw new Error("Audio Kokoro vide.");
    }

    if (!audioContext || audioContext.state === "closed") {
        throw new Error("AudioContext indisponible.");
    }

    const clean = new Float32Array(data.length);

    for (let i = 0; i < data.length; i++) {
        const value = Number(data[i]);
        clean[i] = Number.isFinite(value)
            ? Math.max(-1, Math.min(1, value))
            : 0;
    }

    const buffer = audioContext.createBuffer(
        1,
        clean.length,
        sampleRate
    );

    buffer.copyToChannel(clean, 0);

    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);
    activeSource = source;

    source.onended = function () {
        if (activeSource !== source) return;

        activeSource = null;

        if (
            playing &&
            !paused &&
            generation === currentGeneration
        ) {
            chunkIndex++;

            lireMorceau(generation).catch(function (error) {
                playing = false;
                paused = false;
                mettreAJourInterface();
                setStatus(
                    "Erreur : " +
                    (error && error.message
                        ? error.message
                        : "lecture impossible.")
                );
                console.error(
                    "AVANT-GARDE — morceau suivant :",
                    error
                );
            });
        }
    };

    source.start(0);
    setStatus("Lecture " + numero + "/" + chunks.length);
}

async function basculerLecture() {
    console.log("AVANT-GARDE — clic Écouter reçu.");

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

        if (!texte) {
            throw new Error("Aucun texte du manifeste trouvé.");
        }

        chunks = construireMorceaux(texte);

        if (!chunks.length) {
            throw new Error("Aucun morceau de texte à lire.");
        }

        currentGeneration++;
        chunkIndex = 0;
        playing = true;
        paused = false;
        mettreAJourInterface();

        if (!deverrouillerAudioDansLeGeste()) {
            throw new Error("Le navigateur n'a pas autorisé la sortie audio.");
        }

        await chargerKokoro();

        if (audioContext && audioContext.state === "suspended") {
            await audioContext.resume();
        }

        await lireMorceau(currentGeneration);
    } catch (error) {
        playing = false;
        paused = false;
        mettreAJourInterface();

        const message =
            error && error.message
                ? error.message
                : "lecture impossible.";

        setStatus("Erreur : " + message);
        console.error("AVANT-GARDE — lecture :", error);
    }
}

function pauseLecture() {
    if (!playing) return;

    paused = true;

    if (activeSource) {
        try {
            activeSource.stop();
        } catch (_) {}

        activeSource = null;
    }

    setStatus("En pause.");
    mettreAJourInterface();
}

function reprendreLecture() {
    if (!playing || !paused) return;

    paused = false;
    mettreAJourInterface();

    if (audioContext && audioContext.state === "suspended") {
        audioContext.resume().catch(function (error) {
            console.error("AVANT-GARDE — reprise audio :", error);
        });
    }

    lireMorceau(currentGeneration).catch(function (error) {
        playing = false;
        paused = false;
        mettreAJourInterface();
        setStatus(
            "Erreur : " +
            (error && error.message
                ? error.message
                : "lecture impossible.")
        );
        console.error("AVANT-GARDE — reprise :", error);
    });
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

    setStatus("Arrêté.");
    mettreAJourInterface();
}

function installerInteractionsDirectesLecteur() {
    const play = document.getElementById("manifesteReaderPlay");
    const stop = document.getElementById("manifesteReaderStop");

    if (!play || !stop) {
        console.error("AVANT-GARDE — boutons du lecteur introuvables.");
        return;
    }

    play.addEventListener("click", function () {
        basculerLecture();
    });

    stop.addEventListener("click", function () {
        arreterLecture();
    });

    mettreAJourInterface();
}

function demarrerPageManifeste() {
    console.log("AVANT-GARDE — manifeste.js chargé.");
    installerInteractionsDirectesLecteur();

    if (!extraireTexte()) {
        setStatus("Texte du manifeste introuvable.");
        console.error("AVANT-GARDE — aucun texte du manifeste trouvé.");
    }
}

if (document.readyState === "loading") {
    document.addEventListener(
        "DOMContentLoaded",
        demarrerPageManifeste,
        { once: true }
    );
} else {
    demarrerPageManifeste();
}
