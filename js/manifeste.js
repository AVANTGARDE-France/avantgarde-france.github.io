/* =========================================================
   AVANT-GARDE — PAGE MANIFESTE
   js/manifeste.js

   Le manifeste est pré-rendu dans manifeste.html.
   Ce script conserve le chargement Supabase de secours et
   assure le fonctionnement du lecteur vocal.
========================================================= */

import { supabase } from "./supabase.js";

const SLUG = "manifeste";

const titleElement =
    document.getElementById("editorialTitle");

const contentElement =
    document.getElementById("editorialContent");

let syntheseVocale = null;
let morceaux = [];
let morceauActuel = 0;
let enLecture = false;
let enPause = false;
let initialisationFaite = false;
let tentativeVoix = null;

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

    if (
        !("speechSynthesis" in window) ||
        !("SpeechSynthesisUtterance" in window)
    ) {
        reader.hidden = true;
        console.warn(
            "AVANT-GARDE — Lecture vocale non disponible dans ce navigateur."
        );
        return;
    }

    syntheseVocale = window.speechSynthesis;

    morceaux = construireMorceaux();

    if (!morceaux.length) {
        reader.hidden = true;
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

    preparerVoix();

    if (
        typeof syntheseVocale.addEventListener === "function"
    ) {
        syntheseVocale.addEventListener(
            "voiceschanged",
            preparerVoix
        );
    }
}

function construireMorceaux() {

    const clone =
        contentElement.cloneNode(true);

    clone.querySelectorAll(
        "script, style, button, .manifeste-reader"
    ).forEach(function (element) {
        element.remove();
    });

    const texte =
        (clone.textContent || "")
            .replace(/\s+/g, " ")
            .trim();

    if (!texte) return [];

    /*
       Morceaux courts pour éviter les échecs de SpeechSynthesis
       rencontrés sur Chromium/Edge avec les longs textes.
    */
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

        if (
            courant &&
            courant.length + phrase.length + 1 > 650
        ) {
            resultat.push(courant);
            courant = "";
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

function preparerVoix() {

    if (!syntheseVocale) return;

    const voix =
        syntheseVocale.getVoices();

    const francaises =
        voix.filter(function (voice) {
            return /^fr(?:-|_|$)/i.test(
                voice.lang || ""
            );
        });

    if (francaises.length) {

        tentativeVoix =
            francaises.find(function (voice) {
                return /^fr-fr$/i.test(
                    voice.lang || ""
                );
            }) ||
            francaises.find(function (voice) {
                return /natural|neural|online/i.test(
                    voice.name || ""
                );
            }) ||
            francaises[0];

    } else {

        tentativeVoix = null;

    }
}

function basculerLecture() {

    if (!syntheseVocale || !morceaux.length) {
        return;
    }

    if (enLecture) {

        if (enPause) {
            syntheseVocale.resume();
            enPause = false;
        } else {
            syntheseVocale.pause();
            enPause = true;
        }

        mettreAJourInterface();
        return;
    }

    /*
       Un clic utilisateur déclenche directement speak().
       On n'attend pas voiceschanged : le navigateur peut parfaitement
       utiliser sa voix par défaut même si getVoices() est encore vide.
    */
    enLecture = true;
    enPause = false;

    if (morceauActuel >= morceaux.length) {
        morceauActuel = 0;
    }

    mettreAJourInterface();

    syntheseVocale.cancel();

    window.setTimeout(
        lireMorceau,
        80
    );
}

function lireMorceau() {

    if (!enLecture || !syntheseVocale) {
        return;
    }

    if (morceauActuel >= morceaux.length) {
        terminerLecture();
        return;
    }

    const texte =
        morceaux[morceauActuel];

    if (!texte) {
        morceauActuel++;
        lireMorceau();
        return;
    }

    const utterance =
        new SpeechSynthesisUtterance(texte);

    utterance.lang = "fr-FR";
    utterance.rate = 0.94;
    utterance.pitch = 1;
    utterance.volume = 1;

    if (
        tentativeVoix &&
        syntheseVocale
            .getVoices()
            .includes(tentativeVoix)
    ) {
        utterance.voice =
            tentativeVoix;
    }

    utterance.onstart =
        function () {
            enLecture = true;
            enPause = false;
            mettreAJourInterface();
        };

    utterance.onend =
        function () {

            if (!enLecture) return;

            morceauActuel++;

            if (
                morceauActuel <
                morceaux.length
            ) {
                window.setTimeout(
                    lireMorceau,
                    40
                );
            } else {
                terminerLecture();
            }
        };

    utterance.onerror =
        function (event) {

            console.warn(
                "AVANT-GARDE — Lecteur vocal :",
                event.error
            );

            if (
                event.error === "canceled" ||
                event.error === "interrupted"
            ) {
                return;
            }

            /*
               Si une voix précise pose problème, on la retire
               et on retente une seule fois avec la voix automatique
               du navigateur.
            */
            if (tentativeVoix) {

                tentativeVoix = null;

                syntheseVocale.cancel();

                window.setTimeout(
                    lireMorceau,
                    100
                );

                return;
            }

            enLecture = false;
            enPause = false;

            mettreAJourInterface();
        };

    syntheseVocale.speak(utterance);
}

function arreterLecture() {

    if (syntheseVocale) {
        syntheseVocale.cancel();
    }

    enLecture = false;
    enPause = false;
    morceauActuel = 0;

    mettreAJourInterface();
}

function terminerLecture() {

    if (syntheseVocale) {
        syntheseVocale.cancel();
    }

    enLecture = false;
    enPause = false;
    morceauActuel = 0;

    mettreAJourInterface();
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

    playButton.setAttribute(
        "aria-label",
        enLecture && !enPause
            ? "Mettre en pause"
            : enPause
                ? "Reprendre la lecture"
                : "Écouter le manifeste"
    );

    if (playLabel) {

        playLabel.textContent =
            enLecture && !enPause
                ? "Pause"
                : enPause
                    ? "Reprendre"
                    : "Écouter";
    }
}

if (
    document.readyState === "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        chargerManifeste,
        { once: true }
    );

} else {

    chargerManifeste();

}
