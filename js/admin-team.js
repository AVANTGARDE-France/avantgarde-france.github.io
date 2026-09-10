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
/* =========================================================
   AFFICHER UNE REGION
========================================================= */

function afficherRegionEquipe(
  region
){

  regionEquipeActive =
    region;


  document
    .querySelectorAll(
      ".team-region-button"
    )
    .forEach(
      bouton => {

        bouton.classList.toggle(
          "active",
          bouton.dataset.region ===
            region
        );

      }
    );


  document
    .querySelectorAll(
      ".team-region-panel"
    )
    .forEach(
      panel => {

        panel.classList.toggle(
          "active",
          panel.dataset.region ===
            region
        );

      }
    );


  afficherEquipesRegion(
    region
  );

}


/* =========================================================
   INITIALISER RECHERCHES REGIONS
========================================================= */

function initialiserRecherchesRegions(){

  document
    .querySelectorAll(
      ".regional-search"
    )
    .forEach(
      input => {

        input.addEventListener(
          "input",
          () =>
            afficherResultatsRegion(
              input,
              "Délégué Régional"
            )
        );

      }
    );


  document
    .querySelectorAll(
      ".militant-search"
    )
    .forEach(
      input => {

        input.addEventListener(
          "input",
          () =>
            afficherResultatsRegion(
              input,
              "Militant"
            )
        );

      }
    );

}


/* =========================================================
   AFFICHER EQUIPES REGION
========================================================= */

function afficherEquipesRegion(
  region
){

  const delegues =
    tousLesMembres.filter(
      membre =>
        membre.region === region &&
        membre.grade2 ===
          "Délégué Régional"
    );


  const militants =
    tousLesMembres.filter(
      membre =>
        membre.region === region &&
        membre.grade2 ===
          "Militant"
    );


  document
    .querySelectorAll(
      ".regional-selected"
    )
    .forEach(
      container => {

        if(
          container.dataset.region ===
          region
        ){

          afficherMembresSelectionnes(
            container,
            delegues,
            region,
            "Délégué Régional"
          );

        }

      }
    );


  document
    .querySelectorAll(
      ".militant-selected"
    )
    .forEach(
      container => {

        if(
          container.dataset.region ===
          region
        ){

          afficherMembresSelectionnes(
            container,
            militants,
            region,
            "Militant"
          );

        }

      }
    );


  appliquerPermissionsRegion(
    region
  );

}


/* =========================================================
   PERMISSIONS REGION
========================================================= */

function appliquerPermissionsRegion(
  region
){

  const peutDelegues =
    peutGererEquipes();

  const peutMilitants =
    peutGererMilitants(
      region
    );


  document
    .querySelectorAll(
      ".regional-search"
    )
    .forEach(
      input => {

        if(
          input.dataset.region ===
          region
        ){

          input.classList.toggle(
            "team-disabled",
            !peutDelegues
          );

        }

      }
    );


  document
    .querySelectorAll(
      ".militant-search"
    )
    .forEach(
      input => {

        if(
          input.dataset.region ===
          region
        ){

          input.classList.toggle(
            "team-disabled",
            !peutMilitants
          );

        }

      }
    );

}


/* =========================================================
   RESULTATS REGION
========================================================= */

function afficherResultatsRegion(
  input,
  role
){

  const region =
    input.dataset.region;


  const container =
    document.querySelector(
      role === "Délégué Régional"
        ? `.regional-results[data-region="${CSS.escape(region)}"]`
        : `.militant-results[data-region="${CSS.escape(region)}"]`
    );


  if(!container){

    return;

  }


  container.innerHTML = "";


  const autorise =
    role === "Délégué Régional"
      ? peutGererEquipes()
      : peutGererMilitants(
          region
        );


  if(!autorise){

    return;

  }


  const texte =
    input.value
      .trim()
      .toLowerCase();


  if(!texte){

    return;

  }


  const membres =
    tousLesMembres
      .filter(
        membre =>
          membre.region === region &&
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
          attribuerRoleRegional(
            membre,
            region,
            role
          )
      );


      container.appendChild(
        bouton
      );

    }
  );

}


/* =========================================================
   CREER OPTION MEMBRE
========================================================= */

function creerOptionMembre(
  membre
){

  const bouton =
    document.createElement("button");

  bouton.type =
    "button";

  bouton.className =
    "team-member-option";


  const image =
    membre.image_url ||
    "";


  bouton.innerHTML =
    `
      ${
        image
          ? `
            <img
              src="${escapeHtml(image)}"
              alt=""
              onerror="this.style.display='none'"
            >
          `
          : `
            <div
              style="
                width:30px;
                height:30px;
                border-radius:50%;
                border:1px solid rgba(214,173,85,.3);
                display:flex;
                align-items:center;
                justify-content:center;
                color:var(--gold);
                font-size:10px;
                flex-shrink:0;
              "
            >
              ★
            </div>
          `
      }

      <span>

        <span class="team-member-option-name">
          ${escapeHtml(membre.nom || "Membre")}
        </span>

        <span class="team-member-option-region">
          ${escapeHtml(membre.region || "")}
        </span>

      </span>
    `;


  return bouton;

}


