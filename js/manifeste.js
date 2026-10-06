/* =========================================================
   AVANT-GARDE — PAGE MANIFESTE
   Lecteur vocal Pocket TTS — français natif
========================================================= */

const POCKET_TTS_MODULE = "./pocket-tts/index.js";
const POCKET_TTS_LANGUAGE = "french_24l";
const POCKET_TTS_VOICE = "estelle";
const POCKET_TTS_CACHE = "avantgarde-pocket-tts-v1";
const POCKET_TTS_SAMPLE_RATE = 24000;

const contentElement = document.getElementById("editorialContent");

let pocketTTS = null;
let pocketVoice = null;

let audioContext = null;
let activeSource = null;
let currentGeneration = 0;

let chunks = [];
let chunkIndex = 0;

let playing = false;
let paused = false;
let loading = false;
let generationEnCours = false;

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
            const AudioContextClass =
                window.AudioContext || window.webkitAudioContext;

            if (!AudioContextClass) {
                throw new Error("Web Audio API indisponible.");
            }

            audioContext = new AudioContextClass();
        }

        if (audioContext.state === "suspended") {
            audioContext.resume().catch(function (error) {
                console.warn(
                    "AVANT-GARDE — AudioContext resume :",
                    error
                );
            });
        }

        const buffer = audioContext.createBuffer(
            1,
            1,
            audioContext.sampleRate
        );

        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContext.destination);
        source.start(0);

        return true;
    } catch (error) {
        console.error(
            "AVANT-GARDE — déverrouillage audio :",
            error
        );

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

    return String(
        clone.innerText || clone.textContent || ""
    )
        .replace(/\u00a0/g, " ")
        .replace(/[ \t]+/g, " ")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}

function construireMorceaux(texte) {
    /*
       Pocket TTS découpe lui-même en phrases.
       On conserve toutefois un découpage externe raisonnable
       afin d'éviter qu'un très long chapitre ne reste bloqué
       pendant toute sa génération.
    */
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
        const candidat = courant
            ? courant + " " + paragraphe
            : paragraphe;

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
            paragraphe.match(
                /[^.!?…]+[.!?…]+(?:["»”']+)?|[^.!?…]+$/g
            ) || [paragraphe];

        phrases.forEach(function (phrase) {
            const propre = phrase.trim();

            if (!propre) return;

            const test = courant
                ? courant + " " + propre
                : propre;

            if (test.length <= limite) {
                courant = test;
                return;
            }

            if (courant) {
                resultat.push(courant);
            }

            if (propre.length <= limite) {
                courant = propre;
                return;
            }

            for (let i = 0; i < propre.length; i += limite) {
                resultat.push(
                    propre.slice(i, i + limite).trim()
                );
            }

            courant = "";
        });
    });

    if (courant) {
        resultat.push(courant);
    }

    return resultat.filter(function (morceau) {
        return morceau && morceau.length > 2;
    });
}

async function chargerPocketTTS() {
    if (pocketTTS && pocketVoice) {
        return pocketTTS;
    }

    if (loading) {
        while (
            loading &&
            (!pocketTTS || !pocketVoice)
        ) {
            await new Promise(function (resolve) {
                setTimeout(resolve, 100);
            });
        }

        if (pocketTTS && pocketVoice) {
            return pocketTTS;
        }
    }

    loading = true;

    try {
        setStatus("Chargement du moteur vocal français…");

        const module = await import(POCKET_TTS_MODULE);

        if (!module || !module.PocketTTS) {
            throw new Error(
                "Runtime Pocket TTS introuvable."
            );
        }

        pocketTTS = new module.PocketTTS({
            language: POCKET_TTS_LANGUAGE,
            quantized: true,
            voiceCloning: false,
            cache: true,
            cacheName: POCKET_TTS_CACHE
        });

        await pocketTTS.load(function (progress) {
            if (
                progress &&
                progress.loaded != null &&
                progress.total
            ) {
                const percent = Math.round(
                    (progress.loaded / progress.total) * 100
                );

                setStatus(
                    "Chargement du moteur français " +
                    percent +
                    "%"
                );
            } else if (
                progress &&
                progress.status === "loading-runtime"
            ) {
                setStatus("Chargement du moteur vocal…");
            } else if (
                progress &&
                progress.status === "loading-bundle"
            ) {
                setStatus("Chargement du modèle français…");
            }
        });

        console.log(
            "AVANT-GARDE — Pocket TTS langues :",
            POCKET_TTS_LANGUAGE
        );

        console.log(
            "AVANT-GARDE — voix Pocket TTS disponibles :",
            pocketTTS.predefinedVoices
        );

        if (
            !Array.isArray(pocketTTS.predefinedVoices) ||
            !pocketTTS.predefinedVoices.includes(
                POCKET_TTS_VOICE
            )
        ) {
            throw new Error(
                'La voix française "' +
                POCKET_TTS_VOICE +
                '" est indisponible dans le modèle.'
            );
        }

        setStatus("Préparation de la voix française…");

        pocketVoice = await pocketTTS.loadVoice(
            POCKET_TTS_VOICE
        );

        setStatus("Moteur vocal français prêt.");

        loading = false;

        return pocketTTS;
    } catch (error) {
        loading = false;

        if (pocketTTS) {
            try {
                pocketTTS.destroy();
            } catch (_) {}
        }

        pocketTTS = null;
        pocketVoice = null;

        console.error(
            "AVANT-GARDE — initialisation Pocket TTS :",
            error
        );

        throw error;
    }
}

