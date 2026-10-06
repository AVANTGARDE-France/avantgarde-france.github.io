/* =========================================================
   AVANT-GARDE — PAGE MANIFESTE
   Lecteur vocal gratuit — Piper TTS Web
   Voix unique : Tom
========================================================= */

const PIPER_WEB_VOICE = "fr_FR-tom-medium";
const PIPER_WEB_SPEAKER_ID = 0;
const PIPER_PLAYBACK_RATE = 1.2;

const PIPER_WEB_BUNDLE =
    "https://cdn.jsdelivr.net/npm/@jtsage/piper-tts-web@1.2.0/dist/piper-tts-web.js";

const PIPER_WEB_CHUNK =
    "https://cdn.jsdelivr.net/npm/@jtsage/piper-tts-web@1.2.0/dist/piper-CLXk3wTk.js";

const PIPER_ONNX =
    "https://esm.sh/onnxruntime-web@1.22.0";

const contentElement =
    document.getElementById("editorialContent");

let piperEngine = null;
let piperLoading = false;

let audioElement = null;
let activeObjectUrl = null;

let chunks = [];
let chunkIndex = 0;

let playing = false;
let paused = false;
let generationId = 0;

function setStatus(message) {
    const status =
        document.getElementById("manifesteReaderStatus");

    if (status) {
        status.textContent = message;
    }
}

function mettreAJourInterface() {
    const button =
        document.getElementById("manifesteReaderPlay");

    const label =
        document.getElementById("manifesteReaderPlayLabel");

    if (!button) return;

    if (playing && !paused) {
        if (label) label.textContent = "Pause";

        button.setAttribute(
            "aria-label",
            "Mettre en pause"
        );
    } else if (paused) {
        if (label) label.textContent = "Reprendre";

        button.setAttribute(
            "aria-label",
            "Reprendre la lecture"
        );
    } else {
        if (label) label.textContent = "Écouter";

        button.setAttribute(
            "aria-label",
            "Écouter le manifeste"
        );
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
            const propre = phrase.trim();

            if (!propre) return;

            if (propre.length > limite) {
                if (courant) {
                    resultat.push(courant);
                    courant = "";
                }

                for (
                    let i = 0;
                    i < propre.length;
                    i += limite
                ) {
                    resultat.push(
                        propre
                            .slice(i, i + limite)
                            .trim()
                    );
                }

                return;
            }

            const candidat =
                courant
                    ? courant + " " + propre
                    : propre;

            if (candidat.length <= limite) {
                courant = candidat;
            } else {
                if (courant) {
                    resultat.push(courant);
                }

                courant = propre;
            }
        });

        if (courant) {
            resultat.push(courant);
        }
    });

    return resultat.filter(function (morceau) {
        return morceau && morceau.length > 1;
    });
}

