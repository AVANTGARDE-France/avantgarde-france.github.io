/* =========================================================
   AVANT-GARDE — ADMIN CONTENUS
   js/admincontenus.js

   Gestion :
   - menus
   - sous-menus
   - contenus
   - création
   - édition
   - suppression
   - validation
   - ordre
   - recto des cartes
   - statistiques liées par code
   - synergies liées par UUID
   - verso HTML existant
========================================================= */

import { supabase } from "./supabase.js";


/* =========================================================
   ETAT
========================================================= */

let menus = [];
let sousMenus = [];
let contenus = [];
let stats = [];

let selectedType = null;
let selectedId = null;

let editorType = null;
let editorId = null;

let modalType = null;
let modalParentId = null;

let isSourceMode = false;

let currentProfile = null;


/* =========================================================
   ELEMENTS
========================================================= */

const tree =
    document.getElementById("tree");

const welcome =
    document.getElementById("welcome");

const structureEditor =
    document.getElementById("structureEditor");

const contentEditor =
    document.getElementById("contentEditor");

const structureTitle =
    document.getElementById("structureTitle");

const structureDescription =
    document.getElementById("structureDescription");

const structureName =
    document.getElementById("structureName");

const structureParentField =
    document.getElementById("structureParentField");

const structureParent =
    document.getElementById("structureParent");

const contentEditorTitle =
    document.getElementById("contentEditorTitle");

const contentTitle =
    document.getElementById("contentTitle");

const contentParent =
    document.getElementById("contentParent");

const wysiwyg =
    document.getElementById("wysiwyg");

const sourceEditor =
    document.getElementById("sourceEditor");

const message =
    document.getElementById("message");

const connectedUser =
    document.getElementById("connectedUser");

const structureModal =
    document.getElementById("structureModal");

const modalTitle =
    document.getElementById("modalTitle");

const modalName =
    document.getElementById("modalName");

const modalSaveButton =
    document.getElementById("modalSaveButton");


/* =========================================================
   RECTO — ELEMENTS
========================================================= */

const cardPhoto =
    document.getElementById("cardPhoto");

const cardAccroche =
    document.getElementById("cardAccroche");

const cardPriorite =
    document.getElementById("cardPriorite");

const cardStat1 =
    document.getElementById("cardStat1");

const cardStat2 =
    document.getElementById("cardStat2");

const cardStat3 =
    document.getElementById("cardStat3");

const cardSynergies =
    document.getElementById("cardSynergies");


/* =========================================================
   MESSAGE
========================================================= */

let messageTimer = null;

