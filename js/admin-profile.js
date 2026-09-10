/* =========================================================
   AVANT-GARDE — ADMIN PROFIL
   js/admin-profile.js

   Gestion du profil de l'utilisateur connecté :
   - Remplissage du profil
   - Sauvegarde du profil
   - Gestion des compétences métier
   - Gestion des rôles
   - Gestion du changement de région
   - Gestion du changement d'e-mail
   - Gestion de la médaille VIP
========================================================= */


/* =========================================================
   REMPLIR PROFIL
========================================================= */

function remplirProfil(profile){

  document
    .getElementById("profileNom")
    .value =
      profile.nom || "";


  document
    .getElementById("profileEmail")
    .value =
      profile.email ||
      currentUser.email ||
      "";


  document
    .getElementById("profileRegion")
    .value =
      profile.region || "";


  document
    .getElementById("profileImage")
    .value =
      profile.image_url || "";


  document
    .getElementById("profileDescription")
    .value =
      profile.description || "";


  document
    .getElementById("profileFacebook")
    .value =
      profile.facebook_url || "";


  document
    .getElementById("profileX")
    .value =
      profile.x_url || "";


  document
    .getElementById("profileInstagram")
    .value =
      profile.instagram_url || "";


  document
    .getElementById("profileYoutube")
    .value =
      profile.youtube_url || "";


  document
    .getElementById("profileTiktok")
    .value =
      profile.tiktok_url || "";


  mettreAJourMedailleVIP(
    profile.audience_max
  );


  if(profile.anonyme){

    document
      .getElementById("profileAnonyme")
      .checked = true;

  }else{

    document
      .getElementById("profileAffiche")
      .checked = true;

  }


  const competences =
    normaliserCompetences(
      profile.competences
    );


  synchroniserCompetencesEtRoles(
    competences
  );


  mettreAJourCompteur();

}


/* =========================================================
   SAUVEGARDE PROFIL
========================================================= */

