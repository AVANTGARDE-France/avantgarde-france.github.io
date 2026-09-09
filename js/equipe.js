/* =========================================================
   AVANT-GARDE — NOTRE ÉQUIPE
   js/equipe.js

   Logique spécifique à la page équipe.
========================================================= */


/* =========================================================
   DONNÉES
========================================================= */

let membres = [];


const reseauxSociaux = [

  {
    champ: "facebook_url",
    nom: "Facebook",
    logo: "https://cdn.simpleicons.org/facebook/1877F2",
    audienceChamp: "facebook_audience"
  },

  {
    champ: "x_url",
    nom: "X",
    logo: "https://cdn.simpleicons.org/x/FFFFFF",
    audienceChamp: "x_audience"
  },

  {
    champ: "instagram_url",
    nom: "Instagram",
    logo: "https://cdn.simpleicons.org/instagram/E4405F",
    audienceChamp: "instagram_audience"
  },

  {
    champ: "youtube_url",
    nom: "YouTube",
    logo: "https://cdn.simpleicons.org/youtube/FF0000",
    audienceChamp: "youtube_audience"
  },

  {
    champ: "tiktok_url",
    nom: "TikTok",
    logo: "https://cdn.simpleicons.org/tiktok/FFFFFF",
    audienceChamp: "tiktok_audience"
  }

];


/* =========================================================
   OUTILS
========================================================= */

function escapeHtml(value) {

  if (value === null || value === undefined) {
    return "";
  }

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}


function ouvrirModalEquipe(modal) {

  if (!modal) {
    return;
  }

  modal.classList.add("active");
  document.body.style.overflow = "hidden";

}


function fermerModalEquipe(modal) {

  if (!modal) {
    return;
  }

  modal.classList.remove("active");

  if (
    !document.querySelector(
      ".profile-modal.active, .join-modal.active, .rdv-modal.active"
    )
  ) {
    document.body.style.overflow = "";
  }

}


function imageValide(url) {

  if (!url || typeof url !== "string") {
    return false;
  }

  try {

    const parsed = new URL(url);

    return (
      parsed.protocol === "http:" ||
      parsed.protocol === "https:"
    );

  } catch (error) {

    return false;

  }

}


function urlValide(url) {

  if (!url || typeof url !== "string") {
    return false;
  }

  try {

    const parsed = new URL(url);

    return (
      parsed.protocol === "http:" ||
      parsed.protocol === "https:"
    );

  } catch (error) {

    return false;

  }

}


function normaliserCompetences(value) {

  if (!value) {
    return [];
  }


  if (Array.isArray(value)) {

    return value
      .map(item => String(item).trim())
      .filter(Boolean);

  }


  if (typeof value === "string") {

    const texte = value.trim();

    if (!texte) {
      return [];
    }


    try {

      const parsed = JSON.parse(texte);

      if (Array.isArray(parsed)) {

        return parsed
          .map(item => String(item).trim())
          .filter(Boolean);

      }

    } catch (error) {
      // Ce n'est pas du JSON.
    }


    return texte
      .split(",")
      .map(item => item.trim())
      .filter(Boolean);

  }


  return [];

}


function formaterAudience(valeur) {

  const nombre = Number(valeur);

  if (!Number.isFinite(nombre) || nombre <= 0) {
    return "0";
  }

  return nombre.toLocaleString("fr-FR");

}


function obtenirAudience(membre, reseau) {

  const valeur = Number(
    membre[reseau.audienceChamp]
  );

  if (!Number.isFinite(valeur) || valeur < 0) {
    return 0;
  }

  return valeur;

}


/* =========================================================
   RÉSEAUX SOCIAUX
========================================================= */

