/* =========================================================
   AVANT-GARDE — NOTRE ÉQUIPE
   js/equipe.js

   Logique spécifique à la page équipe.

   Les éléments communs au site sont gérés par :
   - js/supabase.js
   - js/components.js
========================================================= */


/* =========================================================
   VARIABLES
========================================================= */

let membres = [];


/* =========================================================
   RÉSEAUX SOCIAUX
========================================================= */

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
   ÉCHAPPEMENT HTML
========================================================= */

function escapeHtml(value) {

  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}


/* =========================================================
   OUTILS — MODALES
========================================================= */

function ouvrirModalEquipe(modal) {

  if (!modal) return;

  modal.classList.add("active");

  modal.setAttribute(
    "aria-hidden",
    "false"
  );

  document.body.style.overflow = "hidden";

}


function fermerModalEquipe(modal) {

  if (!modal) return;

  modal.classList.remove("active");

  modal.setAttribute(
    "aria-hidden",
    "true"
  );

  /*
     Ne réactive le scroll que si aucune
     autre modale n'est ouverte.
  */

  const autreModaleOuverte =
    document.querySelector(
      ".modal.active, .rdv-modal.active"
    );

  if (!autreModaleOuverte) {

    document.body.style.overflow = "";

  }

}


/* =========================================================
   VALIDATION IMAGE / URL
========================================================= */

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

  } catch {

    return false;

  }

}


function imageValide(url) {

  return urlValide(url);

}


/* =========================================================
   NORMALISATION DES COMPÉTENCES
========================================================= */

function normaliserCompetences(value) {

  if (!value) return [];


  if (Array.isArray(value)) {

    return value
      .map(item => String(item).trim())
      .filter(Boolean);

  }


  if (typeof value === "string") {

    try {

      const parsed = JSON.parse(value);

      if (Array.isArray(parsed)) {

        return parsed
          .map(item => String(item).trim())
          .filter(Boolean);

      }

    } catch {

      /*
         La valeur peut être une chaîne classique.
      */

    }


    return value
      .split(",")
      .map(item => item.trim())
      .filter(Boolean);

  }


  return [];

}


/* =========================================================
   FORMATAGE AUDIENCE
========================================================= */

function formaterAudience(valeur) {

  if (
    valeur === null ||
    valeur === undefined ||
    valeur === ""
  ) {

    return "";

  }


  const nombre = Number(valeur);


  if (!Number.isFinite(nombre)) {

    return "";

  }


  return nombre.toLocaleString("fr-FR");

}


/* =========================================================
   AFFICHAGE DES RÉSEAUX SOCIAUX
========================================================= */

