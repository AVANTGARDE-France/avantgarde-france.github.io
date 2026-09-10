/* =========================================================
   AVANT-GARDE — GESTION DES EQUIPES

   js/admin-team.js

   Gestion :
   - Architecte du Projet
   - Délégué National
   - Délégués Régionaux
   - Equipes militantes
   - Permissions associées
========================================================= */


/* =========================================================
   REGIONS
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

  return window.currentProfile?.grade === "admin";

}


function estArchitecteProjet(){

  return window.currentProfile?.grade2 ===
    "Architecte du Projet";

}


function estDelegueNational(){

  return window.currentProfile?.grade2 ===
    "Délégué National";

}


function estDelegueRegional(region){

  return (
    window.currentProfile?.grade2 ===
      "Délégué Régional" &&
    window.currentProfile?.region ===
      region
  );

}


/* =========================================================
   DROITS RDV
========================================================= */

function peutGererRendezVous(){

  return (
    estAdmin() ||
    estArchitecteProjet() ||
    estDelegueNational() ||
    window.currentProfile?.grade2 === "Délégué Régional"
  );

}


/* =========================================================
   DROITS DIRECTION
========================================================= */

function peutGererDirection(){

  return (
    estAdmin() ||
    estArchitecteProjet()
  );

}


/* =========================================================
   DROITS EQUIPES
========================================================= */

function peutGererEquipes(){

  return (
    estAdmin() ||
    estArchitecteProjet() ||
    estDelegueNational()
  );

}


/* =========================================================
   DROITS MILITANTS
========================================================= */