function showMessage(
    text,
    type = "success"
) {

    clearTimeout(messageTimer);

    message.className =
        "message visible " + type;

    message.textContent =
        text;

    messageTimer =
        setTimeout(
            () => {

                message.className =
                    "message";

            },
            3500
        );

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHtml(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


/* =========================================================
   ADMIN
========================================================= */

async function verifierAdmin() {

    const {
        data: {
            user
        },
        error: userError
    } =
        await supabase.auth.getUser();


    if (
        userError ||
        !user
    ) {

        throw new Error(
            "Vous devez être connecté."
        );

    }


    const {
        data: profile,
        error: profileError
    } =
        await supabase
            .from("profiles")
            .select(
                "id, nom, email, grade"
            )
            .eq(
                "id",
                user.id
            )
            .single();


    if (
        profileError ||
        !profile
    ) {

        throw new Error(
            "Impossible de charger votre profil."
        );

    }


    if (
        profile.grade !== "admin"
    ) {

        throw new Error(
            "Accès réservé aux administrateurs."
        );

    }


    currentProfile =
        profile;


    if (connectedUser) {

        connectedUser.textContent =
            profile.nom ||
            profile.email ||
            "";

    }


    return true;

}


/* =========================================================
   CHARGEMENT DES DONNEES
========================================================= */

async function chargerDonnees() {

    const [
        menusResult,
        sousMenusResult,
        contenusResult,
        statsResult
    ] =
        await Promise.all([

            supabase
                .from("menus")
                .select(
                    "id, titre, position, valide"
                )
                .order(
                    "position",
                    {
                        ascending: true
                    }
                ),

            supabase
                .from("sous_menus")
                .select(
                    "id, menu_id, titre, position, valide"
                )
                .order(
                    "position",
                    {
                        ascending: true
                    }
                ),

            supabase
                .from("contenus")
                .select(
                    `
                    id,
                    sous_menu_id,
                    titre,
                    html,
                    position,
                    valide,
                    photo_url,
                    accroche,
                    priorite,
                    stat_1,
                    stat_2,
                    stat_3,
                    synergies
                    `
                )
                .order(
                    "position",
                    {
                        ascending: true
                    }
                ),

            supabase
                .from("stats")
                .select(
                    `
                    id,
                    code,
                    nom,
                    description,
                    icone_url,
                    animation_url,
                    actif,
                    position
                    `
                )
                .order(
                    "position",
                    {
                        ascending: true
                    }
                )

        ]);


    if (menusResult.error) {

        throw menusResult.error;

    }


    if (sousMenusResult.error) {

        throw sousMenusResult.error;

    }


    if (contenusResult.error) {

        throw contenusResult.error;

    }


    if (statsResult.error) {

        throw statsResult.error;

    }


    menus =
        menusResult.data || [];

    sousMenus =
        sousMenusResult.data || [];

    contenus =
        contenusResult.data || [];

    stats =
        statsResult.data || [];


    remplirListesStats();

    renderTree();

}


/* =========================================================
   LISTES STATISTIQUES
========================================================= */

function remplirListesStats() {

    const selects = [
        cardStat1,
        cardStat2,
        cardStat3
    ];


    selects.forEach(
        select => {

            if (!select) {

                return;

            }


            const ancienneValeur =
                select.value;


            select.innerHTML = "";


            const empty =
                document.createElement("option");

            empty.value = "";

            empty.textContent =
                "Aucune statistique";

            select.appendChild(
                empty
            );


            stats
                .filter(
                    stat =>
                        stat.actif !== false
                )
                .forEach(
                    stat => {

                        const option =
                            document.createElement(
                                "option"
                            );

                        option.value =
                            stat.code;

                        option.textContent =
                            stat.nom ||
                            stat.code;

                        select.appendChild(
                            option
                        );

                    }
                );


            if (ancienneValeur) {

                select.value =
                    ancienneValeur;

            }

        }
    );

}


/* =========================================================
   LISTE SYNERGIES
========================================================= */

function remplirListeSynergies(
    valeurs = []
) {

    if (!cardSynergies) {

        return;

    }


    cardSynergies.innerHTML = "";


    const selected =
        Array.isArray(valeurs)
            ? valeurs.map(
                value => String(value)
              )
            : [];


    contenus
        .filter(
            contenu =>
                contenu.id !== editorId
        )
        .forEach(
            contenu => {

                const label =
                    document.createElement(
                        "label"
                    );

                label.style.display =
                    "flex";

                label.style.alignItems =
                    "center";

                label.style.gap =
                    "8px";

                label.style.marginBottom =
                    "6px";


                const checkbox =
                    document.createElement(
                        "input"
                    );

                checkbox.type =
                    "checkbox";

                checkbox.value =
                    contenu.id;

                checkbox.checked =
                    selected.includes(
                        String(contenu.id)
                    );


                const span =
                    document.createElement(
                        "span"
                    );

                span.textContent =
                    contenu.titre;


                label.appendChild(
                    checkbox
                );

                label.appendChild(
                    span
                );


                cardSynergies.appendChild(
                    label
                );

            }
        );


    if (
        !cardSynergies.children.length
    ) {

        const empty =
            document.createElement(
                "div"
            );

        empty.style.color =
            "var(--muted)";

        empty.style.fontSize =
            "11px";

        empty.textContent =
            "Aucune autre fiche disponible.";

        cardSynergies.appendChild(
            empty
        );

    }

}


/* =========================================================
   RECUPERATION SYNERGIES
========================================================= */

function obtenirSynergies() {

    if (!cardSynergies) {

        return [];

    }


    return Array.from(
        cardSynergies.querySelectorAll(
            'input[type="checkbox"]:checked'
        )
    )
        .map(
            input =>
                input.value
        );

}


/* =========================================================
   RENDU ARBRE
========================================================= */

function renderTree() {

    tree.innerHTML = "";


    if (!menus.length) {

        tree.innerHTML = `

            <div class="empty-tree">

                Aucun menu.

                <br><br>

                Utilisez « + MENU »
                pour commencer.

            </div>

        `;

        return;

    }


    menus.forEach(
        (menu, menuIndex) => {

            const menuBox =
                document.createElement(
                    "div"
                );

            menuBox.className =
                "tree-menu";


            const menuHeader =
                document.createElement(
                    "div"
                );

            menuHeader.className =
                "tree-menu-header";


            const menuButton =
                document.createElement(
                    "button"
                );

            menuButton.type =
                "button";

            menuButton.className =
                "tree-item-main";

            menuButton.innerHTML = `

                <span class="tree-title">
                    ${escapeHtml(menu.titre)}
                </span>

                <span class="tree-subtitle">
                    MENU
                </span>

            `;


            menuButton.addEventListener(
                "click",
                () => {

                    ouvrirStructure(
                        "menu",
                        menu.id
                    );

                }
            );


            const menuActions =
                document.createElement(
                    "div"
                );

            menuActions.className =
                "tree-actions";


            const upButton =
                creerBouton(
                    "↑",
                    "Monter",
                    () =>
                        deplacerMenu(
                            menuIndex,
                            -1
                        )
                );


            const downButton =
                creerBouton(
                    "↓",
                    "Descendre",
                    () =>
                        deplacerMenu(
                            menuIndex,
                            1
                        )
                );


            const statusButton =
                creerStatusButton(
                    menu
                );


            const addButton =
                creerBouton(
                    "+",
                    "Ajouter un sous-menu",
                    () =>
                        ouvrirModalCreation(
                            "submenu",
                            menu.id
                        )
                );


            const deleteButton =
                creerBouton(
                    "×",
                    "Supprimer",
                    () =>
                        supprimerMenu(
                            menu.id
                        )
                );

            deleteButton.classList.add(
                "danger"
            );


            menuActions.appendChild(
                upButton
            );

            menuActions.appendChild(
                downButton
            );

            menuActions.appendChild(
                statusButton
            );

            menuActions.appendChild(
                addButton
            );

            menuActions.appendChild(
                deleteButton
            );


            menuHeader.appendChild(
                menuButton
            );

            menuHeader.appendChild(
                menuActions
            );


            menuBox.appendChild(
                menuHeader
            );


            const submenuList =
                document.createElement(
                    "div"
                );

            submenuList.className =
                "submenu-list";


            sousMenus
                .filter(
                    submenu =>
                        submenu.menu_id ===
                        menu.id
                )
                .forEach(
                    submenu => {

                        const siblings =
                            sousMenus.filter(
                                item =>
                                    item.menu_id ===
                                    menu.id
                            );

                        submenuList.appendChild(
                            renderSousMenu(
                                submenu,
                                siblings
                            )
                        );

                    }
                );


            menuBox.appendChild(
                submenuList
            );

            tree.appendChild(
                menuBox
            );

        }
    );

}


/* =========================================================
   RENDU SOUS-MENU
========================================================= */

function renderSousMenu(
    submenu,
    siblings
) {

    const box =
        document.createElement(
            "div"
        );

    box.className =
        "tree-submenu";


    const header =
        document.createElement(
            "div"
        );

    header.className =
        "tree-submenu-header";


    const button =
        document.createElement(
            "button"
        );

    button.type =
        "button";

    button.className =
        "tree-item-main";

    button.innerHTML = `

        <span class="tree-title">
            ${escapeHtml(submenu.titre)}
        </span>

        <span class="tree-subtitle">
            SOUS-MENU
        </span>

    `;


    button.addEventListener(
        "click",
        () => {

            ouvrirStructure(
                "submenu",
                submenu.id
            );

        }
    );


    const actions =
        document.createElement(
            "div"
        );

    actions.className =
        "tree-actions";


    const index =
        siblings.findIndex(
            item =>
                item.id ===
                submenu.id
        );


    actions.appendChild(
        creerBouton(
            "↑",
            "Monter",
            () =>
                deplacerSousMenu(
                    submenu,
                    siblings,
                    -1
                )
        )
    );


    actions.appendChild(
        creerBouton(
            "↓",
            "Descendre",
            () =>
                deplacerSousMenu(
                    submenu,
                    siblings,
                    1
                )
        )
    );


    actions.appendChild(
        creerStatusButton(
            submenu
        )
    );


    actions.appendChild(
        creerBouton(
            "+",
            "Ajouter un contenu",
            () =>
                ouvrirModalCreation(
                    "content",
                    submenu.id
                )
        )
    );


    const deleteButton =
        creerBouton(
            "×",
            "Supprimer",
            () =>
                supprimerSousMenu(
                    submenu.id
                )
        );

    deleteButton.classList.add(
        "danger"
    );

    actions.appendChild(
        deleteButton
    );


    header.appendChild(
        button
    );

    header.appendChild(
        actions
    );

    box.appendChild(
        header
    );


    const contentList =
        document.createElement(
            "div"
        );

    contentList.className =
        "content-list";


    const contentSiblings =
        contenus.filter(
            content =>
                content.sous_menu_id ===
                submenu.id
        );


    contentSiblings.forEach(
        content => {

            contentList.appendChild(
                renderContenu(
                    content,
                    contentSiblings
                )
            );

        }
    );


    box.appendChild(
        contentList
    );


    return box;

}


/* =========================================================
   RENDU CONTENU
========================================================= */

function renderContenu(
    item,
    siblings
) {

    const row =
        document.createElement(
            "div"
        );

    row.className =
        "tree-content";


    const button =
        document.createElement(
            "button"
        );

    button.type =
        "button";

    button.className =
        "tree-content-button";

    button.textContent =
        item.titre;


    button.addEventListener(
        "click",
        () => {

            ouvrirContenu(
                item.id
            );

        }
    );


    const actions =
        document.createElement(
            "div"
        );

    actions.className =
        "tree-actions";


    actions.appendChild(
        creerBouton(
            "↑",
            "Monter",
            () =>
                deplacerContenu(
                    item,
                    siblings,
                    -1
                )
        )
    );


    actions.appendChild(
        creerBouton(
            "↓",
            "Descendre",
            () =>
                deplacerContenu(
                    item,
                    siblings,
                    1
                )
        )
    );


    actions.appendChild(
        creerStatusButton(
            item
        )
    );


    const deleteButton =
        creerBouton(
            "×",
            "Supprimer",
            () =>
                supprimerContenu(
                    item.id
                )
        );

    deleteButton.classList.add(
        "danger"
    );


    actions.appendChild(
        deleteButton
    );


    row.appendChild(
        button
    );

    row.appendChild(
        actions
    );


    return row;

}


/* =========================================================
   BOUTONS
========================================================= */

function creerBouton(
    texte,
    title,
    action
) {

    const button =
        document.createElement(
            "button"
        );

    button.type =
        "button";

    button.className =
        "icon-button";

    button.textContent =
        texte;

    button.title =
        title;

    button.addEventListener(
        "click",
        event => {

            event.stopPropagation();

            action();

        }
    );


    return button;

}


function creerStatusButton(
    item
) {

    const button =
        document.createElement(
            "button"
        );

    button.type =
        "button";

    button.className =
        "status-button";


    if (item.valide) {

        button.classList.add(
            "status-valid"
        );

        button.textContent =
            "VALIDÉ";

    } else {

        button.classList.add(
            "status-draft"
        );

        button.textContent =
            "BROUILLON";

    }


    button.addEventListener(
        "click",
        event => {

            event.stopPropagation();

            changerValidation(
                item.id,
                item
            );

        }
    );


    return button;

}


/* =========================================================
   LISTES
========================================================= */

function remplirListeMenus(
    select,
    valeur
) {

    select.innerHTML = "";


    menus.forEach(
        menu => {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                menu.id;

            option.textContent =
                menu.titre;

            option.selected =
                String(menu.id) ===
                String(valeur);

            select.appendChild(
                option
            );

        }
    );

}


function remplirListeSousMenus(
    select,
    valeur
) {

    select.innerHTML = "";


    menus.forEach(
        menu => {

            const groupe =
                document.createElement(
                    "optgroup"
                );

            groupe.label =
                menu.titre;


            sousMenus
                .filter(
                    submenu =>
                        submenu.menu_id ===
                        menu.id
                )
                .forEach(
                    submenu => {

                        const option =
                            document.createElement(
                                "option"
                            );

                        option.value =
                            submenu.id;

                        option.textContent =
                            submenu.titre;

                        option.selected =
                            String(submenu.id) ===
                            String(valeur);

                        groupe.appendChild(
                            option
                        );

                    }
                );


            if (groupe.children.length) {

                select.appendChild(
                    groupe
                );

            }

        }
    );

}


/* =========================================================
   STRUCTURE
========================================================= */

function ouvrirStructure(
    type,
    id
) {

    selectedType =
        type;

    selectedId =
        id;


    const collection =
        type === "menu"
            ? menus
            : sousMenus;


    const item =
        collection.find(
            element =>
                element.id === id
        );


    if (!item) {

        return;

    }


    welcome.style.display =
        "none";

    contentEditor.style.display =
        "none";

    structureEditor.style.display =
        "block";


    structureTitle.textContent =
        type === "menu"
            ? "MODIFIER LE MENU"
            : "MODIFIER LE SOUS-MENU";


    structureDescription.textContent =
        type === "menu"
            ? "Modification du menu principal."
            : "Modification du sous-menu.";


    structureName.value =
        item.titre || "";


    if (
        type === "submenu"
    ) {

        structureParentField.style.display =
            "block";

        remplirListeMenus(
            structureParent,
            item.menu_id
        );

    } else {

        structureParentField.style.display =
            "none";

        structureParent.innerHTML =
            "";

    }

}


/* =========================================================
   SAUVEGARDE STRUCTURE
========================================================= */

document
    .getElementById(
        "structureSaveButton"
    )
    .addEventListener(
        "click",
        enregistrerStructure
    );


async function enregistrerStructure() {

    const titre =
        structureName.value.trim();


    if (!titre) {

        showMessage(
            "Le titre est obligatoire.",
            "error"
        );

        return;

    }


    if (
        selectedType ===
        "menu"
    ) {

        const {
            error
        } =
            await supabase
                .from("menus")
                .update({
                    titre
                })
                .eq(
                    "id",
                    selectedId
                );


        if (error) {

            console.error(error);

            showMessage(
                "Impossible d'enregistrer la modification.",
                "error"
            );

            return;

        }

    }


    if (
        selectedType ===
        "submenu"
    ) {

        const submenu =
            sousMenus.find(
                item =>
                    item.id ===
                    selectedId
            );


        if (!submenu) {

            showMessage(
                "Sous-menu introuvable.",
                "error"
            );

            return;

        }


        const nouveauMenuId =
            structureParent.value;


        if (!nouveauMenuId) {

            showMessage(
                "Le menu parent est obligatoire.",
                "error"
            );

            return;

        }


        const ancienMenuId =
            submenu.menu_id;


        let nouvellePosition =
            Number(
                submenu.position
            ) || 0;


        if (
            String(nouveauMenuId) !==
            String(ancienMenuId)
        ) {

            const destination =
                sousMenus.filter(
                    item =>
                        item.menu_id ===
                        nouveauMenuId &&
                        item.id !==
                        selectedId
                );


            nouvellePosition =
                getNextPosition(
                    destination
                );

        }


        const {
            error
        } =
            await supabase
                .from("sous_menus")
                .update({

                    titre,

                    menu_id:
                        nouveauMenuId,

                    position:
                        nouvellePosition

                })
                .eq(
                    "id",
                    selectedId
                );


        if (error) {

            console.error(error);

            showMessage(
                "Impossible d'enregistrer la modification.",
                "error"
            );

            return;

        }

    }


    showMessage(
        "Modification enregistrée."
    );


    await chargerDonnees();

    fermerEditeurs();

}


/* =========================================================
   CREATION
========================================================= */

function ouvrirModalCreation(
    type,
    parentId
) {

    modalType =
        type;

    modalParentId =
        parentId;


    modalTitle.textContent =
        type === "submenu"
            ? "NOUVEAU SOUS-MENU"
            : "NOUVEAU CONTENU";


    modalName.value =
        "";


    modalSaveButton.textContent =
        "CRÉER";


    structureModal.classList.add(
        "visible"
    );


    setTimeout(
        () => {

            modalName.focus();

        },
        50
    );

}


document
    .getElementById(
        "addMenuButton"
    )
    .addEventListener(
        "click",
        () => {

            modalType =
                "menu";

            modalParentId =
                null;

            modalTitle.textContent =
                "NOUVEAU MENU";

            modalName.value =
                "";

            modalSaveButton.textContent =
                "CRÉER";

            structureModal.classList.add(
                "visible"
            );

            setTimeout(
                () => {

                    modalName.focus();

                },
                50
            );

        }
    );


function fermerModal() {

    structureModal.classList.remove(
        "visible"
    );

    modalType =
        null;

    modalParentId =
        null;

}


document
    .getElementById(
        "modalCloseButton"
    )
    .addEventListener(
        "click",
        fermerModal
    );


document
    .getElementById(
        "modalCancelButton"
    )
    .addEventListener(
        "click",
        fermerModal
    );


structureModal.addEventListener(
    "click",
    event => {

        if (
            event.target ===
            structureModal
        ) {

            fermerModal();

        }

    }
);


modalSaveButton.addEventListener(
    "click",
    creerElement
);


modalName.addEventListener(
    "keydown",
    event => {

        if (
            event.key ===
            "Enter"
        ) {

            event.preventDefault();

            creerElement();

        }

    }
);


/* =========================================================
   CREER ELEMENT
========================================================= */

async function creerElement() {

    const titre =
        modalName.value.trim();


    if (!titre) {

        showMessage(
            "Le titre est obligatoire.",
            "error"
        );

        return;

    }


    modalSaveButton.disabled =
        true;


    try {

        if (
            modalType ===
            "menu"
        ) {

            const position =
                getNextPosition(
                    menus
                );


            const {
                error
            } =
                await supabase
                    .from("menus")
                    .insert({

                        titre,

                        position,

                        valide:
                            false

                    });


            if (error) {

                throw error;

            }

        }


        if (
            modalType ===
            "submenu"
        ) {

            const siblings =
                sousMenus.filter(
                    item =>
                        item.menu_id ===
                        modalParentId
                );


            const position =
                getNextPosition(
                    siblings
                );


            const {
                error
            } =
                await supabase
                    .from("sous_menus")
                    .insert({

                        menu_id:
                            modalParentId,

                        titre,

                        position,

                        valide:
                            false

                    });


            if (error) {

                throw error;

            }

        }


        if (
            modalType ===
            "content"
        ) {

            const siblings =
                contenus.filter(
                    item =>
                        item.sous_menu_id ===
                        modalParentId
                );


            const position =
                getNextPosition(
                    siblings
                );


            const {
                error
            } =
                await supabase
                    .from("contenus")
                    .insert({

                        sous_menu_id:
                            modalParentId,

                        titre,

                        html:
                            "<p></p>",

                        position,

                        valide:
                            false,

                        photo_url:
                            null,

                        accroche:
                            null,

                        priorite:
                            null,

                        stat_1:
                            null,

                        stat_2:
                            null,

                        stat_3:
                            null,

                        synergies:
                            []

                    });


            if (error) {

                throw error;

            }

        }


        fermerModal();

        await chargerDonnees();

        showMessage(
            "Élément créé."
        );

    }
    catch (error) {

        console.error(error);

        showMessage(
            "Impossible de créer l'élément.",
            "error"
        );

    }
    finally {

        modalSaveButton.disabled =
            false;

    }

}


/* =========================================================
   POSITION
========================================================= */

function getNextPosition(
    items
) {

    if (!items.length) {

        return 0;

    }


    return Math.max(
        ...items.map(
            item =>
                Number(
                    item.position
                ) || 0
        )
    ) + 1;

}


/* =========================================================
   OUVRIR CONTENU
========================================================= */

function ouvrirContenu(
    id
) {

    const item =
        contenus.find(
            content =>
                content.id ===
                id
        );


    if (!item) {

        return;

    }


    editorType =
        "content";

    editorId =
        id;


    welcome.style.display =
        "none";

    structureEditor.style.display =
        "none";

    contentEditor.style.display =
        "block";


    contentEditorTitle.textContent =
        "MODIFIER LE CONTENU";


    contentTitle.value =
        item.titre || "";


    remplirListeSousMenus(
        contentParent,
        item.sous_menu_id
    );


    /* -----------------------------------------------------
       RECTO
    ----------------------------------------------------- */

    if (cardPhoto) {

        cardPhoto.value =
            item.photo_url || "";

    }


    if (cardAccroche) {

        cardAccroche.value =
            item.accroche || "";

    }


    if (cardPriorite) {

        cardPriorite.value =
            item.priorite || "";

    }


    if (cardStat1) {

        cardStat1.value =
            item.stat_1 || "";

    }


    if (cardStat2) {

        cardStat2.value =
            item.stat_2 || "";

    }


    if (cardStat3) {

        cardStat3.value =
            item.stat_3 || "";

    }


    remplirListeSynergies(
        item.synergies || []
    );


    /* -----------------------------------------------------
       VERSO HTML — INCHANGE
    ----------------------------------------------------- */

    wysiwyg.innerHTML =
        item.html || "";


    sourceEditor.value =
        item.html || "";


    isSourceMode =
        false;


    actualiserModeEditeur();

}


/* =========================================================
   ANNULER CONTENU
========================================================= */

document
    .getElementById(
        "contentCancelButton"
    )
    .addEventListener(
        "click",
        fermerEditeurs
    );


/* =========================================================
   ENREGISTRER CONTENU
========================================================= */

document
    .getElementById(
        "contentSaveButton"
    )
    .addEventListener(
        "click",
        enregistrerContenu
    );


async function enregistrerContenu() {

    const titre =
        contentTitle.value.trim();


    if (!titre) {

        showMessage(
            "Le titre est obligatoire.",
            "error"
        );

        return;

    }


    const contenu =
        contenus.find(
            item =>
                item.id ===
                editorId
        );


    if (!contenu) {

        showMessage(
            "Contenu introuvable.",
            "error"
        );

        return;

    }


    const nouveauSousMenuId =
        contentParent.value;


    if (!nouveauSousMenuId) {

        showMessage(
            "Le sous-menu parent est obligatoire.",
            "error"
        );

        return;

    }


    /* -----------------------------------------------------
       HTML
    ----------------------------------------------------- */

    if (isSourceMode) {

        wysiwyg.innerHTML =
            sourceEditor.value;

    }


    const html =
        wysiwyg.innerHTML;


    /* -----------------------------------------------------
       RECTO
    ----------------------------------------------------- */

    const photo =
        cardPhoto
            ? cardPhoto.value.trim()
            : null;


    const accroche =
        cardAccroche
            ? cardAccroche.value.trim()
            : null;


    const priorite =
        cardPriorite
            ? cardPriorite.value.trim()
            : null;


    const stat1 =
        cardStat1
            ? cardStat1.value || null
            : null;


    const stat2 =
        cardStat2
            ? cardStat2.value || null
            : null;


    const stat3 =
        cardStat3
            ? cardStat3.value || null
            : null;


    const synergies =
        obtenirSynergies();


    /* -----------------------------------------------------
       VERIFICATION : 3 STATS MAXIMUM
    ----------------------------------------------------- */

    const statistiques =
        [
            stat1,
            stat2,
            stat3
        ].filter(Boolean);


    if (
        statistiques.length >
        3
    ) {

        showMessage(
            "Trois statistiques maximum.",
            "error"
        );

        return;

    }


    /* -----------------------------------------------------
       POSITION
    ----------------------------------------------------- */

    const ancienSousMenuId =
        contenu.sous_menu_id;


    let nouvellePosition =
        Number(
            contenu.position
        ) || 0;


    if (
        String(nouveauSousMenuId) !==
        String(ancienSousMenuId)
    ) {

        const destination =
            contenus.filter(
                item =>
                    item.sous_menu_id ===
                    nouveauSousMenuId &&
                    item.id !==
                    editorId
            );


        nouvellePosition =
            getNextPosition(
                destination
            );

    }


    /* -----------------------------------------------------
       UPDATE
    ----------------------------------------------------- */

    const {
        error
    } =
        await supabase
            .from("contenus")
            .update({

                titre,

                html,

                sous_menu_id:
                    nouveauSousMenuId,

                position:
                    nouvellePosition,

                photo_url:
                    photo || null,

                accroche:
                    accroche || null,

                priorite:
                    priorite || null,

                stat_1:
                    stat1,

                stat_2:
                    stat2,

                stat_3:
                    stat3,

                synergies:
                    synergies

            })
            .eq(
                "id",
                editorId
            );


    if (error) {

        console.error(error);

        showMessage(
            "Impossible d'enregistrer le contenu.",
            "error"
        );

        return;

    }


    showMessage(
        "Contenu enregistré."
    );


    await chargerDonnees();

    fermerEditeurs();

}


/* =========================================================
   WYSIWYG
========================================================= */

document
    .querySelectorAll(
        "#toolbar button[data-command]"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    const command =
                        button.dataset.command;

                    const value =
                        button.dataset.value ||
                        null;

                    wysiwyg.focus();

                    document.execCommand(
                        command,
                        false,
                        value
                    );

                }
            );

        }
    );


