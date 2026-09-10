/* =========================================================
   GESTION DES EQUIPES
========================================================= */

const regionsEquipeListe = [

  "Auvergne-Rhône-Alpes",
  "Bourgogne-Franche-Comté",
  "Bretagne",
  "Centre-Val de Loire",
  "Corse",
  "Grand Est",
  "Hauts-de-France",
  "Île-de-France",
  "Normandie",
  "Nouvelle-Aquitaine",
  "Occitanie",
  "Pays de la Loire",
  "Provence-Alpes-Côte d’Azur",
  "Guadeloupe",
  "Martinique",
  "Guyane",
  "La Réunion",
  "Mayotte",
  "Europe",
  "Amérique du Nord",
  "Amérique centrale et Caraïbes",
  "Amérique du Sud",
  "Afrique",
  "Asie",
  "Océanie",
  "Autre"

];


/* =========================================================
   DROITS
========================================================= */

function estAdmin(){

  return currentProfile?.grade === "admin";

}


function estCommissaireFondateur(){

  return currentProfile?.grade2 ===
    "Architecte du Projet";

}


function estDelegueNational(){

  return currentProfile?.grade2 ===
    "Délégué National";

}


function estDelegueRegional(region){

  return (
    currentProfile?.grade2 ===
      "Délégué Régional" &&
    currentProfile?.region ===
      region
  );

}


/* =========================================================
   DROITS RDV
========================================================= */

function peutGererRendezVous(){

  return (
    estAdmin() ||
    estCommissaireFondateur() ||
    estDelegueNational() ||
    currentProfile?.grade2 === "Délégué Régional"
  );

}


function peutGererDirection(){

  return (
    estAdmin() ||
    estCommissaireFondateur()
  );

}


function peutGererEquipes(){

  return (
    estAdmin() ||
    estCommissaireFondateur() ||
    estDelegueNational()
  );

}


function peutGererMilitants(region){

  return (
    estAdmin() ||
    estCommissaireFondateur() ||
    estDelegueNational() ||
    estDelegueRegional(region)
  );

}


/* =========================================================
   CHARGER GESTION EQUIPES
========================================================= */

async function chargerGestionEquipes(){

  await chargerTousLesMembres();

  afficherPermissionsDirection();

  afficherRegionsEquipe();

  afficherSelectionDirection();

  initialiserRechercheDirection();

  /*
    Région du profil connecté sélectionnée par défaut.
  */

  const regionParDefaut =
    currentProfile?.region &&
    regionsEquipeListe.includes(
      currentProfile.region
    )
      ? currentProfile.region
      : regionsEquipeListe[0];


  afficherRegionEquipe(
    regionEquipeActive &&
    regionsEquipeListe.includes(regionEquipeActive)
      ? regionEquipeActive
      : regionParDefaut
  );

}


/* =========================================================
   CHARGER MEMBRES
========================================================= */

async function chargerTousLesMembres(){

  const {
    data,
    error
  } =
    await supabaseClient
      .from("profiles")
      .select(`
        id,
        nom,
        image_url,
        region,
        grade,
        grade2,
        anonyme
      `)
      .order(
        "nom",
        {
          ascending:true
        }
      );


  if(error){

    console.error(
      "Erreur chargement membres :",
      error
    );

    tousLesMembres = [];

    return;

  }


  tousLesMembres =
    data || [];

}


/* =========================================================
   PERMISSIONS DIRECTION
========================================================= */

function afficherPermissionsDirection(){

  const founderMessage =
    document.getElementById(
      "founderPermissionMessage"
    );

  const nationalMessage =
    document.getElementById(
      "nationalPermissionMessage"
    );


  founderMessage.textContent =
    peutGererDirection()
      ? "Modification autorisée."
      : "Modification réservée à l’administration du site.";

  founderMessage.style.color =
    peutGererDirection()
      ? "#b9e5c4"
      : "#7f8998";


  nationalMessage.textContent =
    peutGererDirection()
      ? "Modification autorisée."
      : "Modification réservée à l’administration du site.";

  nationalMessage.style.color =
    peutGererDirection()
      ? "#b9e5c4"
      : "#7f8998";


  if(!peutGererDirection()){

    document
      .getElementById("founderSearch")
      .classList.add("team-disabled");

    document
      .getElementById("nationalSearch")
      .classList.add("team-disabled");

  }

}


/* =========================================================
   AFFICHAGE SELECTION DIRECTION
========================================================= */

function afficherSelectionDirection(){

  const fondateur =
    tousLesMembres.find(
      membre =>
        membre.grade2 ===
        "Architecte du Projet"
    );


  const national =
    tousLesMembres.find(
      membre =>
        membre.grade2 ===
        "Délégué National"
    );


  afficherSelectionUnique(
    "founderSelected",
    fondateur,
    "founder"
  );


  afficherSelectionUnique(
    "nationalSelected",
    national,
    "national"
  );

}


/* =========================================================
   SELECTION UNIQUE
========================================================= */

