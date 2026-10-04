/* =========================================================
   AVANT-GARDE — ADMIN CONTENU AUTRES
   js/adminautres.js

   Gestion :
   - MANIFESTE
   - INSPIRATIONS
   - éditeur WYSIWYG
   - code HTML source
   - gras
   - italique
   - souligné
   - H2
   - H3
   - paragraphe
   - liste
   - lien
   - image
   - vidéo
   - enregistrement Supabase
   - annulation
   - actualisation lors du changement d'onglet

   Table :
   other_contents

   Colonnes :
   - id
   - slug
   - titre
   - contenu_html
   - updated_at

   SECURITE :
   - réservé aux administrateurs
   - grade = "admin"

   IMPORTANT :
   - Un enregistrement n'est considéré comme réussi
     que si Supabase retourne effectivement la ligne.
   - Les erreurs RLS / UPDATE / INSERT sont remontées.
========================================================= */

import { supabase } from "./supabase.js";


/* =========================================================
   CONFIGURATION
========================================================= */

const CONTENTS = {

    manifeste: {

        slug:
            "manifeste",

        titre:
            "Manifeste",

        wysiwygId:
            "manifestWysiwyg",

        sourceId:
            "manifestSourceEditor",

        toolbarId:
            "manifestToolbar",

        linkButtonId:
            "manifestLinkButton",

        imageButtonId:
            "manifestImageButton",

        videoButtonId:
            "manifestVideoButton",

        sourceButtonId:
            "manifestSourceModeButton",

        saveButtonId:
            "manifestSaveButton",

        cancelButtonId:
            "manifestCancelButton",

        messageId:
            "manifestMessage"

    },


    inspirations: {

        slug:
            "inspirations",

        titre:
            "Inspirations",

        wysiwygId:
            "inspirationsWysiwyg",

        sourceId:
            "inspirationsSourceEditor",

        toolbarId:
            "inspirationsToolbar",

        linkButtonId:
            "inspirationsLinkButton",

        imageButtonId:
            "inspirationsImageButton",

        videoButtonId:
            "inspirationsVideoButton",

        sourceButtonId:
            "inspirationsSourceModeButton",

        saveButtonId:
            "inspirationsSaveButton",

        cancelButtonId:
            "inspirationsCancelButton",

        messageId:
            "inspirationsMessage"

    }

};


/* =========================================================
   ETAT
========================================================= */

const states = {

    manifeste: {

        row:
            null,

        sourceMode:
            false

    },


    inspirations: {

        row:
            null,

        sourceMode:
            false

    }

};


/* =========================================================
   ETAT GLOBAL
========================================================= */

let moduleInitialized =
    false;


let tabListenerInitialized =
    false;


let refreshInProgress =
    false;


/* =========================================================
   SELECTIONS EDITEUR
========================================================= */

const savedSelections = {};


/* =========================================================
   OUTILS
========================================================= */

function getElement(id) {

    return document.getElementById(
        id
    );

}


function getConfig(slug) {

    return CONTENTS[slug];

}


function getState(slug) {

    return states[slug];

}


/* =========================================================
   ADMINISTRATEUR
========================================================= */

function estAdministrateur() {

    return (
        window.currentProfile?.grade ===
        "admin"
    );

}


function autorise() {

    if (
        window.adminAuthReady !== true
    ) {

        return false;

    }


    if (
        !estAdministrateur()
    ) {

        console.warn(
            "AVANT-GARDE — AUTRES PAGES : accès administrateur requis."
        );

        return false;

    }


    return true;

}


/* =========================================================
   MESSAGES
========================================================= */

const messageTimers = {};


function afficherMessage(
    slug,
    message,
    type = "success"
) {

    const config =
        getConfig(slug);

    if (!config) {

        return;

    }


    const element =
        getElement(
            config.messageId
        );

    if (!element) {

        return;

    }


    clearTimeout(
        messageTimers[slug]
    );


    element.className =
        "message visible " + type;


    element.textContent =
        message;


    messageTimers[slug] =
        setTimeout(
            () => {

                element.className =
                    "message";

                element.textContent =
                    "";

            },
            5000
        );

}


/* =========================================================
   ECHAPPEMENT HTML
========================================================= */