function afficherReseauxSociaux(membre) {

  const container =
    document.getElementById("profileModalSocials");

  const audienceMaxContainer =
    document.getElementById("profileModalAudienceMax");


  if (!container) {
    return;
  }


  container.innerHTML = "";


  if (audienceMaxContainer) {

    audienceMaxContainer.innerHTML = "";
    audienceMaxContainer.style.display = "none";

  }


  const reseauxDisponibles =
    reseauxSociaux.filter(reseau => {

      return urlValide(
        membre[reseau.champ]
      );

    });


  if (!reseauxDisponibles.length) {

    const section =
      document.getElementById("profileSocialSection");

    if (section) {
      section.style.display = "none";
    }

    return;

  }


  const section =
    document.getElementById("profileSocialSection");

  if (section) {
    section.style.display = "";
  }


  /*
   * Calcul de l'audience maximale.
   */

  const audiences = reseauxDisponibles.map(reseau => {

    return {
      reseau,
      audience: obtenirAudience(membre, reseau)
    };

  });


  let reseauMax = null;


  /*
   * On privilégie le réseau enregistré par le système
   * d'update-audience lorsqu'il correspond réellement
   * à une audience disponible.
   */

  if (membre.audience_reseau) {

    const reseauIndique =
      audiences.find(item => {

        return (
          String(item.reseau.nom).toLowerCase() ===
          String(membre.audience_reseau).toLowerCase()
        );

      });


    if (
      reseauIndique &&
      reseauIndique.audience > 0
    ) {

      reseauMax = reseauIndique;

    }

  }


  /*
   * Sinon, calcul automatique.
   */

  if (!reseauMax) {

    audiences.forEach(item => {

      if (
        item.audience > 0 &&
        (
          !reseauMax ||
          item.audience > reseauMax.audience
        )
      ) {

        reseauMax = item;

      }

    });

  }


  /*
   * Création des boutons réseaux.
   */

  audiences.forEach(item => {

    const reseau = item.reseau;
    const audience = item.audience;

    const lien = document.createElement("a");

    lien.className = "profile-social-link";

    lien.href = reseau.champ
      ? membre[reseau.champ]
      : "#";

    lien.target = "_blank";
    lien.rel = "noopener noreferrer";

    lien.title =
      `${reseau.nom} — ${formaterAudience(audience)} abonnés`;


    const isMax =
      Boolean(
        reseauMax &&
        reseauMax.reseau.nom === reseau.nom &&
        reseauMax.audience > 0
      );


    if (isMax) {
      lien.classList.add("is-max");
    }


    const itemHtml = document.createElement("div");

    itemHtml.className = "profile-social-item";


    if (isMax) {

      itemHtml.innerHTML = `
        <div class="profile-social-max-star"
             aria-label="Audience maximale">
          ★
        </div>
      `;

    }


    const image = document.createElement("img");

    image.src = reseau.logo;
    image.alt = reseau.nom;
    image.loading = "lazy";


    const nom = document.createElement("strong");

    nom.textContent = reseau.nom;


    const audienceElement =
      document.createElement("span");

    audienceElement.className =
      "profile-social-audience";

    audienceElement.textContent =
      formaterAudience(audience);


    lien.appendChild(image);
    lien.appendChild(nom);
    lien.appendChild(audienceElement);

    itemHtml.appendChild(lien);

    container.appendChild(itemHtml);

  });


  /*
   * Audience maximale.
   */

  let audienceMax = 0;


  const audienceBase =
    Number(membre.audience_max);


  if (
    Number.isFinite(audienceBase) &&
    audienceBase > 0
  ) {

    audienceMax = audienceBase;

  }


  if (
    reseauMax &&
    reseauMax.audience > audienceMax
  ) {

    audienceMax = reseauMax.audience;

  }


  if (
    audienceMaxContainer &&
    audienceMax > 0
  ) {

    let dateTexte = "";


    if (membre.audience_updated_at) {

      const date =
        new Date(membre.audience_updated_at);


      if (!Number.isNaN(date.getTime())) {

        const datePart =
          date.toLocaleDateString(
            "fr-FR",
            {
              day: "2-digit",
              month: "2-digit",
              year: "numeric"
            }
          );


        const heurePart =
          date.toLocaleTimeString(
            "fr-FR",
            {
              hour: "2-digit",
              minute: "2-digit"
            }
          );


        dateTexte =
          ` <small>· mis à jour le ${datePart} à ${heurePart}</small>`;

      }

    }


    audienceMaxContainer.innerHTML = `
      Audience max :
      <strong>${escapeHtml(formaterAudience(audienceMax))}</strong>
      ${dateTexte}
    `;

    audienceMaxContainer.style.display = "";

  }

}


