/* =========================================================
   AVANT-GARDE — ADMIN CORE
   js/admin-core.js

   Cœur de l'espace membre :

   - Connexion
   - Vérification utilisateur
   - Déconnexion
   - Chargement du profil
   - Remplissage du profil
   - Sauvegarde du profil
   - Gestion des rôles
   - Médaille VIP
   - Compteur description
   - Gestion des onglets
   - Variables communes à l'administration

   Les modules suivants restent séparés :

   - admin-events.js
   - admin-team.js
   - admin-delete-profile.js
========================================================= */


/* =========================================================
   SUPABASE
========================================================= */

const SUPABASE_URL =
  "https://wlhtegrciehmtxqecopv.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_eBPx2UZFdHbLzxSgoBor-Q_FJobVvjs";

const supabaseClient =
  supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );


/* =========================================================
   VARIABLES UTILISATEUR
========================================================= */

let currentUser = null;

let currentProfile = null;


/* =========================================================
   GESTION DES EQUIPES
========================================================= */

let tousLesMembres = [];

let regionsEquipe = [];

let regionEquipeActive = null;


/* =========================================================
   ROLES
========================================================= */

const ROLES = [

  "Organisateurs de terrain",

  "Conférenciers",

  "Influenceurs Réseaux Sociaux",

  "Parrains/marraines",

  "Militants"

];


/* =========================================================
   ELEMENTS
========================================================= */

const loginScreen =
  document.getElementById(
    "loginScreen"
  );


const adminScreen =
  document.getElementById(
    "adminScreen"
  );


const loginForm =
  document.getElementById(
    "loginForm"
  );


const loginButton =
  document.getElementById(
    "loginButton"
  );


const loginMessage =
  document.getElementById(
    "loginMessage"
  );


const profileForm =
  document.getElementById(
    "profileForm"
  );


const profileMessage =
  document.getElementById(
    "profileMessage"
  );


const saveProfileButton =
  document.getElementById(
    "saveProfileButton"
  );


const descriptionField =
  document.getElementById(
    "profileDescription"
  );


const descriptionCounter =
  document.getElementById(
    "descriptionCounter"
  );


const vipMedal =
  document.getElementById(
    "vipMedal"
  );


const vipAudience =
  document.getElementById(
    "vipAudience"
  );


const saveRolesButton =
  document.getElementById(
    "saveRolesButton"
  );


const roleMessage =
  document.getElementById(
    "roleMessage"
  );


/* =========================================================
   MESSAGES
========================================================= */

function afficherMessage(
  element,
  type,
  texte
){

  element.className =
    "message " + type;


  element.textContent =
    texte;

}


function viderMessage(
  element
){

  element.className =
    "message";


  element.textContent =
    "";

}


/* =========================================================
   COMPETENCES
========================================================= */

function normaliserCompetences(
  value
){

  if(
    Array.isArray(value)
  ){

    return value;

  }


  if(
    typeof value === "string"
  ){

    return value

      .replace(
        /^\{|\}$/g,
        ""
      )

      .split(",")

      .map(
        x =>
          x
            .trim()
            .replace(
              /^"|"$/g,
              ""
            )
      )

      .filter(Boolean);

  }


  return [];

}


/* =========================================================
   ACCES ROLE
========================================================= */

function peutGererRole(){

  return (

    currentProfile?.grade2 &&

    String(
      currentProfile.grade2
    ).trim() !== ""

  );

}


/* =========================================================
   REMPLIR ROLES
========================================================= */

function remplirRoles(
  competences
){

  const liste =
    normaliserCompetences(
      competences
    );


  document

    .querySelectorAll(
      'input[name="roles"]'
    )

    .forEach(
      input => {

        input.checked =
          liste.includes(
            input.value
          );

      }
    );

}


/* =========================================================
   SYNCHRONISER COMPETENCES / ROLES
========================================================= */

function synchroniserCompetencesEtRoles(
  competences
){

  const liste =
    normaliserCompetences(
      competences
    );


  document

    .querySelectorAll(
      'input[name="competences"]'
    )

    .forEach(
      input => {

        input.checked =
          liste.includes(
            input.value
          );

      }
    );


  remplirRoles(
    liste
  );

}


