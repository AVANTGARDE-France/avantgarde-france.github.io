/* =========================================================
   AVANT-GARDE — ADMIN CONTENU AUTRES
   js/adminautres.js

   Gestion :
   - MANIFESTE
   - INSPIRATIONS
   - éditeur HTML visuel
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
   - annulation / rechargement

   Table :
   other_contents

   Colonnes utilisées :
   - id
   - slug
   - titre
   - contenu_html
   - updated_at
========================================================= */

import { supabase } from "./supabase.js";


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
   ETAT
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
   OUTILS
========================================================= */

function getElement(id) {

    return document.getElementById(id);

}


function getConfig(slug) {

    return CONTENTS[slug];

}


function getState(slug) {

    return states[slug];

}


/* =========================================================
   MESSAGES
========================================================= */

const messageTimers = {};


function showMessage(
    slug,
    text,
    type = "success"
) {

    const config =
        getConfig(slug);

    const message =
        getElement(config.messageId);

    if (!message) {
        return;
    }

    clearTimeout(
        messageTimers[slug]
    );

    message.className =
        "message visible " + type;

    message.textContent =
        text;

    messageTimers[slug] =
        setTimeout(
            () => {

                message.className =
                    "message";

                message.textContent =
                    "";

            },
            3500
        );

}


/* =========================================================
   SELECTION EDITEUR
========================================================= */

const savedSelections = {};


function sauvegarderSelection(slug) {

    const config =
        getConfig(slug);

    const editor =
        getElement(config.wysiwygId);

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
        return;
    }

    const selection =
        window.getSelection();

    if (!selection) {
        return;
    }

    selection.removeAllRanges();

    selection.addRange(range);

}


/* =========================================================
   MODE EDITEUR
========================================================= */

function actualiserModeEditeur(
    slug
) {

    const config =
        getConfig(slug);

    const state =
        getState(slug);

    const wysiwyg =
        getElement(config.wysiwygId);

    const source =
        getElement(config.sourceId);

    const sourceButton =
        getElement(config.sourceButtonId);

    if (
        !wysiwyg ||
        !source
    ) {
        return;
    }


    if (state.sourceMode) {

        source.classList.add(
            "active"
        );

        wysiwyg.classList.add(
            "hidden"
        );

        if (sourceButton) {

            sourceButton.classList.add(
                "active"
            );

        }

    } else {

        source.classList.remove(
            "active"
        );

        wysiwyg.classList.remove(
            "hidden"
        );

        if (sourceButton) {

            sourceButton.classList.remove(
                "active"
            );

        }

    }

}


/* =========================================================
   RECUPERATION DU HTML
========================================================= */