document
    .querySelectorAll(
        "#toolbar button[data-format]"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    const format =
                        button.dataset.format;

                    wysiwyg.focus();

                    document.execCommand(
                        "formatBlock",
                        false,
                        format
                    );

                }
            );

        }
    );


document
    .getElementById(
        "linkButton"
    )
    .addEventListener(
        "click",
        () => {

            const url =
                prompt(
                    "Adresse du lien :"
                );


            if (!url) {

                return;

            }


            wysiwyg.focus();

            document.execCommand(
                "createLink",
                false,
                url
            );

        }
    );


document
    .getElementById(
        "imageButton"
    )
    .addEventListener(
        "click",
        () => {

            const url =
                prompt(
                    "URL de l'image :"
                );


            if (!url) {

                return;

            }


            wysiwyg.focus();

            document.execCommand(
                "insertImage",
                false,
                url
            );

        }
    );


document
    .getElementById(
        "videoButton"
    )
    .addEventListener(
        "click",
        () => {

            const url =
                prompt(
                    "URL de la vidéo :"
                );


            if (!url) {

                return;

            }


            wysiwyg.focus();


            const html = `

                <p>

                    <video
                        controls
                        src="${escapeHtml(url)}"
                    ></video>

                </p>

            `;


            document.execCommand(
                "insertHTML",
                false,
                html
            );

        }
    );