/* =========================================================
   CHARGEMENT DES MEMBRES
========================================================= */

async function chargerMembres() {

  const grid =
    document.getElementById("teamGrid");


  if (!grid) {
    return;
  }


  grid.innerHTML = `
    <div class="events-empty">
      Chargement des membres…
    </div>
  `;


  if (
    typeof supabaseClient === "undefined" ||
    !supabaseClient
  ) {

    grid.innerHTML = `
      <div class="events-empty">
        Impossible de contacter la base de données.
      </div>
    `;

    console.error(
      "supabaseClient est introuvable."
    );

    return;

  }


  const {
    data,
    error
  } = await supabaseClient

    .from("profiles")

    .select(`
      id,
      created_at,
      nom,
      grade,
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
      facebook_audience,
      instagram_audience,
      x_audience,
      youtube_audience,
      tiktok_audience,
      audience_max,
      audience_reseau,
      audience_updated_at
    `)

    .eq("anonyme", false)

    .order(
      "created_at",
      {
        ascending: true
      }
    );


  if (error) {

    console.error(
      "Erreur chargement membres :",
      error
    );


    grid.innerHTML = `
      <div class="events-empty">
        Impossible de charger l’équipe.
      </div>
    `;

    return;

  }


  membres = Array.isArray(data)
    ? data
    : [];


  if (!membres.length) {

    grid.innerHTML = `
      <div class="events-empty">
        Aucun membre public pour le moment.
      </div>
    `;

    return;

  }


  grid.innerHTML = "";


  membres.forEach(membre => {

    const card =
      document.createElement("article");


    card.className = "member-card";

    card.tabIndex = 0;

    card.setAttribute(
      "role",
      "button"
    );

    card.setAttribute(
      "aria-label",
      `Voir le profil de ${membre.nom || "ce membre"}`
    );


    const imageUrl =
      imageValide(membre.image_url)
        ? membre.image_url
        : "";


    const nom =
      escapeHtml(
        membre.nom || "Membre"
      );


    const grade =
      escapeHtml(
        membre.grade || "Membre"
      );


    const region =
      escapeHtml(
        membre.region || ""
      );


    let description =
      String(
        membre.description || ""
      );


    if (description.length > 180) {

      description =
        `${description.slice(0, 180).trim()}…`;

    }


    description =
      escapeHtml(description);


    if (imageUrl) {

      card.innerHTML = `

        <img
          class="member-photo"
          src="${escapeHtml(imageUrl)}"
          alt="${nom}"
          loading="lazy"
        >

        <div class="member-info">

          <h3 class="member-name">
            ${nom}
          </h3>

          <div class="member-grade">
            ${grade}
          </div>

          ${
            region
              ? `
                <div class="member-region">
                  ${region}
                </div>
              `
              : ""
          }

          ${
            description
              ? `
                <div class="member-description">
                  ${description}
                </div>
              `
              : ""
          }

        </div>

      `;

    } else {

      card.innerHTML = `

        <div class="member-photo-placeholder">
          A
        </div>

        <div class="member-info">

          <h3 class="member-name">
            ${nom}
          </h3>

          <div class="member-grade">
            ${grade}
          </div>

          ${
            region
              ? `
                <div class="member-region">
                  ${region}
                </div>
              `
              : ""
          }

          ${
            description
              ? `
                <div class="member-description">
                  ${description}
                </div>
              `
              : ""
          }

        </div>

      `;

    }


    card.addEventListener(
      "click",
      () => ouvrirProfil(membre)
    );


    card.addEventListener(
      "keydown",
      event => {

        if (
          event.key === "Enter" ||
          event.key === " "
        ) {

          event.preventDefault();

          ouvrirProfil(membre);

        }

      }
    );


    grid.appendChild(card);

  });

}


/* =========================================================
   OUVERTURE PROFIL
========================================================= */

