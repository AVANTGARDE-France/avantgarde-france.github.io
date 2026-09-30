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

const $ = id =>
    document.getElementById(id);

const tree = $("tree");
const welcome = $("welcome");
const structureEditor = $("structureEditor");
const contentEditor = $("contentEditor");

const structureTitle = $("structureTitle");
const structureDescription = $("structureDescription");
const structureName = $("structureName");
const structureParentField = $("structureParentField");
const structureParent = $("structureParent");
const structureSaveButton = $("structureSaveButton");
const structureCancelButton = $("structureCancelButton");

const contentEditorTitle = $("contentEditorTitle");
const contentTitle = $("contentTitle");
const contentParent = $("contentParent");
const contentCancelButton = $("contentCancelButton");
const contentSaveButton = $("contentSaveButton");

const wysiwyg = $("wysiwyg");
const sourceEditor = $("sourceEditor");

const message = $("message");
const connectedUser = $("connectedUser");

const structureModal = $("structureModal");
const modalTitle = $("modalTitle");
const modalName = $("modalName");
const modalSaveButton = $("modalSaveButton");
const modalCloseButton = $("modalCloseButton");
const modalCancelButton = $("modalCancelButton");

const addMenuButton = $("addMenuButton");


/* =========================================================
   RECTO
========================================================= */

let cardPhoto =
    $("contentPhoto") ||
    $("cardPhoto");

let cardAccroche =
    $("contentAccroche") ||
    $("cardAccroche");

let cardPriorite =
    $("contentPriority") ||
    $("cardPriority");

let cardStat1 =
    $("contentStat1") ||
    $("cardStat1");

let cardStat2 =
    $("contentStat2") ||
    $("cardStat2");

let cardStat3 =
    $("contentStat3") ||
    $("cardStat3");

let cardSynergies =
    $("contentSynergies") ||
    $("cardSynergies");


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


    /* -----------------------------------------------------
       On force définitivement le champ à être un SELECT.
       Aucune saisie libre n'est autorisée.
    ----------------------------------------------------- */

    if (
        cardPriorite.tagName.toLowerCase() !==
        "select"
    ) {

        const select =
            document.createElement("select");

        select.id =
            cardPriorite.id ||
            "contentPriority";

        select.className =
            cardPriorite.className || "";

        select.name =
            cardPriorite.name ||
            "priorite";

        cardPriorite.parentNode.replaceChild(
            select,
            cardPriorite
        );

        cardPriorite =
            select;

    }


    const valeurActuelle =
        String(
            cardPriorite.value || ""
        )
            .trim()
            .toLowerCase();


    cardPriorite.innerHTML =
        "";


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


    /* -----------------------------------------------------
       VALEUR PAR DEFAUT
       Si aucune valeur valide n'existe :
       SECONDaire
    ----------------------------------------------------- */

    const valeurValide =
        PRIORITES.some(
            option =>
                option.value ===
                valeurActuelle
        );


    cardPriorite.value =
        valeurValide
            ? valeurActuelle
            : "secondaire";

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

    if (
        !Array.isArray(items) ||
        !items.length
    ) {
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

    clearTimeout(
        messageTimer
    );

    message.className =
        "message visible " +
        type;

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

        document.head.appendChild(
            style
        );

    }

    contentPhotoPreview =
        $("contentPhotoPreview");

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

    const actualiser =
        () => {

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

        };

    cardPhoto.addEventListener(
        "input",
        actualiser
    );

    cardPhoto.addEventListener(
        "change",
        actualiser
    );

    actualiser();

}


/* =========================================================
   STYLES ARBRE
========================================================= */