document
    .getElementById(
        "sourceModeButton"
    )
    .addEventListener(
        "click",
        () => {

            if (!isSourceMode) {

                sourceEditor.value =
                    wysiwyg.innerHTML;

                isSourceMode =
                    true;

            } else {

                wysiwyg.innerHTML =
                    sourceEditor.value;

                isSourceMode =
                    false;

            }


            actualiserModeEditeur();

        }
    );


function actualiserModeEditeur() {

    if (isSourceMode) {

        wysiwyg.style.display =
            "none";

        sourceEditor.style.display =
            "block";

        document
            .getElementById(
                "sourceModeButton"
            )
            .textContent =
            "ÉDITEUR VISUEL";

    } else {

        wysiwyg.style.display =
            "block";

        sourceEditor.style.display =
            "none";

        document
            .getElementById(
                "sourceModeButton"
            )
            .textContent =
            "CODE HTML";

    }

}


/* =========================================================
   VALIDATION
========================================================= */

async function changerValidation(
    id,
    item
) {

    const nouveauStatut =
        !Boolean(
            item.valide
        );


    const table =
        menus.some(
            element =>
                element.id === id
        )
            ? "menus"
            : sousMenus.some(
                element =>
                    element.id === id
            )
                ? "sous_menus"
                : "contenus";


    const {
        error
    } =
        await supabase
            .from(table)
            .update({

                valide:
                    nouveauStatut

            })
            .eq(
                "id",
                id
            );


    if (error) {

        console.error(error);

        showMessage(
            "Impossible de modifier le statut.",
            "error"
        );

        return;

    }


    item.valide =
        nouveauStatut;


    renderTree();


    showMessage(
        nouveauStatut
            ? "Élément validé."
            : "Élément passé en brouillon."
    );

}


