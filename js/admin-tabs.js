/* =========================================================
   AVANT-GARDE — ADMIN TABS

   js/admin-tabs.js

   Gestion des onglets de l'espace membre :

   - Navigation entre les onglets SANS rechargement de page
   - Mise à jour de l'URL via ?tab=
   - Lecture de l'onglet demandé via ?tab=
   - Gestion du bouton précédent / suivant du navigateur
   - Vérification des droits RDV
   - Vérification des droits ROLE
   - Vérification des droits EQUIPES
   - Vérification du CONTENU PROJET

   IMPORTANT :

   L'authentification est prioritaire.

   Tant que admin-auth.js n'a pas terminé de charger
   l'utilisateur et son profil :

       window.adminAuthReady = false

   Une fois le profil chargé :

       window.adminAuthReady = true

   Le changement d'onglet est ensuite effectué
   directement dans la page, sans rechargement complet.

========================================================= */


/* =========================================================
   ETAT D'AUTHENTIFICATION
========================================================= */

/*
 * admin-tabs.js peut être chargé avant admin-auth.js.
 *
 * On initialise donc l'état uniquement s'il n'existe pas
 * encore.
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

    /* =====================================================
       PROFIL
    ===================================================== */

    if (
        cible ===
        "profileTab"
    ) {

        return true;
    }


    /* =====================================================
       RDV
    ===================================================== */

    if (
        cible ===
        "rdvTab"
    ) {

        /*
         * L'authentification n'est pas terminée.
         *
         * null signifie :
         * "attendre avant de décider".
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


    /* =====================================================
       ROLE
    ===================================================== */

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


    /* =====================================================
       EQUIPES
    ===================================================== */

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


    /* =====================================================
       CONTENU PROJET
    ===================================================== */

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


    /* =====================================================
       AUTRES CONTENUS
    ===================================================== */

    if (
        cible ===
            "contentOtherTab"

        ||

        cible ===
            "statsTab"
    ) {

        return true;
    }


    /* =====================================================
       SECURITE
    ===================================================== */

    return false;
}


/* =========================================================
   MISE A JOUR DE L'URL
========================================================= */