function getCurrentHtml(slug) {

    const config =
        getConfig(slug);

    const state =
        getState(slug);

    const wysiwyg =
        getElement(config.wysiwygId);

    const source =
        getElement(config.sourceId);


    if (state.sourceMode) {

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

    const wysiwyg =
        getElement(config.wysiwygId);

    const source =
        getElement(config.sourceId);


    if (wysiwyg) {

        wysiwyg.innerHTML =
            html || "";

    }


    if (source) {

        source.value =
            html || "";

    }


    state.sourceMode =
        false;

    actualiserModeEditeur(
        slug
    );

}


/* =========================================================
   SYNCHRONISATION VISUEL -> SOURCE
========================================================= */

function synchroniserSource(
    slug
) {

    const config =
        getConfig(slug);

    const wysiwyg =
        getElement(config.wysiwygId);

    const source =
        getElement(config.sourceId);

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
   SYNCHRONISATION SOURCE -> VISUEL
========================================================= */

function synchroniserWysiwyg(
    slug
) {

    const config =
        getConfig(slug);

    const wysiwyg =
        getElement(config.wysiwygId);

    const source =
        getElement(config.sourceId);

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
   COMMANDES DE FORMATAGE
========================================================= */

function executerCommande(
    slug,
    command
) {

    const config =
        getConfig(slug);

    const state =
        getState(slug);

    if (state.sourceMode) {
        return;
    }

    restaurerSelection(
        slug
    );

    const wysiwyg =
        getElement(config.wysiwygId);

    if (!wysiwyg) {
        return;
    }

    wysiwyg.focus();

    document.execCommand(
        command,
        false,
        null
    );

    sauvegarderSelection(
        slug
    );

}


/* =========================================================
   FORMAT BLOCK
========================================================= */

function appliquerFormat(
    slug,
    format
) {

    const config =
        getConfig(slug);

    const state =
        getState(slug);

    if (state.sourceMode) {
        return;
    }

    restaurerSelection(
        slug
    );

    const wysiwyg =
        getElement(config.wysiwygId);

    if (!wysiwyg) {
        return;
    }

    wysiwyg.focus();

    document.execCommand(
        "formatBlock",
        false,
        `<${format}>`
    );

    sauvegarderSelection(
        slug
    );

}


/* =========================================================
   LIEN
========================================================= */

function insererLien(
    slug
) {

    const config =
        getConfig(slug);

    const state =
        getState(slug);

    if (state.sourceMode) {
        return;
    }

    restaurerSelection(
        slug
    );

    const selection =
        window.getSelection();

    let texte =
        selection
            ? selection.toString()
            : "";

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


    const wysiwyg =
        getElement(config.wysiwygId);

    if (!wysiwyg) {
        return;
    }


    wysiwyg.focus();


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
            wysiwyg.contains(
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

            return;

        }

    }


    document.execCommand(
        "insertHTML",
        false,
        `<a href="${echapperAttribut(safeUrl)}" target="_blank" rel="noopener noreferrer">${echapperHtml(texte)}</a>`
    );

    sauvegarderSelection(
        slug
    );

}


/* =========================================================
   IMAGE
========================================================= */

function insererImage(
    slug
) {

    const config =
        getConfig(slug);

    const state =
        getState(slug);

    if (state.sourceMode) {
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


    const wysiwyg =
        getElement(config.wysiwygId);

    if (!wysiwyg) {
        return;
    }


    wysiwyg.focus();


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

}


/* =========================================================
   VIDEO
========================================================= */

function insererVideo(
    slug
) {

    const config =
        getConfig(slug);

    const state =
        getState(slug);

    if (state.sourceMode) {
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


    const wysiwyg =
        getElement(config.wysiwygId);

    if (!wysiwyg) {
        return;
    }


    wysiwyg.focus();


    const cleanUrl =
        url.trim();


    let html =
        "";


    /*
       YouTube / Vimeo / URL vidéo :
       on insère un iframe pour les plateformes
       et un élément video pour les fichiers directs.
    */

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

        let embedUrl =
            cleanUrl;


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
                    error
                );

            }

        }


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


        html =
            `<div class="video-container"><iframe src="${echapperAttribut(embedUrl)}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div>`;

    } else {

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

}


/* =========================================================
   ECHAPPEMENT
========================================================= */

function echapperHtml(
    value
) {

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


function echapperAttribut(
    value
) {

    return echapperHtml(
        value
    );

}


/* =========================================================
   CHARGER UNE LIGNE
========================================================= */

async function chargerContenu(
    slug
) {

    const config =
        getConfig(slug);

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
                        ascending:true
                    }
                )
                .limit(1);


        if (error) {

            throw error;

        }


        const row =
            Array.isArray(data) &&
            data.length
                ? data[0]
                : null;


        states[slug].row =
            row;


        const html =
            row?.contenu_html ||
            "";


        chargerDansEditeur(
            slug,
            html
        );

    }
    catch (error) {

        console.error(
            `Erreur chargement ${slug} :`,
            error
        );


        chargerDansEditeur(
            slug,
            ""
        );


        showMessage(
            slug,
            "Impossible de charger le contenu.",
            "error"
        );

    }

}


/* =========================================================
   ENREGISTRER
========================================================= */

async function enregistrerContenu(
    slug
) {

    const config =
        getConfig(slug);

    const state =
        getState(slug);

    const saveButton =
        getElement(
            config.saveButtonId
        );


    const html =
        getCurrentHtml(
            slug
        );


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


    if (saveButton) {

        saveButton.disabled =
            true;

    }


    try {

        const now =
            new Date()
                .toISOString();


        /*
           Si la ligne existe déjà :
           UPDATE par son ID.

           Sinon :
           INSERT avec le slug et le titre.

           On ne fait volontairement pas d'upsert :
           cela évite d'exiger une contrainte UNIQUE
           sur slug.
        */

        if (
            state.row &&
            state.row.id !== undefined &&
            state.row.id !== null
        ) {

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
                    .select(
                        "id, slug, titre, contenu_html, updated_at"
                    )
                    .maybeSingle();


            if (error) {

                throw error;

            }


            if (data) {

                state.row =
                    data;

            } else {

                state.row = {

                    ...state.row,

                    titre:
                        config.titre,

                    contenu_html:
                        html,

                    updated_at:
                        now

                };

            }

        } else {

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
                    .maybeSingle();


            if (error) {

                throw error;

            }


            state.row =
                data;

        }


        /*
           On resynchronise les deux modes
           après l'enregistrement.
        */

        chargerDansEditeur(
            slug,
            html
        );


        showMessage(
            slug,
            `${config.titre} enregistré.`
        );

    }
    catch (error) {

        console.error(
            `Erreur enregistrement ${slug} :`,
            error
        );


        showMessage(
            slug,
            error?.message
                ? `Impossible d'enregistrer ${config.titre} : ${error.message}`
                : `Impossible d'enregistrer ${config.titre}.`,
            "error"
        );

    }
    finally {

        if (saveButton) {

            saveButton.disabled =
                false;

        }

    }

}


