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

const contentPhoto =
    document.getElementById("contentPhoto");

const contentAccroche =
    document.getElementById("contentAccroche");

const contentPriority =
    document.getElementById("contentPriority");

const contentStat1 =
    document.getElementById("contentStat1");

const contentStat2 =
    document.getElementById("contentStat2");

const contentStat3 =
    document.getElementById("contentStat3");

const contentSynergies =
    document.getElementById("contentSynergies");


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

        window.location.href =
            "admin.html";

        return false;

    }


    const {
        data: profile,
        error: profileError
    } =
        await supabase
            .from("profils")
            .select("*")
            .eq(
                "id",
                user.id
            )
            .maybeSingle();


    if (profileError) {

        console.error(
            profileError
        );

        showMessage(
            "Impossible de vérifier votre profil.",
            "error"
        );

        return false;

    }


    if (!profile) {

        window.location.href =
            "admin.html";

        return false;

    }


    currentProfile =
        profile;


    const role =
        String(
            profile.role ||
            profile.grade ||
            ""
        )
            .toLowerCase()
            .trim();


    const autorise =
        [
            "admin",
            "administrateur",
            "fondateur",
            "commissaire fondateur",
            "délégué national"
        ]
            .some(
                value =>
                    role.includes(value)
            );


    if (!autorise) {

        window.location.href =
            "admin.html";

        return false;

    }


    if (connectedUser) {

        connectedUser.textContent =
            profile.nom_affiche ||
            profile.nom ||
            user.email ||
            "";

    }


    return true;

}


/* =========================================================
   CHARGEMENT DES DONNEES
========================================================= */

async function chargerDonnees() {

    tree.innerHTML =
        `
            <div class="loading">
                Chargement…
            </div>
        `;


    const [
        menusResult,
        sousMenusResult,
        contenusResult,
        statsResult
    ] =
        await Promise.all([

            supabase
                .from("menus")
                .select("*")
                .order(
                    "position",
                    {
                        ascending: true
                    }
                ),

            supabase
                .from("sous_menus")
                .select("*")
                .order(
                    "position",
                    {
                        ascending: true
                    }
                ),

            supabase
                .from("contenus")
                .select("*")
                .order(
                    "position",
                    {
                        ascending: true
                    }
                ),

            supabase
                .from("statistiques")
                .select("*")
                .order(
                    "position",
                    {
                        ascending: true
                    }
                )

        ]);


    if (menusResult.error) {

        console.error(
            menusResult.error
        );

        showMessage(
            "Impossible de charger les menus.",
            "error"
        );

        return;

    }


    if (sousMenusResult.error) {

        console.error(
            sousMenusResult.error
        );

        showMessage(
            "Impossible de charger les sous-menus.",
            "error"
        );

        return;

    }


    if (contenusResult.error) {

        console.error(
            contenusResult.error
        );

        showMessage(
            "Impossible de charger les contenus.",
            "error"
        );

        return;

    }


    if (statsResult.error) {

        console.error(
            statsResult.error
        );

        showMessage(
            "Impossible de charger les statistiques.",
            "error"
        );

        return;

    }


    menus =
        menusResult.data || [];

    sousMenus =
        sousMenusResult.data || [];

    contenus =
        contenusResult.data || [];

    stats =
        statsResult.data || [];


    renderTree();

}


/* =========================================================
   TREE
========================================================= */