function afficherReseauxSociaux(membre) {

  const container =
    document.getElementById(
      "profileModalSocials"
    );


  const audienceMaxContainer =
    document.getElementById(
      "profileModalAudienceMax"
    );


  if (!container) return;


  const reseauxDisponibles =
    reseauxSociaux.filter(
      reseau =>
        urlValide(
          membre[reseau.champ]
        )
    );


  /*
     Aucun réseau renseigné.
  */

  if (!reseauxDisponibles.length) {

    container.innerHTML = "";

    container.style.display = "none";


    if (audienceMaxContainer) {

      audienceMaxContainer.innerHTML = "";

      audienceMaxContainer.style.display = "none";

    }

    return;

  }


  /*
     Calcul des audiences.
  */

  const audiences =
    reseauxDisponibles.map(reseau => {

      const valeur =
        Number(
          membre[reseau.audienceChamp]
        );


      return {

        reseau,

        valeur:
          Number.isFinite(valeur)
            ? valeur
            : 0

      };

    });


  /*
     Recherche du réseau ayant
     la plus grande audience.
  */

  let reseauMax = null;


  if (audiences.length) {

    reseauMax =
      audiences.reduce(
        (max, actuel) => {

          if (!max) {
            return actuel;
          }

          return actuel.valeur > max.valeur
            ? actuel
            : max;

        },
        null
      );

  }


  /*
     Si audience_reseau est renseigné
     dans Supabase, il devient prioritaire.
  */

  if (membre.audience_reseau) {

    const nomAudience =
      String(
        membre.audience_reseau
      ).trim()
      .toLowerCase();


    const reseauBase =
      reseauxDisponibles.find(
        reseau =>
          reseau.nom.toLowerCase() ===
          nomAudience
      );


    if (reseauBase) {

      const audienceBase =
        audiences.find(
          item =>
            item.reseau ===
            reseauBase
        );


      if (audienceBase) {

        reseauMax =
          audienceBase;

      }

    }

  }


  /*
     Construction des icônes.
  */

  container.innerHTML =
    reseauxDisponibles
      .map(reseau => {

        const audience =
          audiences.find(
            item =>
              item.reseau ===
              reseau
          );


        const estMax =
          Boolean(
            reseauMax &&
            audience &&
            audience.reseau ===
              reseauMax.reseau &&
            audience.valeur > 0
          );


        return `

          <a
            href="${escapeHtml(membre[reseau.champ])}"
            class="profile-social-link ${estMax ? "is-max" : ""}"
            target="_blank"
            rel="noopener noreferrer"
            title="${escapeHtml(reseau.nom)}"
            aria-label="${escapeHtml(reseau.nom)}"
          >

            <div class="profile-social-item">

              ${
                estMax
                  ? `
                    <span
                      class="profile-social-max-star"
                      aria-label="Audience maximale"
                      title="Audience maximale"
                    >
                      ★
                    </span>
                  `
                  : ""
              }


              <img
                src="${escapeHtml(reseau.logo)}"
                alt="${escapeHtml(reseau.nom)}"
                loading="lazy"
              >


              ${
                audience &&
                audience.valeur > 0
                  ? `
                    <span class="profile-social-audience">
                      ${formaterAudience(
                        audience.valeur
                      )}
                    </span>
                  `
                  : ""
              }

            </div>

          </a>

        `;

      })
      .join("");


  container.style.display = "flex";


  /*
     Audience maximale affichée sous les réseaux.
  */

  if (
    audienceMaxContainer &&
    reseauMax &&
    reseauMax.valeur > 0
  ) {

    let dateTexte = "";


    if (membre.audience_updated_at) {

      const date =
        new Date(
          membre.audience_updated_at
        );


      if (!Number.isNaN(date.getTime())) {

        dateTexte =
          `mis à jour le ${
            date.toLocaleDateString(
              "fr-FR"
            )
          } à ${
            date.toLocaleTimeString(
              "fr-FR",
              {
                hour: "2-digit",
                minute: "2-digit"
              }
            )
          }`;

      }

    }


    audienceMaxContainer.innerHTML = `

      Audience max :
      <strong>
        ${formaterAudience(
          reseauMax.valeur
        )}
      </strong>

      ${
        dateTexte
          ? `
            <small>
              <em>· ${escapeHtml(dateTexte)}</em>
            </small>
          `
          : ""
      }

    `;


    audienceMaxContainer.style.display = "block";

  } else {

    if (audienceMaxContainer) {

      audienceMaxContainer.innerHTML = "";

      audienceMaxContainer.style.display = "none";

    }

  }

}


/* =========================================================
   CHARGEMENT DES MEMBRES
========================================================= */

