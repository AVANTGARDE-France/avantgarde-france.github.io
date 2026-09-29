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
    sib

