/* =========================================================
   AVANT-GARDE — ADMIN TABS

   js/admin-tabs.js

   Gestion des onglets de l'espace membre :

   - Navigation entre les onglets
   - Rechargement complet de admin.html à chaque clic
   - Lecture de l'onglet demandé via ?tab=
   - Affichage du contenu correspondant
   - Vérification des droits RDV
   - Vérification des droits ROLE
   - Vérification des droits EQUIPES
   - Vérification du CONTENU PROJET

   IMPORTANT :

   L'authentification est prioritaire.

   Tant que admin-auth.js n'a pas terminé de charger
   l'utilisateur et son profil, ce fichier NE DOIT PAS
   décider que l'onglet demandé doit être profileTab.

   L'état est signalé par :

       window.adminAuthReady

   false  = authentification en cours
   true   = authentification terminée

========================================================= */


/* =========================================================
   ETAT D'AUTHENTIFICATION
========================================================= */

/*
 * Très important :
 *
 * On initialise explicitement l'état à false.
 *
 * admin-tabs.js peut être chargé avant admin-auth.js
 * ou avant la fin de sa requête Supabase.
 *
 * Dans ce cas, aucun onglet ne doit être forcé sur PROFIL.
 */

if (
    typeof window.adminAuthReady ===
    "undefined"
) {
    window.adminAuthReady =
        false;
}


/* =========================================================
   ONGLETS AUTORISÉS
========================================================= */

const ONGLETS_ADMIN_AUTORISES = [
    "profileTab",
    "rdvTab",
    "teamTab",
    "roleTab",
    "contentProjectTab",
    "contentOtherTab",
    "statsTab"
];


/* =========================================================
   RECUPERATION DE L'ONGLET DEMANDÉ
========================================================= */

function obtenirOngletDepuisURL() {

    const params =
        new URLSearchParams(
            window.location.search
        );

    const tab =
        params.get(
            "tab"
        );

    if (
        tab &&
        ONGLETS_ADMIN_AUTORISES.includes(
            tab
        )
    ) {
        return tab;
    }

    return "profileTab";
}


/* =========================================================
   VERIFICATION DES DROITS
========================================================= */

function peutAccederOnglet(
    cible
) {

    /*
     * PROFIL
     *
     * Toujours accessible une fois connecté.
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

        /*
         * Si le profil n'est pas encore disponible,
         * on NE considère PAS l'accès comme refusé.
         *
         * L'authentification n'est simplement pas prête.
         */

        if (
            !window.adminAuthReady
        ) {
            return null;
        }

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
            !window.adminAuthReady
        ) {
            return null;
        }

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
     * On reprend exactement la logique utilisée
     * par admin-core.js pour afficher l'onglet.
     */

    if (
        cible ===
        "teamTab"
    ) {

        if (
            !window.adminAuthReady
        ) {
            return null;
        }

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
     *
     * Réservé aux administrateurs.
     */

    if (
        cible ===
        "contentProjectTab"
    ) {

        if (
            !window.adminAuthReady
        ) {
            return null;
        }

        const profile =
            window.currentProfile;

        if (!profile) {
            return false;
        }

        return (
            profile.grade ===
            "admin"
        );
    }


    /*
     * AUTRES CONTENUS
     *
     * Pour le moment, ces onglets ne possèdent
     * pas de restriction supplémentaire ici.
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


    /*
     * Par sécurité, un onglet inconnu est refusé.
     */

    return false;
}


/* =========================================================
   ACTIVATION D'UN ONGLET
========================================================= */

function activerOngletAdmin(
    cible
) {

    /*
     * Valeur par défaut.
     */

    if (!cible) {
        cible =
            "profileTab";
    }


    /*
     * Vérification de l'existence du contenu.
     */

    let contenu =
        document.getElementById(
            cible
        );

    if (!contenu) {

        cible =
            "profileTab";

        contenu =
            document.getElementById(
                cible
            );
    }


    /*
     * Désactivation de tous les onglets.
     */

    document
        .querySelectorAll(
            ".tab"
        )
        .forEach(
            tab => {

                tab.classList.remove(
                    "active"
                );
            }
        );


    /*
     * Désactivation de tous les contenus.
     */

    document
        .querySelectorAll(
            ".tab-content"
        )
        .forEach(
            content => {

                content.classList.remove(
                    "active"
                );
            }
        );


    /*
     * Activation de l'onglet visuel.
     */

    const onglet =
        document.querySelector(
            `.tab[data-tab="${cible}"]`
        );

    if (onglet) {

        onglet.classList.add(
            "active"
        );
    }


    /*
     * Activation du contenu.
     */

    const contenuFinal =
        document.getElementById(
            cible
        );

    if (contenuFinal) {

        contenuFinal.classList.add(
            "active"
        );
    }
}


