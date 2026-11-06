/* =========================================================
   AVANT-GARDE — ADMIN PROFIL
   js/admin-profile.js

   Gestion du profil de l'utilisateur connecté :
   - Remplissage du profil
   - Affichage de la photo dans l'en-tête
   - Sauvegarde du profil
   - Gestion des compétences métier
   - Gestion des rôles
   - Gestion du changement de région
   - Gestion du changement d'e-mail
   - Gestion de la médaille VIP
========================================================= */


/* =========================================================
   ACTUALISATION DYNAMIQUE DE L'ONGLET PROFIL
========================================================= */

let adminProfileTabListenerInitialized = false;
let actualisationProfilEnCours = false;


/*
   Recharge le profil courant directement depuis Supabase.

   Cette fonction permet de récupérer les éventuelles
   modifications effectuées depuis le dernier chargement
   de l'espace membre, sans recharger la page.
*/

async function actualiserProfilDepuisSupabase(){

  if(!currentUser?.id){
    return;
  }


  const {
    data,
    error
  } =
    await supabaseClient
      .from("profiles")
      .select("*")
      .eq(
        "id",
        currentUser.id
      )
      .single();


  if(error){

    console.error(
      "PROFIL — ACTUALISATION SUPABASE :",
      error
    );

    return;

  }


  if(!data){
    return;
  }


  /*
    Mise à jour du profil global.

    On conserve également la référence window.currentProfile
    afin que les autres modules de l'espace membre utilisent
    immédiatement les nouvelles données.
  */

  currentProfile =
    data;

  window.currentProfile =
    data;


  /*
    Reconstruction complète de l'affichage du profil.
  */

  remplirProfil(
    data
  );

}


/*
   Initialisation unique de l'écouteur de changement d'onglet.
*/

function initialiserEcouteurOngletProfil(){

  if(adminProfileTabListenerInitialized){
    return;
  }


  adminProfileTabListenerInitialized =
    true;


  window.addEventListener(
    "avantgarde:admin-tab-changed",
    async event => {

      const onglet =
        event?.detail?.tab;


      if(onglet !== "profileTab"){
        return;
      }


      if(!currentUser?.id){
        return;
      }


      /*
        Évite plusieurs requêtes simultanées si plusieurs
        événements sont déclenchés très rapidement.
      */

      if(actualisationProfilEnCours){
        return;
      }


      actualisationProfilEnCours =
        true;


      try{

        await actualiserProfilDepuisSupabase();

      }
      catch(error){

        console.error(
          "PROFIL — ACTUALISATION ONGLET :",
          error
        );

      }
      finally{

        actualisationProfilEnCours =
          false;

      }

    }
  );

}


/* =========================================================
   MÉTHODE DE CONNEXION E-MAIL + MOT DE PASSE
========================================================= */

let passwordMethodModalInitialized = false;

function obtenirEtatMethodeMotDePasse(user, identities = []) {
  const metadata = user?.user_metadata || {};
  if (metadata.avantgarde_email_password_enabled === false) return false;
  if (metadata.avantgarde_email_password_enabled === true) return true;
  return identities.some(identity => identity.provider === "email");
}

let passwordMethodRenderSequence = 0;

async function actualiserMethodeMotDePasse() {
  const actions = document.getElementById("profilePasswordMethodActions");
  const status = document.getElementById("profilePasswordMethodStatus");
  if (!actions || !status || !window.supabaseClient) return;

  // Empêche les appels concurrents de laisser plusieurs boutons.
  const renderSequence = ++passwordMethodRenderSequence;
  actions.replaceChildren();
  status.textContent = "";

  const { data: userData, error: userError } = await window.supabaseClient.auth.getUser();
  if (renderSequence !== passwordMethodRenderSequence) return;
  if (userError || !userData?.user) {
    return;
  }

  const user = userData.user;
  const { data: identityData, error: identityError } = await window.supabaseClient.auth.getUserIdentities();
  if (renderSequence !== passwordMethodRenderSequence) return;
  if (identityError) {
    console.error("AUTH — LECTURE DES IDENTITÉS :", identityError);
    return;
  }

  const identities = identityData?.identities || [];
  const passwordEnabled = obtenirEtatMethodeMotDePasse(user, identities);
  const googleEnabled = identities.some(identity => identity.provider === "google");

  status.textContent = "";

  // Un seul lien discret sous l’adresse e-mail.
  const manage = document.createElement("button");
  manage.type = "button";
  manage.className = "password-method-link";
  manage.textContent = passwordEnabled ? "Modifier" : "Créer";
  manage.addEventListener("click", () => ouvrirModalMotDePasse(passwordEnabled ? "change" : "create"));
  actions.appendChild(manage);

  // La suppression reste accessible depuis la fenêtre de modification,
  // sans ajouter un second bouton permanent au profil.
  
}

