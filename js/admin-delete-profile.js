/* =========================================================
   AVANT-GARDE — ADMIN
   js/admin-delete-profile.js

   Suppression du profil de l'utilisateur connecté.
========================================================= */


/* =========================================================
   OUVERTURE MODAL SUPPRESSION PROFIL
========================================================= */

document
  .getElementById("openDeleteModal")
  .addEventListener(
    "click",
    () => {

      document
        .getElementById("deleteConfirmation")
        .value = "";


      viderMessage(
        document.getElementById(
          "deleteMessage"
        )
      );


      deleteModal.classList.add(
        "active"
      );


      document.body.style.overflow =
        "hidden";

    }
  );


/* =========================================================
   FERMETURE MODAL
========================================================= */

document
  .getElementById("closeDeleteModal")
  .addEventListener(
    "click",
    fermerDeleteModal
  );


function fermerDeleteModal(){

  deleteModal.classList.remove(
    "active"
  );


  document.body.style.overflow =
    "";

}


/* =========================================================
   CONFIRMATION SUPPRESSION
========================================================= */

document
  .getElementById("confirmDelete")
  .addEventListener(
    "click",
    async () => {

      const confirmation =
        document
          .getElementById("deleteConfirmation")
          .value
          .trim();


      const message =
        document.getElementById(
          "deleteMessage"
        );


      if(
        confirmation !== "SUPPRIMER"
      ){

        afficherMessage(
          message,
          "error",
          "La confirmation est incorrecte."
        );

        return;
      }


      const button =
        document.getElementById(
          "confirmDelete"
        );


      button.disabled = true;


      button.textContent =
        "SUPPRESSION…";


      const {error} =
        await supabaseClient
          .from("profiles")
          .delete()
          .eq(
            "id",
            currentUser.id
          );


      if(error){

        console.error(
          "Erreur suppression profil :",
          error
        );


        afficherMessage(
          message,
          "error",
          "Impossible de supprimer votre page. Vérifiez les politiques RLS de Supabase."
        );


        button.disabled = false;


        button.textContent =
          "CONFIRMER LA SUPPRESSION";


        return;
      }


      await supabaseClient.auth.signOut();


      fermerDeleteModal();


      adminScreen.style.display =
        "none";


      loginScreen.style.display =
        "flex";

    }
  );
