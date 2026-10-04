/* =========================================================
   AVANT-GARDE — ADMIN AUTRES PAGES

   js/adminautres.js

   Gestion des pages :
   - MANIFESTE
   - INSPIRATIONS

   Fonctions :
   - Chargement depuis Supabase
   - Éditeur WYSIWYG
   - Éditeur HTML source
   - Synchronisation WYSIWYG / HTML
   - Mise en forme
   - Liens
   - Images
   - Vidéos
   - Enregistrement
   - Annulation
   - Rafraîchissement au changement d’onglet
   - Accès réservé aux administrateurs
========================================================= */


/* =========================================================
   IMPORTS
========================================================= */

import { supabase } from "./supabase.js";

import {
    afficherMessage,
    viderMessage,
    escapeHtml
} from "./admin-utils.js";


/* =========================================================
   CONFIGURATION
========================================================= */

const CONTENTS = {

    manifeste: {

        slug: "manifeste",
        titre: "Manifeste",

        editorId: "manifestEditor",
        wysiwygId: "manifestWysiwyg",
        sourceId: "manifestSourceEditor",

        toolbarId: "manifestToolbar",

        linkButtonId: "manifestLinkButton",
        imageButtonId: "manifestImageButton",
        videoButtonId: "manifestVideoButton",

        sourceButtonId: "manifestSourceModeButton",

        saveButtonId: "manifestSaveButton",
        cancelButtonId: "manifestCancelButton",

        messageId: "manifestMessage"
    },


    inspirations: {

        slug: "inspirations",
        titre: "Inspirations",

        editorId: "inspirationsEditor",
        wysiwygId: "inspirationsWysiwyg",
        sourceId: "inspirationsSourceEditor",

        toolbarId: "inspirationsToolbar",

        linkButtonId: "inspirationsLinkButton",
        imageButtonId: "inspirationsImageButton",
        videoButtonId: "inspirationsVideoButton",

        sourceButtonId: "inspirationsSourceModeButton",

        saveButtonId: "inspirationsSaveButton",
        cancelButtonId: "inspirationsCancelButton",

        messageId: "inspirationsMessage"
    }
};


/* =========================================================
   ÉTAT
========================================================= */

const states = {

    manifeste: {
        row: null,
        sourceMode: false
    },

    inspirations: {
        row: null,
        sourceMode: false
    }
};


/* =========================================================
   ÉTAT GLOBAL D'INITIALISATION
========================================================= */

let moduleInitialized = false;
let tabListenerInitialized = false;
let authListenerInitialized = false;


/* =========================================================
   OUTILS DOM
========================================================= */

function getElement(id) {

    if (!id) {
        return null;
    }

    return document.getElementById(id);
}


function getConfig(slug) {

    return CONTENTS[slug] || null;
}


function getState(slug) {

    return states[slug] || null;
}


/* =========================================================
   ADMINISTRATION
========================================================= */

function estAdministrateur() {

    return window.currentProfile?.grade === "admin";
}


