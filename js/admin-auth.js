/* =========================================================
   AVANT-GARDE — ADMIN AUTH
   js/admin-auth.js

   Gestion de l'authentification de l'espace administration.

   IMPORTANT :
   - Utilise le même client Supabase que l'ancien admin.html.
   - Ne modifie pas la logique métier.
   - Ne modifie pas les droits.
   - Ne modifie pas les profils.
   - Ne modifie pas les onglets.
========================================================= */

import { supabaseClient } from "./supabase.js";


/* =========================================================
   CONNEXION
========================================================= */

const loginForm = document.getElementById("loginForm");

if (loginForm) {

  loginForm.addEventListener("submit", async function (event) {

    event.preventDefault();

    const emailInput =
      document.getElementById("loginEmail");

    const passwordInput =
      document.getElementById("loginPassword");

    const loginButton =
      document.getElementById("loginButton");

    const loginMessage =
      document.getElementById("loginMessage");


    const email =
      emailInput?.value.trim() || "";

    const password =
      passwordInput?.value || "";


    /* -------------------------------------------------------
       Vérification des champs
    ------------------------------------------------------- */

    if (!email || !password) {

      if (typeof afficherMessage === "function") {
        afficherMessage(
          "Veuillez renseigner votre email et votre mot de passe.",
          "error"
        );
      }
      else if (loginMessage) {
        loginMessage.textContent =
          "Veuillez renseigner votre email et votre mot de passe.";
      }

      return;
    }


    /* -------------------------------------------------------
       État du bouton
    ------------------------------------------------------- */

    if (loginButton) {
      loginButton.disabled = true;
      loginButton.textContent = "CONNEXION...";
    }


    if (typeof viderMessage === "function") {
      viderMessage("loginMessage");
    }
    else if (loginMessage) {
      loginMessage.textContent = "";
    }


    try {

      /* -----------------------------------------------------
         AUTH SUPABASE

         C'est volontairement le même appel que dans
         l'ancien admin.html.
      ----------------------------------------------------- */

      const {
        data,
        error
      } =
        await supabaseClient.auth.signInWithPassword({
          email,
          password
        });


      /* -----------------------------------------------------
         Erreur Supabase
      ----------------------------------------------------- */

      if (error) {

        console.error(
          "Erreur Supabase lors de la connexion :",
          error
        );

        if (typeof afficherMessage === "function") {
          afficherMessage(
            "Email ou mot de passe incorrect.",
            "error"
          );
        }
        else if (loginMessage) {
          loginMessage.textContent =
            "Email ou mot de passe incorrect.";
        }

        return;
      }


      /* -----------------------------------------------------
         Vérification de la session
      ----------------------------------------------------- */

      if (!data || !data.user) {

        console.error(
          "Connexion Supabase réussie mais aucun utilisateur retourné."
        );

        if (typeof afficherMessage === "function") {
          afficherMessage(
            "Impossible de récupérer votre compte.",
            "error"
          );
        }
        else if (loginMessage) {
          loginMessage.textContent =
            "Impossible de récupérer votre compte.";
        }

        return;
      }


      /* -----------------------------------------------------
         Utilisateur connecté
      ----------------------------------------------------- */

      window.currentUser = data.user;


      /* -----------------------------------------------------
         Chargement du profil
      ----------------------------------------------------- */

      await verifierUtilisateur();


    }
    catch (error) {

      console.error(
        "Erreur inattendue lors de la connexion :",
        error
      );

      if (typeof afficherMessage === "function") {
        afficherMessage(
          "Une erreur est survenue lors de la connexion.",
          "error"
        );
      }
      else if (loginMessage) {
        loginMessage.textContent =
          "Une erreur est survenue lors de la connexion.";
      }

    }
    finally {

      if (loginButton) {
        loginButton.disabled = false;
        loginButton.textContent = "SE CONNECTER";
      }

    }

  });

}


/* =========================================================
   VÉRIFICATION UTILISATEUR
========================================================= */

