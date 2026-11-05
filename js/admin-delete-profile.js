/* =========================================================
   AVANT-GARDE — ADMIN
   js/admin-delete-profile.js

   Suppression définitive du compte connecté :
   - fiche publique dans public.profiles ;
   - compte d'authentification dans auth.users
     via la fonction Edge sécurisée delete-account.
========================================================= */

const openDeleteButton = document.getElementById("openDeleteModal");
const closeDeleteButton = document.getElementById("closeDeleteModal");
const confirmDeleteButton = document.getElementById("confirmDelete");
const deleteModalElement = document.getElementById("deleteModal");

if (openDeleteButton) {
  openDeleteButton.addEventListener("click", () => {
    document.getElementById("deleteConfirmation").value = "";
    viderMessage(document.getElementById("deleteMessage"));
    deleteModalElement.classList.add("active");
    document.body.style.overflow = "hidden";
  });
}

if (closeDeleteButton) {
  closeDeleteButton.addEventListener("click", fermerDeleteModal);
}

function fermerDeleteModal() {
  deleteModalElement.classList.remove("active");
  document.body.style.overflow = "";
}

if (confirmDeleteButton) {
  confirmDeleteButton.addEventListener("click", async () => {
    const confirmation = document.getElementById("deleteConfirmation").value.trim();
    const message = document.getElementById("deleteMessage");

    if (confirmation !== "SUPPRIMER") {
      afficherMessage(message, "error", "La confirmation est incorrecte.");
      return;
    }

    if (!window.currentUser?.id) {
      afficherMessage(message, "error", "Session introuvable. Reconnectez-vous avant de réessayer.");
      return;
    }

    const button = confirmDeleteButton;
    button.disabled = true;
    button.textContent = "SUPPRESSION…";
    viderMessage(message);

    try {
      const { data, error } = await supabaseClient.functions.invoke("delete-account", {
        method: "POST"
      });

      if (error) {
        let detail = error.message || "Erreur lors de la suppression.";
        if (error.context && typeof error.context.json === "function") {
          try {
            const body = await error.context.json();
            if (body?.error) detail = body.error;
          } catch (_) {}
        }
        throw new Error(detail);
      }

      if (!data?.success) {
        throw new Error(data?.error || "La suppression n'a pas été confirmée.");
      }

      await supabaseClient.auth.signOut();

      fermerDeleteModal();
      document.getElementById("adminScreen").style.display = "none";
      document.getElementById("loginScreen").style.display = "flex";

      afficherMessage(
        document.getElementById("loginMessage"),
        "success",
        "Votre compte et votre profil ont été supprimés."
      );

    } catch (error) {
      console.error("Erreur suppression compte :", error);
      afficherMessage(
        message,
        "error",
        error.message || "Impossible de supprimer le compte. Réessayez ou contactez l'administration."
      );

      button.disabled = false;
      button.textContent = "CONFIRMER LA SUPPRESSION";
    }
  });
}