/* =========================================================
   ORDRE
========================================================= */

async function deplacerMenu(
    index,
    direction
) {

    const otherIndex =
        index + direction;


    if (
        otherIndex < 0 ||
        otherIndex >= menus.length
    ) {

        return;

    }


    await echangerPositions(
        "menus",
        menus[index],
        menus[otherIndex]
    );

}


async function deplacerSousMenu(
    item,
    siblings,
    direction
) {

    const index =
        siblings.findIndex(
            sibling =>
                sibling.id ===
                item.id
        );


    const otherIndex =
        index + direction;


    if (
        otherIndex < 0 ||
        otherIndex >= siblings.length
    ) {

        return;

    }


    await echangerPositions(
        "sous_menus",
        item,
        siblings[otherIndex]
    );

}


async function deplacerContenu(
    item,
    siblings,
    direction
) {

    const index =
        siblings.findIndex(
            sibling =>
                sibling.id ===
                item.id
        );


    const otherIndex =
        index + direction;


    if (
        otherIndex < 0 ||
        otherIndex >= siblings.length
    ) {

        return;

    }


    await echangerPositions(
        "contenus",
        item,
        siblings[otherIndex]
    );

}


async function echangerPositions(
    table,
    first,
    second
) {

    const firstPosition =
        Number(
            first.position
        ) || 0;


    const secondPosition =
        Number(
            second.position
        ) || 0;


    const firstUpdate =
        await supabase
            .from(table)
            .update({

                position:
                    secondPosition

            })
            .eq(
                "id",
                first.id
            );


    if (firstUpdate.error) {

        console.error(
            firstUpdate.error
        );

        showMessage(
            "Impossible de modifier l'ordre.",
            "error"
        );

        return;

    }


    const secondUpdate =
        await supabase
            .from(table)
            .update({

                position:
                    firstPosition

            })
            .eq(
                "id",
                second.id
            );


    if (secondUpdate.error) {

        console.error(
            secondUpdate.error
        );

        showMessage(
            "Impossible de modifier l'ordre.",
            "error"
        );

        await chargerDonnees();

        return;

    }


    await chargerDonnees();

}


