```javascript
/* =========================================================
   AVANT-GARDE — COMPONENTS
   js/components.js

   Composants communs à toutes les pages :

   - Barre événementielle
   - Header / navigation
   - Roue admin
   - Footer
   - Modale rendez-vous
   - Chargement des événements Supabase
   - Défilement automatique des événements
========================================================= */

import { supabase } from "./supabase.js";


/* =========================================================
   HEADER
========================================================= */

function injecterHeader() {

  const conteneur = document.getElementById("site-header");

  if (!conteneur) return;

  conteneur.innerHTML = `

    <!-- ===================================================
         BARRE ÉVÉNEMENTIELLE
    ==================================================== -->

    <div class="events-bar">

      <div class="events-label">
        RENDEZ-VOUS
      </div>

      <div class="events-window">

        <div
          id="eventsTrack"
          class="events-track"
        >
          <div class="events-empty">
            Chargement des événements…
          </div>
        </div>

      </div>

    </div>


    <!-- ===================================================
         HEADER
    ==================================================== -->

    <header class="site-header">

      <div class="header-inner">


        <!-- LOGO -->

        <a
          href="index.html"
          class="logo"
          aria-label="Avant-gardE — La France libre"
        >
          <span class="logo-a">A</span>vant-gard<span class="logo-e">E</span>
        </a>


        <!-- NAVIGATION -->

        <nav
          class="main-nav"
          aria-label="Navigation principale"
        >

          <a href="manifeste.html">
            Manifeste
          </a>

          <a href="projet.html">
            Projet
          </a>

          <a href="inspirations.html">
            Inspirations
          </a>

          <a href="equipe.html">
            Équipe
          </a>

        </nav>


        <!-- ADMIN -->

        <a
          href="admin.html"
          class="admin-link"
          aria-label="Administration"
          title="Administration"
        >
          ⚙
        </a>

      </div>

    </header>

  `;
}


/* =========================================================
   FOOTER
========================================================= */

function injecterFooter() {

  const conteneur = document.getElementById("site-footer");

  if (!conteneur) return;

  /*
     On vide systématiquement le conteneur afin d'éviter
     qu'un ancien contenu éventuel interfère avec le footer.
  */

  conteneur.innerHTML = "";

  const footer = document.createElement("footer");

  footer.innerHTML = `
    <div>
      © 2026 Avant-gardE
    </div>

    <div>
      Avant-gardE — La France libre
    </div>

    <div>
      Souveraineté · Liberté · Responsabilité
    </div>
  `;

  conteneur.appendChild(footer);
}


/* =========================================================
   MODALE RENDEZ-VOUS
========================================================= */

function injecterModaleRendezVous() {

  const conteneur = document.getElementById("site-rdv-modal");

  if (!conteneur) return;

  conteneur.innerHTML = `

    <div
      id="rdvModal"
      class="rdv-modal"
      aria-hidden="true"
    >

      <div class="rdv-modal-overlay"></div>

      <div
        class="rdv-modal-content"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rdvModalTitle"
      >

        <button
          type="button"
          class="rdv-modal-close"
          id="rdvModalClose"
          aria-label="Fermer"
        >
          ×
        </button>

        <div class="section-kicker">
          RENDEZ-VOUS
        </div>

        <h2 id="rdvModalTitle">
          Événement
        </h2>

        <div
          id="rdvModalDetails"
          class="rdv-modal-details"
        ></div>

      </div>

    </div>

  `;
}


/* =========================================================
   CHARGEMENT DES RENDEZ-VOUS
========================================================= */

async function chargerRendezVous() {

  const track = document.getElementById("eventsTrack");

  if (!track) return;

  try {

    const maintenant = new Date().toISOString();

    const { data, error } = await supabase
      .from("rendezvous")
      .select("*")
      .eq("actif", true)
      .gte("date_evenement", maintenant)
      .order("date_evenement", {
        ascending: true
      });

    if (error) {
      throw error;
    }


    /* =====================================================
       AUCUN ÉVÉNEMENT
    ====================================================== */

    if (!data || data.length === 0) {

      track.innerHTML = `
        <div class="events-empty">
          Aucun rendez-vous à venir.
        </div>
      `;

      return;
    }


    /* =====================================================
       CONSTRUCTION DES ÉVÉNEMENTS
    ====================================================== */

    track.innerHTML = data
      .map((evenement, index) => {

        const date = new Date(
          evenement.date_evenement
        );

        const dateFormatee = date.toLocaleDateString(
          "fr-FR",
          {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
          }
        );

        const heureFormatee = date.toLocaleTimeString(
          "fr-FR",
          {
            hour: "2-digit",
            minute: "2-digit"
          }
        );


        const titre =
          evenement.titre ||
          evenement.nom ||
          "Rendez-vous";


        const lieu =
          evenement.lieu ||
          "";


        return `

          <button
            type="button"
            class="event"
            data-event-index="${index}"
          >

            <span class="event-date">
              ${dateFormatee}
            </span>

            <span class="event-time">
              ${heureFormatee}
            </span>

            <span class="event-title">
              ${titre}
            </span>

            ${
              lieu
                ? `
                  <span class="event-location">
                    — ${lieu}
                  </span>
                `
                : ""
            }

          </button>

          ${
            index < data.length - 1
              ? `
                <span class="event-separator">
                  •
                </span>
              `
              : ""
          }

        `;

      })
      .join("");


    /*
       On conserve les événements pour la modale.
    */

    window.avantGardeEvenements = data;


    /*
       Double requestAnimationFrame :
       permet au navigateur de calculer correctement
       la largeur réelle du contenu avant de lancer
       l'animation.
    */

    requestAnimationFrame(() => {

      requestAnimationFrame(() => {

        demarrerDefilement();

      });

    });

  } catch (error) {

    console.error(
      "Erreur chargement rendez-vous :",
      error
    );

    track.innerHTML = `
      <div class="events-empty">
        Impossible de charger les rendez-vous.
      </div>
    `;
  }
}


/* =========================================================
   DÉFILEMENT AUTOMATIQUE
========================================================= */

let animationEvenements = null;


function demarrerDefilement() {

  const track = document.getElementById("eventsTrack");
  const fenetre = document.querySelector(".events-window");

  if (!track || !fenetre) return;


  /*
     Arrêt d'une éventuelle animation précédente.
  */

  if (animationEvenements) {

    cancelAnimationFrame(
      animationEvenements
    );

    animationEvenements = null;
  }


  const largeurFenetre =
    fenetre.offsetWidth;

  const largeurContenu =
    track.scrollWidth;


  /*
     Si le contenu ne dépasse pas la fenêtre,
     aucun défilement nécessaire.
  */

  if (
    largeurContenu <= largeurFenetre
  ) {

    track.style.transform =
      "translateX(0)";

    return;
  }


  /*
     Position de départ :
     contenu placé juste à droite de la fenêtre.
  */

  let position =
    largeurFenetre;


  const vitesse =
    180;

  let dernierTemps =
    performance.now();


  function animation(temps) {

    const delta =
      (temps - dernierTemps) / 1000;

    dernierTemps = temps;


    position -=
      vitesse * delta;


    /*
       Lorsque tout le contenu est sorti
       par la gauche, on recommence.
    */

    if (
      position <= -largeurContenu
    ) {

      position =
        largeurFenetre;
    }


    track.style.transform =
      `translateX(${position}px)`;


    animationEvenements =
      requestAnimationFrame(animation);
  }


  animationEvenements =
    requestAnimationFrame(animation);
}


/* =========================================================
   MODALE — OUVERTURE
========================================================= */

function ouvrirModaleRendezVous(index) {

  const modal =
    document.getElementById("rdvModal");

  const details =
    document.getElementById("rdvModalDetails");

  const titre =
    document.getElementById("rdvModalTitle");


  if (
    !modal ||
    !details ||
    !titre
  ) {
    return;
  }


  const evenement =
    window.avantGardeEvenements?.[index];


  if (!evenement) return;


  const date =
    new Date(
      evenement.date_evenement
    );


  const dateFormatee =
    date.toLocaleDateString(
      "fr-FR",
      {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
      }
    );


  const heureFormatee =
    date.toLocaleTimeString(
      "fr-FR",
      {
        hour: "2-digit",
        minute: "2-digit"
      }
    );


  titre.textContent =
    evenement.titre ||
    evenement.nom ||
    "Rendez-vous";


  details.innerHTML = `

    <div class="rdv-detail">

      <strong>
        Date
      </strong>

      <span>
        ${dateFormatee}
      </span>

    </div>


    <div class="rdv-detail">

      <strong>
        Heure
      </strong>

      <span>
        ${heureFormatee}
      </span>

    </div>


    ${
      evenement.lieu
        ? `
          <div class="rdv-detail">

            <strong>
              Lieu
            </strong>

            <span>
              ${evenement.lieu}
            </span>

          </div>
        `
        : ""
    }


    ${
      evenement.description
        ? `
          <div class="rdv-detail rdv-description">

            ${evenement.description}

          </div>
        `
        : ""
    }

  `;


  modal.classList.add("is-open");

  modal.setAttribute(
    "aria-hidden",
    "false"
  );


  document.body.classList.add(
    "modal-open"
  );
}


/* =========================================================
   MODALE — FERMETURE
========================================================= */

function fermerModaleRendezVous() {

  const modal =
    document.getElementById("rdvModal");

  if (!modal) return;


  modal.classList.remove(
    "is-open"
  );

  modal.setAttribute(
    "aria-hidden",
    "true"
  );


  document.body.classList.remove(
    "modal-open"
  );
}


/* =========================================================
   ÉCOUTEURS RENDEZ-VOUS
========================================================= */

function initialiserEcouteursRendezVous() {

  document.addEventListener(
    "click",
    evenement => {

      const bouton =
        evenement.target.closest(
          ".event"
        );


      if (bouton) {

        const index =
          Number(
            bouton.dataset.eventIndex
          );

        ouvrirModaleRendezVous(
          index
        );

        return;
      }


      if (
        evenement.target.closest(
          "#rdvModalClose"
        )
      ) {

        fermerModaleRendezVous();

        return;
      }


      if (
        evenement.target.classList.contains(
          "rdv-modal-overlay"
        )
      ) {

        fermerModaleRendezVous();

      }

    }
  );


  document.addEventListener(
    "keydown",
    evenement => {

      if (
        evenement.key === "Escape"
      ) {

        fermerModaleRendezVous();

      }

    }
  );
}


/* =========================================================
   REDIMENSIONNEMENT
========================================================= */

window.addEventListener(
  "resize",
  () => {

    /*
       On relance le calcul de largeur
       lorsque la fenêtre change de taille.
    */

    requestAnimationFrame(() => {

      demarrerDefilement();

    });

  }
);


/* =========================================================
   INITIALISATION GÉNÉRALE
========================================================= */

async function initialiserComposants() {

  injecterHeader();

  injecterFooter();

  injecterModaleRendezVous();

  await chargerRendezVous();

  initialiserEcouteursRendezVous();
}


/* =========================================================
   DOM READY
========================================================= */

if (
  document.readyState === "loading"
) {

  document.addEventListener(
    "DOMContentLoaded",
    initialiserComposants
  );

} else {

  initialiserComposants();

}
```
