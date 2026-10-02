/* =========================================================
   AVANT-GARDE — ADMIN AUTH

   js/admin-auth.js

   Gestion de l'authentification de l'espace membre :

   - Connexion
   - Vérification de la session
   - Chargement du profil connecté
   - Affichage connexion / espace membre
   - Déconnexion
   - Actions HOME / DECONNEXION
   - Finalisation de l'onglet demandé

   IMPORTANT :

   L'authentification est prioritaire sur la navigation
   des onglets.

   Tant que le profil n'est pas chargé :

       window.adminAuthReady = false

   Une fois le profil chargé :

       window.adminAuthReady = true

   admin-tabs.js peut alors afficher l'onglet demandé
   dans ?tab=...

========================================================= */


/* =========================================================
   SUPABASE
========================================================= */

import {
    supabase
} from "./supabase.js";


/* =========================================================
   ETAT INITIAL
========================================================= */

/*
 * L'authentification commence toujours comme "non prête".
 *
 * C'est essentiel pour éviter que admin-tabs.js
 * interprète currentProfile === null comme
 * "l'utilisateur n'a pas les droits".
 */

window.adminAuthReady =
    false;


/*
 * Compatibilité avec admin-core.js.
 */

window.currentUser =
    window.currentUser ||
    null;

window.currentProfile =
    window.currentProfile ||
    null;


/* =========================================================
   ELEMENTS
========================================================= */

/*
 * Les éléments DOM sont récupérés après chargement
 * du DOM dans initialiserAuthentification().
 *
 * Cela évite les références null si admin.js est chargé
 * dans le <head>.
 */

let loginScreen =
    null;

let adminScreen =
    null;

let loginForm =
    null;

let loginButton =
    null;

let loginMessage =
    null;


/* =========================================================
   RECUPERATION DES ELEMENTS
========================================================= */

function recupererElementsAuth() {

    loginScreen =
        document.getElementById(
            "loginScreen"
        );

    adminScreen =
        document.getElementById(
            "adminScreen"
        );

    loginForm =
        document.getElementById(
            "loginForm"
        );

    loginButton =
        document.getElementById(
            "loginButton"
        );

    loginMessage =
        document.getElementById(
            "loginMessage"
        );
}


/* =========================================================
   MESSAGES
========================================================= */

function afficherMessage(
    element,
    type,
    texte
) {

    if (!element) {
        return;
    }

    element.className =
        "message " +
        type;

    element.textContent =
        texte;
}


function viderMessage(
    element
) {

    if (!element) {
        return;
    }

    element.className =
        "message";

    element.textContent =
        "";
}


/* =========================================================
   AFFICHAGE CONNEXION
========================================================= */

function afficherConnexion() {

    /*
     * L'utilisateur n'est plus considéré
     * comme authentifié.
     */

    window.adminAuthReady =
        true;


    if (loginScreen) {

        loginScreen.style.display =
            "block";
    }


    if (adminScreen) {

        adminScreen.style.display =
            "none";
    }


    if (loginButton) {

        loginButton.disabled =
            false;

        loginButton.textContent =
            "CONNEXION";
    }


    if (loginForm) {

        loginForm.reset();
    }


    viderMessage(
        loginMessage
    );


    /*
     * Si une session n'existe pas,
     * aucune activation d'onglet membre
     * ne doit être effectuée.
     */
}


/* =========================================================
   AFFICHAGE ESPACE MEMBRE
========================================================= */

function afficherAdmin() {

    if (loginScreen) {

        loginScreen.style.display =
            "none";
    }


    if (adminScreen) {

        adminScreen.style.display =
            "block";
    }


    const adminUser =
        document.getElementById(
            "adminUser"
        );


    if (adminUser) {

        const nom =
            window.currentProfile?.nom ||
            window.currentUser?.email ||
            "";

        adminUser.textContent =
            "Connecté en tant que " +
            nom;
    }


    ajouterActionsHeader();
}


/* =========================================================
   HEADER ESPACE MEMBRE
========================================================= */

