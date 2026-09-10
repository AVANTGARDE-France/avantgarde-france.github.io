/* =========================================================
   AVANT-GARDE — ADMIN CORE

   js/admin-core.js

   Cœur / coordinateur de l'espace membre.

   IMPORTANT :
   - L'authentification est gérée par admin-auth.js
   - Le profil est géré par admin-profile.js
   - Les évènements sont gérés par admin-events.js
   - Les équipes sont gérées par admin-team.js
   - Les rôles sont gérés par admin-role.js
   - Les onglets sont gérés par admin-tabs.js
   - La suppression du profil est gérée par
     admin-delete-profile.js

   Ce fichier ne duplique donc aucune de ces logiques.

   Il sert à :
   - centraliser l'état utilisateur partagé ;
   - fournir les références communes aux modules ;
   - coordonner l'initialisation ;
   - éviter les références cassées entre modules ES.
========================================================= */


/* =========================================================
   ETAT GLOBAL PARTAGE
========================================================= */

/*
 * Les modules spécialisés utilisent window.currentUser
 * et window.currentProfile afin de partager le même état.
 *
 * admin-auth.js est responsable de mettre à jour ces valeurs
 * lors de la connexion / déconnexion.
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
   ETAT EQUIPES PARTAGE
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
   SYNCHRONISATION DE L'ETAT
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


/* =========================================================
   RECUPERATION ETAT
========================================================= */

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


/* =========================================================
   NETTOYAGE ETAT
========================================================= */

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
   EXPOSITION
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
   EVENEMENTS INTER-MODULES
========================================================= */

/*
 * Ces événements permettent aux modules de communiquer
 * sans recréer les anciennes dépendances du monolithe.
 */


function notifierConnexion(
    user,
    profile
) {

    definirEtatUtilisateur(
        user,
        profile
    );


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
}


function notifierDeconnexion() {

    reinitialiserEtatAdmin();


    window.dispatchEvent(
        new CustomEvent(
            "avantgarde:admin-disconnected"
        )
    );
}


/* =========================================================
   EXPOSITION EVENEMENTS
========================================================= */

window.notifierConnexion =
    notifierConnexion;


window.notifierDeconnexion =
    notifierDeconnexion;


/* =========================================================
   INITIALISATION
========================================================= */

function initialiserAdminCore() {

    /*
     * Le Core ne lance aucune authentification.
     *
     * admin-auth.js est le seul responsable de déterminer
     * si une session existe et de charger le profil.
     *
     * Cela évite notamment une deuxième instance Supabase
     * ou une deuxième vérification de session.
     */


    /*
     * Les modules spécialisés sont déjà chargés par
     * admin.js. Ils s'enregistrent eux-mêmes.
     */
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

    notifierConnexion,

    notifierDeconnexion

};

