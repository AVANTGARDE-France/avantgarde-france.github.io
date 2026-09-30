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
   ÉTAT
========================================================= */

let menus = [];
let sousMenus = [];
let contenus = [];
let stats = [];

let utilisateur = null;
let estAdmin = false;

let modalType = null;
let modalParentId = null;

let structureEditType = null;
let structureEditId = null;

let contenuEditId = null;

let modeSource = false;


/* =========================================================
   DOM — RÉFÉRENCES GÉNÉRALES
========================================================= */

const connectedUser =
    document.getElementById("connectedUser");

const addMenuButton =
    document.getElementById("addMenuButton");

const tree =
    document.getElementById("tree");

const welcome =
    document.getElementById("welcome");

const structureEditor =
    document.getElementById("structureEditor");

const structureTitle =
    document.getElementById("structureTitle");

const structureDescription =
    document.getElementById("structureDescription");

const structureCancelButton =
    document.getElementById("structureCancelButton");

const structureSaveButton =
    document.getElementById("structureSaveButton");

const structureName =
    document.getElementById("structureName");

const structureParentField =
    document.getElementById("structureParentField");

const structureParent =
    document.getElementById("structureParent");

const contentEditor =
    document.getElementById("contentEditor");

const contentEditorTitle =
    document.getElementById("contentEditorTitle");

const sourceModeButton =
    document.getElementById("sourceModeButton");

const contentCancelButton =
    document.getElementById("contentCancelButton");

const contentSaveButton =
    document.getElementById("contentSaveButton");

const contentTitle =
    document.getElementById("contentTitle");

const contentParent =
    document.getElementById("contentParent");

const contentPhoto =
    document.getElementById("contentPhoto");

const contentPriority =
    document.getElementById("contentPriority");

const contentAccroche =
    document.getElementById("contentAccroche");

const contentStat1 =
    document.getElementById("contentStat1");

const contentStat2 =
    document.getElementById("contentStat2");

const contentStat3 =
    document.getElementById("contentStat3");

const contentSynergies =
    document.getElementById("contentSynergies");

const toolbar =
    document.getElementById("toolbar");

const wysiwyg =
    document.getElementById("wysiwyg");

const sourceEditor =
    document.getElementById("sourceEditor");

const linkButton =
    document.getElementById("linkButton");

const imageButton =
    document.getElementById("imageButton");

const videoButton =
    document.getElementById("videoButton");

const message =
    document.getElementById("message");


/* =========================================================
   UTILITAIRES DOM
========================================================= */

function getElement(id) {
    return document.getElementById(id);
}


/* =========================================================
   MESSAGE
========================================================= */

function showMessage(
    text,
    type = "info"
) {

    if (!message) {
        return;
    }

    message.textContent =
        text;

    message.className =
        "message " + type;

    message.style.display =
        "block";

    clearTimeout(
        showMessage.timer
    );

    showMessage.timer =
        setTimeout(
            () => {

                message.style.display =
                    "";

            },
            5000
        );
}


/* =========================================================
   INITIALISATION
========================================================= */

async function initialiser() {

    initialiserEvenementsStructure();

    initialiserEvenementsEditeur();

    initialiserEvenementClavier();

    initialiserApercuImageContenu();

    await verifierAdmin();

    if (!estAdmin) {
        return;
    }

    await chargerDonnees();
}


/* =========================================================
   VÉRIFICATION ADMIN
========================================================= */

async function verifierAdmin() {

    try {

        const {
            data: {
                user
            },
            error: authError
        } =
            await supabase.auth.getUser();

        if (authError) {
            throw authError;
        }

        if (!user) {

            estAdmin =
                false;

            if (connectedUser) {
                connectedUser.textContent =
                    "Non connecté";
            }

            if (addMenuButton) {
                addMenuButton.disabled =
                    true;
            }

            showMessage(
                "Vous devez être connecté pour accéder à cette page.",
                "error"
            );

            return;
        }

        utilisateur =
            user;

        if (connectedUser) {
            connectedUser.textContent =
                user.email || "Administrateur";
        }

        const {
            data: profile,
            error: profileError
        } =
            await supabase
                .from("profiles")
                .select("grade")
                .eq("id", user.id)
                .maybeSingle();

        if (profileError) {
            throw profileError;
        }

        estAdmin =
            Boolean(
                profile &&
                String(profile.grade || "")
                    .trim()
                    .toLowerCase() === "admin"
            );

        if (!estAdmin) {

            if (addMenuButton) {
                addMenuButton.disabled =
                    true;
            }

            showMessage(
                "Accès réservé aux administrateurs.",
                "error"
            );

            return;
        }

        if (addMenuButton) {
            addMenuButton.disabled =
                false;
        }

        if (welcome) {
            welcome.style.display =
                "";
        }

    }
    catch (error) {

        estAdmin =
            false;

        if (addMenuButton) {
            addMenuButton.disabled =
                true;
        }

        showMessage(
            "Erreur lors de la vérification des droits.",
            "error"
        );
    }
}


/* =========================================================
   CHARGEMENT DES DONNÉES
========================================================= */

