/* =========================================================
   AVANT-GARDE — ADMIN AUTH

   js/admin-auth.js

   Gestion complète de l'authentification de l'espace membre :

   - Connexion Supabase
   - Vérification de la session existante
   - Chargement du profil connecté
   - grade / grade2
   - Affichage connexion / espace membre
   - Affichage des droits dépendant du profil
   - Déconnexion
   - Boutons HOME / DECONNEXION
========================================================= */

import { supabase } from "./supabase.js";


/* =========================================================
   VARIABLES GLOBALES
========================================================= */

let currentUser = null;
let currentProfile = null;


/* =========================================================
   ELEMENTS
========================================================= */

const loginScreen =
    document.getElementById(
        "loginScreen"
    );

const adminScreen =
    document.getElementById(
        "adminScreen"
    );

const loginForm =
    document.getElementById(
        "loginForm"
    );

const loginButton =
    document.getElementById(
        "loginButton"
    );

const loginMessage =
    document.getElementById(
        "loginMessage"
    );


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
   EXPOSITION ETAT AUTHENTIFICATION
=========================================================

   Les autres modules de l'administration utilisent
   l'état du profil connecté.

   On expose donc l'état sur window afin de conserver
   la communication entre les modules séparés du
   monolithe d'origine.
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


    /*
     * Les autres modules peuvent maintenant
     * récupérer le profil courant.
     */

    exposerEtat();
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


    exposerEtat();


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

    try {

        /*
         * Récupération de l'utilisateur réellement
         * authentifié dans Supabase.
         */

        const {
            data,
            error: erreurUtilisateur
        } =
            await supabase.auth.getUser();


        if (erreurUtilisateur) {

            console.error(
                "Erreur récupération utilisateur :",
                erreurUtilisateur
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
         * Aucune session.
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
         * Utilisateur authentifié.
         */

        currentUser =
            user;


        exposerEtat();


        /* -------------------------------------------------
           CHARGEMENT DU PROFIL
        ------------------------------------------------- */

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


        /*
         * Impossible de récupérer le profil.
         */

        if (
            error ||
            !profile
        ) {

            console.error(
                "Erreur chargement profil :",
                error
            );


            await supabase.auth.signOut();


            currentUser =
                null;

            currentProfile =
                null;


            exposerEtat();


            afficherMessage(
                loginMessage,
                "error",
                "Impossible de charger votre profil."
            );


            afficherConnexion();


            return;
        }


        /*
         * Profil valide.
         */

        currentProfile =
            profile;


        exposerEtat();


        /*
         * Passage effectif dans l'espace membre.
         */

        afficherAdmin();


        /* -------------------------------------------------
           REMPLISSAGE DU PROFIL
        ------------------------------------------------- */

        if (
            typeof window.remplirProfil ===
            "function"
        ) {

            window.remplirProfil(
                profile
            );
        }


        /* -------------------------------------------------
           ONGLET RDV
        ------------------------------------------------- */

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


        /* -------------------------------------------------
           ONGLET ROLE
        ------------------------------------------------- */

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


        /* -------------------------------------------------
           GESTION DES EQUIPES
        ------------------------------------------------- */

        if (
            typeof window.chargerGestionEquipes ===
            "function"
        ) {

            window.chargerGestionEquipes();
        }


    } catch (error) {

        console.error(
            "Erreur authentification :",
            error
        );


        currentUser =
            null;

        currentProfile =
            null;


        exposerEtat();


        afficherMessage(
            loginMessage,
            "error",
            "Une erreur est survenue lors de la connexion."
        );


        afficherConnexion();
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
                    true;

                loginButton.textContent =
                    "CONNEXION…";
            }


            const email =
                document
                    .getElementById(
                        "loginEmail"
                    )
                    ?.value
                    .trim()
                    .toLowerCase();


            const password =
                document
                    .getElementById(
                        "loginPassword"
                    )
                    ?.value;


            /*
             * Sécurité supplémentaire :
             * les deux champs doivent exister.
             */

            if (
                !email ||
                !password
            ) {

                afficherMessage(
                    loginMessage,
                    "error",
                    "Veuillez renseigner votre adresse e-mail et votre mot de passe."
                );


                if (loginButton) {

                    loginButton.disabled =
                        false;

                    loginButton.textContent =
                        "SE CONNECTER";
                }


                return;
            }


            try {

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


                /*
                 * L'authentification Supabase est réussie.
                 *
                 * On vérifie immédiatement la session
                 * puis le profil avant d'afficher
                 * l'espace membre.
                 */

                await verifierUtilisateur();

            } catch (error) {

                console.error(
                    "Erreur connexion :",
                    error
                );


                afficherMessage(
                    loginMessage,
                    "error",
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
    );
}


/* =========================================================
   INITIALISATION
========================================================= */

/*
 * Très important :
 * cette fonction est appelée lorsque admin.js charge
 * le module d'authentification.
 *
 * Elle permet aussi de reconnecter automatiquement
 * un utilisateur qui possède déjà une session Supabase.
 */

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