/* =========================================================
   SUPPRESSION MENU
========================================================= */

async function supprimerMenu(
    id
) {

    const menu =
        menus.find(
            item =>
                item.id === id
        );


    if (!menu) {

        return;

    }


    const children =
        sousMenus.filter(
            item =>
                item.menu_id === id
        );


    const contentCount =
        contenus.filter(
            content =>
                children.some(
                    submenu =>
                        submenu.id ===
                        content.sous_menu_id
                )
        ).length;


    const confirmation =
        confirm(

            "Supprimer le menu « " +
            menu.titre +
            " » ?" +

            (

                children.length ||
                contentCount

                    ? "\n\nCela supprimera également " +
                      children.length +
                      " sous-menu(s) et " +
                      contentCount +
                      " contenu(s)."

                    : ""

            )

        );


    if (!confirmation) {

        return;

    }


    for (
        const submenu of children
    ) {

        const {
            error
        } =
            await supabase
                .from("contenus")
                .delete()
                .eq(
                    "sous_menu_id",
                    submenu.id
                );


        if (error) {

            console.error(error);

            showMessage(
                "Suppression interrompue.",
                "error"
            );

            await chargerDonnees();

            return;

        }

    }


    const {
        error:
            submenuError
    } =
        await supabase
            .from("sous_menus")
            .delete()
            .eq(
                "menu_id",
                id
            );


    if (submenuError) {

        console.error(
            submenuError
        );

        showMessage(
            "Impossible de supprimer le menu.",
            "error"
        );

        return;

    }


    const {
        error
    } =
        await supabase
            .from("menus")
            .delete()
            .eq(
                "id",
                id
            );


    if (error) {

        console.error(error);

        showMessage(
            "Impossible de supprimer le menu.",
            "error"
        );

        return;

    }


    fermerEditeurs();

    await chargerDonnees();

    showMessage(
        "Menu supprimé."
    );

}