async function chargerDonnees() {

    try {

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
                    .order("position", {
                        ascending: true
                    }),

                supabase
                    .from("sous_menus")
                    .select("*")
                    .order("position", {
                        ascending: true
                    }),

                supabase
                    .from("contenus")
                    .select("*")
                    .order("position", {
                        ascending: true
                    }),

                supabase
                    .from("stats")
                    .select("*")
                    .order("nom", {
                        ascending: true
                    })

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

        afficherArborescence();

    }
    catch (error) {

        showMessage(
            "Erreur lors du chargement des données.",
            "error"
        );
    }
}


/* =========================================================
   ARBORESCENCE
========================================================= */

function afficherArborescence() {

    if (!tree) {
        return;
    }

    tree.innerHTML =
        "";

    const menusTries =
        [...menus]
            .sort(
                (a, b) =>
                    Number(a.position || 0) -
                    Number(b.position || 0)
            );

    menusTries.forEach(
        menu => {

            const menuElement =
                creerMenuElement(menu);

            tree.appendChild(
                menuElement
            );

        }
    );
}


/* =========================================================
   MENU
========================================================= */

function creerMenuElement(menu) {

    const wrapper =
        document.createElement("div");

    wrapper.className =
        "tree-menu";

    const header =
        document.createElement("div");

    header.className =
        "tree-row menu-row";

    const title =
        document.createElement("span");

    title.className =
        "tree-title";

    title.textContent =
        menu.titre;

    const actions =
        document.createElement("div");

    actions.className =
        "tree-actions";

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

    actions.appendChild(
        creerBouton(
            "↑",
            "Monter",
            () =>
                deplacerMenu(
                    menu.id,
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
                    menu.id,
                    1
                )
        )
    );

    actions.appendChild(
        creerBouton(
            "É",
            "Modifier",
            () =>
                ouvrirEditionStructure(
                    "menu",
                    menu.id
                )
        )
    );

    actions.appendChild(
        creerBouton(
            "X",
            "Supprimer",
            () =>
                supprimerMenu(
                    menu.id
                )
        )
    );

    const validation =
        document.createElement("span");

    validation.className =
        menu.valide
            ? "status valid"
            : "status draft";

    validation.textContent =
        menu.valide
            ? "VALIDÉ"
            : "BROUILLON";

    validation.title =
        "Cliquer pour changer l'état";

    validation.addEventListener(
        "click",
        event => {

            event.preventDefault();
            event.stopPropagation();

            basculerValidation(
                "menu",
                menu.id,
                !menu.valide
            );

        }
    );

    actions.appendChild(
        validation
    );

    header.appendChild(
        title
    );

    header.appendChild(
        actions
    );

    wrapper.appendChild(
        header
    );

    const children =
        document.createElement("div");

    children.className =
        "tree-children";

    const sousMenusDuMenu =
        sousMenus
            .filter(
                sousMenu =>
                    String(sousMenu.menu_id) ===
                    String(menu.id)
            )
            .sort(
                (a, b) =>
                    Number(a.position || 0) -
                    Number(b.position || 0)
            );

    sousMenusDuMenu.forEach(
        sousMenu => {

            children.appendChild(
                creerSousMenuElement(
                    sousMenu
                )
            );

        }
    );

    wrapper.appendChild(
        children
    );

    return wrapper;
}


/* =========================================================
   SOUS-MENU
========================================================= */

function creerSousMenuElement(
    sousMenu
) {

    const wrapper =
        document.createElement("div");

    wrapper.className =
        "tree-submenu";

    const header =
        document.createElement("div");

    header.className =
        "tree-row submenu-row";

    const title =
        document.createElement("span");

    title.className =
        "tree-title";

    title.textContent =
        sousMenu.titre;

    const actions =
        document.createElement("div");

    actions.className =
        "tree-actions";

    actions.appendChild(
        creerBouton(
            "+",
            "Ajouter un contenu",
            () =>
                ouvrirModalCreation(
                    "content",
                    sousMenu.id
                )
        )
    );

    actions.appendChild(
        creerBouton(
            "↑",
            "Monter",
            () =>
                deplacerSousMenu(
                    sousMenu.id,
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
                    sousMenu.id,
                    1
                )
        )
    );

    actions.appendChild(
        creerBouton(
            "É",
            "Modifier",
            () =>
                ouvrirEditionStructure(
                    "submenu",
                    sousMenu.id
                )
        )
    );

    actions.appendChild(
        creerBouton(
            "X",
            "Supprimer",
            () =>
                supprimerSousMenu(
                    sousMenu.id
                )
        )
    );

    const validation =
        document.createElement("span");

    validation.className =
        sousMenu.valide
            ? "status valid"
            : "status draft";

    validation.textContent =
        sousMenu.valide
            ? "VALIDÉ"
            : "BROUILLON";

    validation.title =
        "Cliquer pour changer l'état";

    validation.addEventListener(
        "click",
        event => {

            event.preventDefault();
            event.stopPropagation();

            basculerValidation(
                "submenu",
                sousMenu.id,
                !sousMenu.valide
            );

        }
    );

    actions.appendChild(
        validation
    );

    header.appendChild(
        title
    );

    header.appendChild(
        actions
    );

    wrapper.appendChild(
        header
    );

    const children =
        document.createElement("div");

    children.className =
        "tree-children content-children";

    const contenusDuSousMenu =
        contenus
            .filter(
                contenu =>
                    String(contenu.sous_menu_id) ===
                    String(sousMenu.id)
            )
            .sort(
                (a, b) =>
                    Number(a.position || 0) -
                    Number(b.position || 0)
            );

    contenusDuSousMenu.forEach(
        contenu => {

            children.appendChild(
                creerContenuElement(
                    contenu
                )
            );

        }
    );

    wrapper.appendChild(
        children
    );

    return wrapper;
}


