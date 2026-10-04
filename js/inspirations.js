/* =========================================================
   AVANT-GARDE — PAGE INSPIRATIONS

   js/inspirations.js

   Gestion de la page publique INSPIRATIONS.

   Source :
   - Table Supabase : other_contents
   - slug : inspirations

   Le contenu HTML est rédigé dans le back-office
   AUTRES PAGES puis affiché publiquement ici.

   Aucune fonction d'administration.
========================================================= */


import { supabase } from "./supabase.js";


/* =========================================================
   CONFIGURATION
========================================================= */

const SLUG =
    "inspirations";


/* =========================================================
   ELEMENTS
========================================================= */

const titleElement =
    document.getElementById(
        "editorialTitle"
    );


const contentElement =
    document.getElementById(
        "editorialContent"
    );


/* =========================================================
   CHARGEMENT DU CONTENU
========================================================= */

async function chargerInspirations() {

    if (!contentElement) {
        return;
    }


    try {

        const {
            data,
            error
        } =
            await supabase
                .from("other_contents")
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


        /*
           Le titre enregistré dans Supabase
           devient le titre de la page.
        */

        if (
            titleElement &&
            contenu.titre
        ) {

            titleElement.textContent =
                contenu.titre;

        }


        /*
           Le HTML provenant du back-office
           est volontairement rendu comme HTML.

           Le contenu est administré depuis
           l'espace membre.
        */

        contentElement.innerHTML =
            contenu.contenu_html || "";


        /*
           Si la ligne existe mais ne contient
           aucun contenu.
        */

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


    contentElement.innerHTML = "";


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

} else {

    chargerInspirations();

}