function echapperHtml(value) {

    return String(
        value ?? ""
    )

        .replaceAll(
            "&",
            "&amp;"
        )

        .replaceAll(
            "<",
            "&lt;"
        )

        .replaceAll(
            ">",
            "&gt;"
        )

        .replaceAll(
            '"',
            "&quot;"
        )

        .replaceAll(
            "'",
            "&#039;"
        );

}


function echapperAttribut(value) {

    return echapperHtml(
        value
    );

}


/* =========================================================
   SELECTION
========================================================= */

function sauvegarderSelection(slug) {

    const config =
        getConfig(slug);

    if (!config) {

        return;

    }


    const editor =
        getElement(
            config.wysiwygId
        );

    if (!editor) {

        return;

    }


    const selection =
        window.getSelection();

    if (
        !selection ||
        selection.rangeCount === 0
    ) {

        return;

    }


    const range =
        selection.getRangeAt(0);


    if (
        !editor.contains(
            range.commonAncestorContainer
        )
    ) {

        return;

    }


    savedSelections[slug] =
        range.cloneRange();

}


function restaurerSelection(slug) {

    const range =
        savedSelections[slug];

    if (!range) {

        return false;

    }


    const selection =
        window.getSelection();

    if (!selection) {

        return false;

    }


    try {

        selection.removeAllRanges();

        selection.addRange(
            range
        );

        return true;

    }
    catch (error) {

        console.warn(
            "Impossible de restaurer la sélection :",
            error
        );

        return false;

    }

}


/* =========================================================
   MODE WYSIWYG / SOURCE
========================================================= */

function actualiserMode(slug) {

    const config =
        getConfig(slug);

    const state =
        getState(slug);

    if (
        !config ||
        !state
    ) {

        return;

    }


    const wysiwyg =
        getElement(
            config.wysiwygId
        );

    const source =
        getElement(
            config.sourceId
        );

    const sourceButton =
        getElement(
            config.sourceButtonId
        );


    if (
        !wysiwyg ||
        !source
    ) {

        return;

    }


    if (state.sourceMode) {

        wysiwyg.style.display =
            "none";

        source.style.display =
            "block";


        if (sourceButton) {

            sourceButton.classList.add(
                "active"
            );

        }

    }
    else {

        wysiwyg.style.display =
            "";

        source.style.display =
            "none";


        if (sourceButton) {

            sourceButton.classList.remove(
                "active"
            );

        }

    }

}


/* =========================================================
   WYSIWYG -> SOURCE
========================================================= */

function synchroniserSource(slug) {

    const config =
        getConfig(slug);

    if (!config) {

        return;

    }


    const wysiwyg =
        getElement(
            config.wysiwygId
        );

    const source =
        getElement(
            config.sourceId
        );

    if (
        !wysiwyg ||
        !source
    ) {

        return;

    }


    source.value =
        wysiwyg.innerHTML;

}


/* =========================================================
   SOURCE -> WYSIWYG
========================================================= */

function synchroniserWysiwyg(slug) {

    const config =
        getConfig(slug);

    if (!config) {

        return;

    }


    const wysiwyg =
        getElement(
            config.wysiwygId
        );

    const source =
        getElement(
            config.sourceId
        );

    if (
        !wysiwyg ||
        !source
    ) {

        return;

    }


    wysiwyg.innerHTML =
        source.value;

}


/* =========================================================
   CHARGEMENT DANS L'EDITEUR
========================================================= */

function chargerDansEditeur(
    slug,
    html
) {

    const config =
        getConfig(slug);

    const state =
        getState(slug);

    if (
        !config ||
        !state
    ) {

        return;

    }


    const wysiwyg =
        getElement(
            config.wysiwygId
        );

    const source =
        getElement(
            config.sourceId
        );


    const contenu =
        html || "";


    if (wysiwyg) {

        wysiwyg.innerHTML =
            contenu;

    }


    if (source) {

        source.value =
            contenu;

    }


    state.sourceMode =
        false;


    actualiserMode(
        slug
    );

}


/* =========================================================
   HTML ACTUEL
========================================================= */