/* =========================================================
   ATTRIBUTION REGIONALE
========================================================= */

async function attribuerRoleRegional(
  membre,
  region,
  role
){

  const autorise =
    role === "Délégué Régional"
      ? peutGererEquipes()
      : peutGererMilitants(
          region
        );


  if(!autorise){

    return;

  }


  if(membre.region !== region){

    return;

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
      "Erreur attribution rôle régional :",
      error
    );

    afficherMessageRegion(
      region,
      role,
      "error",
      "Impossible d'enregistrer cette affectation."
    );

    return;

  }


  mettreAJourMembreLocal(
    data
  );


  const searchSelector =
    role === "Délégué Régional"
      ? `.regional-search[data-region="${CSS.escape(region)}"]`
      : `.militant-search[data-region="${CSS.escape(region)}"]`;


  const search =
    document.querySelector(
      searchSelector
    );


  if(search){

    search.value =
      "";

  }


  const resultSelector =
    role === "Délégué Régional"
      ? `.regional-results[data-region="${CSS.escape(region)}"]`
      : `.militant-results[data-region="${CSS.escape(region)}"]`;


  const results =
    document.querySelector(
      resultSelector
    );


  if(results){

    results.innerHTML =
      "";

  }


  afficherEquipesRegion(
    region
  );


  afficherMessageRegion(
    region,
    role,
    "success",
    "Le membre a été affecté."
  );


  setTimeout(
    () =>
      viderMessageRegion(
        region,
        role
      ),
    2200
  );

}


/* =========================================================
   AFFICHER MEMBRES SELECTIONNES
========================================================= */

function afficherMembresSelectionnes(
  container,
  membres,
  region,
  role
){

  container.innerHTML = "";


  if(
    !membres ||
    membres.length === 0
  ){

    container.innerHTML =
      "<div class='team-permission'>Aucun membre affecté.</div>";

    return;

  }


  const autorise =
    role === "Délégué Régional"
      ? peutGererEquipes()
      : peutGererMilitants(
          region
        );


  membres.forEach(
    membre => {

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
            autorise
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


      if(autorise){

        item
          .querySelector("button")
          .addEventListener(
            "click",
            () =>
              retirerRoleRegional(
                membre,
                region,
                role
              )
          );

      }


      container.appendChild(
        item
      );

    }
  );

}


/* =========================================================
   RETIRER ROLE REGIONAL
========================================================= */

async function retirerRoleRegional(
  membre,
  region,
  role
){

  const autorise =
    role === "Délégué Régional"
      ? peutGererEquipes()
      : peutGererMilitants(
          region
        );


  if(!autorise){

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
      "Erreur retrait rôle régional :",
      error
    );

    afficherMessageRegion(
      region,
      role,
      "error",
      "Impossible de retirer ce membre."
    );

    return;

  }


  mettreAJourMembreLocal(
    data
  );


  afficherEquipesRegion(
    region
  );

}


/* =========================================================
   MESSAGE REGION
========================================================= */

function afficherMessageRegion(
  region,
  role,
  type,
  texte
){

  const selector =
    role === "Délégué Régional"
      ? `.regional-message[data-region="${CSS.escape(region)}"]`
      : `.militant-message[data-region="${CSS.escape(region)}"]`;


  const element =
    document.querySelector(
      selector
    );


  if(element){

    afficherMessage(
      element,
      type,
      texte
    );

  }

}


function viderMessageRegion(
  region,
  role
){

  const selector =
    role === "Délégué Régional"
      ? `.regional-message[data-region="${CSS.escape(region)}"]`
      : `.militant-message[data-region="${CSS.escape(region)}"]`;


  const element =
    document.querySelector(
      selector
    );


  if(element){

    viderMessage(
      element
    );

  }

}


/* =========================================================
   MISE A JOUR MEMBRE LOCAL
========================================================= */

function mettreAJourMembreLocal(
  membre
){

  const index =
    tousLesMembres.findIndex(
      profil =>
        profil.id ===
        membre.id
    );


  if(index !== -1){

    tousLesMembres[index] =
      membre;

  }

}


/* =========================================================
   ECHAPPEMENT
========================================================= */

function escapeHtml(value){

  return String(value ?? "")
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;")
    .replace(/'/g,"&#039;");

}
