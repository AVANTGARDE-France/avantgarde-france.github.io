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
   - actualisation dynamique lors du changement d'onglet

   Table :
   other_contents

   Colonnes utilisées :
   - id
   - slug
   - titre
   - contenu_html
   - updated_at

   SECURITE :
   - Module réservé aux administrateurs.
   - Lecture réservée aux profils grade = "admin".
   - Ecriture réservée aux profils grade = "admin".
========================================================= */


import { supabase } from "./supabase.js";


/* =========================================================
   CONFIGURATION
========================================================= */

const CONTENTS = {

    manifeste: {

        slug: "manifeste",
        titre: "Manifeste",

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


let adminAutresTabListenerInitialized = false;
let actualisationAutresEnCours = false;

let adminAutresModuleInitialized = false;


/* =========================================================
   VERIFICATION ADMINISTRATEUR
========================================================= */

function estAdministrateur() {

    return (
        window.currentProfile?.grade ===
        "admin"
    );

}


function exigerAdministrateur() {

    if (
        !window.adminAuthReady
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

    if (!config) {
        return;
    }

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

    if (!config) {
        return;
    }

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

    if (
        !config ||
        !state
    ) {
        return;
    }

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

    if (
        !config ||
        !state
    ) {
        return "";
    }

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

    if (
        !config ||
        !state
    ) {
        return;
    }

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

    if (!config) {
        return;
    }

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

    if (!config) {
        return;
    }

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

    if (
        !exigerAdministrateur()
    ) {
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

    if (
        !exigerAdministrateur()
    ) {
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

    if (
        !exigerAdministrateur()
    ) {
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

    if (
        !exigerAdministrateur()
    ) {
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

    if (
        !exigerAdministrateur()
    ) {
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


    if (
        cleanUrl.includes(
            "youtube.com"
        ) ||
        cleanUrl.includes(
            "youtu.be"
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
                    .split(/[?&#]/)[0];

            embedUrl =
                `https://www.youtube.com/embed/${id}`;

        } else if (
            cleanUrl.includes(
                "watch?v="
            )
        ) {

            const id =
                cleanUrl
                    .split("watch?v=")[1]
                    .split(/[&#]/)[0];

            embedUrl =
                `https://www.youtube.com/embed/${id}`;

        }


        html =
            `<iframe src="${echapperAttribut(embedUrl)}" title="Vidéo" frameborder="0" allowfullscreen></iframe>`;

    } else if (
        cleanUrl.includes(
            "vimeo.com"
        )
    ) {

        const id =
            cleanUrl
                .split("vimeo.com/")[1]
                .split(/[?&#/]/)[0];

        const embedUrl =
            `https://player.vimeo.com/video/${id}`;

        html =
            `<iframe src="${echapperAttribut(embedUrl)}" title="Vidéo" frameborder="0" allowfullscreen></iframe>`;

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
   ECHAPPEMENT HTML
========================================================= */

function echapperHtml(value) {

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


function echapperAttribut(value) {

    return String(
        value ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        );

}


/* =========================================================
   CHARGEMENT SUPABASE
========================================================= */

async function chargerContenu(
    slug
) {

    if (
        !exigerAdministrateur()
    ) {
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
                .maybeSingle();


        if (error) {

            throw error;

        }


        if (
            !estAdministrateur()
        ) {
            return;
        }


        state.row =
            data || null;


        chargerDansEditeur(
            slug,
            data?.contenu_html || ""
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

            showMessage(
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
   ENREGISTREMENT
========================================================= */

async function enregistrerContenu(
    slug
) {

    if (
        !exigerAdministrateur()
    ) {
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


    const html =
        getCurrentHtml(
            slug
        );


    if (saveButton) {

        saveButton.disabled =
            true;

    }


    try {

        if (
            !estAdministrateur()
        ) {
            return;
        }


        const now =
            new Date().toISOString();


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


            if (
                !estAdministrateur()
            ) {
                return;
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

            if (
                !exigerAdministrateur()
            ) {
                return;
            }


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


            if (
                !estAdministrateur()
            ) {
                return;
            }


            state.row =
                data;

        }


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


        if (
            estAdministrateur()
        ) {

            showMessage(
                slug,
                error?.message
                    ? `Impossible d'enregistrer ${config.titre} : ${error.message}`
                    : `Impossible d'enregistrer ${config.titre}.`,
                "error"
            );

        }

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

    if (
        !exigerAdministrateur()
    ) {
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

    if (!config) {
        return;
    }

    const toolbar =
        getElement(
            config.toolbarId
        );

    if (!toolbar) {
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

                        if (
                            !exigerAdministrateur()
                        ) {
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

                        if (
                            !exigerAdministrateur()
                        ) {
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
   BOUTONS SPECIAUX
========================================================= */

function initialiserBoutons(
    slug
) {

    const config =
        getConfig(slug);

    if (!config) {
        return;
    }


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


    const editorAlreadyInitialized =
        wysiwyg?.dataset.adminAutresInitialized ===
        "true";


    if (
        editorAlreadyInitialized
    ) {
        return;
    }


    if (wysiwyg) {

        wysiwyg.dataset.adminAutresInitialized =
            "true";


        wysiwyg.addEventListener(
            "mouseup",
            () => {

                if (
                    !exigerAdministrateur()
                ) {
                    return;
                }

                sauvegarderSelection(
                    slug
                );

            }
        );


        wysiwyg.addEventListener(
            "keyup",
            () => {

                if (
                    !exigerAdministrateur()
                ) {
                    return;
                }

                sauvegarderSelection(
                    slug
                );

            }
        );


        wysiwyg.addEventListener(
            "input",
            () => {

                if (
                    !exigerAdministrateur()
                ) {
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


    if (source) {

        source.addEventListener(
            "input",
            () => {

                if (
                    !exigerAdministrateur()
                ) {
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


    if (linkButton) {

        linkButton.addEventListener(
            "mousedown",
            event => {

                event.preventDefault();

                if (
                    !exigerAdministrateur()
                ) {
                    return;
                }

                sauvegarderSelection(
                    slug
                );

            }
        );


        linkButton.addEventListener(
            "click",
            () => {

                if (
                    !exigerAdministrateur()
                ) {
                    return;
                }


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

                if (
                    !exigerAdministrateur()
                ) {
                    return;
                }

                sauvegarderSelection(
                    slug
                );

            }
        );


        imageButton.addEventListener(
            "click",
            () => {

                if (
                    !exigerAdministrateur()
                ) {
                    return;
                }


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

                if (
                    !exigerAdministrateur()
                ) {
                    return;
                }

                sauvegarderSelection(
                    slug
                );

            }
        );


        videoButton.addEventListener(
            "click",
            () => {

                if (
                    !exigerAdministrateur()
                ) {
                    return;
                }


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

                if (
                    !exigerAdministrateur()
                ) {
                    return;
                }


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

                if (
                    !exigerAdministrateur()
                ) {
                    return;
                }


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

                if (
                    !exigerAdministrateur()
                ) {
                    return;
                }


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

    if (
        !exigerAdministrateur()
    ) {
        return;
    }


    const config =
        getConfig(slug);

    if (!config) {
        return;
    }


    /*
       CORRECTION :

       Il n'existe pas de conteneur
       "manifestEditor" ou "inspirationsEditor"
       dans admin.html.

       Les éditeurs réels sont directement :
       - manifestWysiwyg / manifestSourceEditor
       - inspirationsWysiwyg / inspirationsSourceEditor

       On vérifie donc directement les éléments
       réellement utilisés.
    */

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

        console.error(
            `AUTRES PAGES : éditeur introuvable pour ${slug}.`,
            {
                wysiwygId:
                    config.wysiwygId,

                sourceId:
                    config.sourceId
            }
        );

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
   ACTUALISATION AU CHANGEMENT D'ONGLET
========================================================= */

async function actualiserAutresPages() {

    if (
        actualisationAutresEnCours
    ) {
        return;
    }


    if (
        !exigerAdministrateur()
    ) {
        return;
    }


    const contentOtherTab =
        getElement(
            "contentOtherTab"
        );

    if (
        !contentOtherTab
    ) {
        return;
    }


    actualisationAutresEnCours =
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
    finally {

        actualisationAutresEnCours =
            false;

    }

}


/* =========================================================
   ECOUTEUR CHANGEMENT ONGLET
========================================================= */

function initialiserEcouteurOnglet() {

    if (
        adminAutresTabListenerInitialized
    ) {
        return;
    }


    adminAutresTabListenerInitialized =
        true;


    document.addEventListener(
        "click",
        event => {

            const button =
                event.target.closest(
                    "[data-tab], .tab-button, .admin-tab"
                );

            if (!button) {
                return;
            }


            const tab =
                button.dataset.tab ||
                button.getAttribute(
                    "data-tab"
                );


            if (
                tab !==
                "contentOtherTab"
            ) {
                return;
            }


            setTimeout(
                () => {

                    actualiserAutresPages();

                },
                0
            );

        }
    );

}


/* =========================================================
   INITIALISATION GENERALE
========================================================= */

async function initialiser() {

    initialiserEcouteurOnglet();


    if (
        !window.adminAuthReady
    ) {
        return;
    }


    if (
        !estAdministrateur()
    ) {
        return;
    }


    if (
        adminAutresModuleInitialized
    ) {
        return;
    }


    const contentOtherTab =
        getElement(
            "contentOtherTab"
        );

    if (!contentOtherTab) {
        return;
    }


    adminAutresModuleInitialized =
        true;


    await Promise.all([

        initialiserEditeur(
            "manifeste"
        ),

        initialiserEditeur(
            "inspirations"
        )

    ]);

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
   INITIALISATION DOM
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
            once: true
        }
    );

} else {

    initialiser();

}
