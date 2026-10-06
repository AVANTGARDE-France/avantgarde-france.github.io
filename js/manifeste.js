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
let audioUnlocked = false;

let currentGeneration = 0;
let chunks = [];
let chunkIndex = 0;

let playing = false;
let paused = false;
let loading = false;
let initialisationFaite = false;

let piperPhonemizerPromise = null;

/* =========================================================
   Utilitaire de sécurité pour les chargements WASM / réseau.
   Évite qu'une promesse de dépendance reste bloquée indéfiniment.
========================================================= */
function avecTimeout(promesse, delai, message) {
    let timer = null;

    const timeout = new Promise(function (_, reject) {
        timer = setTimeout(function () {
            reject(new Error(message || "Opération trop longue."));
        }, delai);
    });

    return Promise.race([promesse, timeout]).finally(function () {
        if (timer !== null) {
            clearTimeout(timer);
        }
    });
}

const PIPER_PHONEMIZER_JS =
    "https://cdn.jsdelivr.net/npm/@diffusionstudio/piper-wasm@1.0.0/build/piper_phonemize.js";

const PIPER_PHONEMIZER_BASE =
    "https://cdn.jsdelivr.net/npm/@diffusionstudio/piper-wasm@1.0.0/build/piper_phonemize";

async function chargerPiperPhonemizer() {

    if (piperPhonemizerPromise) {
        return piperPhonemizerPromise;
    }

    piperPhonemizerPromise = new Promise(function (resolve, reject) {

        if (
            window.createPiperPhonemize &&
            typeof window.createPiperPhonemize === "function"
        ) {
            resolve(window.createPiperPhonemize);
            return;
        }

        const script = document.createElement("script");

        script.src = PIPER_PHONEMIZER_JS;
        script.async = true;

        script.onload = function () {

            if (
                window.createPiperPhonemize &&
                typeof window.createPiperPhonemize === "function"
            ) {
                resolve(window.createPiperPhonemize);
            } else {
                reject(
                    new Error(
                        "Piper : factory WASM introuvable après chargement."
                    )
                );
            }
        };

        script.onerror = function () {
            reject(
                new Error(
                    "Piper : impossible de charger le phonémiseur WASM."
                )
            );
        };

        document.head.appendChild(script);
    });

    try {
        return await avecTimeout(
            piperPhonemizerPromise,
            30000,
            "Piper : chargement WASM trop long."
        );
    } catch (error) {
        piperPhonemizerPromise = null;
        throw error;
    }
}

async function phonemiserFrancais(texte) {

    setStatus(
        "Initialisation du phonémiseur français…"
    );

    const factory =
        await chargerPiperPhonemizer();

    setStatus(
        "Phonémisation française…"
    );

    const texteSource =
        String(texte || "")
            .replace(/\\s+/g, " ")
            .trim();

    if (!texteSource) {
        throw new Error(
            "Piper : texte français vide."
        );
    }

    const resultat =
        await avecTimeout(
            new Promise(function (resolve, reject) {

                let termine = false;

                function terminerAvecErreur(error) {
                    if (termine) return;
                    termine = true;
                    reject(error);
                }

                function terminerAvecResultat(value) {
                    if (termine) return;
                    termine = true;
                    resolve(value);
                }

                factory({

                    print: function (ligne) {

                        try {

                            const objet =
                                JSON.parse(String(ligne));

                            if (
                                objet &&
                                Array.isArray(objet.phonemes)
                            ) {
                                terminerAvecResultat(objet);
                            }

                        } catch (error) {

                            terminerAvecErreur(
                                new Error(
                                    "Piper : sortie WASM invalide."
                                )
                            );
                        }
                    },

                    printErr: function (ligne) {

                        const message =
                            String(ligne || "").trim();

                        if (message) {
                            console.warn(
                                "AVANT-GARDE — Piper :",
                                message
                            );
                        }
                    },

                    locateFile: function (fichier) {

                        if (
                            String(fichier).endsWith(".wasm")
                        ) {
                            return (
                                PIPER_PHONEMIZER_BASE +
                                ".wasm"
                            );
                        }

                        if (
                            String(fichier).endsWith(".data")
                        ) {
                            return (
                                PIPER_PHONEMIZER_BASE +
                                ".data"
                            );
                        }

                        return fichier;
                    }

                }).then(function (module) {

                    try {

                        module.callMain([
                            "-l",
                            "fr-fr",
                            "--input",
                            JSON.stringify([
                                {
                                    text: texteSource
                                }
                            ]),
                            "--espeak_data",
                            "/espeak-ng-data"
                        ]);

                    } catch (error) {

                        terminerAvecErreur(error);
                    }

                }).catch(function (error) {

                    terminerAvecErreur(error);
                });
            }),
            45000,
            "Piper : phonémisation française trop longue."
        );

    const phonemes =
        resultat.phonemes
            .map(function (element) {

                return Array.isArray(element)
                    ? element.join("")
                    : String(element);

            })
            .join(" ")
            .trim();

    if (!phonemes) {
        throw new Error(
            "Piper : aucun phonème français retourné."
        );
    }

    console.log(
        "AVANT-GARDE — phonèmes Piper :",
        phonemes
    );

    return phonemes;
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



function appareilIOSOuSafariMobile() {
    const ua = navigator.userAgent || "";
    return /iPhone|iPad|iPod/i.test(ua) ||
        (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1);
}

function generationCouranteValide() {
    return playing && !paused;
}

/*
   Déverrouillage audio iOS/Safari.
   Il doit être exécuté SYNCHRONIQUEMENT dans le geste utilisateur.
   On crée un micro-buffer silencieux et on le joue immédiatement.
   Le contexte reste ensuite ouvert pendant toute la lecture.
*/
function deverrouillerAudioDansLeGeste() {
    try {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }

        const maintenant = audioContext.currentTime;
        const buffer = audioContext.createBuffer(1, 1, audioContext.sampleRate);
        const source = audioContext.createBufferSource();

        source.buffer = buffer;
        source.connect(audioContext.destination);
        source.start(maintenant);

        audioUnlocked = true;

        if (audioContext.state === "suspended") {
            audioContext.resume().catch(function (error) {
                console.warn("AVANT-GARDE — AudioContext resume :", error);
            });
        }

        return true;
    } catch (error) {
        audioUnlocked = false;
        console.error("AVANT-GARDE — déverrouillage audio :", error);
        return false;
    }
}

