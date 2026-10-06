/* =========================================================
   AVANT-GARDE — PAGE MANIFESTE
   Lecteur vocal gratuit — Piper TTS Web
   Voix unique : fr_FR-upmc-medium
========================================================= */

const PIPER_WEB_VOICE = "fr_FR-upmc-medium";
const PIPER_WEB_SPEAKER_ID = 1;
const PIPER_WEB_PACKAGE =
    "https://cdn.jsdelivr.net/npm/@jtsage/piper-tts-web@1.2.0/+esm";

const contentElement =
    document.getElementById("editorialContent");

let piperTTS = null;
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
    if (piperTTS) {
        return piperTTS;
    }

    if (piperLoading) {
        while (piperLoading && !piperTTS) {
            await new Promise(function (resolve) {
                setTimeout(resolve, 100);
            });
        }

        if (piperTTS) {
            return piperTTS;
        }
    }

    piperLoading = true;

    try {
        setStatus("Chargement de Piper…");

        const tts =
            await import(PIPER_WEB_PACKAGE);

        if (
            !tts ||
            typeof tts.predict !== "function"
        ) {
            throw new Error(
                "Le moteur Piper Web n'a pas pu être chargé."
            );
        }

        piperTTS = tts;

        console.log(
            "AVANT-GARDE — Piper Web prêt :",
            PIPER_WEB_VOICE
        );

        setStatus("Piper UPMC Pierre — moteur prêt.");

        return piperTTS;
    } catch (error) {
        piperTTS = null;

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

async function genererEtLireMorceau(id) {
    if (
        !playing ||
        paused ||
        id !== generationId
    ) {
        return;
    }

    if (chunkIndex >= chunks.length) {
        playing = false;
        paused = false;
        chunkIndex = 0;

        libererAudio();
        mettreAJourInterface();
        setStatus("Lecture terminée.");

        return;
    }

    const numero = chunkIndex + 1;

    setStatus(
        "Piper UPMC Pierre — génération " +
        numero +
        "/" +
        chunks.length
    );

    console.log(
        "AVANT-GARDE — Piper UPMC Pierre — génération",
        numero,
        "/",
        chunks.length
    );

    try {
        const tts = await chargerPiper();

        if (
            !playing ||
            paused ||
            id !== generationId
        ) {
            return;
        }

        const wav =
            await tts.predict(
                {
                    text: chunks[chunkIndex],
                    voiceId: PIPER_WEB_VOICE
                },
                function (progress) {
                    if (
                        progress &&
                        Number.isFinite(progress.loaded) &&
                        Number.isFinite(progress.total) &&
                        progress.total > 0
                    ) {
                        setStatus(
                            "Piper UPMC Pierre — téléchargement " +
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

        if (
            !playing ||
            paused ||
            id !== generationId
        ) {
            return;
        }

        if (!(wav instanceof Blob)) {
            throw new Error(
                "Piper n'a pas renvoyé un fichier audio valide."
            );
        }

        libererAudio();

        activeObjectUrl =
            URL.createObjectURL(wav);

        audioElement =
            new Audio(activeObjectUrl);

        audioElement.preload = "auto";

        audioElement.onended =
            function () {
                if (
                    id !== generationId ||
                    !playing ||
                    paused
                ) {
                    return;
                }

                chunkIndex++;

                genererEtLireMorceau(id)
                    .catch(function (error) {
                        afficherErreurLecture(error);
                    });
            };

        audioElement.onerror =
            function () {
                afficherErreurLecture(
                    new Error(
                        "Le navigateur n'a pas pu lire l'audio Piper."
                    )
                );
            };

        setStatus(
            "Piper UPMC Pierre — lecture " +
            numero +
            "/" +
            chunks.length
        );

        await audioElement.play();

    } catch (error) {
        if (
            id !== generationId ||
            !playing
        ) {
            return;
        }

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
            "Piper UPMC Pierre — préparation…"
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
            "Piper UPMC Pierre — lecture " +
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
        "AVANT-GARDE — manifeste.js chargé — Piper UPMC Pierre."
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
