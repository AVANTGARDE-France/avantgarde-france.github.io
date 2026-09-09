/* =========================================================
   AVANT-GARDE — COMPOSANTS COMMUNS
   js/components.js

   Éléments communs au site :

   - barre des événements
   - défilement des événements
   - header
   - logo
   - navigation
   - administration
   - footer
   - modale événement
========================================================= */


/* =========================================================
   VARIABLES
========================================================= */

let rendezVous = [];

let tickerAnimation = null;


/* =========================================================
   ESCAPE HTML
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
   HEADER + BARRE ÉVÉNEMENTS
========================================================= */

function injecterHeader() {

  const container =
    document.getElementById(
      "site-header"
    );


  if (!container) return;


  container.innerHTML = `

    <!-- ================================================
         BARRE DES ÉVÉNEMENTS
    ================================================= -->

    <div class="events-bar">

      <div class="events-label">
        ÉVÉNEMENT
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


    <!-- ================================================
         HEADER
    ================================================= -->

    <header class="site-header">

      <div class="header-inner">


        <!-- ADMINISTRATION -->

        <a
          href="admin.html"
          class="admin-link"
          title="Administration"
          aria-label="Administration"
        >
          ⚙
        </a>


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


  if (!container) return;


  container.innerHTML = `

    <footer class="site-footer">

      © 2026 Avant-gardE
      —
      Liberté · Souveraineté · Patrie · Justice

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


  if (!container) return;


  container.innerHTML = `

    <div
      id="rdvModal"
      class="rdv-modal"
      aria-hidden="true"
    >

      <div
        class="rdv-modal-box"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rdvModalTitle"
      >

        <button
          id="rdvModalClose"
          class="rdv-modal-close"
          type="button"
          aria-label="Fermer"
        >
          ×
        </button>


        <div class="rdv-modal-kicker">
          ÉVÉNEMENT
        </div>


        <h2
          id="rdvModalTitle"
          class="rdv-modal-title"
        ></h2>


        <div class="rdv-modal-info">

          <span id="rdvModalDate"></span>

          <span id="rdvModalTime"></span>

          <span id="rdvModalLocation"></span>

        </div>


        <div
          id="rdvModalDescription"
          class="rdv-modal-description"
        ></div>


        <a
          id="rdvModalLink"
          class="rdv-modal-link"
          href="#"
          target="_blank"
          rel="noopener noreferrer"
        >
          PLUS D'INFORMATIONS →
        </a>

      </div>

    </div>

  `;

}


/* =========================================================
   INITIALISATION GLOBALE
========================================================= */

function initialiserComposants() {

  /*
     On injecte d'abord le HTML.
  */

  injecterHeader();

  injecterFooter();

  injecterModaleRendezVous();


  /*
     Ensuite seulement on initialise
     les fonctions qui dépendent
     des éléments injectés.
  */

  chargerRendezVous();

  initialiserEcouteursRendezVous();

}


/* =========================================================
   CHARGEMENT DES ÉVÉNEMENTS
========================================================= */