function injectTreeStyles() {

    if (
        $("avantgarde-content-tree-styles")
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

    document.head.appendChild(
        style
    );

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
        String(
            profile.grade || ""
        )
        .toLowerCase() !==
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
   CHARGEMENT DES DONNEES
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
        Array.isArray(
            menusResult.data
        )
            ? menusResult.data
            : [];

    sousMenus =
        Array.isArray(
            sousMenusResult.data
        )
            ? sousMenusResult.data
            : [];

    contenus =
        Array.isArray(
            contenusResult.data
        )
            ? contenusResult.data
            : [];

    try {

        const {
            data,
            error
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

        if (error) {

            console.warn(
                "Statistiques indisponibles :",
                error.message
            );

            stats = [];

        } else {

            stats =
                Array.isArray(data)
                    ? data
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

    if (
        currentSynergyContentId
    ) {

        rendreSynergies();

    }

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
    .forEach(select => {

        const valeur =
            select.value || "";

        select.innerHTML =
            "";

        const empty =
            document.createElement(
                "option"
            );

        empty.value =
            "";

        empty.textContent =
            "Aucune statistique";

        select.appendChild(
            empty
        );

        stats.forEach(stat => {

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

        });

        if (valeur) {
            select.value =
                valeur;
        }

    });

}


/* =========================================================
   SYNERGIES
========================================================= */

function normaliserSynergies(value) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return [];
    }

    let valeurs =
        value;

    if (
        typeof valeurs ===
        "string"
    ) {

        const texte =
            valeurs.trim();

        if (!texte) {
            return [];
        }

        try {

            const json =
                JSON.parse(texte);

            if (Array.isArray(json)) {

                valeurs =
                    json;

            }
            else if (
                json &&
                typeof json ===
                "object" &&
                Array.isArray(
                    json.synergies
                )
            ) {

                valeurs =
                    json.synergies;

            }
            else {

                valeurs =
                    [];

            }

        }
        catch {

            if (
                texte.startsWith("{") &&
                texte.endsWith("}")
            ) {

                const contenu =
                    texte
                        .slice(1,-1)
                        .trim();

                if (!contenu) {
                    return [];
                }

                valeurs =
                    contenu
                        .split(",")
                        .map(
                            value =>
                                value
                                    .trim()
                                    .replace(
                                        /^"|"$/g,
                                        ""
                                    )
                                    .trim()
                        );

            }
            else {

                return [];

            }

        }

    }

    if (!Array.isArray(valeurs)) {
        return [];
    }

    return Array.from(
        new Set(
            valeurs
                .map(value => {

                    if (
                        value &&
                        typeof value ===
                        "object"
                    ) {

                        return String(
                            value.id ||
                            value.uuid ||
                            value.content_id ||
                            ""
                        ).trim();

                    }

                    return String(
                        value || ""
                    ).trim();

                })
                .filter(Boolean)
        )
    );

}


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


function obtenirContenuSynergie(id) {

    const identifiant =
        String(
            id || ""
        ).trim();

    if (!identifiant) {
        return null;
    }

    return contenus.find(
        contenu =>
            String(
                contenu.id || ""
            ) ===
            identifiant
    ) || null;

}


/* =========================================================
   INTERFACE SYNERGIES
========================================================= */

function initialiserInterfaceSynergies() {

    let host =
        $("contentSynergies") ||
        $("cardSynergies");

    if (!host) {
        return;
    }

    /*
     * Si l'ancien champ est un input,
     * textarea ou select, on le remplace.
     *
     * Si c'est déjà notre conteneur,
     * on ne le recrée surtout pas.
     */
    const dejaInitialise =
        host.querySelector(
            "#synergyAvailable"
        ) &&
        host.querySelector(
            "#synergySelected"
        );

    if (
        host.tagName.toLowerCase() ===
            "div" &&
        dejaInitialise
    ) {

        cardSynergies =
            host;

        return;

    }

    const container =
        document.createElement("div");

    container.id =
        host.id ||
        "contentSynergies";

    container.className =
        host.className ||
        "";

    if (host.parentNode) {

        host.parentNode.replaceChild(
            container,
            host
        );

    }

    cardSynergies =
        container;

    if (
        !$(
            "avantgarde-synergy-styles"
        )
    ) {

        const style =
            document.createElement("style");

        style.id =
            "avantgarde-synergy-styles";

        style.textContent = `

            .synergy-columns {
                display:grid;
                grid-template-columns:
                    minmax(0,1fr)
                    minmax(0,1fr);
                gap:14px;
                margin-top:10px;
            }

            .synergy-panel {
                min-width:0;
                border:1px solid var(--border);
                border-radius:8px;
                background:rgba(7,21,45,.35);
                overflow:hidden;
            }

            .synergy-panel-header {
                padding:10px 12px;
                border-bottom:
                    1px solid var(--border);
            }

            .synergy-panel-title {
                display:flex;
                justify-content:space-between;
                align-items:center;
                gap:10px;
                color:var(--white);
                font-size:10px;
                font-weight:600;
                letter-spacing:.06em;
                text-transform:uppercase;
            }

            .synergy-search {
                display:block;
                width:100%;
                box-sizing:border-box;
                margin-top:8px;
                padding:8px 10px;
                border:1px solid var(--border);
                border-radius:6px;
                background:rgba(255,255,255,.04);
                color:var(--white);
                outline:none;
            }

            .synergy-search:focus {
                border-color:
                    rgba(214,173,85,.55);
            }

            .synergy-list {
                max-height:300px;
                overflow:auto;
                padding:5px;
            }

            .synergy-item {
                width:100%;
                display:flex;
                align-items:center;
                justify-content:space-between;
                gap:10px;
                box-sizing:border-box;
                padding:8px 9px;
                margin:2px 0;
                border:
                    1px solid transparent;
                border-radius:5px;
                background:
                    rgba(255,255,255,.025);
                color:var(--white);
                text-align:left;
                cursor:pointer;
            }

            .synergy-item:hover {
                border-color:
                    var(--border);
                background:
                    rgba(214,173,85,.08);
            }

            .synergy-item-title {
                min-width:0;
                overflow:hidden;
                text-overflow:ellipsis;
                white-space:nowrap;
                font-size:12px;
            }

            .synergy-item-action {
                flex:0 0 auto;
                color:var(--gold-light);
                font-size:8px;
                font-weight:600;
                letter-spacing:.04em;
            }

            .synergy-empty {
                padding:18px 10px;
                color:
                    rgba(245,243,237,.42);
                font-size:11px;
                text-align:center;
            }

            .synergy-footer {
                padding:6px 8px;
                border-top:
                    1px solid var(--border);
                text-align:right;
            }

            .synergy-clear {
                padding:6px 9px;
                border:
                    1px solid var(--border);
                border-radius:5px;
                background:
                    rgba(255,255,255,.035);
                color:
                    rgba(245,243,237,.70);
                font-size:9px;
                cursor:pointer;
            }

            .synergy-clear:hover {
                border-color:
                    rgba(214,173,85,.45);
                color:
                    var(--gold-light);
            }

            .synergy-clear:disabled {
                opacity:.35;
                cursor:default;
            }

            @media (max-width:700px) {

                .synergy-columns {
                    grid-template-columns:1fr;
                }

            }

        `;

        document.head.appendChild(
            style
        );

    }

    container.innerHTML = `

        <div class="synergy-columns">

            <div class="synergy-panel">

                <div class="synergy-panel-header">

                    <div class="synergy-panel-title">

                        <span>
                            Contenus disponibles
                        </span>

                        <span
                            id="synergyAvailableCount"
                        >
                            0
                        </span>

                    </div>

                    <input
                        id="synergySearch"
                        class="synergy-search"
                        type="search"
                        placeholder="Rechercher un contenu…"
                        autocomplete="off"
                    >

                </div>

                <div
                    id="synergyAvailable"
                    class="synergy-list"
                ></div>

            </div>


            <div class="synergy-panel">

                <div class="synergy-panel-header">

                    <div class="synergy-panel-title">

                        <span>
                            Synergies sélectionnées
                        </span>

                        <span
                            id="synergySelectedCount"
                        >
                            0
                        </span>

                    </div>

                </div>

                <div
                    id="synergySelected"
                    class="synergy-list"
                ></div>

                <div class="synergy-footer">

                    <button
                        id="synergyClearButton"
                        type="button"
                        class="synergy-clear"
                    >
                        Tout retirer
                    </button>

                </div>

            </div>

        </div>

    `;

}


function obtenirElementsSynergies() {

    return {

        search:
            $("synergySearch"),

        available:
            $("synergyAvailable"),

        availableCount:
            $("synergyAvailableCount"),

        selected:
            $("synergySelected"),

        selectedCount:
            $("synergySelectedCount"),

        clear:
            $("synergyClearButton")

    };

}


function initialiserSynergies(
    valeurs = [],
    currentId = null
) {

    initialiserInterfaceSynergies();

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
                !currentSynergyContentId ||
                String(id) !==
                String(
                    currentSynergyContentId
                )
        );

    const elements =
        obtenirElementsSynergies();

    if (elements.search) {
        elements.search.value = "";
    }

    rendreSynergies();

}


function creerLigneSynergie(
    contenu,
    action,
    callback
) {

    const row =
        document.createElement(
            "button"
        );

    row.type =
        "button";

    row.className =
        "synergy-item";

    row.title =
        action === "AJOUTER"
            ? "Ajouter cette synergie"
            : "Retirer cette synergie";

    const title =
        document.createElement(
            "span"
        );

    title.className =
        "synergy-item-title";

    title.textContent =
        contenu.titre ||
        "Contenu sans titre";

    title.title =
        contenu.titre ||
        "Contenu sans titre";

    const actionElement =
        document.createElement(
            "span"
        );

    actionElement.className =
        "synergy-item-action";

    actionElement.textContent =
        action;

    row.appendChild(title);
    row.appendChild(actionElement);

    row.addEventListener(
        "click",
        event => {

            event.preventDefault();
            event.stopPropagation();

            callback(
                contenu.id
            );

        }
    );

    return row;

}


function rendreSynergies() {

    const elements =
        obtenirElementsSynergies();

    if (
        !elements.available ||
        !elements.selected
    ) {
        return;
    }

    selectedSynergyIds =
        normaliserSynergies(
            selectedSynergyIds
        )
        .filter(
            id =>
                !currentSynergyContentId ||
                String(id) !==
                String(
                    currentSynergyContentId
                )
        );

    const recherche =
        normaliserRechercheSynergie(
            elements.search
                ? elements.search.value
                : ""
        );

    const selectedSet =
        new Set(
            selectedSynergyIds.map(
                id =>
                    String(id)
            )
        );


    /* -----------------------------------------------------
       CONTENUS DISPONIBLES
    ----------------------------------------------------- */

    const disponibles =
        contenus
            .filter(contenu => {

                const id =
                    String(
                        contenu.id || ""
                    ).trim();

                if (!id) {
                    return false;
                }

                if (
                    currentSynergyContentId &&
                    id ===
                    String(
                        currentSynergyContentId
                    )
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
                        "Contenu sans titre"
                    );

                return titre.includes(
                    recherche
                );

            })
            .slice()
            .sort(
                (a,b) =>
                    String(
                        a.titre || ""
                    )
                    .localeCompare(
                        String(
                            b.titre || ""
                        ),
                        "fr",
                        {
                            sensitivity:"base"
                        }
                    )
            );


    elements.available.innerHTML =
        "";


    /*
     * On affiche tous les résultats.
     * La recherche permet de retrouver
     * facilement un contenu lorsque la liste
     * devient importante.
     */

    if (!disponibles.length) {

        const empty =
            document.createElement(
                "div"
            );

        empty.className =
            "synergy-empty";

        empty.textContent =
            recherche
                ? "Aucun contenu ne correspond à la recherche."
                : "Aucun autre contenu disponible.";

        elements.available.appendChild(
            empty
        );

    }
    else {

        disponibles.forEach(
            contenu => {

                elements.available.appendChild(
                    creerLigneSynergie(
                        contenu,
                        "AJOUTER",
                        ajouterSynergie
                    )
                );

            }
        );

    }


    if (elements.availableCount) {

        elements.availableCount.textContent =
            String(
                disponibles.length
            ) +
            (
                disponibles.length > 1
                    ? " disponibles"
                    : " disponible"
            );

    }


    /* -----------------------------------------------------
       CONTENUS SELECTIONNES
    ----------------------------------------------------- */

    elements.selected.innerHTML =
        "";

    const selectedObjects =
        selectedSynergyIds
            .map(
                obtenirContenuSynergie
            )
            .filter(Boolean);

    if (!selectedObjects.length) {

        const empty =
            document.createElement(
                "div"
            );

        empty.className =
            "synergy-empty";

        empty.textContent =
            "Aucune synergie sélectionnée.";

        elements.selected.appendChild(
            empty
        );

    }
    else {

        selectedObjects.forEach(
            contenu => {

                elements.selected.appendChild(
                    creerLigneSynergie(
                        contenu,
                        "RETIRER",
                        retirerSynergie
                    )
                );

            }
        );

    }


    if (elements.selectedCount) {

        const nombre =
            selectedObjects.length;

        elements.selectedCount.textContent =
            String(nombre) +
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
        String(
            id || ""
        ).trim();

    if (!identifiant) {
        return;
    }

    if (
        currentSynergyContentId &&
        identifiant ===
        String(
            currentSynergyContentId
        )
    ) {
        return;
    }

    if (
        !obtenirContenuSynergie(
            identifiant
        )
    ) {
        return;
    }

    if (
        selectedSynergyIds.some(
            value =>
                String(value) ===
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
        String(
            id || ""
        ).trim();

    selectedSynergyIds =
        normaliserSynergies(
            selectedSynergyIds
        )
        .filter(
            value =>
                String(value) !==
                identifiant
        );

    rendreSynergies();

}


function retirerToutesLesSynergies() {

    selectedSynergyIds = [];

    rendreSynergies();

}


function obtenirSynergies() {

    return normaliserSynergies(
        selectedSynergyIds
    )
    .filter(
        id =>
            !currentSynergyContentId ||
            String(id) !==
            String(
                currentSynergyContentId
            )
    );

}


/* =========================================================
   EVENEMENTS SYNERGIES
========================================================= */

function initialiserEvenementsSynergies() {

    initialiserInterfaceSynergies();

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
                event.stopPropagation();

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

    menus
        .slice()
        .sort(
            (a,b) =>
                (Number(a.position) || 0) -
                (Number(b.position) || 0)
        )
        .forEach(
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
                        ${escapeHtml(
                            menu.titre
                        )}
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
                    creerStatusButton(
                        menu
                    )
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
                    document.createElement(
                        "div"
                    );

                submenuList.className =
                    "submenu-list";

                const siblings =
                    sousMenus
                        .filter(
                            item =>
                                toId(
                                    item.menu_id
                                ) ===
                                toId(
                                    menu.id
                                )
                        )
                        .slice()
                        .sort(
                            (a,b) =>
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
            ${escapeHtml(
                submenu.titre
            )}
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
        contenus
            .filter(
                content =>
                    toId(
                        content.sous_menu_id
                    ) ===
                    toId(
                        submenu.id
                    )
            )
            .slice()
            .sort(
                (a,b) =>
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

            event.preventDefault();
            event.stopPropagation();

            action();

        }
    );

    return button;

}


function creerStatusButton(item) {

    const button =
        document.createElement(
            "button"
        );

    button.type =
        "button";

    button.className =
        "status-button";

    if (
        Boolean(
            item.valide
        )
    ) {

        button.classList.add(
            "status-valid"
        );

        button.textContent =
            "VALIDÉ";

    }
    else {

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
   LISTES
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

    menus
        .slice()
        .sort(
            (a,b) =>
                (Number(a.position) || 0) -
                (Number(b.position) || 0)
        )
        .forEach(
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
                    toId(
                        menu.id
                    ) ===
                    toId(
                        valeur
                    );

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

    if (!select) {
        return;
    }

    select.innerHTML =
        "";

    menus
        .slice()
        .sort(
            (a,b) =>
                (Number(a.position) || 0) -
                (Number(b.position) || 0)
        )
        .forEach(
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
                            toId(
                                submenu.menu_id
                            ) ===
                            toId(
                                menu.id
                            )
                    )
                    .slice()
                    .sort(
                        (a,b) =>
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
                                toId(
                                    submenu.id
                                ) ===
                                toId(
                                    valeur
                                );

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
                toId(
                    element.id
                ) ===
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

    if (
        type === "submenu"
    ) {

        if (structureParentField) {

            structureParentField.style.display =
                "block";

        }

        remplirListeMenus(
            structureParent,
            item.menu_id
        );

    }
    else {

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

        if (structureSaveButton) {
            structureSaveButton.disabled = true;
        }

        try {

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
                throw error;
            }

            await chargerDonnees();

            fermerEditeurs();

            showMessage(
                "Modification enregistrée."
            );

        }
        catch (error) {

            showMessage(
                "Impossible d'enregistrer le menu : " +
                error.message,
                "error"
            );

        }
        finally {

            if (structureSaveButton) {
                structureSaveButton.disabled =
                    false;
            }

        }

        return;

    }

    if (
        selectedType !==
        "submenu"
    ) {
        return;
    }

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
        Number(
            submenu.position
        ) || 0;

    if (
        toId(
            nouveauMenuId
        ) !==
        toId(
            submenu.menu_id
        )
    ) {

        const destination =
            sousMenus.filter(
                item =>
                    toId(
                        item.menu_id
                    ) ===
                    toId(
                        nouveauMenuId
                    ) &&
                    toId(
                        item.id
                    ) !==
                    toId(
                        selectedId
                    )
            );

        nouvellePosition =
            getNextPosition(
                destination
            );

    }

    if (structureSaveButton) {
        structureSaveButton.disabled =
            true;
    }

    try {

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
            throw error;
        }

        await chargerDonnees();

        fermerEditeurs();

        showMessage(
            "Modification enregistrée."
        );

    }
    catch (error) {

        showMessage(
            "Impossible d'enregistrer le sous-menu : " +
            error.message,
            "error"
        );

    }
    finally {

        if (structureSaveButton) {
            structureSaveButton.disabled =
                false;
        }

    }

}


/* =========================================================
   MODAL
========================================================= */

function obtenirElementsModal() {

    return {

        modal:
            $("structureModal"),

        title:
            $("modalTitle"),

        name:
            $("modalName"),

        save:
            $("modalSaveButton")

    };

}


function ouvrirModalCreation(
    type,
    parentId
) {

    const elements =
        obtenirElementsModal();

    if (!elements.modal) {

        showMessage(
            "Fenêtre de création introuvable.",
            "error"
        );

        return;

    }

    if (!elements.name) {

        showMessage(
            "Champ de nom introuvable.",
            "error"
        );

        return;

    }

    modalType =
        type;

    modalParentId =
        parentId;

    elements.title.textContent =
        type === "submenu"
            ? "NOUVEAU SOUS-MENU"
            : "NOUVEAU CONTENU";

    elements.name.value =
        "";

    if (elements.save) {

        elements.save.textContent =
            "CRÉER";

        elements.save.disabled =
            false;

    }

    elements.modal.classList.add(
        "visible"
    );

    elements.modal.style.display =
        "flex";

    setTimeout(
        () => {

            if (
                document.body.contains(
                    elements.name
                )
            ) {

                elements.name.focus();

            }

        },
        50
    );

}


function ouvrirCreationMenu() {

    const elements =
        obtenirElementsModal();

    if (!elements.modal) {

        showMessage(
            "Fenêtre de création introuvable.",
            "error"
        );

        return;

    }

    if (!elements.name) {

        showMessage(
            "Champ de nom introuvable.",
            "error"
        );

        return;

    }

    modalType =
        "menu";

    modalParentId =
        null;

    elements.title.textContent =
        "NOUVEAU MENU";

    elements.name.value =
        "";

    if (elements.save) {

        elements.save.textContent =
            "CRÉER";

        elements.save.disabled =
            false;

    }

    elements.modal.classList.add(
        "visible"
    );

    elements.modal.style.display =
        "flex";

    setTimeout(
        () => {

            if (
                document.body.contains(
                    elements.name
                )
            ) {

                elements.name.focus();

            }

        },
        50
    );

}


function fermerModal() {

    const modal =
        $("structureModal");

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
        $("modalName");

    const save =
        $("modalSaveButton");

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
                        toId(
                            item.menu_id
                        ) ===
                        toId(
                            modalParentId
                        )
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
                        toId(
                            item.sous_menu_id
                        ) ===
                        toId(
                            modalParentId
                        )
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
            "Impossible de créer l'élément : " +
            (
                error?.message ||
                "erreur inconnue"
            ),
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
                toId(
                    content.id
                ) ===
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


    /* -----------------------------------------------------
       PHOTO
    ----------------------------------------------------- */

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


    /* -----------------------------------------------------
       ACCROCHE
    ----------------------------------------------------- */

    if (cardAccroche) {

        cardAccroche.value =
            item.accroche || "";

    }


    /* -----------------------------------------------------
       PRIORITE
    ----------------------------------------------------- */

    initialiserListePriorite();

    if (cardPriorite) {

    const priorite =
        String(
            item.priorite || ""
        )
        .trim()
        .toLowerCase();

    cardPriorite.value =
        PRIORITES.some(
            option =>
                option.value ===
                priorite
        )
            ? priorite
            : "secondaire";

}


    /* -----------------------------------------------------
       STATISTIQUES
    ----------------------------------------------------- */

    remplirListesStats();

    if (cardStat1) {

        cardStat1.value =
            item.stat_1
                ? String(
                    item.stat_1
                )
                : "";

    }

    if (cardStat2) {

        cardStat2.value =
            item.stat_2
                ? String(
                    item.stat_2
                )
                : "";

    }

    if (cardStat3) {

        cardStat3.value =
            item.stat_3
                ? String(
                    item.stat_3
                )
                : "";

    }


    /* -----------------------------------------------------
       SYNERGIES
    ----------------------------------------------------- */

    initialiserSynergies(
        item.synergies,
        item.id
    );


    /* -----------------------------------------------------
       HTML
    ----------------------------------------------------- */

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


    /* -----------------------------------------------------
       MODE SOURCE
    ----------------------------------------------------- */

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


    /* -----------------------------------------------------
       RECTO
    ----------------------------------------------------- */

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


    /* -----------------------------------------------------
       PRIORITE
    ----------------------------------------------------- */

    let priorite =
        cardPriorite
            ? String(
                cardPriorite.value || ""
            )
            .trim()
            .toLowerCase()
            : "";

    if (
        !PRIORITES.some(
            option =>
                option.value ===
                priorite
        )
    ) {

        priorite =
            "secondaire";

    }


    /* -----------------------------------------------------
       STATISTIQUES
    ----------------------------------------------------- */

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


    /* -----------------------------------------------------
       SYNERGIES
    ----------------------------------------------------- */

    const synergies =
        obtenirSynergies();


    /* -----------------------------------------------------
       POSITION
    ----------------------------------------------------- */

    let nouvellePosition =
        Number(
            contenu.position
        ) || 0;

    if (
        toId(
            nouveauSousMenuId
        ) !==
        toId(
            contenu.sous_menu_id
        )
    ) {

        const destination =
            contenus.filter(
                item =>
                    toId(
                        item.sous_menu_id
                    ) ===
                    toId(
                        nouveauSousMenuId
                    ) &&
                    toId(
                        item.id
                    ) !==
                    toId(editorId)
            );

        nouvellePosition =
            getNextPosition(
                destination
            );

    }


    if (contentSaveButton) {
        contentSaveButton.disabled =
            true;
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

                    /*
                     * IMPORTANT :
                     * On enregistre uniquement
                     * les UUID des contenus.
                     */
                    synergies:
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
            "Impossible d'enregistrer le contenu : " +
            (
                error?.message ||
                "erreur inconnue"
            ),
            "error"
        );

    }
    finally {

        if (contentSaveButton) {

            contentSaveButton.disabled =
                false;

        }

    }

}


/* =========================================================
   EDITEUR WYSIWYG
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

                        if (!wysiwyg) {
                            return;
                        }

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
                    event => {

                        event.preventDefault();

                        if (!wysiwyg) {
                            return;
                        }

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


    /* -----------------------------------------------------
       LIEN
    ----------------------------------------------------- */

    const linkButton =
        $("linkButton");

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


    /* -----------------------------------------------------
       IMAGE
    ----------------------------------------------------- */

    const imageButton =
        $("imageButton");

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


    /* -----------------------------------------------------
       VIDEO
    ----------------------------------------------------- */

    const videoButton =
        $("videoButton");

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
                            src="${escapeHtml(
                                url
                            )}"
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


    /* -----------------------------------------------------
       MODE CODE HTML
    ----------------------------------------------------- */

    const sourceModeButton =
        $("sourceModeButton");

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

                }
                else {

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


    /* -----------------------------------------------------
       ANNULER
    ----------------------------------------------------- */

    if (contentCancelButton) {

        contentCancelButton.addEventListener(
            "click",
            event => {

                event.preventDefault();

                fermerEditeurs();

            }
        );

    }


    /* -----------------------------------------------------
       ENREGISTRER
    ----------------------------------------------------- */

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
        $("sourceModeButton");

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

    }
    else {

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
        !Boolean(
            item.valide
        );

    let table =
        null;

    if (
        menus.some(
            element =>
                toId(
                    element.id
                ) ===
                toId(id)
        )
    ) {

        table =
            "menus";

    }
    else if (
        sousMenus.some(
            element =>
                toId(
                    element.id
                ) ===
                toId(id)
        )
    ) {

        table =
            "sous_menus";

    }
    else if (
        contenus.some(
            element =>
                toId(
                    element.id
                ) ===
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

    const orderedMenus =
        menus
            .slice()
            .sort(
                (a,b) =>
                    (Number(a.position) || 0) -
                    (Number(b.position) || 0)
            );

    const otherIndex =
        index + direction;

    if (
        otherIndex < 0 ||
        otherIndex >=
            orderedMenus.length
    ) {
        return;
    }

    await echangerPositions(
        "menus",
        orderedMenus[index],
        orderedMenus[otherIndex]
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
                toId(
                    sibling.id
                ) ===
                toId(
                    item.id
                )
        );

    const otherIndex =
        index + direction;

    if (
        otherIndex < 0 ||
        otherIndex >=
            siblings.length
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
                toId(
                    sibling.id
                ) ===
                toId(
                    item.id
                )
        );

    const otherIndex =
        index + direction;

    if (
        otherIndex < 0 ||
        otherIndex >=
            siblings.length
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


    /*
     * On effectue les deux modifications
     * puis on recharge l'arbre.
     */

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
                toId(
                    item.id
                ) ===
                toId(id)
        );

    if (!menu) {
        return;
    }

    const children =
        sousMenus.filter(
            item =>
                toId(
                    item.menu_id
                ) ===
                toId(id)
        );

    const contentCount =
        contenus.filter(
            content =>
                children.some(
                    submenu =>
                        toId(
                            submenu.id
                        ) ===
                        toId(
                            content.sous_menu_id
                        )
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


    /*
     * Suppression des contenus enfants.
     */

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
                toId(
                    item.id
                ) ===
                toId(id)
        );

    if (!submenu) {
        return;
    }

    const childCount =
        contenus.filter(
            item =>
                toId(
                    item.sous_menu_id
                ) ===
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
                toId(
                    content.id
                ) ===
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
   SECURITE — VERIFICATION DOM
========================================================= */

function verifierStructureDOM() {

    /*
     * Aucun élément DOM optionnel ne doit empêcher
     * l'ensemble de l'onglet Contenu Projet
     * de fonctionner.
     *
     * Les éléments réellement indispensables sont :
     *
     *   #tree
     *
     * Le reste est contrôlé individuellement
     * dans chaque fonction.
     */

    if (!tree) {

        console.warn(
            "CONTENUS : #tree est introuvable."
        );

    }

}


/* =========================================================
   INITIALISATION
========================================================= */

async function initialiser() {

    verifierStructureDOM();


    /*
     * Les interfaces dynamiques sont préparées
     * avant le chargement des données.
     *
     * L'ordre est important :
     *
     * 1. DOM
     * 2. événements
     * 3. interface synergies
     * 4. authentification
     * 5. données Supabase
     */

    initialiserEvenementsStructure();

    initialiserEvenementsEditeur();

    initialiserInterfaceSynergies();

    initialiserEvenementsSynergies();

    initialiserEvenementClavier();

    initialiserApercuImageContenu();

    initialiserListePriorite();


    /* -----------------------------------------------------
       ADMIN
    ----------------------------------------------------- */

    try {

        await verifierAdmin();

    }
    catch (error) {

        currentProfile =
            null;

        if (addMenuButton) {

            addMenuButton.disabled =
                true;

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


    /* -----------------------------------------------------
       DONNEES
    ----------------------------------------------------- */

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
                currentProfile.grade ||
                ""
            ).toLowerCase() ===
            "admin"
        ) {

            addMenuButton.disabled =
                false;

        }

        return;

    }


    if (addMenuButton) {

        addMenuButton.disabled =
            false;

    }


    /*
     * Rafraîchissement final de la liste
     * des synergies.
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
