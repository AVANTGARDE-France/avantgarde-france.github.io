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
   - synergies obligatoirement bidirectionnelles
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
    $("contentPhotoUrl") ||
    $("contentPhoto") ||
    $("cardPhoto");

let cardAccroche =
    $("contentAccroche") ||
    $("cardAccroche");

let cardPriorite =
    $("contentPriorite") ||
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
            "contentPriorite";

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
       SECONDAIRE
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
   SYNCHRONISATION DES SYNERGIES
   Les synergies sont obligatoirement bidirectionnelles.
========================================================= */

async function synchroniserSynergiesBidirectionnelles(
    contenuId,
    anciennesSynergies,
    nouvellesSynergies
) {

    const idPrincipal =
        String(
            contenuId || ""
        ).trim();

    if (!idPrincipal) {

        throw new Error(
            "Identifiant du contenu manquant."
        );

    }


    const anciennes =
        new Set(
            normaliserSynergies(
                anciennesSynergies
            )
            .map(
                id =>
                    String(id).trim()
            )
            .filter(Boolean)
            .filter(
                id =>
                    id !== idPrincipal
            )
        );


    const nouvelles =
        new Set(
            normaliserSynergies(
                nouvellesSynergies
            )
            .map(
                id =>
                    String(id).trim()
            )
            .filter(Boolean)
            .filter(
                id =>
                    id !== idPrincipal
            )
        );


    const ajoutees =
        [...nouvelles]
        .filter(
            id =>
                !anciennes.has(id)
        );


    const retirees =
        [...anciennes]
        .filter(
            id =>
                !nouvelles.has(id)
        );


    /* -----------------------------------------------------
       AJOUTS
       A → B entraîne automatiquement B → A.
    ----------------------------------------------------- */

    for (
        const synergieId of ajoutees
    ) {

        const {
            data: contenuSynergie,
            error: lectureError
        } =
            await supabase
                .from("contenus")
                .select(
                    "id, synergies"
                )
                .eq(
                    "id",
                    synergieId
                )
                .maybeSingle();

        if (lectureError) {
            throw lectureError;
        }

        if (!contenuSynergie) {
            continue;
        }


        const synergiesExistantes =
            normaliserSynergies(
                contenuSynergie.synergies
            )
            .map(
                id =>
                    String(id).trim()
            )
            .filter(Boolean)
            .filter(
                id =>
                    id !== synergieId
            );


        if (
            !synergiesExistantes.some(
                id =>
                    id === idPrincipal
            )
        ) {

            synergiesExistantes.push(
                idPrincipal
            );

        }


        const {
            error
        } =
            await supabase
                .from("contenus")
                .update({
                    synergies:
                        synergiesExistantes
                })
                .eq(
                    "id",
                    synergieId
                );

        if (error) {
            throw error;
        }

    }


    /* -----------------------------------------------------
       RETRAITS
       Retirer A de B entraîne automatiquement
       le retrait de B de A.
    ----------------------------------------------------- */

    for (
        const synergieId of retirees
    ) {

        const {
            data: contenuSynergie,
            error: lectureError
        } =
            await supabase
                .from("contenus")
                .select(
                    "id, synergies"
                )
                .eq(
                    "id",
                    synergieId
                )
                .maybeSingle();

        if (lectureError) {
            throw lectureError;
        }

        if (!contenuSynergie) {
            continue;
        }


        const synergiesExistantes =
            normaliserSynergies(
                contenuSynergie.synergies
            )
            .map(
                id =>
                    String(id).trim()
            )
            .filter(Boolean)
            .filter(
                id =>
                    id !== idPrincipal
            );


        const {
            error
        } =
            await supabase
                .from("contenus")
                .update({
                    synergies:
                        synergiesExistantes
                })
                .eq(
                    "id",
                    synergieId
                );

        if (error) {
            throw error;
        }

    }

}