/* =========================================================
   SUPPRESSION SOUS-MENU
========================================================= */

async function supprimerSousMenu(
    id
) {

    const submenu =
        sousMenus.find(
            item =>
                item.id === id
        );


    if (!submenu) {

        return;

    }


    const childCount =
        contenus.filter(
            item =>
                item.sous_menu_id ===
                id
        ).length;


    if (
        !confirm(

            "Supprimer le sous-menu « " +
            submenu.titre +
            " » ?" +

            (
                childCount
                    ? "\n\nCela supprimera également " +
                      childCount +
                      " contenu(s)."
                    : ""
            )

        )
    ) {

        return;

    }


    const {
        error:
            contentError
    } =
        await supabase
            .from("contenus")
            .delete()
            .eq(
                "sous_menu_id",
                id
            );


    if (contentError) {

        console.error(
            contentError
        );

        showMessage(
            "Impossible de supprimer les contenus.",
            "error"
        );

        return;

    }


    const {
        error
    } =
        await supabase
            .from("sous_menus")
            .delete()
            .eq(
                "id",
                id
            );


    if (error) {

        console.error(error);

        showMessage(
            "Impossible de supprimer le sous-menu.",
            "error"
        );

        return;

    }


    fermerEditeurs();

    await chargerDonnees();

    showMessage(
        "Sous-menu supprimé."
    );

}