function renderTree() {

    tree.innerHTML = "";


    if (!menus.length) {

        tree.innerHTML =
            `
                <div class="empty-tree">
                    Aucun menu.
                </div>
            `;

        return;

    }


    menus.forEach(
        menu => {

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


            const menuMain =
                document.createElement(
                    "button"
                );

            menuMain.type =
                "button";

            menuMain.className =
                "tree-item-main";


            const menuTitle =
                document.createElement(
                    "span"
                );

            menuTitle.className =
                "tree-title";

            menuTitle.textContent =
                menu.titre ||
                "Menu sans titre";


            const menuSubtitle =
                document.createElement(
                    "span"
                );

            menuSubtitle.className =
                "tree-subtitle";

            menuSubtitle.textContent =
                "MENU";


            menuMain.appendChild(
                menuTitle
            );

            menuMain.appendChild(
                menuSubtitle
            );


            menuMain.addEventListener(
                "click",
                () => {

                    ouvrirStructure(
                        "menu",
                        menu.id
                    );

                }
            );


            const actions =
                document.createElement(
                    "div"
                );

            actions.className =
                "tree-actions";


            const up =
                creerBoutonIcone(
                    "↑",
                    "Monter",
                    () =>
                        deplacerElement(
                            "menu",
                            menu.id,
                            -1
                        )
                );


            const down =
                creerBoutonIcone(
                    "↓",
                    "Descendre",
                    () =>
                        deplacerElement(
                            "menu",
                            menu.id,
                            1
                        )
                );


            const add =
                creerBoutonIcone(
                    "+",
                    "Ajouter un sous-menu",
                    () =>
                        ouvrirModal(
                            "submenu",
                            menu.id
                        )
                );


            const remove =
                creerBoutonIcone(
                    "×",
                    "Supprimer",
                    () =>
                        supprimerElement(
                            "menu",
                            menu.id
                        )
                );

            remove.classList.add(
                "danger"
            );


            actions.appendChild(up);
            actions.appendChild(down);
            actions.appendChild(add);
            actions.appendChild(remove);


            const status =
                creerStatusButton(
                    menu,
                    "menu"
                );


            actions.appendChild(
                status
            );


            menuHeader.appendChild(
                menuMain
            );

            menuHeader.appendChild(
                actions
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


            const children =
                sousMenus
                    .filter(
                        item =>
                            String(
                                item.menu_id
                            ) ===
                            String(
                                menu.id
                            )
                    )
                    .sort(
                        (
                            a,
                            b
                        ) =>
                            (
                                Number(a.position) ||
                                0
                            ) -
                            (
                                Number(b.position) ||
                                0
                            )
                    );


            children.forEach(
                submenu => {

                    submenuList.appendChild(
                        renderSubmenu(
                            submenu
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
   RENDER SOUS-MENU
========================================================= */

function renderSubmenu(
    submenu
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


    const main =
        document.createElement(
            "button"
        );

    main.type =
        "button";

    main.className =
        "tree-item-main";


    const title =
        document.createElement(
            "span"
        );

    title.className =
        "tree-title";

    title.textContent =
        submenu.titre ||
        "Sous-menu sans titre";


    const subtitle =
        document.createElement(
            "span"
        );

    subtitle.className =
        "tree-subtitle";

    subtitle.textContent =
        "SOUS-MENU";


    main.appendChild(
        title
    );

    main.appendChild(
        subtitle
    );


    main.addEventListener(
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


    actions.appendChild(
        creerBoutonIcone(
            "↑",
            "Monter",
            () =>
                deplacerElement(
                    "submenu",
                    submenu.id,
                    -1
                )
        )
    );


    actions.appendChild(
        creerBoutonIcone(
            "↓",
            "Descendre",
            () =>
                deplacerElement(
                    "submenu",
                    submenu.id,
                    1
                )
        )
    );


    actions.appendChild(
        creerBoutonIcone(
            "+",
            "Ajouter un contenu",
            () =>
                ouvrirModal(
                    "content",
                    submenu.id
                )
        )
    );


    const remove =
        creerBoutonIcone(
            "×",
            "Supprimer",
            () =>
                supprimerElement(
                    "submenu",
                    submenu.id
                )
        );

    remove.classList.add(
        "danger"
    );

    actions.appendChild(
        remove
    );


    actions.appendChild(
        creerStatusButton(
            submenu,
            "submenu"
        )
    );


    header.appendChild(
        main
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


    const children =
        contenus
            .filter(
                item =>
                    String(
                        item.sous_menu_id
                    ) ===
                    String(
                        submenu.id
                    )
            )
            .sort(
                (
                    a,
                    b
                ) =>
                    (
                        Number(a.position) ||
                        0
                    ) -
                    (
                        Number(b.position) ||
                        0
                    )
            );


    children.forEach(
        contenu => {

            contentList.appendChild(
                renderContent(
                    contenu
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
   RENDER CONTENU
========================================================= */

function renderContent(
    contenu
) {

    const row =
        document.createElement(
            "div"
        );

    row.className =
        "tree-content";


    const main =
        document.createElement(
            "button"
        );

    main.type =
        "button";

    main.className =
        "tree-content-button";


    main.textContent =
        contenu.titre ||
        "Contenu sans titre";


    main.addEventListener(
        "click",
        () => {

            ouvrirContenu(
                contenu.id
            );

        }
    );


    row.appendChild(
        main
    );


    const actions =
        document.createElement(
            "div"
        );

    actions.className =
        "tree-actions";


    actions.appendChild(
        creerBoutonIcone(
            "↑",
            "Monter",
            () =>
                deplacerElement(
                    "content",
                    contenu.id,
                    -1
                )
        )
    );


    actions.appendChild(
        creerBoutonIcone(
            "↓",
            "Descendre",
            () =>
                deplacerElement(
                    "content",
                    contenu.id,
                    1
                )
        )
    );


    const remove =
        creerBoutonIcone(
            "×",
            "Supprimer",
            () =>
                supprimerElement(
                    "content",
                    contenu.id
                )
        );

    remove.classList.add(
        "danger"
    );


    actions.appendChild(
        remove
    );


    actions.appendChild(
        creerStatusButton(
            contenu,
            "content"
        )
    );


    row.appendChild(
        actions
    );


    return row;

}


/* =========================================================
   BOUTON ICONE
========================================================= */

function creerBoutonIcone(
    text,
    title,
    callback
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
        text;

    button.title =
        title;

    button.addEventListener(
        "click",
        event => {

            event.stopPropagation();

            callback();

        }
    );


    return button;

}


/* =========================================================
   STATUT
========================================================= */

function creerStatusButton(
    item,
    type
) {

    const button =
        document.createElement(
            "button"
        );

    button.type =
        "button";

    button.className =
        "status-button";


    const valide =
        Boolean(
            item.valide
        );


    button.textContent =
        valide
            ? "VALIDÉ"
            : "BROUILLON";


    button.classList.add(
        valide
            ? "status-valid"
            : "status-draft"
    );


    button.title =
        valide
            ? "Cliquer pour repasser en brouillon"
            : "Cliquer pour valider";


    button.addEventListener(
        "click",
        event => {

            event.stopPropagation();

            basculerValidation(
                type,
                item.id,
                !valide
            );

        }
    );


    return button;

}


/* =========================================================
   MODAL
========================================================= */

function ouvrirModal(
    type,
    parentId
) {

    modalType =
        type;

    modalParentId =
        parentId ||
        null;


    modalName.value =
        "";


    if (type === "menu") {

        modalTitle.textContent =
            "Nouveau menu";

        modalSaveButton.textContent =
            "CRÉER";

    }


    if (type === "submenu") {

        modalTitle.textContent =
            "Nouveau sous-menu";

        modalSaveButton.textContent =
            "CRÉER";

    }


    if (type === "content") {

        modalTitle.textContent =
            "Nouveau contenu";

        modalSaveButton.textContent =
            "CRÉER";

    }


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


function fermerModal() {

    structureModal.classList.remove(
        "visible"
    );

    modalType =
        null;

    modalParentId =
        null;

    modalName.value =
        "";

}


/* =========================================================
   CREATION
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
                            [],

                        valide:
                            false

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

        console.error(
            error
        );

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

    if (
        !items.length
    ) {

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
   RECTO — SYNERGIES
========================================================= */

let synergySelectedIds = [];

let synergySearchTerm = "";


function normaliserRechercheSynergie(
    value
) {

    return String(
        value || ""
    )
        .normalize("NFD")
        .replace(
            /[\u0300-\u036f]/g,
            ""
        )
        .toLowerCase()
        .trim();

}


function obtenirTitreSynergie(
    id
) {

    const item =
        contenus.find(
            contenu =>
                String(
                    contenu.id
                ) ===
                String(id)
        );


    return item
        ? (
            item.titre ||
            "Mesure sans titre"
        )
        : "Mesure introuvable";

}


function remplirListeSynergies(
    selectedIds = [],
    currentId = null
) {

    synergySelectedIds =
        Array.from(
            new Set(
                (selectedIds || [])
                    .map(
                        id =>
                            String(id)
                    )
                    .filter(
                        id =>
                            id &&
                            id !==
                            String(
                                currentId
                            )
                    )
            )
        );


    synergySearchTerm =
        "";


    const search =
        document.getElementById(
            "synergySearch"
        );


    if (search) {

        search.value =
            "";

    }


    renderSynergyPicker();

}


function renderSynergyPicker() {

    if (!contentSynergies) {

        return;

    }


    const available =
        document.getElementById(
            "synergyAvailable"
        );

    const selected =
        document.getElementById(
            "synergySelected"
        );

    const availableCount =
        document.getElementById(
            "synergyAvailableCount"
        );

    const selectedCount =
        document.getElementById(
            "synergySelectedCount"
        );


    if (
        !available ||
        !selected
    ) {

        return;

    }


    const currentId =
        String(
            editorId || ""
        );


    const selectedSet =
        new Set(
            synergySelectedIds.map(
                id =>
                    String(id)
            )
        );


    const searchTerm =
        normaliserRechercheSynergie(
            synergySearchTerm
        );


    const allAvailable =
        contenus
            .filter(
                item =>
                    String(
                        item.id
                    ) !==
                    currentId
            )
            .slice()
            .sort(
                (
                    a,
                    b
                ) =>
                    String(
                        a.titre || ""
                    ).localeCompare(
                        String(
                            b.titre || ""
                        ),
                        "fr"
                    )
            );


    const filteredAvailable =
        allAvailable.filter(
            item => {

                if (
                    selectedSet.has(
                        String(
                            item.id
                        )
                    )
                ) {

                    return false;

                }


                if (!searchTerm) {

                    return true;

                }


                return normaliserRechercheSynergie(
                    item.titre
                ).includes(
                    searchTerm
                );

            }
        );


    available.innerHTML =
        "";


    if (
        !filteredAvailable.length
    ) {

        const empty =
            document.createElement(
                "div"
            );

        empty.className =
            "synergy-empty";


        empty.textContent =
            searchTerm
                ? "Aucune mesure ne correspond à votre recherche."
                : "Aucune mesure disponible.";


        available.appendChild(
            empty
        );

    }
    else {

        filteredAvailable.forEach(
            item => {

                const button =
                    document.createElement(
                        "button"
                    );

                button.type =
                    "button";

                button.className =
                    "synergy-item";


                const title =
                    document.createElement(
                        "span"
                    );

                title.className =
                    "synergy-item-title";

                title.textContent =
                    item.titre ||
                    "Mesure sans titre";


                const action =
                    document.createElement(
                        "span"
                    );

                action.className =
                    "synergy-item-action";

                action.textContent =
                    "AJOUTER";


                button.appendChild(
                    title
                );

                button.appendChild(
                    action
                );


                button.addEventListener(
                    "click",
                    () => {

                        ajouterSynergie(
                            item.id
                        );

                    }
                );


                available.appendChild(
                    button
                );

            }
        );

    }


    selected.innerHTML =
        "";


    const selectedItems =
        synergySelectedIds
            .map(
                id =>
                    contenus.find(
                        item =>
                            String(
                                item.id
                            ) ===
                            String(id)
                    )
            )
            .filter(Boolean);


    if (
        !selectedItems.length
    ) {

        const empty =
            document.createElement(
                "div"
            );

        empty.className =
            "synergy-empty";

        empty.textContent =
            "Aucune synergie sélectionnée.";


        selected.appendChild(
            empty
        );

    }
    else {

        selectedItems.forEach(
            item => {

                const button =
                    document.createElement(
                        "button"
                    );

                button.type =
                    "button";

                button.className =
                    "synergy-item synergy-selected-item";


                const title =
                    document.createElement(
                        "span"
                    );

                title.className =
                    "synergy-item-title";

                title.textContent =
                    item.titre ||
                    "Mesure sans titre";


                const action =
                    document.createElement(
                        "span"
                    );

                action.className =
                    "synergy-item-action";

                action.textContent =
                    "RETIRER";


                button.appendChild(
                    title
                );

                button.appendChild(
                    action
                );


                button.addEventListener(
                    "click",
                    () => {

                        retirerSynergie(
                            item.id
                        );

                    }
                );


                selected.appendChild(
                    button
                );

            }
        );

    }


    if (availableCount) {

        availableCount.textContent =
            filteredAvailable.length ===
            1
                ? "1 mesure"
                : (
                    filteredAvailable.length +
                    " mesures"
                );

    }


    if (selectedCount) {

        selectedCount.textContent =
            synergySelectedIds.length ===
            1
                ? "1 sélectionnée"
                : (
                    synergySelectedIds.length +
                    " sélectionnées"
                );

    }

}


function ajouterSynergie(
    id
) {

    const stringId =
        String(id);


    if (
        !synergySelectedIds.includes(
            stringId
        )
    ) {

        synergySelectedIds.push(
            stringId
        );

    }


    renderSynergyPicker();

}


function retirerSynergie(
    id
) {

    const stringId =
        String(id);


    synergySelectedIds =
        synergySelectedIds.filter(
            item =>
                String(item) !==
                stringId
        );


    renderSynergyPicker();

}


function retirerToutesLesSynergies() {

    synergySelectedIds =
        [];

    renderSynergyPicker();

}


function obtenirSynergies() {

    return synergySelectedIds.slice();

}


/* =========================================================
   RECHERCHE SYNERGIES
========================================================= */

const synergySearch =
    document.getElementById(
        "synergySearch"
    );


if (synergySearch) {

    synergySearch.addEventListener(
        "input",
        () => {

            synergySearchTerm =
                synergySearch.value;

            renderSynergyPicker();

        }
    );

}


const synergyClearButton =
    document.getElementById(
        "synergyClearButton"
    );


if (synergyClearButton) {

    synergyClearButton.addEventListener(
        "click",
        () => {

            retirerToutesLesSynergies();

        }
    );

}


/* =========================================================
   OUVRIR STRUCTURE
========================================================= */

function ouvrirStructure(
    type,
    id
) {

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

        showMessage(
            "Élément introuvable.",
            "error"
        );

        return;

    }


    selectedType =
        type;

    selectedId =
        id;

    editorType =
        type;

    editorId =
        id;


    welcome.style.display =
        "none";

    contentEditor.style.display =
        "none";

    structureEditor.style.display =
        "block";


    structureTitle.textContent =
        type === "menu"
            ? "Modifier le menu"
            : "Modifier le sous-menu";


    structureDescription.textContent =
        type === "menu"
            ? "Modification de la structure du projet."
            : "Modification du sous-menu et de son menu parent.";


    structureName.value =
        item.titre || "";


    if (
        type === "submenu"
    ) {

        structureParentField.style.display =
            "block";


        remplirParentMenus(
            item.menu_id
        );

    }
    else {

        structureParentField.style.display =
            "none";

    }

}


/* =========================================================
   PARENT MENUS
========================================================= */

function remplirParentMenus(
    selectedId
) {

    structureParent.innerHTML =
        "";


    menus.forEach(
        menu => {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                menu.id;

            option.textContent =
                menu.titre ||
                "Menu sans titre";


            if (
                String(
                    menu.id
                ) ===
                String(
                    selectedId
                )
            ) {

                option.selected =
                    true;

            }


            structureParent.appendChild(
                option
            );

        }
    );

}


/* =========================================================
   SAUVEGARDE STRUCTURE
========================================================= */

async function sauvegarderStructure() {

    if (
        !editorType ||
        !editorId
    ) {

        return;

    }


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
        editorType ===
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
                    editorId
                );


        if (error) {

            console.error(
                error
            );

            showMessage(
                "Impossible d'enregistrer le menu.",
                "error"
            );

            return;

        }

    }


    if (
        editorType ===
        "submenu"
    ) {

        const nouveauMenuId =
            structureParent.value;


        if (!nouveauMenuId) {

            showMessage(
                "Le menu parent est obligatoire.",
                "error"
            );

            return;

        }


        const sousMenu =
            sousMenus.find(
                item =>
                    item.id ===
                    editorId
            );


        if (!sousMenu) {

            showMessage(
                "Sous-menu introuvable.",
                "error"
            );

            return;

        }


        let nouvellePosition =
            Number(
                sousMenu.position
            ) || 0;


        if (
            String(
                nouveauMenuId
            ) !==
            String(
                sousMenu.menu_id
            )
        ) {

            const destination =
                sousMenus.filter(
                    item =>
                        String(
                            item.menu_id
                        ) ===
                        String(
                            nouveauMenuId
                        ) &&
                        String(
                            item.id
                        ) !==
                        String(
                            editorId
                        )
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
                    editorId
                );


        if (error) {

            console.error(
                error
            );

            showMessage(
                "Impossible d'enregistrer le sous-menu.",
                "error"
            );

            return;

        }

    }


    showMessage(
        "Structure enregistrée."
    );


    await chargerDonnees();

    fermerEditeurs();

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

        showMessage(
            "Contenu introuvable.",
            "error"
        );

        return;

    }


    selectedType =
        "content";

    selectedId =
        id;

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
        "Modifier le contenu";


    contentTitle.value =
        item.titre || "";


    remplirParentSousMenus(
        item.sous_menu_id
    );


    if (contentPhoto) {

        contentPhoto.value =
            item.photo_url ||
            "";

    }


    if (contentAccroche) {

        contentAccroche.value =
            item.accroche ||
            "";

    }


    if (contentPriority) {

        contentPriority.value =
            item.priorite ||
            "";

    }


    remplirStatistiques(
        contentStat1
    );

    remplirStatistiques(
        contentStat2
    );

    remplirStatistiques(
        contentStat3
    );


    restaurerStatistique(
        contentStat1,
        item.stat_1
    );

    restaurerStatistique(
        contentStat2,
        item.stat_2
    );

    restaurerStatistique(
        contentStat3,
        item.stat_3
    );


    remplirListeSynergies(
        item.synergies || [],
        item.id
    );


    wysiwyg.innerHTML =
        item.html ||
        "";


    sourceEditor.value =
        item.html ||
        "";


    isSourceMode =
        false;


    wysiwyg.style.display =
        "block";

    sourceEditor.style.display =
        "none";


    const sourceModeButton =
        document.getElementById(
            "sourceModeButton"
        );


    if (sourceModeButton) {

        sourceModeButton.textContent =
            "CODE HTML";

    }

}


/* =========================================================
   PARENT SOUS-MENUS
========================================================= */

function remplirParentSousMenus(
    selectedId
) {

    contentParent.innerHTML =
        "";


    sousMenus.forEach(
        submenu => {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                submenu.id;

            option.textContent =
                submenu.titre ||
                "Sous-menu sans titre";


            if (
                String(
                    submenu.id
                ) ===
                String(
                    selectedId
                )
            ) {

                option.selected =
                    true;

            }


            contentParent.appendChild(
                option
            );

        }
    );

}


/* =========================================================
   STATISTIQUES
========================================================= */

function remplirStatistiques(
    select
) {

    if (!select) {

        return;

    }


    select.innerHTML =
        `
            <option value="">
                Non configurée
            </option>
        `;


    stats
        .slice()
        .sort(
            (
                a,
                b
            ) =>
                String(
                    a.titre ||
                    a.nom ||
                    a.code ||
                    ""
                ).localeCompare(
                    String(
                        b.titre ||
                        b.nom ||
                        b.code ||
                        ""
                    ),
                    "fr"
                )
        )
        .forEach(
            stat => {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    stat.code ||
                    stat.id;


                option.textContent =
                    stat.titre ||
                    stat.nom ||
                    stat.code ||
                    "Statistique";


                select.appendChild(
                    option
                );

            }
        );

}


function restaurerStatistique(
    select,
    value
) {

    if (!select) {

        return;

    }


    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {

        select.value =
            "";

        return;

    }


    const stringValue =
        String(value);


    const option =
        Array.from(
            select.options
        )
        .find(
            item =>
                String(
                    item.value
                ) ===
                stringValue
        );


    if (option) {

        select.value =
            option.value;

    }
    else {

        const fallback =
            document.createElement(
                "option"
            );

        fallback.value =
            stringValue;

        fallback.textContent =
            stringValue;

        select.appendChild(
            fallback
        );

        select.value =
            stringValue;

    }

}


/* =========================================================
   SAUVEGARDE CONTENU
========================================================= */

async function sauvegarderContenu() {

    if (
        editorType !==
        "content" ||
        !editorId
    ) {

        return;

    }


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
        contentPhoto
            ? contentPhoto.value.trim()
            : null;


    const accroche =
        contentAccroche
            ? contentAccroche.value.trim()
            : null;


    const priorite =
        contentPriority
            ? contentPriority.value.trim()
            : null;


    const stat1 =
        contentStat1
            ? contentStat1.value || null
            : null;


    const stat2 =
        contentStat2
            ? contentStat2.value || null
            : null;


    const stat3 =
        contentStat3
            ? contentStat3.value || null
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
        ].filter(
            Boolean
        );


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
        String(
            nouveauSousMenuId
        ) !==
        String(
            ancienSousMenuId
        )
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
                    photo ||
                    null,

                accroche:
                    accroche ||
                    null,

                priorite:
                    priorite ||
                    null,

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

        console.error(
            error
        );

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
   FERMER EDITEURS
========================================================= */

function fermerEditeurs() {

    welcome.style.display =
        "block";

    structureEditor.style.display =
        "none";

    contentEditor.style.display =
        "none";


    selectedType =
        null;

    selectedId =
        null;

    editorType =
        null;

    editorId =
        null;


    isSourceMode =
        false;


    synergySelectedIds =
        [];

    synergySearchTerm =
        "";

}


/* =========================================================
   SUPPRESSION
========================================================= */

async function supprimerElement(
    type,
    id
) {

    let messageConfirmation =
        "Supprimer cet élément ?";


    if (
        type ===
        "menu"
    ) {

        const enfants =
            sousMenus.filter(
                item =>
                    String(
                        item.menu_id
                    ) ===
                    String(id)
            );


        const hasContents =
            enfants.some(
                submenu =>
                    contenus.some(
                        contenu =>
                            String(
                                contenu.sous_menu_id
                            ) ===
                            String(
                                submenu.id
                            )
                    )
            );


        if (
            enfants.length ||
            hasContents
        ) {

            messageConfirmation =
                "Ce menu contient des sous-menus ou contenus. Voulez-vous vraiment le supprimer ?";

        }

    }


    if (
        !window.confirm(
            messageConfirmation
        )
    ) {

        return;

    }


    try {

        if (
            type ===
            "menu"
        ) {

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

                throw error;

            }

        }


        if (
            type ===
            "submenu"
        ) {

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

                throw error;

            }

        }


        if (
            type ===
            "content"
        ) {

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

                throw error;

            }


            await nettoyerSynergiesApresSuppression(
                id
            );

        }


        fermerEditeurs();

        await chargerDonnees();

        showMessage(
            "Élément supprimé."
        );

    }
    catch (error) {

        console.error(
            error
        );

        showMessage(
            "Impossible de supprimer l'élément.",
            "error"
        );

    }

}


/* =========================================================
   NETTOYAGE DES SYNERGIES
========================================================= */

async function nettoyerSynergiesApresSuppression(
    deletedId
) {

    const deletedString =
        String(
            deletedId
        );


    const affected =
        contenus.filter(
            contenu =>
                Array.isArray(
                    contenu.synergies
                ) &&
                contenu.synergies.some(
                    id =>
                        String(id) ===
                        deletedString
                )
        );


    for (
        const contenu
        of affected
    ) {

        const synergies =
            contenu.synergies.filter(
                id =>
                    String(id) !==
                    deletedString
            );


        const {
            error
        } =
            await supabase
                .from("contenus")
                .update({

                    synergies

                })
                .eq(
                    "id",
                    contenu.id
                );


        if (error) {

            console.error(
                error
            );

        }

    }

}


/* =========================================================
   VALIDATION
========================================================= */

async function basculerValidation(
    type,
    id,
    valide
) {

    let table;


    if (
        type ===
        "menu"
    ) {

        table =
            "menus";

    }
    else if (
        type ===
        "submenu"
    ) {

        table =
            "sous_menus";

    }
    else {

        table =
            "contenus";

    }


    const {
        error
    } =
        await supabase
            .from(table)
            .update({

                valide

            })
            .eq(
                "id",
                id
            );


    if (error) {

        console.error(
            error
        );

        showMessage(
            "Impossible de modifier le statut.",
            "error"
        );

        return;

    }


    await chargerDonnees();


    showMessage(
        valide
            ? "Élément validé."
            : "Élément repassé en brouillon."
    );

}


/* =========================================================
   DEPLACEMENT
========================================================= */

async function deplacerElement(
    type,
    id,
    direction
) {

    let collection;

    let item;

    let siblings;


    if (
        type ===
        "menu"
    ) {

        collection =
            menus;

        item =
            menus.find(
                element =>
                    element.id ===
                    id
            );

        siblings =
            menus
                .slice()
                .sort(
                    (
                        a,
                        b
                    ) =>
                        (
                            Number(a.position) ||
                            0
                        ) -
                        (
                            Number(b.position) ||
                            0
                        )
                );

    }
    else if (
        type ===
        "submenu"
    ) {

        collection =
            sousMenus;

        item =
            sousMenus.find(
                element =>
                    element.id ===
                    id
            );


        if (!item) {

            return;

        }


        siblings =
            sousMenus
                .filter(
                    element =>
                        String(
                            element.menu_id
                        ) ===
                        String(
                            item.menu_id
                        )
                )
                .slice()
                .sort(
                    (
                        a,
                        b
                    ) =>
                        (
                            Number(a.position) ||
                            0
                        ) -
                        (
                            Number(b.position) ||
                            0
                        )
                );

    }
    else {

        collection =
            contenus;

        item =
            contenus.find(
                element =>
                    element.id ===
                    id
            );


        if (!item) {

            return;

        }


        siblings =
            contenus
                .filter(
                    element =>
                        String(
                            element.sous_menu_id
                        ) ===
                        String(
                            item.sous_menu_id
                        )
                )
                .slice()
                .sort(
                    (
                        a,
                        b
                    ) =>
                        (
                            Number(a.position) ||
                            0
                        ) -
                        (
                            Number(b.position) ||
                            0
                        )
                );

    }


    if (!item) {

        return;

    }


    const index =
        siblings.findIndex(
            element =>
                element.id ===
                id
        );


    if (
        index < 0
    ) {

        return;

    }


    const targetIndex =
        index +
        direction;


    if (
        targetIndex < 0 ||
        targetIndex >=
        siblings.length
    ) {

        return;

    }


    const other =
        siblings[
            targetIndex
        ];


    const table =
        type === "menu"
            ? "menus"
            : type === "submenu"
                ? "sous_menus"
                : "contenus";


    const oldPosition =
        Number(
            item.position
        ) || 0;


    const newPosition =
        Number(
            other.position
        ) || 0;


    const {
        error:
            error1
    } =
        await supabase
            .from(table)
            .update({

                position:
                    newPosition

            })
            .eq(
                "id",
                item.id
            );


    if (error1) {

        console.error(
            error1
        );

        showMessage(
            "Impossible de déplacer l'élément.",
            "error"
        );

        return;

    }


    const {
        error:
            error2
    } =
        await supabase
            .from(table)
            .update({

                position:
                    oldPosition

            })
            .eq(
                "id",
                other.id
            );


    if (error2) {

        console.error(
            error2
        );

        showMessage(
            "Impossible de finaliser le déplacement.",
            "error"
        );

        return;

    }


    await chargerDonnees();

}


/* =========================================================
   OUTILS WYSIWYG
========================================================= */

function executerCommande(
    command,
    value = null
) {

    wysiwyg.focus();


    try {

        document.execCommand(
            command,
            false,
            value
        );

    }
    catch (error) {

        console.error(
            error
        );

    }

}


/* =========================================================
   TOOLBAR
========================================================= */

document
    .querySelectorAll(
        "[data-command]"
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


                    executerCommande(
                        command,
                        value
                    );

                }
            );

        }
    );


document
    .querySelectorAll(
        "[data-format]"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    executerCommande(
                        "formatBlock",
                        button.dataset.format
                    );

                }
            );

        }
    );


/* =========================================================
   LIEN
========================================================= */

const linkButton =
    document.getElementById(
        "linkButton"
    );


if (linkButton) {

    linkButton.addEventListener(
        "click",
        () => {

            const url =
                window.prompt(
                    "URL du lien :",
                    "https://"
                );


            if (!url) {

                return;

            }


            executerCommande(
                "createLink",
                url
            );

        }
    );

}


/* =========================================================
   IMAGE
========================================================= */

const imageButton =
    document.getElementById(
        "imageButton"
    );


if (imageButton) {

    imageButton.addEventListener(
        "click",
        () => {

            const url =
                window.prompt(
                    "URL de l'image :",
                    "https://"
                );


            if (!url) {

                return;

            }


            executerCommande(
                "insertImage",
                url
            );

        }
    );

}


/* =========================================================
   VIDEO
========================================================= */

const videoButton =
    document.getElementById(
        "videoButton"
    );


if (videoButton) {

    videoButton.addEventListener(
        "click",
        () => {

            const url =
                window.prompt(
                    "URL de la vidéo :",
                    "https://"
                );


            if (!url) {

                return;

            }


            const html =
                `
                    <p>
                        <video
                            controls
                            src="${escapeHtml(url)}"
                        ></video>
                    </p>
                `;


            executerCommande(
                "insertHTML",
                html
            );

        }
    );

}


/* =========================================================
   MODE SOURCE
========================================================= */

const sourceModeButton =
    document.getElementById(
        "sourceModeButton"
    );


if (sourceModeButton) {

    sourceModeButton.addEventListener(
        "click",
        () => {

            if (!isSourceMode) {

                sourceEditor.value =
                    wysiwyg.innerHTML;

                wysiwyg.style.display =
                    "none";

                sourceEditor.style.display =
                    "block";

                sourceModeButton.textContent =
                    "ÉDITEUR VISUEL";

                isSourceMode =
                    true;

            }
            else {

                wysiwyg.innerHTML =
                    sourceEditor.value;

                wysiwyg.style.display =
                    "block";

                sourceEditor.style.display =
                    "none";

                sourceModeButton.textContent =
                    "CODE HTML";

                isSourceMode =
                    false;

            }

        }
    );

}


/* =========================================================
   EVENEMENTS STRUCTURE
========================================================= */

const addMenuButton =
    document.getElementById(
        "addMenuButton"
    );


if (addMenuButton) {

    addMenuButton.addEventListener(
        "click",
        () => {

            ouvrirModal(
                "menu",
                null
            );

        }
    );

}


const structureSaveButton =
    document.getElementById(
        "structureSaveButton"
    );


if (structureSaveButton) {

    structureSaveButton.addEventListener(
        "click",
        () => {

            sauvegarderStructure();

        }
    );

}


const structureCancelButton =
    document.getElementById(
        "structureCancelButton"
    );


if (structureCancelButton) {

    structureCancelButton.addEventListener(
        "click",
        () => {

            fermerEditeurs();

        }
    );

}


/* =========================================================
   EVENEMENTS CONTENU
========================================================= */

const contentSaveButton =
    document.getElementById(
        "contentSaveButton"
    );


if (contentSaveButton) {

    contentSaveButton.addEventListener(
        "click",
        () => {

            sauvegarderContenu();

        }
    );

}


const contentCancelButton =
    document.getElementById(
        "contentCancelButton"
    );


if (contentCancelButton) {

    contentCancelButton.addEventListener(
        "click",
        () => {

            fermerEditeurs();

        }
    );

}


/* =========================================================
   EVENEMENTS MODAL
========================================================= */

const modalCloseButton =
    document.getElementById(
        "modalCloseButton"
    );


if (modalCloseButton) {

    modalCloseButton.addEventListener(
        "click",
        () => {

            fermerModal();

        }
    );

}


const modalCancelButton =
    document.getElementById(
        "modalCancelButton"
    );


if (modalCancelButton) {

    modalCancelButton.addEventListener(
        "click",
        () => {

            fermerModal();

        }
    );

}


if (modalSaveButton) {

    modalSaveButton.addEventListener(
        "click",
        () => {

            creerElement();

        }
    );

}


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


        if (
            event.key ===
            "Escape"
        ) {

            event.preventDefault();

            fermerModal();

        }

    }
);


/* =========================================================
   RACCOURCI ESC
========================================================= */

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key !==
            "Escape"
        ) {

            return;

        }


        if (
            structureModal.classList.contains(
                "visible"
            )
        ) {

            fermerModal();

            return;

        }


        if (
            structureEditor.style.display !==
                "none" ||
            contentEditor.style.display !==
                "none"
        ) {

            fermerEditeurs();

        }

    }
);


/* =========================================================
   INITIALISATION
========================================================= */

async function initialiser() {

    const admin =
        await verifierAdmin();


    if (!admin) {

        return;

    }


    await chargerDonnees();

}


initialiser();

