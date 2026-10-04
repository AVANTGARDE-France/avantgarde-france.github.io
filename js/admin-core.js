/* =========================================================
AVANT-GARDE — ADMIN CORE

js/admin-core.js

COEUR / COUCHE DE COMPATIBILITÉ DE L'ESPACE MEMBRE

IMPORTANT :

Ce fichier ne recrée PAS les modules spécialisés.

Modules spécialisés :

* admin-auth.js
* admin-profile.js
* admin-events.js
* admin-team.js
* admin-role.js
* admin-tabs.js
* admin-delete-profile.js
* admin-utils.js

Le rôle du Core est uniquement de :

* centraliser l'état partagé ;
* fournir les compatibilités avec l'ancien monolithe ;
* exposer les fonctions communes attendues par les modules ;
* coordonner l'affichage initial ;
* éviter les références JavaScript cassées après extraction.

========================================================= */


/* =========================================================
ETAT UTILISATEUR PARTAGÉ
========================================================= */

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
ARCHITECTE DU PROJET
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

            const profile =
                window.currentProfile;

            return (

                profile?.grade === "admin"

                ||

                profile?.grade2 ===
                    "Architecte du Projet"

                ||

                profile?.grade2 ===
                    "Délégué National"

                ||

                profile?.grade2 ===
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

            const profile =
                window.currentProfile;

            return (

                profile?.grade === "admin"

                ||

                profile?.grade2 ===
                    "Architecte du Projet"

            );

        };

}


/* ---------------------------------------------------------
EQUIPES — DROIT DE MODIFICATION
--------------------------------------------------------- */

if (
    typeof window.peutGererEquipes !==
    "function"
) {

    window.peutGererEquipes =
        function () {

            const profile =
                window.currentProfile;

            return (

                profile?.grade === "admin"

                ||

                profile?.grade2 ===
                    "Architecte du Projet"

                ||

                profile?.grade2 ===
                    "Délégué National"

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

            const profile =
                window.currentProfile;

            return (

                profile?.grade === "admin"

                ||

                profile?.grade2 ===
                    "Architecte du Projet"

                ||

                profile?.grade2 ===
                    "Délégué National"

                ||

                (
                    profile?.grade2 ===
                        "Délégué Régional"

                    &&

                    profile?.region ===
                        region
                )

            );

        };

}


/* =========================================================
COMPATIBILITE PROFIL
========================================================= */

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
COMPATIBILITE ROLE
========================================================= */

if (
    typeof window.peutGererRole !==
    "function"
) {

    window.peutGererRole =
        function () {

            const profile =
                window.currentProfile;

            return (

                profile?.grade === "admin"

                ||

                profile?.grade2 ===
                    "Architecte du Projet"

                ||

                profile?.grade2 ===
                    "Délégué National"

                ||

                profile?.grade2 ===
                    "Délégué Régional"

                ||

                profile?.grade2 ===
                    "Militant"

            );

        };

}


/* =========================================================
ACCES ONGLET RDV
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
ACCES ONGLET ROLE
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
ACCES ONGLET EQUIPES
========================================================= */

function actualiserAccesEquipes() {

    const button =
        document.getElementById(
            "teamTabButton"
        );


    if (!button) {

        return;

    }


    const profile =
        window.currentProfile;


    const autorise = !!(

        profile?.grade ===
            "admin"

        ||

        profile?.grade2 ===
            "Architecte du Projet"

        ||

        profile?.grade2 ===
            "Délégué National"

        ||

        profile?.grade2 ===
            "Délégué Régional"

    );


    button.style.display =
        autorise
            ? ""
            : "none";

}


/* =========================================================
ACCES ONGLET CONTENU PROJET
========================================================= */

/*
   CONTENU PROJET est réservé aux administrateurs.

   Le contenu éditorial du projet ne peut être géré
   que par un profil dont le grade principal est "admin".
*/

function actualiserAccesContenuProjet() {

    const button =
        document.getElementById(
            "contentProjectTabButton"
        );


    if (!button) {

        return;

    }


    const autorise =
        window.currentProfile?.grade ===
        "admin";


    button.style.display =
        autorise
            ? ""
            : "none";

}


/* =========================================================
ACCES ONGLET AUTRES PAGES
========================================================= */

/*
   AUTRES PAGES est réservé aux administrateurs.

   Cet onglet contient notamment :

   - MANIFESTE
   - INSPIRATIONS

   Il ne doit être accessible ni en lecture
   ni en modification par les profils non-admin.
*/

function actualiserAccesContenuAutres() {

    const button =
        document.getElementById(
            "contentOtherTabButton"
        );


    if (!button) {

        return;

    }


    const autorise =
        window.currentProfile?.grade ===
        "admin";


    button.style.display =
        autorise
            ? ""
            : "none";

}


/* =========================================================
ACCES ONGLET EFFETS MESURES
========================================================= */

/*
   EFFETS MESURES est réservé aux administrateurs.

   Cet onglet correspond à la bibliothèque des
   statistiques / icônes utilisées par les mesures.
*/

function actualiserAccesEffetsMesures() {

    const button =
        document.getElementById(
            "statsTabButton"
        );


    if (!button) {

        return;

    }


    const autorise =
        window.currentProfile?.grade ===
        "admin";


    button.style.display =
        autorise
            ? ""
            : "none";

}


/* =========================================================
ACTUALISER LES ACCES
========================================================= */

function actualiserAccesAdmin() {

    actualiserAccesRDV();

    actualiserAccesRole();

    actualiserAccesEquipes();

    actualiserAccesContenuProjet();

    actualiserAccesContenuAutres();

    actualiserAccesEffetsMesures();

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

window.actualiserAccesContenuProjet =
    actualiserAccesContenuProjet;

window.actualiserAccesContenuAutres =
    actualiserAccesContenuAutres;

window.actualiserAccesEffetsMesures =
    actualiserAccesEffetsMesures;

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

    actualiserAccesContenuProjet,

    actualiserAccesContenuAutres,

    actualiserAccesEffetsMesures,

    actualiserAccesAdmin

};
