/* =========================================================
   AVANT-GARDE — PAGE MANIFESTE
   Lecteur vocal gratuit — Piper Plus uniquement
========================================================= */

const PIPER_PLUS_MODEL =
    "ayousanz/piper-plus-tsukuyomi-chan";
const PIPER_PLUS_SAMPLE_RATE = 22050;
const PIPER_PLUS_SPEAKER_EMBEDDING_DIM = 256;

const contentElement =
    document.getElementById("editorialContent");

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

        const ortModule =
            await import(
                "onnxruntime-web"
            );

        /*
           Piper Plus 0.7.0 construit le masque speaker_embedding_mask
           en [1]. Le modèle Tsukuyomi-chan issu de PR #320 attend
           explicitement [1,1]. On corrige uniquement ce tenseur avant
           de le remettre à Piper Plus, sans modifier les autres tenseurs.
        */
        const OriginalTensor =
            ortModule.Tensor;

        const ort =
            new Proxy(
                ortModule,
                {
                    get: function (target, property) {
                        if (
                            property === "Tensor"
                        ) {
                            return function (
                                type,
                                data,
                                dims
                            ) {
                                if (
                                    type === "int64" &&
                                    data instanceof BigInt64Array &&
                                    dims &&
                                    dims.length === 1 &&
                                    dims[0] === 1 &&
                                    data.length === 1 &&
                                    (
                                        data[0] === 0n ||
                                        data[0] === 1n
                                    )
                                ) {
                                    return new OriginalTensor(
                                        type,
                                        data,
                                        [1, 1]
                                    );
                                }

                                return new OriginalTensor(
                                    type,
                                    data,
                                    dims
                                );
                            };
                        }

                        return Reflect.get(
                            target,
                            property
                        );
                    }
                }
            );

        if (
            !ortModule ||
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
    generationEnCours = true;

    try {
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

        const speakerEmbedding =
            new Float32Array(
                PIPER_PLUS_SPEAKER_EMBEDDING_DIM
            );

        const result =
            await tts.synthesize(
                texte,
                {
                    language: "fr",
                    noiseScale: 0.667,
                    lengthScale: 1.5,
                    noiseW: 0.8,
                    speakerEmbedding: speakerEmbedding
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

    setStatus(
        "Piper — génération " +
        numero +
        "/" +
        chunks.length
    );

    console.log(
        "AVANT-GARDE — génération piper",
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
        "Piper — lecture " +
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
            "Piper Plus — préparation…"
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

    setStatus(
        "Arrêté."
    );

    mettreAJourInterface();
}

function supprimerChoixMoteur() {
    const selecteurs = [
        "#manifesteReaderEngine",
        "#manifesteReaderVoice",
        ".manifeste-reader-engine",
        ".manifeste-reader-choice",
        ".manifeste-reader-options",
        ".manifeste-reader-select",
        "[data-reader-engine]",
        "[data-tts-engine]"
    ];

    selecteurs.forEach(function (selecteur) {
        document
            .querySelectorAll(selecteur)
            .forEach(function (element) {
                if (
                    element.id === "manifesteReaderPlay" ||
                    element.id === "manifesteReaderStop" ||
                    element.id === "manifesteReaderStatus"
                ) {
                    return;
                }

                const parent =
                    element.closest("label") ||
                    element.closest(
                        ".manifeste-reader-engine, .manifeste-reader-choice, .manifeste-reader-options, .manifeste-reader-select"
                    );

                if (parent) {
                    parent.remove();
                } else {
                    element.remove();
                }
            });
    });

    /*
       Dernier filet de sécurité : si un ancien lecteur injecte
       simplement un <select> dans la zone du lecteur, on retire
       le select et son libellé sans toucher aux boutons.
    */
    document
        .querySelectorAll(
            "#manifesteReader select, .manifeste-reader select"
        )
        .forEach(function (select) {
            const parent =
                select.closest("label") ||
                select.closest(
                    ".manifeste-reader-engine, .manifeste-reader-choice, .manifeste-reader-options, .manifeste-reader-select"
                );

            if (parent) {
                parent.remove();
            } else {
                select.remove();
            }
        });
}

function installerInteractionsDirectesLecteur() {
    supprimerChoixMoteur();

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

    /*
       Le lecteur peut être injecté après le chargement du script.
       On surveille donc brièvement le DOM pour supprimer tout ancien
       sélecteur de moteur sans toucher aux boutons ni au statut.
    */
    const observer =
        new MutationObserver(function () {
            supprimerChoixMoteur();
        });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    setTimeout(function () {
        observer.disconnect();
        supprimerChoixMoteur();
    }, 5000);

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
