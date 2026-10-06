/* =========================================================
   AVANT-GARDE — PAGE MANIFESTE

   js/manifeste.js

   Le manifeste est désormais pré-rendu directement
   dans manifeste.html.

   Le HTML public est donc lisible par :
   - moteurs de recherche
   - robots
   - crawlers
   - systèmes d'IA

   Ce script ne remplace le contenu que si le HTML
   pré-rendu est absent.
========================================================= */


import { supabase } from "./supabase.js";


const SLUG =
    "manifeste";


const titleElement =
    document.getElementById(
        "editorialTitle"
    );


const contentElement =
    document.getElementById(
        "editorialContent"
    );


/* =========================================================
   VERIFICATION DU PRE-RENDU
========================================================= */

function contenuPreRenduDisponible() {

    if (!contentElement) {
        return false;
    }


    const html =
        contentElement.innerHTML
            ?.trim();


    if (!html) {
        return false;
    }


    return (
        !contentElement.querySelector(
            ".editorial-loading"
        )
    );

}


/* =========================================================
   CHARGEMENT DE SECOURS
========================================================= */

async function chargerManifeste() {

    if (!contentElement) {
        return;
    }


    /*
       Si le contenu est déjà présent dans le HTML,
       on ne fait absolument rien.

       C'est le fonctionnement normal.
    */

    if (
        contenuPreRenduDisponible()
    ) {

        initialiserLecteurManifeste();

        return;

    }


    /*
       Fallback uniquement si le fichier HTML
       a été ouvert sans contenu pré-rendu.
    */

    try {

        const {
            data,
            error
        } =
            await supabase
                .from(
                    "other_contents"
                )
                .select(
                    "id, slug, titre, contenu_html, updated_at"
                )
                .eq(
                    "slug",
                    SLUG
                )
                .order(
                    "id",
                    {
                        ascending: true
                    }
                )
                .limit(1);


        if (error) {
            throw error;
        }


        const contenu =
            Array.isArray(data) &&
            data.length
                ? data[0]
                : null;


        if (!contenu) {

            afficherErreur(
                "Le manifeste n'est pas encore disponible."
            );

            return;

        }


        if (
            titleElement &&
            contenu.titre
        ) {

            titleElement.textContent =
                contenu.titre;

        }


        contentElement.innerHTML =
            contenu.contenu_html || "";

        initialiserLecteurManifeste();


        if (
            !contenu.contenu_html ||
            !contenu.contenu_html.trim()
        ) {

            afficherErreur(
                "Le manifeste n'est pas encore disponible."
            );

        }

    }
    catch (error) {

        console.error(
            "AVANT-GARDE — MANIFESTE :",
            error
        );


        afficherErreur(
            "Impossible de charger le manifeste."
        );

    }

}


/* =========================================================
   ERREUR
========================================================= */

function afficherErreur(
    message
) {

    if (!contentElement) {
        return;
    }


    contentElement.innerHTML =
        "";


    const element =
        document.createElement(
            "p"
        );


    element.className =
        "editorial-error";


    element.textContent =
        message;


    contentElement.appendChild(
        element
    );

}


/* =========================================================
   INITIALISATION
========================================================= */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        chargerManifeste,
        {
            once: true
        }
    );

}
else {

    chargerManifeste();

}

/* =========================================================
   LECTEUR VOCAL DU MANIFESTE
========================================================= */

let lecteurInitialise = false;
let syntheseVocale = null;
let voixSelectionnee = null;
let chapitres = [];
let chapitreActuel = 0;
let morceauActuel = 0;
let enLecture = false;
let enPause = false;


function initialiserLecteurManifeste() {

    if (lecteurInitialise) return;

    const reader = document.getElementById("manifesteReader");

    if (!reader || !contentElement) return;

    if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) {
        reader.hidden = true;
        return;
    }

    syntheseVocale = window.speechSynthesis;

    /*
       Certains navigateurs, notamment Chromium/Edge, ne fournissent
       les voix qu'après le chargement de la page. On prépare donc la
       liste immédiatement puis à nouveau avec voiceschanged.
    */
    preparerVoix();

    chapitres = Array.from(
        contentElement.querySelectorAll(
            ".manifeste > .manifeste-content > .manifeste-section, .manifeste > .manifeste-content > .manifeste-conclusion"
        )
    )
    .map(function (element, index) {
        const texte = extraireTexteManifeste(element);
        return {
            element: element,
            index: index,
            morceaux: decouperTexteManifeste(texte)
        };
    })
    .filter(function (chapitre) {
        return chapitre.morceaux.length > 0;
    });

    if (!chapitres.length) {
        reader.hidden = true;
        return;
    }

    const playButton = document.getElementById("manifesteReaderPlay");
    const stopButton = document.getElementById("manifesteReaderStop");
    const previousButton = document.getElementById("manifesteReaderPrevious");
    const nextButton = document.getElementById("manifesteReaderNext");

    if (playButton) playButton.addEventListener("click", basculerLecture);
    if (stopButton) stopButton.addEventListener("click", arreterLecture);
    if (previousButton) previousButton.addEventListener("click", chapitrePrecedent);
    if (nextButton) nextButton.addEventListener("click", chapitreSuivant);

    syntheseVocale.addEventListener("voiceschanged", preparerVoix);
    preparerVoix();
    mettreAJourInterface();

    lecteurInitialise = true;
}