async function chargerPiper() {
    if (piperEngine) {
        return piperEngine;
    }

    if (piperLoading) {
        while (piperLoading && !piperEngine) {
            await new Promise(function (resolve) {
                setTimeout(resolve, 100);
            });
        }

        if (piperEngine) {
            return piperEngine;
        }
    }

    piperLoading = true;

    try {
        setStatus("Chargement du moteur vocal…");

        /*
         * @jtsage/piper-tts-web 1.2.0 charge correctement
         * son moteur phonemizer depuis @diffusionstudio.
         *
         * Tom est une voix mono-locuteur : speaker 0 est conservé.
         */
        const response = await fetch(PIPER_WEB_BUNDLE);

        if (!response.ok) {
            throw new Error(
                "Impossible de charger le moteur Piper (" +
                response.status +
                ")."
            );
        }

        let source = await response.text();

        source = source.replace(
            'import("./piper-CLXk3wTk.js")',
            'import("' + PIPER_WEB_CHUNK + '")'
        );

        source = source.replace(
            'import("onnxruntime-web")',
            'import("' + PIPER_ONNX + '")'
        );

        source = source.replace(
            'const speakerId = 0;',
            'const speakerId = 0;'
        );

        const moduleUrl = URL.createObjectURL(
            new Blob(
                [source],
                { type: "text/javascript" }
            )
        );

        try {
            const piper = await import(moduleUrl);

            if (
                !piper ||
                typeof piper.TtsSession !== "function" ||
                typeof piper.CachedFileReader !== "function"
            ) {
                throw new Error(
                    "Le moteur Piper Web n'a pas pu être initialisé."
                );
            }

            const fileReader =
                new piper.CachedFileReader({
                    progress: function (progress) {
                        if (
                            progress &&
                            progress.total
                        ) {
                            const pourcentage =
                                Math.round(
                                    progress.loaded *
                                    100 /
                                    progress.total
                                );

                            setStatus(
                                "Chargement de la voix Tom… " +
                                pourcentage +
                                "%"
                            );
                        }
                    }
                });

            /* iOS Safari : force ONNX Runtime Web en WASM CPU mono-thread. */
        if (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
            (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)) {
            try {
                const ort = await import(PIPER_ONNX);
                if (ort && ort.env && ort.env.wasm) {
                    ort.env.wasm.numThreads = 1;
                    ort.env.wasm.proxy = false;
                }
                console.log("AVANT-GARDE — iOS : ONNX Runtime en WASM mono-thread.");
            } catch (iosError) {
                console.warn("AVANT-GARDE — configuration ONNX iOS non appliquée :", iosError);
            }
        }

        const iosDevice =
            /iPad|iPhone|iPod/.test(navigator.userAgent) ||
            (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

        const sessionOptions = {
            voiceId: PIPER_WEB_VOICE,
            fileReader: fileReader,
            logger: function (message) {
                console.log(
                    "AVANT-GARDE — Piper :",
                    message
                );
            }
        };

        if (iosDevice) {
            sessionOptions.allowLocalModels = false;
            sessionOptions.fallbackStrategy = "cdn";
            sessionOptions.wasmPaths = {
                onnxWasm: "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.22.0/dist/",
                piperData: "https://cdn.jsdelivr.net/npm/@diffusionstudio/piper-wasm@1.0.0/build/piper_phonemize.data",
                piperWasm: "https://cdn.jsdelivr.net/npm/@diffusionstudio/piper-wasm@1.0.0/build/piper_phonemize.wasm"
            };
            console.log("AVANT-GARDE — iOS : Piper CDN-only, sans modèle local.");
        }

        const session = new piper.TtsSession(sessionOptions);

        setStatus(
            "Initialisation de la voix Tom…"
        );
            await session.waitReady;

            piperEngine = {
                predict: function (texte) {
                    return session.predict(texte);
                }
            };

            console.log(
                "AVANT-GARDE — Piper Web prêt : Tom (Tom)"
            );

            setStatus(
                "Piper Tom — moteur prêt."
            );

            return piperEngine;

        } finally {
            URL.revokeObjectURL(moduleUrl);
        }

    } catch (error) {
        piperEngine = null;

        console.error(
            "AVANT-GARDE — chargement Piper :",
            error
        );

        throw error;

    } finally {
        piperLoading = false;
    }
}

function libererAudio() {
    if (audioElement) {
        try {
            audioElement.pause();
        } catch (_) {}

        audioElement.onended = null;
        audioElement.onerror = null;
        audioElement = null;
    }

    if (activeObjectUrl) {
        URL.revokeObjectURL(activeObjectUrl);
        activeObjectUrl = null;
    }
}

const buffers = new Map();
let generationPromises = new Map();

async function genererMorceau(index, id) {
    if (index >= chunks.length || id !== generationId) return null;

    if (buffers.has(index)) return buffers.get(index);
    if (generationPromises.has(index)) return generationPromises.get(index);

    const promise = (async function () {
        const engine = await chargerPiper();
        if (id !== generationId) return null;

        const response = await engine.predict(chunks[index]);
        if (id !== generationId) return null;

        const audioBlob = response instanceof Blob
            ? response
            : (response && response.file instanceof Blob ? response.file : null);

        if (!audioBlob) {
            throw new Error("Piper n'a pas renvoyé un fichier audio valide.");
        }

        const url = URL.createObjectURL(audioBlob);
        buffers.set(index, { blob: audioBlob, url: url });
        return buffers.get(index);
    })();

    generationPromises.set(index, promise);

    try {
        return await promise;
    } finally {
        generationPromises.delete(index);
    }
}

async function prechargerMorceauSuivant(index, id) {
    if (index >= chunks.length || id !== generationId) return;

    try {
        await genererMorceau(index, id);
    } catch (error) {
        console.error("AVANT-GARDE — préchargement Piper :", error);
    }
}

async function genererEtLireMorceau(id) {
    if (!playing || paused || id !== generationId) return;

    if (chunkIndex >= chunks.length) {
        playing = false;
        paused = false;
        chunkIndex = 0;
        libererAudio();
        buffers.forEach(function (buffer) {
            URL.revokeObjectURL(buffer.url);
        });
        buffers.clear();
        generationPromises.clear();
        mettreAJourInterface();
        setStatus("Lecture terminée.");
        return;
    }

    const numero = chunkIndex + 1;
    setStatus("Piper Tom — génération " + numero + "/" + chunks.length);
    console.log("AVANT-GARDE — Piper Tom — génération", numero, "/", chunks.length);

    try {
        const buffer = await genererMorceau(chunkIndex, id);

        if (!buffer || !playing || paused || id !== generationId) return;

        const indexLu = chunkIndex;
        libererAudio();

        activeObjectUrl = buffer.url;
        audioElement = new Audio();
        audioElement.preload = "auto";
        audioElement.playbackRate = PIPER_PLAYBACK_RATE;
        audioElement.src = activeObjectUrl;

        audioElement.onended = function () {
            if (id !== generationId || !playing || paused) return;

            URL.revokeObjectURL(buffer.url);
            buffers.delete(indexLu);
            chunkIndex = indexLu + 1;

            genererEtLireMorceau(id).catch(function (error) {
                afficherErreurLecture(error);
            });
        };

        audioElement.onerror = function () {
            afficherErreurLecture(new Error("Le navigateur n'a pas pu lire l'audio Piper."));
        };

        setStatus("Piper Tom — lecture " + numero + "/" + chunks.length);

        // Double buffer : le morceau suivant est généré pendant la lecture.
        prechargerMorceauSuivant(indexLu + 1, id);

        await audioElement.play();

    } catch (error) {
        if (id !== generationId || !playing) return;
        afficherErreurLecture(error);
    }
}

function afficherErreurLecture(error) {
    playing = false;
    paused = false;

    libererAudio();
    mettreAJourInterface();

    const message =
        error &&
        error.message
            ? error.message
            : "lecture impossible.";

    setStatus("Erreur : " + message);

    console.error(
        "AVANT-GARDE — lecteur Piper :",
        error
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
            construireMorceaux(texte);

        if (!chunks.length) {
            throw new Error(
                "Aucun texte à lire."
            );
        }

        generationId++;
        chunkIndex = 0;

        playing = true;
        paused = false;

        mettreAJourInterface();

        setStatus(
            "Piper Tom — préparation…"
        );

        await genererEtLireMorceau(
            generationId
        );

    } catch (error) {
        afficherErreurLecture(error);
    }
}

function pauseLecture() {
    if (
        !playing ||
        paused
    ) {
        return;
    }

    paused = true;

    if (audioElement) {
        audioElement.pause();
    }

    setStatus("En pause.");
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

    if (audioElement) {
        audioElement.play().catch(function (error) {
            afficherErreurLecture(error);
        });

        setStatus(
            "Piper Tom — lecture " +
            (chunkIndex + 1) +
            "/" +
            chunks.length
        );

        return;
    }

    genererEtLireMorceau(
        generationId
    ).catch(function (error) {
        afficherErreurLecture(error);
    });
}

function arreterLecture() {
    generationId++;

    playing = false;
    paused = false;
    chunkIndex = 0;

    libererAudio();
    mettreAJourInterface();

    setStatus("Arrêté.");
}

function installerInteractionsLecteur() {
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
            "AVANT-GARDE — contrôles du lecteur introuvables."
        );

        return;
    }

    play.addEventListener(
        "click",
        basculerLecture
    );

    stop.addEventListener(
        "click",
        arreterLecture
    );

    mettreAJourInterface();

    if (!extraireTexte()) {
        setStatus(
            "Texte du manifeste introuvable."
        );

        console.error(
            "AVANT-GARDE — aucun texte du manifeste trouvé."
        );
    }
}

function demarrerPageManifeste() {
    console.log(
        "AVANT-GARDE — manifeste.js chargé — Piper Tom."
    );

    installerInteractionsLecteur();
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
