/* =========================================================
   AVANT-GARDE — COMPOSANTS COMMUNS
   js/components.js

   Gestion :
   - header
   - navigation
   - barre événements
   - ticker
   - footer
   - modale événement
========================================================= */


/* =========================================================
   VARIABLES
========================================================= */

let rendezVous = [];

let tickerAnimation = null;


/* =========================================================
   HEADER
========================================================= */

function injecterHeader() {

  const container =
    document.getElementById(
      "site-header"
    );


  if (!container) {
    return;
  }


  container.innerHTML = `

    <!-- BARRE ÉVÉNEMENTS -->

    <div class="events-bar">

      <div class="events-label">
        EVENEMENT
      </div>

      <div class="events-window">

        <div
          id="eventsTrack"
          class="events-track"
        >

          <div class="events-empty">
            Chargement…
          </div>

        </div>

      </div>

    </div>


    <!-- HEADER -->

    <header class="site-header">

      <div class="header-inner">


        <!-- LOGO -->

        <a
          href="index.html"
          class="logo"
          aria-label="Avant-gardE — Accueil"
        >

          <span class="logo-a">A</span>vant-gard<span class="logo-e">E</span>

        </a>


        <!-- NAVIGATION -->

        <nav
          class="main-nav"
          aria-label="Navigation principale"
        >

          <a href="index.html">
            ACCUEIL
          </a>

          <a href="manifeste.html">
            MANIFESTE
          </a>

          <a href="projet.html">
            NOTRE PROJET
          </a>

          <a href="inspirations.html">
            NOS INSPIRATIONS
          </a>

          <a href="equipe.html">
            NOTRE ÉQUIPE
          </a>

        </nav>


        <!-- ADMINISTRATION -->

        <a
          href="admin.html"
          class="admin-link"
          title="Administration"
          aria-label="Administration"
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

  const container =
    document.getElementById(
      "site-footer"
    );


  if (!container) {
    return;
  }


  container.innerHTML = `

    <footer class="site-footer">

      <div>
        © ${new Date().getFullYear()}
        Avant-gardE — La France libre
      </div>

      <div>
        Nation · Liberté · Responsabilité
      </div>

    </footer>

  `;

}


/* =========================================================
   MODALE ÉVÉNEMENT
========================================================= */

function injecterModaleRendezVous() {

  const container =
    document.getElementById(
      "site-rdv-modal"
    );


  if (!container) {
    return;
  }


  container.innerHTML = `

    <div
      class="rdv-modal"
      id="rdvModal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="rdvModalTitle"
    >

      <div class="rdv-modal-box">


        <button
          type="button"
          class="rdv-modal-close"
          id="rdvModalClose"
          aria-label="Fermer"
        >
          ×
        </button>


        <div class="rdv-modal-kicker">
          EVENEMENT
        </div>


        <h2
          class="rdv-modal-title"
          id="rdvModalTitle"
        >
        </h2>


        <div class="rdv-modal-info">

          <div>
            <span>DATE :</span>
            <strong id="rdvModalDate"></strong>
          </div>

          <div>
            <span>HEURE :</span>
            <strong id="rdvModalTime"></strong>
          </div>

          <div>
            <span>LIEU :</span>
            <strong id="rdvModalLocation"></strong>
          </div>

        </div>


        <div
          class="rdv-modal-description"
          id="rdvModalDescription"
        >
        </div>


        <a
          href="#"
          id="rdvModalLink"
          class="rdv-modal-link"
          target="_blank"
          rel="noopener noreferrer"
          style="display:none;"
        >
          EN SAVOIR PLUS
        </a>


      </div>

    </div>

  `;

}


/* =========================================================
   CHARGEMENT ÉVÉNEMENTS
========================================================= */

async function chargerRendezVous() {

  const track =
    document.getElementById(
      "eventsTrack"
    );


  if (!track) {
    return;
  }


  if (
    typeof supabaseClient === "undefined" ||
    !supabaseClient
  ) {

    track.innerHTML = `
      <div class="events-empty">
        Aucun événement.
      </div>
    `;

    return;

  }


  const {
    data,
    error
  } = await supabaseClient

    .from("rendezvous")

    .select("*")

    .eq(
      "actif",
      true
    )

    .order(
      "date_evenement",
      {
        ascending: true
      }
    );


  if (error) {

    console.error(
      "Erreur chargement événements :",
      error
    );


    track.innerHTML = `
      <div class="events-empty">
        Aucun événement.
      </div>
    `;

    return;

  }


  rendezVous =
    Array.isArray(data)
      ? data
      : [];


  if (!rendezVous.length) {

    track.innerHTML = `
      <div class="events-empty">
        Aucun événement à venir.
      </div>
    `;

    demarrerDefilement();

    return;

  }


  track.innerHTML = "";


  rendezVous.forEach(
    (rdv, index) => {

      const event =
        document.createElement("div");


      event.className =
        "event";


      event.tabIndex =
        0;


      event.setAttribute(
        "role",
        "button"
      );


      event.setAttribute(
        "aria-label",
        `Ouvrir l'événement ${rdv.titre || "événement"}`
      );


      const date =
        formaterDateCourte(
          rdv.date_evenement
        );


      const heure =
        rdv.heure
          ? String(rdv.heure).slice(0, 5)
          : "";


      event.innerHTML = `

        <strong>
          ${escapeHtmlComponents(date)}
        </strong>

        ${
          heure
            ? `
              <span>
                ${escapeHtmlComponents(heure)}
              </span>
            `
            : ""
        }

        <span>
          ${escapeHtmlComponents(
            rdv.titre || "Événement"
          )}
        </span>

        ${
          rdv.lieu
            ? `
              <span>
                — ${escapeHtmlComponents(rdv.lieu)}
              </span>
            `
            : ""
        }

      `;


      event.addEventListener(
        "click",
        () => {

          ouvrirRendezVous(
            rendezVous[index]
          );

        }
      );


      event.addEventListener(
        "keydown",
        eventKeyboard => {

          if (
            eventKeyboard.key === "Enter" ||
            eventKeyboard.key === " "
          ) {

            eventKeyboard.preventDefault();

            ouvrirRendezVous(
              rendezVous[index]
            );

          }

        }
      );


      track.appendChild(event);


      /*
       * Séparateur sauf dernier.
       */

      if (
        index <
        rendezVous.length - 1
      ) {

        const separator =
          document.createElement("span");


        separator.className =
          "event-separator";


        separator.textContent =
          "◆";


        track.appendChild(
          separator
        );

      }

    }
  );


  /*
   * On attend que le navigateur ait calculé
   * les dimensions avant de lancer l'animation.
   */

  requestAnimationFrame(
    () => {

      requestAnimationFrame(
        () => {

          demarrerDefilement();

        }
      );

    }
  );

}