function exigerAdministrateur() {

    if (!window.adminAuthReady) {

        console.warn(
            "AVANT-GARDE — AUTRES PAGES : authentification administrateur non prête."
        );

        return false;
    }


    if (!estAdministrateur()) {

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

function showMessage(slug, message, type = "info") {

    const config = getConfig(slug);

    if (!config) {
        return;
    }

    const element = getElement(config.messageId);

    if (!element) {
        return;
    }


    if (!message) {

        if (typeof viderMessage === "function") {
            viderMessage(element);
        } else {
            element.textContent = "";
            element.className = "message";
        }

        return;
    }


    if (typeof afficherMessage === "function") {

        afficherMessage(
            element,
            message,
            type
        );

        return;
    }


    element.textContent = message;
    element.className = "message visible " + type;
}


/* =========================================================
   SÉLECTION ÉDITEUR
========================================================= */

const selections = {};


function sauvegarderSelection(slug) {

    const config = getConfig(slug);

    if (!config) {
        return;
    }

    const editor = getElement(config.editorId);

    if (!editor) {
        return;
    }


    const selection = window.getSelection();

    if (!selection || selection.rangeCount === 0) {
        return;
    }


    const range = selection.getRangeAt(0);


    if (
        editor.contains(range.commonAncestorContainer) ||
        range.commonAncestorContainer === editor
    ) {

        selections[slug] = range.cloneRange();
    }
}


function restaurerSelection(slug) {

    const range = selections[slug];

    if (!range) {
        return false;
    }


    const selection = window.getSelection();

    if (!selection) {
        return false;
    }


    selection.removeAllRanges();
    selection.addRange(range);

    return true;
}


/* =========================================================
   MODE ÉDITEUR
========================================================= */

function actualiserModeEditeur(slug) {

    const config = getConfig(slug);
    const state = getState(slug);

    if (!config || !state) {
        return;
    }


    const wysiwyg = getElement(config.wysiwygId);
    const source = getElement(config.sourceId);
    const button = getElement(config.sourceButtonId);

    if (!wysiwyg || !source) {
        return;
    }


    if (state.sourceMode) {

        wysiwyg.style.display = "none";
        source.style.display = "block";

        if (button) {
            button.classList.add("active");
            button.setAttribute("aria-pressed", "true");
        }

    } else {

        source.style.display = "none";
        wysiwyg.style.display = "block";

        if (button) {
            button.classList.remove("active");
            button.setAttribute("aria-pressed", "false");
        }
    }
}


/* =========================================================
   HTML COURANT
========================================================= */

function getCurrentHtml(slug) {

    const config = getConfig(slug);
    const state = getState(slug);

    if (!config || !state) {
        return "";
    }


    const wysiwyg = getElement(config.wysiwygId);
    const source = getElement(config.sourceId);


    if (state.sourceMode) {

        return source
            ? source.value || ""
            : "";
    }


    return wysiwyg
        ? wysiwyg.innerHTML || ""
        : "";
}


/* =========================================================
   CHARGEMENT DANS L'ÉDITEUR
========================================================= */

function chargerDansEditeur(slug, html) {

    const config = getConfig(slug);
    const state = getState(slug);

    if (!config || !state) {
        return;
    }


    const contenu = html || "";

    const wysiwyg = getElement(config.wysiwygId);
    const source = getElement(config.sourceId);


    if (wysiwyg) {
        wysiwyg.innerHTML = contenu;
    }


    if (source) {
        source.value = contenu;
    }


    actualiserModeEditeur(slug);
}


/* =========================================================
   SYNCHRONISATION WYSIWYG → SOURCE
========================================================= */

function synchroniserSourceDepuisWysiwyg(slug) {

    const config = getConfig(slug);

    if (!config) {
        return;
    }


    const wysiwyg = getElement(config.wysiwygId);
    const source = getElement(config.sourceId);

    if (!wysiwyg || !source) {
        return;
    }


    source.value = wysiwyg.innerHTML || "";
}


/* =========================================================
   SYNCHRONISATION SOURCE → WYSIWYG
========================================================= */

function synchroniserWysiwygDepuisSource(slug) {

    const config = getConfig(slug);

    if (!config) {
        return;
    }


    const wysiwyg = getElement(config.wysiwygId);
    const source = getElement(config.sourceId);

    if (!wysiwyg || !source) {
        return;
    }


    wysiwyg.innerHTML = source.value || "";
}


/* =========================================================
   COMMANDES WYSIWYG
========================================================= */

function executerCommande(slug, command) {

    const config = getConfig(slug);
    const state = getState(slug);

    if (!config || !state || state.sourceMode) {
        return;
    }


    const editor = getElement(config.editorId);

    if (!editor) {
        return;
    }


    editor.focus();

    restaurerSelection(slug);


    try {

        document.execCommand(
            command,
            false,
            null
        );

    } catch (error) {

        console.error(
            "AVANT-GARDE — AUTRES PAGES : erreur execCommand.",
            error
        );

        showMessage(
            slug,
            "Impossible d'appliquer cette mise en forme.",
            "error"
        );

        return;
    }


    synchroniserSourceDepuisWysiwyg(slug);
}


/* =========================================================
   FORMATAGE
========================================================= */

function appliquerFormat(slug, format) {

    const config = getConfig(slug);
    const state = getState(slug);

    if (!config || !state || state.sourceMode) {
        return;
    }


    const editor = getElement(config.editorId);

    if (!editor) {
        return;
    }


    editor.focus();

    restaurerSelection(slug);


    let valeur = format || "p";

    valeur = valeur
        .toString()
        .replace(/[<>]/g, "")
        .trim()
        .toLowerCase();


    const formatsAutorises = [
        "p",
        "h1",
        "h2",
        "h3",
        "h4",
        "blockquote",
        "pre"
    ];


    if (!formatsAutorises.includes(valeur)) {
        valeur = "p";
    }


    try {

        document.execCommand(
            "formatBlock",
            false,
            `<${valeur}>`
        );

    } catch (error) {

        console.error(
            "AVANT-GARDE — AUTRES PAGES : erreur formatBlock.",
            error
        );

        showMessage(
            slug,
            "Impossible d'appliquer ce format.",
            "error"
        );

        return;
    }


    synchroniserSourceDepuisWysiwyg(slug);
}


/* =========================================================
   INSERTION LIEN
========================================================= */

function insererLien(slug) {

    const config = getConfig(slug);
    const state = getState(slug);

    if (!config || !state || state.sourceMode) {
        return;
    }


    const editor = getElement(config.editorId);

    if (!editor) {
        return;
    }


    editor.focus();

    restaurerSelection(slug);


    const selection = window.getSelection();

    let texteSelectionne = "";

    if (selection) {
        texteSelectionne = selection.toString();
    }


    const url = window.prompt(
        "Adresse du lien :",
        "https://"
    );


    if (!url) {
        return;
    }


    const urlNettoyee = url.trim();

    if (!urlNettoyee) {
        return;
    }


    try {

        document.execCommand(
            "createLink",
            false,
            urlNettoyee
        );

    } catch (error) {

        console.error(
            "AVANT-GARDE — AUTRES PAGES : erreur création lien.",
            error
        );

        showMessage(
            slug,
            "Impossible d'insérer le lien.",
            "error"
        );

        return;
    }


    /*
       Si aucune sélection n'existait, createLink peut ne rien
       faire selon le navigateur. On propose alors une insertion
       HTML simple.
    */

    if (!texteSelectionne) {

        const html = `
<a href="${escapeHtml(urlNettoyee)}"
   target="_blank"
   rel="noopener noreferrer">${escapeHtml(urlNettoyee)}</a>
`;

        try {

            document.execCommand(
                "insertHTML",
                false,
                html
            );

        } catch (error) {

            console.error(
                "AVANT-GARDE — AUTRES PAGES : insertion HTML impossible.",
                error
            );
        }
    }


    synchroniserSourceDepuisWysiwyg(slug);
}


/* =========================================================
   INSERTION IMAGE
========================================================= */

function insererImage(slug) {

    const config = getConfig(slug);
    const state = getState(slug);

    if (!config || !state || state.sourceMode) {
        return;
    }


    const editor = getElement(config.editorId);

    if (!editor) {
        return;
    }


    editor.focus();

    restaurerSelection(slug);


    const url = window.prompt(
        "URL de l'image :",
        "https://"
    );


    if (!url) {
        return;
    }


    const urlNettoyee = url.trim();

    if (!urlNettoyee) {
        return;
    }


    const alt = window.prompt(
        "Texte alternatif de l'image :",
        ""
    );


    const html = `
<img src="${escapeHtml(urlNettoyee)}"
     alt="${escapeHtml(alt || "")}">
`;


    try {

        document.execCommand(
            "insertHTML",
            false,
            html
        );

    } catch (error) {

        console.error(
            "AVANT-GARDE — AUTRES PAGES : erreur insertion image.",
            error
        );

        showMessage(
            slug,
            "Impossible d'insérer l'image.",
            "error"
        );

        return;
    }


    synchroniserSourceDepuisWysiwyg(slug);
}


/* =========================================================
   INSERTION VIDÉO
========================================================= */

function insererVideo(slug) {

    const config = getConfig(slug);
    const state = getState(slug);

    if (!config || !state || state.sourceMode) {
        return;
    }


    const editor = getElement(config.editorId);

    if (!editor) {
        return;
    }


    editor.focus();

    restaurerSelection(slug);


    const url = window.prompt(
        "URL de la vidéo :",
        "https://"
    );


    if (!url) {
        return;
    }


    const urlNettoyee = url.trim();

    if (!urlNettoyee) {
        return;
    }


    let embedUrl = urlNettoyee;


    /*
       Conversion simple YouTube :
       https://www.youtube.com/watch?v=XXXX
       →
       https://www.youtube.com/embed/XXXX
    */

    try {

        const parsed = new URL(urlNettoyee);

        if (
            parsed.hostname.includes("youtube.com") &&
            parsed.searchParams.get("v")
        ) {

            embedUrl =
                "https://www.youtube.com/embed/" +
                parsed.searchParams.get("v");
        }


        if (
            parsed.hostname === "youtu.be"
        ) {

            embedUrl =
                "https://www.youtube.com/embed" +
                parsed.pathname;
        }

    } catch (error) {

        console.warn(
            "AVANT-GARDE — AUTRES PAGES : URL vidéo non analysable.",
            error
        );
    }


    const html = `
<div class="video-container">
    <iframe
        src="${escapeHtml(embedUrl)}"
        title="Vidéo"
        frameborder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen>
    </iframe>
</div>
`;


    try {

        document.execCommand(
            "insertHTML",
            false,
            html
        );

    } catch (error) {

        console.error(
            "AVANT-GARDE — AUTRES PAGES : erreur insertion vidéo.",
            error
        );

        showMessage(
            slug,
            "Impossible d'insérer la vidéo.",
            "error"
        );

        return;
    }


    synchroniserSourceDepuisWysiwyg(slug);
}


/* =========================================================
   ÉCHAPPEMENT HTML
========================================================= */

function echapperAttribut(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}


/*
   escapeHtml vient normalement de admin-utils.js.
   Cette fonction de secours évite qu'une absence ponctuelle
   de cette fonction bloque tout le module.
*/

function escapeHtmlSafe(value) {

    if (typeof escapeHtml === "function") {
        return escapeHtml(value);
    }

    return echapperAttribut(value);
}


/* =========================================================
   CHARGEMENT SUPABASE
========================================================= */

async function chargerContenu(slug) {

    const config = getConfig(slug);
    const state = getState(slug);

    if (!config || !state) {
        return;
    }


    if (!exigerAdministrateur()) {
        return;
    }


    try {

        const {
            data,
            error
        } = await supabase
            .from("other_contents")
            .select(
                "id, slug, titre, contenu_html, updated_at"
            )
            .eq("slug", config.slug)
            .order("id", {
                ascending: true
            })
            .limit(1);


        if (error) {

            console.error(
                "AVANT-GARDE — AUTRES PAGES : erreur chargement.",
                error
            );

            state.row = null;

            chargerDansEditeur(
                slug,
                ""
            );

            showMessage(
                slug,
                "Erreur lors du chargement : " +
                (error.message || "erreur Supabase"),
                "error"
            );

            return;
        }


        const row = data && data.length
            ? data[0]
            : null;


        state.row = row;


        chargerDansEditeur(
            slug,
            row?.contenu_html || ""
        );


        showMessage(
            slug,
            ""
        );


    } catch (error) {

        console.error(
            "AVANT-GARDE — AUTRES PAGES : exception chargement.",
            error
        );

        showMessage(
            slug,
            "Erreur inattendue lors du chargement.",
            "error"
        );
    }
}


/* =========================================================
   CHARGEMENT DES DEUX PAGES
========================================================= */

async function actualiserContenusAutres() {

    if (!exigerAdministrateur()) {
        return;
    }


    await Promise.all([
        chargerContenu("manifeste"),
        chargerContenu("inspirations")
    ]);
}


/* =========================================================
   ÉDITION — WYSIWYG
========================================================= */

function initialiserEditeurWysiwyg(slug) {

    const config = getConfig(slug);

    if (!config) {
        return;
    }


    const editor = getElement(config.editorId);

    if (!editor) {
        return;
    }


    editor.setAttribute(
        "contenteditable",
        "true"
    );


    /*
       Sauvegarde de la sélection avant les clics sur la toolbar.
    */

    const sauvegarder = () => {
        sauvegarderSelection(slug);
    };


    editor.addEventListener(
        "mouseup",
        sauvegarder
    );


    editor.addEventListener(
        "keyup",
        sauvegarder
    );


    editor.addEventListener(
        "focus",
        sauvegarder
    );


    /*
       Chaque modification du contenu met à jour le HTML source.
    */

    editor.addEventListener(
        "input",
        () => {

            const state = getState(slug);

            if (!state || state.sourceMode) {
                return;
            }

            synchroniserSourceDepuisWysiwyg(slug);
        }
    );
}


/* =========================================================
   TOOLBAR
========================================================= */

function initialiserToolbar(slug) {

    const config = getConfig(slug);

    if (!config) {
        return;
    }


    const toolbar = getElement(config.toolbarId);

    if (!toolbar) {

        console.warn(
            "AVANT-GARDE — AUTRES PAGES : toolbar introuvable pour",
            slug
        );

        return;
    }


    /*
       IMPORTANT :

       Le HTML utilise :
       data-other-command
       data-other-format

       et non :
       data-command
       data-format
    */


    toolbar
        .querySelectorAll("[data-other-command]")
        .forEach(button => {

            button.addEventListener(
                "mousedown",
                event => {

                    /*
                       Empêche le bouton de prendre le focus
                       et de faire disparaître la sélection
                       dans le contenteditable.
                    */

                    event.preventDefault();

                    sauvegarderSelection(slug);
                }
            );


            button.addEventListener(
                "click",
                event => {

                    event.preventDefault();


                    const command =
                        button.getAttribute(
                            "data-other-command"
                        );


                    if (!command) {
                        return;
                    }


                    executerCommande(
                        slug,
                        command
                    );
                }
            );
        });


    toolbar
        .querySelectorAll("[data-other-format]")
        .forEach(button => {

            button.addEventListener(
                "mousedown",
                event => {

                    event.preventDefault();

                    sauvegarderSelection(slug);
                }
            );


            button.addEventListener(
                "click",
                event => {

                    event.preventDefault();


                    const format =
                        button.getAttribute(
                            "data-other-format"
                        );


                    if (!format) {
                        return;
                    }


                    appliquerFormat(
                        slug,
                        format
                    );
                }
            );
        });
}


/* =========================================================
   MODE SOURCE
========================================================= */

function basculerModeSource(slug) {

    const config = getConfig(slug);
    const state = getState(slug);

    if (!config || !state) {
        return;
    }


    const wysiwyg = getElement(config.wysiwygId);
    const source = getElement(config.sourceId);

    if (!wysiwyg || !source) {
        return;
    }


    if (!state.sourceMode) {

        /*
           Passage WYSIWYG → HTML.
        */

        source.value =
            wysiwyg.innerHTML || "";


        state.sourceMode = true;

    } else {

        /*
           Passage HTML → WYSIWYG.
        */

        wysiwyg.innerHTML =
            source.value || "";


        state.sourceMode = false;
    }


    actualiserModeEditeur(slug);
}


/* =========================================================
   BOUTONS SPÉCIAUX
========================================================= */

function initialiserBoutonsSpeciaux(slug) {

    const config = getConfig(slug);

    if (!config) {
        return;
    }


    const linkButton =
        getElement(config.linkButtonId);


    const imageButton =
        getElement(config.imageButtonId);


    const videoButton =
        getElement(config.videoButtonId);


    const sourceButton =
        getElement(config.sourceButtonId);


    if (linkButton) {

        linkButton.addEventListener(
            "mousedown",
            event => {

                event.preventDefault();

                sauvegarderSelection(slug);
            }
        );


        linkButton.addEventListener(
            "click",
            event => {

                event.preventDefault();

                insererLien(slug);
            }
        );
    }


    if (imageButton) {

        imageButton.addEventListener(
            "mousedown",
            event => {

                event.preventDefault();

                sauvegarderSelection(slug);
            }
        );


        imageButton.addEventListener(
            "click",
            event => {

                event.preventDefault();

                insererImage(slug);
            }
        );
    }


    if (videoButton) {

        videoButton.addEventListener(
            "mousedown",
            event => {

                event.preventDefault();

                sauvegarderSelection(slug);
            }
        );


        videoButton.addEventListener(
            "click",
            event => {

                event.preventDefault();

                insererVideo(slug);
            }
        );
    }


    if (sourceButton) {

        sourceButton.addEventListener(
            "click",
            event => {

                event.preventDefault();

                basculerModeSource(slug);
            }
        );
    }
}


/* =========================================================
   SOURCE EDITOR
========================================================= */

function initialiserSourceEditor(slug) {

    const config = getConfig(slug);

    if (!config) {
        return;
    }


    const source = getElement(config.sourceId);

    if (!source) {
        return;
    }


    source.addEventListener(
        "input",
        () => {

            const state = getState(slug);

            if (!state || !state.sourceMode) {
                return;
            }


            /*
               Mise à jour immédiate du WYSIWYG.
               Cela permet de voir le résultat même en mode source.
            */

            synchroniserWysiwygDepuisSource(slug);
        }
    );
}


/* =========================================================
   INITIALISATION DES BOUTONS ENREGISTRER / ANNULER
========================================================= */

function initialiserActions(slug) {

    const config = getConfig(slug);

    if (!config) {
        return;
    }


    const saveButton =
        getElement(config.saveButtonId);


    const cancelButton =
        getElement(config.cancelButtonId);


    if (saveButton) {

        saveButton.addEventListener(
            "click",
            event => {

                event.preventDefault();

                enregistrerContenu(slug);
            }
        );
    }


    if (cancelButton) {

        cancelButton.addEventListener(
            "click",
            event => {

                event.preventDefault();

                annulerContenu(slug);
            }
        );
    }
}


/* =========================================================
   INITIALISATION COMPLÈTE D'UN ÉDITEUR
========================================================= */

function initialiserEditeur(slug) {

    const config = getConfig(slug);

    if (!config) {
        return;
    }


    if (!exigerAdministrateur()) {
        return;
    }


    const wysiwyg =
        getElement(config.wysiwygId);


    if (!wysiwyg) {

        console.warn(
            "AVANT-GARDE — AUTRES PAGES : éditeur introuvable pour",
            slug
        );

        return;
    }


    /*
       IMPORTANT :

       On ne bloque plus toute l'initialisation si un autre script
       a déjà posé dataset.adminAutresInitialized.

       Chaque écouteur est désormais protégé individuellement
       par un marqueur propre.
    */


    if (
        wysiwyg.dataset
            .adminAutresWysiwygInitialized !== "true"
    ) {

        initialiserEditeurWysiwyg(slug);

        wysiwyg.dataset
            .adminAutresWysiwygInitialized = "true";
    }


    const toolbar =
        getElement(config.toolbarId);


    if (
        toolbar &&
        toolbar.dataset
            .adminAutresToolbarInitialized !== "true"
    ) {

        initialiserToolbar(slug);

        toolbar.dataset
            .adminAutresToolbarInitialized = "true";
    }


    const source =
        getElement(config.sourceId);


    if (
        source &&
        source.dataset
            .adminAutresSourceInitialized !== "true"
    ) {

        initialiserSourceEditor(slug);

        source.dataset
            .adminAutresSourceInitialized = "true";
    }


    const linkButton =
        getElement(config.linkButtonId);


    if (
        linkButton &&
        linkButton.dataset
            .adminAutresActionInitialized !== "true"
    ) {

        initialiserBoutonsSpeciaux(slug);

        /*
           Les trois boutons spéciaux et le bouton source
           sont initialisés dans le même bloc.
        */

        linkButton.dataset
            .adminAutresActionInitialized = "true";
    }


    const saveButton =
        getElement(config.saveButtonId);


    if (
        saveButton &&
        saveButton.dataset
            .adminAutresSaveInitialized !== "true"
    ) {

        initialiserActions(slug);

        saveButton.dataset
            .adminAutresSaveInitialized = "true";
    }


    actualiserModeEditeur(slug);


    /*
       Chargement depuis Supabase.
    */

    chargerContenu(slug);
}


/* =========================================================
   ENREGISTREMENT
========================================================= */

async function enregistrerContenu(slug) {

    const config = getConfig(slug);
    const state = getState(slug);

    if (!config || !state) {
        return;
    }


    /*
       Vérification d'accès AVANT toute opération.
    */

    if (!exigerAdministrateur()) {

        showMessage(
            slug,
            "Enregistrement refusé : accès administrateur requis.",
            "error"
        );

        return;
    }


    /*
       Si nous sommes en mode source, le contenu est déjà
       dans le textarea.

       Sinon, on synchronise d'abord le WYSIWYG.
    */

    if (!state.sourceMode) {
        synchroniserSourceDepuisWysiwyg(slug);
    }


    const html = getCurrentHtml(slug);


    if (!html.trim()) {

        const continuer =
            window.confirm(
                "Le contenu est vide. Voulez-vous vraiment enregistrer une page vide ?"
            );


        if (!continuer) {
            return;
        }
    }


    const saveButton =
        getElement(config.saveButtonId);


    if (saveButton) {
        saveButton.disabled = true;
    }


    showMessage(
        slug,
        "Enregistrement en cours...",
        "info"
    );


    try {

        const now =
            new Date().toISOString();


        let result;


        /*
           EXISTANT → UPDATE
        */

        if (state.row?.id) {

            result =
                await supabase
                    .from("other_contents")
                    .update({

                        titre: config.titre,

                        contenu_html: html,

                        updated_at: now
                    })
                    .eq(
                        "id",
                        state.row.id
                    )
                    .select(
                        "id, slug, titre, contenu_html, updated_at"
                    )
                    .maybeSingle();
        }


        /*
           ABSENT → INSERT
        */

        else {

            result =
                await supabase
                    .from("other_contents")
                    .insert({

                        slug: config.slug,

                        titre: config.titre,

                        contenu_html: html,

                        updated_at: now
                    })
                    .select(
                        "id, slug, titre, contenu_html, updated_at"
                    )
                    .maybeSingle();
        }


        const {
            data,
            error
        } = result;


        if (error) {

            console.error(
                "AVANT-GARDE — AUTRES PAGES : erreur Supabase lors de l'enregistrement.",
                error
            );


            showMessage(
                slug,
                "Erreur lors de l'enregistrement : " +
                (
                    error.message ||
                    error.details ||
                    "erreur Supabase inconnue"
                ),
                "error"
            );


            return;
        }


        /*
           Si Supabase ne renvoie aucune ligne après UPDATE/INSERT,
           on considère que quelque chose est anormal.
        */

        if (!data) {

            console.error(
                "AVANT-GARDE — AUTRES PAGES : aucune ligne retournée après enregistrement."
            );


            showMessage(
                slug,
                "L'enregistrement n'a pas confirmé la modification.",
                "error"
            );


            return;
        }


        /*
           Mise à jour de l'état local.
        */

        state.row = data;


        chargerDansEditeur(
            slug,
            data.contenu_html || html
        );


        showMessage(
            slug,
            "Contenu enregistré avec succès.",
            "success"
        );


    } catch (error) {

        console.error(
            "AVANT-GARDE — AUTRES PAGES : exception lors de l'enregistrement.",
            error
        );


        showMessage(
            slug,
            "Erreur inattendue lors de l'enregistrement.",
            "error"
        );


    } finally {

        if (saveButton) {
            saveButton.disabled = false;
        }
    }
}


/* =========================================================
   ANNULATION
========================================================= */

async function annulerContenu(slug) {

    const config = getConfig(slug);
    const state = getState(slug);

    if (!config || !state) {
        return;
    }


    if (!exigerAdministrateur()) {

        showMessage(
            slug,
            "Accès administrateur requis.",
            "error"
        );

        return;
    }


    const confirmer =
        window.confirm(
            "Annuler les modifications et recharger le contenu enregistré ?"
        );


    if (!confirmer) {
        return;
    }


    state.sourceMode = false;


    await chargerContenu(slug);


    showMessage(
        slug,
        "Modifications annulées.",
        "info"
    );
}


/* =========================================================
   RAFRAÎCHISSEMENT AU CHANGEMENT D'ONGLET
========================================================= */

function initialiserEcouteOnglets() {

    if (tabListenerInitialized) {
        return;
    }


    tabListenerInitialized = true;


    window.addEventListener(
        "avantgarde:admin-tab-changed",
        event => {

            const detail =
                event?.detail || {};


            const tab =
                detail.tab;


            if (
                tab === "contentOtherTab" ||
                tab === "otherPagesTab" ||
                tab === "contentOther"
            ) {

                /*
                   Petit délai pour laisser le DOM et l'onglet
                   terminer leur activation.
                */

                setTimeout(
                    () => {

                        if (!exigerAdministrateur()) {
                            return;
                        }


                        initialiserEditeur(
                            "manifeste"
                        );


                        initialiserEditeur(
                            "inspirations"
                        );

                    },
                    0
                );
            }
        }
    );
}


/* =========================================================
   ÉVÉNEMENT AUTHENTIFICATION ADMIN
========================================================= */

function initialiserEcouteAuth() {

    if (authListenerInitialized) {
        return;
    }


    authListenerInitialized = true;


    window.addEventListener(
        "avantgarde:admin-connected",
        event => {

            const detail =
                event?.detail || {};


            if (detail.user) {
                window.currentUser =
                    detail.user;
            }


            if (detail.profile) {
                window.currentProfile =
                    detail.profile;
            }


            /*
               L'authentification vient d'être finalisée.
               On attend un tour de boucle pour laisser les autres
               modules mettre à jour leur état global.
            */

            setTimeout(
                () => {

                    initialiser();

                },
                0
            );
        }
    );
}


/* =========================================================
   INITIALISATION PRINCIPALE
========================================================= */

function initialiser() {

    initialiserEcouteOnglets();
    initialiserEcouteAuth();


    /*
       L'authentification n'est pas encore prête.
       L'événement avantgarde:admin-connected prendra le relais.
    */

    if (!window.adminAuthReady) {

        console.info(
            "AVANT-GARDE — AUTRES PAGES : attente de l'authentification administrateur."
        );

        return;
    }


    /*
       L'authentification est prête mais le profil n'est pas
       administrateur.
    */

    if (!estAdministrateur()) {

        console.warn(
            "AVANT-GARDE — AUTRES PAGES : utilisateur non administrateur."
        );

        return;
    }


    if (moduleInitialized) {

        /*
           Même si le module est déjà initialisé, on recharge les
           données lorsque initialiser() est rappelé après
           l'authentification.
        */

        actualiserContenusAutres();

        return;
    }


    moduleInitialized = true;


    /*
       Initialisation des deux éditeurs.
    */

    initialiserEditeur(
        "manifeste"
    );


    initialiserEditeur(
        "inspirations"
    );
}


/* =========================================================
   DOM READY
========================================================= */

if (
    document.readyState === "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initialiser,
        {
            once: true
        }
    );

} else {

    initialiser();
}


/* =========================================================
   EXPOSITION OPTIONNELLE
========================================================= */

/*
   Permet éventuellement à d'autres modules de forcer
   un rafraîchissement de l'onglet Autres Pages.
*/

window.actualiserContenusAutres =
    actualiserContenusAutres;
