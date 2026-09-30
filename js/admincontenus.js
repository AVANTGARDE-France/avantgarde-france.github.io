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
   - statistiques liées par UUID
   - synergies liées par UUID
   - verso HTML
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

let messageTimer = null;


/* =========================================================
   ETAT SYNERGIES
========================================================= */

let selectedSynergyIds = [];
let currentSynergyContentId = null;


/* =========================================================
   ELEMENTS DOM
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

const structureSaveButton =
    document.getElementById("structureSaveButton");

const structureCancelButton =
    document.getElementById("structureCancelButton");

const contentEditorTitle =
    document.getElementById("contentEditorTitle");

const contentTitle =
    document.getElementById("contentTitle");

const contentParent =
    document.getElementById("contentParent");

const contentCancelButton =
    document.getElementById("contentCancelButton");

const contentSaveButton =
    document.getElementById("contentSaveButton");

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

const modalCloseButton =
    document.getElementById("modalCloseButton");

const modalCancelButton =
    document.getElementById("modalCancelButton");

const addMenuButton =
    document.getElementById("addMenuButton");


/* =========================================================
   RECTO
========================================================= */

const cardPhoto =
    document.getElementById("contentPhoto") ||
    document.getElementById("cardPhoto");

const cardAccroche =
    document.getElementById("contentAccroche") ||
    document.getElementById("cardAccroche");

const cardPriorite =
    document.getElementById("contentPriority") ||
    document.getElementById("cardPriority");

const cardStat1 =
    document.getElementById("contentStat1") ||
    document.getElementById("cardStat1");

const cardStat2 =
    document.getElementById("contentStat2") ||
    document.getElementById("cardStat2");

const cardStat3 =
    document.getElementById("contentStat3") ||
    document.getElementById("cardStat3");

const cardSynergies =
    document.getElementById("contentSynergies") ||
    document.getElementById("cardSynergies");


/* =========================================================
   PRIORITES
========================================================= */

const PRIORITES = [
    {
        value: "absolue",
        label: "Absolue"
    },
    {
        value: "prioritaire",
        label: "Prioritaire"
    },
    {
        value: "secondaire",
        label: "Secondaire"
    }
];


function initialiserListePriorite() {

    if (!cardPriorite) {
        return;
    }


    const valeurActuelle =
        String(
            cardPriorite.value || ""
        ).toLowerCase();


    cardPriorite.innerHTML =
        "";


    const optionVide =
        document.createElement("option");

    optionVide.value =
        "";

    optionVide.textContent =
        "Aucune priorité";

    cardPriorite.appendChild(
        optionVide
    );


    PRIORITES.forEach(
        priorite => {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                priorite.value;

            option.textContent =
                priorite.label;

            cardPriorite.appendChild(
                option
            );

        }
    );


    if (
        PRIORITES.some(
            priorite =>
                priorite.value ===
                valeurActuelle
        )
    ) {

        cardPriorite.value =
            valeurActuelle;

    } else {

        cardPriorite.value =
            "";

    }

}


/* =========================================================
   OUTILS
========================================================= */