async function genererAudioFrancais(texte, generation) {
    if (!pocketTTS || !pocketVoice) {
        throw new Error(
            "Moteur vocal français non initialisé."
        );
    }

    const morceauxAudio = [];

    generationEnCours = true;

    try {
        setStatus(
            "Génération de la voix française…"
        );

        await pocketTTS.generate(texte, {
            voice: pocketVoice,

            onChunk: function (audio) {
                if (
                    generation !== currentGeneration ||
                    !playing ||
                    paused
                ) {
                    return;
                }

                if (
                    audio &&
                    audio.length
                ) {
                    morceauxAudio.push(
                        new Float32Array(audio)
                    );
                }
            }
        });

        if (
            generation !== currentGeneration ||
            !playing ||
            paused
        ) {
            return null;
        }

        if (!morceauxAudio.length) {
            throw new Error(
                "Pocket TTS n'a produit aucun audio."
            );
        }

        let longueur = 0;

        morceauxAudio.forEach(function (morceau) {
            longueur += morceau.length;
        });

        const audioComplet = new Float32Array(
            longueur
        );

        let offset = 0;

        morceauxAudio.forEach(function (morceau) {
            audioComplet.set(morceau, offset);
            offset += morceau.length;
        });

        return {
            data: audioComplet,
            sampleRate:
                pocketTTS.sampleRate ||
                POCKET_TTS_SAMPLE_RATE
        };
    } finally {
        generationEnCours = false;
    }
}

async function lireMorceau(generation) {
    if (
        !playing ||
        paused ||
        generation !== currentGeneration
    ) {
        return;
    }

    if (chunkIndex >= chunks.length) {
        playing = false;
        paused = false;
        chunkIndex = 0;

        mettreAJourInterface();
        setStatus("Lecture terminée.");

        return;
    }

    const numero = chunkIndex + 1;

    setStatus(
        "Génération " +
        numero +
        "/" +
        chunks.length +
        "…"
    );

    console.log(
        "AVANT-GARDE — génération Pocket TTS",
        numero,
        "/",
        chunks.length
    );

    const audio = await genererAudioFrancais(
        chunks[chunkIndex],
        generation
    );

    if (
        !audio ||
        !playing ||
        paused ||
        generation !== currentGeneration
    ) {
        return;
    }

    const data = audio.data;
    const sampleRate =
        audio.sampleRate ||
        POCKET_TTS_SAMPLE_RATE;

    if (!data || !data.length) {
        throw new Error(
            "Audio Pocket TTS vide."
        );
    }

    if (
        !audioContext ||
        audioContext.state === "closed"
    ) {
        throw new Error(
            "AudioContext indisponible."
        );
    }

    const clean = new Float32Array(
        data.length
    );

    for (let i = 0; i < data.length; i++) {
        const value = Number(data[i]);

        clean[i] = Number.isFinite(value)
            ? Math.max(
                -1,
                Math.min(1, value)
            )
            : 0;
    }

    const buffer = audioContext.createBuffer(
        1,
        clean.length,
        sampleRate
    );

    buffer.copyToChannel(clean, 0);

    const source =
        audioContext.createBufferSource();

    source.buffer = buffer;
    source.connect(
        audioContext.destination
    );

    activeSource = source;

    source.onended = function () {
        if (activeSource !== source) {
            return;
        }

        activeSource = null;

        if (
            playing &&
            !paused &&
            generation === currentGeneration
        ) {
            chunkIndex++;

            lireMorceau(generation).catch(
                function (error) {
                    playing = false;
                    paused = false;

                    mettreAJourInterface();

                    setStatus(
                        "Erreur : " +
                        (
                            error &&
                            error.message
                                ? error.message
                                : "lecture impossible."
                        )
                    );

                    console.error(
                        "AVANT-GARDE — morceau suivant :",
                        error
                    );
                }
            );
        }
    };

    source.start(0);

    setStatus(
        "Lecture " +
        numero +
        "/" +
        chunks.length
    );
}

