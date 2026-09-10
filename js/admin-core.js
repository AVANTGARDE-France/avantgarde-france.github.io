/* =========================================================
   AVANT-GARDE — ADMIN CORE

   js/admin-core.js

   COEUR / COUCHE DE COMPATIBILITÉ DE L'ESPACE MEMBRE

   IMPORTANT :

   Ce fichier ne recrée PAS les modules spécialisés.

   Modules spécialisés :
   - admin-auth.js
   - admin-profile.js
   - admin-events.js
   - admin-team.js
   - admin-role.js
   - admin-tabs.js
   - admin-delete-profile.js
   - admin-utils.js

   Le rôle du Core est uniquement de :

   - centraliser l'état partagé ;
   - fournir les compatibilités avec l'ancien monolithe ;
   - exposer les fonctions communes attendues par les modules ;
   - coordonner l'affichage initial ;
   - éviter les références JavaScript cassées après extraction.

========================================================= */


/* =========================================================
   ETAT UTILISATEUR PARTAGÉ
========================================================= */

/*
 * NE PAS utiliser "let currentUser" ou
 * "let currentProfile" ici.

 * Ces données doivent être accessibles à tous les modules.
 */

if (
    typeof window.currentUser ===
    "undefined"
) {

    window.currentUser = null;
}


if (
    typeof window.currentProfile ===
    "undefined"
) {

    window.currentProfile = null;
}


/* =========================================================
   ETAT EQUIPES PARTAGÉ
========================================================= */

if (
    typeof window.tousLesMembres ===
    "undefined"
) {

    window.tousLesMembres = [];
}


if (
    typeof window.regionsEquipe ===
    "undefined"
) {

    window.regionsEquipe = [];
}


if (
    typeof window.regionEquipeActive ===
    "undefined"
) {

    window.regionEquipeActive = null;
}


/* =========================================================
   ROLES
========================================================= */

if (
    typeof window.ROLES ===
    "undefined"
) {

    window.ROLES = [

        "Organisateurs de terrain",

        "Conférenciers",

        "Influenceurs Réseaux Sociaux",

        "Parrains/marraines",

        "Militants"

    ];
}


/* =========================================================
   ELEMENTS COMMUNS
========================================================= */

function obtenirElement(
    id
) {

    return document.getElementById(
        id
    );
}


/* =========================================================
   MESSAGES
========================================================= */

/*
 * admin-utils.js doit normalement fournir ces fonctions.

 * On garde néanmoins une compatibilité de secours afin
 * qu'aucun module ne plante si son chargement intervient
 * avant l'initialisation de utils.
 */

if (
    typeof window.afficherMessage !==
    "function"
) {

    window.afficherMessage =
        function (
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
        };
}


if (
    typeof window.viderMessage !==
    "function"
) {

    window.viderMessage =
        function (
            element
        ) {

            if (!element) {

                return;
            }


            element.className =
                "message";


            element.textContent =
                "";
        };
}


/* =========================================================
   ECHAPPEMENT HTML
========================================================= */

if (
    typeof window.escapeHtml !==
    "function"
) {

    window.escapeHtml =
        function (
            value
        ) {

            return String(
                value ?? ""
            )

                .replace(
                    /&/g,
                    "&amp;"
                )

                .replace(
                    /</g,
                    "&lt;"
                )

                .replace(
                    />/g,
                    "&gt;"
                )

                .replace(
                    /"/g,
                    "&quot;"
                )

                .replace(
                    /'/g,
                    "&#039;"
                );
        };
}


/* =========================================================
   NORMALISATION COMPETENCES
========================================================= */

if (
    typeof window.normaliserCompetences !==
    "function"
) {

    window.normaliserCompetences =
        function (
            value
        ) {

            if (
                Array.isArray(value)
            ) {

                return value;
            }


            if (
                typeof value ===
                "string"
            ) {

                return value

                    .replace(
                        /^\{|\}$/g,
                        ""
                    )

                    .split(",")

                    .map(
                        x =>
                            x
                                .trim()
                                .replace(
                                    /^"|"$/g,
                                    ""
                                )
                    )

                    .filter(
                        Boolean
                    );
            }


            return [];
        };
}