async function verifierUtilisateur() {

  try {

    /* -------------------------------------------------------
       Récupération de l'utilisateur Auth actuel
    ------------------------------------------------------- */

    const {
      data: {
        user
      },
      error: authError
    } =
      await supabaseClient.auth.getUser();


    if (authError) {

      console.error(
        "Erreur lors de la récupération de l'utilisateur :",
        authError
      );

      await supabaseClient.auth.signOut();

      if (typeof afficherConnexion === "function") {
        afficherConnexion();
      }

      if (typeof afficherMessage === "function") {
        afficherMessage(
          "Impossible de vérifier votre compte.",
          "error"
        );
      }

      return;
    }


    if (!user) {

      console.error(
        "Aucun utilisateur Supabase Auth connecté."
      );

      if (typeof afficherConnexion === "function") {
        afficherConnexion();
      }

      return;
    }


    /* -------------------------------------------------------
       Stockage de l'utilisateur
    ------------------------------------------------------- */

    window.currentUser = user;


    /* -------------------------------------------------------
       Récupération du profil

       Même requête que dans l'ancien admin.html.
    ------------------------------------------------------- */

    const {
      data: profile,
      error
    } =
      await supabaseClient
        .from("profiles")
        .select(`
          id,
          nom,
          grade,
          email,
          image_url,
          description,
          region,
          competences,
          anonyme,
          facebook_url,
          x_url,
          instagram_url,
          youtube_url,
          tiktok_url,
          audience_max
        `)
        .eq("id", user.id)
        .single();


    /* -------------------------------------------------------
       Profil introuvable / erreur
    ------------------------------------------------------- */

    if (error || !profile) {

      console.error(
        "Erreur lors du chargement du profil :",
        error
      );

      await supabaseClient.auth.signOut();

      if (typeof afficherConnexion === "function") {
        afficherConnexion();
      }

      if (typeof afficherMessage === "function") {
        afficherMessage(
          "Impossible de charger votre profil.",
          "error"
        );
      }

      return;
    }


    /* -------------------------------------------------------
       Profil valide
    ------------------------------------------------------- */

    window.currentProfile = profile;


    /* -------------------------------------------------------
       Affichage de l'administration
    ------------------------------------------------------- */

    if (typeof afficherAdmin === "function") {
      afficherAdmin();
    }


    /* -------------------------------------------------------
       Remplissage du profil
    ------------------------------------------------------- */

    if (typeof remplirProfil === "function") {
      remplirProfil(profile);
    }


    /* -------------------------------------------------------
       Mise à jour éventuelle de l'interface
    ------------------------------------------------------- */

    if (typeof mettreAJourInterfaceAdmin === "function") {
      mettreAJourInterfaceAdmin(profile);
    }

  }
  catch (error) {

    console.error(
      "Erreur dans verifierUtilisateur() :",
      error
    );

    try {
      await supabaseClient.auth.signOut();
    }
    catch (signOutError) {
      console.error(
        "Erreur lors de la déconnexion :",
        signOutError
      );
    }

    if (typeof afficherConnexion === "function") {
      afficherConnexion();
    }

    if (typeof afficherMessage === "function") {
      afficherMessage(
        "Impossible de charger votre profil.",
        "error"
      );
    }

  }

}


/* =========================================================
   DÉCONNEXION
========================================================= */

async function deconnexion() {

  try {

    await supabaseClient.auth.signOut();

  }
  catch (error) {

    console.error(
      "Erreur lors de la déconnexion :",
      error
    );

  }


  window.currentUser = null;
  window.currentProfile = null;


  if (typeof afficherConnexion === "function") {
    afficherConnexion();
  }

}


/* =========================================================
   VÉRIFICATION AUTOMATIQUE AU CHARGEMENT
========================================================= */

async function verifierSessionExistante() {

  try {

    const {
      data: {
        session
      },
      error
    } =
      await supabaseClient.auth.getSession();


    if (error) {

      console.error(
        "Erreur lors de la récupération de la session :",
        error
      );

      return;
    }


    if (!session || !session.user) {
      return;
    }


    window.currentUser = session.user;

    await verifierUtilisateur();

  }
  catch (error) {

    console.error(
      "Erreur lors de la vérification de la session :",
      error
    );

  }

}


/* =========================================================
   EXPOSITION GLOBALE

   Les autres modules de l'ancien admin.html fonctionnaient
   dans le même scope global.

   On conserve donc ces fonctions accessibles globalement.
========================================================= */

window.verifierUtilisateur =
  verifierUtilisateur;

window.deconnexion =
  deconnexion;

window.verifierSessionExistante =
  verifierSessionExistante;


/* =========================================================
   INITIALISATION
========================================================= */

verifierSessionExistante();