function escapeHtml(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


function toId(value) {

    return String(value ?? "");

}


function getNextPosition(items) {

    if (!Array.isArray(items) || !items.length) {
        return 0;
    }

    return Math.max(
        ...items.map(
            item =>
                Number(item.position) || 0
        )
    ) + 1;

}


/* =========================================================
   MESSAGES
========================================================= */

function showMessage(
    text,
    type = "success"
) {

    if (!message) {
        return;
    }

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
   APERCU PHOTO
========================================================= */

let contentPhotoPreview = null;


function initialiserApercuImageContenu() {

    if (!cardPhoto) {
        return;
    }


    if (
        !document.getElementById(
            "avantgarde-content-photo-preview-styles"
        )
    ) {

        const style =
            document.createElement("style");

        style.id =
            "avantgarde-content-photo-preview-styles";

        style.textContent = `

            #contentPhotoPreview {
                width:260px;
                height:180px;
                margin-top:10px;
                padding:8px;
                box-sizing:border-box;
                display:flex;
                align-items:center;
                justify-content:center;
                border:1px solid var(--border);
                border-radius:8px;
                background:rgba(7,21,45,.45);
                overflow:hidden;
            }

            #contentPhotoPreview img {
                display:block;
                width:100%;
                height:100%;
                object-fit:contain;
                object-position:center;
                border-radius:4px;
            }

            #contentPhotoPreview.empty {
                color:rgba(245,243,237,.38);
                font-size:11px;
                text-align:center;
                line-height:1.5;
            }

            #contentPhotoPreview.error {
                color:rgba(239,65,53,.82);
                font-size:11px;
                text-align:center;
                line-height:1.5;
            }

            @media (max-width:600px) {

                #contentPhotoPreview {
                    width:100%;
                    max-width:260px;
                    height:180px;
                }

            }

        `;

        document.head.appendChild(style);

    }


    contentPhotoPreview =
        document.getElementById(
            "contentPhotoPreview"
        );


    if (!contentPhotoPreview) {

        contentPhotoPreview =
            document.createElement("div");

        contentPhotoPreview.id =
            "contentPhotoPreview";

        contentPhotoPreview.className =
            "empty";

        contentPhotoPreview.textContent =
            "Aucune image";

        cardPhoto.insertAdjacentElement(
            "afterend",
            contentPhotoPreview
        );

    }


    function actualiserApercu() {

        const url =
            String(
                cardPhoto.value || ""
            ).trim();


        contentPhotoPreview.innerHTML =
            "";

        contentPhotoPreview.className =
            "empty";


        if (!url) {

            contentPhotoPreview.textContent =
                "Aucune image";

            return;

        }


        const image =
            document.createElement("img");

        image.alt =
            "Aperçu de l'image";


        image.onload =
            () => {

                contentPhotoPreview.className =
                    "";

            };


        image.onerror =
            () => {

                contentPhotoPreview.className =
                    "error";

                contentPhotoPreview.textContent =
                    "Impossible de charger cette image.";

            };


        image.src =
            url;


        contentPhotoPreview.appendChild(
            image
        );

    }


    cardPhoto.addEventListener(
        "input",
        actualiserApercu
    );

    cardPhoto.addEventListener(
        "change",
        actualiserApercu
    );


    actualiserApercu();

}


/* =========================================================
   STYLES ARBRE
========================================================= */

function injectTreeStyles() {

    if (
        document.getElementById(
            "avantgarde-content-tree-styles"
        )
    ) {
        return;
    }


    const style =
        document.createElement("style");

    style.id =
        "avantgarde-content-tree-styles";


    style.textContent = `

        #tree {
            width:100%;
            box-sizing:border-box;
        }

        #tree .tree-menu {
            margin:0 0 8px 0;
            padding:0;
        }

        #tree .tree-menu:last-child {
            margin-bottom:0;
        }

        #tree .tree-menu-header {
            display:flex;
            align-items:center;
            gap:8px;
            min-width:0;
            padding:7px 6px 7px 8px;
            border-radius:6px;
            background:rgba(214,173,85,.09);
            border:1px solid rgba(214,173,85,.20);
        }

        #tree .tree-menu-header:hover {
            background:rgba(214,173,85,.13);
        }

        #tree .submenu-list {
            position:relative;
            margin:4px 0 0 15px;
            padding-left:15px;
        }

        #tree .submenu-list::before {
            content:"";
            position:absolute;
            left:0;
            top:0;
            bottom:8px;
            width:1px;
            background:rgba(214,173,85,.18);
        }

        #tree .tree-submenu {
            position:relative;
            margin:0 0 3px 0;
        }

        #tree .tree-submenu::before {
            content:"";
            position:absolute;
            left:-15px;
            top:18px;
            width:12px;
            height:1px;
            background:rgba(214,173,85,.18);
        }

        #tree .tree-submenu-header {
            display:flex;
            align-items:center;
            gap:6px;
            min-width:0;
            padding:4px 4px 4px 5px;
            border-radius:5px;
        }

        #tree .tree-submenu-header:hover {
            background:rgba(255,255,255,.035);
        }

        #tree .content-list {
            position:relative;
            margin:2px 0 3px 16px;
            padding-left:15px;
        }

        #tree .content-list::before {
            content:"";
            position:absolute;
            left:0;
            top:0;
            bottom:7px;
            width:1px;
            background:rgba(255,255,255,.09);
        }

        #tree .tree-content {
            position:relative;
            display:flex;
            align-items:center;
            gap:5px;
            min-width:0;
            margin:1px 0;
            padding:3px 3px 3px 5px;
            border-radius:4px;
        }

        #tree .tree-content::before {
            content:"";
            position:absolute;
            left:-15px;
            top:15px;
            width:12px;
            height:1px;
            background:rgba(255,255,255,.09);
        }

        #tree .tree-content:hover {
            background:rgba(255,255,255,.035);
        }

        #tree .tree-item-main {
            display:flex;
            align-items:center;
            gap:8px;
            flex:1 1 auto;
            min-width:0;
            margin:0;
            padding:0;
            border:0;
            background:none;
            color:inherit;
            text-align:left;
            cursor:pointer;
        }

        #tree .tree-item-main:hover {
            color:var(--gold-light);
        }

        #tree .tree-title {
            min-width:0;
            overflow:hidden;
            text-overflow:ellipsis;
            white-space:nowrap;
            font-size:13px;
            line-height:1.35;
            font-weight:500;
        }

        #tree .tree-menu .tree-title {
            font-size:13px;
            font-weight:600;
            color:var(--white);
        }

        #tree .tree-submenu .tree-title {
            font-size:12.5px;
            color:rgba(245,243,237,.92);
        }

        #tree .tree-content-button {
            flex:1 1 auto;
            min-width:0;
            overflow:hidden;
            text-overflow:ellipsis;
            white-space:nowrap;
            margin:0;
            padding:2px 0;
            border:0;
            background:none;
            color:rgba(245,243,237,.72);
            font:inherit;
            font-size:12px;
            text-align:left;
            cursor:pointer;
        }

        #tree .tree-content-button:hover {
            color:var(--gold-light);
        }

        #tree .tree-subtitle {
            flex:0 0 auto;
            font-size:8px;
            line-height:1;
            letter-spacing:.10em;
            color:rgba(214,173,85,.70);
            white-space:nowrap;
        }

        #tree .tree-actions {
            display:flex;
            align-items:center;
            justify-content:flex-end;
            flex:0 0 auto;
            gap:2px;
            margin-left:4px;
            opacity:.72;
        }

        #tree .tree-menu-header:hover .tree-actions,
        #tree .tree-submenu-header:hover .tree-actions,
        #tree .tree-content:hover .tree-actions {
            opacity:1;
        }

        #tree .icon-button {
            width:22px;
            height:22px;
            min-width:22px;
            padding:0;
            border:1px solid transparent;
            border-radius:4px;
            background:transparent;
            color:rgba(245,243,237,.58);
            font-size:12px;
            line-height:20px;
            cursor:pointer;
        }

        #tree .icon-button:hover {
            border-color:rgba(214,173,85,.30);
            background:rgba(214,173,85,.08);
            color:var(--gold-light);
        }

        #tree .icon-button.danger:hover {
            border-color:rgba(239,65,53,.35);
            background:rgba(239,65,53,.08);
            color:#ef4135;
        }

        #tree .status-button {
            min-width:58px;
            height:21px;
            padding:0 6px;
            border-radius:4px;
            font-size:7px;
            font-weight:600;
            letter-spacing:.06em;
            cursor:pointer;
        }

        #tree .status-button.status-valid {
            border:1px solid rgba(80,190,120,.45);
            background:rgba(80,190,120,.12);
            color:#65d28a;
        }

        #tree .status-button.status-draft {
            border:1px solid rgba(214,173,85,.30);
            background:rgba(214,173,85,.08);
            color:rgba(214,173,85,.82);
        }

        #tree .empty-tree {
            padding:25px 12px;
            color:rgba(245,243,237,.48);
            font-size:12px;
            line-height:1.6;
            text-align:center;
        }

        @media (max-width:600px) {

            #tree .tree-subtitle {
                display:none;
            }

            #tree .tree-actions {
                opacity:1;
            }

            #tree .status-button {
                min-width:0;
                width:22px;
                padding:0;
                overflow:hidden;
                font-size:0;
            }

            #tree .status-button::after {
                content:"";
                display:block;
                width:6px;
                height:6px;
                margin:auto;
                border-radius:50%;
                background:currentColor;
            }

        }

    `;


    document.head.appendChild(style);

}


/* =========================================================
   ADMIN
========================================================= */

async function verifierAdmin() {

    const {
        data,
        error
    } =
        await supabase.auth.getUser();


    if (
        error ||
        !data ||
        !data.user
    ) {

        throw new Error(
            "Vous devez être connecté."
        );

    }


    const user =
        data.user;


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
            .maybeSingle();


    if (profileError) {

        throw new Error(
            "Impossible de charger votre profil : " +
            profileError.message
        );

    }


    if (!profile) {

        throw new Error(
            "Aucun profil administrateur trouvé."
        );

    }


    if (
        String(profile.grade || "").toLowerCase() !==
        "admin"
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


    if (addMenuButton) {
        addMenuButton.disabled = false;
    }


    return true;

}


/* =========================================================
   CHARGEMENT MENUS / SOUS-MENUS / CONTENUS
========================================================= */

async function chargerDonnees() {

    const [
        menusResult,
        sousMenusResult,
        contenusResult
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
                        ascending:true
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
                        ascending:true
                    }
                ),

            supabase
                .from("contenus")
                .select(`
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
                `)
                .order(
                    "position",
                    {
                        ascending:true
                    }
                )

        ]);


    if (menusResult.error) {
        throw new Error(
            "Menus : " +
            menusResult.error.message
        );
    }


    if (sousMenusResult.error) {
        throw new Error(
            "Sous-menus : " +
            sousMenusResult.error.message
        );
    }


    if (contenusResult.error) {
        throw new Error(
            "Contenus : " +
            contenusResult.error.message
        );
    }


    menus =
        Array.isArray(menusResult.data)
            ? menusResult.data
            : [];


    sousMenus =
        Array.isArray(sousMenusResult.data)
            ? sousMenusResult.data
            : [];


    contenus =
        Array.isArray(contenusResult.data)
            ? contenusResult.data
            : [];


    try {

        const {
            data: statsData,
            error: statsError
        } =
            await supabase
                .from("stats")
                .select(
                    "id, nom"
                )
                .order(
                    "nom",
                    {
                        ascending:true
                    }
                );


        if (statsError) {

            console.warn(
                "Statistiques indisponibles :",
                statsError.message
            );

            stats = [];

        } else {

            stats =
                Array.isArray(statsData)
                    ? statsData
                    : [];

        }

    }
    catch (error) {

        console.warn(
            "Statistiques indisponibles :",
            error
        );

        stats = [];

    }


    remplirListesStats();
    initialiserListePriorite();

    renderTree();

}