/* =========================================================
   ETAT UTILISATEUR
========================================================= */

function definirUtilisateur(
    user
) {

    window.currentUser =
        user || null;
}


function definirProfil(
    profile
) {

    window.currentProfile =
        profile || null;
}


function definirEtatUtilisateur(
    user,
    profile
) {

    window.currentUser =
        user || null;

    window.currentProfile =
        profile || null;
}


function obtenirUtilisateur() {

    return (
        window.currentUser ||
        null
    );
}


function obtenirProfil() {

    return (
        window.currentProfile ||
        null
    );
}


function reinitialiserEtatAdmin() {

    window.currentUser =
        null;

    window.currentProfile =
        null;

    window.tousLesMembres =
        [];

    window.regionsEquipe =
        [];

    window.regionEquipeActive =
        null;
}


/* =========================================================
   EXPOSITION ETAT
========================================================= */

window.definirUtilisateur =
    definirUtilisateur;


window.definirProfil =
    definirProfil;


window.definirEtatUtilisateur =
    definirEtatUtilisateur;


window.obtenirUtilisateur =
    obtenirUtilisateur;


window.obtenirProfil =
    obtenirProfil;


window.reinitialiserEtatAdmin =
    reinitialiserEtatAdmin;


/* =========================================================
   COMPATIBILITE DROITS
========================================================= */

/*
 * IMPORTANT :

 * Les fonctions de droits sont normalement définies
 * dans admin-team.js / admin-role.js.

 * On ne les recrée pas ici avec une logique différente.

 * En revanche, le Core fournit des fonctions de secours
 * uniquement si aucun module ne les a encore exposées.
 */


/* ---------------------------------------------------------
   ADMIN
--------------------------------------------------------- */

if (
    typeof window.estAdmin !==
    "function"
) {

    window.estAdmin =
        function () {

            return (
                window.currentProfile?.grade ===
                "admin"
            );
        };
}


/* ---------------------------------------------------------
   COMMISSAIRE FONDATEUR
--------------------------------------------------------- */

if (
    typeof window.estCommissaireFondateur !==
    "function"
) {

    window.estCommissaireFondateur =
        function () {

            return (
                window.currentProfile?.grade2 ===
                "Architecte du Projet"
            );
        };
}


/* ---------------------------------------------------------
   DELEGUE NATIONAL
--------------------------------------------------------- */

if (
    typeof window.estDelegueNational !==
    "function"
) {

    window.estDelegueNational =
        function () {

            return (
                window.currentProfile?.grade2 ===
                "Délégué National"
            );
        };
}


/* ---------------------------------------------------------
   DELEGUE REGIONAL
--------------------------------------------------------- */

if (
    typeof window.estDelegueRegional !==
    "function"
) {

    window.estDelegueRegional =
        function (
            region
        ) {

            return (

                window.currentProfile?.grade2 ===
                    "Délégué Régional"

                &&

                window.currentProfile?.region ===
                    region

            );
        };
}


/* ---------------------------------------------------------
   RDV
--------------------------------------------------------- */

if (
    typeof window.peutGererRendezVous !==
    "function"
) {

    window.peutGererRendezVous =
        function () {

            return (

                window.estAdmin()

                ||

                window.estCommissaireFondateur()

                ||

                window.estDelegueNational()

                ||

                window.currentProfile?.grade2 ===
                    "Délégué Régional"

            );
        };
}


/* ---------------------------------------------------------
   DIRECTION
--------------------------------------------------------- */

if (
    typeof window.peutGererDirection !==
    "function"
) {

    window.peutGererDirection =
        function () {

            return (

                window.estAdmin()

                ||

                window.estCommissaireFondateur()

            );
        };
}