function afficherMessageMotDePasse(texte, type = "") {
  const message = document.getElementById("passwordMethodMessage");
  if (!message) return;
  message.className = "password-method-message " + type;
  message.textContent = texte;
}

function fermerModalMotDePasse() {
  const modal = document.getElementById("passwordMethodModal");
  if (modal) {
    modal.classList.remove("active");
    modal.setAttribute("aria-hidden", "true");
  }
}

function ouvrirModalMotDePasse(mode) {
  let modal = document.getElementById("passwordMethodModal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "passwordMethodModal";
    modal.className = "modal password-method-modal";
    modal.setAttribute("aria-hidden", "true");
    modal.innerHTML = `
      <div class="modal-box" role="dialog" aria-modal="true" aria-labelledby="passwordMethodModalTitle">
        <button type="button" class="modal-close" id="passwordMethodModalClose" aria-label="Fermer">×</button>
        <div class="page-kicker">PARAMÈTRES DE CONNEXION</div>
        <h2 id="passwordMethodModalTitle"></h2>
        <p id="passwordMethodModalIntro"></p>
        <form id="passwordMethodForm" novalidate>
          <div id="passwordMethodFields"></div>
          <div id="passwordMethodMessage" class="password-method-message" aria-live="polite"></div>
          <div class="password-method-modal-actions">
            <button type="submit" class="primary-button" id="passwordMethodSubmit">VALIDER</button>
            <button type="button" class="secondary-button" id="passwordMethodCancel">FERMER</button>
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(modal);
    modal.addEventListener("click", event => {
      if (event.target === modal) fermerModalMotDePasse();
    });
    document.getElementById("passwordMethodModalClose").addEventListener("click", fermerModalMotDePasse);
    document.getElementById("passwordMethodCancel").addEventListener("click", fermerModalMotDePasse);
    document.getElementById("passwordMethodForm").addEventListener("submit", traiterFormulaireMotDePasse);
    passwordMethodModalInitialized = true;
  }

  const title = document.getElementById("passwordMethodModalTitle");
  const intro = document.getElementById("passwordMethodModalIntro");
  const fields = document.getElementById("passwordMethodFields");
  const submit = document.getElementById("passwordMethodSubmit");
  const form = document.getElementById("passwordMethodForm");
  const modalActions = form.querySelector(".password-method-modal-actions");
  const oldDelete = document.getElementById("passwordMethodDeleteAction");
  if (oldDelete) oldDelete.remove();
  if (mode === "change") {
    const deleteAction = document.createElement("button");
    deleteAction.type = "button";
    deleteAction.id = "passwordMethodDeleteAction";
    deleteAction.className = "password-method-link";
    deleteAction.textContent = "Supprimer cette méthode";
    deleteAction.addEventListener("click", () => ouvrirModalMotDePasse("delete"));
    modalActions.insertBefore(deleteAction, submit);
  }

  form.dataset.mode = mode;
  fields.innerHTML = "";
  document.getElementById("passwordMethodMessage").textContent = "";

  if (mode === "create" || mode === "change") {
    title.textContent = mode === "create" ? "Créer votre mot de passe" : "Modifier votre mot de passe";
    intro.textContent = "Choisissez un nouveau mot de passe pour vous connecter avec votre adresse e-mail. Cette méthode reste indépendante de Google.";
    fields.innerHTML = `
      <div class="form-group">
        <label for="passwordMethodNew">NOUVEAU CODE</label>
        <input type="password" id="passwordMethodNew" autocomplete="new-password" minlength="8" required>
      </div>
      <div class="form-group">
        <label for="passwordMethodConfirm">NOUVEAU CODE — VÉRIFICATION</label>
        <input type="password" id="passwordMethodConfirm" autocomplete="new-password" minlength="8" required>
      </div>
    `;
    submit.textContent = mode === "create" ? "CRÉER" : "VALIDER";
  } else {
    title.textContent = "Supprimer la connexion e-mail + mot de passe";
    intro.textContent = "Cela ne supprime pas votre compte. Cela supprime seulement l’identification par e-mail + mot de passe. Votre connexion Google reste disponible.";
    fields.innerHTML = `
      <div class="form-group">
        <label for="passwordMethodDeleteConfirm">TAPEZ « SUPPRIMER » POUR CONFIRMER</label>
        <input type="text" id="passwordMethodDeleteConfirm" autocomplete="off" required>
      </div>
    `;
    submit.textContent = "SUPPRIMER";
  }

  modal.classList.add("active");
  modal.setAttribute("aria-hidden", "false");
  fields.querySelector("input")?.focus();
}

function genererMotDePasseInconnu() {
  const bytes = new Uint8Array(48);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, value => value.toString(16).padStart(2, "0")).join("") + "Aa9!";
}

async function traiterFormulaireMotDePasse(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const mode = form.dataset.mode;
  const submit = document.getElementById("passwordMethodSubmit");
  submit.disabled = true;
  afficherMessageMotDePasse("");

  try {
    const { data: userData, error: userError } = await window.supabaseClient.auth.getUser();
    if (userError || !userData?.user) throw userError || new Error("Session membre introuvable.");
    const user = userData.user;
    const metadata = { ...(user.user_metadata || {}) };

    if (mode === "create" || mode === "change") {
      const password = document.getElementById("passwordMethodNew").value;
      const confirmation = document.getElementById("passwordMethodConfirm").value;
      if (password.length < 8) throw new Error("Le nouveau code doit contenir au moins 8 caractères.");
      if (password !== confirmation) throw new Error("Les deux codes ne correspondent pas.");
      const { error } = await window.supabaseClient.auth.updateUser({
        password,
        data: { ...metadata, avantgarde_email_password_enabled: true }
      });
      if (error) throw error;
      fermerModalMotDePasse();
      await actualiserMethodeMotDePasse();
      const status = document.getElementById("profilePasswordMethodStatus");
      if (status) status.textContent = "Votre mot de passe de connexion a bien été enregistré.";
      return;
    }

    if (document.getElementById("passwordMethodDeleteConfirm").value.trim().toUpperCase() !== "SUPPRIMER") {
      throw new Error("Saisissez SUPPRIMER pour confirmer.");
    }

    const { data: identityData, error: identityError } = await window.supabaseClient.auth.getUserIdentities();
    if (identityError) throw identityError;
    const googleEnabled = (identityData?.identities || []).some(identity => identity.provider === "google");
    if (!googleEnabled) throw new Error("Ajoutez d’abord une autre méthode de connexion, par exemple Google.");

    const { error } = await window.supabaseClient.auth.updateUser({
      password: genererMotDePasseInconnu(),
      data: { ...metadata, avantgarde_email_password_enabled: false }
    });
    if (error) throw error;

    fermerModalMotDePasse();
    await actualiserMethodeMotDePasse();
    const status = document.getElementById("profilePasswordMethodStatus");
    if (status) status.textContent = "La connexion par e-mail + mot de passe a été désactivée. Votre compte et votre connexion Google sont conservés.";
  } catch (error) {
    console.error("AUTH — GESTION DU MOT DE PASSE :", error);
    afficherMessageMotDePasse(error?.message || "Impossible d’enregistrer cette modification.", "error");
  } finally {
    submit.disabled = false;
  }
}


/* =========================================================
   COMPTEUR DESCRIPTION
========================================================= */

function mettreAJourCompteur(){

  const description =
    document.getElementById(
      "profileDescription"
    );

  const compteur =
    document.getElementById(
      "descriptionCounter"
    );


  if(!description || !compteur){
    return;
  }


  const longueur =
    description.value.length;


  compteur.textContent =
    longueur +
    " / 300";


  /*
    Le compteur reste cohérent même si une valeur
    supérieure à la limite provient de Supabase.
  */

  if(longueur > 300){

    compteur.classList.add(
      "error"
    );

  }else{

    compteur.classList.remove(
      "error"
    );

  }

}


/*
  Initialisation unique de l'écouteur du compteur.
*/

function initialiserCompteurDescription(){

  const description =
    document.getElementById(
      "profileDescription"
    );


  if(
    !description ||
    description.dataset.counterInitialise ===
    "true"
  ){

    return;

  }


  description.addEventListener(
    "input",
    mettreAJourCompteur
  );


  description.dataset.counterInitialise =
    "true";


  mettreAJourCompteur();

}


/* =========================================================
   PHOTO DE PROFIL — EN-TÊTE ESPACE MEMBRE
========================================================= */

function initialiserPhotoProfil(){

  const photoContainer =
    document.getElementById(
      "adminProfilePhoto"
    );

  if(!photoContainer){
    return;
  }


  /*
    Styles limités au composant de photo
    placé dans l'en-tête de l'espace membre.
  */

  if(
    !document.getElementById(
      "admin-profile-photo-styles"
    )
  ){

    const style =
      document.createElement(
        "style"
      );

    style.id =
      "admin-profile-photo-styles";

    style.textContent = `

      #adminProfilePhoto {
        width:110px;
        height:110px;
        flex:0 0 110px;
        border:1px solid var(--border);
        background:rgba(255,255,255,.025);
        display:flex;
        align-items:center;
        justify-content:center;
        overflow:hidden;
        box-sizing:border-box;
      }

      #adminProfilePhoto img {
        display:block;
        width:100%;
        height:100%;
        object-fit:cover;
        object-position:center;
      }

      #adminProfilePhoto.empty {
        color:rgba(245,243,237,.30);
        font-family:Arial,sans-serif;
        font-size:9px;
        text-align:center;
        letter-spacing:.08em;
        line-height:1.4;
      }

      #adminProfilePhoto.error {
        color:rgba(245,243,237,.42);
        font-family:Arial,sans-serif;
        font-size:9px;
        text-align:center;
        letter-spacing:.06em;
        line-height:1.4;
        padding:12px;
      }

      @media(max-width:600px){

        #adminProfilePhoto {
          width:80px;
          height:80px;
          flex-basis:80px;
        }

      }

    `;

    document.head.appendChild(
      style
    );

  }


  /*
    Lecture de l'URL actuellement saisie
    dans le profil.
  */

  function actualiserPhoto(){

    const imageInput =
      document.getElementById(
        "profileImage"
      );


    const url =
      imageInput
        ? imageInput.value.trim()
        : "";


    photoContainer.innerHTML =
      "";

    photoContainer.className =
      "";


    /*
      Aucune image.
    */

    if(!url){

      photoContainer.classList.add(
        "empty"
      );

      photoContainer.textContent =
        "AUCUNE PHOTO";

      return;

    }


    /*
      Création de l'image.
    */

    const image =
      document.createElement(
        "img"
      );

    image.alt =
      "Photo de profil";


    image.onload =
      () => {

        photoContainer.className =
          "";

      };


    image.onerror =
      () => {

        photoContainer.className =
          "error";

        photoContainer.textContent =
          "IMAGE IMPOSSIBLE À CHARGER";

      };


    image.src =
      url;


    photoContainer.appendChild(
      image
    );

  }


  /*
    On évite de créer plusieurs écouteurs.
  */

  const imageInput =
    document.getElementById(
      "profileImage"
    );


  if(
    imageInput &&
    imageInput.dataset.headerPhotoInitialise !==
    "true"
  ){

    imageInput.addEventListener(
      "input",
      actualiserPhoto
    );


    imageInput.addEventListener(
      "change",
      actualiserPhoto
    );


    imageInput.dataset.headerPhotoInitialise =
      "true";

  }


  /*
    Affichage immédiat.
  */

  actualiserPhoto();

}


/* =========================================================
   IDENTIFIANT MEMBRE — PARRAINAGE
========================================================= */

function afficherIdentifiantMembre(profile){
  const button = document.getElementById("profileMemberIdCopy");
  if (!button) return;

  const memberId = profile?.id || currentUser?.id || "";
  if (!memberId) {
    button.disabled = true;
    return;
  }

  button.disabled = false;
  if (button.dataset.initialized === "true") return;

  button.addEventListener("click", async () => {
    const status = document.getElementById("profileMemberIdStatus");
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(memberId);
      } else {
        const temporary = document.createElement("textarea");
        temporary.value = memberId;
        temporary.setAttribute("readonly", "");
        temporary.style.position = "fixed";
        temporary.style.opacity = "0";
        document.body.appendChild(temporary);
        temporary.select();
        const copied = document.execCommand("copy");
        temporary.remove();
        if (!copied) throw new Error("Copie impossible");
      }
      if (status) status.textContent = "Identifiant copié";
      button.querySelector("span").textContent = "Copié";
    } catch (error) {
      console.error("COPIE IDENTIFIANT MEMBRE :", error);
      if (status) status.textContent = "Copie impossible";
    }
    window.setTimeout(() => {
      if (status) status.textContent = "";
      const label = button.querySelector("span");
      if (label) label.textContent = "Mon ID parrain";
    }, 1800);
  });

  button.dataset.initialized = "true";
}


/* =========================================================
   MÉDAILLES — INFLUENCE ET PARRAINAGE
========================================================= */

function mettreAJourMedailleVIP(audience){

  const medal = document.getElementById("vipMedal");
  const audienceElement = document.getElementById("vipAudience");
  const valeur = Number(audience || 0);

  if(medal){
    medal.classList.toggle("active", valeur >= 3000);
  }

  if(audienceElement){
    audienceElement.textContent =
      "Audience actuelle : " +
      (audience === null || audience === undefined
        ? "—"
        : valeur.toLocaleString("fr-FR") + " followers");
  }

}

/*
 * SCORE VIP — FORMULE PROVISOIRE.
 * Points = audience maximale × parrainages × dons cumulés depuis l'origine.
 * Chaque facteur nul ou absent vaut 1.
 *
 * NOTE DE FINALISATION :
 * Les dons ne sont pas encore connectés. Le facteur dons vaut donc 1.
 * Lors de la future connexion, utiliser le montant TOTAL historique des dons
 * (sans limite de période), depuis une table Supabase dédiée aux dons.
 * Ne pas ajouter ce montant à profiles.
 */
function mettreAJourNombrePointsVIP(audienceMax, nombreParrainages, donsCumules, poucesVerts = 1){

  const facteur = valeur => {
    const nombre = Number(valeur);
    return Number.isFinite(nombre) && nombre > 0 ? nombre : 1;
  };

  const audience = facteur(audienceMax);
  const audiencePonderee = audience / 100;
  const parrainages = facteur(nombreParrainages);
  const dons = facteur(donsCumules);
  const evaluationsFavorables = facteur(poucesVerts);

  // Même calcul que le déclencheur Supabase ; chaque facteur nul vaut 1.
  const points = Math.min(2147483647, Math.round(audiencePonderee * parrainages * dons * evaluationsFavorables));
  const element = document.getElementById("vipPoints");

  if(element){
    element.textContent = points.toLocaleString("fr-FR");
    element.title =
      "(" + audience.toLocaleString("fr-FR") + " ÷ 100) × " +
      parrainages.toLocaleString("fr-FR") + " × " +
      dons.toLocaleString("fr-FR") + " × " +
      evaluationsFavorables.toLocaleString("fr-FR") +
      " (pouces verts ; dons provisoires)";
  }
  const multiplier = document.getElementById("vipVoteMultiplier");
  if(multiplier){
    multiplier.textContent = "×" + evaluationsFavorables.toLocaleString("fr-FR") + " 👍";
    multiplier.title = "Nombre de pouces verts attribués à des propositions (minimum 1).";
  }
}

async function actualiserFacteurVotesVIP(profile){
  if(!profile || !currentUser?.id) return;
  const {count,error} = await supabaseClient
    .from("contenus_votes")
    .select("id",{count:"exact",head:true})
    .eq("user_id",currentUser.id)
    .eq("vote",1);
  if(error){
    console.error("Impossible de charger le multiplicateur des évaluations :",error);
    return;
  }
  mettreAJourNombrePointsVIP(profile.audience_max,profile.parrainage,1,count||0);
}

/*
 * MÉDAILLE MÉCÈNE — EN ATTENTE DE CONNEXION.
 * Ne pas lire ni écrire de montant dans profiles.
 * À terme, relier cette médaille à une table Supabase dédiée
 * aux dons, avec leurs dates, afin de calculer le total glissant
 * des 6 derniers mois. Aucun lien Supabase n'existe actuellement.
 * La médaille devra perdre son éclairage dès que le total glissant
 * repasse sous 60 € : elle n'est pas acquise à vie.
 */
function mettreAJourMedailleDons(totalSixDerniersMois){

  const medal = document.getElementById("donationMedal");
  const totalElement = document.getElementById("donationTotal");

  const montant =
    totalSixDerniersMois === null ||
    totalSixDerniersMois === undefined ||
    totalSixDerniersMois === ""
      ? NaN
      : Number(totalSixDerniersMois);

  // Sans source de données, le montant reste inconnu et la médaille éteinte.
  if(!Number.isFinite(montant)){
    if(medal) medal.classList.remove("active");
    if(totalElement){
      totalElement.textContent =
        "Dons sur les 6 derniers mois : — / 60 €";
    }
    return;
  }

  if(totalElement){
    totalElement.textContent =
      "Dons sur les 6 derniers mois : " +
      montant.toLocaleString("fr-FR", {
        style:"currency",
        currency:"EUR",
        maximumFractionDigits:2
      }) +
      " / 60 €";
  }

  if(medal){
    medal.classList.toggle("active", montant >= 60);
  }

}

function mettreAJourMedailleParrainage(nombre){

  const medal = document.getElementById("referralMedal");
  const countElement = document.getElementById("referralCount");
  const valeur = Math.max(0, Number(nombre || 0));

  if(medal){
    medal.classList.toggle("active", valeur >= 50);
  }

  if(countElement){
    countElement.textContent =
      "Parrainages actifs : " +
      valeur.toLocaleString("fr-FR") +
      " / 50";
  }

}

function echapperHtmlParrainage(value){

  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}

async function ouvrirPopupParrainages(){

  const modal = document.getElementById("referralModal");
  const list = document.getElementById("referralList");

  if(!modal || !list || !currentUser?.id) return;

  modal.classList.add("active");
  modal.setAttribute("aria-hidden", "false");
  list.innerHTML = '<div class="referral-list-empty">Chargement de vos filleuls…</div>';

  const { data, error } = await supabaseClient
    .from("profiles")
    .select("id, nom, anonyme, created_at")
    .eq("parrain_id", currentUser.id)
    .order("created_at", { ascending:false });

  if(error){
    console.error("PARRAINAGE — CHARGEMENT DES FILLEULS :", error);
    list.innerHTML = '<div class="referral-list-error">Impossible de charger la liste pour le moment.</div>';
    return;
  }

  const filleuls = data || [];
  mettreAJourMedailleParrainage(filleuls.length);

  if(!filleuls.length){
    list.innerHTML = '<div class="referral-list-empty">Aucun profil n’a encore utilisé votre identifiant de parrainage.</div>';
    return;
  }

  list.innerHTML = filleuls.map(membre => {
    const nom = membre.anonyme
      ? "Membre anonyme"
      : (membre.nom || "Membre");
    const date = membre.created_at
      ? new Date(membre.created_at).toLocaleDateString("fr-FR")
      : "";
    return `
      <div class="referral-list-item">
        <span class="referral-list-name">${echapperHtmlParrainage(nom)}</span>
        <span class="referral-list-date">${echapperHtmlParrainage(date)}</span>
      </div>
    `;
  }).join("");

}

function initialiserPopupParrainages(){

  const medal = document.getElementById("referralMedal");
  if(!medal || medal.dataset.initialized === "true") return;

  const ouvrir = () => ouvrirPopupParrainages();

  medal.addEventListener("click", ouvrir);
  medal.addEventListener("keydown", event => {
    if(event.key === "Enter" || event.key === " "){
      event.preventDefault();
      ouvrir();
    }
  });

  medal.dataset.initialized = "true";

  let modal = document.getElementById("referralModal");
  if(!modal){
    modal = document.createElement("div");
    modal.id = "referralModal";
    modal.className = "modal";
    modal.setAttribute("aria-hidden", "true");
    modal.innerHTML = `
      <div class="modal-box" role="dialog" aria-modal="true" aria-labelledby="referralModalTitle">
        <button type="button" class="modal-close" id="referralModalClose" aria-label="Fermer">×</button>
        <div class="page-kicker">PARRAINAGE</div>
        <h2 id="referralModalTitle">Vos filleuls</h2>
        <p>Liste des membres ayant utilisé votre identifiant de parrainage et dont le profil est toujours actif.</p>
        <div id="referralList" class="referral-list"></div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  document.getElementById("referralModalClose")?.addEventListener("click", () => {
    modal.classList.remove("active");
    modal.setAttribute("aria-hidden", "true");
  });

  modal.addEventListener("click", event => {
    if(event.target === modal){
      modal.classList.remove("active");
      modal.setAttribute("aria-hidden", "true");
    }
  });

  document.addEventListener("keydown", event => {
    if(event.key === "Escape" && modal.classList.contains("active")){
      modal.classList.remove("active");
      modal.setAttribute("aria-hidden", "true");
    }
  });

}