function ouvrirProfil(membre) {

  if (!membre) {
    return;
  }


  const modal =
    document.getElementById("memberModal");


  if (!modal) {
    return;
  }


  const image =
    document.getElementById("profileModalImage");


  const placeholder =
    document.getElementById("profilePlaceholder");


  const name =
    document.getElementById("profileModalName");


  const grade =
    document.getElementById("profileModalGrade");


  const region =
    document.getElementById("profileModalRegion");


  const description =
    document.getElementById(
      "profileModalDescription"
    );


  if (name) {

    name.textContent =
      membre.nom || "Membre";

  }


  if (grade) {

    grade.textContent =
      membre.grade || "Membre";

  }


  if (region) {

    region.textContent =
      membre.region || "";

  }


  if (description) {

    description.textContent =
      membre.description || "";

  }


  /*
   * Image.
   */

  if (
    image &&
    imageValide(membre.image_url)
  ) {

    image.src =
      membre.image_url;

    image.alt =
      membre.nom || "Membre";

    image.style.display =
      "block";


    if (placeholder) {

      placeholder.style.display =
        "none";

    }

  } else {

    if (image) {

      image.removeAttribute("src");

      image.style.display =
        "none";

    }


    if (placeholder) {

      placeholder.style.display =
        "flex";

      placeholder.textContent =
        membre.nom
          ? String(membre.nom)
              .trim()
              .charAt(0)
              .toUpperCase()
          : "A";

    }

  }


  /*
   * Réseaux sociaux.
   */

  afficherReseauxSociaux(membre);


  /*
   * Compétences.
   */

  const competenceContainer =
    document.getElementById(
      "profileModalCompetences"
    );


  if (competenceContainer) {

    competenceContainer.innerHTML = "";


    const competences =
      normaliserCompetences(
        membre.competences
      )
      .filter(
        competence =>
          String(competence)
            .trim()
            .toUpperCase() !== "VIP"
      );


    if (competences.length) {

      const section =
        document.getElementById(
          "profileCompetenceSection"
        );


      if (section) {
        section.style.display = "";
      }


      competences.forEach(competence => {

        const tag =
          document.createElement("span");

        tag.className =
          "competence-tag";

        tag.textContent =
          competence;

        competenceContainer.appendChild(tag);

      });

    } else {

      const section =
        document.getElementById(
          "profileCompetenceSection"
        );


      if (section) {
        section.style.display = "none";
      }

    }

  }


  /*
   * VIP.
   *
   * Priorité à audience_max enregistrée.
   * Si elle n'existe pas, on recalcule.
   */

  const vipContainer =
    document.getElementById(
      "profileModalVip"
    );


  if (vipContainer) {

    let audienceMax =
      Number(membre.audience_max);


    if (
      !Number.isFinite(audienceMax) ||
      audienceMax < 0
    ) {

      audienceMax = 0;

    }


    reseauxSociaux.forEach(reseau => {

      const audience =
        obtenirAudience(
          membre,
          reseau
        );


      if (audience > audienceMax) {

        audienceMax = audience;

      }

    });


    if (audienceMax >= 3000) {

      vipContainer.innerHTML = `
        <span class="vip-medal">
          ★ VIP
        </span>
      `;

      vipContainer.style.display =
        "";

    } else {

      vipContainer.innerHTML =
        "";

      vipContainer.style.display =
        "none";

    }

  }


  ouvrirModalEquipe(modal);

}


/* =========================================================
   COMPTEUR DESCRIPTION
========================================================= */

function mettreAJourCompteurDescription() {

  const textarea =
    document.getElementById(
      "descriptionField"
    );


  const compteur =
    document.getElementById(
      "descriptionCount"
    );


  if (!textarea || !compteur) {
    return;
  }


  const longueur =
    textarea.value.length;


  compteur.textContent =
    `${longueur} / 300`;


  compteur.classList.toggle(
    "warning",
    longueur >= 270 &&
    longueur < 300
  );


  compteur.classList.toggle(
    "limit",
    longueur >= 300
  );

}


/* =========================================================
   OUVERTURE INSCRIPTION
========================================================= */