function afficherSelectionUnique(
  elementId,
  membre,
  type
){

  const container =
    document.getElementById(
      elementId
    );


  container.innerHTML = "";


  if(!membre){

    container.innerHTML =
      "<div class='team-permission'>Aucun membre désigné.</div>";

    return;

  }


  const item =
    document.createElement("div");

  item.className =
    "team-selected-member";


  item.innerHTML =
    `
      <span>
        ${escapeHtml(membre.nom || "Membre")}
      </span>

      ${
        peutGererDirection()
          ? `
            <button
              type="button"
              title="Retirer"
            >
              ×
            </button>
          `
          : ""
      }
    `;


  if(peutGererDirection()){

    item
      .querySelector("button")
      .addEventListener(
        "click",
        () =>
          retirerRoleUnique(
            membre,
            type
          )
      );

  }


  container.appendChild(item);

}


/* =========================================================
   RECHERCHE DIRECTION
========================================================= */

function initialiserRechercheDirection(){

  document
    .getElementById("founderSearch")
    .addEventListener(
      "input",
      event =>
        afficherResultatsDirection(
          event.target.value,
          "founder"
        )
    );


  document
    .getElementById("nationalSearch")
    .addEventListener(
      "input",
      event =>
        afficherResultatsDirection(
          event.target.value,
          "national"
        )
    );

}


/* =========================================================
   RESULTATS DIRECTION
========================================================= */

function afficherResultatsDirection(
  recherche,
  type
){

  const container =
    document.getElementById(
      type === "founder"
        ? "founderResults"
        : "nationalResults"
    );


  container.innerHTML = "";


  if(!peutGererDirection()){

    return;

  }


  const texte =
    recherche
      .trim()
      .toLowerCase();


  if(!texte){

    return;

  }


  const membres =
    tousLesMembres
      .filter(
        membre =>
          String(
            membre.nom || ""
          )
          .toLowerCase()
          .includes(texte)
      )
      .slice(0,20);


  membres.forEach(
    membre => {

      const bouton =
        creerOptionMembre(
          membre
        );


      bouton.addEventListener(
        "click",
        () =>
          attribuerRoleUnique(
            membre,
            type
          )
      );


      container.appendChild(
        bouton
      );

    }
  );

}


/* =========================================================
   ATTRIBUER ROLE UNIQUE
========================================================= */

async function attribuerRoleUnique(
  membre,
  type
){

  if(!peutGererDirection()){

    return;

  }


  const role =
    type === "founder"
      ? "Architecte du Projet"
      : "Délégué National";


  const autreRole =
    type === "founder"
      ? "Délégué National"
      : "Architecte du Projet";


  const ancien =
    tousLesMembres.find(
      profil =>
        profil.grade2 === role
    );


  if(ancien && ancien.id !== membre.id){

    const {
      error
    } =
      await supabaseClient
        .from("profiles")
        .update({
          grade2:null
        })
        .eq(
          "id",
          ancien.id
        );


    if(error){

      console.error(
        "Erreur retrait ancien titulaire :",
        error
      );

      afficherMessage(
        document.getElementById(
          type === "founder"
            ? "founderMessage"
            : "nationalMessage"
        ),
        "error",
        "Impossible de modifier le titulaire."
      );

      return;

    }

  }


  const ancienAutre =
    tousLesMembres.find(
      profil =>
        profil.id === membre.id &&
        profil.grade2 === autreRole
    );


  if(ancienAutre){

  }


  const {
    data,
    error
  } =
    await supabaseClient
      .from("profiles")
      .update({
        grade2:role
      })
      .eq(
        "id",
        membre.id
      )
      .select()
      .single();


  if(error){

    console.error(
      "Erreur attribution grade2 :",
      error
    );

    afficherMessage(
      document.getElementById(
        type === "founder"
          ? "founderMessage"
          : "nationalMessage"
      ),
      "error",
      "Impossible d'enregistrer cette fonction."
    );

    return;

  }


  mettreAJourMembreLocal(
    data
  );


  document
    .getElementById(
      type === "founder"
        ? "founderSearch"
        : "nationalSearch"
    )
    .value = "";


  document
    .getElementById(
      type === "founderResults"
        ? "founderResults"
        : "nationalResults"
    );


  afficherSelectionDirection();

  afficherRegionsEquipe();


  afficherMessage(
    document.getElementById(
      type === "founder"
        ? "founderMessage"
        : "nationalMessage"
    ),
    "success",
    "La fonction a été attribuée."
  );


  setTimeout(
    () =>
      viderMessage(
        document.getElementById(
          type === "founder"
            ? "founderMessage"
            : "nationalMessage"
        )
      ),
    2500
  );

}


/* =========================================================
   RETIRER ROLE UNIQUE
========================================================= */

async function retirerRoleUnique(
  membre,
  type
){

  if(!peutGererDirection()){

    return;

  }


  const {
    data,
    error
  } =
    await supabaseClient
      .from("profiles")
      .update({
        grade2:null
      })
      .eq(
        "id",
        membre.id
      )
      .select()
      .single();


  if(error){

    console.error(
      "Erreur retrait grade2 :",
      error
    );

    afficherMessage(
      document.getElementById(
        type === "founder"
          ? "founderMessage"
          : "nationalMessage"
      ),
      "error",
      "Impossible de retirer cette fonction."
    );

    return;

  }


  mettreAJourMembreLocal(
    data
  );

  afficherSelectionDirection();

  afficherRegionsEquipe();

}