function getCurrentHtml(slug) {

    const config =
        getConfig(slug);

    const state =
        getState(slug);

    if (
        !config ||
        !state
    ) {

        return "";

    }


    const wysiwyg =
        getElement(
            config.wysiwygId
        );

    const source =
        getElement(
            config.sourceId
        );


    if (
        state.sourceMode
    ) {

        return (
            source?.value ||
            ""
        );

    }


    return (
        wysiwyg?.innerHTML ||
        ""
    );

}


/* =========================================================
   COMMANDES WYSIWYG
========================================================= */

function executerCommande(
    slug,
    command
) {

    if (!autorise()) {

        return;

    }


    const config =
        getConfig(slug);

    const state =
        getState(slug);

    if (
        !config ||
        !state ||
        state.sourceMode
    ) {

        return;

    }


    const editor =
        getElement(
            config.wysiwygId
        );

    if (!editor) {

        return;

    }


    restaurerSelection(
        slug
    );


    editor.focus();


    try {

        document.execCommand(
            command,
            false,
            null
        );

    }
    catch (error) {

        console.error(
            "Erreur commande WYSIWYG :",
            error
        );

    }


    sauvegarderSelection(
        slug
    );


    synchroniserSource(
        slug
    );

}


/* =========================================================
   FORMAT H2 / H3 / P
========================================================= */

function appliquerFormat(
    slug,
    format
) {

    if (!autorise()) {

        return;

    }


    const config =
        getConfig(slug);

    const state =
        getState(slug);

    if (
        !config ||
        !state ||
        state.sourceMode
    ) {

        return;

    }


    const editor =
        getElement(
            config.wysiwygId
        );

    if (!editor) {

        return;

    }


    restaurerSelection(
        slug
    );


    editor.focus();


    try {

        document.execCommand(
            "formatBlock",
            false,
            `<${format}>`
        );

    }
    catch (error) {

        console.error(
            "Erreur formatage :",
            error
        );

    }


    sauvegarderSelection(
        slug
    );


    synchroniserSource(
        slug
    );

}


/* =========================================================
   LIEN
========================================================= */

function insererLien(slug) {

    if (!autorise()) {

        return;

    }


    const config =
        getConfig(slug);

    const state =
        getState(slug);

    if (
        !config ||
        !state ||
        state.sourceMode
    ) {

        return;

    }


    restaurerSelection(
        slug
    );


    const selection =
        window.getSelection();


    const texteSelectionne =
        selection
            ? selection.toString()
            : "";


    let texte =
        texteSelectionne;


    if (!texte) {

        texte =
            window.prompt(
                "Texte du lien :"
            );


        if (
            texte === null ||
            !texte.trim()
        ) {

            return;

        }

    }


    const url =
        window.prompt(
            "URL du lien :"
        );


    if (
        url === null ||
        !url.trim()
    ) {

        return;

    }


    const editor =
        getElement(
            config.wysiwygId
        );

    if (!editor) {

        return;

    }


    editor.focus();


    const safeUrl =
        url.trim();


    if (
        selection &&
        selection.rangeCount
    ) {

        const range =
            selection.getRangeAt(0);


        if (
            !range.collapsed &&
            editor.contains(
                range.commonAncestorContainer
            )
        ) {

            document.execCommand(
                "createLink",
                false,
                safeUrl
            );


            sauvegarderSelection(
                slug
            );


            synchroniserSource(
                slug
            );


            return;

        }

    }


    const html =
        `<a href="${echapperAttribut(safeUrl)}" target="_blank" rel="noopener noreferrer">${echapperHtml(texte)}</a>`;


    document.execCommand(
        "insertHTML",
        false,
        html
    );


    sauvegarderSelection(
        slug
    );


    synchroniserSource(
        slug
    );

}


/* =========================================================
   IMAGE
========================================================= */