function extraireTexteManifeste(element) {

    const clone = element.cloneNode(true);

    clone.querySelectorAll(
        "script, style, button, [aria-hidden='true']"
    ).forEach(function (element) {
        element.remove();
    });

    return (clone.innerText || clone.textContent || "")
        .replace(/\s+/g, " ")
        .trim();
}


function decouperTexteManifeste(texte) {

    if (!texte) return [];

    const phrases = texte
        .split(/(?<=[.!?…])\s+/)
        .map(function (phrase) {
            return phrase.trim();
        })
        .filter(Boolean);

    const morceaux = [];
    let courant = "";

    phrases.forEach(function (phrase) {

        if (courant && courant.length + phrase.length + 1 > 950) {
            morceaux.push(courant);
            courant = "";
        }

        courant = courant
            ? courant + " " + phrase
            : phrase;
    });

    if (courant) morceaux.push(courant);

    return morceaux;
}


/* =========================================================
   VOIX CHOISIE PAR AVANT-GARDE
========================================================= */

function preparerVoix() {

    if (!syntheseVocale) return;

    const voix = syntheseVocale.getVoices();

    if (!voix.length) return;

    const francaises = voix.filter(function (voice) {
        return /^fr(-|_|$)/i.test(voice.lang);
    });

    if (!francaises.length) return;

    function scoreVoix(voice) {

        const nom = voice.name.toLowerCase();
        const langue = voice.lang.toLowerCase();

        let score = 0;

        if (langue === "fr-fr") score += 100;
        if (nom.indexOf("denise") !== -1) score += 1000;
        if (nom.indexOf("henri") !== -1) score += 950;
        if (nom.indexOf("natural") !== -1) score += 500;
        if (nom.indexOf("online") !== -1) score += 450;
        if (nom.indexOf("neural") !== -1) score += 400;
        if (voice.localService === false) score += 150;

        return score;
    }

    voixSelectionnee = francaises.slice().sort(function (a, b) {
        return scoreVoix(b) - scoreVoix(a);
    })[0];

    const voiceStatus = document.getElementById("manifesteReaderVoice");

    if (voiceStatus) {

        const nom = voixSelectionnee.name
            .replace(/Microsoft\s+/i, "")
            .trim();

        voiceStatus.textContent =
            nom
                ? "Voix : " + nom
                : "Voix française naturelle";
    }
}


function basculerLecture() {

    if (!syntheseVocale) {
        return;
    }

    /*
       Si aucune voix n'a encore été fournie par le navigateur,
       on demande explicitement le chargement puis on lit quand même
       avec la voix française par défaut du moteur.
    */
    if (!voixSelectionnee) {
        preparerVoix();
    }

    if (enLecture) {

        if (enPause) {
            syntheseVocale.resume();
            enPause = false;
        }
        else {
            syntheseVocale.pause();
            enPause = true;
        }

        mettreAJourInterface();
        return;
    }

    commencerChapitre(chapitreActuel, morceauActuel);
}


function commencerChapitre(index, morceau) {

    if (!syntheseVocale || !chapitres[index]) return;

    syntheseVocale.cancel();

    chapitreActuel = Math.max(
        0,
        Math.min(index, chapitres.length - 1)
    );

    morceauActuel = Math.max(
        0,
        Math.min(
            typeof morceau === "number" ? morceau : 0,
            chapitres[chapitreActuel].morceaux.length - 1
        )
    );

    enLecture = true;
    enPause = false;

    activerChapitre();
    lireMorceau();
}


