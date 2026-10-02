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


    /*
     * Si l'onglet demandé existe,
     * on l'utilise.
     */

    if (
        tab &&
        ONGLETS_ADMIN_AUTORISES.includes(
            tab
        )
    ) {

        return tab;

    }


    /*
     * Par défaut :
     * PROFIL
     */

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


    /*
     * Vérifie que l'onglet demandé
     * existe réellement dans la page.
     */

    const contenu =
        document.getElementById(
            cible
        );


    if (!contenu) {

        /*
         * Si le contenu n'existe pas,
         * on revient au profil.
         */

        cible =
            "profileTab";

    }


    /* -----------------------------------------------------
       DESACTIVATION DE TOUS LES ONGLETS
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
       DESACTIVATION DE TOUS LES CONTENUS
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
       ACTIVATION DU BON BOUTON
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
       ACTIVATION DU BON CONTENU
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
   VERIFICATION DES DROITS
========================================================= */

function peutAccederOnglet(
    cible
) {

    /* -----------------------------------------------------
       SECURITE — ONGLET RDV
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
       SECURITE — ONGLET ROLE
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


    return true;

}


/* =========================================================
   INITIALISATION DES ONGLETS
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
     * -----------------------------------------------------
     * CLIC SUR UN ONGLET
     * -----------------------------------------------------
     *
     * Les onglets sont maintenant des <a>.
     *
     * On NE bloque PAS la navigation.
     *
     * Le navigateur recharge donc complètement :
     *
     * admin.html?tab=statsTab
     *
     * Cela permet de relancer tous les modules JS
     * et de recharger les données Supabase.
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
                     * Vérification des droits avant
                     * de laisser la navigation s'effectuer.
                     */

                    if (
                        !peutAccederOnglet(
                            cible
                        )
                    ) {

                        event.preventDefault();

                        return;

                    }


                    /*
                     * Pour les <a href="...">,
                     * aucune autre action n'est nécessaire.
                     *
                     * Le navigateur recharge la page.
                     */

                }
            );

        }
    );


    /* -----------------------------------------------------
       ACTIVATION AU CHARGEMENT
    ----------------------------------------------------- */

    const ongletDemandé =
        obtenirOngletDepuisURL();


    /*
     * On vérifie les droits de l'onglet demandé.
     *
     * Si l'utilisateur n'a pas accès,
     * on revient au profil.
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


    activerOngletAdmin(
        ongletDemandé
    );

}


/* =========================================================
   EXPOSITION
========================================================= */

window.initialiserOngletsAdmin =
    initialiserOngletsAdmin;


/* =========================================================
   EXPOSITION — ACTIVATION MANUELLE
========================================================= */

window.activerOngletAdmin =
    activerOngletAdmin;


/* =========================================================
   INITIALISATION
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