function initialiserOuvertureInscription() {

  const bouton =
    document.getElementById(
      "openJoin"
    );


  const modal =
    document.getElementById(
      "joinModal"
    );


  const message =
    document.getElementById(
      "formMessage"
    );


  if (!bouton || !modal) {
    return;
  }


  bouton.addEventListener(
    "click",
    () => {

      if (message) {

        message.textContent =
          "";

        message.className =
          "form-message";

      }


      ouvrirModalEquipe(modal);

      mettreAJourCompteurDescription();

    }
  );

}


/* =========================================================
   FERMETURE MODALES
========================================================= */

function initialiserFermetureModales() {

  const memberModal =
    document.getElementById(
      "memberModal"
    );


  const joinModal =
    document.getElementById(
      "joinModal"
    );


  const closeMember =
    document.getElementById(
      "closeMember"
    );


  const closeJoin =
    document.getElementById(
      "closeJoin"
    );


  if (closeMember && memberModal) {

    closeMember.addEventListener(
      "click",
      () => {

        fermerModalEquipe(memberModal);

      }
    );

  }


  if (closeJoin && joinModal) {

    closeJoin.addEventListener(
      "click",
      () => {

        fermerModalEquipe(joinModal);

      }
    );

  }


  if (memberModal) {

    memberModal.addEventListener(
      "click",
      event => {

        if (
          event.target === memberModal
        ) {

          fermerModalEquipe(
            memberModal
          );

        }

      }
    );

  }


  if (joinModal) {

    joinModal.addEventListener(
      "click",
      event => {

        if (
          event.target === joinModal
        ) {

          fermerModalEquipe(
            joinModal
          );

        }

      }
    );

  }


  document.addEventListener(
    "keydown",
    event => {

      if (event.key !== "Escape") {
        return;
      }


      if (
        memberModal &&
        memberModal.classList.contains("active")
      ) {

        fermerModalEquipe(
          memberModal
        );

        return;

      }


      if (
        joinModal &&
        joinModal.classList.contains("active")
      ) {

        fermerModalEquipe(
          joinModal
        );

      }

    }
  );

}


/* =========================================================
   FORMULAIRE INSCRIPTION
========================================================= */