/* =========================================================
   STATISTIQUES
========================================================= */

function remplirListesStats() {

    [
        cardStat1,
        cardStat2,
        cardStat3
    ]
    .filter(Boolean)
    .forEach(
        select => {

            const valeurActuelle =
                select.value || "";


            select.innerHTML =
                "";


            const empty =
                document.createElement("option");

            empty.value =
                "";

            empty.textContent =
                "Aucune statistique";

            select.appendChild(
                empty
            );


            stats.forEach(
                stat => {

                    const option =
                        document.createElement(
                            "option"
                        );

                    option.value =
                        stat.id;

                    option.textContent =
                        stat.nom ||
                        "Statistique sans nom";

                    select.appendChild(
                        option
                    );

                }
            );


            if (valeurActuelle) {

                select.value =
                    valeurActuelle;

            }

        }
    );

}


/* =========================================================
   SYNERGIES
========================================================= */

function normaliserSynergies(value) {

    if (!Array.isArray(value)) {
        return [];
    }

    return value
        .filter(Boolean)
        .map(
            id =>
                String(id)
        );

}


/*
 * Recherche insensible aux accents.
 *
 * Exemple :
 * "économie" devient "economie"
 * "État" devient "etat"
 */
function normaliserRechercheSynergie(value) {

    return String(value || "")
        .normalize("NFD")
        .replace(
            /[\u0300-\u036f]/g,
            ""
        )
        .toLowerCase()
        .trim();

}


function obtenirElementsSynergies() {

    return {

        search:
            document.getElementById(
                "synergySearch"
            ),

        available:
            document.getElementById(
                "synergyAvailable"
            ),

        availableCount:
            document.getElementById(
                "synergyAvailableCount"
            ),

        selected:
            document.getElementById(
                "synergySelected"
            ),

        selectedCount:
            document.getElementById(
                "synergySelectedCount"
            ),

        clear:
            document.getElementById(
                "synergyClearButton"
            )

    };

}


function initialiserSynergies(
    valeurs = [],
    currentId = null
) {

    currentSynergyContentId =
        currentId
            ? String(currentId)
            : null;


    selectedSynergyIds =
        normaliserSynergies(
            valeurs
        )
        .filter(
            id =>
                id !==
                currentSynergyContentId
        );


    rendreSynergies();

}