/* =========================================================
   MEDAILLE VIP
========================================================= */

function mettreAJourMedailleVIP(
  audienceMax
){

  const audience =
    Number(audienceMax) || 0;


  if(
    audience >= 3000
  ){

    vipMedal.classList.add(
      "active"
    );


    vipAudience.textContent =
      "Audience actuelle : " +
      audience.toLocaleString(
        "fr-FR"
      ) +
      " followers";


  }else{

    vipMedal.classList.remove(
      "active"
    );


    vipAudience.textContent =
      audience > 0

        ? "Audience actuelle : " +
          audience.toLocaleString(
            "fr-FR"
          ) +
          " followers"

        : "Audience actuelle : —";

  }

}


/* =========================================================
   COMPTEUR DESCRIPTION
========================================================= */

function mettreAJourCompteur(){

  const longueur =
    descriptionField.value.length;


  descriptionCounter.textContent =
    longueur + " / 300";


  if(
    longueur >= 300
  ){

    descriptionCounter.classList.add(
      "limit"
    );


  }else{

    descriptionCounter.classList.remove(
      "limit"
    );

  }

}


descriptionField.addEventListener(
  "input",
  mettreAJourCompteur
);


/* =========================================================
   LOGIN
========================================================= */

loginForm.addEventListener(
  "submit",
  async event => {

    event.preventDefault();


    viderMessage(
      loginMessage
    );


    loginButton.disabled =
      false;


    loginButton.textContent =
      "CONNEXION";


    loginButton.textContent =
      "CONNEXION…";


    const email =
      document

        .getElementById(
          "loginEmail"
        )

        .value

        .trim()

        .toLowerCase();


    const password =
      document

        .getElementById(
          "loginPassword"
        )

        .value;


    const {error} =
      await supabaseClient.auth
        .signInWithPassword({

          email,

          password

        });


    if(error){

      console.error(
        "Erreur connexion :",
        error
      );


      afficherMessage(
        loginMessage,
        "error",
        "Adresse e-mail ou mot de passe incorrect."
      );


      loginButton.disabled =
        false;


      loginButton.textContent =
        "SE CONNECTER";


      return;

    }


    await verifierUtilisateur();

  }
);


/* =========================================================
   VERIFICATION UTILISATEUR
========================================================= */