function initialiserFormulaireInscription() {

  const form =
    document.getElementById(
      "joinForm"
    );


  if (!form) {
    return;
  }


  form.addEventListener(
    "submit",
    async event => {

      event.preventDefault();


      const nomField =
        document.getElementById("nom");


      const emailField =
        document.getElementById("email");


      const regionField =
        document.getElementById("region");


      const imageField =
        document.getElementById("image_url");


      const descriptionField =
        document.getElementById(
          "descriptionField"
        );


      const submitButton =
        document.getElementById(
          "submitJoin"
        );


      const message =
        document.getElementById(
          "formMessage"
        );


      const typeInscription =
        document.querySelector(
          'input[name="type_inscription"]:checked'
        );


      if (
        !nomField ||
        !emailField ||
        !regionField ||
        !descriptionField
      ) {

        return;

      }


      const nom =
        nomField.value.trim();


      const email =
        emailField.value.trim()
          .toLowerCase();


      const region =
        regionField.value.trim();


      const image_url =
        imageField
          ? imageField.value.trim()
          : "";


      const description =
        descriptionField.value.trim();


      const anonyme =
        typeInscription
          ? typeInscription.value === "anonyme"
          : false;


      const competences =
        Array.from(
          document.querySelectorAll(
            'input[name="competences"]:checked'
          )
        )
        .map(input => input.value)
        .filter(Boolean);


      /*
       * Réinitialisation message.
       */

      if (message) {

        message.textContent =
          "";

        message.className =
          "form-message";

      }


      /*
       * Validation.
       */

      if (!nom) {

        afficherErreurFormulaire(
          message,
          "Merci d’indiquer votre nom."
        );

        nomField.focus();

        return;

      }


      if (!email) {

        afficherErreurFormulaire(
          message,
          "Merci d’indiquer votre adresse email."
        );

        emailField.focus();

        return;

      }


      const emailValide =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          .test(email);


      if (!emailValide) {

        afficherErreurFormulaire(
          message,
          "L’adresse email semble invalide."
        );

        emailField.focus();

        return;

      }


      if (!region) {

        afficherErreurFormulaire(
          message,
          "Merci d’indiquer votre région."
        );

        regionField.focus();

        return;

      }


      if (!description) {

        afficherErreurFormulaire(
          message,
          "Merci de renseigner une présentation."
        );

        descriptionField.focus();

        return;

      }


      if (description.length > 300) {

        afficherErreurFormulaire(
          message,
          "La présentation ne doit pas dépasser 300 caractères."
        );

        descriptionField.focus();

        return;

      }


      if (
        image_url &&
        !imageValide(image_url)
      ) {

        afficherErreurFormulaire(
          message,
          "L’URL de la photo semble invalide."
        );

        imageField.focus();

        return;

      }


      if (
        typeof supabaseClient === "undefined" ||
        !supabaseClient
      ) {

        afficherErreurFormulaire(
          message,
          "La connexion à la base de données est indisponible."
        );

        return;

      }


      /*
       * Désactivation bouton.
       */

      if (submitButton) {

        submitButton.disabled =
          true;

        submitButton.textContent =
          "INSCRIPTION EN COURS…";

      }


      try {

        /*
         * Vérification email déjà présent.
         */

        const {
          data: doublon,
          error: erreurDoublon
        } = await supabaseClient

          .from("profiles")

          .select("id")

          .ilike(
            "email",
            email
          )

          .limit(1);


        if (erreurDoublon) {
          throw erreurDoublon;
        }


        if (
          Array.isArray(doublon) &&
          doublon.length > 0
        ) {

          afficherErreurFormulaire(
            message,
            "Cette adresse email est déjà enregistrée."
          );

          return;

        }


        /*
         * UUID.
         */

        const id =
          crypto.randomUUID();


        /*
         * Insertion.
         */

        const {
          error: erreurInsertion
        } = await supabaseClient

          .from("profiles")

          .insert({

            id,

            nom,

            grade: "user",

            email,

            image_url:
              image_url || null,

            description:
              description || null,

            region,

            competences,

            anonyme

          });


        if (erreurInsertion) {
          throw erreurInsertion;
        }


        /*
         * Succès.
         */

        if (message) {

          message.textContent =
            "Votre inscription a bien été enregistrée. Merci de rejoindre l’Avant-gardE.";

          message.className =
            "form-message success";

        }


        form.reset();


        /*
         * Le choix par défaut redevient sympathisant.
         */

        const radioSympathisant =
          document.querySelector(
            'input[name="type_inscription"][value="sympathisant"]'
          );


        if (radioSympathisant) {

          radioSympathisant.checked =
            true;

        }


        mettreAJourCompteurDescription();


        /*
         * Recharge l'équipe après un court délai.
         */

        setTimeout(
          () => {

            chargerMembres();

          },
          1800
        );


      } catch (error) {

        console.error(
          "Erreur inscription :",
          error
        );


        afficherErreurFormulaire(
          message,
          "Une erreur est survenue lors de l’inscription. Veuillez réessayer."
        );


      } finally {

        if (submitButton) {

          submitButton.disabled =
            false;

          submitButton.textContent =
            "REJOINDRE L’AVANT-GARDE";

        }

      }

    }
  );

}


/* =========================================================
   MESSAGE ERREUR
========================================================= */

function afficherErreurFormulaire(
  element,
  texte
) {

  if (!element) {
    return;
  }


  element.textContent =
    texte;


  element.className =
    "form-message error";

}


/* =========================================================
   COMPTEUR
========================================================= */

function initialiserCompteurDescription() {

  const textarea =
    document.getElementById(
      "descriptionField"
    );


  if (!textarea) {
    return;
  }


  textarea.addEventListener(
    "input",
    mettreAJourCompteurDescription
  );


  mettreAJourCompteurDescription();

}


/* =========================================================
   INITIALISATION
========================================================= */

async function initialiserEquipe() {

  await chargerMembres();

  initialiserOuvertureInscription();

  initialiserFermetureModales();

  initialiserFormulaireInscription();

  initialiserCompteurDescription();

}


/* =========================================================
   DOM READY
========================================================= */

if (
  document.readyState === "loading"
) {

  document.addEventListener(
    "DOMContentLoaded",
    initialiserEquipe
  );

} else {

  initialiserEquipe();

}
