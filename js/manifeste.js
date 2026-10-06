/* =========================================================
   AVANT-GARDE — PAGE MANIFESTE
   Lecteur vocal gratuit — comparaison Piper Plus / Pocket TTS
========================================================= */

const POCKET_TTS_MODULE = "./pocket-tts/index.js";
const POCKET_TTS_LANGUAGE = "french_24l";
const POCKET_TTS_VOICE = "estelle-fr";
const POCKET_TTS_VOICE_REFERENCE =
    "https://huggingface.co/kyutai/tts-voices/resolve/main/unmute-prod-website/developpeuse-3.wav";
const POCKET_TTS_VOICE_REFERENCE_CACHE =
    "avantgarde-pocket-tts-estelle-v1";
const POCKET_TTS_CACHE =
    "avantgarde-pocket-tts-v1";
const POCKET_TTS_SAMPLE_RATE = 24000;

const PIPER_PLUS_MODEL =
    "ayousanz/piper-plus-tsukuyomi-chan";
const PIPER_PLUS_SAMPLE_RATE = 22050;

const contentElement =
    document.getElementById("editorialContent");

let pocketTTS = null;
let pocketVoice = null;
let pocketLoading = false;

let piperTTS = null;
let piperLoading = false;

let audioContext = null;
let activeSource = null;
let currentGeneration = 0;

let chunks = [];
let chunkIndex = 0;

let playing = false;
let paused = false;
let generationEnCours = false;

function getEngine() {
    const select =
        document.getElementById("manifesteReaderEngine");

    return select && select.value === "pocket"
        ? "pocket"
        : "piper";
}

function setStatus(message) {
    const status =
        document.getElementById(
            "manifesteReaderStatus"
        );

    if (status) {
        status.textContent = message;
    }
}

function mettreAJourInterface() {
    const button =
        document.getElementById(
            "manifesteReaderPlay"
        );

    const label =
        document.getElementById(
            "manifesteReaderPlayLabel"
        );

    if (!button) return;

    if (playing && !paused) {
        if (label) {
            label.textContent = "Pause";
        }

        button.setAttribute(
            "aria-label",
            "Mettre en pause"
        );
    } else if (paused) {
        if (label) {
            label.textContent = "Reprendre";
        }

        button.setAttribute(
            "aria-label",
            "Reprendre la lecture"
        );
    } else {
        if (label) {
            label.textContent = "Écouter";
        }

        button.setAttribute(
            "aria-label",
            "Écouter le manifeste"
        );
    }
}