profileForm.addEventListener(
  "submit",
  async event => {

    event.preventDefault();

    viderMessage(profileMessage);

    saveProfileButton.disabled = true;

    saveProfileButton.textContent =
      "ENREGISTREMENT…";


    const nom =
      document
        .getElementById("profileNom")
        .value
        .trim();


    const email =
      document
        .getElementById("profileEmail")
        .value
        .trim()
        .toLowerCase();


    const region =
      document
        .getElementById("profileRegion")
        .value;


    const image_url =
      document
        .getElementById("profileImage")
        .value
        .trim();


    const description =
      document
        .getElementById("profileDescription")
        .value
        .trim();


    const facebook_url =
      document
        .getElementById("profileFacebook")
        .value
        .trim();


    const x_url =
      document
        .getElementById("profileX")
        .value
        .trim();


    const instagram_url =
      document
        .getElementById("profileInstagram")
        .value
        .trim();


    const youtube_url =
      document
        .getElementById("profileYoutube")
        .value
        .trim();


    const tiktok_url =
      document
        .getElementById("profileTiktok")
        .value
        .trim();


    const anonyme =
      document
        .getElementById("profileAnonyme")
        .checked;


    /*
      Les compétences métier sont sélectionnées
      dans le PROFIL.

      Les rôles sont stockés dans la même colonne
      Supabase "competences".

      On fusionne donc les deux listes.
    */

    const anciennesCompetences =
      normaliserCompetences(
        currentProfile?.competences
      );


    const competencesMetier =
      Array.from(
        document.querySelectorAll(
          'input[name="competences"]:checked'
        )
      )
      .map(
        input =>
          input.value
      );


    const anciensRoles =
      anciennesCompetences.filter(
        competence =>
          ROLES.includes(
            competence
          )
      );


    const rolesSelectionnes =
      Array.from(
        document.querySelectorAll(
          'input[name="roles"]:checked'
        )
      )
      .map(
        input =>
          input.value
      );


    /*
      Si l'utilisateur possède actuellement un grade2,
      les cases ROLE affichées sont la source de vérité.

      Si grade2 est vide, l'accès ROLE est absent :
      on conserve donc les anciens rôles existants.

      EXCEPTION :
      si l'utilisateur change de région alors qu'il
      possède un poste régional (Militant ou
      Délégué Régional), tous ses rôles doivent être
      supprimés avec son poste régional.
    */

    const ancienneRegion =
      currentProfile?.region || "";


    const ancienneGrade2 =
      currentProfile?.grade2 || null;


    const changementRegion =
      region !== ancienneRegion;


    const perteDroitsRegionaux =
      changementRegion &&
      (
        ancienneGrade2 === "Délégué Régional" ||
        ancienneGrade2 === "Militant"
      );


    const rolesFinaux =
      perteDroitsRegionaux
        ? []
        : (
            peutGererRole()
              ? rolesSelectionnes
              : anciensRoles
          );


    const competences =
      Array.from(
        new Set([
          ...competencesMetier,
          ...rolesFinaux
        ])
      );


    if(!nom || !region || !email){

      afficherMessage(
        profileMessage,
        "error",
        "Le nom, l'adresse e-mail et la région sont obligatoires."
      );

      saveProfileButton.disabled = false;

      saveProfileButton.textContent =
        "ENREGISTRER LES MODIFICATIONS";

      return;

    }


    const emailValide =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        email
      );


    if(!emailValide){

      afficherMessage(
        profileMessage,
        "error",
        "Veuillez saisir une adresse e-mail valide."
      );

      saveProfileButton.disabled = false;

      saveProfileButton.textContent =
        "ENREGISTRER LES MODIFICATIONS";

      return;

    }


    if(description.length > 300){

      afficherMessage(
        profileMessage,
        "error",
        "La description ne peut pas dépasser 300 caractères."
      );

      saveProfileButton.disabled = false;

      saveProfileButton.textContent =
        "ENREGISTRER LES MODIFICATIONS";

      return;

    }


    if(perteDroitsRegionaux){

      const confirmerChangement =
        confirm(
          "Attention : si vous changez de région, vous perdrez vos droits régionaux (« " +
          ancienneGrade2 +
          " »).\n\n" +
          "Votre fonction régionale ainsi que vos rôles seront automatiquement supprimés.\n\n" +
          "Voulez-vous confirmer ce changement de région ?"
        );


      if(!confirmerChangement){

        saveProfileButton.disabled = false;

        saveProfileButton.textContent =
          "ENREGISTRER LES MODIFICATIONS";

        return;

      }

    }


    const grade2ApresChangement =
      perteDroitsRegionaux
        ? null
        : currentProfile?.grade2 || null;


    const ancienEmailAuth =
      (currentUser?.email || "")
        .trim()
        .toLowerCase();


    const changementEmail =
      email !== ancienEmailAuth;


    if(changementEmail){

      const {
        error:authEmailError
      } =
        await supabaseClient.auth.updateUser({
          email:email
        });


      if(authEmailError){

        console.error(
          "Erreur changement email Auth :",
          authEmailError
        );


        afficherMessage(
          profileMessage,
          "error",
          "Impossible de modifier l'adresse e-mail. Vérifiez l'adresse saisie et les paramètres de confirmation de Supabase."
        );


        saveProfileButton.disabled = false;

        saveProfileButton.textContent =
          "ENREGISTRER LES MODIFICATIONS";

        return;

      }

    }


    const {
      data,
      error
    } =
      await supabaseClient
        .from("profiles")
        .update({

          nom:
            nom,

          email:
            email,

          image_url:
            image_url || null,

          description:
            description || null,

          region:
            region,

          competences:
            competences,

          anonyme:
            anonyme,

          facebook_url:
            facebook_url || null,

          x_url:
            x_url || null,

          instagram_url:
            instagram_url || null,

          youtube_url:
            youtube_url || null,

          tiktok_url:
            tiktok_url || null,

          ...(perteDroitsRegionaux
            ? { grade2:null }
            : {})

        })
        .eq(
          "id",
          currentUser.id
        )
        .select()
        .single();


    if(error){

      console.error(
        "Erreur sauvegarde profil :",
        error
      );


      afficherMessage(
        profileMessage,
        "error",
        "Impossible d'enregistrer les modifications. Vérifiez les droits de la table profiles dans Supabase."
      );


      saveProfileButton.disabled = false;

      saveProfileButton.textContent =
        "ENREGISTRER LES MODIFICATIONS";

      return;

    }


    /*
      Mise à jour du profil global.
    */

    currentProfile =
      data;


    /*
      Si le poste régional vient d'être supprimé,
      on force également le décochage visuel de
      toutes les cases ROLE.

      Les rôles ont déjà été supprimés de la colonne
      competences avant la sauvegarde.
    */

    if(perteDroitsRegionaux){

      document
        .querySelectorAll(
          'input[name="roles"]'
        )
        .forEach(
          input => {

            input.checked = false;

          }
        );

    }


    synchroniserCompetencesEtRoles(
      data.competences
    );


    /*
      Mise à jour de la visibilité de ROLE
      après une éventuelle modification de grade2.
    */

    const roleButton =
      document.getElementById(
        "roleTabButton"
      );


    if(peutGererRole()){

      if(roleButton){

        roleButton.style.display =
          "block";

      }

    }else{

      if(roleButton){

        roleButton.style.display =
          "none";

      }


      /*
        Si ROLE vient de disparaître alors
        que l'utilisateur était dessus,
        on revient automatiquement sur PROFIL.
      */

      const roleTab =
        document.getElementById(
          "roleTab"
        );


      if(
        roleTab &&
        roleTab.classList.contains("active")
      ){

        document
          .querySelectorAll(".tab")
          .forEach(
            tab =>
              tab.classList.remove(
                "active"
              )
          );


        document
          .querySelectorAll(".tab-content")
          .forEach(
            content =>
              content.classList.remove(
                "active"
              )
          );


        const profileTabButton =
          document.querySelector(
            '.tab[data-tab="profileTab"]'
          );


        if(profileTabButton){

          profileTabButton.classList.add(
            "active"
          );

        }


        const profileTab =
          document.getElementById(
            "profileTab"
          );


        if(profileTab){

          profileTab.classList.add(
            "active"
          );

        }

      }

    }


    if(changementEmail){

      afficherMessage(
        profileMessage,
        "success",
        "Votre profil a bien été mis à jour. Un e-mail de confirmation peut vous être envoyé pour valider votre nouvelle adresse."
      );

    }else{

      afficherMessage(
        profileMessage,
        "success",
        perteDroitsRegionaux
          ? "Votre profil a bien été mis à jour. Votre fonction régionale et vos rôles ont été supprimés."
          : "Votre profil a bien été mis à jour."
      );

    }


    mettreAJourMedailleVIP(
      data.audience_max
    );


    document
      .getElementById("adminUser")
      .innerHTML =
        "Connecté en tant que <strong>" +
        (data.nom || currentUser.email) +
        "</strong>";


    if(perteDroitsRegionaux){

      await chargerGestionEquipes();

    }


    saveProfileButton.disabled = false;

    saveProfileButton.textContent =
      "ENREGISTRER LES MODIFICATIONS";

  }
);