function ajouterActionsHeader() {

    let actions =
        document.getElementById(
            "memberHeaderActions"
        );


    /*
     * Déjà présent :
     * aucune duplication.
     */

    if (actions) {
        return;
    }


    const header =
        document.createElement(
            "div"
        );


    header.id =
        "memberHeaderActions";

    header.className =
        "header-actions";


    header.innerHTML = `
        <a
            href="index.html"
            class="header-button"
        >
            HOME
        </a>

        <button
            type="button"
            class="header-button logout-button"
            id="logoutButton"
        >
            SE DÉCONNECTER
        </button>
    `;


    const adminHeader =
        document.querySelector(
            ".admin-header"
        );


    if (!adminHeader) {
        return;
    }


    adminHeader.insertBefore(
        header,
        adminHeader.firstChild
    );


    const logoutButton =
        document.getElementById(
            "logoutButton"
        );


    if (logoutButton) {

        logoutButton.addEventListener(
            "click",
            deconnecter
        );
    }
}


/* =========================================================
   DECONNEXION
========================================================= */

async function deconnecter() {

    const button =
        document.getElementById(
            "logoutButton"
        );


    if (button) {

        button.disabled =
            true;

        button.textContent =
            "DÉCONNEXION…";
    }


    const {
        error
    } =
        await supabase.auth.signOut();


    if (error) {

        console.error(
            "Erreur déconnexion :",
            error
        );


        if (button) {

            button.disabled =
                false;

            button.textContent =
                "SE DÉCONNECTER";
        }

        return;
    }


    /*
     * Réinitialisation de l'état.
     */

    window.currentUser =
        null;

    window.currentProfile =
        null;

    window.adminAuthReady =
        true;


    if (
        typeof window.reinitialiserEtatAdmin ===
        "function"
    ) {

        window.reinitialiserEtatAdmin();
    }


    /*
     * Suppression des actions du header.
     */

    const actions =
        document.getElementById(
            "memberHeaderActions"
        );


    if (actions) {

        actions.remove();
    }


    afficherConnexion();
}


/* =========================================================
   ONGLET DEMANDÉ
========================================================= */

function obtenirOngletDemandeApresAuth() {

    /*
     * On utilise la fonction du module tabs
     * lorsqu'elle est disponible.
     */

    if (
        typeof window.obtenirOngletDepuisURL ===
        "function"
    ) {

        return window.obtenirOngletDepuisURL();
    }


    /*
     * Sécurité / compatibilité :
     * lecture directe de ?tab=...
     */

    const params =
        new URLSearchParams(
            window.location.search
        );


    const tab =
        params.get(
            "tab"
        );


    const autorises = [
        "profileTab",
        "rdvTab",
        "teamTab",
        "roleTab",
        "contentProjectTab",
        "contentOtherTab",
        "statsTab"
    ];


    if (
        tab &&
        autorises.includes(
            tab
        )
    ) {

        return tab;
    }


    return "profileTab";
}


/* =========================================================
   VERIFICATION DROITS ONGLET
========================================================= */

function utilisateurPeutAccederOnglet(
    cible
) {

    /*
     * PROFIL
     */

    if (
        cible ===
        "profileTab"
    ) {

        return true;
    }


    /*
     * RDV
     */

    if (
        cible ===
        "rdvTab"
    ) {

        if (
            typeof window.peutGererRendezVous ===
            "function"
        ) {

            return window.peutGererRendezVous();
        }

        return false;
    }


    /*
     * ROLE
     */

    if (
        cible ===
        "roleTab"
    ) {

        if (
            typeof window.peutGererRole ===
            "function"
        ) {

            return window.peutGererRole();
        }

        return false;
    }


    /*
     * EQUIPES
     *
     * Même logique que admin-core.js.
     */

    if (
        cible ===
        "teamTab"
    ) {

        const profile =
            window.currentProfile;


        if (!profile) {
            return false;
        }


        return !!(
            profile.grade ===
                "admin"
            ||
            profile.grade2 ===
                "Architecte du Projet"
            ||
            profile.grade2 ===
                "Délégué National"
            ||
            profile.grade2 ===
                "Délégué Régional"
        );
    }


    /*
     * CONTENU PROJET
     */

    if (
        cible ===
        "contentProjectTab"
    ) {

        return (
            window.currentProfile?.grade ===
            "admin"
        );
    }


    /*
     * AUTRES CONTENUS
     */

    if (
        cible ===
            "contentOtherTab"
        ||
        cible ===
            "statsTab"
    ) {

        return true;
    }


    return false;
}