window.mettreAJourMedailleVIP = mettreAJourMedailleVIP;
window.mettreAJourMedailleParrainage = mettreAJourMedailleParrainage;


/* =========================================================
   VALIDATION DU PARRAIN
========================================================= */

let validationParrainTimer = null;
let validationParrainSequence = 0;
let validationParrainEtat = "empty";

function afficherEtatValidationParrain(etat, message){

  const icon = document.getElementById("profileSponsorIcon");
  const status = document.getElementById("profileSponsorStatus");

  validationParrainEtat = etat;

  if(icon){
    icon.className = "sponsor-validation-icon " + etat;
    icon.textContent =
      etat === "valid" ? "✓" :
      etat === "invalid" ? "✕" :
      etat === "checking" ? "…" : "—";
  }

  if(status){
    status.className = "help sponsor-validation-status " + etat;
    status.textContent = message || "";
  }

}

async function verifierIdentifiantParrain(){

  const input = document.getElementById("profileSponsorId");
  if(!input) return true;

  const identifiant = input.value.trim();
  const sequence = ++validationParrainSequence;

  if(!identifiant){
    afficherEtatValidationParrain(
      "empty",
      "Aucun parrain renseigné."
    );
    return true;
  }

  const formatUUID =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if(!formatUUID.test(identifiant)){
    afficherEtatValidationParrain(
      "invalid",
      "Identifiant invalide : le format attendu est un identifiant membre complet."
    );
    return false;
  }

  if(identifiant.toLowerCase() === String(currentUser?.id || "").toLowerCase()){
    afficherEtatValidationParrain(
      "invalid",
      "Vous ne pouvez pas être votre propre parrain."
    );
    return false;
  }

  afficherEtatValidationParrain(
    "checking",
    "Vérification de l’identifiant…"
  );

  const { data, error } = await supabaseClient
    .from("profiles")
    .select("id, nom, anonyme")
    .eq("id", identifiant)
    .maybeSingle();

  if(sequence !== validationParrainSequence) return false;

  if(error){
    console.error("VALIDATION IDENTIFIANT PARRAIN :", error);
    afficherEtatValidationParrain(
      "invalid",
      "Vérification impossible. Réessayez dans un instant."
    );
    return false;
  }

  if(!data){
    afficherEtatValidationParrain(
      "invalid",
      "Aucun membre ne correspond à cet identifiant."
    );
    return false;
  }

  const nomParrain =
    data.anonyme
      ? "Membre anonyme"
      : (data.nom || "").trim() || "Nom non renseigné";

  afficherEtatValidationParrain(
    "valid",
    "Identifiant valide : " + nomParrain + "."
  );

  return true;

}