function attendreVoixIOS() {
    return new Promise(function (resolve) {
        if (!("speechSynthesis" in window)) {
            resolve([]);
            return;
        }

        const synth = window.speechSynthesis;
        const deja = synth.getVoices() || [];

        /*
           Sur Safari/iOS, getVoices() peut être vide au premier appel.
           On attend voiceschanged, mais on ne dépend PAS d'un objet Voice
           pour lancer la lecture : l'utterance utilise simplement lang=fr-FR.
        */
        if (deja.length) {
            resolve(deja);
            return;
        }

        let termine = false;

        function finir() {
            if (termine) return;
            termine = true;
            if (synth.removeEventListener) {
                synth.removeEventListener("voiceschanged", finir);
            }
            resolve(synth.getVoices() || []);
        }

        if (synth.addEventListener) {
            synth.addEventListener("voiceschanged", finir, { once: true });
        }

        window.setTimeout(finir, 1200);
    });
}

function lectureNativeFrancaise(generation) {
    return new Promise(function (resolve, reject) {
        const SpeechUtterance = window.SpeechSynthesisUtterance;

        if (
            !window.speechSynthesis ||
            typeof SpeechUtterance !== "function"
        ) {
            reject(new Error("iOS : variable SpeechSynthesisUtterance indisponible."));
            return;
        }

        const synth = window.speechSynthesis;

        try {
            synth.cancel();
            synth.resume();
        } catch (_) {}

        let index = 0;
        let termine = false;

        function terminer() {
            if (termine) return;
            termine = true;
            lectureNativeActive = false;
            resolve();
        }

        function suivant() {
            if (termine) return;

            if (
                !playing ||
                paused ||
                generation !== currentGeneration ||
                index >= chunks.length
            ) {
                terminer();
                return;
            }

            const texte = String(chunks[index] || "").trim();

            if (!texte) {
                index++;
                suivant();
                return;
            }

            index++;

            /*
               POINT IMPORTANT :
               Nous ne définissons volontairement PAS utterance.voice.

               Safari/iOS peut conserver une référence de voix devenue
               invalide entre getVoices() et speak(), ce qui provoque
               précisément les erreurs du type "Can't find voice".

               lang=fr-FR suffit à demander à iOS une synthèse française.
            */
            const utterance = new SpeechUtterance(texte);

            utterance.lang = "fr-FR";
            utterance.rate = 0.92;
            utterance.pitch = 1;
            utterance.volume = 1;

            utterance.onstart = function () {
                lectureNativeActive = true;
                setStatus(
                    "Lecture française… " +
                    index +
                    "/" +
                    chunks.length
                );
            };

            utterance.onend = function () {
                if (
                    !playing ||
                    paused ||
                    generation !== currentGeneration
                ) {
                    terminer();
                    return;
                }

                window.setTimeout(suivant, 40);
            };

            utterance.onerror = function (event) {
                const code =
                    event && event.error
                        ? String(event.error)
                        : "erreur inconnue";

                console.error(
                    "AVANT-GARDE — speechSynthesis iOS :",
                    code
                );

                /*
                   "interrupted" / "canceled" sont normaux lorsqu'un
                   utilisateur arrête ou met en pause la lecture.
                */
                if (
                    code === "interrupted" ||
                    code === "canceled" ||
                    !playing ||
                    paused ||
                    generation !== currentGeneration
                ) {
                    terminer();
                    return;
                }

                reject(
                    new Error(
                        "iOS speechSynthesis : " + code
                    )
                );
            };

            console.log(
                "AVANT-GARDE — iOS : speak morceau",
                index,
                "/",
                chunks.length,
                "lang=fr-FR"
            );

            /*
               speak() est appelé directement sans attendre le chargement
               d'une voix ni lui affecter un objet SpeechSynthesisVoice.
            */
            try {
                synth.speak(utterance);
            } catch (error) {
                reject(error);
            }
        }

        /* Précharge éventuellement la liste des voix, sans l'utiliser. */
        attendreVoixIOS()
            .catch(function () { return []; })
            .finally(function () {
                if (!termine) suivant();
            });
    });
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

        /*
           IMPORTANT iOS / Safari :
           AudioContext doit être créé et réveillé directement dans
           le geste utilisateur. Si on attend chargerKokoro() avant
           de le créer, le navigateur peut considérer que le geste
           utilisateur est terminé et laisser resume() bloqué.
        */
        /*
           IMPORTANT : cette fonction est appelée avant toute opération
           asynchrone et déverrouille WebAudio dans le clic/tap utilisateur.
        */
        if (!deverrouillerAudioDansLeGeste()) {
            throw new Error("Le navigateur n'a pas autorisé la sortie audio.");
        }

        setStatus("Démarrage de la lecture…");

        /*
           IMPORTANT :
           Sur iOS, nous n'utilisons plus speechSynthesis.

           La voix native Safari donne une diction de type TTS classique
           (mot à mot, intonation pauvre, ponctuation parfois mal rendue).
           Le lecteur utilise donc désormais EXACTEMENT le même moteur
           neuronal Kokoro + ff_siwis sur iPhone/iPad et sur ordinateur.

           Le français est phonémisé localement par ephone/eSpeak NG,
           puis envoyé au modèle Kokoro.
        */
        if (appareilIOSOuSafariMobile()) {
            setStatus("Préparation de la voix Kokoro…");
            console.log("AVANT-GARDE — iOS : Kokoro français local");
        }

        await chargerKokoro();

        setStatus("Préparation de la voix française…");

        /*
           Après un chargement asynchrone, Safari peut avoir resuspendu
           l'AudioContext. On tente donc explicitement de le réveiller
           juste avant la première sortie audio.
        */
        if (audioContext && audioContext.state === "suspended") {
            try {
                await audioContext.resume();
            } catch (error) {
                console.warn(
                    "AVANT-GARDE — reprise AudioContext après chargement :",
                    error
                );
            }
        }

        await lireMorceau(currentGeneration);
    } catch (error) {
        playing = false;
        paused = false;
        mettreAJourInterface();
        setStatus(
            error && error.message && error.message.includes("initialisation WASM")
                ? "ephone bloqué : WASM français non initialisé."
                : "Erreur : " + (error && error.message ? error.message : "lecture impossible.")
        );
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

    setStatus("Phonémisation française…");
    console.log("AVANT-GARDE — génération du morceau", chunkIndex + 1, "/", chunks.length);
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
    /*
       Ne pas suspendre AudioContext sur iOS.
       Une suspension volontaire peut recréer une barrière d'activation
       lorsque l'utilisateur appuie ensuite sur « Reprendre ».
    */
    setStatus("En pause");
    mettreAJourInterface();
}