/* =========================================================
   ANNULER
========================================================= */

async function annulerContenu(
    slug
) {

    const config =
        getConfig(slug);

    const state =
        getState(slug);

    const confirmation =
        window.confirm(
            `Annuler les modifications de ${config.titre} ?`
        );

    if (!confirmation) {
        return;
    }


    const html =
        state.row?.contenu_html ||
        "";


    chargerDansEditeur(
        slug,
        html
    );


    showMessage(
        slug,
        "Modifications annulées."
    );

}


/* =========================================================
   OUTILS BARRE
========================================================= */

function initialiserToolbar(
    slug
) {

    const config =
        getConfig(slug);

    const toolbar =
        getElement(
            config.toolbarId
        );

    if (!toolbar) {
        return;
    }


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
   BOUTONS SPECIAUX
========================================================= */

function initialiserBoutons(
    slug
) {

    const config =
        getConfig(slug);


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


    const wysiwyg =
        getElement(
            config.wysiwygId
        );

    const source =
        getElement(
            config.sourceId
        );


    if (wysiwyg) {

        wysiwyg.addEventListener(
            "mouseup",
            () => {

                sauvegarderSelection(
                    slug
                );

            }
        );


        wysiwyg.addEventListener(
            "keyup",
            () => {

                sauvegarderSelection(
                    slug
                );

            }
        );


        wysiwyg.addEventListener(
            "input",
            () => {

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


    if (source) {

        source.addEventListener(
            "input",
            () => {

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


    if (linkButton) {

        linkButton.addEventListener(
            "mousedown",
            event => {

                event.preventDefault();

                sauvegarderSelection(
                    slug
                );

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


    if (imageButton) {

        imageButton.addEventListener(
            "mousedown",
            event => {

                event.preventDefault();

                sauvegarderSelection(
                    slug
                );

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


    if (videoButton) {

        videoButton.addEventListener(
            "mousedown",
            event => {

                event.preventDefault();

                sauvegarderSelection(
                    slug
                );

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


    if (sourceButton) {

        sourceButton.addEventListener(
            "mousedown",
            event => {

                event.preventDefault();

            }
        );


        sourceButton.addEventListener(
            "click",
            () => {

                const state =
                    getState(slug);


                if (!state.sourceMode) {

                    synchroniserSource(
                        slug
                    );

                    state.sourceMode =
                        true;

                } else {

                    synchroniserWysiwyg(
                        slug
                    );

                    state.sourceMode =
                        false;

                }


                actualiserModeEditeur(
                    slug
                );

            }
        );

    }


    if (saveButton) {

        saveButton.addEventListener(
            "click",
            async () => {

                await enregistrerContenu(
                    slug
                );

            }
        );

    }


    if (cancelButton) {

        cancelButton.addEventListener(
            "click",
            async () => {

                await annulerContenu(
                    slug
                );

            }
        );

    }

}


/* =========================================================
   INITIALISATION D'UN EDITEUR
========================================================= */

async function initialiserEditeur(
    slug
) {

    const config =
        getConfig(slug);

    const editor =
        getElement(
            config.editorId
        );

    if (!editor) {
        return;
    }


    initialiserToolbar(
        slug
    );

    initialiserBoutons(
        slug
    );


    await chargerContenu(
        slug
    );

}


/* =========================================================
   INITIALISATION GENERALE
========================================================= */

async function initialiser() {

    /*
       Le module est chargé après le HTML.
       On vérifie simplement que la zone existe.
    */

    const contentOtherTab =
        getElement(
            "contentOtherTab"
        );

    if (!contentOtherTab) {
        return;
    }


    await Promise.all([

        initialiserEditeur(
            "manifeste"
        ),

        initialiserEditeur(
            "inspirations"
        )

    ]);

}


if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initialiser,
        {
            once:true
        }
    );

} else {

    initialiser();

}