/* ---------------------------------------------------------
   EQUIPES
--------------------------------------------------------- */

if (
    typeof window.peutGererEquipes !==
    "function"
) {

    window.peutGererEquipes =
        function () {

            return (

                window.estAdmin()

                ||

                window.estCommissaireFondateur()

                ||

                window.estDelegueNational()

            );
        };
}


/* ---------------------------------------------------------
   MILITANTS
--------------------------------------------------------- */

if (
    typeof window.peutGererMilitants !==
    "function"
) {

    window.peutGererMilitants =
        function (
            region
        ) {

            return (

                window.estAdmin()

                ||

                window.estCommissaireFondateur()

                ||

                window.estDelegueNational()

                ||

                window.estDelegueRegional(
                    region
                )

            );
        };
}


/* =========================================================
   COMPATIBILITE PROFIL
========================================================= */

/*
 * Si admin-profile.js expose déjà remplirProfil(),
 * on ne touche à rien.

 * Sinon, on fournit ici la fonction de remplissage
 * historique du monolithe.

 * Cela garantit que la fiche Lex est de nouveau remplie.
 */

if (
    typeof window.remplirProfil !==
    "function"
) {

    window.remplirProfil =
        function (
            profile
        ) {

            if (!profile) {

                return;
            }


            const nom =
                obtenirElement(
                    "profileNom"
                );


            const email =
                obtenirElement(
                    "profileEmail"
                );


            const region =
                obtenirElement(
                    "profileRegion"
                );


            const image =
                obtenirElement(
                    "profileImage"
                );


            const description =
                obtenirElement(
                    "profileDescription"
                );


            const facebook =
                obtenirElement(
                    "profileFacebook"
                );


            const x =
                obtenirElement(
                    "profileX"
                );


            const instagram =
                obtenirElement(
                    "profileInstagram"
                );


            const youtube =
                obtenirElement(
                    "profileYoutube"
                );


            const tiktok =
                obtenirElement(
                    "profileTiktok"
                );


            if (nom) {

                nom.value =
                    profile.nom || "";
            }


            if (email) {

                email.value =
                    profile.email ||

                    window.currentUser?.email ||

                    "";
            }


            if (region) {

                region.value =
                    profile.region || "";
            }


            if (image) {

                image.value =
                    profile.image_url || "";
            }


            if (description) {

                description.value =
                    profile.description || "";
            }


            if (facebook) {

                facebook.value =
                    profile.facebook_url || "";
            }


            if (x) {

                x.value =
                    profile.x_url || "";
            }


            if (instagram) {

                instagram.value =
                    profile.instagram_url || "";
            }


            if (youtube) {

                youtube.value =
                    profile.youtube_url || "";
            }


            if (tiktok) {

                tiktok.value =
                    profile.tiktok_url || "";
            }


            const anonyme =
                obtenirElement(
                    "profileAnonyme"
                );


            const affiche =
                obtenirElement(
                    "profileAffiche"
                );


            if (
                profile.anonyme
            ) {

                if (anonyme) {

                    anonyme.checked =
                        true;
                }

            } else {

                if (affiche) {

                    affiche.checked =
                        true;
                }
            }


            if (
                typeof window.synchroniserCompetencesEtRoles ===
                "function"
            ) {

                window.synchroniserCompetencesEtRoles(
                    profile.competences
                );
            }


            if (
                typeof window.mettreAJourMedailleVIP ===
                "function"
            ) {

                window.mettreAJourMedailleVIP(
                    profile.audience_max
                );
            }


            const compteur =
                document.getElementById(
                    "descriptionCounter"
                );


            if (
                compteur &&
                description
            ) {

                compteur.textContent =
                    description.value.length +
                    " / 300";
            }
        };
}


/* =========================================================
   COMPATIBILITE ROLES
========================================================= */