function reprendreLecture() {
    if (!playing || !paused) return;
    paused = false;
    if (audioContext && audioContext.state === "suspended") {
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

function extraireTexte() {
    if (!contentElement) return "";

    const clone = contentElement.cloneNode(true);

    clone.querySelectorAll(
        "script, style, noscript, #manifesteReader, .manifeste-reader, button"
    ).forEach(function (element) {
        element.remove();
    });

    return String(clone.innerText || clone.textContent || "")
        .replace(/\\u00a0/g, " ")
        .replace(/[ \\t]+/g, " ")
        .replace(/\\n{3,}/g, "\\n\\n")
        .trim();
}

function construireMorceaux(texte) {
    const limite = 850;
    const paragraphes = String(texte || "")
        .split(/\\n{2,}/)
        .map(function (p) {
            return p.replace(/\\s+/g, " ").trim();
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

        const phrases = paragraphe.match(/[^.!?…]+[.!?…]+(?:["»”']+)?|[^.!?…]+$/g) || [paragraphe];

        phrases.forEach(function (phrase) {
            const propre = phrase.trim();
            if (!propre) return;

            const test = courant
                ? courant + " " + propre
                : propre;

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

    const texte = extraireTexte();
    if (!texte) {
        setStatus("Texte du manifeste introuvable.");
        console.error("AVANT-GARDE — aucun texte du manifeste trouvé.");
    }
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", demarrerPageManifeste, { once: true });
} else {
    demarrerPageManifeste();
}