async function verifierUtilisateur(){

  const {
    data:{user}
  } =
    await supabaseClient.auth
      .getUser();


  if(!user){

    afficherConnexion();

    return;

  }


  currentUser =
    user;


  const {
    data:profile,
    error
  } =
    await supabaseClient

      .from("profiles")

      .select(`

        id,

        nom,

        grade,

        grade2,

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

      .eq(
        "id",
        user.id
      )

      .single();


  if(
    error ||
    !profile
  ){

    console.error(
      "Erreur chargement profil :",
      error
    );


    await supabaseClient
      .auth
      .signOut();


    afficherMessage(
      loginMessage,
      "error",
      "Impossible de charger votre profil."
    );


    afficherConnexion();

    return;

  }


  currentProfile =
    profile;


  afficherAdmin();


  remplirProfil(
    profile
  );


  const rdvButton =
    document.getElementById(
      "rdvTabButton"
    );


  if(
    peutGererRendezVous()
  ){

    rdvButton.style.display =
      "block";


    chargerRendezVous();


  }else{

    rdvButton.style.display =
      "none";

  }


  const roleButton =
    document.getElementById(
      "roleTabButton"
    );


  if(
    peutGererRole()
  ){

    roleButton.style.display =
      "block";


    remplirRoles(
      profile.competences
    );


  }else{

    roleButton.style.display =
      "none";

  }


  chargerGestionEquipes();

}


/* =========================================================
   AFFICHAGE CONNEXION
========================================================= */

function afficherConnexion(){

  loginScreen.style.display =
    "block";


  adminScreen.style.display =
    "none";


  loginButton.disabled =
    false;


  loginButton.textContent =
    "CONNEXION";


  loginForm.reset();


  viderMessage(
    loginMessage
  );

}


/* =========================================================
   AFFICHAGE ADMIN
========================================================= */

function afficherAdmin(){

  loginScreen.style.display =
    "none";


  adminScreen.style.display =
    "block";


  document
    .getElementById(
      "adminUser"
    )
    .innerHTML =
      "Connecté en tant que <strong>" +
      (
        currentProfile.nom ||
        currentUser.email
      ) +
      "</strong>";


  ajouterActionsHeader();

}


/* =========================================================
   HEADER ESPACE MEMBRE
========================================================= */

function ajouterActionsHeader(){

  let actions =
    document.getElementById(
      "memberHeaderActions"
    );


  if(actions){

    return;

  }


  const header =
    document.createElement(
      "div"
    );


  header.id =
    "memberHeaderActions";


  header.className =
    "header-actions";


  header.innerHTML = `

    <a
      href="index.html"
      class="header-button"
    >
      HOME
    </a>

    <button
      type="button"
      class="header-button logout-button"
      id="logoutButton"
    >
      SE DÉCONNECTER
    </button>

  `;


  const adminHeader =
    document.querySelector(
      ".admin-header"
    );


  adminHeader.insertBefore(
    header,
    adminHeader.firstChild
  );


  document
    .getElementById(
      "logoutButton"
    )
    .addEventListener(
      "click",
      deconnecter
    );

}


/* =========================================================
   DECONNEXION
========================================================= */

async function deconnecter(){

  const button =
    document.getElementById(
      "logoutButton"
    );


  if(button){

    button.disabled =
      true;


    button.textContent =
      "DÉCONNEXION…";

  }


  const {error} =
    await supabaseClient
      .auth
      .signOut();


  if(error){

    console.error(
      "Erreur déconnexion :",
      error
    );


    if(button){

      button.disabled =
        false;


      button.textContent =
        "SE DÉCONNECTER";

    }


    return;

  }


  currentUser =
    null;


  currentProfile =
    null;


  if(button){

    button.disabled =
      false;


    button.textContent =
      "SE DÉCONNECTER";

  }


  afficherConnexion();

}


/* =========================================================
   REMPLIR PROFIL
========================================================= */

function remplirProfil(
  profile
){

  document
    .getElementById(
      "profileNom"
    )
    .value =
      profile.nom || "";


  document
    .getElementById(
      "profileEmail"
    )
    .value =
      profile.email ||
      currentUser.email ||
      "";


  document
    .getElementById(
      "profileRegion"
    )
    .value =
      profile.region || "";


  document
    .getElementById(
      "profileImage"
    )
    .value =
      profile.image_url || "";


  document
    .getElementById(
      "profileDescription"
    )
    .value =
      profile.description || "";


  document
    .getElementById(
      "profileFacebook"
    )
    .value =
      profile.facebook_url || "";


  document
    .getElementById(
      "profileX"
    )
    .value =
      profile.x_url || "";


  document
    .getElementById(
      "profileInstagram"
    )
    .value =
      profile.instagram_url || "";


  document
    .getElementById(
      "profileYoutube"
    )
    .value =
      profile.youtube_url || "";


  document
    .getElementById(
      "profileTiktok"
    )
    .value =
      profile.tiktok_url || "";


  mettreAJourMedailleVIP(
    profile.audience_max
  );


  if(
    profile.anonyme
  ){

    document
      .getElementById(
        "profileAnonyme"
      )
      .checked =
        true;


  }else{

    document
      .getElementById(
        "profileAffiche"
      )
      .checked =
        true;

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


    viderMessage(
      profileMessage
    );


    saveProfileButton.disabled =
      true;


    saveProfileButton.textContent =
      "ENREGISTREMENT…";


    const nom =
      document
        .getElementById(
          "profileNom"
        )
        .value
        .trim();


    const email =
      document
        .getElementById(
          "profileEmail"
        )
        .value
        .trim()
        .toLowerCase();


    const region =
      document
        .getElementById(
          "profileRegion"
        )
        .value;


    const image_url =
      document
        .getElementById(
          "profileImage"
        )
        .value
        .trim();


    const description =
      document
        .getElementById(
          "profileDescription"
        )
        .value
        .trim();


    const facebook_url =
      document
        .getElementById(
          "profileFacebook"
        )
        .value
        .trim();


    const x_url =
      document
        .getElementById(
          "profileX"
        )
        .value
        .trim();


    const instagram_url =
      document
        .getElementById(
          "profileInstagram"
        )
        .value
        .trim();


    const youtube_url =
      document
        .getElementById(
          "profileYoutube"
        )
        .value
        .trim();


    const tiktok_url =
      document
        .getElementById(
          "profileTiktok"
        )
        .value
        .trim();


    const anonyme =
      document
        .getElementById(
          "profileAnonyme"
        )
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
    */

    const rolesFinaux =
      peutGererRole()
        ? rolesSelectionnes
        : anciensRoles;


    const competences =
      Array.from(
        new Set([
          ...competencesMetier,
          ...rolesFinaux
        ])
      );


    if(
      !nom ||
      !region ||
      !email
    ){

      afficherMessage(
        profileMessage,
        "error",
        "Le nom, l'adresse e-mail et la région sont obligatoires."
      );


      saveProfileButton.disabled =
        false;


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


      saveProfileButton.disabled =
        false;


      saveProfileButton.textContent =
        "ENREGISTRER LES MODIFICATIONS";


      return;

    }


    if(
      description.length > 300
    ){

      afficherMessage(
        profileMessage,
        "error",
        "La description ne peut pas dépasser 300 caractères."
      );


      saveProfileButton.disabled =
        false;


      saveProfileButton.textContent =
        "ENREGISTRER LES MODIFICATIONS";


      return;

    }


    const ancienneRegion =
      currentProfile?.region ||
      "";


    const ancienneGrade2 =
      currentProfile?.grade2 ||
      null;


    const changementRegion =
      region !== ancienneRegion;


    const perteDroitsRegionaux =
      changementRegion &&
      (
        ancienneGrade2 ===
          "Délégué Régional" ||

        ancienneGrade2 ===
          "Militant"
      );


    if(
      perteDroitsRegionaux
    ){

      const confirmerChangement =
        confirm(

          "Attention : si vous changez de région, vous perdrez vos droits régionaux (« " +

          ancienneGrade2 +

          " »).\n\n" +

          "Votre fonction régionale sera automatiquement supprimée.\n\n" +

          "Voulez-vous confirmer ce changement de région ?"

        );


      if(
        !confirmerChangement
      ){

        saveProfileButton.disabled =
          false;


        saveProfileButton.textContent =
          "ENREGISTRER LES MODIFICATIONS";


        return;

      }

    }


    const grade2ApresChangement =
      perteDroitsRegionaux
        ? null
        : currentProfile?.grade2 ||
          null;


    const ancienEmailAuth =
      (
        currentUser?.email ||
        ""
      )
      .trim()
      .toLowerCase();


    const changementEmail =
      email !== ancienEmailAuth;


    if(
      changementEmail
    ){

      const {
        error:authEmailError
      } =
        await supabaseClient.auth
          .updateUser({
            email:email
          });


      if(
        authEmailError
      ){

        console.error(
          "Erreur changement email Auth :",
          authEmailError
        );


        afficherMessage(
          profileMessage,
          "error",
          "Impossible de modifier l'adresse e-mail. Vérifiez l'adresse saisie et les paramètres de confirmation de Supabase."
        );


        saveProfileButton.disabled =
          false;


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
            image_url ||
            null,

          description:
            description ||
            null,

          region:
            region,

          competences:
            competences,

          anonyme:
            anonyme,

          facebook_url:
            facebook_url ||
            null,

          x_url:
            x_url ||
            null,

          instagram_url:
            instagram_url ||
            null,

          youtube_url:
            youtube_url ||
            null,

          tiktok_url:
            tiktok_url ||
            null,

          ...(perteDroitsRegionaux
            ? {
                grade2:null
              }
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


      saveProfileButton.disabled =
        false;


      saveProfileButton.textContent =
        "ENREGISTRER LES MODIFICATIONS";


      return;

    }


    currentProfile =
      data;


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


    if(
      peutGererRole()
    ){

      roleButton.style.display =
        "block";


    }else{

      roleButton.style.display =
        "none";


      /*
        Si ROLE vient de disparaître alors
        que l'utilisateur était dessus,
        on revient automatiquement sur PROFIL.
      */

      if(
        document
          .getElementById(
            "roleTab"
          )
          .classList
          .contains(
            "active"
          )
      ){

        document
          .querySelectorAll(
            ".tab"
          )
          .forEach(
            tab =>
              tab.classList.remove(
                "active"
              )
          );


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


        const profileTabButton =
          document.querySelector(
            '.tab[data-tab="profileTab"]'
          );


        profileTabButton.classList.add(
          "active"
        );


        document
          .getElementById(
            "profileTab"
          )
          .classList.add(
            "active"
          );

      }

    }


    if(
      changementEmail
    ){

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

          ? "Votre profil a bien été mis à jour. Vos droits régionaux ont été supprimés."

          : "Votre profil a bien été mis à jour."

      );

    }


    mettreAJourMedailleVIP(
      data.audience_max
    );


    document
      .getElementById(
        "adminUser"
      )
      .innerHTML =
        "Connecté en tant que <strong>" +
        (
          data.nom ||
          currentUser.email
        ) +
        "</strong>";


    if(
      perteDroitsRegionaux
    ){

      await chargerGestionEquipes();

    }


    saveProfileButton.disabled =
      false;


    saveProfileButton.textContent =
      "ENREGISTRER LES MODIFICATIONS";

  }
);


/* =========================================================
   SAUVEGARDE ROLE
========================================================= */

saveRolesButton.addEventListener(
  "click",
  async () => {

    if(
      !peutGererRole()
    ){

      return;

    }


    viderMessage(
      roleMessage
    );


    saveRolesButton.disabled =
      true;


    saveRolesButton.textContent =
      "ENREGISTREMENT…";


    /*
      On récupère toutes les valeurs déjà présentes
      dans competences.

      On retire uniquement les anciens rôles,
      puis on ajoute les rôles actuellement sélectionnés.
    */

    const anciennesCompetences =
      normaliserCompetences(
        currentProfile?.competences
      );


    const competencesExistantes =
      anciennesCompetences.filter(
        competence =>
          !ROLES.includes(
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


    const competences =
      Array.from(
        new Set([
          ...competencesExistantes,
          ...rolesSelectionnes
        ])
      );


    const {
      data,
      error
    } =
      await supabaseClient

        .from("profiles")

        .update({

          competences:
            competences

        })

        .eq(
          "id",
          currentUser.id
        )

        .select()
        .single();


    if(error){

      console.error(
        "Erreur sauvegarde rôles :",
        error
      );


      afficherMessage(
        roleMessage,
        "error",
        "Impossible d'enregistrer vos rôles. Vérifiez les droits de la table profiles dans Supabase."
      );


      saveRolesButton.disabled =
        false;


      saveRolesButton.textContent =
        "ENREGISTRER MES RÔLES";


      return;

    }


    currentProfile =
      data;


    synchroniserCompetencesEtRoles(
      data.competences
    );


    afficherMessage(
      roleMessage,
      "success",
      "Vos rôles ont bien été enregistrés."
    );


    saveRolesButton.disabled =
      false;


    saveRolesButton.textContent =
      "ENREGISTRER MES RÔLES";

  }
);


/* =========================================================
   ONGLETS
========================================================= */

document
  .querySelectorAll(
    ".tab"
  )
  .forEach(
    tab => {

      tab.addEventListener(
        "click",
        () => {

          if(
            tab.id ===
              "rdvTabButton" &&
            !peutGererRendezVous()
          ){

            return;

          }


          if(
            tab.id ===
              "roleTabButton" &&
            !peutGererRole()
          ){

            return;

          }


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


          tab.classList.add(
            "active"
          );


          document
            .getElementById(
              tab.dataset.tab
            )
            .classList.add(
              "active"
            );

        }
      );

    }
  );


/* =========================================================
   INITIALISATION
========================================================= */

verifierUtilisateur();