/* =========================================================
   CONTENU
========================================================= */

function creerContenuElement(
    contenu
) {

    const row =
        document.createElement("div");

    row.className =
        "tree-row content-row";

    const title =
        document.createElement("span");

    title.className =
        "tree-title";

    title.textContent =
        contenu.titre || "Sans titre";

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
                    contenu.id,
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
                    contenu.id,
                    1
                )
        )
    );

    actions.appendChild(
        creerBouton(
            "É",
            "Modifier",
            () =>
                ouvrirEditionContenu(
                    contenu.id
                )
        )
    );

    actions.appendChild(
        creerBouton(
            "X",
            "Supprimer",
            () =>
                supprimerContenu(
                    contenu.id
                )
        )
    );

    const validation =
        document.createElement("span");

    validation.className =
        contenu.valide
            ? "status valid"
            : "status draft";

    validation.textContent =
        contenu.valide
            ? "VALIDÉ"
            : "BROUILLON";

    validation.title =
        "Cliquer pour changer l'état";

    validation.addEventListener(
        "click",
        event => {

            event.preventDefault();
            event.stopPropagation();

            basculerValidation(
                "content",
                contenu.id,
                !contenu.valide
            );

        }
    );

    actions.appendChild(
        validation
    );

    row.appendChild(
        title
    );

    row.appendChild(
        actions
    );

    return row;
}


/* =========================================================
   BOUTON
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


/* =========================================================
   MODAL DE CRÉATION
========================================================= */