/* =========================================================
   NETTOYAGE DE L'URL
========================================================= */

function remettreProfilDansURL() {

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
            "Erreur mise à jour URL onglet :",
            error
        );
    }
}


/* =========================================================
   ACTIVATION DE L'ONGLET DEMANDÉ
========================================================= */

function appliquerOngletDepuisURL() {

    /*
     * Sécurité absolue :
     *
     * Tant que l'authentification n'est pas terminée,
     * cette fonction ne fait RIEN.
     */

    if (
        !window.adminAuthReady
    ) {
        return;
    }


    const ongletDemandé =
        obtenirOngletDepuisURL();


    /*
     * Vérification des droits.
     */

    const autorisation =
        peutAccederOnglet(
            ongletDemandé
        );


    /*
     * null signifie que l'authentification
     * n'est pas encore disponible.
     *
     * On attend.
     */

    if (
        autorisation ===
        null
    ) {
        return;
    }


    /*
     * Onglet interdit :
     * retour au profil.
     */

    if (
        autorisation ===
        false
    ) {

        remettreProfilDansURL();

        activerOngletAdmin(
            "profileTab"
        );

        return;
    }


    /*
     * Onglet autorisé :
     * on l'active.
     */

    activerOngletAdmin(
        ongletDemandé
    );
}


/* =========================================================
   INITIALISATION DES CLICS
========================================================= */

function initialiserClicsOnglets() {

    const onglets =
        document.querySelectorAll(
            ".tab"
        );

    if (!onglets.length) {
        return;
    }


    onglets.forEach(
        tab => {

            /*
             * Evite d'ajouter plusieurs fois
             * le même événement.
             */

            if (
                tab.dataset.adminTabsInitialized ===
                "true"
            ) {
                return;
            }

            tab.dataset.adminTabsInitialized =
                "true";


            tab.addEventListener(
                "click",
                event => {

                    const cible =
                        tab.dataset.tab;

                    if (!cible) {
                        return;
                    }


                    /*
                     * Si l'authentification n'est pas
                     * encore terminée, on ne bloque pas
                     * inutilement le navigateur.
                     *
                     * En pratique, les onglets sont des liens
                     * et le rechargement sera traité par
                     * admin-auth.js.
                     */

                    if (
                        !window.adminAuthReady
                    ) {
                        return;
                    }


                    const autorisation =
                        peutAccederOnglet(
                            cible
                        );


                    /*
                     * Onglet interdit :
                     * empêcher la navigation.
                     */

                    if (
                        autorisation ===
                        false
                    ) {

                        event.preventDefault();

                        activerOngletAdmin(
                            "profileTab"
                        );

                        remettreProfilDansURL();

                        return;
                    }

                    /*
                     * Pour un onglet autorisé,
                     * on NE bloque PAS le clic.
                     *
                     * Le navigateur recharge :
                     *
                     * admin.html?tab=xxxx
                     */
                }
            );
        }
    );
}


/* =========================================================
   INITIALISATION COMPLETE
========================================================= */

function initialiserOngletsAdmin() {

    /*
     * Le DOM doit être disponible.
     */

    if (
        document.readyState ===
        "loading"
    ) {
        return;
    }


    /*
     * Toujours installer les clics.
     */

    initialiserClicsOnglets();


    /*
     * IMPORTANT :
     *
     * Si l'authentification n'est pas terminée,
     * on s'arrête ici.
     *
     * On ne sélectionne surtout PAS profileTab.
     */

    if (
        !window.adminAuthReady
    ) {
        return;
    }


    /*
     * L'authentification est terminée.
     *
     * On peut maintenant appliquer ?tab=...
     */

    appliquerOngletDepuisURL();
}


/* =========================================================
   EXPOSITION
========================================================= */

window.initialiserOngletsAdmin =
    initialiserOngletsAdmin;

window.activerOngletAdmin =
    activerOngletAdmin;

window.obtenirOngletDepuisURL =
    obtenirOngletDepuisURL;

window.appliquerOngletDepuisURL =
    appliquerOngletDepuisURL;


/* =========================================================
   INITIALISATION DOM
========================================================= */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initialiserOngletsAdmin,
        {
            once: true
        }
    );

} else {

    initialiserOngletsAdmin();
}


/* =========================================================
   EXPORTS
========================================================= */

export {
    initialiserOngletsAdmin,
    activerOngletAdmin,
    obtenirOngletDepuisURL,
    appliquerOngletDepuisURL,
    peutAccederOnglet
};