/* =========================================================
   NETTOYAGE DES REFERENCES DE SYNERGIE
   Utilisé avant la suppression définitive d'un contenu.
========================================================= */

async function supprimerReferencesSynergie(
    contenuId
) {

    const idSupprime =
        String(
            contenuId || ""
        ).trim();

    if (!idSupprime) {
        return;
    }


    /*
     * On relit directement Supabase afin de ne pas
     * dépendre d'un état local potentiellement ancien.
     */

    const {
        data,
        error
    } =
        await supabase
            .from("contenus")
            .select(
                "id, synergies"
            );

    if (error) {
        throw error;
    }


    const contenusAvecReference =
        (Array.isArray(data)
            ? data
            : []
        )
        .filter(
            contenu =>
                String(
                    contenu.id || ""
                ) !==
                idSupprime
        )
        .map(
            contenu => {

                const synergies =
                    normaliserSynergies(
                        contenu.synergies
                    )
                    .filter(
                        id =>
                            String(id) !==
                            idSupprime
                    );

                return {
                    id:
                        contenu.id,
                    synergies
                };

            }
        )
        .filter(
            contenu => {

                const original =
                    data.find(
                        item =>
                            String(
                                item.id || ""
                            ) ===
                            String(
                                contenu.id
                            )
                    );

                const anciennes =
                    normaliserSynergies(
                        original
                            ? original.synergies
                            : []
                    );

                return (
                    anciennes.length !==
                    contenu.synergies.length
                );

            }
        );


    for (
        const contenu of contenusAvecReference
    ) {

        const {
            error: updateError
        } =
            await supabase
                .from("contenus")
                .update({
                    synergies:
                        contenu.synergies
                })
                .eq(
                    "id",
                    contenu.id
                );

        if (updateError) {
            throw updateError;
        }

    }

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
                            "secondaire",

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

    /*
     * On conserve les anciennes synergies afin de
     * déterminer précisément les ajouts et les retraits.
     */

    const anciennesSynergies =
        normaliserSynergies(
            contenu.synergies
        );

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

        /* -------------------------------------------------
           ENREGISTREMENT DU CONTENU PRINCIPAL
        ------------------------------------------------- */

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


        /* -------------------------------------------------
           SYNCHRONISATION BIDIRECTIONNELLE
        ------------------------------------------------- */

        await synchroniserSynergiesBidirectionnelles(
            editorId,
            anciennesSynergies,
            synergies
        );


        /* -------------------------------------------------
           RECHARGEMENT
        ------------------------------------------------- */

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
     * Avant chaque suppression, on nettoie les
     * références de synergie vers ce contenu.
     */

    for (
        const submenu of children
    ) {

        const childContents =
            contenus.filter(
                content =>
                    toId(
                        content.sous_menu_id
                    ) ===
                    toId(
                        submenu.id
                    )
            );

        for (
            const content of childContents
        ) {

            try {

                await supprimerReferencesSynergie(
                    content.id
                );

            }
            catch (error) {

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

    const childContents =
        contenus.filter(
            item =>
                toId(
                    item.sous_menu_id
                ) ===
                toId(id)
        );

    const childCount =
        childContents.length;

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


    /*
     * Nettoyage des références de synergie
     * avant suppression des contenus.
     */

    for (
        const content of childContents
    ) {

        try {

            await supprimerReferencesSynergie(
                content.id
            );

        }
        catch (error) {

            showMessage(
                "Impossible de supprimer les références de synergie : " +
                error.message,
                "error"
            );

            return;

        }

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


    /*
     * Avant la suppression définitive,
     * on retire ce contenu de toutes les
     * listes de synergies qui le référencent.
     */

    try {

        await supprimerReferencesSynergie(
            id
        );

    }
    catch (error) {

        showMessage(
            "Impossible de nettoyer les synergies : " +
            (
                error?.message ||
                "erreur inconnue"
            ),
            "error"
        );

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
