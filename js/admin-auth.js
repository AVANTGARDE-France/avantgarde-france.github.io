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
========================================================= */

import { supabase } from "./supabase.js";


/* =========================================================
   VARIABLES
========================================================= */

let currentUser = null;
let currentProfile = null;


/* =========================================================
   ELEMENTS
========================================================= */

const loginScreen =
    document.getElementById("loginScreen");

const adminScreen =
    document.getElementById("adminScreen");

const loginForm =
    document.getElementById("loginForm");

const loginButton =
    document.getElementById("loginButton");

const loginMessage =
    document.getElementById("loginMessage");


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
        "message " + type;


    element.textContent =
        texte;
}


function viderMessage(element) {

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
}


/* =========================================================
   AFFICHAGE ADMIN
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

        adminUser.innerHTML =
            "Connecté en tant que <strong>" +
            (
                currentProfile?.nom ||
                currentUser?.email ||
                ""
            ) +
            "</strong>";
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


    currentUser =
        null;


    currentProfile =
        null;


    if (button) {

        button.disabled =
            false;

        button.textContent =
            "SE DÉCONNECTER";
    }


    afficherConnexion();
}


/* =========================================================
   VERIFICATION UTILISATEUR
========================================================= */

async function verifierUtilisateur() {

    const {
        data: {
            user
        }
    } =
        await supabase.auth.getUser();


    if (!user) {

        afficherConnexion();

        return;
    }


    currentUser =
        user;


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


    if (
        error ||
        !profile
    ) {

        console.error(
            "Erreur chargement profil :",
            error
        );


        await supabase.auth.signOut();


        afficherMessage(
            loginMessage,
            "error",
            "Impossible de charger votre profil."
        );


        afficherConnexion();

        return;
    }


    currentProfile =
        profile;


    afficherAdmin();


    /*
     * Le remplissage du profil reste
     * assuré par admin-profile.js.
     */

    if (
        typeof window.remplirProfil ===
        "function"
    ) {

        window.remplirProfil(
            profile
        );
    }


    /* -----------------------------------------------------
       ONGLET RDV
    ----------------------------------------------------- */

    const rdvButton =
        document.getElementById(
            "rdvTabButton"
        );


    if (rdvButton) {

        if (
            typeof window.peutGererRendezVous ===
            "function" &&
            window.peutGererRendezVous()
        ) {

            rdvButton.style.display =
                "block";


            if (
                typeof window.chargerRendezVous ===
                "function"
            ) {

                window.chargerRendezVous();
            }


        } else {

            rdvButton.style.display =
                "none";
        }
    }


    /* -----------------------------------------------------
       ONGLET ROLE
    ----------------------------------------------------- */

    const roleButton =
        document.getElementById(
            "roleTabButton"
        );


    if (roleButton) {

        if (
            typeof window.peutGererRole ===
            "function" &&
            window.peutGererRole()
        ) {

            roleButton.style.display =
                "block";


            if (
                typeof window.remplirRoles ===
                "function"
            ) {

                window.remplirRoles(
                    profile.competences
                );
            }


        } else {

            roleButton.style.display =
                "none";
        }
    }


    /* -----------------------------------------------------
       GESTION DES EQUIPES
    ----------------------------------------------------- */

    if (
        typeof window.chargerGestionEquipes ===
        "function"
    ) {

        window.chargerGestionEquipes();
    }
}


/* =========================================================
   CONNEXION
========================================================= */

if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            viderMessage(
                loginMessage
            );


            if (loginButton) {

                loginButton.disabled =
                    false;

                loginButton.textContent =
                    "CONNEXION…";
            }


            const email =
                document
                    .getElementById(
                        "loginEmail"
                    )
                    .value
                    .trim()
                    .toLowerCase();


            const password =
                document
                    .getElementById(
                        "loginPassword"
                    )
                    .value;


            const {
                error
            } =
                await supabase.auth.signInWithPassword({

                    email,

                    password

                });


            if (error) {

                console.error(
                    "Erreur connexion :",
                    error
                );


                afficherMessage(
                    loginMessage,
                    "error",
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


            await verifierUtilisateur();
        }
    );
}


/* =========================================================
   INITIALISATION
========================================================= */

verifierUtilisateur();


/* =========================================================
   EXPORTS
========================================================= */

export {

    currentUser,

    currentProfile,

    verifierUtilisateur,

    afficherConnexion,

    afficherAdmin,

    ajouterActionsHeader,

    deconnecter

};