async function chargerMembres() {

  const teamGrid =
    document.getElementById(
      "teamGrid"
    );


  if (!teamGrid) return;


  teamGrid.innerHTML = `

    <div class="loading">
      Chargement des membres…
    </div>

  `;


  if (
    !window.supabaseClient
  ) {

    console.error(
      "supabaseClient introuvable."
    );


    teamGrid.innerHTML = `

      <div class="no-members">
        Connexion à la base de données impossible.
      </div>

    `;

    return;

  }


  try {

    const {
      data,
      error
    } =
      await window.supabaseClient

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

        .eq(
          "anonyme",
          false
        )

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


      teamGrid.innerHTML = `

        <div class="no-members">
          Impossible de charger les membres.
        </div>

      `;

      return;

    }


    membres = data || [];


    if (!membres.length) {

      teamGrid.innerHTML = `

        <div class="no-members">
          Aucun membre à afficher pour le moment.
        </div>

      `;

      return;

    }


    teamGrid.innerHTML =
      membres
        .map(
          (membre, index) => {

            const description =
              String(
                membre.description || ""
              );


            const descriptionCourte =
              description.length > 180
                ? description.slice(0, 177) + "…"
                : description;


            const image =
              imageValide(
                membre.image_url
              );


            const nom =
              membre.nom ||
              "Membre";


            return `

              <article
                class="member-card"
                data-member-index="${index}"
                tabindex="0"
                role="button"
                aria-label="Voir le profil de ${escapeHtml(nom)}"
              >

                <div class="member-photo">

                  ${
                    image
                      ? `
                        <img
                          src="${escapeHtml(membre.image_url)}"
                          alt="${escapeHtml(nom)}"
                          loading="lazy"
                        >
                      `
                      : `
                        <div
                          class="member-photo-placeholder"
                          aria-hidden="true"
                        >
                          ★
                        </div>
                      `
                  }

                </div>


                <div class="member-name">
                  ${escapeHtml(nom)}
                </div>


                ${
                  membre.grade
                    ? `
                      <div class="member-grade">
                        ${escapeHtml(membre.grade)}
                      </div>
                    `
                    : ""
                }


                ${
                  membre.region
                    ? `
                      <div class="member-region">
                        ${escapeHtml(membre.region)}
                      </div>
                    `
                    : ""
                }


                ${
                  descriptionCourte
                    ? `
                      <div class="member-description">
                        ${escapeHtml(descriptionCourte)}
                      </div>
                    `
                    : ""
                }

              </article>

            `;

          }
        )
        .join("");


    /*
       Activation des cartes.
    */

    document
      .querySelectorAll(
        ".member-card"
      )
      .forEach(card => {

        card.addEventListener(
          "click",
          () => {

            const index =
              Number(
                card.dataset.memberIndex
              );


            const membre =
              membres[index];


            if (membre) {

              ouvrirProfil(
                membre
              );

            }

          }
        );


        card.addEventListener(
          "keydown",
          event => {

            if (
              event.key === "Enter" ||
              event.key === " "
            ) {

              event.preventDefault();


              const index =
                Number(
                  card.dataset.memberIndex
                );


              const membre =
                membres[index];


              if (membre) {

                ouvrirProfil(
                  membre
                );

              }

            }

          }
        );

      });


  } catch (error) {

    console.error(
      "Erreur inattendue chargement membres :",
      error
    );


    teamGrid.innerHTML = `

      <div class="no-members">
        Impossible de charger les membres.
      </div>

    `;

  }

}


/* =========================================================
   OUVERTURE PROFIL
========================================================= */