/* =========================================================
   FINALISATION DE L'ONGLET
========================================================= */

function finaliserOngletApresAuthentification() {

    /*
     * L'utilisateur n'est pas connecté :
     * aucun onglet membre à ouvrir.
     */

    if (
        !window.currentUser
        ||
        !window.currentProfile
    ) {

        return;
    }


    const cible =
        obtenirOngletDemandeApresAuth();


    const autorise =
        utilisateurPeutAccederOnglet(
            cible
        );


    /*
     * Onglet interdit :
     * retour au profil.
     */

    if (
        !autorise
    ) {

        if (
            typeof window.activerOngletAdmin ===
            "function"
        ) {

            window.activerOngletAdmin(
                "profileTab"
            );
        }


        try {

            const url =
                new URL(
                    window.location.href
                );

            url.searchParams.set(
                "tab",
                "profileTab"
            );

            window.history.replaceState(
                {},
                "",
                url.toString()
            );

        } catch (
            error
        ) {

            console.error(
                "Erreur URL onglet :",
                error
            );
        }


        return;
    }


    /*
     * Onglet autorisé :
     * activation finale.
     */

    if (
        typeof window.activerOngletAdmin ===
        "function"
    ) {

        window.activerOngletAdmin(
            cible
        );
    }


    /*
     * On demande également à admin-tabs.js
     * de réappliquer son initialisation.
     *
     * Cela ne provoque pas de problème :
     * l'onglet demandé est maintenant autorisé
     * et currentProfile est disponible.
     */

    if (
        typeof window.initialiserOngletsAdmin ===
        "function"
    ) {

        window.initialiserOngletsAdmin();
    }
}


/* =========================================================
   VERIFICATION UTILISATEUR
========================================================= */