function insererImage(slug) {

    if (!autorise()) {

        return;

    }


    const config =
        getConfig(slug);

    const state =
        getState(slug);

    if (
        !config ||
        !state ||
        state.sourceMode
    ) {

        return;

    }


    restaurerSelection(
        slug
    );


    const url =
        window.prompt(
            "URL de l'image :"
        );


    if (
        url === null ||
        !url.trim()
    ) {

        return;

    }


    const alt =
        window.prompt(
            "Texte alternatif de l'image :",
            ""
        );


    const editor =
        getElement(
            config.wysiwygId
        );

    if (!editor) {

        return;

    }


    editor.focus();


    const html =
        `<img src="${echapperAttribut(url.trim())}" alt="${echapperAttribut(alt || "")}">`;


    document.execCommand(
        "insertHTML",
        false,
        html
    );


    sauvegarderSelection(
        slug
    );


    synchroniserSource(
        slug
    );

}


/* =========================================================
   VIDEO
========================================================= */

function insererVideo(slug) {

    if (!autorise()) {

        return;

    }


    const config =
        getConfig(slug);

    const state =
        getState(slug);

    if (
        !config ||
        !state ||
        state.sourceMode
    ) {

        return;

    }


    restaurerSelection(
        slug
    );


    const url =
        window.prompt(
            "URL de la vidéo ou URL d'intégration :"
        );


    if (
        url === null ||
        !url.trim()
    ) {

        return;

    }


    const editor =
        getElement(
            config.wysiwygId
        );

    if (!editor) {

        return;

    }


    const cleanUrl =
        url.trim();


    let embedUrl =
        cleanUrl;


    /*
       YouTube
    */

    if (
        cleanUrl.includes(
            "youtu.be/"
        )
    ) {

        const id =
            cleanUrl
                .split("youtu.be/")[1]
                ?.split(/[?&#]/)[0];


        if (id) {

            embedUrl =
                `https://www.youtube.com/embed/${id}`;

        }

    }


    if (
        cleanUrl.includes(
            "youtube.com/watch"
        )
    ) {

        try {

            const parsed =
                new URL(
                    cleanUrl
                );


            const id =
                parsed.searchParams.get(
                    "v"
                );


            if (id) {

                embedUrl =
                    `https://www.youtube.com/embed/${id}`;

            }

        }
        catch (error) {

            console.warn(
                "URL YouTube invalide :",
                error
            );

        }

    }


    /*
       Vimeo
    */

    if (
        cleanUrl.includes(
            "vimeo.com/"
        ) &&
        !cleanUrl.includes(
            "player.vimeo.com"
        )
    ) {

        const id =
            cleanUrl
                .split("vimeo.com/")[1]
                ?.split(/[?&#]/)[0];


        if (id) {

            embedUrl =
                `https://player.vimeo.com/video/${id}`;

        }

    }


    editor.focus();


    let html;


    if (
        cleanUrl.includes(
            "youtube.com"
        ) ||
        cleanUrl.includes(
            "youtu.be"
        ) ||
        cleanUrl.includes(
            "vimeo.com"
        )
    ) {

        html =
            `<div class="video-container"><iframe src="${echapperAttribut(embedUrl)}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div>`;

    }
    else {

        html =
            `<video controls src="${echapperAttribut(cleanUrl)}"></video>`;

    }


    document.execCommand(
        "insertHTML",
        false,
        html
    );


    sauvegarderSelection(
        slug
    );


    synchroniserSource(
        slug
    );

}


/* =========================================================
   CHARGEMENT SUPABASE
========================================================= */

async function chargerContenu(slug) {

    if (!autorise()) {

        return;

    }


    const config =
        getConfig(slug);

    if (!config) {

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
                    config.slug
                )

                .order(
                    "id",
                    {
                        ascending:
                            true
                    }
                )

                .limit(1);


        if (error) {

            throw error;

        }


        if (!autorise()) {

            return;

        }


        const row =
            Array.isArray(data) &&
            data.length > 0
                ? data[0]
                : null;


        states[slug].row =
            row;


        chargerDansEditeur(
            slug,
            row?.contenu_html || ""
        );

    }
    catch (error) {

        console.error(
            `Erreur chargement ${slug} :`,
            error
        );


        if (
            estAdministrateur()
        ) {

            afficherMessage(
                slug,
                error?.message
                    ? `Impossible de charger ${config.titre} : ${error.message}`
                    : `Impossible de charger ${config.titre}.`,
                "error"
            );

        }

    }

}


/* =========================================================
   ACTUALISATION DES DEUX PAGES
========================================================= */

async function actualiserContenusAutres() {

    if (!autorise()) {

        return;

    }


    if (refreshInProgress) {

        return;

    }


    refreshInProgress =
        true;


    try {

        await Promise.all([

            chargerContenu(
                "manifeste"
            ),

            chargerContenu(
                "inspirations"
            )

        ]);

    }
    catch (error) {

        console.error(
            "Erreur actualisation Autres Pages :",
            error
        );

    }
    finally {

        refreshInProgress =
            false;

    }

}


/* =========================================================
   OUTIL — FORMAT ERREUR SUPABASE
========================================================= */

function formaterErreurSupabase(
    error
) {

    if (!error) {

        return "Erreur inconnue.";

    }


    const morceaux = [];


    if (error.message) {

        morceaux.push(
            error.message
        );

    }


    if (error.code) {

        morceaux.push(
            `Code ${error.code}`
        );

    }


    if (error.details) {

        morceaux.push(
            error.details
        );

    }


    if (error.hint) {

        morceaux.push(
            `Conseil : ${error.hint}`
        );

    }


    return morceaux.join(
        " — "
    ) || "Erreur Supabase inconnue.";

}


/* =========================================================
   ENREGISTREMENT
========================================================= */

async function enregistrerContenu(
    slug
) {

    if (!autorise()) {

        return;

    }


    const config =
        getConfig(slug);

    const state =
        getState(slug);

    if (
        !config ||
        !state
    ) {

        return;

    }


    const saveButton =
        getElement(
            config.saveButtonId
        );


    /*
       Récupération du contenu réellement
       présent dans l'éditeur.
    */

    const html =
        getCurrentHtml(
            slug
        );


    /*
       Contenu vide.
    */

    if (
        !html.trim()
    ) {

        const confirmation =
            window.confirm(
                `Le contenu de ${config.titre} est vide. Voulez-vous vraiment enregistrer ?`
            );


        if (!confirmation) {

            return;

        }

    }


    /*
       Protection double-clic.
    */

    if (saveButton) {

        saveButton.disabled =
            true;

        saveButton.textContent =
            "ENREGISTREMENT...";

    }


    try {

        /*
           Vérification des droits juste avant
           l'écriture.
        */

        if (!autorise()) {

            throw new Error(
                "Session administrateur invalide ou expirée."
            );

        }


        const now =
            new Date().toISOString();


        let savedRow =
            null;


        /* =================================================
           UPDATE
        ================================================= */

        if (
            state.row &&
            state.row.id !== null &&
            state.row.id !== undefined
        ) {

            console.log(
                "AVANT-GARDE — AUTRES PAGES — UPDATE",
                {
                    id:
                        state.row.id,

                    slug:
                        config.slug,

                    longueur:
                        html.length
                }
            );


            const {
                data,
                error
            } =
                await supabase

                    .from(
                        "other_contents"
                    )

                    .update({

                        titre:
                            config.titre,

                        contenu_html:
                            html,

                        updated_at:
                            now

                    })

                    .eq(
                        "id",
                        state.row.id
                    )

                    /*
                       IMPORTANT :
                       single() force Supabase à signaler
                       une absence de ligne.
                    */

                    .select(
                        "id, slug, titre, contenu_html, updated_at"
                    )

                    .single();


            if (error) {

                throw error;

            }


            if (!data) {

                throw new Error(
                    "Supabase n'a retourné aucune ligne après la mise à jour."
                );

            }


            savedRow =
                data;

        }


        /* =================================================
           INSERT
        ================================================= */

        else {

            console.log(
                "AVANT-GARDE — AUTRES PAGES — INSERT",
                {
                    slug:
                        config.slug,

                    longueur:
                        html.length
                }
            );


            const {
                data,
                error
            } =
                await supabase

                    .from(
                        "other_contents"
                    )

                    .insert({

                        slug:
                            config.slug,

                        titre:
                            config.titre,

                        contenu_html:
                            html,

                        updated_at:
                            now

                    })

                    .select(
                        "id, slug, titre, contenu_html, updated_at"
                    )

                    /*
                       Même principe :
                       INSERT réussi = une vraie ligne retournée.
                    */

                    .single();


            if (error) {

                throw error;

            }


            if (!data) {

                throw new Error(
                    "Supabase n'a retourné aucune ligne après l'insertion."
                );

            }


            savedRow =
                data;

        }


        /* =================================================
           VERIFICATION DU CONTENU RETOURNE
        ================================================= */

        if (
            savedRow.contenu_html !==
            html
        ) {

            throw new Error(
                "Supabase a confirmé une ligne, mais le contenu retourné ne correspond pas au contenu envoyé."
            );

        }


        /*
           Mise à jour de l'état local uniquement
           après confirmation réelle de Supabase.
        */

        state.row =
            savedRow;


        /*
           Relecture depuis Supabase.
           Cela permet de vérifier que la donnée
           existe réellement après l'opération.
        */

        const {
            data:
                verificationData,
            error:
                verificationError
        } =
            await supabase

                .from(
                    "other_contents"
                )

                .select(
                    "id, slug, titre, contenu_html, updated_at"
                )

                .eq(
                    "id",
                    savedRow.id
                )

                .single();


        if (verificationError) {

            throw verificationError;

        }


        if (!verificationData) {

            throw new Error(
                "La vérification après enregistrement n'a retourné aucune ligne."
            );

        }


        if (
            verificationData.contenu_html !==
            html
        ) {

            throw new Error(
                "La vérification Supabase a détecté une différence entre le contenu enregistré et le contenu demandé."
            );

        }


        /*
           Tout est confirmé.
        */

        state.row =
            verificationData;


        chargerDansEditeur(
            slug,
            verificationData.contenu_html
        );


        afficherMessage(
            slug,
            `${config.titre} enregistré dans Supabase.`
        );


        console.log(
            `AVANT-GARDE — ${config.titre} : enregistrement confirmé.`,
            verificationData
        );

    }
    catch (error) {

        console.error(
            `AVANT-GARDE — ERREUR ENREGISTREMENT ${slug} :`,
            error
        );


        afficherMessage(
            slug,
            `Échec de l'enregistrement : ${formaterErreurSupabase(error)}`,
            "error"
        );

    }
    finally {

        if (saveButton) {

            saveButton.disabled =
                false;

            saveButton.textContent =
                "ENREGISTRER";

        }

    }

}


/* =========================================================
   ANNULER
========================================================= */

function annulerContenu(slug) {

    if (!autorise()) {

        return;

    }


    const config =
        getConfig(slug);

    const state =
        getState(slug);

    if (
        !config ||
        !state
    ) {

        return;

    }


    const confirmation =
        window.confirm(
            `Annuler les modifications de ${config.titre} ?`
        );


    if (!confirmation) {

        return;

    }


    chargerDansEditeur(
        slug,
        state.row?.contenu_html || ""
    );


    afficherMessage(
        slug,
        "Modifications annulées."
    );

}


/* =========================================================
   INITIALISATION TOOLBAR
========================================================= */

function initialiserToolbar(slug) {

    const config =
        getConfig(slug);

    if (!config) {

        return;

    }


    const toolbar =
        getElement(
            config.toolbarId
        );

    if (!toolbar) {

        console.warn(
            `Toolbar introuvable pour ${slug}.`
        );

        return;

    }


    if (
        toolbar.dataset.adminAutresInitialized ===
        "true"
    ) {

        return;

    }


    toolbar.dataset.adminAutresInitialized =
        "true";


    /*
       COMMANDES :
       data-command
       = bold / italic / underline / insertUnorderedList...
    */

    toolbar
        .querySelectorAll(
            "[data-command]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "mousedown",
                    event => {

                        event.preventDefault();

                    }
                );


                button.addEventListener(
                    "click",
                    () => {

                        if (!autorise()) {

                            return;

                        }


                        sauvegarderSelection(
                            slug
                        );


                        executerCommande(
                            slug,
                            button.dataset.command
                        );

                    }
                );

            }
        );


    /*
       FORMATS :
       data-format
       = h2 / h3 / p
    */

    toolbar
        .querySelectorAll(
            "[data-format]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "mousedown",
                    event => {

                        event.preventDefault();

                    }
                );


                button.addEventListener(
                    "click",
                    () => {

                        if (!autorise()) {

                            return;

                        }


                        sauvegarderSelection(
                            slug
                        );


                        appliquerFormat(
                            slug,
                            button.dataset.format
                        );

                    }
                );

            }
        );

}