function ouvrirProfil(membre) {

  const modal =
    document.getElementById(
      "memberModal"
    );


  if (!modal) return;


  const image =
    document.getElementById(
      "profileModalImage"
    );

  const placeholder =
    document.getElementById(
      "profilePlaceholder"
    );

  const name =
    document.getElementById(
      "profileModalName"
    );

  const grade =
    document.getElementById(
      "profileModalGrade"
    );

  const region =
    document.getElementById(
      "profileModalRegion"
    );

  const description =
    document.getElementById(
      "profileModalDescription"
    );

  const competencesContainer =
    document.getElementById(
      "profileModalCompetences"
    );

  const vipContainer =
    document.getElementById(
      "profileModalVip"
    );


  /*
     NOM
  */

  if (name) {

    name.textContent =
      membre.nom ||
      "Membre";

  }


  /*
     GRADE
  */

  if (grade) {

    grade.textContent =
      membre.grade ||
      "";

    grade.style.display =
      membre.grade
        ? ""
        : "none";

  }


  /*
     RÉGION
  */

  if (region) {

    region.textContent =
      membre.region ||
      "";

    region.style.display =
      membre.region
        ? ""
        : "none";

  }


  /*
     DESCRIPTION
  */

  if (description) {

    description.textContent =
      membre.description ||
      "";

    description.style.display =
      membre.description
        ? ""
        : "none";

  }


  /*
     IMAGE
  */

  if (image) {

    if (
      imageValide(
        membre.image_url
      )
    ) {

      image.src =
        membre.image_url;

      image.alt =
        membre.nom ||
        "Membre";

      image.style.display =
        "block";


      if (placeholder) {

        placeholder.style.display =
          "none";

      }

    } else {

      image.removeAttribute("src");

      image.alt = "";

      image.style.display =
        "none";


      if (placeholder) {

        placeholder.style.display =
          "flex";

      }

    }

  }


  /*
     RÉSEAUX SOCIAUX
  */

  afficherReseauxSociaux(
    membre
  );


  /*
     COMPÉTENCES
  */

  if (competencesContainer) {

    let competences =
      normaliserCompetences(
        membre.competences
      );


    /*
       VIP ne doit pas être affiché
       comme compétence classique.
    */

    competences =
      competences.filter(
        competence =>
          competence.toUpperCase() !==
          "VIP"
      );


    if (!competences.length) {

      competencesContainer.innerHTML = `

        <span class="competence-tag">
          Aucune compétence renseignée.
        </span>

      `;

    } else {

      competencesContainer.innerHTML =

        competences
          .map(
            competence => `

              <span class="competence-tag">
                ${escapeHtml(competence)}
              </span>

            `
          )
          .join("");

    }

  }


  /*
     VIP
  */

  if (vipContainer) {

    const audienceMax =
      Number(
        membre.audience_max
      );


    /*
       Si audience_max n'est pas renseigné,
       on recalcule depuis les audiences.
    */

    let audienceCalculee =
      Number.isFinite(
        audienceMax
      )
        ? audienceMax
        : 0;


    if (audienceCalculee <= 0) {

      reseauxSociaux.forEach(
        reseau => {

          const valeur =
            Number(
              membre[
                reseau.audienceChamp
              ]
            );


          if (
            Number.isFinite(valeur) &&
            valeur > audienceCalculee
          ) {

            audienceCalculee =
              valeur;

          }

        }
      );

    }


    const estVIP =
      audienceCalculee >= 3000;


    if (estVIP) {

      vipContainer.innerHTML = `

        <div class="vip-medal">

          <span aria-hidden="true">
            ★
          </span>

          VIP

        </div>

      `;


      vipContainer.style.display =
        "block";

    } else {

      vipContainer.innerHTML = "";

      vipContainer.style.display =
        "none";

    }

  }


  ouvrirModalEquipe(
    modal
  );

}


/* =========================================================
   COMPTEUR DESCRIPTION
========================================================= */

function mettreAJourCompteurDescription() {

  const descriptionField =
    document.getElementById(
      "descriptionField"
    );

  const descriptionCount =
    document.getElementById(
      "descriptionCount"
    );


  if (
    !descriptionField ||
    !descriptionCount
  ) {

    return;

  }


  const longueur =
    descriptionField.value.length;


  descriptionCount.textContent =
    longueur;


  descriptionCount.classList.remove(
    "warning"
  );

  descriptionCount.classList.remove(
    "limit"
  );


  if (longueur >= 300) {

    descriptionCount.classList.add(
      "limit"
    );

  } else if (longueur >= 270) {

    descriptionCount.classList.add(
      "warning"
    );

  }

}


/* =========================================================
   OUVERTURE INSCRIPTION
========================================================= */