function mettreOngletDansURL(
    cible,
    remplacer = false
) {

    try {

        const url =
            new URL(
                window.location.href
            );


        url.searchParams.set(
            "tab",
            cible
        );


        if (remplacer) {

            window.history.replaceState(
                {
                    tab: cible
                },
                "",
                url.toString()
            );

        } else {

            window.history.pushState(
                {
                    tab: cible
                },
                "",
                url.toString()
            );
        }

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
   RETOUR AU PROFIL DANS L'URL
========================================================= */

function remettreProfilDansURL() {

    mettreOngletDansURL(
        "profileTab",
        true
    );
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


    /* =====================================================
       DESACTIVATION DES ONGLETS
    ===================================================== */

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


    /* =====================================================
       DESACTIVATION DES CONTENUS
    ===================================================== */

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


    /* =====================================================
       ACTIVATION ONGLET VISUEL
    ===================================================== */

    const onglet =
        document.querySelector(
            `.tab[data-tab="${cible}"]`
        );


    if (onglet) {

        onglet.classList.add(
            "active"
        );
    }


    /* =====================================================
       ACTIVATION CONTENU
    ===================================================== */

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
   CHANGEMENT D'ONGLET
========================================================= */

/*
 * Fonction centrale de navigation.
 *
 * Elle remplace désormais le comportement précédent
 * consistant à laisser le navigateur recharger admin.html.
 */

function changerOngletAdmin(
    cible,
    mettreAJourHistorique = true
) {

    if (!cible) {

        cible =
            "profileTab";
    }


    /* =====================================================
       AUTHENTIFICATION
    ===================================================== */

    if (
        !window.adminAuthReady
    ) {

        return;
    }


    /* =====================================================
       VERIFICATION DES DROITS
    ===================================================== */

    const autorisation =
        peutAccederOnglet(
            cible
        );


    /*
     * null :
     * authentification pas encore disponible.
     */

    if (
        autorisation ===
        null
    ) {

        return;
    }


    /* =====================================================
       ONGLET INTERDIT
    ===================================================== */

    if (
        autorisation ===
        false
    ) {

        /*
         * On revient au profil.
         *
         * replaceState évite de créer une entrée
         * supplémentaire dans l'historique.
         */

        remettreProfilDansURL();


        activerOngletAdmin(
            "profileTab"
        );


        return;
    }


    /* =====================================================
       ONGLET AUTORISÉ
    ===================================================== */

    if (
        mettreAJourHistorique
    ) {

        mettreOngletDansURL(
            cible
        );
    }


    activerOngletAdmin(
        cible
    );


    /*
     * Permet aux autres modules de réagir à l'ouverture
     * d'un onglet sans provoquer de rechargement de page.
     */

    window.dispatchEvent(
        new CustomEvent(
            "avantgarde:admin-tab-changed",
            {
                detail: {
                    tab: cible
                }
            }
        )
    );
}


/* =========================================================
   APPLICATION DE L'ONGLET DEPUIS L'URL
========================================================= */

function appliquerOngletDepuisURL() {

    /*
     * Tant que l'authentification n'est pas terminée,
     * on ne touche à aucun onglet.
     */

    if (
        !window.adminAuthReady
    ) {

        return;
    }


    const ongletDemandé =
        obtenirOngletDepuisURL();


    const autorisation =
        peutAccederOnglet(
            ongletDemandé
        );


    /*
     * L'authentification n'est finalement pas prête.
     */

    if (
        autorisation ===
        null
    ) {

        return;
    }


    /* =====================================================
       ONGLET INTERDIT
    ===================================================== */

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


    /* =====================================================
       ONGLET AUTORISÉ
    ===================================================== */

    activerOngletAdmin(
        ongletDemandé
    );


    /*
     * Informe les modules que l'onglet demandé
     * depuis l'URL vient d'être ouvert.
     */

    window.dispatchEvent(
        new CustomEvent(
            "avantgarde:admin-tab-changed",
            {
                detail: {
                    tab: ongletDemandé
                }
            }
        )
    );
}


/* =========================================================
   CLICS SUR LES ONGLETS
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
             * Evite les doubles listeners.
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
                     * IMPORTANT :
                     *
                     * On bloque maintenant le comportement
                     * naturel du lien.
                     *
                     * Cela empêche le rechargement complet
                     * de admin.html.
                     */

                    event.preventDefault();


                    /*
                     * Le changement est effectué
                     * directement dans la page.
                     */

                    changerOngletAdmin(
                        cible,
                        true
                    );
                }
            );
        }
    );
}


/* =========================================================
   BOUTONS PRECEDENT / SUIVANT DU NAVIGATEUR
========================================================= */

function initialiserHistoriqueOnglets() {

    /*
     * Evite de créer plusieurs listeners.
     */

    if (
        window.adminTabsHistoryInitialized
    ) {

        return;
    }


    window.adminTabsHistoryInitialized =
        true;


    window.addEventListener(
        "popstate",
        () => {

            /*
             * Le navigateur vient de modifier
             * ?tab=...
             *
             * On applique simplement l'onglet
             * correspondant sans créer une nouvelle
             * entrée dans l'historique.
             */

            if (
                !window.adminAuthReady
            ) {

                return;
            }


            appliquerOngletDepuisURL();
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
     * Installation des clics.
     */

    initialiserClicsOnglets();


    /*
     * Installation de la navigation navigateur.
     */

    initialiserHistoriqueOnglets();


    /*
     * Tant que l'authentification n'est pas terminée,
     * on ne sélectionne aucun onglet.
     */

    if (
        !window.adminAuthReady
    ) {

        return;
    }


    /*
     * L'authentification est terminée :
     * application de ?tab=...
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

window.changerOngletAdmin =
    changerOngletAdmin;


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

    peutAccederOnglet,

    changerOngletAdmin

};