/* =========================================================
   INITIALISATION BOUTONS
========================================================= */

function initialiserBoutons(slug) {

    const config =
        getConfig(slug);

    if (!config) {

        return;

    }


    const wysiwyg =
        getElement(
            config.wysiwygId
        );

    const source =
        getElement(
            config.sourceId
        );

    const linkButton =
        getElement(
            config.linkButtonId
        );

    const imageButton =
        getElement(
            config.imageButtonId
        );

    const videoButton =
        getElement(
            config.videoButtonId
        );

    const sourceButton =
        getElement(
            config.sourceButtonId
        );

    const saveButton =
        getElement(
            config.saveButtonId
        );

    const cancelButton =
        getElement(
            config.cancelButtonId
        );


    /* =================================================
       WYSIWYG
    ================================================= */

    if (wysiwyg) {

        if (
            wysiwyg.dataset.adminAutresInitialized !==
            "true"
        ) {

            wysiwyg.dataset.adminAutresInitialized =
                "true";


            wysiwyg.addEventListener(
                "mouseup",
                () => {

                    if (autorise()) {

                        sauvegarderSelection(
                            slug
                        );

                    }

                }
            );


            wysiwyg.addEventListener(
                "keyup",
                () => {

                    if (autorise()) {

                        sauvegarderSelection(
                            slug
                        );

                    }

                }
            );


            wysiwyg.addEventListener(
                "input",
                () => {

                    if (!autorise()) {

                        return;

                    }


                    if (
                        !getState(slug).sourceMode
                    ) {

                        synchroniserSource(
                            slug
                        );

                    }

                }
            );

        }

    }


    /* =================================================
       SOURCE HTML
    ================================================= */

    if (source) {

        if (
            source.dataset.adminAutresInitialized !==
            "true"
        ) {

            source.dataset.adminAutresInitialized =
                "true";


            source.addEventListener(
                "input",
                () => {

                    if (!autorise()) {

                        return;

                    }


                    if (
                        getState(slug).sourceMode
                    ) {

                        synchroniserWysiwyg(
                            slug
                        );

                    }

                }
            );

        }

    }


    /* =================================================
       LIEN
    ================================================= */

    if (linkButton) {

        if (
            linkButton.dataset.adminAutresInitialized !==
            "true"
        ) {

            linkButton.dataset.adminAutresInitialized =
                "true";


            linkButton.addEventListener(
                "mousedown",
                event => {

                    event.preventDefault();

                    if (autorise()) {

                        sauvegarderSelection(
                            slug
                        );

                    }

                }
            );


            linkButton.addEventListener(
                "click",
                () => {

                    insererLien(
                        slug
                    );

                }
            );

        }

    }


    /* =================================================
       IMAGE
    ================================================= */

    if (imageButton) {

        if (
            imageButton.dataset.adminAutresInitialized !==
            "true"
        ) {

            imageButton.dataset.adminAutresInitialized =
                "true";


            imageButton.addEventListener(
                "mousedown",
                event => {

                    event.preventDefault();

                    if (autorise()) {

                        sauvegarderSelection(
                            slug
                        );

                    }

                }
            );


            imageButton.addEventListener(
                "click",
                () => {

                    insererImage(
                        slug
                    );

                }
            );

        }

    }


    /* =================================================
       VIDEO
    ================================================= */

    if (videoButton) {

        if (
            videoButton.dataset.adminAutresInitialized !==
            "true"
        ) {

            videoButton.dataset.adminAutresInitialized =
                "true";


            videoButton.addEventListener(
                "mousedown",
                event => {

                    event.preventDefault();

                    if (autorise()) {

                        sauvegarderSelection(
                            slug
                        );

                    }

                }
            );


            videoButton.addEventListener(
                "click",
                () => {

                    insererVideo(
                        slug
                    );

                }
            );

        }

    }


    /* =================================================
       CODE HTML
    ================================================= */

    if (sourceButton) {

        if (
            sourceButton.dataset.adminAutresInitialized !==
            "true"
        ) {

            sourceButton.dataset.adminAutresInitialized =
                "true";


            sourceButton.addEventListener(
                "mousedown",
                event => {

                    event.preventDefault();

                }
            );


            sourceButton.addEventListener(
                "click",
                () => {

                    if (!autorise()) {

                        return;

                    }


                    const state =
                        getState(slug);


                    if (
                        !state.sourceMode
                    ) {

                        synchroniserSource(
                            slug
                        );


                        state.sourceMode =
                            true;

                    }
                    else {

                        synchroniserWysiwyg(
                            slug
                        );


                        state.sourceMode =
                            false;

                    }


                    actualiserMode(
                        slug
                    );

                }
            );

        }

    }


    /* =================================================
       ENREGISTRER
    ================================================= */

    if (saveButton) {

        if (
            saveButton.dataset.adminAutresInitialized !==
            "true"
        ) {

            saveButton.dataset.adminAutresInitialized =
                "true";


            saveButton.addEventListener(
                "click",
                async () => {

                    await enregistrerContenu(
                        slug
                    );

                }
            );

        }

    }


    /* =================================================
       ANNULER
    ================================================= */

    if (cancelButton) {

        if (
            cancelButton.dataset.adminAutresInitialized !==
            "true"
        ) {

            cancelButton.dataset.adminAutresInitialized =
                "true";


            cancelButton.addEventListener(
                "click",
                () => {

                    annulerContenu(
                        slug
                    );

                }
            );

        }

    }

}