function initialiserOuvertureInscription() {

  const openJoin =
    document.getElementById(
      "openJoin"
    );

  const joinModal =
    document.getElementById(
      "joinModal"
    );


  if (
    !openJoin ||
    !joinModal
  ) {

    return;

  }


  openJoin.addEventListener(
    "click",
    () => {

      const formMessage =
        document.getElementById(
          "formMessage"
        );


      if (formMessage) {

        formMessage.textContent =
          "";

        formMessage.className =
          "form-message";

      }


      mettreAJourCompteurDescription();


      ouvrirModalEquipe(
        joinModal
      );

    }
  );

}


/* =========================================================
   FERMETURE DES MODALES
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


  if (
    closeMember &&
    memberModal
  ) {

    closeMember.addEventListener(
      "click",
      () => {

        fermerModalEquipe(
          memberModal
        );

      }
    );

  }


  if (
    closeJoin &&
    joinModal
  ) {

    closeJoin.addEventListener(
      "click",
      () => {

        fermerModalEquipe(
          joinModal
        );

      }
    );

  }


  [
    memberModal,
    joinModal
  ]
    .forEach(modal => {

      if (!modal) return;


      modal.addEventListener(
        "click",
        event => {

          if (
            event.target === modal
          ) {

            fermerModalEquipe(
              modal
            );

          }

        }
      );

    });


  document.addEventListener(
    "keydown",
    event => {

      if (
        event.key !== "Escape"
      ) {

        return;

      }


      if (
        memberModal &&
        memberModal.classList.contains(
          "active"
        )
      ) {

        fermerModalEquipe(
          memberModal
        );

        return;

      }


      if (
        joinModal &&
        joinModal.classList.contains(
          "active"
        )
      ) {

        fermerModalEquipe(
          joinModal
        );

      }

    }
  );

}


/* =========================================================
   FORMULAIRE D'INSCRIPTION
========================================================= */