async function verifierUtilisateur() {

    /*
     * Pendant toute la requête :
     *
     * adminAuthReady = false
     *
     * admin-tabs.js ne doit donc pas choisir
     * profileTab à cause d'un profil encore absent.
     */

    window.adminAuthReady =
        false;


    try {

        const {
            data: {
                user
            }
        } =
            await supabase.auth.getUser();


        /* =================================================
           AUCUN UTILISATEUR
        ================================================= */

        if (!user) {

            window.currentUser =
                null;

            window.currentProfile =
                null;


            if (
                typeof window.reinitialiserEtatAdmin ===
                "function"
            ) {

                window.reinitialiserEtatAdmin();
            }


            afficherConnexion();

            return;
        }


        /* =================================================
           UTILISATEUR TROUVÉ
        ================================================= */

        window.currentUser =
            user;


        /* =================================================
           CHARGEMENT PROFIL
        ================================================= */

        const {
            data: profile,
            error
        } =
            await supabase
                .from("profiles")
                .select(`
                    id,
                    nom,
                    grade,
                    grade2,
                    email,
                    image_url,
                    description,
                    region,
                    competences,
                    anonyme,
                    facebook_url,
                    x_url,
                    instagram_url,
                    youtube_url,
                    tiktok_url,
                    audience_max
                `)
                .eq(
                    "id",
                    user.id
                )
                .single();


        /* =================================================
           ERREUR PROFIL
        ================================================= */

        if (
            error ||
            !profile
        ) {

            console.error(
                "Erreur chargement profil :",
                error
            );


            await supabase.auth.signOut();


            window.currentUser =
                null;

            window.currentProfile =
                null;


            if (
                typeof window.reinitialiserEtatAdmin ===
                "function"
            ) {

                window.reinitialiserEtatAdmin();
            }


            window.adminAuthReady =
                true;


            afficherConnexion();


            afficherMessage(
                loginMessage,
                "error",
                "Impossible de charger votre profil."
            );


            return;
        }


        /* =================================================
           ETAT UTILISATEUR
        ================================================= */

        /*
         * IMPORTANT :
         *
         * currentProfile est rempli AVANT :
         *
         * - les droits
         * - les onglets
         * - les chargements conditionnels
         */

        window.currentUser =
            user;

        window.currentProfile =
            profile;


        /*
         * Synchronisation explicite avec admin-core.js.
         */

        if (
            typeof window.definirEtatUtilisateur ===
            "function"
        ) {

            window.definirEtatUtilisateur(
                user,
                profile
            );
        }


        /* =================================================
           AFFICHAGE ESPACE MEMBRE
        ================================================= */

        afficherAdmin();


        /* =================================================
           REMPLISSAGE PROFIL
        ================================================= */

        if (
            typeof window.remplirProfil ===
            "function"
        ) {

            window.remplirProfil(
                profile
            );
        }


        /* =================================================
           ACTUALISATION DES DROITS
        ================================================= */

        if (
            typeof window.actualiserAccesAdmin ===
            "function"
        ) {

            window.actualiserAccesAdmin();
        }


        /* =================================================
           ONGLET RDV
        ================================================= */

        const rdvButton =
            document.getElementById(
                "rdvTabButton"
            );


        if (rdvButton) {

            const autoriseRDV =
                typeof window.peutGererRendezVous ===
                    "function"
                &&
                window.peutGererRendezVous();


            rdvButton.style.display =
                autoriseRDV
                    ? ""
                    : "none";


            if (
                autoriseRDV
                &&
                typeof window.chargerRendezVous ===
                    "function"
            ) {

                window.chargerRendezVous();
            }
        }


        /* =================================================
           ONGLET ROLE
        ================================================= */

        const roleButton =
            document.getElementById(
                "roleTabButton"
            );


        if (roleButton) {

            const autoriseRole =
                typeof window.peutGererRole ===
                    "function"
                &&
                window.peutGererRole();


            roleButton.style.display =
                autoriseRole
                    ? ""
                    : "none";


            if (
                autoriseRole
                &&
                typeof window.remplirRoles ===
                    "function"
            ) {

                window.remplirRoles(
                    profile.competences
                );
            }
        }


        /* =================================================
           GESTION DES EQUIPES
        ================================================= */

        if (
            typeof window.actualiserAccesEquipes ===
            "function"
        ) {

            window.actualiserAccesEquipes();
        }


        if (
            typeof window.chargerGestionEquipes ===
            "function"
        ) {

            window.chargerGestionEquipes();
        }


        /* =================================================
           EVENEMENT DE CONNEXION
        ================================================= */

        /*
         * admin-core.js écoute cet événement.
         *
         * Le profil est déjà complètement chargé
         * au moment où l'événement est envoyé.
         */

        window.dispatchEvent(
            new CustomEvent(
                "avantgarde:admin-connected",
                {
                    detail: {
                        user,
                        profile
                    }
                }
            )
        );


        /* =================================================
           AUTHENTIFICATION TERMINEE
        ================================================= */

        /*
         * C'EST ICI que l'état devient prêt.
         *
         * Il est volontairement placé APRÈS :
         *
         * - getUser()
         * - chargement profiles
         * - currentUser
         * - currentProfile
         * - droits
         * - visibilité des onglets
         */

        window.adminAuthReady =
            true;


        /* =================================================
           ACTIVATION FINALE DE L'ONGLET
        ================================================= */

        /*
         * On laisse le navigateur terminer son cycle
         * courant avant de demander à admin-tabs.js
         * d'activer ?tab=...
         */

        const appliquer =
            () => {

                finaliserOngletApresAuthentification();
            };


        if (
            document.readyState ===
            "loading"
        ) {

            document.addEventListener(
                "DOMContentLoaded",
                appliquer,
                {
                    once: true
                }
            );

        } else {

            setTimeout(
                appliquer,
                0
            );
        }

    } catch (
        error
    ) {

        console.error(
            "Erreur vérification utilisateur :",
            error
        );


        window.currentUser =
            null;

        window.currentProfile =
            null;


        if (
            typeof window.reinitialiserEtatAdmin ===
            "function"
        ) {

            window.reinitialiserEtatAdmin();
        }


        window.adminAuthReady =
            true;


        afficherConnexion();


        afficherMessage(
            loginMessage,
            "error",
            "Une erreur est survenue lors de la vérification de votre session."
        );
    }
}