if (
    typeof window.peutGererRole !==
    "function"
) {

    window.peutGererRole =
        function () {

            return !!(

                window.currentProfile?.grade2 &&

                String(
                    window.currentProfile.grade2
                ).trim() !== ""

            );
        };
}


/* =========================================================
   COORDINATION AFFICHAGE ONGLET RDV
========================================================= */

function actualiserAccesRDV() {

    const button =
        document.getElementById(
            "rdvTabButton"
        );


    if (!button) {

        return;
    }


    const autorise =
        typeof window.peutGererRendezVous ===
            "function"

        &&

        window.peutGererRendezVous();


    button.style.display =
        autorise
            ? ""
            : "none";
}


/* =========================================================
   COORDINATION AFFICHAGE ONGLET ROLE
========================================================= */

function actualiserAccesRole() {

    const button =
        document.getElementById(
            "roleTabButton"
        );


    if (!button) {

        return;
    }


    const autorise =
        typeof window.peutGererRole ===
            "function"

        &&

        window.peutGererRole();


    button.style.display =
        autorise
            ? ""
            : "none";
}


/* =========================================================
   COORDINATION AFFICHAGE ONGLET EQUIPES
========================================================= */

function actualiserAccesEquipes() {

    const button =
        document.getElementById(
            "teamTabButton"
        );


    if (!button) {

        return;
    }


    /*
     * Le monolithe affichait l'onglet équipes
     * dès lors que l'utilisateur disposait du droit
     * correspondant.

     * On ne le cache pas arbitrairement pour éviter
     * de supprimer l'accès existant.
     */

    if (
        typeof window.peutGererEquipes ===
        "function"
    ) {

        button.style.display =
            window.peutGererEquipes()
                ? ""
                : "none";
    }
}


/* =========================================================
   ACTUALISER LES ACCES
========================================================= */

function actualiserAccesAdmin() {

    actualiserAccesRDV();

    actualiserAccesRole();

    actualiserAccesEquipes();
}


/* =========================================================
   EXPOSITION
========================================================= */

window.actualiserAccesRDV =
    actualiserAccesRDV;


window.actualiserAccesRole =
    actualiserAccesRole;


window.actualiserAccesEquipes =
    actualiserAccesEquipes;


window.actualiserAccesAdmin =
    actualiserAccesAdmin;


/* =========================================================
   EVENEMENT DE CONNEXION
========================================================= */

window.addEventListener(
    "avantgarde:admin-connected",
    event => {

        const detail =
            event.detail || {};


        if (
            detail.user
        ) {

            window.currentUser =
                detail.user;
        }


        if (
            detail.profile
        ) {

            window.currentProfile =
                detail.profile;
        }


        /*
         * Laisser les modules spécialisés
         * terminer leur propre initialisation.
         */

        setTimeout(
            () => {

                if (
                    typeof window.remplirProfil ===
                    "function"
                ) {

                    window.remplirProfil(
                        window.currentProfile
                    );
                }


                actualiserAccesAdmin();

            },
            0
        );
    }
);


/* =========================================================
   INITIALISATION
========================================================= */

function initialiserAdminCore() {

    /*
     * Ne pas lancer ici :
     *
     * - Supabase Auth
     * - signInWithPassword()
     * - getUser()
     * - chargement du profil
     *
     * Tout cela appartient à admin-auth.js.
     */


    actualiserAccesAdmin();
}


if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initialiserAdminCore,
        {
            once: true
        }
    );

} else {

    initialiserAdminCore();
}


/* =========================================================
   EXPORTS
========================================================= */

export {

    definirUtilisateur,

    definirProfil,

    definirEtatUtilisateur,

    obtenirUtilisateur,

    obtenirProfil,

    reinitialiserEtatAdmin,

    actualiserAccesRDV,

    actualiserAccesRole,

    actualiserAccesEquipes,

    actualiserAccesAdmin

};

