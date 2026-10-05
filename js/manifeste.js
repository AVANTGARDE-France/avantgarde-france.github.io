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