/* =========================================================
   GESTION DU FORMULAIRE DE CONNEXION
========================================================= */

function initialiserFormulaireConnexion() {

    if (!loginForm) {
        return;
    }


    /*
     * Evite les doubles listeners.
     */

    if (
        loginForm.dataset.authInitialized ===
        "true"
    ) {
        return;
    }


    loginForm.dataset.authInitialized =
        "true";


    loginForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            viderMessage(
                loginMessage
            );


            if (loginButton) {

                loginButton.disabled =
                    true;

                loginButton.textContent =
                    "CONNEXION…";
            }


            const emailInput =
                document.getElementById(
                    "loginEmail"
                );


            const passwordInput =
                document.getElementById(
                    "loginPassword"
                );


            if (
                !emailInput ||
                !passwordInput
            ) {

                afficherMessage(
                    loginMessage,
                    "error",
                    "Formulaire de connexion incomplet."
                );


                if (loginButton) {

                    loginButton.disabled =
                        false;

                    loginButton.textContent =
                        "CONNEXION";
                }


                return;
            }


            const email =
                emailInput.value
                    .trim()
                    .toLowerCase();


            const password =
                passwordInput.value;


            console.log(
                "AVANT-GARDE : tentative de connexion Supabase"
            );


            /*
             * Pendant la connexion :
             * aucun onglet ne doit être considéré
             * comme prêt.
             */

            window.adminAuthReady =
                false;


            const {
                error
            } =
                await supabase.auth.signInWithPassword(
                    {
                        email,
                        password
                    }
                );


            if (error) {

                console.error(
                    "Erreur connexion :",
                    error
                );


                window.adminAuthReady =
                    true;


                afficherMessage(
                    loginMessage,
                    "error",
                    "Adresse e-mail ou mot de passe incorrect."
                );


                if (loginButton) {

                    loginButton.disabled =
                        false;

                    loginButton.textContent =
                        "CONNEXION";
                }


                return;
            }


            console.log(
                "AVANT-GARDE : authentification Supabase réussie"
            );


            /*
             * verifierUtilisateur() recharge le profil,
             * actualise les droits et active le bon onglet.
             */

            await verifierUtilisateur();
        }
    );
}


/* =========================================================
   INITIALISATION AUTHENTIFICATION
========================================================= */

function initialiserAuthentification() {

    /*
     * Récupération des éléments après disponibilité du DOM.
     */

    recupererElementsAuth();


    /*
     * Installation du formulaire.
     */

    initialiserFormulaireConnexion();


    /*
     * Vérification de la session existante.
     */

    verifierUtilisateur();
}


/* =========================================================
   EXPOSITION
========================================================= */

window.verifierUtilisateur =
    verifierUtilisateur;

window.afficherConnexion =
    afficherConnexion;

window.afficherAdmin =
    afficherAdmin;

window.ajouterActionsHeader =
    ajouterActionsHeader;

window.deconnecter =
    deconnecter;

window.finaliserOngletApresAuthentification =
    finaliserOngletApresAuthentification;


/* =========================================================
   COMPATIBILITE MESSAGES
========================================================= */

window.afficherMessage =
    window.afficherMessage ||
    afficherMessage;

window.viderMessage =
    window.viderMessage ||
    viderMessage;


/* =========================================================
   INITIALISATION DOM
========================================================= */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initialiserAuthentification,
        {
            once: true
        }
    );

} else {

    initialiserAuthentification();
}


/* =========================================================
   EXPORTS
========================================================= */

export {
    verifierUtilisateur,
    afficherConnexion,
    afficherAdmin,
    ajouterActionsHeader,
    deconnecter,
    finaliserOngletApresAuthentification
};
