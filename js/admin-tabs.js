/* =========================================================
   AVANT-GARDE — ADMIN TABS
   js/admin-tabs.js

   Gestion des onglets de l'espace membre :

   - Activation des onglets
   - Affichage du contenu correspondant
   - Vérification des droits RDV
   - Vérification des droits ROLE
========================================================= */


/* =========================================================
   ONGLETS
========================================================= */

document
  .querySelectorAll(".tab")
  .forEach(tab => {

    tab.addEventListener(
      "click",
      () => {

        /* -------------------------------------------------
           SECURITE — ONGLET RDV
        ------------------------------------------------- */

        if(
          tab.id === "rdvTabButton" &&
          typeof window.peutGererRendezVous === "function" &&
          !window.peutGererRendezVous()
        ){

          return;

        }


        /* -------------------------------------------------
           SECURITE — ONGLET ROLE
        ------------------------------------------------- */

        if(
          tab.id === "roleTabButton" &&
          typeof window.peutGererRole === "function" &&
          !window.peutGererRole()
        ){

          return;

        }


        /* -------------------------------------------------
           DESACTIVATION DE TOUS LES ONGLETS
        ------------------------------------------------- */

        document
          .querySelectorAll(".tab")
          .forEach(t =>
            t.classList.remove("active")
          );


        /* -------------------------------------------------
           DESACTIVATION DE TOUS LES CONTENUS
        ------------------------------------------------- */

        document
          .querySelectorAll(".tab-content")
          .forEach(content =>
            content.classList.remove("active")
          );


        /* -------------------------------------------------
           ACTIVATION DE L'ONGLET CLIQUE
        ------------------------------------------------- */

        tab.classList.add("active");


        /* -------------------------------------------------
           ACTIVATION DU CONTENU CORRESPONDANT
        ------------------------------------------------- */

        const contenu =
          document.getElementById(
            tab.dataset.tab
          );


        if(contenu){

          contenu.classList.add("active");

        }

      }
    );

  });
