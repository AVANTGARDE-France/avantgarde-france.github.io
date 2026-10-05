/* =========================================================
   AVANT-GARDE — PAGE INSPIRATIONS

   js/inspirations.js

   Les inspirations sont normalement pré-rendues
   directement dans inspirations.html.

   Le JavaScript sert uniquement de fallback.
========================================================= */


import { supabase } from "./supabase.js";


const SLUG =
    "inspirations";


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
   FALLBACK SUPABASE
========================================================= */

async function chargerInspirations() {

    if (!contentElement) {
        return;
    }


    /*
       Fonctionnement normal :

       le HTML contient déjà le contenu.

       Aucun appel Supabase n'est donc effectué.
    */

    if (
        contenuPreRenduDisponible()
    ) {

        return;

    }


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
                "Les inspirations ne sont pas encore disponibles."
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


        if (
            !contenu.contenu_html ||
            !contenu.contenu_html.trim()
        ) {

            afficherErreur(
                "Les inspirations ne sont pas encore disponibles."
            );

        }

    }
    catch (error) {

        console.error(
            "AVANT-GARDE — INSPIRATIONS :",
            error
        );


        afficherErreur(
            "Impossible de charger les inspirations."
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
        chargerInspirations,
        {
            once: true
        }
    );

}
else {

    chargerInspirations();

}