function initialiserChampParrain(profile){

  const input = document.getElementById("profileSponsorId");
  if(!input) return;

  if(!document.getElementById("profile-sponsor-styles")){
    const style = document.createElement("style");
    style.id = "profile-sponsor-styles";
    style.textContent = `
      .sponsor-input-wrap{
        display:flex;
        align-items:center;
        gap:10px;
      }
      .sponsor-input-wrap input{
        flex:1;
        min-width:0;
      }
      .sponsor-validation-icon{
        display:flex;
        align-items:center;
        justify-content:center;
        width:28px;
        height:28px;
        flex:0 0 28px;
        border:1px solid rgba(255,255,255,.16);
        border-radius:50%;
        color:rgba(245,243,237,.45);
        font-family:Arial,sans-serif;
        font-size:18px;
        font-weight:800;
      }
      .sponsor-validation-icon.valid{
        color:#35d078;
        border-color:rgba(53,208,120,.5);
        background:rgba(53,208,120,.09);
      }
      .sponsor-validation-icon.invalid{
        color:#ef4135;
        border-color:rgba(239,65,53,.5);
        background:rgba(239,65,53,.09);
      }
      .sponsor-validation-icon.checking{
        color:var(--gold-light,#f0d58a);
        border-color:rgba(214,173,85,.4);
      }
      .sponsor-validation-status.valid{color:#35d078}
      .sponsor-validation-status.invalid{color:#ff8178}
    `;
    document.head.appendChild(style);
  }

  input.value = profile?.parrain_id || "";

  if(input.dataset.initialized !== "true"){
    input.addEventListener("input", () => {
      validationParrainSequence++;
      window.clearTimeout(validationParrainTimer);
      afficherEtatValidationParrain(
        input.value.trim() ? "checking" : "empty",
        input.value.trim() ? "Vérification de l’identifiant…" : "Aucun parrain renseigné."
      );
      validationParrainTimer = window.setTimeout(
        verifierIdentifiantParrain,
        350
      );
    });

    input.addEventListener("blur", verifierIdentifiantParrain);
    input.dataset.initialized = "true";
  }

  verifierIdentifiantParrain();

}