/* =========================================================
   TICKER — DÉFILEMENT
========================================================= */

function demarrerDefilement() {

  const windowElement =
    document.querySelector(
      ".events-window"
    );


  const track =
    document.getElementById(
      "eventsTrack"
    );


  if (
    !windowElement ||
    !track
  ) {

    return;

  }


  /*
   * Annule l'ancienne animation.
   */

  if (tickerAnimation !== null) {

    cancelAnimationFrame(
      tickerAnimation
    );

    tickerAnimation = null;

  }


  /*
   * Reset.
   */

  track.style.transform =
    "translate3d(0, 0, 0)";


  /*
   * Mesure réelle.
   */

  const largeurFenetre =
    windowElement.getBoundingClientRect()
      .width;


  const largeurTrack =
    track.scrollWidth;


  if (
    !largeurFenetre ||
    !largeurTrack
  ) {

    return;

  }


  /*
   * Si tout tient dans la fenêtre,
   * aucun défilement n'est nécessaire.
   */

  if (
    largeurTrack <=
    largeurFenetre
  ) {

    track.style.transform =
      "translate3d(0, 0, 0)";

    return;

  }


  /*
   * Départ à droite.
   */

  let position =
    largeurFenetre;


  const vitesse =
    80;


  let dernierTemps =
    performance.now();


  function animation(
    temps
  ) {

    const delta =
      Math.min(
        temps - dernierTemps,
        100
      );


    dernierTemps =
      temps;


    position -=
      vitesse *
      delta /
      1000;


    /*
     * Lorsque tout le contenu est sorti
     * à gauche, on recommence à droite.
     */

    if (
      position <
      -largeurTrack
    ) {

      position =
        largeurFenetre;

    }


    track.style.transform =
      `translate3d(${position}px, 0, 0)`;


    tickerAnimation =
      requestAnimationFrame(
        animation
      );

  }


  tickerAnimation =
    requestAnimationFrame(
      animation
    );

}