async function basculerLecture() {
    console.log(
        "AVANT-GARDE — clic Écouter reçu."
    );

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
            throw new Error(
                "Aucun texte du manifeste trouvé."
            );
        }

        chunks = construireMorceaux(texte);

        if (!chunks.length) {
            throw new Error(
                "Aucun morceau de texte à lire."
            );
        }

        currentGeneration++;
        chunkIndex = 0;

        playing = true;
        paused = false;

        mettreAJourInterface();

        if (!deverrouillerAudioDansLeGeste()) {
            throw new Error(
                "Le navigateur n'a pas autorisé la sortie audio."
            );
        }

        await chargerPocketTTS();

        if (
            audioContext &&
            audioContext.state === "suspended"
        ) {
            await audioContext.resume();
        }

        await lireMorceau(
            currentGeneration
        );
    } catch (error) {
        playing = false;
        paused = false;

        mettreAJourInterface();

        const message =
            error && error.message
                ? error.message
                : "lecture impossible.";

        setStatus(
            "Erreur : " + message
        );

        console.error(
            "AVANT-GARDE — lecture :",
            error
        );
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

    if (
        generationEnCours &&
        pocketTTS
    ) {
        pocketTTS.stop().catch(
            function (error) {
                console.warn(
                    "AVANT-GARDE — arrêt génération Pocket TTS :",
                    error
                );
            }
        );
    }

    setStatus("En pause.");
    mettreAJourInterface();
}

function reprendreLecture() {
    if (!playing || !paused) {
        return;
    }

    paused = false;

    mettreAJourInterface();

    if (
        audioContext &&
        audioContext.state === "suspended"
    ) {
        audioContext.resume().catch(
            function (error) {
                console.error(
                    "AVANT-GARDE — reprise audio :",
                    error
                );
            }
        );
    }

    lireMorceau(
        currentGeneration
    ).catch(function (error) {
        playing = false;
        paused = false;

        mettreAJourInterface();

        setStatus(
            "Erreur : " +
            (
                error &&
                error.message
                    ? error.message
                    : "lecture impossible."
            )
        );

        console.error(
            "AVANT-GARDE — reprise :",
            error
        );
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

    if (
        generationEnCours &&
        pocketTTS
    ) {
        pocketTTS.stop().catch(
            function (error) {
                console.warn(
                    "AVANT-GARDE — arrêt Pocket TTS :",
                    error
                );
            }
        );
    }

    setStatus("Arrêté.");
    mettreAJourInterface();
}

function installerInteractionsDirectesLecteur() {
    const play =
        document.getElementById(
            "manifesteReaderPlay"
        );

    const stop =
        document.getElementById(
            "manifesteReaderStop"
        );

    if (!play || !stop) {
        console.error(
            "AVANT-GARDE — boutons du lecteur introuvables."
        );

        return;
    }

    play.addEventListener(
        "click",
        function () {
            basculerLecture();
        }
    );

    stop.addEventListener(
        "click",
        function () {
            arreterLecture();
        }
    );

    mettreAJourInterface();
}

function demarrerPageManifeste() {
    console.log(
        "AVANT-GARDE — manifeste.js chargé."
    );

    installerInteractionsDirectesLecteur();

    if (!extraireTexte()) {
        setStatus(
            "Texte du manifeste introuvable."
        );

        console.error(
            "AVANT-GARDE — aucun texte du manifeste trouvé."
        );
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