function initialiserFormulaireInscription() {

  const form =
    document.getElementById(
      "joinForm"
    );


  if (!form) return;


  const submitButton =
    document.getElementById(
      "submitButton"
    );

  const formMessage =
    document.getElementById(
      "formMessage"
    );


  form.addEventListener(
    "submit",
    async event => {

      event.preventDefault();


      if (formMessage) {

        formMessage.textContent =
          "";

        formMessage.className =
          "form-message";

      }


      if (submitButton) {

        submitButton.disabled =
          true;

        submitButton.textContent =
          "VÉRIFICATION EN COURS…";

      }


      try {

        const nom =
          document
            .getElementById("nom")
            ?.value
            .trim() || "";


        const email =
          document
            .getElementById("email")
            ?.value
            .trim()
            .toLowerCase() || "";


        const region =
          document
            .getElementById("region")
            ?.value
            .trim() || "";


        const image_url =
          document
            .getElementById("image_url")
            ?.value
            .trim() || "";


        const description =
          document
            .getElementById(
              "descriptionField"
            )
            ?.value
            .trim() || "";


        const typeInscription =
          document.querySelector(
            'input[name="type_inscription"]:checked'
          )?.value ||
          "sympathisant";


        const competences =
          Array.from(
            document.querySelectorAll(
              'input[name="competences"]:checked'
            )
          ).map(
            checkbox =>
              checkbox.value
          );


        const anonyme =
          typeInscription === "anonyme";


        /*
           Validation.
        */

        if (
          !nom ||
          !email ||
          !region
        ) {

          throw new Error(
            "Veuillez remplir tous les champs obligatoires."
          );

        }


        if (
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
            email
          )
        ) {

          throw new Error(
            "Veuillez saisir une adresse e-mail valide."
          );

        }


        if (
          description.length > 300
        ) {

          throw new Error(
            "La présentation ne peut pas dépasser 300 caractères."
          );

        }


        if (
          image_url &&
          !urlValide(image_url)
        ) {

          throw new Error(
            "L'URL de la photo n'est pas valide."
          );

        }


        if (
          !window.supabaseClient
        ) {

          throw new Error(
            "Connexion à la base de données impossible."
          );

        }


        /*
           Vérification e-mail existant.
        */

        const {
          data: emailExistant,
          error: emailError
        } =
          await window.supabaseClient

            .from("profiles")

            .select("id")

            .ilike(
              "email",
              email
            )

            .limit(1);


        if (emailError) {

          console.error(
            "Erreur vérification e-mail :",
            emailError
          );


          throw new Error(
            "Impossible de vérifier l'adresse e-mail."
          );

        }


        if (
          emailExistant &&
          emailExistant.length > 0
        ) {

          throw new Error(
            "Cette adresse e-mail est déjà utilisée."
          );

        }


        /*
           Génération UUID.
        */

        let id;


        if (
          window.crypto &&
          typeof window.crypto.randomUUID ===
            "function"
        ) {

          id =
            window.crypto.randomUUID();

        } else {

          id =
            "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx"
              .replace(
                /[xy]/g,
                character => {

                  const random =
                    Math.random() *
                      16 |
                    0;


                  const value =
                    character === "x"
                      ? random
                      : (
                          random &
                          0x3
                        ) |
                        0x8;


                  return value.toString(16);

                }
              );

        }


        /*
           Profil.
        */

        const profil = {

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

        };


        if (submitButton) {

          submitButton.textContent =
            "INSCRIPTION EN COURS…";

        }


        const {
          error
        } =
          await window.supabaseClient

            .from("profiles")

            .insert([profil]);


        if (error) {

          console.error(
            "Erreur insertion profil :",
            error
          );


          if (
            error.code === "23505"
          ) {

            throw new Error(
              "Cette adresse e-mail est déjà utilisée."
            );

          }


          throw new Error(
            "Impossible d'enregistrer votre inscription."
          );

        }


        /*
           Succès.
        */

        if (formMessage) {

          formMessage.textContent =
            anonyme

              ? "Votre inscription a bien été enregistrée. Votre profil reste masqué de la liste publique."

              : "Votre inscription a bien été enregistrée. Bienvenue chez Avant-gardE !";


          formMessage.className =
            "form-message success";

        }


        /*
           Reset.
        */

        form.reset();


        const sympathisantRadio =
          document.querySelector(
            'input[name="type_inscription"][value="sympathisant"]'
          );


        if (sympathisantRadio) {

          sympathisantRadio.checked =
            true;

        }


        mettreAJourCompteurDescription();


        /*
           Fermeture + rechargement.
        */

        window.setTimeout(
          async () => {

            const joinModal =
              document.getElementById(
                "joinModal"
              );


            fermerModalEquipe(
              joinModal
            );


            await chargerMembres();

          },
          1800
        );


      } catch (error) {

        console.error(
          "Erreur inscription :",
          error
        );


        if (formMessage) {

          formMessage.textContent =
            error.message ||
            "Une erreur est survenue.";


          formMessage.className =
            "form-message error";

        }

      } finally {

        /*
           Si l'inscription a réussi, le bouton
           est réactivé avant la fermeture.
        */

        if (submitButton) {

          submitButton.disabled =
            false;

          submitButton.textContent =
            "REJOINDRE AVANT-GARDE";

        }

      }

    }
  );

}


/* =========================================================
   INITIALISATION COMPTEUR
========================================================= */

function initialiserCompteurDescription() {

  const descriptionField =
    document.getElementById(
      "descriptionField"
    );


  if (!descriptionField) return;


  descriptionField.addEventListener(
    "input",
    mettreAJourCompteurDescription
  );


  mettreAJourCompteurDescription();

}


/* =========================================================
   INITIALISATION PAGE ÉQUIPE
========================================================= */

function initialiserEquipe() {

  initialiserOuvertureInscription();

  initialiserFermetureModales();

  initialiserFormulaireInscription();

  initialiserCompteurDescription();

  chargerMembres();

}


/* =========================================================
   DOM READY
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    initialiserEquipe();

  }
);