/* =========================================================
   OUVERTURE ÉVÉNEMENT
========================================================= */

function ouvrirRendezVous(rdv) {

  if (!rdv) {
    return;
  }


  const modal =
    document.getElementById(
      "rdvModal"
    );


  if (!modal) {
    return;
  }


  const title =
    document.getElementById(
      "rdvModalTitle"
    );


  const date =
    document.getElementById(
      "rdvModalDate"
    );


  const time =
    document.getElementById(
      "rdvModalTime"
    );


  const location =
    document.getElementById(
      "rdvModalLocation"
    );


  const description =
    document.getElementById(
      "rdvModalDescription"
    );


  const link =
    document.getElementById(
      "rdvModalLink"
    );


  if (title) {

    title.textContent =
      rdv.titre || "Événement";

  }


  if (date) {

    date.textContent =
      formaterDateCourte(
        rdv.date_evenement
      );

  }


  if (time) {

    time.textContent =
      rdv.heure
        ? String(rdv.heure).slice(0, 5)
        : "—";

  }


  if (location) {

    location.textContent =
      rdv.lieu || "—";

  }


  if (description) {

    description.textContent =
      rdv.description || "";

  }


  if (link) {

    if (
      rdv.lien &&
      urlValideComponents(rdv.lien)
    ) {

      link.href =
        rdv.lien;

      link.style.display =
        "inline-flex";

    } else {

      link.removeAttribute(
        "href"
      );

      link.style.display =
        "none";

    }

  }


  modal.classList.add(
    "active"
  );


  document.body.style.overflow =
    "hidden";

}


/* =========================================================
   FERMETURE ÉVÉNEMENT
========================================================= */

function fermerRendezVous() {

  const modal =
    document.getElementById(
      "rdvModal"
    );


  if (!modal) {
    return;
  }


  modal.classList.remove(
    "active"
  );


  if (
    !document.querySelector(
      ".profile-modal.active, .join-modal.active, .rdv-modal.active"
    )
  ) {

    document.body.style.overflow =
      "";

  }

}


/* =========================================================
   ÉCOUTEURS MODALE ÉVÉNEMENT
========================================================= */

function initialiserEcouteursRendezVous() {

  const modal =
    document.getElementById(
      "rdvModal"
    );


  const close =
    document.getElementById(
      "rdvModalClose"
    );


  if (close) {

    close.addEventListener(
      "click",
      fermerRendezVous
    );

  }


  if (modal) {

    modal.addEventListener(
      "click",
      event => {

        if (
          event.target === modal
        ) {

          fermerRendezVous();

        }

      }
    );

  }


  document.addEventListener(
    "keydown",
    event => {

      if (
        event.key === "Escape"
      ) {

        fermerRendezVous();

      }

    }
  );


  /*
   * Recalcule le ticker au changement
   * de taille de fenêtre.
   */

  let resizeTimer =
    null;


  window.addEventListener(
    "resize",
    () => {

      clearTimeout(
        resizeTimer
      );


      resizeTimer =
        setTimeout(
          () => {

            requestAnimationFrame(
              demarrerDefilement
            );

          },
          120
        );

    }
  );

}


/* =========================================================
   DATE
========================================================= */

function formaterDateCourte(
  dateString
) {

  if (!dateString) {
    return "";
  }


  const date =
    new Date(
      `${dateString}T00:00:00`
    );


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return String(
      dateString
    );

  }


  return date.toLocaleDateString(
    "fr-FR",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    }
  );

}


/* =========================================================
   VALIDATION URL
========================================================= */

function urlValideComponents(
  url
) {

  if (
    !url ||
    typeof url !== "string"
  ) {

    return false;

  }


  try {

    const parsed =
      new URL(url);


    return (
      parsed.protocol === "http:" ||
      parsed.protocol === "https:"
    );

  } catch (error) {

    return false;

  }

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHtmlComponents(
  value
) {

  if (
    value === null ||
    value === undefined
  ) {

    return "";

  }


  return String(value)
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );

}


/* =========================================================
   INITIALISATION COMPOSANTS
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