/* =========================================================
   REMPLIR PROFIL
========================================================= */

function remplirProfil(profile){

  afficherIdentifiantMembre(profile);
  initialiserPopupParrainages();
  initialiserChampParrain(profile);
  actualiserMethodeMotDePasse();

  // Le facteur dons reste à 1 tant que la table dédiée n'est pas connectée.
  mettreAJourNombrePointsVIP(
    profile.audience_max,
    profile.parrainage,
    1,
    1
  );
  actualiserFacteurVotesVIP(profile);

  document
    .getElementById("profileNom")
    .value =
      profile.nom || "";


  const profileEmailValue = document.getElementById("profileEmailValue");
  if (profileEmailValue) {
    profileEmailValue.textContent =
      (currentUser?.email || profile.email || "")
        .trim()
        .toLowerCase();
  }


  document
    .getElementById("profileRegion")
    .value =
      profile.region || "";


  document
    .getElementById("profileImage")
    .value =
      profile.image_url || "";


  /*
    Initialisation de la photo dans l'en-tête.
  */

  initialiserPhotoProfil();


  const imageInput =
    document.getElementById(
      "profileImage"
    );


  if(imageInput){

    imageInput.dispatchEvent(
      new Event(
        "input",
        {
          bubbles:true
        }
      )
    );

  }


  document
    .getElementById("profileDescription")
    .value =
      profile.description || "";


  /*
    Initialisation et actualisation du compteur
    de description.
  */

  initialiserCompteurDescription();


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

  mettreAJourMedailleParrainage(
    profile.parrainage
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


    // L'adresse de référence est celle du compte authentifié.
    // Le champ du profil est en lecture seule.
    const email =
      (currentUser?.email || "")
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

    const parrainIdInput =
      document.getElementById("profileSponsorId");

    const parrain_id =
      parrainIdInput?.value.trim() || null;

    const parrainValide =
      await verifierIdentifiantParrain();

    if(!parrainValide){
      afficherMessage(
        profileMessage,
        "error",
        "L’identifiant du parrain est invalide. Corrigez-le ou laissez le champ vide."
      );
      saveProfileButton.disabled = false;
      saveProfileButton.textContent = "ENREGISTRER LES MODIFICATIONS";
      return;
    }

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
      possède un poste régional, tous ses rôles sont
      supprimés.
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

          parrain_id:
            parrain_id,

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


      const urlSocialDejaUtilisee =
        error.code === "23505" &&
        error.message === "URL_SOCIAL_DEJA_UTILISEE";

      const reseauConcerne =
        error.details || "ce réseau social";

      afficherMessage(
        profileMessage,
        "error",
        urlSocialDejaUtilisee
          ? `Cette page ${reseauConcerne} est déjà associée à un autre membre. Chaque page ne peut être utilisée que par un seul profil.`
          : "Impossible d'enregistrer les modifications. Vérifiez les droits de la table profiles dans Supabase."
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

    window.currentProfile =
      data;


    /*
      Si le poste régional vient d'être supprimé,
      on force également le décochage visuel de
      toutes les cases ROLE.
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


    afficherMessage(
      profileMessage,
      "success",
      perteDroitsRegionaux
        ? "Votre profil a bien été mis à jour. Votre fonction régionale et vos rôles ont été supprimés."
        : "Votre profil a bien été mis à jour."
    );


    mettreAJourMedailleVIP(
      data.audience_max
    );

    mettreAJourMedailleParrainage(
      data.parrainage
    );


    document
      .getElementById("adminUser")
      .innerHTML =
        "Connecté en tant que <strong>" +
        (data.nom || currentUser.email) +
        "</strong>";


    /*
      Actualisation de la photo dans l'en-tête
      après sauvegarde.
    */

    initialiserPhotoProfil();


    const imageInput =
      document.getElementById(
        "profileImage"
      );


    if(imageInput){

      imageInput.dispatchEvent(
        new Event(
          "input",
          {
            bubbles:true
          }
        )
      );

    }


    if(perteDroitsRegionaux){

      await chargerGestionEquipes();

    }


    saveProfileButton.disabled = false;

    saveProfileButton.textContent =
      "ENREGISTRER LES MODIFICATIONS";

  }
);


/* =========================================================
   EXPOSITION POUR LES AUTRES MODULES
========================================================= */

/*
   admin-auth.js appelle explicitement :

   window.remplirProfil(profile)

   Les modules ES6 ne placent pas automatiquement
   leurs fonctions dans window.

   Cette exposition est donc nécessaire pour permettre
   au module d'authentification de remplir le profil
   après chargement de la session.
*/

window.remplirProfil =
  remplirProfil;


/* =========================================================
   INITIALISATION ÉCOUTEUR ONGLET PROFIL
========================================================= */

initialiserEcouteurOngletProfil();
