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

   IMPORTANT :
   - La visibilité initiale des onglets n'est PAS gérée ici.
   - La visibilité est gérée par les modules d'authentification
     et de gestion des droits.
   - L'onglet demandé dans l'URL n'est activé qu'après
     chargement du profil utilisateur.
========================================================= */


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
   RÉCUPÉRATION DE L'ONGLET DEMANDÉ
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
   ACTIVATION D'UN ONGLET
========================================================= */

function activerOngletAdmin(
    cible
) {

    if (!cible) {

        cible =
            "profileTab";
    }


    const contenu =
        document.getElementById(
            cible
        );


    if (!contenu) {

        cible =
            "profileTab";
    }


    /* -----------------------------------------------------
       Désactivation de tous les onglets
    ----------------------------------------------------- */

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


    /* -----------------------------------------------------
       Désactivation de tous les contenus
    ----------------------------------------------------- */

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


    /* -----------------------------------------------------
       Activation de l'onglet correspondant
    ----------------------------------------------------- */

    const onglet =
        document.querySelector(
            `.tab[data-tab="${cible}"]`
        );


    if (onglet) {

        onglet.classList.add(
            "active"
        );
    }


    /* -----------------------------------------------------
       Activation du contenu correspondant
    ----------------------------------------------------- */

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
   VÉRIFICATION DES DROITS
========================================================= */

function peutAccederOnglet(
    cible
) {

    /* -----------------------------------------------------
       RDV
    ----------------------------------------------------- */

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
    }


    /* -----------------------------------------------------
       ROLE
    ----------------------------------------------------- */

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
    }


    /*
     * Les autres onglets ne sont pas contrôlés ici.
     *
     * Leur visibilité est gérée par les modules
     * correspondants.
     */

    return true;
}


/* =========================================================
   INITIALISATION DES CLICS
========================================================= */

function initialiserOngletsAdmin() {

    const onglets =
        document.querySelectorAll(
            ".tab"
        );


    if (!onglets.length) {

        return;
    }


    /*
     * Les onglets sont des <a>.
     *
     * On ne bloque PAS leur navigation.
     *
     * Le navigateur recharge donc complètement :
     *
     * admin.html?tab=rdvTab
     * admin.html?tab=roleTab
     * etc.
     */

    onglets.forEach(
        tab => {

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
                     * Si le profil utilisateur est déjà chargé,
                     * on peut vérifier immédiatement les droits.
                     *
                     * En revanche, si l'authentification n'est
                     * pas encore terminée, on laisse la navigation
                     * se faire normalement.
                     *
                     * La nouvelle page attendra alors que
                     * admin-auth.js charge le profil avant
                     * d'activer l'onglet.
                     */

                    if (
                        window.currentProfile &&
                        !peutAccederOnglet(
                            cible
                        )
                    ) {

                        event.preventDefault();

                        return;
                    }


                    /*
                     * Aucune autre action.
                     *
                     * Le <a href="..."> effectue le rechargement
                     * complet de la page.
                     */
                }
            );
        }
    );
}


/* =========================================================
   ACTIVATION DE L'ONGLET DEMANDÉ APRÈS AUTHENTIFICATION
========================================================= */

/*
 * IMPORTANT :
 *
 * Cette fonction ne doit être appelée qu'après que
 * admin-auth.js a chargé window.currentProfile.
 *
 * C'est elle qui corrige le problème de redirection
 * automatique vers PROFIL.
 */

function initialiserOngletDemandeAdmin() {

    /*
     * Si le profil n'est pas encore chargé,
     * on ne prend aucune décision.
     */

    if (!window.currentProfile) {

        return;
    }


    const ongletDemandé =
        obtenirOngletDepuisURL();


    /*
     * Vérification des droits APRÈS chargement du profil.
     */

    if (
        !peutAccederOnglet(
            ongletDemandé
        )
    ) {

        activerOngletAdmin(
            "profileTab"
        );

        return;
    }


    /*
     * Le profil est maintenant connu et les droits
     * peuvent être correctement évalués.
     */

    activerOngletAdmin(
        ongletDemandé
    );
}


/* =========================================================
   EXPOSITION — INITIALISATION DES CLICS
========================================================= */

window.initialiserOngletsAdmin =
    initialiserOngletsAdmin;


/* =========================================================
   EXPOSITION — ACTIVATION MANUELLE
========================================================= */

window.activerOngletAdmin =
    activerOngletAdmin;


/* =========================================================
   EXPOSITION — ACTIVATION APRÈS AUTHENTIFICATION
========================================================= */

window.initialiserOngletDemandeAdmin =
    initialiserOngletDemandeAdmin;


/* =========================================================
   INITIALISATION
========================================================= */

/*
 * IMPORTANT :
 *
 * On initialise uniquement les événements de clic ici.
 *
 * On NE tente PLUS d'activer immédiatement ?tab=...
 *
 * En effet, admin-auth.js est chargé après ce module
 * et le profil Supabase n'est pas encore disponible.
 *
 * L'activation de l'onglet demandé sera effectuée par :
 *
 * window.initialiserOngletDemandeAdmin()
 *
 * une fois l'utilisateur authentifié.
 */

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