/* =========================================================
   INITIALISATION EDITEUR
========================================================= */

async function initialiserEditeur(
    slug
) {

    if (!autorise()) {

        return;

    }


    const config =
        getConfig(slug);

    if (!config) {

        return;

    }


    const wysiwyg =
        getElement(
            config.wysiwygId
        );


    if (!wysiwyg) {

        console.error(
            `AVANT-GARDE — ${slug} : ${config.wysiwygId} introuvable.`
        );

        return;

    }


    initialiserToolbar(
        slug
    );


    initialiserBoutons(
        slug
    );


    actualiserMode(
        slug
    );


    await chargerContenu(
        slug
    );

}


/* =========================================================
   CHANGEMENT D'ONGLET
========================================================= */

function initialiserEcouteurOnglet() {

    if (
        tabListenerInitialized
    ) {

        return;

    }


    tabListenerInitialized =
        true;


    window.addEventListener(
        "avantgarde:admin-tab-changed",
        event => {

            const tab =
                event?.detail?.tab;


            if (
                tab !==
                "contentOtherTab"
            ) {

                return;

            }


            if (!autorise()) {

                return;

            }


            actualiserContenusAutres();

        }
    );

}


/* =========================================================
   INITIALISATION GENERALE
========================================================= */

async function initialiser() {

    /*
       L'écouteur doit toujours être installé.
    */

    initialiserEcouteurOnglet();


    /*
       Authentification pas encore prête.
    */

    if (
        !window.adminAuthReady
    ) {

        return;

    }


    /*
       Réservé aux administrateurs.
    */

    if (
        !estAdministrateur()
    ) {

        return;

    }


    /*
       Déjà initialisé.
    */

    if (
        moduleInitialized
    ) {

        return;

    }


    const tab =
        getElement(
            "contentOtherTab"
        );


    if (!tab) {

        console.warn(
            "AVANT-GARDE — contentOtherTab introuvable."
        );

        return;

    }


    moduleInitialized =
        true;


    await initialiserEditeur(
        "manifeste"
    );


    await initialiserEditeur(
        "inspirations"
    );

}


/* =========================================================
   AUTHENTIFICATION
========================================================= */

window.addEventListener(
    "avantgarde:admin-connected",
    event => {

        const detail =
            event?.detail || {};


        if (
            detail.user
        ) {

            window.currentUser =
                detail.user;

        }


        if (
            detail.profile
        ) {

            window.currentProfile =
                detail.profile;

        }


        setTimeout(
            () => {

                initialiser();

            },
            0
        );

    }
);


/* =========================================================
   DOM
========================================================= */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        () => {

            initialiser();

        },
        {
            once:
                true
        }
    );

}
else {

    initialiser();

}
