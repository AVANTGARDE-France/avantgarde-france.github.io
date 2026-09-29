import { supabase } from "./js/supabase.js";


    /* =================================================
       ETAT
    ================================================= */

    let menus = [];
    let sousMenus = [];
    let contenus = [];
    let statistiques = [];

    let selectedType = null;
    let selectedId = null;

    let editorType = null;
    let editorId = null;

    let modalType = null;
    let modalParentId = null;
    let modalEditId = null;

    let isSourceMode = false;

    let currentProfile = null;


    /* =================================================
       ELEMENTS
    ================================================= */

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


    /* =================================================
       MESSAGE
    ================================================= */

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


    /* =================================================
       ESCAPE HTML
    ================================================= */

    function escapeHtml(value) {

        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");

    }


    /* =================================================
       ADMIN
    ================================================= */

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


        connectedUser.textContent =
            profile.nom ||
            profile.email ||
            "";


        return true;

    }


    /* =================================================
       CHARGEMENT DES DONNEES
    ================================================= */

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
                        "id, sous_menu_id, titre, html, position, valide, photo_url, accroche, priorite, stat_1, stat_2, stat_3, synergies"
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


        menus =
            menusResult.data || [];

        sousMenus =
            sousMenusResult.data || [];

        contenus =
            contenusResult.data || [];

        await chargerStatistiques();

        renderTree();

    }


    /* =================================================
       RENDU ARBRE
    ================================================= */

    function renderTree() {

        tree.innerHTML = "";


        if (!menus.length) {

            tree.innerHTML = `

                <div class="empty-tree">
                    Aucun menu.
                    <br><br>
                    Utilisez « + MENU » pour commencer.
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


                menuActions.appendChild(
                    createStatusButton(
                        menu,
                        "menu"
                    )
                );


                menuActions.appendChild(
                    createArrowButton(
                        "↑",
                        menuIndex > 0,
                        () => {

                            deplacerMenu(
                                menuIndex,
                                -1
                            );

                        }
                    )
                );


                menuActions.appendChild(
                    createArrowButton(
                        "↓",
                        menuIndex <
                        menus.length - 1,
                        () => {

                            deplacerMenu(
                                menuIndex,
                                1
                            );

                        }
                    )
                );


                /*
                 * Le crayon de modification du menu
                 * est volontairement supprimé.
                 *
                 * Le nom du menu est directement cliquable.
                 */


                menuActions.appendChild(
                    createIconButton(
                        "+",
                        () => {

                            ouvrirModalCreation(
                                "submenu",
                                menu.id
                            );

                        }
                    )
                );


                menuActions.appendChild(
                    createIconButton(
                        "×",
                        () => {

                            supprimerMenu(
                                menu.id
                            );

                        },
                        true
                    )
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


                const childList =
                    document.createElement(
                        "div"
                    );

                childList.className =
                    "submenu-list";


                const children =
                    sousMenus

                        .filter(
                            item =>
                                item.menu_id ===
                                menu.id
                        )

                        .sort(
                            (a,b) =>
                                Number(a.position) -
                                Number(b.position)
                        );


                children.forEach(
                    (submenu, submenuIndex) => {

                        childList.appendChild(

                            renderSubmenu(
                                submenu,
                                children,
                                submenuIndex
                            )

                        );

                    }
                );


                menuBox.appendChild(
                    childList
                );


                tree.appendChild(
                    menuBox
                );

            }
        );

    }


    function renderSubmenu(
        submenu,
        siblings,
        index
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


        actions.appendChild(
            createStatusButton(
                submenu,
                "submenu"
            )
        );


        actions.appendChild(
            createArrowButton(
                "↑",
                index > 0,
                () => {

                    deplacerSousMenu(
                        submenu,
                        siblings,
                        -1
                    );

                }
            )
        );


        actions.appendChild(
            createArrowButton(
                "↓",
                index <
                siblings.length - 1,
                () => {

                    deplacerSousMenu(
                        submenu,
                        siblings,
                        1
                    );

                }
            )
        );


        /*
         * Le crayon de modification du sous-menu
         * est volontairement supprimé.
         *
         * Le nom du sous-menu est directement cliquable.
         */


        actions.appendChild(
            createIconButton(
                "+",
                () => {

                    ouvrirModalCreation(
                        "content",
                        submenu.id
                    );

                }
            )
        );


        actions.appendChild(
            createIconButton(
                "×",
                () => {

                    supprimerSousMenu(
                        submenu.id
                    );

                },
                true
            )
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


        const children =
            contenus

                .filter(
                    item =>
                        item.sous_menu_id ===
                        submenu.id
                )

                .sort(
                    (a,b) =>
                        Number(a.position) -
                        Number(b.position)
                );


        children.forEach(
            (content, contentIndex) => {

                contentList.appendChild(

                    renderContent(
                        content,
                        children,
                        contentIndex
                    )

                );

            }
        );


        box.appendChild(
            contentList
        );


        return box;

    }


    function renderContent(
        content,
        siblings,
        index
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

        button.innerHTML = `

            <span class="tree-title">
                ${escapeHtml(content.titre)}
            </span>

        `;


        button.addEventListener(
            "click",
            () => {

                ouvrirContenu(
                    content.id
                );

            }
        );


        row.appendChild(
            button
        );


        row.appendChild(
            createStatusButton(
                content,
                "content"
            )
        );


        row.appendChild(
            createArrowButton(
                "↑",
                index > 0,
                () => {

                    deplacerContenu(
                        content,
                        siblings,
                        -1
                    );

                }
            )
        );


        row.appendChild(
            createArrowButton(
                "↓",
                index <
                siblings.length - 1,
                () => {

                    deplacerContenu(
                        content,
                        siblings,
                        1
                    );

                }
            )
        );


        row.appendChild(
            createIconButton(
                "×",
                () => {

                    supprimerContenu(
                        content.id
                    );

                },
                true
            )
        );


        return row;

    }


    /* =================================================
       BOUTONS ARBRE
    ================================================= */

    function createArrowButton(
        text,
        enabled,
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

        button.disabled =
            !enabled;

        button.style.opacity =
            enabled ? "1" : ".25";

        button.addEventListener(
            "click",
            event => {

                event.stopPropagation();

                if (enabled) {

                    callback();

                }

            }
        );

        return button;

    }


    function createIconButton(
        text,
        callback,
        danger = false
    ) {

        const button =
            document.createElement(
                "button"
            );

        button.type =
            "button";

        button.className =
            "icon-button" +
            (
                danger
                    ? " danger"
                    : ""
            );

        button.textContent =
            text;

        button.addEventListener(
            "click",
            event => {

                event.stopPropagation();

                callback();

            }
        );

        return button;

    }


    function createStatusButton(
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
            "status-button " +
            (
                item.valide
                    ? "status-valid"
                    : "status-draft"
            );

        button.textContent =
            item.valide
                ? "VALIDÉ"
                : "BROUILLON";


        button.addEventListener(
            "click",
            event => {

                event.stopPropagation();

                changerValidation(
                    type,
                    item
                );

            }
        );


        return button;

    }


    /* =================================================
       LISTES D'AFFILIATION
    ================================================= */

    function remplirListeMenus(
        select,
        selectedId
    ) {

        select.innerHTML = "";


        menus
            .slice()
            .sort(
                (a,b) =>
                    Number(a.position) -
                    Number(b.position)
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
                        String(selectedId)
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


    function remplirListeSousMenus(
        select,
        selectedId
    ) {

        select.innerHTML = "";


        const sortedMenus =
            menus
                .slice()
                .sort(
                    (a,b) =>
                        Number(a.position) -
                        Number(b.position)
                );


        sortedMenus.forEach(
            menu => {

                const children =
                    sousMenus

                        .filter(
                            submenu =>
                                submenu.menu_id ===
                                menu.id
                        )

                        .sort(
                            (a,b) =>
                                Number(a.position) -
                                Number(b.position)
                        );


                children.forEach(
                    submenu => {

                        const option =
                            document.createElement(
                                "option"
                            );

                        option.value =
                            submenu.id;

                        option.textContent =
                            menu.titre +
                            " → " +
                            submenu.titre;

                        if (
                            String(submenu.id) ===
                            String(selectedId)
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


    /* =================================================
       STATISTIQUES / RECTO
    ================================================= */

    async function chargerStatistiques() {

        try {

            const {
                data,
                error
            } =
                await supabase
                    .from("stats")
                    .select("id, code, nom, actif, position")
                    .eq("actif", true)
                    .order("position", {
                        ascending: true
                    });

            if (error) {
                throw error;
            }

            statistiques =
                data || [];

        }
        catch (error) {

            /*
             * La table stats pourra être créée plus tard
             * dans Paramètres. Son absence ne doit jamais
             * empêcher le CMS de fonctionner.
             */

            console.info(
                "STATISTIQUES : bibliothèque non configurée.",
                error
            );

            statistiques = [];

        }

        remplirListesStatistiques();

    }


    function remplirListesStatistiques() {

        [
            contentStat1,
            contentStat2,
            contentStat3
        ].forEach(select => {

            const currentValue =
                select.value || "";

            select.innerHTML =
                '<option value="">Non configurée</option>';

            statistiques.forEach(stat => {

                const option =
                    document.createElement("option");

                option.value =
                    stat.code || stat.id;

                option.textContent =
                    stat.nom ||
                    stat.code ||
                    stat.id;

                select.appendChild(option);

            });

            if (currentValue) {
                select.value = currentValue;
            }

        });

    }


    function remplirListeSynergies(selectedIds = [], currentId = null) {

        contentSynergies.innerHTML = "";

        contenus
            .slice()
            .sort((a, b) =>
                String(a.titre || "")
                    .localeCompare(
                        String(b.titre || ""),
                        "fr"
                    )
            )
            .forEach(content => {

                if (
                    currentId &&
                    String(content.id) === String(currentId)
                ) {
                    return;
                }

                const option =
                    document.createElement("option");

                option.value =
                    content.id;

                option.textContent =
                    content.titre || "Sans titre";

                if (
                    selectedIds
                        .map(String)
                        .includes(String(content.id))
                ) {
                    option.selected = true;
                }

                contentSynergies.appendChild(option);

            });

    }


    function getSelectedSynergies() {

        return Array.from(
            contentSynergies.selectedOptions
        )
            .map(option => option.value)
            .filter(Boolean);

    }


    function normalizeSynergies(value) {

        if (Array.isArray(value)) {
            return value.filter(Boolean);
        }

        return [];

    }


    /* =================================================
       SELECTION / EDITEUR STRUCTURE
    ================================================= */

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


    document
        .getElementById("structureCancelButton")
        .addEventListener(
            "click",
            () => {

                fermerEditeurs();

            }
        );


    document
        .getElementById("structureSaveButton")
        .addEventListener(
            "click",
            async () => {

                await enregistrerStructure();

            }
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
            selectedType === "menu"
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
            selectedType === "submenu"
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


            /*
             * Si le sous-menu change de menu parent,
             * on le place à la fin du nouveau menu.
             */

            let nouvellePosition =
                Number(submenu.position) || 0;


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


    /* =================================================
       CREATION
    ================================================= */

    function ouvrirModalCreation(
        type,
        parentId
    ) {

        modalType =
            type;

        modalParentId =
            parentId;

        modalEditId =
            null;


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
        .getElementById("addMenuButton")
        .addEventListener(
            "click",
            () => {

                modalType =
                    "menu";

                modalParentId =
                    null;

                modalEditId =
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

        modalEditId =
            null;

    }


    document
        .getElementById("modalCloseButton")
        .addEventListener(
            "click",
            fermerModal
        );


    document
        .getElementById("modalCancelButton")
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
        async () => {

            await creerElement();

        }
    );


    modalName.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Enter"
            ) {

                event.preventDefault();

                creerElement();

            }

        }
    );


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
                modalType === "menu"
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
                            valide: false
                        });


                if (error) {

                    throw error;

                }

            }


            if (
                modalType === "submenu"
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

                            valide: false

                        });


                if (error) {

                    throw error;

                }

            }


            if (
                modalType === "content"
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

                            valide: false,

                            photo_url: null,
                            accroche: null,
                            priorite: null,
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


    function getNextPosition(
        items
    ) {

        if (!items.length) {

            return 0;

        }


        return Math.max(
            ...items.map(
                item =>
                    Number(item.position) || 0
            )
        ) + 1;

    }


    /* =================================================
       CONTENU
    ================================================= */

    function ouvrirContenu(
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

        contentPhoto.value =
            item.photo_url || "";

        contentAccroche.value =
            item.accroche || "";

        contentPriority.value =
            item.priorite || "";

        remplirListesStatistiques();

        contentStat1.value =
            item.stat_1 || "";

        contentStat2.value =
            item.stat_2 || "";

        contentStat3.value =
            item.stat_3 || "";

        remplirListeSynergies(
            normalizeSynergies(item.synergies),
            item.id
        );


        wysiwyg.innerHTML =
            item.html || "";


        sourceEditor.value =
            item.html || "";


        isSourceMode =
            false;

        actualiserModeEditeur();

    }


    document
        .getElementById("contentCancelButton")
        .addEventListener(
            "click",
            () => {

                fermerEditeurs();

            }
        );


    document
        .getElementById("contentSaveButton")
        .addEventListener(
            "click",
            async () => {

                await enregistrerContenu();

            }
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


        if (isSourceMode) {

            wysiwyg.innerHTML =
                sourceEditor.value;

        }


        const html =
            wysiwyg.innerHTML;


        const ancienSousMenuId =
            contenu.sous_menu_id;


        let nouvellePosition =
            Number(contenu.position) || 0;


        /*
         * Si le contenu change de sous-menu,
         * il est placé à la fin du nouveau sous-menu.
         */

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
                        contentPhoto.value.trim() || null,

                    accroche:
                        contentAccroche.value.trim() || null,

                    priorite:
                        contentPriority.value || null,

                    stat_1:
                        contentStat1.value || null,

                    stat_2:
                        contentStat2.value || null,

                    stat_3:
                        contentStat3.value || null,

                    synergies:
                        getSelectedSynergies()

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


    /* =================================================
       WYSIWYG
    ================================================= */

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
        .getElementById("linkButton")
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
        .getElementById("imageButton")
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
        .getElementById("videoButton")
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
        .getElementById("sourceModeButton")
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


    /* =================================================
       VALIDATION
    ================================================= */

    async function changerValidation(
        type,
        item
    ) {

        const nouveauStatut =
            !Boolean(item.valide);


        const table =
            type === "menu"
                ? "menus"
                : type === "submenu"
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
                    item.id
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


    /* =================================================
       ORDRE
    ================================================= */

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


        const first =
            menus[index];

        const second =
            menus[otherIndex];


        await echangerPositions(
            "menus",
            first,
            second
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


    /* =================================================
       SUPPRESSION MENU
    ================================================= */

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


        const childCount =
            children.length;


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

                    childCount ||
                    contentCount

                        ? "\n\nCela supprimera également " +

                          childCount +
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
         * Suppression explicite des descendants.
         *
         * Cela évite de dépendre d'un éventuel
         * ON DELETE CASCADE.
         */


        for (
            const submenu of children
        ) {

            const {
                error:
                    contentError
            } =
                await supabase

                    .from("contenus")

                    .delete()

                    .eq(
                        "sous_menu_id",
                        submenu.id
                    );


            if (contentError) {

                console.error(
                    contentError
                );

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


    /* =================================================
       SUPPRESSION SOUS-MENU
    ================================================= */

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


        const confirmation =
            confirm(

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

            );


        if (!confirmation) {

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


    /* =================================================
       SUPPRESSION CONTENU
    ================================================= */

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


    /* =================================================
       FERMETURE EDITEURS
    ================================================= */

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


    /* =================================================
       RACCOURCI CTRL + S
    ================================================= */

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


    /* =================================================
       INITIALISATION
    ================================================= */

    async function initialiser() {

        try {

            /*
             * Vérification réelle du grade.
             */

            await verifierAdmin();


            /*
             * Puis chargement du contenu.
             */

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


            document
                .getElementById("addMenuButton")
                .disabled =
                true;


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
