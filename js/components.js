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
========================================================= */

import { supabase } from "./supabase.js";


/* =========================================================
   HEADER
========================================================= */

function injecterHeader() {

    const container =
        document.getElementById("site-header");

    if (!container) return;

    container.innerHTML = `

        <!-- BARRE EVENEMENT -->

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

                <a
                    href="index.html"
                    class="logo"
                    aria-label="Avant-gardE — La France libre"
                >
                    <span class="logo-a">A</span>vant-gard<span class="logo-e">E</span>
                </a>


                <nav class="main-nav">

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

            <div class="rdv-modal-box">

                <button
                    id="rdvModalClose"
                    class="rdv-modal-close"
                    type="button"
                    aria-label="Fermer"
                >
                    ×
                </button>


                <div class="rdv-modal-kicker">
                    RENDEZ-VOUS
                </div>


                <h2
                    id="rdvModalTitle"
                    class="rdv-modal-title"
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

                    <div id="rdvModalLocationWrap">
                        <span>LIEU :</span>
                        <strong id="rdvModalLocation"></strong>
                    </div>

                </div>


                <div
                    id="rdvModalDescription"
                    class="rdv-modal-description"
                >
                </div>


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
   CHARGEMENT DES EVENEMENTS
========================================================= */

async function chargerRendezVous() {

    const track =
        document.getElementById("eventsTrack");

    if (!track) return;

    try {

        const maintenant =
            new Date().toISOString();

        const { data, error } =
            await supabase
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


        if (!data || data.length === 0) {

            track.innerHTML = `
                <div class="events-empty">
                    Aucun événement à venir
                </div>
            `;

            arreterDefilement();

            return;
        }


        track.innerHTML =
            data
                .map((rdv, index) => {

                    const date =
                        new Date(
                            rdv.date_evenement
                        );

                    const dateFormatee =
                        formaterDateCourte(date);

                    const heure =
                        formaterHeure(date);


                    return `

                        ${
                            index > 0
                                ? `<span class="event-separator">◆</span>`
                                : ""
                        }

                        <div
                            class="event"
                            data-rdv-id="${escapeHtmlComponents(String(rdv.id))}"
                        >

                            <strong>
                                ${escapeHtmlComponents(
                                    rdv.titre || "Événement"
                                )}
                            </strong>

                            <span>
                                &nbsp;·&nbsp;
                                ${dateFormatee}
                                &nbsp;·&nbsp;
                                ${heure}
                            </span>

                        </div>
                    `;
                })
                .join("");


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
                Impossible de charger les événements
            </div>
        `;

        arreterDefilement();
    }
}


/* =========================================================
   DEFILEMENT EVENEMENTIEL
========================================================= */

let tickerAnimation = null;


/* =========================================================
   ARRET DU DEFILEMENT
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
   DEMARRAGE DU DEFILEMENT
========================================================= */

function demarrerDefilement() {

    const track =
        document.getElementById("eventsTrack");

    const windowElement =
        document.querySelector(".events-window");


    if (!track || !windowElement) return;


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


    const vitesse = 180;


    let position =
        largeurFenetre;


    let dernierTemps =
        performance.now();


    track.style.transform =
        `translateX(${position}px)`;


    function animation(temps) {

        const delta =
            (temps - dernierTemps) / 1000;


        dernierTemps =
            temps;


        position -=
            vitesse * delta;


        if (
            position <= -largeurContenu
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
   OUVERTURE DE LA MODALE
========================================================= */

async function ouvrirRendezVous(id) {

    const modal =
        document.getElementById("rdvModal");

    if (!modal) return;


    try {

        const { data, error } =
            await supabase
                .from("rendezvous")
                .select("*")
                .eq("id", id)
                .single();


        if (error) {
            throw error;
        }


        if (!data) return;


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


        if (titre) {

            titre.textContent =
                data.titre || "Événement";
        }


        if (date) {

            date.textContent =
                formaterDateLongue(
                    dateObjet
                );
        }


        if (time) {

            time.textContent =
                formaterHeure(
                    dateObjet
                );
        }


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


        if (description) {

            description.innerHTML =
                escapeHtmlComponents(
                    data.description || ""
                ).replace(
                    /\n/g,
                    "<br>"
                );
        }


        if (link) {

            if (
                data.lien &&
                urlValideComponents(
                    data.lien
                )
            ) {

                link.href =
                    data.lien;

                link.style.display =
                    "inline-block";

            } else {

                link.style.display =
                    "none";
            }
        }


        modal.classList.add("active");

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
   FERMETURE DE LA MODALE
========================================================= */

function fermerRendezVous() {

    const modal =
        document.getElementById("rdvModal");

    if (!modal) return;


    modal.classList.remove("active");

    modal.setAttribute(
        "aria-hidden",
        "true"
    );
}


/* =========================================================
   ECOUTEURS RENDEZ-VOUS
========================================================= */

function initialiserEcouteursRendezVous() {

    const track =
        document.getElementById(
            "eventsTrack"
        );


    if (track) {

        track.addEventListener(
            "click",
            event => {

                const eventElement =
                    event.target.closest(
                        ".event"
                    );


                if (!eventElement) return;


                const id =
                    eventElement.dataset.rdvId;


                if (!id) return;


                ouvrirRendezVous(id);
            }
        );
    }


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


    const modal =
        document.getElementById(
            "rdvModal"
        );


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
   FORMATAGE DATES
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
   VALIDATION URL
========================================================= */

function urlValideComponents(url) {

    try {

        const parsed =
            new URL(url);

        return (
            parsed.protocol === "http:" ||
            parsed.protocol === "https:"
        );

    } catch {

        return false;
    }
}


/* =========================================================
   ECHAPPEMENT HTML
========================================================= */

function escapeHtmlComponents(value) {

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
   INITIALISATION GENERALE
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
:::

### Très important

Dans GitHub, ton fichier doit commencer directement par :

`/* =========================================================`

puis arriver à :

`import { supabase } from "./supabase.js";`

et **il ne doit absolument plus y avoir de lignes contenant trois accents graves ` ``` `**.

Ton `index.html` peut rester avec la modification que je t'ai donnée précédemment :

```html
<script type="module" src="js/components.js"></script>
