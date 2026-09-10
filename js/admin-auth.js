/* =========================================================
   AVANT-GARDE — ADMIN AUTH

   js/admin-auth.js

   Gestion complète de l'authentification :

   - Connexion Supabase
   - Vérification de la session
   - Chargement du profil
   - grade / grade2
   - Affichage connexion / espace membre
   - Déconnexion

   IMPORTANT :
   L'initialisation attend que le DOM soit complètement
   chargé avant de récupérer les éléments HTML.
========================================================= */

import { supabase } from "./supabase.js";


/* =========================================================
   VARIABLES
========================================================= */

let currentUser = null;
let currentProfile = null;


/* =========================================================
   ETAT GLOBAL
========================================================= */

function exposerEtat() {

    window.currentUser =
        currentUser;

    window.currentProfile =
        currentProfile;
}


/* =========================================================
   AFFICHAGE CONNEXION
========================================================= */

function afficherConnexion() {

    const loginScreen =
        document.getElementById(
            "loginScreen"
        );

    const adminScreen =
        document.getElementById(
            "adminScreen"
        );


    if (loginScreen) {

        loginScreen.style.display =
            "block";
    }


    if (adminScreen) {

        adminScreen.style.display =
            "none";
    }


    const loginButton =
        document.getElementById(
            "loginButton"
        );


    if (loginButton) {

        loginButton.disabled =
            false;

        loginButton.textContent =
            "SE CONNECTER";
    }
}


/* =========================================================
   AFFICHAGE ADMIN
========================================================= */

function afficherAdmin() {

    const loginScreen =
        document.getElementById(
            "loginScreen"
        );

    const adminScreen =
        document.getElementById(
            "adminScreen"
        );


    if (loginScreen) {

        loginScreen.style.display =
            "none";
    }


    if (adminScreen) {

        adminScreen.style.display =
            "block";
    }


    exposerEtat();
}


/* =========================================================
   MESSAGE
========================================================= */

function afficherMessage(
    texte,
    type = "error"
) {

    const message =
        document.getElementById(
            "loginMessage"
        );


    if (!message) {
        return;
    }


    message.textContent =
        texte;


    message.className =
        "message " + type;
}


/* =========================================================
   NETTOYAGE MESSAGE
========================================================= */

function viderMessage() {

    const message =
        document.getElementById(
            "loginMessage"
        );


    if (!message) {
        return;
    }


    message.textContent =
        "";


    message.className =
        "message";
}


/* =========================================================
   CHARGEMENT DU PROFIL
========================================================= */

async function chargerProfil(
    user
) {

    const {
        data,
        error
    } =
        await supabase

            .from("profiles")

            .select("*")

            .eq(
                "id",
                user.id
            )

            .single();


    if (error) {

        console.error(
            "Erreur chargement profil :",
            error
        );

        return null;
    }


    return data;
}


/* =========================================================
   VERIFICATION UTILISATEUR
========================================================= */

async function verifierUtilisateur() {

    try {

        const {
            data,
            error
        } =
            await supabase.auth.getUser();


        if (error) {

            console.error(
                "Erreur récupération utilisateur :",
                error
            );


            currentUser =
                null;

            currentProfile =
                null;

            exposerEtat();

            afficherConnexion();

            return;
        }


        const user =
            data?.user;


        /*
         * Aucune session active.
         */

        if (!user) {

            currentUser =
                null;

            currentProfile =
                null;

            exposerEtat();

            afficherConnexion();

            return;
        }


        /*
         * Session valide.
         */

        currentUser =
            user;


        /*
         * Récupération du profil.
         */

        currentProfile =
            await chargerProfil(
                user
            );


        /*
         * Si le profil n'existe pas,
         * on ne laisse pas entrer dans
         * l'espace membre.
         */

        if (!currentProfile) {

            await supabase.auth.signOut();


            currentUser =
                null;

            currentProfile =
                null;

            exposerEtat();


            afficherMessage(
                "Impossible de charger votre profil."
            );


            afficherConnexion();

            return;
        }


        exposerEtat();


        /*
         * Passage effectif dans l'espace membre.
         */

        afficherAdmin();


        /*
         * Si le module profil expose une fonction
         * de remplissage, on l'utilise.
         */

        if (
            typeof window.remplirProfil ===
            "function"
        ) {

            window.remplirProfil(
                currentProfile
            );
        }


        /*
         * Gestion des onglets selon les droits.
         */

        if (
            typeof window.initialiserDroits ===
            "function"
        ) {

            window.initialiserDroits(
                currentProfile
            );
        }


    } catch (error) {

        console.error(
            "Erreur vérification utilisateur :",
            error
        );


        currentUser =
            null;

        currentProfile =
            null;

        exposerEtat();


        afficherMessage(
            "Une erreur est survenue."
        );


        afficherConnexion();
    }
}