function lireMorceau() {

    const chapitre = chapitres[chapitreActuel];

    if (!chapitre) {
        terminerLecture();
        return;
    }

    const texte = chapitre.morceaux[morceauActuel];

    if (!texte) {
        passerAuChapitreSuivant();
        return;
    }

    const utterance = new SpeechSynthesisUtterance(texte);

    utterance.lang = voixSelectionnee
        ? voixSelectionnee.lang
        : "fr-FR";

    /*
       On n'impose la voix que lorsqu'elle est réellement disponible.
       Sinon le moteur choisit automatiquement la meilleure voix pour
       fr-FR, ce qui évite les erreurs "voice-unavailable".
    */
    if (voixSelectionnee) {
        utterance.voice = voixSelectionnee;
    }

    utterance.rate = 0.94;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onend = function () {

        if (!enLecture) return;

        morceauActuel++;

        if (morceauActuel < chapitre.morceaux.length) {
            lireMorceau();
            return;
        }

        if (chapitreActuel < chapitres.length - 1) {
            chapitreActuel++;
            morceauActuel = 0;
            activerChapitre();
            lireMorceau();
            return;
        }

        terminerLecture();
    };

    utterance.onstart = function () {
        enLecture = true;
        enPause = false;
        mettreAJourInterface();
    };

    utterance.onerror = function (event) {

        console.warn(
            "AVANT-GARDE — LECTEUR vocal :",
            event.error
        );

        if (
            event.error === "canceled" ||
            event.error === "interrupted"
        ) {
            return;
        }

        /*
           Si le navigateur refuse la voix sélectionnée, on retente
           immédiatement sans imposer de voice. Le moteur utilise alors
           sa voix française par défaut.
        */
        if (
            voixSelectionnee &&
            (
                event.error === "voice-unavailable" ||
                event.error === "synthesis-failed" ||
                event.error === "language-unavailable"
            )
        ) {

            voixSelectionnee = null;

            const voiceStatus =
                document.getElementById("manifesteReaderVoice");

            if (voiceStatus) {
                voiceStatus.textContent =
                    "Voix française automatique";
            }

            syntheseVocale.cancel();

            window.setTimeout(function () {
                if (enLecture) {
                    lireMorceau();
                }
            }, 80);

            return;
        }

        enLecture = false;
        enPause = false;
        mettreAJourInterface();
    };

    /*
       Important sur Chromium/Edge : cancel() peut laisser le moteur
       dans un état intermédiaire. On laisse le thread audio respirer
       avant le speak(), surtout lors d'un changement de chapitre.
    */
    syntheseVocale.speak(utterance);
    mettreAJourInterface();
}


function chapitrePrecedent() {

    if (!chapitres.length) return;

    commencerChapitre(
        Math.max(0, chapitreActuel - 1),
        0
    );
}


function chapitreSuivant() {

    if (!chapitres.length) return;

    commencerChapitre(
        Math.min(chapitres.length - 1, chapitreActuel + 1),
        0
    );
}


function passerAuChapitreSuivant() {

    if (chapitreActuel >= chapitres.length - 1) {
        terminerLecture();
        return;
    }

    chapitreActuel++;
    morceauActuel = 0;

    activerChapitre();
    lireMorceau();
}


function arreterLecture() {

    if (syntheseVocale) syntheseVocale.cancel();

    enLecture = false;
    enPause = false;
    morceauActuel = 0;

    retirerChapitreActif();
    mettreAJourInterface();
}


function terminerLecture() {

    if (syntheseVocale) syntheseVocale.cancel();

    enLecture = false;
    enPause = false;
    chapitreActuel = 0;
    morceauActuel = 0;

    retirerChapitreActif();

    const status = document.getElementById("manifesteReaderStatus");

    if (status) status.textContent = "Lecture terminée";

    mettreAJourInterface();
}


function activerChapitre() {

    retirerChapitreActif();

    const chapitre = chapitres[chapitreActuel];

    if (!chapitre || !chapitre.element) return;

    chapitre.element.classList.add("manifeste-reader-active");

    chapitre.element.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

    const titre = chapitre.element.querySelector("h2");
    const status = document.getElementById("manifesteReaderStatus");

    if (status) {
        status.textContent =
            titre && titre.innerText
                ? titre.innerText.trim()
                : "Chapitre " + (chapitreActuel + 1);
    }
}


function retirerChapitreActif() {

    chapitres.forEach(function (chapitre) {

        if (chapitre.element) {
            chapitre.element.classList.remove("manifeste-reader-active");
        }
    });
}


function mettreAJourInterface() {

    const playButton = document.getElementById("manifesteReaderPlay");
    const playLabel = document.getElementById("manifesteReaderPlayLabel");
    const previousButton = document.getElementById("manifesteReaderPrevious");
    const nextButton = document.getElementById("manifesteReaderNext");

    if (playButton) {
        playButton.setAttribute(
            "aria-label",
            enLecture && !enPause
                ? "Mettre en pause"
                : "Lire le manifeste"
        );
    }

    if (playLabel) {
        playLabel.textContent =
            enLecture && !enPause
                ? "Pause"
                : enPause
                    ? "Reprendre"
                    : "Lire";
    }

    if (previousButton) {
        previousButton.disabled = chapitreActuel <= 0;
    }

    if (nextButton) {
        nextButton.disabled =
            chapitreActuel >= chapitres.length - 1;
    }
}
