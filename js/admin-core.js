/* =========================================================
   AVANT-GARDE — ADMIN CORE

   js/admin-core.js

   COEUR / COUCHE DE COMPATIBILITÉ DE L'ESPACE MEMBRE

   IMPORTANT :

   Ce fichier centralise :

   - l'état utilisateur ;
   - l'état partagé des équipes ;
   - les fonctions communes ;
   - les droits ;
   - la visibilité des onglets ;
   - les compatibilités avec les anciens modules.

   Les modules spécialisés restent responsables de leurs
   fonctionnalités propres.

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
   DROITS
=========================================================

   IMPORTANT :

   LE CORE EST LA SOURCE DE VERITE DES DROITS.

   Les droits sont déterminés à partir de :

   - grade
   - grade2
   - région

   Cas particulier important :

   Lex :
       grade  = "admin"
       grade2 = null

   doit conserver tous les droits administrateur.

========================================================= */


/* =========================================================
   ADMIN
========================================================= */

function estAdmin() {

    const profil =
        window.currentProfile ||
        null;


    const grade =
        String(
            profil?.grade ??
            ""
        )
        .trim()
        .toLowerCase();


    return (
        grade ===
        "admin"
    );
}


/* =========================================================
   ARCHITECTE DU PROJET
========================================================= */

function estArchitecteFondateur() {

    const profil =
        window.currentProfile ||
        null;


    return (
        String(
            profil?.grade2 ??
            ""
        )
        .trim()
        ===
        "Architecte du Projet"
    );
}


/*
 * Compatibilité avec l'ancien nom.
 */

function estCommissaireFondateur() {

    return estArchitecteFondateur();
}


/* =========================================================
   DELEGUE NATIONAL
========================================================= */

function estDelegueNational() {

    const profil =
        window.currentProfile ||
        null;


    return (
        String(
            profil?.grade2 ??
            ""
        )
        .trim()
        ===
        "Délégué National"
    );
}


/* =========================================================
   DELEGUE REGIONAL
========================================================= */

function estDelegueRegional(
    region
) {

    const profil =
        window.currentProfile ||
        null;


    return (

        String(
            profil?.grade2 ??
            ""
        )
        .trim()
        ===
        "Délégué Régional"

        &&

        profil?.region ===
        region

    );
}


/* =========================================================
   DROIT RDV
========================================================= */

function peutGererRendezVous() {

    return (

        estAdmin()

        ||

        estArchitecteFondateur()

        ||

        estDelegueNational()

        ||

        estDelegueRegional(
            window.currentProfile?.region
        )

    );
}


/* =========================================================
   DROIT DIRECTION
========================================================= */

function peutGererDirection() {

    return (

        estAdmin()

        ||

        estArchitecteFondateur()

    );
}


/* =========================================================
   DROIT EQUIPES
========================================================= */

function peutGererEquipes() {

    return (

        estAdmin()

        ||

        estArchitecteFondateur()

        ||

        estDelegueNational()

    );
}


/* =========================================================
   DROIT MILITANTS
========================================================= */

function peutGererMilitants(
    region
) {

    return (

        estAdmin()

        ||

        estArchitecteFondateur()

        ||

        estDelegueNational()

        ||

        estDelegueRegional(
            region
        )

    );
}


/* =========================================================
   DROIT ROLE
=========================================================

   ROLE est accessible aux :

   - administrateurs ;
   - Architecte du Projet ;
   - Délégué National.

   IMPORTANT :

   grade2 n'est PAS obligatoire pour un administrateur.

   Donc :

       grade = "admin"
       grade2 = null

   => accès ROLE = OUI

========================================================= */

function peutGererRole() {

    return (

        estAdmin()

        ||

        estArchitecteFondateur()

        ||

        estDelegueNational()

    );
}


/* =========================================================
   EXPOSITION DES DROITS
========================================================= */

window.estAdmin =
    estAdmin;


window.estArchitecteFondateur =
    estArchitecteFondateur;


/*
 * Ancien nom conservé pour compatibilité.
 */

window.estCommissaireFondateur =
    estCommissaireFondateur;


window.estDelegueNational =
    estDelegueNational;


window.estDelegueRegional =
    estDelegueRegional;


window.peutGererRendezVous =
    peutGererRendezVous;


window.peutGererDirection =
    peutGererDirection;


window.peutGererEquipes =
    peutGererEquipes;


window.peutGererMilitants =
    peutGererMilitants;


window.peutGererRole =
    peutGererRole;


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
                obtenirElement(
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
   VISIBILITE ONGLET RDV
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
        peutGererRendezVous();


    button.style.display =
        autorise
            ? ""
            : "none";
}


/* =========================================================
   VISIBILITE ONGLET ROLE
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
        peutGererRole();


    button.style.display =
        autorise
            ? ""
            : "none";
}


/* =========================================================
   VISIBILITE ONGLET EQUIPES
========================================================= */

function actualiserAccesEquipes() {

    const button =
        document.getElementById(
            "teamTabButton"
        );


    if (!button) {

        return;
    }


    const autorise =
        peutGererEquipes();


    button.style.display =
        autorise
            ? ""
            : "none";
}


/* =========================================================
   ACTUALISATION GENERALE DES DROITS
========================================================= */

function actualiserAccesAdmin() {

    actualiserAccesRDV();

    actualiserAccesRole();

    actualiserAccesEquipes();
}


/* =========================================================
   EXPOSITION VISIBILITE
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
         * terminer leur initialisation.
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
     * Le Core ne gère PAS Supabase Auth.
     *
     * Il ne lance pas :
     *
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

    estAdmin,

    estArchitecteFondateur,

    estCommissaireFondateur,

    estDelegueNational,

    estDelegueRegional,

    peutGererRendezVous,

    peutGererDirection,

    peutGererEquipes,

    peutGererMilitants,

    peutGererRole,

    actualiserAccesRDV,

    actualiserAccesRole,

    actualiserAccesEquipes,

    actualiserAccesAdmin

};
