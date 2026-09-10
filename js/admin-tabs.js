/* =========================================================
   AVANT-GARDE — ADMIN TABS
   js/admin-tabs.js

   Gestion des onglets de l'espace membre :

   - Activation des onglets
   - Affichage du contenu correspondant
   - Vérification des droits RDV
   - Vérification des droits ROLE

   IMPORTANT :
   - Ne gère PAS la visibilité initiale des onglets.
   - La visibilité est gérée par les modules d'authentification
     et de gestion des droits.
========================================================= */


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


    onglets.forEach(
        tab => {

            /*
             * Evite de brancher plusieurs fois
             * les mêmes événements si l'initialisation
             * est appelée plusieurs fois.
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
                () => {

                    /* -------------------------------------------------
                       SECURITE — ONGLET RDV
                    ------------------------------------------------- */

                    if (
                        tab.id ===
                        "rdvTabButton"
                    ) {

                        if (
                            typeof window.peutGererRendezVous ===
                                "function" &&
                            !window.peutGererRendezVous()
                        ) {

                            return;
                        }
                    }


                    /* -------------------------------------------------
                       SECURITE — ONGLET ROLE
                    ------------------------------------------------- */

                    if (
                        tab.id ===
                        "roleTabButton"
                    ) {

                        if (
                            typeof window.peutGererRole ===
                                "function" &&
                            !window.peutGererRole()
                        ) {

                            return;
                        }
                    }


                    /* -------------------------------------------------
                       DESACTIVATION DE TOUS LES ONGLETS
                    ------------------------------------------------- */

                    document
                        .querySelectorAll(
                            ".tab"
                        )
                        .forEach(
                            t =>
                                t.classList.remove(
                                    "active"
                                )
                        );


                    /* -------------------------------------------------
                       DESACTIVATION DE TOUS LES CONTENUS
                    ------------------------------------------------- */

                    document
                        .querySelectorAll(
                            ".tab-content"
                        )
                        .forEach(
                            content =>
                                content.classList.remove(
                                    "active"
                                )
                        );


                    /* -------------------------------------------------
                       ACTIVATION DE L'ONGLET CLIQUE
                    ------------------------------------------------- */

                    tab.classList.add(
                        "active"
                    );


                    /* -------------------------------------------------
                       ACTIVATION DU CONTENU CORRESPONDANT
                    ------------------------------------------------- */

                    const cible =
                        tab.dataset.tab;


                    if (!cible) {

                        return;
                    }


                    const contenu =
                        document.getElementById(
                            cible
                        );


                    if (contenu) {

                        contenu.classList.add(
                            "active"
                        );
                    }

                }
            );

        }
    );

}


/* =========================================================
   EXPOSITION
========================================================= */

window.initialiserOngletsAdmin =
    initialiserOngletsAdmin;


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