function peutGererMilitants(region){

  return (
    estAdmin() ||
    estArchitecteProjet() ||
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
    window.currentProfile?.region &&
    regionsEquipeListe.includes(
      window.currentProfile.region
    )
      ? window.currentProfile.region
      : regionsEquipeListe[0];


  afficherRegionEquipe(
    window.regionEquipeActive &&
    regionsEquipeListe.includes(
      window.regionEquipeActive
    )
      ? window.regionEquipeActive
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
    await window.supabaseClient
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

    window.tousLesMembres = [];

    return;

  }


  window.tousLesMembres =
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


  if(founderMessage){

    founderMessage.textContent =
      peutGererDirection()
        ? "Modification autorisée."
        : "Modification réservée à l’administration du site.";

    founderMessage.style.color =
      peutGererDirection()
        ? "#b9e5c4"
        : "#7f8998";

  }


  if(nationalMessage){

    nationalMessage.textContent =
      peutGererDirection()
        ? "Modification autorisée."
        : "Modification réservée à l’administration du site.";

    nationalMessage.style.color =
      peutGererDirection()
        ? "#b9e5c4"
        : "#7f8998";

  }


  if(!peutGererDirection()){

    const founderSearch =
      document.getElementById(
        "founderSearch"
      );

    const nationalSearch =
      document.getElementById(
        "nationalSearch"
      );


    if(founderSearch){

      founderSearch.classList.add(
        "team-disabled"
      );

    }


    if(nationalSearch){

      nationalSearch.classList.add(
        "team-disabled"
      );

    }

  }

}


/* =========================================================
   AFFICHAGE SELECTION DIRECTION
========================================================= */

function afficherSelectionDirection(){

  const fondateur =
    (window.tousLesMembres || []).find(
      membre =>
        membre.grade2 ===
        "Architecte du Projet"
    );


  const national =
    (window.tousLesMembres || []).find(
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


  if(!container){

    return;

  }


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

    const button =
      item.querySelector("button");


    if(button){

      button.addEventListener(
        "click",
        () =>
          retirerRoleUnique(
            membre,
            type
          )
      );

    }

  }


  container.appendChild(item);

}


/* =========================================================
   RECHERCHE DIRECTION
========================================================= */

function initialiserRechercheDirection(){

  const founderSearch =
    document.getElementById(
      "founderSearch"
    );

  const nationalSearch =
    document.getElementById(
      "nationalSearch"
    );


  if(founderSearch){

    founderSearch.addEventListener(
      "input",
      event =>
        afficherResultatsDirection(
          event.target.value,
          "founder"
        )
    );

  }


  if(nationalSearch){

    nationalSearch.addEventListener(
      "input",
      event =>
        afficherResultatsDirection(
          event.target.value,
          "national"
        )
    );

  }

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


  if(!container){

    return;

  }


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
    (window.tousLesMembres || [])
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
    (window.tousLesMembres || []).find(
      profil =>
        profil.grade2 === role
    );


  if(ancien && ancien.id !== membre.id){

    const {
      error
    } =
      await window.supabaseClient
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
    (window.tousLesMembres || []).find(
      profil =>
        profil.id === membre.id &&
        profil.grade2 === autreRole
    );


  if(ancienAutre){

    /*
      Une personne ne peut pas cumuler
      les deux fonctions de direction.
    */

    const {
      error
    } =
      await window.supabaseClient
        .from("profiles")
        .update({
          grade2:null
        })
        .eq(
          "id",
          membre.id
        );


    if(error){

      console.error(
        "Erreur retrait autre fonction :",
        error
      );

      afficherMessage(
        document.getElementById(
          type === "founder"
            ? "founderMessage"
            : "nationalMessage"
        ),
        "error",
        "Impossible de modifier la fonction actuelle du membre."
      );

      return;

    }

  }


  const {
    data,
    error
  } =
    await window.supabaseClient
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


  const search =
    document.getElementById(
      type === "founder"
        ? "founderSearch"
        : "nationalSearch"
    );


  if(search){

    search.value = "";

  }


  const results =
    document.getElementById(
      type === "founder"
        ? "founderResults"
        : "nationalResults"
    );


  if(results){

    results.innerHTML = "";

  }


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
    await window.supabaseClient
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
   REGIONS
========================================================= */

function afficherRegionsEquipe(){

  const navigation =
    document.getElementById(
      "teamRegions"
    );

  const panels =
    document.getElementById(
      "teamRegionPanels"
    );


  if(!navigation || !panels){

    return;

  }


  navigation.innerHTML = "";

  panels.innerHTML = "";


  /*
    Région du profil connecté par défaut.
    Toutes les régions restent visibles.
  */

  const regionParDefaut =
    window.currentProfile?.region &&
    regionsEquipeListe.includes(
      window.currentProfile.region
    )
      ? window.currentProfile.region
      : regionsEquipeListe[0];


  if(
    !window.regionEquipeActive ||
    !regionsEquipeListe.includes(
      window.regionEquipeActive
    )
  ){

    window.regionEquipeActive =
      regionParDefaut;

  }


  regionsEquipeListe.forEach(
    (region,index) => {

      const bouton =
        document.createElement("button");

      bouton.type =
        "button";

      bouton.className =
        "team-region-button";

      bouton.dataset.region =
        region;


      bouton.innerHTML =
        escapeHtml(region);


      if(
        region ===
        window.regionEquipeActive
      ){

        bouton.classList.add(
          "active"
        );

      }


      bouton.addEventListener(
        "click",
        () =>
          afficherRegionEquipe(
            region
          )
      );


      navigation.appendChild(
        bouton
      );


      const panel =
        document.createElement("div");

      panel.id =
        "team-region-" +
        index;

      panel.className =
        "team-region-panel";

      panel.dataset.region =
        region;


      panel.innerHTML =
        `
          <h3 class="team-region-title">
            ${escapeHtml(region)}
          </h3>

          <div class="team-block">

            <h4 class="team-block-title">
              Délégués Régionaux
            </h4>

            <p class="team-block-intro">
              Sélection multiple des membres de cette région.
            </p>

            <input
              type="text"
              class="team-search regional-search"
              data-region="${escapeHtml(region)}"
              data-role="Délégué Régional"
              placeholder="Rechercher un membre..."
              autocomplete="off"
            >

            <div
              class="team-search-results regional-results"
              data-region="${escapeHtml(region)}"
              data-role="Délégué Régional"
            ></div>

            <div
              class="team-selected regional-selected"
              data-region="${escapeHtml(region)}"
              data-role="Délégué Régional"
            ></div>

            <div class="team-permission">
              Modification : administration, Délégué National ou Architecte du Projet.
            </div>

            <div
              class="message regional-message"
              data-region="${escapeHtml(region)}"
            ></div>

          </div>


          <div class="team-block">

            <h4 class="team-block-title">
              L'équipe Militante
            </h4>

            <p class="team-block-intro">
              Sélection multiple des membres de cette région.
            </p>

            <input
              type="text"
              class="team-search militant-search"
              data-region="${escapeHtml(region)}"
              data-role="Militant"
              placeholder="Rechercher un membre..."
              autocomplete="off"
            >

            <div
              class="team-search-results militant-results"
              data-region="${escapeHtml(region)}"
              data-role="Militant"
            ></div>

            <div
              class="team-selected militant-selected"
              data-region="${escapeHtml(region)}"
              data-role="Militant"
            ></div>

            <div class="team-permission">
              Modification : administration, Délégué National, Architecte du Projet ou Délégué Régional de cette région.
            </div>

            <div
              class="message militant-message"
              data-region="${escapeHtml(region)}"
            ></div>

          </div>
        `;


      panels.appendChild(
        panel
      );

    }
  );


  initialiserRecherchesRegions();

  afficherRegionEquipe(
    window.regionEquipeActive
  );

}


/* =========================================================
   AFFICHER UNE REGION
========================================================= */

function afficherRegionEquipe(
  region
){

  window.regionEquipeActive =
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
    .forEach(panel => {

      panel.classList.toggle(
        "active",
        panel.dataset.region ===
          region
      );

    });


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

  const membres =
    window.tousLesMembres || [];


  const delegues =
    membres.filter(
      membre =>
        membre.region === region &&
        membre.grade2 ===
          "Délégué Régional"
    );


  const militants =
    membres.filter(
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
    (window.tousLesMembres || [])
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
    await window.supabaseClient
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

        const button =
          item.querySelector("button");


        if(button){

          button.addEventListener(
            "click",
            () =>
              retirerRoleRegional(
                membre,
                region,
                role
              )
          );

        }

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
    await window.supabaseClient
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

  if(!window.tousLesMembres){

    window.tousLesMembres = [];

  }


  const index =
    window.tousLesMembres.findIndex(
      profil =>
        profil.id ===
        membre.id
    );


  if(index !== -1){

    window.tousLesMembres[index] =
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


/* =========================================================
   EXPOSITION GLOBALE
========================================================= */

/*
   IMPORTANT :
   admin-auth.js appelle ces fonctions via window.
   Sans cette exposition, les fonctions existent dans
   le module mais restent invisibles pour les autres modules.
*/

window.chargerGestionEquipes =
  chargerGestionEquipes;

window.chargerTousLesMembres =
  chargerTousLesMembres;

window.peutGererRendezVous =
  peutGererRendezVous;

window.peutGererDirection =
  peutGererDirection;

window.peutGererEquipes =
  peutGererEquipes;

window.peutGererMilitants =
  peutGererMilitants;

window.estAdmin =
  estAdmin;

window.estArchitecteProjet =
  estArchitecteProjet;

window.estDelegueNational =
  estDelegueNational;

window.estDelegueRegional =
  estDelegueRegional;


/* =========================================================
   VARIABLES GLOBALES
========================================================= */

window.tousLesMembres =
  window.tousLesMembres || [];

window.regionEquipeActive =
  window.regionEquipeActive || null;


/* =========================================================
   EXPORTS
========================================================= */

export {

  chargerGestionEquipes,

  chargerTousLesMembres,

  peutGererRendezVous,

  peutGererDirection,

  peutGererEquipes,

  peutGererMilitants,

  estAdmin,

  estArchitecteProjet,

  estDelegueNational,

  estDelegueRegional

};