function rendreSynergies() {

    const elements =
        obtenirElementsSynergies();


    const available =
        elements.available;

    const selected =
        elements.selected;

    const availableCount =
        elements.availableCount;

    const selectedCount =
        elements.selectedCount;


    if (
        !available ||
        !selected
    ) {

        return;

    }


    const recherche =
        normaliserRechercheSynergie(
            elements.search
                ? elements.search.value
                : ""
        );


    const selectedSet =
        new Set(
            selectedSynergyIds
                .map(id => String(id))
        );


    const disponibles =
        contenus
            .filter(
                contenu => {

                    const id =
                        String(
                            contenu.id
                        );


                    if (
                        currentSynergyContentId &&
                        id ===
                        currentSynergyContentId
                    ) {

                        return false;

                    }


                    if (
                        selectedSet.has(id)
                    ) {

                        return false;

                    }


                    if (!recherche) {
                        return true;
                    }


                    const titre =
                        normaliserRechercheSynergie(
                            contenu.titre ||
                            "Mesure sans titre"
                        );


                    return titre.includes(
                        recherche
                    );

                }
            )
            .slice()
            .sort(
                (a, b) =>
                    String(a.titre || "")
                        .localeCompare(
                            String(b.titre || ""),
                            "fr"
                        )
            );


    const totalDisponible =
        disponibles.length;


    const limiteAffichage =
        50;


    const visibles =
        disponibles.slice(
            0,
            limiteAffichage
        );


    available.innerHTML =
        "";


    if (!visibles.length) {

        const empty =
            document.createElement("div");

        empty.className =
            "synergy-empty";

        empty.textContent =
            recherche
                ? "Aucune mesure ne correspond à la recherche."
                : "Aucune autre mesure disponible.";

        available.appendChild(
            empty
        );

    } else {

        visibles.forEach(
            contenu => {

                const row =
                    document.createElement(
                        "button"
                    );

                row.type =
                    "button";

                row.className =
                    "synergy-item synergy-available-item";


                const title =
                    document.createElement(
                        "span"
                    );

                title.className =
                    "synergy-item-title";

                title.textContent =
                    contenu.titre ||
                    "Mesure sans titre";


                const action =
                    document.createElement(
                        "span"
                    );

                action.className =
                    "synergy-item-action";

                action.textContent =
                    "AJOUTER";


                row.appendChild(
                    title
                );

                row.appendChild(
                    action
                );


                row.addEventListener(
                    "click",
                    event => {

                        event.preventDefault();

                        ajouterSynergie(
                            contenu.id
                        );

                    }
                );


                available.appendChild(
                    row
                );

            }
        );

    }


    if (availableCount) {

        if (
            totalDisponible >
            limiteAffichage
        ) {

            availableCount.textContent =
                totalDisponible +
                " résultats — " +
                limiteAffichage +
                " affichés";

        } else {

            availableCount.textContent =
                totalDisponible +
                (
                    totalDisponible > 1
                        ? " mesures"
                        : " mesure"
                );

        }

    }


    selected.innerHTML =
        "";


    const selectedObjects =
        selectedSynergyIds
            .map(
                id =>
                    contenus.find(
                        contenu =>
                            String(
                                contenu.id
                            ) ===
                            String(id)
                    )
            )
            .filter(Boolean);


    if (!selectedObjects.length) {

        const empty =
            document.createElement("div");

        empty.className =
            "synergy-empty";

        empty.textContent =
            "Aucune synergie sélectionnée.";

        selected.appendChild(
            empty
        );

    } else {

        selectedObjects.forEach(
            contenu => {

                const row =
                    document.createElement(
                        "button"
                    );

                row.type =
                    "button";

                row.className =
                    "synergy-item synergy-selected-item";


                const title =
                    document.createElement(
                        "span"
                    );

                title.className =
                    "synergy-item-title";

                title.textContent =
                    contenu.titre ||
                    "Mesure sans titre";


                const action =
                    document.createElement(
                        "span"
                    );

                action.className =
                    "synergy-item-action";

                action.textContent =
                    "RETIRER";


                row.appendChild(
                    title
                );

                row.appendChild(
                    action
                );


                row.addEventListener(
                    "click",
                    event => {

                        event.preventDefault();

                        retirerSynergie(
                            contenu.id
                        );

                    }
                );


                selected.appendChild(
                    row
                );

            }
        );

    }


    if (selectedCount) {

        const nombre =
            selectedSynergyIds.length;


        selectedCount.textContent =
            nombre +
            (
                nombre > 1
                    ? " sélectionnées"
                    : " sélectionnée"
            );

    }


    if (elements.clear) {

        elements.clear.disabled =
            selectedSynergyIds.length === 0;

    }

}


function ajouterSynergie(id) {

    const identifiant =
        String(id || "");


    if (!identifiant) {
        return;
    }


    if (
        currentSynergyContentId &&
        identifiant ===
        currentSynergyContentId
    ) {
        return;
    }


    if (
        selectedSynergyIds.some(
            selectedId =>
                String(selectedId) ===
                identifiant
        )
    ) {
        return;
    }


    selectedSynergyIds.push(
        identifiant
    );


    rendreSynergies();

}


function retirerSynergie(id) {

    const identifiant =
        String(id || "");


    selectedSynergyIds =
        selectedSynergyIds.filter(
            selectedId =>
                String(selectedId) !==
                identifiant
        );


    rendreSynergies();

}


function retirerToutesLesSynergies() {

    selectedSynergyIds =
        [];


    rendreSynergies();

}


function obtenirSynergies() {

    return selectedSynergyIds
        .map(
            id =>
                String(id)
        )
        .filter(Boolean);

}


function initialiserEvenementsSynergies() {

    const elements =
        obtenirElementsSynergies();


    if (elements.search) {

        elements.search.addEventListener(
            "input",
            () => {

                rendreSynergies();

            }
        );

    }


    if (elements.clear) {

        elements.clear.addEventListener(
            "click",
            event => {

                event.preventDefault();

                retirerToutesLesSynergies();

            }
        );

    }

}


/* =========================================================
   ARBRE
========================================================= */