/* =========================================================
   SUPPRESSION CONTENU
========================================================= */

async function supprimerContenu(
    id
) {

    const item =
        contenus.find(
            content =>
                content.id === id
        );


    if (!item) {

        return;

    }


    if (
        !confirm(
            "Supprimer le contenu « " +
            item.titre +
            " » ?"
        )
    ) {

        return;

    }


    const {
        error
    } =
        await supabase
            .from("contenus")
            .delete()
            .eq(
                "id",
                id
            );


    if (error) {

        console.error(error);

        showMessage(
            "Impossible de supprimer le contenu.",
            "error"
        );

        return;

    }


    fermerEditeurs();

    await chargerDonnees();

    showMessage(
        "Contenu supprimé."
    );

}


/* =========================================================
   FERMETURE EDITEURS
========================================================= */

function fermerEditeurs() {

    welcome.style.display =
        "block";

    structureEditor.style.display =
        "none";

    contentEditor.style.display =
        "none";


    structureParentField.style.display =
        "none";


    selectedType =
        null;

    selectedId =
        null;

    editorType =
        null;

    editorId =
        null;

}


/* =========================================================
   CTRL + S
========================================================= */

document.addEventListener(
    "keydown",
    event => {

        if (
            (event.ctrlKey ||
             event.metaKey) &&
            event.key.toLowerCase() ===
            "s"
        ) {

            event.preventDefault();


            if (
                contentEditor.style.display !==
                "none"
            ) {

                enregistrerContenu();

            }


            if (
                structureEditor.style.display !==
                "none"
            ) {

                enregistrerStructure();

            }

        }

    }
);


/* =========================================================
   INITIALISATION
========================================================= */

async function initialiser() {

    try {

        await verifierAdmin();

        await chargerDonnees();

    }
    catch (error) {

        console.error(
            "CONTENUS :",
            error
        );


        tree.innerHTML = `

            <div class="empty-tree">

                ${escapeHtml(
                    error.message ||
                    "Accès impossible."
                )}

                <br><br>

                <a
                    href="admin.html"
                    style="
                        color:var(--gold-light);
                    "
                >
                    Retour à l'administration
                </a>

            </div>

        `;


        const addMenuButton =
            document.getElementById(
                "addMenuButton"
            );


        if (addMenuButton) {

            addMenuButton.disabled =
                true;

        }


        welcome.innerHTML = `

            <h1>ACCÈS REFUSÉ</h1>

            <p>
                ${escapeHtml(
                    error.message ||
                    "Vous n'avez pas accès à cette page."
                )}
            </p>

        `;

    }

}


initialiser();