async function chargerRendezVous() {

  const track =
    document.getElementById(
      "eventsTrack"
    );


  if (!track) return;


  if (!window.supabaseClient) {

    console.error(
      "supabaseClient introuvable."
    );


    track.innerHTML = `

      <div class="events-empty">
        Impossible de charger les événements
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
        "Erreur chargement rendez-vous :",
        error
      );


      track.innerHTML = `

        <div class="events-empty">
          Aucun événement disponible
        </div>

      `;

      arreterDefilement();

      return;

    }


    rendezVous =
      Array.isArray(data)
        ? data
        : [];


    if (!rendezVous.length) {

      track.innerHTML = `

        <div class="events-empty">
          Aucun événement à venir
        </div>

      `;

      arreterDefilement();

      return;

    }


    /*
       Construction des événements.
    */

    track.innerHTML =
      rendezVous
        .map(
          (rdv, index) => {

            return `

              <div
                class="event"
                data-rdv-index="${index}"
                role="button"
                tabindex="0"
              >

                <strong>
                  ${escapeHtml(
                    formaterDateCourte(
                      rdv.date_evenement
                    )
                  )}
                </strong>


                <span>
                  ${escapeHtml(
                    rdv.titre || ""
                  )}
                </span>


                ${
                  rdv.lieu
                    ? `
                      <span>
                        · ${escapeHtml(
                          rdv.lieu
                        )}
                      </span>
                    `
                    : ""
                }

              </div>


              ${
                index <
                rendezVous.length - 1
                  ? `
                    <span
                      class="event-separator"
                      aria-hidden="true"
                    >
                      ◆
                    </span>
                  `
                  : ""
              }

            `;

          }
        )
        .join("");


    /*
       Écouteurs événements.
    */

    document
      .querySelectorAll(
        ".event"
      )
      .forEach(eventElement => {

        eventElement.addEventListener(
          "click",
          () => {

            const index =
              Number(
                eventElement.dataset.rdvIndex
              );


            const rdv =
              rendezVous[index];


            if (rdv) {

              ouvrirRendezVous(
                rdv
              );

            }

          }
        );


        eventElement.addEventListener(
          "keydown",
          eventKeyboard => {

            if (
              eventKeyboard.key ===
                "Enter" ||
              eventKeyboard.key ===
                " "
            ) {

              eventKeyboard.preventDefault();


              const index =
                Number(
                  eventElement.dataset.rdvIndex
                );


              const rdv =
                rendezVous[index];


              if (rdv) {

                ouvrirRendezVous(
                  rdv
                );

              }

            }

          }
        );

      });


    /*
       Démarrage du défilement
       après que le navigateur a
       calculé les dimensions.
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


  } catch (error) {

    console.error(
      "Erreur inattendue rendez-vous :",
      error
    );


    track.innerHTML = `

      <div class="events-empty">
        Impossible de charger les événements
      </div>

    `;


    arreterDefilement();

  }

}


/* =========================================================
   ARRÊT DU DÉFILEMENT
========================================================= */

function arreterDefilement() {

  if (tickerAnimation !== null) {

    cancelAnimationFrame(
      tickerAnimation
    );

    tickerAnimation = null;

  }

}


/* =========================================================
   DÉFILEMENT DE LA BARRE ÉVÉNEMENTS
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


  arreterDefilement();


  /*
     Retour à une position neutre
     avant de mesurer.
  */

  track.style.transform =
    "translate3d(0, 0, 0)";


  /*
     Force le navigateur à recalculer
     les dimensions.
  */

  void track.offsetWidth;


  const largeurTrack =
    track.scrollWidth;


  const largeurFenetre =
    windowElement.clientWidth;


  /*
     Si tout tient dans la fenêtre,
     inutile d'animer.
  */

  if (
    largeurTrack <=
    largeurFenetre + 5
  ) {

    track.style.transform =
      "translate3d(0, 0, 0)";

    return;

  }


  /*
     Le ticker commence hors écran
     à droite.
  */

  let position =
    largeurFenetre;


  /*
     Vitesse en pixels/seconde.
  */

  const vitesse =
    100;


  let dernierTemps =
    performance.now();


  function animation(temps) {

    const delta =
      Math.min(
        temps - dernierTemps,
        100
      );


    dernierTemps =
      temps;


    position -=
      vitesse *
      (delta / 1000);


    /*
       Lorsque tout le contenu
       est sorti à gauche,
       on recommence à droite.
    */

    if (
      position <=
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
   DATE COURTE
========================================================= */

function formaterDateCourte(
  dateString
) {

  if (!dateString) return "";


  const date =
    new Date(
      `${dateString}T00:00:00`
    );


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return "";

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
   OUVRIR UNE MODALE ÉVÉNEMENT
========================================================= */

function ouvrirRendezVous(rdv) {

  const modal =
    document.getElementById(
      "rdvModal"
    );


  if (!modal) return;


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
      rdv.titre ||
      "Événement";

  }


  if (date) {

    if (rdv.date_evenement) {

      const dateObj =
        new Date(
          `${rdv.date_evenement}T00:00:00`
        );


      if (
        !Number.isNaN(
          dateObj.getTime()
        )
      ) {

        date.textContent =
          dateObj.toLocaleDateString(
            "fr-FR",
            {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric"
            }
          );

        date.style.display = "";

      } else {

        date.textContent = "";

        date.style.display =
          "none";

      }

    } else {

      date.textContent = "";

      date.style.display =
        "none";

    }

  }


  if (time) {

    if (rdv.heure_evenement) {

      time.textContent =
        `Heure : ${rdv.heure_evenement}`;

      time.style.display =
        "";

    } else {

      time.textContent = "";

      time.style.display =
        "none";

    }

  }


  if (location) {

    if (rdv.lieu) {

      location.textContent =
        `Lieu : ${rdv.lieu}`;

      location.style.display =
        "";

    } else {

      location.textContent = "";

      location.style.display =
        "none";

    }

  }


  if (description) {

    if (rdv.description) {

      description.textContent =
        rdv.description;

      description.style.display =
        "";

    } else {

      description.textContent = "";

      description.style.display =
        "none";

    }

  }


  if (link) {

    if (
      rdv.lien &&
      /^https?:\/\//i.test(
        rdv.lien
      )
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


  modal.setAttribute(
    "aria-hidden",
    "false"
  );


  document.body.style.overflow =
    "hidden";

}


/* =========================================================
   FERMER UNE MODALE ÉVÉNEMENT
========================================================= */

function fermerRendezVous() {

  const modal =
    document.getElementById(
      "rdvModal"
    );


  if (!modal) return;


  modal.classList.remove(
    "active"
  );


  modal.setAttribute(
    "aria-hidden",
    "true"
  );


  /*
     Ne réactive le scroll que si
     aucune autre modale n'est ouverte.
  */

  const autreModaleOuverte =
    document.querySelector(
      ".modal.active"
    );


  if (!autreModaleOuverte) {

    document.body.style.overflow =
      "";

  }

}


/* =========================================================
   ÉCOUTEURS MODALE ÉVÉNEMENT
========================================================= */

function initialiserEcouteursRendezVous() {

  const close =
    document.getElementById(
      "rdvModalClose"
    );

  const modal =
    document.getElementById(
      "rdvModal"
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
          event.target ===
          modal
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
        event.key ===
        "Escape"
      ) {

        if (
          modal &&
          modal.classList.contains(
            "active"
          )
        ) {

          fermerRendezVous();

        }

      }

    }
  );


  /*
     Recalcul du ticker lors
     d'un changement de taille.
  */

  window.addEventListener(
    "resize",
    () => {

      /*
         Petit délai afin de laisser
         le navigateur terminer le
         redimensionnement.
      */

      window.clearTimeout(
        window._avantGardeTickerResize
      );


      window._avantGardeTickerResize =
        window.setTimeout(
          () => {

            demarrerDefilement();

          },
          150
        );

    }
  );

}


/* =========================================================
   INITIALISATION AUTOMATIQUE
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    initialiserComposants();

  }
);