/* =========================================================
   CONNEXION
========================================================= */

async function connecter() {

    viderMessage();


    const emailInput =
        document.getElementById(
            "loginEmail"
        );

    const passwordInput =
        document.getElementById(
            "loginPassword"
        );

    const loginButton =
        document.getElementById(
            "loginButton"
        );


    const email =
        emailInput
            ?.value
            ?.trim()
            ?.toLowerCase();


    const password =
        passwordInput
            ?.value;


    if (
        !email ||
        !password
    ) {

        afficherMessage(
            "Veuillez renseigner votre adresse e-mail et votre mot de passe."
        );


        return;
    }


    if (loginButton) {

        loginButton.disabled =
            true;

        loginButton.textContent =
            "CONNEXION…";
    }


    try {

        console.log(
            "AVANT-GARDE : tentative de connexion Supabase"
        );


        const {
            data,
            error
        } =
            await supabase.auth.signInWithPassword({

                email,
                password

            });


        if (error) {

            console.error(
                "Supabase signInWithPassword :",
                error
            );


            afficherMessage(
                error.message ||
                "Adresse e-mail ou mot de passe incorrect."
            );


            if (loginButton) {

                loginButton.disabled =
                    false;

                loginButton.textContent =
                    "SE CONNECTER";
            }


            return;
        }


        console.log(
            "AVANT-GARDE : authentification Supabase réussie",
            data?.user
        );


        /*
         * L'authentification est réussie.
         * On récupère maintenant le profil.
         */

        await verifierUtilisateur();


    } catch (error) {

        console.error(
            "Erreur connexion :",
            error
        );


        afficherMessage(
            "Une erreur est survenue lors de la connexion."
        );


        if (loginButton) {

            loginButton.disabled =
                false;

            loginButton.textContent =
                "SE CONNECTER";
        }
    }
}


/* =========================================================
   DECONNEXION
========================================================= */

async function deconnecter() {

    try {

        const {
            error
        } =
            await supabase.auth.signOut();


        if (error) {

            console.error(
                "Erreur déconnexion :",
                error
            );

            return;
        }


        currentUser =
            null;

        currentProfile =
            null;


        exposerEtat();


        afficherConnexion();


    } catch (error) {

        console.error(
            "Erreur déconnexion :",
            error
        );
    }
}


/* =========================================================
   INITIALISATION
========================================================= */

function initialiserAuthentification() {

    const loginForm =
        document.getElementById(
            "loginForm"
        );


    /*
     * Si le formulaire n'existe pas,
     * on arrête proprement.
     */

    if (!loginForm) {

        console.error(
            "AVANT-GARDE : #loginForm introuvable."
        );

        return;
    }


    /*
     * Evite de brancher plusieurs fois
     * l'événement submit.
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

            await connecter();

        }
    );


    /*
     * Vérification d'une éventuelle
     * session déjà existante.
     */

    verifierUtilisateur();
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
    connecter,
    deconnecter,
    afficherConnexion,
    afficherAdmin
};

