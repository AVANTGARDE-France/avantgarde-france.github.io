/* =========================================================
   AVANT-GARDE — ADMIN UTILS

   js/admin-utils.js

   Fonctions communes utilisées par plusieurs modules.
========================================================= */


/* =========================================================
   AFFICHER MESSAGE
========================================================= */

function afficherMessage(
    element,
    type,
    texte
) {

    if (!element) {

        return;
    }


    element.className =
        "message " + type;


    element.textContent =
        texte;
}


/* =========================================================
   VIDER MESSAGE
========================================================= */

function viderMessage(
    element
) {

    if (!element) {

        return;
    }


    element.className =
        "message";


    element.textContent =
        "";
}


/* =========================================================
   ECHAPPEMENT HTML
========================================================= */

function escapeHtml(
    value
) {

    return String(
        value ?? ""
    )

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );
}


/* =========================================================
   EXPOSITION GLOBALE
========================================================= */

window.afficherMessage =
    afficherMessage;


window.viderMessage =
    viderMessage;


window.escapeHtml =
    escapeHtml;


/* =========================================================
   EXPORTS
========================================================= */

export {

    afficherMessage,

    viderMessage,

    escapeHtml

};