function ouvrirModalCreation(
    type,
    parentId
) {

    /*
     * IMPORTANT :
     * on récupère le DOM AU MOMENT du clic.
     * Cela évite qu'une référence initialisée trop tôt
     * soit null alors que le modal existe bien dans la page.
     */

    const modal =
        document.getElementById(
            "structureModal"
        );

    const title =
        document.getElementById(
            "modalTitle"
        );

    const name =
        document.getElementById(
            "modalName"
        );

    const saveButton =
        document.getElementById(
            "modalSaveButton"
        );

    if (!modal) {

        showMessage(
            "Erreur : le modal structureModal est introuvable.",
            "error"
        );

        return;
    }

    if (!title) {

        showMessage(
            "Erreur : le titre modalTitle est introuvable.",
            "error"
        );

        return;
    }

    if (!name) {

        showMessage(
            "Erreur : le champ modalName est introuvable.",
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

    if (saveButton) {

        saveButton.textContent =
            "CRÉER";

        saveButton.disabled =
            false;
    }

    /*
     * On garde la classe visible.
     */
    modal.classList.add(
        "visible"
    );

    /*
     * Et on force également l'affichage.
     * Ainsi, même si le CSS de .visible est défaillant,
     * le modal doit apparaître.
     */
    modal.style.display =
        "flex";

    setTimeout(
        () => {

            name.focus();

        },
        50
    );
}


/* =========================================================
   FERMER MODAL
========================================================= */

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
   CRÉATION MENU
========================================================= */

function ouvrirCreationMenu() {

    const modal =
        document.getElementById(
            "structureModal"
        );

    const title =
        document.getElementById(
            "modalTitle"
        );

    const name =
        document.getElementById(
            "modalName"
        );

    const saveButton =
        document.getElementById(
            "modalSaveButton"
        );

    if (!modal || !title || !name) {

        showMessage(
            "Erreur : éléments du modal introuvables.",
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

    if (saveButton) {

        saveButton.textContent =
            "CRÉER";

        saveButton.disabled =
            false;
    }

    modal.classList.add(
        "visible"
    );

    modal.style.display =
        "flex";

    setTimeout(
        () => name.focus(),
        50
    );
}


/* =========================================================
   SAUVEGARDE MODAL
========================================================= */

async function sauvegarderModal() {

    const name =
        document.getElementById(
            "modalName"
        );

    if (!name) {
        return;
    }

    const titre =
        name.value.trim();

    if (!titre) {

        showMessage(
            "Veuillez saisir un nom.",
            "error"
        );

        return;
    }

    if (!modalType) {
        return;
    }

    const saveButton =
        document.getElementById(
            "modalSaveButton"
        );

    if (saveButton) {
        saveButton.disabled =
            true;
    }

    try {

        if (modalType === "menu") {

            const positions =
                menus.map(
                    menu =>
                        Number(
                            menu.position || 0
                        )
                );

            const position =
                positions.length
                    ? Math.max(...positions) + 1
                    : 0;

            const {
                error
            } =
                await supabase
                    .from("menus")
                    .insert({
                        titre,
                        position,
                        valide: false
                    });

            if (error) {
                throw error;
            }
        }

        else if (modalType === "submenu") {

            const positions =
                sousMenus
                    .filter(
                        item =>
                            String(item.menu_id) ===
                            String(modalParentId)
                    )
                    .map(
                        item =>
                            Number(
                                item.position || 0
                            )
                    );

            const position =
                positions.length
                    ? Math.max(...positions) + 1
                    : 0;

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
                        valide: false
                    });

            if (error) {
                throw error;
            }
        }

        else if (modalType === "content") {

            const positions =
                contenus
                    .filter(
                        item =>
                            String(item.sous_menu_id) ===
                            String(modalParentId)
                    )
                    .map(
                        item =>
                            Number(
                                item.position || 0
                            )
                    );

            const position =
                positions.length
                    ? Math.max(...positions) + 1
                    : 0;

            const {
                error
            } =
                await supabase
                    .from("contenus")
                    .insert({
                        sous_menu_id:
                            modalParentId,
                        titre,
                        position,
                        valide: false,
                        html: "",
                        photo_url: "",
                        accroche: "",
                        priorite: false,
                        stat_1: null,
                        stat_2: null,
                        stat_3: null,
                        synergies: []
                    });

            if (error) {
                throw error;
            }
        }

        fermerModal();

        await chargerDonnees();

        showMessage(
            "Création effectuée.",
            "success"
        );

    }
    catch (error) {

        if (saveButton) {
            saveButton.disabled =
                false;
        }

        showMessage(
            "Erreur lors de la création.",
            "error"
        );
    }
}


/* =========================================================
   ÉDITION STRUCTURE
========================================================= */

function ouvrirEditionStructure(
    type,
    id
) {

    structureEditType =
        type;

    structureEditId =
        id;

    const item =
        type === "menu"
            ? menus.find(
                menu =>
                    String(menu.id) ===
                    String(id)
            )
            : sousMenus.find(
                sousMenu =>
                    String(sousMenu.id) ===
                    String(id)
            );

    if (!item) {
        return;
    }

    if (structureEditor) {
        structureEditor.style.display =
            "block";
    }

    if (contentEditor) {
        contentEditor.style.display =
            "none";
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
                ? "Modifier le nom du menu."
                : "Modifier le nom du sous-menu.";

    }

    if (structureName) {
        structureName.value =
            item.titre || "";
    }

    if (structureParentField) {

        structureParentField.style.display =
            type === "submenu"
                ? ""
                : "none";

    }

    if (
        type === "submenu" &&
        structureParent
    ) {

        structureParent.innerHTML =
            "";

        menus
            .sort(
                (a, b) =>
                    Number(a.position || 0) -
                    Number(b.position || 0)
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

                    if (
                        String(menu.id) ===
                        String(item.menu_id)
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
}


/* =========================================================
   SAUVEGARDE STRUCTURE
========================================================= */

async function sauvegarderStructure() {

    if (
        !structureEditType ||
        !structureEditId
    ) {
        return;
    }

    const titre =
        structureName
            ? structureName.value.trim()
            : "";

    if (!titre) {

        showMessage(
            "Le nom ne peut pas être vide.",
            "error"
        );

        return;
    }

    if (structureSaveButton) {
        structureSaveButton.disabled =
            true;
    }

    try {

        if (
            structureEditType ===
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
                        structureEditId
                    );

            if (error) {
                throw error;
            }
        }

        else {

            const update =
                {
                    titre
                };

            if (structureParent) {

                update.menu_id =
                    structureParent.value;

            }

            const {
                error
            } =
                await supabase
                    .from("sous_menus")
                    .update(
                        update
                    )
                    .eq(
                        "id",
                        structureEditId
                    );

            if (error) {
                throw error;
            }
        }

        fermerEditeurStructure();

        await chargerDonnees();

        showMessage(
            "Modification enregistrée.",
            "success"
        );

    }
    catch (error) {

        showMessage(
            "Erreur lors de la modification.",
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
   FERMER ÉDITEUR STRUCTURE
========================================================= */

function fermerEditeurStructure() {

    if (structureEditor) {

        structureEditor.style.display =
            "none";
    }

    structureEditType =
        null;

    structureEditId =
        null;
}


/* =========================================================
   OUVRIR ÉDITEUR CONTENU
========================================================= */

function ouvrirEditionContenu(
    id
) {

    const contenu =
        contenus.find(
            item =>
                String(item.id) ===
                String(id)
        );

    if (!contenu) {
        return;
    }

    contenuEditId =
        id;

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
            contenu.titre || "";
    }

    if (contentPhoto) {
        contentPhoto.value =
            contenu.photo_url || "";
    }

    if (contentPriority) {
        contentPriority.checked =
            Boolean(contenu.priorite);
    }

    if (contentAccroche) {
        contentAccroche.value =
            contenu.accroche || "";
    }

    remplirParentContenu(
        contenu.sous_menu_id
    );

    remplirStats(
        contenu
    );

    remplirSynergies(
        contenu
    );

    const html =
        contenu.html || "";

    if (wysiwyg) {
        wysiwyg.innerHTML =
            html;
    }

    if (sourceEditor) {
        sourceEditor.value =
            html;
    }

    modeSource =
        false;

    actualiserModeEditeur();

    afficherApercuImage();
}


/* =========================================================
   PARENT CONTENU
========================================================= */

function remplirParentContenu(
    selectedId
) {

    if (!contentParent) {
        return;
    }

    contentParent.innerHTML =
        "";

    const groupes =
        menus
            .sort(
                (a, b) =>
                    Number(a.position || 0) -
                    Number(b.position || 0)
            );

    groupes.forEach(
        menu => {

            const sousMenusMenu =
                sousMenus
                    .filter(
                        sousMenu =>
                            String(
                                sousMenu.menu_id
                            ) ===
                            String(menu.id)
                    )
                    .sort(
                        (a, b) =>
                            Number(
                                a.position || 0
                            ) -
                            Number(
                                b.position || 0
                            )
                    );

            sousMenusMenu.forEach(
                sousMenu => {

                    const option =
                        document.createElement(
                            "option"
                        );

                    option.value =
                        sousMenu.id;

                    option.textContent =
                        menu.titre +
                        " / " +
                        sousMenu.titre;

                    if (
                        String(sousMenu.id) ===
                        String(selectedId)
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
    );
}


/* =========================================================
   STATS
========================================================= */

function remplirStats(
    contenu
) {

    const selects =
        [
            contentStat1,
            contentStat2,
            contentStat3
        ];

    const selected =
        [
            contenu.stat_1,
            contenu.stat_2,
            contenu.stat_3
        ];

    selects.forEach(
        (select, index) => {

            if (!select) {
                return;
            }

            select.innerHTML =
                '<option value="">Aucune</option>';

            stats.forEach(
                stat => {

                    const option =
                        document.createElement(
                            "option"
                        );

                    option.value =
                        stat.id;

                    option.textContent =
                        stat.nom;

                    if (
                        String(stat.id) ===
                        String(selected[index])
                    ) {

                        option.selected =
                            true;
                    }

                    select.appendChild(
                        option
                    );

                }
            );

        }
    );
}


/* =========================================================
   SYNERGIES
========================================================= */

function remplirSynergies(
    contenu
) {

    if (!contentSynergies) {
        return;
    }

    contentSynergies.innerHTML =
        "";

    let selected =
        Array.isArray(
            contenu.synergies
        )
            ? contenu.synergies
            : [];

    contenus
        .filter(
            item =>
                String(item.id) !==
                String(contenu.id)
        )
        .sort(
            (a, b) =>
                String(a.titre || "")
                    .localeCompare(
                        String(b.titre || ""),
                        "fr"
                    )
        )
        .forEach(
            item => {

                const option =
                    document.createElement(
                        "option"
                    );

                option.value =
                    item.id;

                option.textContent =
                    item.titre ||
                    "Sans titre";

                if (
                    selected.some(
                        value =>
                            String(value) ===
                            String(item.id)
                    )
                ) {

                    option.selected =
                        true;
                }

                contentSynergies.appendChild(
                    option
                );

            }
        );
}


/* =========================================================
   SAUVEGARDE CONTENU
========================================================= */

async function sauvegarderContenu() {

    if (!contenuEditId) {
        return;
    }

    const titre =
        contentTitle
            ? contentTitle.value.trim()
            : "";

    if (!titre) {

        showMessage(
            "Le titre du contenu est obligatoire.",
            "error"
        );

        return;
    }

    const html =
        modeSource
            ? (
                sourceEditor
                    ? sourceEditor.value
                    : ""
            )
            : (
                wysiwyg
                    ? wysiwyg.innerHTML
                    : ""
            );

    const synergies =
        contentSynergies
            ? Array.from(
                contentSynergies.selectedOptions
            ).map(
                option =>
                    option.value
            )
            : [];

    const update =
        {
            titre,
            sous_menu_id:
                contentParent
                    ? contentParent.value || null
                    : null,
            html,
            photo_url:
                contentPhoto
                    ? contentPhoto.value.trim()
                    : "",
            priorite:
                contentPriority
                    ? Boolean(
                        contentPriority.checked
                    )
                    : false,
            accroche:
                contentAccroche
                    ? contentAccroche.value
                    : "",
            stat_1:
                contentStat1
                    ? contentStat1.value || null
                    : null,
            stat_2:
                contentStat2
                    ? contentStat2.value || null
                    : null,
            stat_3:
                contentStat3
                    ? contentStat3.value || null
                    : null,
            synergies
        };

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
                .update(update)
                .eq(
                    "id",
                    contenuEditId
                );

        if (error) {
            throw error;
        }

        fermerEditeurContenu();

        await chargerDonnees();

        showMessage(
            "Contenu enregistré.",
            "success"
        );

    }
    catch (error) {

        showMessage(
            "Erreur lors de l'enregistrement du contenu.",
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
   FERMER ÉDITEUR CONTENU
========================================================= */

function fermerEditeurContenu() {

    if (contentEditor) {

        contentEditor.style.display =
            "none";
    }

    contenuEditId =
        null;
}


/* =========================================================
   VALIDATION
========================================================= */

async function basculerValidation(
    type,
    id,
    valeur
) {

    let table;

    if (type === "menu") {
        table = "menus";
    }

    else if (type === "submenu") {
        table = "sous_menus";
    }

    else {
        table = "contenus";
    }

    try {

        const {
            error
        } =
            await supabase
                .from(table)
                .update({
                    valide: valeur
                })
                .eq(
                    "id",
                    id
                );

        if (error) {
            throw error;
        }

        await chargerDonnees();

    }
    catch (error) {

        showMessage(
            "Erreur lors de la modification de l'état.",
            "error"
        );

    }
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
                String(item.id) ===
                String(id)
        );

    if (!menu) {
        return;
    }

    if (
        !confirm(
            `Supprimer le menu « ${menu.titre} » et ses éléments ?`
        )
    ) {
        return;
    }

    try {

        const sousMenusASupprimer =
            sousMenus.filter(
                item =>
                    String(item.menu_id) ===
                    String(id)
            );

        for (
            const sousMenu
            of sousMenusASupprimer
        ) {

            await supabase
                .from("contenus")
                .delete()
                .eq(
                    "sous_menu_id",
                    sousMenu.id
                );

        }

        const {
            error: sousMenuError
        } =
            await supabase
                .from("sous_menus")
                .delete()
                .eq(
                    "menu_id",
                    id
                );

        if (sousMenuError) {
            throw sousMenuError;
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
            throw error;
        }

        await chargerDonnees();

        showMessage(
            "Menu supprimé.",
            "success"
        );

    }
    catch (error) {

        showMessage(
            "Erreur lors de la suppression du menu.",
            "error"
        );

    }
}


/* =========================================================
   SUPPRESSION SOUS-MENU
========================================================= */

async function supprimerSousMenu(
    id
) {

    const sousMenu =
        sousMenus.find(
            item =>
                String(item.id) ===
                String(id)
        );

    if (!sousMenu) {
        return;
    }

    if (
        !confirm(
            `Supprimer le sous-menu « ${sousMenu.titre} » et ses contenus ?`
        )
    ) {
        return;
    }

    try {

        const {
            error: contenuError
        } =
            await supabase
                .from("contenus")
                .delete()
                .eq(
                    "sous_menu_id",
                    id
                );

        if (contenuError) {
            throw contenuError;
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
            throw error;
        }

        await chargerDonnees();

        showMessage(
            "Sous-menu supprimé.",
            "success"
        );

    }
    catch (error) {

        showMessage(
            "Erreur lors de la suppression du sous-menu.",
            "error"
        );

    }
}


/* =========================================================
   SUPPRESSION CONTENU
========================================================= */

async function supprimerContenu(
    id
) {

    const contenu =
        contenus.find(
            item =>
                String(item.id) ===
                String(id)
        );

    if (!contenu) {
        return;
    }

    if (
        !confirm(
            `Supprimer le contenu « ${contenu.titre} » ?`
        )
    ) {
        return;
    }

    try {

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

        await chargerDonnees();

        showMessage(
            "Contenu supprimé.",
            "success"
        );

    }
    catch (error) {

        showMessage(
            "Erreur lors de la suppression du contenu.",
            "error"
        );

    }
}


/* =========================================================
   DÉPLACEMENT MENU
========================================================= */

async function deplacerMenu(
    id,
    direction
) {

    const element =
        menus.find(
            item =>
                String(item.id) ===
                String(id)
        );

    if (!element) {
        return;
    }

    const liste =
        menus
            .filter(
                item =>
                    String(item.id) !==
                    String(id)
            )
            .sort(
                (a, b) =>
                    Number(a.position || 0) -
                    Number(b.position || 0)
            );

    const index =
        liste.findIndex(
            item =>
                Number(item.position || 0) >
                Number(element.position || 0)
        );

    let targetIndex;

    if (direction < 0) {

        targetIndex =
            liste
                .map(
                    item =>
                        Number(
                            item.position || 0
                        )
                )
                .filter(
                    position =>
                        position <
                        Number(
                            element.position || 0
                        )
                )
                .length - 1;

    }
    else {

        targetIndex =
            liste
                .map(
                    item =>
                        Number(
                            item.position || 0
                        )
                )
                .filter(
                    position =>
                        position >
                        Number(
                            element.position || 0
                        )
                )
                .length;

    }

    if (
        targetIndex < 0 ||
        targetIndex >= liste.length
    ) {

        return;
    }

    const target =
        liste[targetIndex];

    await echangerPositions(
        "menus",
        element,
        target
    );
}


/* =========================================================
   DÉPLACEMENT SOUS-MENU
========================================================= */

async function deplacerSousMenu(
    id,
    direction
) {

    const element =
        sousMenus.find(
            item =>
                String(item.id) ===
                String(id)
        );

    if (!element) {
        return;
    }

    const liste =
        sousMenus
            .filter(
                item =>
                    String(item.menu_id) ===
                    String(element.menu_id) &&
                    String(item.id) !==
                    String(id)
            )
            .sort(
                (a, b) =>
                    Number(a.position || 0) -
                    Number(b.position || 0)
            );

    const position =
        Number(
            element.position || 0
        );

    const candidats =
        direction < 0
            ? liste.filter(
                item =>
                    Number(
                        item.position || 0
                    ) < position
            )
            : liste.filter(
                item =>
                    Number(
                        item.position || 0
                    ) > position
            );

    if (!candidats.length) {
        return;
    }

    const target =
        direction < 0
            ? candidats[candidats.length - 1]
            : candidats[0];

    await echangerPositions(
        "sous_menus",
        element,
        target
    );
}


/* =========================================================
   DÉPLACEMENT CONTENU
========================================================= */

async function deplacerContenu(
    id,
    direction
) {

    const element =
        contenus.find(
            item =>
                String(item.id) ===
                String(id)
        );

    if (!element) {
        return;
    }

    const position =
        Number(
            element.position || 0
        );

    const liste =
        contenus
            .filter(
                item =>
                    String(item.sous_menu_id) ===
                    String(element.sous_menu_id) &&
                    String(item.id) !==
                    String(id)
            )
            .sort(
                (a, b) =>
                    Number(a.position || 0) -
                    Number(b.position || 0)
            );

    const candidats =
        direction < 0
            ? liste.filter(
                item =>
                    Number(
                        item.position || 0
                    ) < position
            )
            : liste.filter(
                item =>
                    Number(
                        item.position || 0
                    ) > position
            );

    if (!candidats.length) {
        return;
    }

    const target =
        direction < 0
            ? candidats[candidats.length - 1]
            : candidats[0];

    await echangerPositions(
        "contenus",
        element,
        target
    );
}


/* =========================================================
   ÉCHANGE POSITIONS
========================================================= */

async function echangerPositions(
    table,
    a,
    b
) {

    const positionA =
        Number(a.position || 0);

    const positionB =
        Number(b.position || 0);

    try {

        const first =
            await supabase
                .from(table)
                .update({
                    position:
                        positionB
                })
                .eq(
                    "id",
                    a.id
                );

        if (first.error) {
            throw first.error;
        }

        const second =
            await supabase
                .from(table)
                .update({
                    position:
                        positionA
                })
                .eq(
                    "id",
                    b.id
                );

        if (second.error) {
            throw second.error;
        }

        await chargerDonnees();

    }
    catch (error) {

        showMessage(
            "Erreur lors du déplacement.",
            "error"
        );

    }
}


/* =========================================================
   ÉDITEUR WYSIWYG
========================================================= */

function actualiserModeEditeur() {

    if (wysiwyg) {

        wysiwyg.style.display =
            modeSource
                ? "none"
                : "";

    }

    if (sourceEditor) {

        sourceEditor.style.display =
            modeSource
                ? ""
                : "none";

    }

    if (sourceModeButton) {

        sourceModeButton.textContent =
            modeSource
                ? "MODE VISUEL"
                : "MODE SOURCE";

    }

    if (
        !modeSource &&
        wysiwyg &&
        sourceEditor
    ) {

        sourceEditor.value =
            wysiwyg.innerHTML;

    }

    if (
        modeSource &&
        wysiwyg &&
        sourceEditor
    ) {

        sourceEditor.value =
            wysiwyg.innerHTML;

    }
}


/* =========================================================
   COMMANDES ÉDITEUR
========================================================= */

function executerCommande(
    commande,
    valeur = null
) {

    if (modeSource) {
        return;
    }

    if (!wysiwyg) {
        return;
    }

    wysiwyg.focus();

    document.execCommand(
        commande,
        false,
        valeur
    );
}


/* =========================================================
   LIEN
========================================================= */

function insererLien() {

    const url =
        prompt(
            "URL du lien :"
        );

    if (!url) {
        return;
    }

    executerCommande(
        "createLink",
        url
    );
}


/* =========================================================
   IMAGE
========================================================= */

function insererImage() {

    const url =
        prompt(
            "URL de l'image :"
        );

    if (!url) {
        return;
    }

    executerCommande(
        "insertImage",
        url
    );
}


/* =========================================================
   VIDÉO
========================================================= */

function insererVideo() {

    const url =
        prompt(
            "URL de la vidéo :"
        );

    if (!url) {
        return;
    }

    if (!wysiwyg) {
        return;
    }

    const iframe =
        `<iframe src="${url}" ` +
        `frameborder="0" ` +
        `allowfullscreen></iframe>`;

    if (modeSource) {

        if (sourceEditor) {

            sourceEditor.value +=
                iframe;

        }

        return;
    }

    wysiwyg.focus();

    document.execCommand(
        "insertHTML",
        false,
        iframe
    );
}


/* =========================================================
   APERÇU IMAGE
========================================================= */

function initialiserApercuImageContenu() {

    if (!contentPhoto) {
        return;
    }

    contentPhoto.addEventListener(
        "input",
        afficherApercuImage
    );
}


function afficherApercuImage() {

    const preview =
        document.getElementById(
            "contentPhotoPreview"
        );

    if (!preview) {
        return;
    }

    const url =
        contentPhoto
            ? contentPhoto.value.trim()
            : "";

    if (!url) {

        preview.style.display =
            "none";

        preview.removeAttribute(
            "src"
        );

        return;
    }

    preview.src =
        url;

    preview.style.display =
        "";

}


/* =========================================================
   ÉVÉNEMENTS STRUCTURE
========================================================= */

function initialiserEvenementsStructure() {

    if (addMenuButton) {

        addMenuButton.addEventListener(
            "click",
            event => {

                event.preventDefault();

                event.stopPropagation();

                ouvrirCreationMenu();

            }
        );
    }


    /*
     * Boutons du modal.
     */

    const modalSaveButton =
        document.getElementById(
            "modalSaveButton"
        );

    const modalCloseButton =
        document.getElementById(
            "modalCloseButton"
        );

    const modalCancelButton =
        document.getElementById(
            "modalCancelButton"
        );


    if (modalSaveButton) {

        modalSaveButton.addEventListener(
            "click",
            event => {

                event.preventDefault();

                sauvegarderModal();

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


    /*
     * Éditeur structure.
     */

    if (structureCancelButton) {

        structureCancelButton.addEventListener(
            "click",
            event => {

                event.preventDefault();

                fermerEditeurStructure();

            }
        );

    }


    if (structureSaveButton) {

        structureSaveButton.addEventListener(
            "click",
            event => {

                event.preventDefault();

                sauvegarderStructure();

            }
        );

    }


    /*
     * Fermer le modal en cliquant sur
     * l'arrière-plan.
     */

    const modal =
        document.getElementById(
            "structureModal"
        );

    if (modal) {

        modal.addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    modal
                ) {

                    fermerModal();

                }

            }
        );

    }

}


/* =========================================================
   ÉVÉNEMENTS ÉDITEUR
========================================================= */

function initialiserEvenementsEditeur() {

    if (sourceModeButton) {

        sourceModeButton.addEventListener(
            "click",
            event => {

                event.preventDefault();

                if (!modeSource) {

                    if (
                        wysiwyg &&
                        sourceEditor
                    ) {

                        sourceEditor.value =
                            wysiwyg.innerHTML;

                    }

                }
                else {

                    if (
                        wysiwyg &&
                        sourceEditor
                    ) {

                        wysiwyg.innerHTML =
                            sourceEditor.value;

                    }

                }

                modeSource =
                    !modeSource;

                actualiserModeEditeur();

            }
        );

    }


    if (contentCancelButton) {

        contentCancelButton.addEventListener(
            "click",
            event => {

                event.preventDefault();

                fermerEditeurContenu();

            }
        );

    }


    if (contentSaveButton) {

        contentSaveButton.addEventListener(
            "click",
            event => {

                event.preventDefault();

                sauvegarderContenu();

            }
        );

    }


    if (linkButton) {

        linkButton.addEventListener(
            "click",
            event => {

                event.preventDefault();

                insererLien();

            }
        );

    }


    if (imageButton) {

        imageButton.addEventListener(
            "click",
            event => {

                event.preventDefault();

                insererImage();

            }
        );

    }


    if (videoButton) {

        videoButton.addEventListener(
            "click",
            event => {

                event.preventDefault();

                insererVideo();

            }
        );

    }


    if (toolbar) {

        toolbar.addEventListener(
            "click",
            event => {

                const button =
                    event.target.closest(
                        "[data-command]"
                    );

                if (!button) {
                    return;
                }

                event.preventDefault();

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


    if (wysiwyg) {

        wysiwyg.addEventListener(
            "input",
            () => {

                if (
                    modeSource &&
                    sourceEditor
                ) {

                    sourceEditor.value =
                        wysiwyg.innerHTML;

                }

            }
        );

    }

}


/* =========================================================
   CLAVIER
========================================================= */

function initialiserEvenementClavier() {

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
                    contenuEditId &&
                    contentEditor &&
                    contentEditor.style.display !==
                        "none"
                ) {

                    sauvegarderContenu();

                    return;
                }

                if (
                    structureEditId &&
                    structureEditor &&
                    structureEditor.style.display !==
                        "none"
                ) {

                    sauvegarderStructure();

                }

            }

            if (
                event.key ===
                "Escape"
            ) {

                const modal =
                    document.getElementById(
                        "structureModal"
                    );

                if (
                    modal &&
                    modal.classList.contains(
                        "visible"
                    )
                ) {

                    fermerModal();

                }

            }

        }
    );

}


/* =========================================================
   LANCEMENT
========================================================= */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initialiser,
        {
            once: true
        }
    );

}
else {

    initialiser();

}
