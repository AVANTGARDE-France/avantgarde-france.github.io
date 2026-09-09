javascript
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
   VARIABLES GLOBALES
========================================================= */

let tickerAnimation = null;


/* =========================================================
   ECHAPPEMENT HTML
========================================================= */

function escapeHtml(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* =========================================================
   VALIDATION URL
========================================================= */

function urlValide(url) {

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


/* =========================================================
   HEADER
========================================================= */

function injecterHeader() {

    const container =
        document.getElementById("site-header");

    if (!container) return;


    container.innerHTML = `

        <!-- =================================================
             BARRE EVENEMENT
        ================================================== -->

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


        <!-- =================================================
             HEADER
        ================================================== -->

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
                        MANIFESTE
                    </a>

                    <a href="projet.html">
                        PROJET
                    </a>

                    <a href="inspirations.html">
                        INSPIRATIONS
                    </a>

                    <a href="equipe.html">
                        L'ÉQUIPE
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

    const container =
        document.getElementById("site-footer");

    if (!container) return;


    container.innerHTML = `

        <footer>

            <div
                class="footer-copyright"
                style="
                    display:block !important;
                    visibility:visible !important;
                    opacity:1 !important;
                "
            >
                © 2026 Avant-gardE
            </div>

            <div>
                Avant-gardE — La France libre
            </div>

            <div>
                Souveraineté · Liberté · Responsabilité
            </div>

        </footer>

    `;
}


/* =========================================================
   MODALE RENDEZ-VOUS
========================================================= */

function injecterModaleRendezVous() {

    const container =
        document.getElementById("site-rdv-modal");

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


                <!-- FERMETURE -->

                <button
                    id="rdvModalClose"
                    class="rdv-modal-close"
                    type="button"
                    aria-label="Fermer"
                >
                    ×
                </button>


                <!-- KICKER -->

                <div class="rdv-modal-kicker">
                    RENDEZ-VOUS
                </div>


                <!-- TITRE -->

                <h2
                    id="rdvModalTitle"
                    class="rdv-modal-title"
                >
                </h2>


                <!-- INFORMATIONS -->

                <div class="rdv-modal-info">


                    <div>

                        <span>
                            DATE
                        </span>

                        <strong
                            id="rdvModalDate"
                        >
                        </strong>

                    </div>


                    <div>

                        <span>
                            HEURE
                        </span>

                        <strong
                            id="rdvModalTime"
                        >
                        </strong>

                    </div>


                    <div
                        id="rdvModalLocationWrap"
                    >

                        <span>
                            LIEU
                        </span>

                        <strong
                            id="rdvModalLocation"
                        >
                        </strong>

                    </div>


                </div>


                <!-- DESCRIPTION -->

                <div
                    id="rdvModalDescription"
                    class="rdv-modal-description"
                >
                </div>


                <!-- LIEN -->

                <a
                    id="rdvModalLink"
                    class="rdv-modal-link"
                    href="#"
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
   FORMATAGE DATE COURTE
========================================================= */

function formaterDateCourte(date) {

    if (!(date instanceof Date)) {
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
   FORMATAGE DATE LONGUE
========================================================= */

function formaterDateLongue(date) {

    if (!(date instanceof Date)) {
        return "";
    }


    return date.toLocaleDateString(
        "fr-FR",
        {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
        }
    );
}


/* =========================================================
   FORMATAGE HEURE
========================================================= */

function formaterHeure(date) {

    if (!(date instanceof Date)) {
        return "";
    }


    return date.toLocaleTimeString(
        "fr-FR",
        {
            hour: "2-digit",
            minute: "2-digit"
        }
    );
}


/* =========================================================
   CHARGEMENT DES EVENEMENTS
========================================================= */

async function chargerRendezVous() {

    const track =
        document.getElementById(
            "eventsTrack"
        );

    if (!track) return;


    try {

        const maintenant =
            new Date().toISOString();


        const {
            data,
            error
        } = await supabase

            .from("rendezvous")

            .select("*")

            .eq("actif", true)

            .gte(
                "date_evenement",
                maintenant
            )

            .order(
                "date_evenement",
                {
                    ascending: true
                }
            );


        if (error) {
            throw error;
        }


        /* -------------------------------------------------
           AUCUN EVENEMENT
        ------------------------------------------------- */

        if (
            !data ||
            data.length === 0
        ) {

            track.innerHTML = `

                <div class="events-empty">
                    Aucun événement à venir
                </div>

            `;

            arreterDefilement();

            return;
        }


        /* -------------------------------------------------
           CREATION DES EVENEMENTS
        ------------------------------------------------- */

        track.innerHTML = data
            .map(
                (rdv, index) => {

                    const date =
                        new Date(
                            rdv.date_evenement
                        );


                    return `

                        ${
                            index > 0
                                ? `
                                    <span
                                        class="event-separator"
                                    >
                                        ◆
                                    </span>
                                `
                                : ""
                        }


                        <div
                            class="event"
                            data-rdv-id="${escapeHtml(
                                rdv.id
                            )}"
                        >

                            <strong>
                                ${escapeHtml(
                                    rdv.titre ||
                                    "Événement"
                                )}
                            </strong>

                            <span>
                                &nbsp;·&nbsp;
                                ${formaterDateCourte(date)}
                                &nbsp;·&nbsp;
                                ${formaterHeure(date)}
                            </span>

                        </div>

                    `;
                }
            )
            .join("");


        /*
         * Deux frames permettent d'attendre que le navigateur
         * ait calculé correctement la largeur réelle du ticker.
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
            "Erreur chargement rendez-vous :",
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
   ARRET DU TICKER
========================================================= */

function arreterDefilement() {

    if (
        tickerAnimation !== null
    ) {

        cancelAnimationFrame(
            tickerAnimation
        );

        tickerAnimation = null;
    }
}


/* =========================================================
   DEMARRAGE DU TICKER
========================================================= */

function demarrerDefilement() {

    const track =
        document.getElementById(
            "eventsTrack"
        );


    const windowElement =
        document.querySelector(
            ".events-window"
        );


    if (
        !track ||
        !windowElement
    ) {
        return;
    }


    arreterDefilement();


    const largeurFenetre =
        windowElement.clientWidth;


    const largeurContenu =
        track.scrollWidth;


    if (
        largeurFenetre <= 0 ||
        largeurContenu <= 0
    ) {
        return;
    }


    /*
     * Vitesse du défilement :
     * 180 pixels par seconde.
     */

    const vitesse = 180;


    /*
     * Le ticker commence à droite.
     */

    let position =
        largeurFenetre;


    let dernierTemps =
        performance.now();


    track.style.transform =
        `translateX(${position}px)`;


    function animation(temps) {

        const delta =
            (temps - dernierTemps) /
            1000;


        dernierTemps =
            temps;


        position -=
            vitesse * delta;


        /*
         * Lorsque tout le contenu est sorti
         * par la gauche, on recommence à droite.
         */

        if (
            position <=
            -largeurContenu
        ) {

            position =
                largeurFenetre;
        }


        track.style.transform =
            `translateX(${position}px)`;


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
   OUVERTURE MODALE EVENEMENT
========================================================= */

async function ouvrirRendezVous(id) {

    const modal =
        document.getElementById(
            "rdvModal"
        );


    if (!modal) return;


    try {

        const {
            data,
            error
        } = await supabase

            .from("rendezvous")

            .select("*")

            .eq("id", id)

            .single();


        if (error) {
            throw error;
        }


        if (!data) {
            return;
        }


        const titre =
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


        const locationWrap =
            document.getElementById(
                "rdvModalLocationWrap"
            );


        const description =
            document.getElementById(
                "rdvModalDescription"
            );


        const link =
            document.getElementById(
                "rdvModalLink"
            );


        const dateObjet =
            new Date(
                data.date_evenement
            );


        /* -------------------------------------------------
           TITRE
        ------------------------------------------------- */

        if (titre) {

            titre.textContent =
                data.titre ||
                "Événement";
        }


        /* -------------------------------------------------
           DATE
        ------------------------------------------------- */

        if (date) {

            date.textContent =
                formaterDateLongue(
                    dateObjet
                );
        }


        /* -------------------------------------------------
           HEURE
        ------------------------------------------------- */

        if (time) {

            time.textContent =
                formaterHeure(
                    dateObjet
                );
        }


        /* -------------------------------------------------
           LIEU
        ------------------------------------------------- */

        if (
            location &&
            locationWrap
        ) {

            if (data.lieu) {

                location.textContent =
                    data.lieu;

                locationWrap.style.display =
                    "";


            } else {

                location.textContent =
                    "";

                locationWrap.style.display =
                    "none";
            }
        }


        /* -------------------------------------------------
           DESCRIPTION
        ------------------------------------------------- */

        if (description) {

            description.innerHTML =
                escapeHtml(
                    data.description || ""
                ).replace(
                    /\n/g,
                    "<br>"
                );
        }


        /* -------------------------------------------------
           LIEN
        ------------------------------------------------- */

        if (link) {

            if (
                data.lien &&
                urlValide(
                    data.lien
                )
            ) {

                link.href =
                    data.lien;

                link.style.display =
                    "inline-block";


            } else {

                link.href =
                    "#";

                link.style.display =
                    "none";
            }
        }


        /* -------------------------------------------------
           AFFICHAGE
        ------------------------------------------------- */

        modal.classList.add(
            "active"
        );


        modal.setAttribute(
            "aria-hidden",
            "false"
        );


    } catch (error) {

        console.error(
            "Erreur ouverture rendez-vous :",
            error
        );
    }
}


/* =========================================================
   FERMETURE MODALE EVENEMENT
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
}


/* =========================================================
   ECOUTEURS EVENEMENTS
========================================================= */

function initialiserEcouteursRendezVous() {

    const track =
        document.getElementById(
            "eventsTrack"
        );


    /* -----------------------------------------------------
       CLIC SUR UN EVENEMENT
    ----------------------------------------------------- */

    if (track) {

        track.addEventListener(
            "click",
            event => {

                const eventElement =
                    event.target.closest(
                        ".event"
                    );


                if (!eventElement) {
                    return;
                }


                const id =
                    eventElement.dataset.rdvId;


                if (!id) {
                    return;
                }


                ouvrirRendezVous(id);
            }
        );
    }


    /* -----------------------------------------------------
       BOUTON FERMER
    ----------------------------------------------------- */

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


    /* -----------------------------------------------------
       CLIC SUR LE FOND
    ----------------------------------------------------- */

    const modal =
        document.getElementById(
            "rdvModal"
        );


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


    /* -----------------------------------------------------
       TOUCHE ESCAPE
    ----------------------------------------------------- */

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key ===
                "Escape"
            ) {

                fermerRendezVous();
            }
        }
    );


    /* -----------------------------------------------------
       REDIMENSIONNEMENT
    ----------------------------------------------------- */

    window.addEventListener(
        "resize",
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
   INITIALISATION GENERALE
========================================================= */

async function initialiserComposants() {

    /*
     * Injection des composants communs.
     */

    injecterHeader();

    injecterFooter();

    injecterModaleRendezVous();


    /*
     * Chargement Supabase des événements.
     */

    await chargerRendezVous();


    /*
     * Activation des interactions.
     */

    initialiserEcouteursRendezVous();
}


/* =========================================================
   DOM READY
========================================================= */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initialiserComposants
    );

} else {

    initialiserComposants();
}