function renderTree() {

    if (!tree) {
        return;
    }


    injectTreeStyles();


    tree.innerHTML =
        "";


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
                document.createElement("div");

            menuBox.className =
                "tree-menu";


            const menuHeader =
                document.createElement("div");

            menuHeader.className =
                "tree-menu-header";


            const menuButton =
                document.createElement("button");

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
                () =>
                    ouvrirStructure(
                        "menu",
                        menu.id
                    )
            );


            const actions =
                document.createElement("div");

            actions.className =
                "tree-actions";


            actions.appendChild(
                creerBouton(
                    "↑",
                    "Monter",
                    () =>
                        deplacerMenu(
                            menuIndex,
                            -1
                        )
                )
            );


            actions.appendChild(
                creerBouton(
                    "↓",
                    "Descendre",
                    () =>
                        deplacerMenu(
                            menuIndex,
                            1
                        )
                )
            );


            actions.appendChild(
                creerStatusButton(menu)
            );


            actions.appendChild(
                creerBouton(
                    "+",
                    "Ajouter un sous-menu",
                    () =>
                        ouvrirModalCreation(
                            "submenu",
                            menu.id
                        )
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

            actions.appendChild(
                deleteButton
            );


            menuHeader.appendChild(
                menuButton
            );

            menuHeader.appendChild(
                actions
            );


            menuBox.appendChild(
                menuHeader
            );


            const submenuList =
                document.createElement("div");

            submenuList.className =
                "submenu-list";


            const siblings =
                sousMenus
                    .filter(
                        item =>
                            toId(item.menu_id) ===
                            toId(menu.id)
                    )
                    .sort(
                        (a, b) =>
                            (Number(a.position) || 0) -
                            (Number(b.position) || 0)
                    );


            siblings.forEach(
                submenu => {

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
   SOUS-MENU
========================================================= */

function renderSousMenu(
    submenu,
    siblings
) {

    const box =
        document.createElement("div");

    box.className =
        "tree-submenu";


    const header =
        document.createElement("div");

    header.className =
        "tree-submenu-header";


    const button =
        document.createElement("button");

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
        () =>
            ouvrirStructure(
                "submenu",
                submenu.id
            )
    );


    const actions =
        document.createElement("div");

    actions.className =
        "tree-actions";


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
        creerStatusButton(submenu)
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
        document.createElement("div");

    contentList.className =
        "content-list";


    const contentSiblings =
        contenus
            .filter(
                content =>
                    toId(content.sous_menu_id) ===
                    toId(submenu.id)
            )
            .sort(
                (a, b) =>
                    (Number(a.position) || 0) -
                    (Number(b.position) || 0)
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
   CONTENU
========================================================= */

function renderContenu(
    item,
    siblings
) {

    const row =
        document.createElement("div");

    row.className =
        "tree-content";


    const button =
        document.createElement("button");

    button.type =
        "button";

    button.className =
        "tree-content-button";

    button.textContent =
        item.titre ||
        "Contenu sans titre";

    button.title =
        item.titre ||
        "Contenu sans titre";


    button.addEventListener(
        "click",
        () =>
            ouvrirContenu(
                item.id
            )
    );


    const actions =
        document.createElement("div");

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
        creerStatusButton(item)
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
        document.createElement("button");

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

            event.preventDefault();

            event.stopPropagation();

            action();

        }
    );


    return button;

}


function creerStatusButton(item) {

    const button =
        document.createElement("button");

    button.type =
        "button";

    button.className =
        "status-button";


    if (Boolean(item.valide)) {

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

            event.preventDefault();

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
   LISTE MENUS
========================================================= */

function remplirListeMenus(
    select,
    valeur
) {

    if (!select) {
        return;
    }


    select.innerHTML =
        "";


    menus.forEach(
        menu => {

            const option =
                document.createElement("option");

            option.value =
                menu.id;

            option.textContent =
                menu.titre;

            option.selected =
                toId(menu.id) ===
                toId(valeur);

            select.appendChild(
                option
            );

        }
    );

}


/* =========================================================
   LISTE SOUS-MENUS
========================================================= */

function remplirListeSousMenus(
    select,
    valeur
) {

    if (!select) {
        return;
    }


    select.innerHTML =
        "";


    menus.forEach(
        menu => {

            const groupe =
                document.createElement("optgroup");

            groupe.label =
                menu.titre;


            sousMenus
                .filter(
                    submenu =>
                        toId(submenu.menu_id) ===
                        toId(menu.id)
                )
                .sort(
                    (a, b) =>
                        (Number(a.position) || 0) -
                        (Number(b.position) || 0)
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
                            toId(submenu.id) ===
                            toId(valeur);

                        groupe.appendChild(
                            option
                        );

                    }
                );


            if (
                groupe.children.length
            ) {

                select.appendChild(
                    groupe
                );

            }

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
                toId(element.id) ===
                toId(id)
        );


    if (!item) {
        return;
    }


    selectedType =
        type;

    selectedId =
        id;


    if (welcome) {
        welcome.style.display =
            "none";
    }

    if (contentEditor) {
        contentEditor.style.display =
            "none";
    }

    if (structureEditor) {
        structureEditor.style.display =
            "block";
    }


    if (structureTitle) {

        structureTitle.textContent =
            type === "menu"
                ? "MODIFIER LE MENU"
                : "MODIFIER LE SOUS-MENU";

    }


    if (structureDescription) {

        structureDescription.textContent =
            type === "menu"
                ? "Modification du menu principal."
                : "Modification du sous-menu.";

    }


    if (structureName) {

        structureName.value =
            item.titre || "";

    }


    if (type === "submenu") {

        if (structureParentField) {

            structureParentField.style.display =
                "block";

        }

        remplirListeMenus(
            structureParent,
            item.menu_id
        );

    } else {

        if (structureParentField) {

            structureParentField.style.display =
                "none";

        }

        if (structureParent) {

            structureParent.innerHTML =
                "";

        }

    }

}


/* =========================================================
   ENREGISTRER STRUCTURE
========================================================= */

async function enregistrerStructure() {

    if (!structureName) {
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

            showMessage(
                "Impossible d'enregistrer le menu : " +
                error.message,
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
                    toId(item.id) ===
                    toId(selectedId)
            );


        if (!submenu) {

            showMessage(
                "Sous-menu introuvable.",
                "error"
            );

            return;

        }


        const nouveauMenuId =
            structureParent
                ? structureParent.value
                : "";


        if (!nouveauMenuId) {

            showMessage(
                "Le menu parent est obligatoire.",
                "error"
            );

            return;

        }


        let nouvellePosition =
            Number(submenu.position) || 0;


        if (
            toId(nouveauMenuId) !==
            toId(submenu.menu_id)
        ) {

            const destination =
                sousMenus.filter(
                    item =>
                        toId(item.menu_id) ===
                        toId(nouveauMenuId) &&
                        toId(item.id) !==
                        toId(selectedId)
                );


            nouvellePosition =
                getNextPosition(destination);

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

            showMessage(
                "Impossible d'enregistrer le sous-menu : " +
                error.message,
                "error"
            );

            return;

        }

    }


    await chargerDonnees();

    fermerEditeurs();

    showMessage(
        "Modification enregistrée."
    );

}


/* =========================================================
   MODAL CREATION
========================================================= */

function obtenirElementsModal() {

    return {

        modal:
            document.getElementById(
                "structureModal"
            ),

        title:
            document.getElementById(
                "modalTitle"
            ),

        name:
            document.getElementById(
                "modalName"
            ),

        save:
            document.getElementById(
                "modalSaveButton"
            )

    };

}


function ouvrirModalCreation(
    type,
    parentId
) {

    const elements =
        obtenirElementsModal();


    const modal =
        elements.modal;

    const title =
        elements.title;

    const name =
        elements.name;

    const save =
        elements.save;


    if (!modal) {

        showMessage(
            "Impossible d'ouvrir la création : fenêtre introuvable.",
            "error"
        );

        return;

    }


    if (!title) {

        showMessage(
            "Impossible d'ouvrir la création : titre de la fenêtre introuvable.",
            "error"
        );

        return;

    }


    if (!name) {

        showMessage(
            "Impossible d'ouvrir la création : champ de nom introuvable.",
            "error"
        );

        return;

    }


    modalType =
        type;

    modalParentId =
        parentId;


    title.textContent =
        type === "submenu"
            ? "NOUVEAU SOUS-MENU"
            : "NOUVEAU CONTENU";


    name.value =
        "";


    if (save) {

        save.textContent =
            "CRÉER";

        save.disabled =
            false;

    }


    modal.classList.add(
        "visible"
    );


    modal.style.display =
        "flex";


    setTimeout(
        () => {

            if (
                document.body.contains(name)
            ) {

                name.focus();

            }

        },
        50
    );

}


function ouvrirCreationMenu() {

    const elements =
        obtenirElementsModal();


    const modal =
        elements.modal;

    const title =
        elements.title;

    const name =
        elements.name;

    const save =
        elements.save;


    if (!modal) {

        showMessage(
            "Impossible d'ouvrir la création : fenêtre introuvable.",
            "error"
        );

        return;

    }


    if (!title) {

        showMessage(
            "Impossible d'ouvrir la création : titre de la fenêtre introuvable.",
            "error"
        );

        return;

    }


    if (!name) {

        showMessage(
            "Impossible d'ouvrir la création : champ de nom introuvable.",
            "error"
        );

        return;

    }


    modalType =
        "menu";

    modalParentId =
        null;


    title.textContent =
        "NOUVEAU MENU";


    name.value =
        "";


    if (save) {

        save.textContent =
            "CRÉER";

        save.disabled =
            false;

    }


    modal.classList.add(
        "visible"
    );


    modal.style.display =
        "flex";


    setTimeout(
        () => {

            if (
                document.body.contains(name)
            ) {

                name.focus();

            }

        },
        50
    );

}


function fermerModal() {

    const modal =
        document.getElementById(
            "structureModal"
        );


    if (modal) {

        modal.classList.remove(
            "visible"
        );

        modal.style.display =
            "";

    }


    modalType =
        null;

    modalParentId =
        null;

}


/* =========================================================
   CREATION
========================================================= */

async function creerElement() {

    const name =
        document.getElementById(
            "modalName"
        );

    const save =
        document.getElementById(
            "modalSaveButton"
        );


    if (
        !name ||
        !save
    ) {
        return;
    }


    const titre =
        name.value.trim();


    if (!titre) {

        showMessage(
            "Le titre est obligatoire.",
            "error"
        );

        return;

    }


    save.disabled =
        true;


    try {

        if (
            modalType ===
            "menu"
        ) {

            const {
                error
            } =
                await supabase
                    .from("menus")
                    .insert({

                        titre,

                        position:
                            getNextPosition(
                                menus
                            ),

                        valide:
                            false

                    });


            if (error) {
                throw error;
            }

        }


        else if (
            modalType ===
            "submenu"
        ) {

            if (!modalParentId) {
                throw new Error(
                    "Menu parent manquant."
                );
            }


            const siblings =
                sousMenus.filter(
                    item =>
                        toId(item.menu_id) ===
                        toId(modalParentId)
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

                        position:
                            getNextPosition(
                                siblings
                            ),

                        valide:
                            false

                    });


            if (error) {
                throw error;
            }

        }


        else if (
            modalType ===
            "content"
        ) {

            if (!modalParentId) {
                throw new Error(
                    "Sous-menu parent manquant."
                );
            }


            const siblings =
                contenus.filter(
                    item =>
                        toId(item.sous_menu_id) ===
                        toId(modalParentId)
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

                        position:
                            getNextPosition(
                                siblings
                            ),

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

        showMessage(
            error?.message
                ? "Impossible de créer l'élément : " +
                  error.message
                : "Impossible de créer l'élément.",
            "error"
        );

    }
    finally {

        save.disabled =
            false;

    }

}


/* =========================================================
   OUVRIR CONTENU
========================================================= */

function ouvrirContenu(id) {

    const item =
        contenus.find(
            content =>
                toId(content.id) ===
                toId(id)
        );


    if (!item) {
        return;
    }


    editorType =
        "content";

    editorId =
        id;


    if (welcome) {
        welcome.style.display =
            "none";
    }

    if (structureEditor) {
        structureEditor.style.display =
            "none";
    }

    if (contentEditor) {
        contentEditor.style.display =
            "block";
    }


    if (contentEditorTitle) {

        contentEditorTitle.textContent =
            "MODIFIER LE CONTENU";

    }


    if (contentTitle) {

        contentTitle.value =
            item.titre || "";

    }


    remplirListeSousMenus(
        contentParent,
        item.sous_menu_id
    );


    if (cardPhoto) {

        cardPhoto.value =
            item.photo_url || "";

        cardPhoto.dispatchEvent(
            new Event(
                "input",
                {
                    bubbles:true
                }
            )
        );

    }


    if (cardAccroche) {

        cardAccroche.value =
            item.accroche || "";

    }


    /*
     * PRIORITÉ
     *
     * On recharge uniquement l'une des trois valeurs
     * autorisées.
     */

    initialiserListePriorite();


    if (cardPriorite) {

        const priorite =
            String(
                item.priorite || ""
            ).toLowerCase();


        if (
            PRIORITES.some(
                option =>
                    option.value ===
                    priorite
            )
        ) {

            cardPriorite.value =
                priorite;

        } else {

            cardPriorite.value =
                "";

        }

    }


    remplirListesStats();


    if (cardStat1) {

        cardStat1.value =
            item.stat_1
                ? String(item.stat_1)
                : "";

    }


    if (cardStat2) {

        cardStat2.value =
            item.stat_2
                ? String(item.stat_2)
                : "";

    }


    if (cardStat3) {

        cardStat3.value =
            item.stat_3
                ? String(item.stat_3)
                : "";

    }


    /*
     * SYNERGIES
     *
     * Les UUID sont conservés dans leur ordre
     * de sélection.
     */
    initialiserSynergies(
        item.synergies || [],
        item.id
    );


    if (wysiwyg) {

        wysiwyg.innerHTML =
            item.html || "";

    }


    if (sourceEditor) {

        sourceEditor.value =
            item.html || "";

    }


    isSourceMode =
        false;


    actualiserModeEditeur();

}


/* =========================================================
   ENREGISTRER CONTENU
========================================================= */

async function enregistrerContenu() {

    if (!contentTitle) {
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
                toId(item.id) ===
                toId(editorId)
        );


    if (!contenu) {

        showMessage(
            "Contenu introuvable.",
            "error"
        );

        return;

    }


    const nouveauSousMenuId =
        contentParent
            ? contentParent.value
            : "";


    if (!nouveauSousMenuId) {

        showMessage(
            "Le sous-menu parent est obligatoire.",
            "error"
        );

        return;

    }


    if (
        isSourceMode &&
        wysiwyg &&
        sourceEditor
    ) {

        wysiwyg.innerHTML =
            sourceEditor.value;

    }


    const html =
        wysiwyg
            ? wysiwyg.innerHTML
            : "";


    const photo =
        cardPhoto
            ? String(
                cardPhoto.value || ""
            ).trim()
            : "";


    const accroche =
        cardAccroche
            ? String(
                cardAccroche.value || ""
            ).trim()
            : "";


    /*
     * PRIORITÉ
     *
     * Une seule valeur parmi :
     * absolue
     * prioritaire
     * secondaire
     */

    let priorite =
        cardPriorite
            ? String(
                cardPriorite.value || ""
            ).trim().toLowerCase()
            : "";


    if (
        !PRIORITES.some(
            option =>
                option.value ===
                priorite
        )
    ) {

        priorite =
            "";

    }


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


    let nouvellePosition =
        Number(
            contenu.position
        ) || 0;


    if (
        toId(nouveauSousMenuId) !==
        toId(contenu.sous_menu_id)
    ) {

        const destination =
            contenus.filter(
                item =>
                    toId(item.sous_menu_id) ===
                    toId(nouveauSousMenuId) &&
                    toId(item.id) !==
                    toId(editorId)
            );


        nouvellePosition =
            getNextPosition(
                destination
            );

    }


    if (contentSaveButton) {
        contentSaveButton.disabled = true;
    }


    try {

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

                    synergies

                })
                .eq(
                    "id",
                    editorId
                );


        if (error) {
            throw error;
        }


        await chargerDonnees();

        fermerEditeurs();

        showMessage(
            "Contenu enregistré."
        );

    }
    catch (error) {

        showMessage(
            error?.message
                ? "Impossible d'enregistrer le contenu : " +
                  error.message
                : "Impossible d'enregistrer le contenu.",
            "error"
        );

    }
    finally {

        if (contentSaveButton) {
            contentSaveButton.disabled = false;
        }

    }

}


/* =========================================================
   EDITEUR
========================================================= */

function initialiserEvenementsEditeur() {

    document
        .querySelectorAll(
            "#toolbar button[data-command]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    event => {

                        event.preventDefault();

                        const command =
                            button.dataset.command;

                        const value =
                            button.dataset.value ||
                            null;


                        if (!wysiwyg) {
                            return;
                        }


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
                    event => {

                        event.preventDefault();

                        const format =
                            button.dataset.format;


                        if (!wysiwyg) {
                            return;
                        }


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


    const linkButton =
        document.getElementById(
            "linkButton"
        );


    if (linkButton) {

        linkButton.addEventListener(
            "click",
            event => {

                event.preventDefault();


                const url =
                    prompt(
                        "Adresse du lien :"
                    );


                if (
                    !url ||
                    !wysiwyg
                ) {
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

    }


    const imageButton =
        document.getElementById(
            "imageButton"
        );


    if (imageButton) {

        imageButton.addEventListener(
            "click",
            event => {

                event.preventDefault();


                const url =
                    prompt(
                        "URL de l'image :"
                    );


                if (
                    !url ||
                    !wysiwyg
                ) {
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

    }


    const videoButton =
        document.getElementById(
            "videoButton"
        );


    if (videoButton) {

        videoButton.addEventListener(
            "click",
            event => {

                event.preventDefault();


                const url =
                    prompt(
                        "URL de la vidéo :"
                    );


                if (
                    !url ||
                    !wysiwyg
                ) {
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

    }


    const sourceModeButton =
        document.getElementById(
            "sourceModeButton"
        );


    if (sourceModeButton) {

        sourceModeButton.addEventListener(
            "click",
            event => {

                event.preventDefault();


                if (!isSourceMode) {

                    if (
                        wysiwyg &&
                        sourceEditor
                    ) {

                        sourceEditor.value =
                            wysiwyg.innerHTML;

                    }

                    isSourceMode =
                        true;

                } else {

                    if (
                        wysiwyg &&
                        sourceEditor
                    ) {

                        wysiwyg.innerHTML =
                            sourceEditor.value;

                    }

                    isSourceMode =
                        false;

                }


                actualiserModeEditeur();

            }
        );

    }


    if (contentCancelButton) {

        contentCancelButton.addEventListener(
            "click",
            event => {

                event.preventDefault();

                fermerEditeurs();

            }
        );

    }


    if (contentSaveButton) {

        contentSaveButton.addEventListener(
            "click",
            event => {

                event.preventDefault();

                enregistrerContenu();

            }
        );

    }

}


function actualiserModeEditeur() {

    const sourceModeButton =
        document.getElementById(
            "sourceModeButton"
        );


    if (
        !wysiwyg ||
        !sourceEditor
    ) {
        return;
    }


    if (isSourceMode) {

        wysiwyg.style.display =
            "none";

        sourceEditor.style.display =
            "block";


        if (sourceModeButton) {

            sourceModeButton.textContent =
                "ÉDITEUR VISUEL";

        }

    } else {

        wysiwyg.style.display =
            "block";

        sourceEditor.style.display =
            "none";


        if (sourceModeButton) {

            sourceModeButton.textContent =
                "CODE HTML";

        }

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
        !Boolean(item.valide);


    let table =
        null;


    if (
        menus.some(
            element =>
                toId(element.id) ===
                toId(id)
        )
    ) {

        table =
            "menus";

    }
    else if (
        sousMenus.some(
            element =>
                toId(element.id) ===
                toId(id)
        )
    ) {

        table =
            "sous_menus";

    }
    else if (
        contenus.some(
            element =>
                toId(element.id) ===
                toId(id)
        )
    ) {

        table =
            "contenus";

    }


    if (!table) {

        showMessage(
            "Élément introuvable.",
            "error"
        );

        return;

    }


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

        showMessage(
            "Impossible de modifier le statut : " +
            error.message,
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
                toId(sibling.id) ===
                toId(item.id)
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
                toId(sibling.id) ===
                toId(item.id)
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
        Number(first.position) || 0;

    const secondPosition =
        Number(second.position) || 0;


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

        showMessage(
            "Impossible de modifier l'ordre : " +
            firstUpdate.error.message,
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

        showMessage(
            "Impossible de modifier l'ordre : " +
            secondUpdate.error.message,
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

async function supprimerMenu(id) {

    const menu =
        menus.find(
            item =>
                toId(item.id) ===
                toId(id)
        );


    if (!menu) {
        return;
    }


    const children =
        sousMenus.filter(
            item =>
                toId(item.menu_id) ===
                toId(id)
        );


    const contentCount =
        contenus.filter(
            content =>
                children.some(
                    submenu =>
                        toId(submenu.id) ===
                        toId(content.sous_menu_id)
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

            showMessage(
                "Suppression interrompue : " +
                error.message,
                "error"
            );

            await chargerDonnees();

            return;

        }

    }


    const {
        error: submenuError
    } =
        await supabase
            .from("sous_menus")
            .delete()
            .eq(
                "menu_id",
                id
            );


    if (submenuError) {

        showMessage(
            "Impossible de supprimer le menu : " +
            submenuError.message,
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

        showMessage(
            "Impossible de supprimer le menu : " +
            error.message,
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

async function supprimerSousMenu(id) {

    const submenu =
        sousMenus.find(
            item =>
                toId(item.id) ===
                toId(id)
        );


    if (!submenu) {
        return;
    }


    const childCount =
        contenus.filter(
            item =>
                toId(item.sous_menu_id) ===
                toId(id)
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
        error: contentError
    } =
        await supabase
            .from("contenus")
            .delete()
            .eq(
                "sous_menu_id",
                id
            );


    if (contentError) {

        showMessage(
            "Impossible de supprimer les contenus : " +
            contentError.message,
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

        showMessage(
            "Impossible de supprimer le sous-menu : " +
            error.message,
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

async function supprimerContenu(id) {

    const item =
        contenus.find(
            content =>
                toId(content.id) ===
                toId(id)
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

        showMessage(
            "Impossible de supprimer le contenu : " +
            error.message,
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
   FERMER EDITEURS
========================================================= */

function fermerEditeurs() {

    if (welcome) {
        welcome.style.display =
            "block";
    }

    if (structureEditor) {
        structureEditor.style.display =
            "none";
    }

    if (contentEditor) {
        contentEditor.style.display =
            "none";
    }

    if (structureParentField) {
        structureParentField.style.display =
            "none";
    }


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


    /*
     * Réinitialisation de l'état des synergies.
     * Les données ne sont pas enregistrées ici :
     * elles le sont uniquement via enregistrerContenu().
     */
    selectedSynergyIds =
        [];

    currentSynergyContentId =
        null;


    actualiserModeEditeur();

}


/* =========================================================
   EVENEMENTS STRUCTURE
========================================================= */

function initialiserEvenementsStructure() {

    if (structureSaveButton) {

        structureSaveButton.addEventListener(
            "click",
            event => {

                event.preventDefault();

                enregistrerStructure();

            }
        );

    }


    if (structureCancelButton) {

        structureCancelButton.addEventListener(
            "click",
            event => {

                event.preventDefault();

                fermerEditeurs();

            }
        );

    }


    if (addMenuButton) {

        addMenuButton.disabled =
            false;


        addMenuButton.addEventListener(
            "click",
            event => {

                event.preventDefault();

                event.stopPropagation();

                ouvrirCreationMenu();

            }
        );

    }


    if (modalCloseButton) {

        modalCloseButton.addEventListener(
            "click",
            event => {

                event.preventDefault();

                fermerModal();

            }
        );

    }


    if (modalCancelButton) {

        modalCancelButton.addEventListener(
            "click",
            event => {

                event.preventDefault();

                fermerModal();

            }
        );

    }


    if (structureModal) {

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

    }


    if (modalSaveButton) {

        modalSaveButton.addEventListener(
            "click",
            event => {

                event.preventDefault();

                creerElement();

            }
        );

    }


    if (modalName) {

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

    }

}


/* =========================================================
   CTRL + S
========================================================= */

function initialiserEvenementClavier() {

    document.addEventListener(
        "keydown",
        event => {

            if (
                (
                    event.ctrlKey ||
                    event.metaKey
                ) &&
                event.key.toLowerCase() ===
                "s"
            ) {

                event.preventDefault();


                if (
                    contentEditor &&
                    contentEditor.style.display !==
                    "none"
                ) {

                    enregistrerContenu();

                    return;

                }


                if (
                    structureEditor &&
                    structureEditor.style.display !==
                    "none"
                ) {

                    enregistrerStructure();

                }

            }

        }
    );

}


/* =========================================================
   INITIALISATION
========================================================= */

async function initialiser() {

    initialiserEvenementsStructure();

    initialiserEvenementsEditeur();

    initialiserEvenementsSynergies();

    initialiserEvenementClavier();

    initialiserApercuImageContenu();

    initialiserListePriorite();


    try {

        await verifierAdmin();

    }
    catch (error) {

        currentProfile =
            null;


        if (addMenuButton) {
            addMenuButton.disabled = true;
        }


        if (tree) {

            tree.innerHTML = `

                <div class="empty-tree">

                    ${escapeHtml(
                        error?.message ||
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

        }


        return;

    }


    try {

        await chargerDonnees();

    }
    catch (error) {

        console.error(
            "CONTENUS — chargement :",
            error
        );


        if (tree) {

            tree.innerHTML = `

                <div class="empty-tree">

                    Impossible de charger
                    la structure des contenus.

                    <br><br>

                    <span
                        style="
                            color:rgba(239,65,53,.85);
                        "
                    >
                        ${escapeHtml(
                            error?.message ||
                            "Erreur de chargement."
                        )}
                    </span>

                </div>

            `;

        }


        if (
            addMenuButton &&
            currentProfile &&
            String(
                currentProfile.grade || ""
            ).toLowerCase() ===
            "admin"
        ) {

            addMenuButton.disabled =
                false;

        }


        return;

    }


    if (addMenuButton) {
        addMenuButton.disabled = false;
    }


    /*
     * On rafraîchit également l'interface des synergies
     * si elle existe déjà dans la page.
     */
    rendreSynergies();

}


/* =========================================================
   DOM READY
========================================================= */

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

}
else {

    initialiser();

}