function deverrouillerAudioDansLeGeste() {
    try {
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

        if (
            audioContext.state ===
            "suspended"
        ) {
            audioContext.resume().catch(
                function (error) {
                    console.warn(
                        "AVANT-GARDE — AudioContext resume :",
                        error
                    );
                }
            );
        }

        const buffer =
            audioContext.createBuffer(
                1,
                1,
                audioContext.sampleRate
            );

        const source =
            audioContext.createBufferSource();

        source.buffer = buffer;
        source.connect(
            audioContext.destination
        );
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

    const clone =
        contentElement.cloneNode(true);

    clone.querySelectorAll(
        "script, style, noscript, #manifesteReader, .manifeste-reader, button"
    ).forEach(function (element) {
        element.remove();
    });

    return String(
        clone.innerText ||
        clone.textContent ||
        ""
    )
        .replace(/\u00a0/g, " ")
        .replace(/[ \t]+\n/g, "\n")
        .replace(/\n[ \t]+/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}

/*
   On conserve les paragraphes et les titres séparés.
   C'est important pour les slogans et les phrases courtes :
   le moteur reçoit réellement les ruptures éditoriales
   au lieu de transformer tout le manifeste en un bloc.
*/
function construireMorceaux(texte) {
    const limite = 650;

    const blocs =
        String(texte || "")
            .split(/\n{2,}/)
            .map(function (bloc) {
                return bloc
                    .replace(/\s+/g, " ")
                    .trim();
            })
            .filter(Boolean);

    const resultat = [];

    blocs.forEach(function (bloc) {
        if (bloc.length <= limite) {
            resultat.push(bloc);
            return;
        }

        const phrases =
            bloc.match(
                /[^.!?…]+[.!?…]+(?:["»”']+)?|[^.!?…]+$/g
            ) || [bloc];

        let courant = "";

        phrases.forEach(function (phrase) {
            const propre =
                phrase.trim();

            if (!propre) return;

            if (
                propre.length > limite
            ) {
                if (courant) {
                    resultat.push(
                        courant
                    );
                    courant = "";
                }

                for (
                    let i = 0;
                    i < propre.length;
                    i += limite
                ) {
                    resultat.push(
                        propre
                            .slice(
                                i,
                                i + limite
                            )
                            .trim()
                    );
                }

                return;
            }

            const candidat =
                courant
                    ? courant +
                      " " +
                      propre
                    : propre;

            if (
                candidat.length <=
                limite
            ) {
                courant = candidat;
            } else {
                if (courant) {
                    resultat.push(
                        courant
                    );
                }

                courant = propre;
            }
        });

        if (courant) {
            resultat.push(courant);
        }
    });

    return resultat.filter(
        function (morceau) {
            return (
                morceau &&
                morceau.length > 1
            );
        }
    );
}

/* =========================================================
   POCKET TTS
========================================================= */

async function chargerReferenceEstelle() {
    let arrayBuffer = null;

    if (
        typeof caches !==
        "undefined"
    ) {
        try {
            const cache =
                await caches.open(
                    POCKET_TTS_VOICE_REFERENCE_CACHE
                );

            const cached =
                await cache.match(
                    POCKET_TTS_VOICE_REFERENCE
                );

            if (cached) {
                arrayBuffer =
                    await cached.arrayBuffer();
            } else {
                const response =
                    await fetch(
                        POCKET_TTS_VOICE_REFERENCE,
                        {
                            mode: "cors",
                            cache: "force-cache"
                        }
                    );

                if (!response.ok) {
                    throw new Error(
                        "Téléchargement de la référence Estelle impossible (" +
                        response.status +
                        ")."
                    );
                }

                const copy =
                    response.clone();

                arrayBuffer =
                    await response.arrayBuffer();

                try {
                    await cache.put(
                        POCKET_TTS_VOICE_REFERENCE,
                        copy
                    );
                } catch (_) {}
            }
        } catch (error) {
            console.warn(
                "AVANT-GARDE — cache référence Estelle :",
                error
            );
        }
    }

    if (!arrayBuffer) {
        const response =
            await fetch(
                POCKET_TTS_VOICE_REFERENCE,
                { mode: "cors" }
            );

        if (!response.ok) {
            throw new Error(
                "Référence vocale Estelle inaccessible (" +
                response.status +
                ")."
            );
        }

        arrayBuffer =
            await response.arrayBuffer();
    }

    if (!audioContext) {
        throw new Error(
            "AudioContext indisponible pour préparer Estelle."
        );
    }

    const decoded =
        await audioContext.decodeAudioData(
            arrayBuffer.slice(0)
        );

    const targetRate =
        POCKET_TTS_SAMPLE_RATE;

    const targetLength =
        Math.max(
            1,
            Math.ceil(
                decoded.duration *
                targetRate
            )
        );

    const offline =
        new OfflineAudioContext(
            1,
            targetLength,
            targetRate
        );

    const source =
        offline.createBufferSource();

    source.buffer = decoded;
    source.connect(
        offline.destination
    );
    source.start(0);

    const rendered =
        await offline.startRendering();

    return new Float32Array(
        rendered.getChannelData(0)
    );
}

async function chargerPocketTTS() {
    if (
        pocketTTS &&
        pocketVoice
    ) {
        return pocketTTS;
    }

    if (pocketLoading) {
        while (
            pocketLoading &&
            (
                !pocketTTS ||
                !pocketVoice
            )
        ) {
            await new Promise(
                function (resolve) {
                    setTimeout(
                        resolve,
                        100
                    );
                }
            );
        }

        if (
            pocketTTS &&
            pocketVoice
        ) {
            return pocketTTS;
        }
    }

    pocketLoading = true;

    try {
        setStatus(
            "Chargement de Pocket TTS…"
        );

        const module =
            await import(
                POCKET_TTS_MODULE
            );

        if (
            !module ||
            !module.PocketTTS
        ) {
            throw new Error(
                "Runtime Pocket TTS introuvable."
            );
        }

        pocketTTS =
            new module.PocketTTS({
                language:
                    POCKET_TTS_LANGUAGE,
                quantized: true,
                voiceCloning: true,
                cache: true,
                cacheName:
                    POCKET_TTS_CACHE
            });

        await pocketTTS.load(
            function (progress) {
                if (
                    progress &&
                    progress.loaded !=
                        null &&
                    progress.total
                ) {
                    setStatus(
                        "Pocket TTS " +
                        Math.round(
                            progress.loaded /
                            progress.total *
                            100
                        ) +
                        "%"
                    );
                }
            }
        );

        setStatus(
            "Préparation d'Estelle…"
        );

        const referenceAudio =
            await chargerReferenceEstelle();

        pocketVoice =
            await pocketTTS.cloneVoice(
                referenceAudio,
                POCKET_TTS_VOICE
            );

        pocketLoading = false;

        console.log(
            "AVANT-GARDE — Pocket TTS prêt."
        );

        return pocketTTS;
    } catch (error) {
        pocketLoading = false;

        if (pocketTTS) {
            try {
                pocketTTS.destroy();
            } catch (_) {}
        }

        pocketTTS = null;
        pocketVoice = null;

        throw error;
    }
}

/* =========================================================
   PIPER PLUS
========================================================= */

async function chargerPiperPlus() {
    if (piperTTS) {
        return piperTTS;
    }

    if (piperLoading) {
        while (
            piperLoading &&
            !piperTTS
        ) {
            await new Promise(
                function (resolve) {
                    setTimeout(
                        resolve,
                        100
                    );
                }
            );
        }

        if (piperTTS) {
            return piperTTS;
        }
    }

    piperLoading = true;

    try {
        setStatus(
            "Chargement de Piper Plus…"
        );

        const piperModule =
            await import(
                "piper-plus"
            );

        const ort =
            await import(
                "onnxruntime-web"
            );

        if (
            !piperModule ||
            !piperModule.PiperPlus
        ) {
            throw new Error(
                "Runtime Piper Plus introuvable."
            );
        }

        piperTTS =
            await piperModule.PiperPlus.initialize(
                {
                    model:
                        PIPER_PLUS_MODEL,
                    ort: ort,
                    onProgress:
                        function (
                            progress
                        ) {
                            if (
                                !progress
                            ) {
                                return;
                            }

                            if (
                                progress.stage ===
                                "model"
                            ) {
                                setStatus(
                                    "Téléchargement du modèle Piper " +
                                    Math.round(
                                        (
                                            progress.progress ||
                                            0
                                        ) * 100
                                    ) +
                                    "%"
                                );
                            } else if (
                                progress.stage ===
                                "wasm"
                            ) {
                                setStatus(
                                    "Chargement du moteur Piper…"
                                );
                            } else if (
                                progress.message
                            ) {
                                setStatus(
                                    progress.message
                                );
                            }
                        }
                }
            );

        piperLoading = false;

        console.log(
            "AVANT-GARDE — Piper Plus prêt :",
            PIPER_PLUS_MODEL
        );

        setStatus(
            "Piper Plus prêt."
        );

        return piperTTS;
    } catch (error) {
        piperLoading = false;
        piperTTS = null;

        console.error(
            "AVANT-GARDE — initialisation Piper Plus :",
            error
        );

        throw error;
    }
}

/* =========================================================
   GÉNÉRATION
========================================================= */

async function genererAudioFrancais(
    texte,
    generation
) {
    const engine =
        getEngine();

    generationEnCours = true;

    try {
        if (engine === "piper") {
            const tts =
                await chargerPiperPlus();

            if (
                generation !==
                currentGeneration
            ) {
                return null;
            }

            setStatus(
                "Piper — génération…"
            );

            const result =
                await tts.synthesize(
                    texte,
                    {
                        language: "fr",
                        noiseScale: 0.4,
                        lengthScale: 1.0,
                        noiseW: 0.5
                    }
                );

            if (
                generation !==
                currentGeneration ||
                !playing ||
                paused
            ) {
                return null;
            }

            if (
                !result ||
                !result.samples ||
                !result.samples.length
            ) {
                throw new Error(
                    "Piper Plus n'a produit aucun audio."
                );
            }

            return {
                data:
                    result.samples,
                sampleRate:
                    result.sampleRate ||
                    PIPER_PLUS_SAMPLE_RATE
            };
        }

        const tts =
            await chargerPocketTTS();

        if (
            generation !==
            currentGeneration
        ) {
            return null;
        }

        const morceauxAudio = [];

        setStatus(
            "Pocket — génération…"
        );

        await tts.generate(
            texte,
            {
                voice: pocketVoice,

                onProgress:
                    function (
                        progress
                    ) {
                        if (
                            generation !==
                                currentGeneration ||
                            !playing ||
                            paused
                        ) {
                            return;
                        }

                        if (
                            progress &&
                            progress.status ===
                                "generating"
                        ) {
                            setStatus(
                                "Pocket " +
                                progress.chunk +
                                "/" +
                                progress.totalChunks +
                                " — " +
                                progress.frame +
                                "/" +
                                progress.maxFrames
                            );
                        }
                    },

                onChunk:
                    function (
                        audio
                    ) {
                        if (
                            generation !==
                                currentGeneration ||
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
                                new Float32Array(
                                    audio
                                )
                            );
                        }
                    }
            }
        );

        if (
            generation !==
                currentGeneration ||
            !playing ||
            paused
        ) {
            return null;
        }

        if (
            !morceauxAudio.length
        ) {
            throw new Error(
                "Pocket TTS n'a produit aucun audio."
            );
        }

        let longueur = 0;

        morceauxAudio.forEach(
            function (morceau) {
                longueur +=
                    morceau.length;
            }
        );

        const audioComplet =
            new Float32Array(
                longueur
            );

        let offset = 0;

        morceauxAudio.forEach(
            function (morceau) {
                audioComplet.set(
                    morceau,
                    offset
                );

                offset +=
                    morceau.length;
            }
        );

        return {
            data: audioComplet,
            sampleRate:
                tts.sampleRate ||
                POCKET_TTS_SAMPLE_RATE
        };
    } finally {
        generationEnCours = false;
    }
}

/* =========================================================
   LECTURE
========================================================= */

async function lireMorceau(
    generation
) {
    if (
        !playing ||
        paused ||
        generation !==
            currentGeneration
    ) {
        return;
    }

    if (
        chunkIndex >=
        chunks.length
    ) {
        playing = false;
        paused = false;
        chunkIndex = 0;

        mettreAJourInterface();
        setStatus(
            "Lecture terminée."
        );

        return;
    }

    const numero =
        chunkIndex + 1;

    const engine =
        getEngine();

    setStatus(
        engine === "piper"
            ? "Piper — génération " +
              numero +
              "/" +
              chunks.length
            : "Pocket — génération " +
              numero +
              "/" +
              chunks.length
    );

    console.log(
        "AVANT-GARDE — génération",
        engine,
        numero,
        "/",
        chunks.length
    );

    const audio =
        await genererAudioFrancais(
            chunks[chunkIndex],
            generation
        );

    if (
        !audio ||
        !playing ||
        paused ||
        generation !==
            currentGeneration
    ) {
        return;
    }

    const data =
        audio.data;

    const sampleRate =
        audio.sampleRate;

    if (
        !data ||
        !data.length
    ) {
        throw new Error(
            "Audio vide."
        );
    }

    if (
        !audioContext ||
        audioContext.state ===
            "closed"
    ) {
        throw new Error(
            "AudioContext indisponible."
        );
    }

    const clean =
        new Float32Array(
            data.length
        );

    for (
        let i = 0;
        i < data.length;
        i++
    ) {
        const value =
            Number(data[i]);

        clean[i] =
            Number.isFinite(value)
                ? Math.max(
                    -1,
                    Math.min(
                        1,
                        value
                    )
                )
                : 0;
    }

    const buffer =
        audioContext.createBuffer(
            1,
            clean.length,
            sampleRate
        );

    buffer.copyToChannel(
        clean,
        0
    );

    const source =
        audioContext.createBufferSource();

    source.buffer = buffer;
    source.connect(
        audioContext.destination
    );

    activeSource = source;

    source.onended =
        function () {
            if (
                activeSource !==
                source
            ) {
                return;
            }

            activeSource = null;

            if (
                playing &&
                !paused &&
                generation ===
                    currentGeneration
            ) {
                chunkIndex++;

                lireMorceau(
                    generation
                ).catch(
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
        (
            engine === "piper"
                ? "Piper"
                : "Pocket"
        ) +
        " — lecture " +
        numero +
        "/" +
        chunks.length
    );
}

async function basculerLecture() {
    console.log(
        "AVANT-GARDE — clic Écouter reçu."
    );

    if (
        playing &&
        !paused
    ) {
        pauseLecture();
        return;
    }

    if (paused) {
        reprendreLecture();
        return;
    }

    try {
        const texte =
            extraireTexte();

        if (!texte) {
            throw new Error(
                "Aucun texte du manifeste trouvé."
            );
        }

        chunks =
            construireMorceaux(
                texte
            );

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

        if (
            !deverrouillerAudioDansLeGeste()
        ) {
            throw new Error(
                "Le navigateur n'a pas autorisé la sortie audio."
            );
        }

        setStatus(
            getEngine() ===
                "piper"
                ? "Piper Plus — préparation…"
                : "Pocket TTS — préparation…"
        );

        await lireMorceau(
            currentGeneration
        );
    } catch (error) {
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
        getEngine() === "pocket" &&
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

    setStatus(
        "En pause."
    );

    mettreAJourInterface();
}

function reprendreLecture() {
    if (
        !playing ||
        !paused
    ) {
        return;
    }

    paused = false;

    mettreAJourInterface();

    if (
        audioContext &&
        audioContext.state ===
            "suspended"
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
    ).catch(
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
                "AVANT-GARDE — reprise :",
                error
            );
        }
    );
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

    setStatus(
        "Arrêté."
    );

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

    const engine =
        document.getElementById(
            "manifesteReaderEngine"
        );

    if (
        !play ||
        !stop ||
        !engine
    ) {
        console.error(
            "AVANT-GARDE — contrôles du lecteur introuvables."
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

    engine.addEventListener(
        "change",
        function () {
            if (playing) {
                arreterLecture();
            }

            setStatus(
                engine.value ===
                    "piper"
                    ? "Piper Plus sélectionné."
                    : "Pocket TTS sélectionné."
            );
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

if (
    document.readyState ===
    "loading"
) {
    document.addEventListener(
        "DOMContentLoaded",
        demarrerPageManifeste,
        { once: true }
    );
} else {
    demarrerPageManifeste();
}
