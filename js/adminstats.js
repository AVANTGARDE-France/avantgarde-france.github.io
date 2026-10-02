/* =========================================================
   AVANT-GARDE — ADMIN STATISTIQUES
   js/adminstats.js

   Bibliothèque des icônes animées utilisées
   par les cartes de mesures.

   Champs statistiques :
   - id
   - nom
   - lien
   - aperçu

   Une statistique peut être utilisée par une mesure
   via :
   - stat_1
   - stat_2
   - stat_3

   La carte de chaque statistique affiche automatiquement
   la liste des mesures qui l'utilisent.

   Suppression protégée si la statistique est utilisée
   par un contenu.
========================================================= */

import { supabase } from "./supabase.js";


/* =========================================================
   ETAT
========================================================= */

let statistiques = [];

let mesures = [];

let editionId = null;


/* =========================================================
   ELEMENTS
========================================================= */

const statsTabButton =
    document.getElementById(
        "statsTabButton"
    );

const statsEditor =
    document.getElementById(
        "statsEditor"
    );

const statsForm =
    document.getElementById(
        "statsForm"
    );

const statsId =
    document.getElementById(
        "statsId"
    );

const statsNom =
    document.getElementById(
        "statsNom"
    );

const statsLien =
    document.getElementById(
        "statsLien"
    );

const statsSaveButton =
    document.getElementById(
        "statsSaveButton"
    );

const statsCancelButton =
    document.getElementById(
        "statsCancelButton"
    );

const statsList =
    document.getElementById(
        "statsList"
    );

const statsMessage =
    document.getElementById(
        "statsMessage"
    );

const statsAddButton =
    document.getElementById(
        "statsAddButton"
    );


/* =========================================================
   MESSAGE
========================================================= */

let messageTimer = null;


function afficherMessage(
    texte,
    type = "success"
) {

    if (!statsMessage) {
        return;
    }


    clearTimeout(
        messageTimer
    );


    statsMessage.className =
        "message visible " + type;


    statsMessage.textContent =
        texte;


    messageTimer =
        setTimeout(
            () => {

                statsMessage.className =
                    "message";

            },
            3500
        );

}


/* =========================================================
   ADMIN
========================================================= */

async function verifierAdmin() {

    const {
        data: {
            user
        },
        error: userError
    } =
        await supabase.auth.getUser();


    if (
        userError ||
        !user
    ) {

        throw new Error(
            "Vous devez être connecté."
        );

    }


    const {
        data: profile,
        error
    } =
        await supabase
            .from("profiles")
            .select(
                "id, grade"
            )
            .eq(
                "id",
                user.id
            )
            .single();


    if (
        error ||
        !profile
    ) {

        throw new Error(
            "Impossible de vérifier votre profil."
        );

    }


    if (
        profile.grade !==
        "admin"
    ) {

        throw new Error(
            "Accès réservé aux administrateurs."
        );

    }


    return true;

}


/* =========================================================
   CHARGEMENT DES STATISTIQUES
========================================================= */

async function chargerStatistiques() {

    const {
        data,
        error
    } =
        await supabase
            .from("stats")
            .select(
                `
                id,
                nom,
                lien
                `
            )
            .order(
                "nom",
                {
                    ascending: true
                }
            );


    if (error) {

        console.error(
            "CHARGEMENT STATS :",
            error
        );

        throw new Error(
            "Impossible de charger la bibliothèque."
        );

    }


    statistiques =
        data || [];

}


/* =========================================================
   CHARGEMENT DES MESURES
========================================================= */

async function chargerMesures() {

    const {
        data,
        error
    } =
        await supabase
            .from("contenus")
            .select(
                `
                id,
                titre,
                stat_1,
                stat_2,
                stat_3
                `
            )
            .order(
                "titre",
                {
                    ascending: true
                }
            );


    if (error) {

        console.error(
            "CHARGEMENT MESURES :",
            error
        );

        throw new Error(
            "Impossible de charger les mesures."
        );

    }


    mesures =
        data || [];

}


/* =========================================================
   MESURES UTILISANT UNE STATISTIQUE
========================================================= */

function obtenirMesuresPourStatistique(
    statId
) {

    return mesures.filter(
        mesure => {

            return (

                String(
                    mesure.stat_1 ?? ""
                ) ===
                String(statId)

                ||

                String(
                    mesure.stat_2 ?? ""
                ) ===
                String(statId)

                ||

                String(
                    mesure.stat_3 ?? ""
                ) ===
                String(statId)

            );

        }
    );

}


/* =========================================================
   RENDU
========================================================= */

function renderStats() {

    if (!statsList) {
        return;
    }


    statsList.innerHTML =
        "";


    if (!statistiques.length) {

        statsList.innerHTML = `

            <div
              style="
                color:var(--muted);
                font-size:11px;
                padding:20px 0;
              "
            >
                Aucune icône animée dans la bibliothèque.
            </div>

        `;

        return;

    }


    statistiques.forEach(
        stat => {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "event-card";


            card.style.marginBottom =
                "10px";


            const lien =
                stat.lien ||
                "";


            /*
             * Toutes les mesures qui utilisent
             * cette statistique dans stat_1,
             * stat_2 ou stat_3.
             */
            const mesuresStat =
                obtenirMesuresPourStatistique(
                    stat.id
                );


            card.innerHTML = `

                <div
                  style="
                    display:grid;
                    grid-template-columns:minmax(0,1fr) 110px auto;
                    align-items:start;
                    gap:18px;
                  "
                >

                    <!-- =================================================
                         INFORMATIONS STATISTIQUE
                    ================================================== -->

                    <div
                      style="
                        min-width:0;
                      "
                    >

                        <div
                          style="
                            color:var(--gold);
                            font-size:10px;
                            font-weight:bold;
                            letter-spacing:1px;
                            margin-bottom:5px;
                          "
                        >
                            NOM
                        </div>


                        <div
                          style="
                            font-size:15px;
                            font-weight:bold;
                          "
                        >
                            ${escapeHtml(
                                stat.nom
                            )}
                        </div>


                        <div
                          style="
                            margin-top:8px;
                            font-size:10px;
                            line-height:1.4;
                            word-break:break-all;
                          "
                        >

                            ${
                                lien
                                    ? `
                                      <a
                                        href="${escapeHtml(lien)}"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style="
                                          color:var(--gold-light);
                                        "
                                      >
                                        ${escapeHtml(lien)}
                                      </a>
                                      `
                                    : `
                                      <span
                                        style="
                                          color:var(--muted);
                                        "
                                      >
                                        Aucun lien
                                      </span>
                                      `
                            }

                        </div>


                        <!-- =============================================
                             EFFET STATISTIQUE
                        ============================================== -->

                        <div
                          style="
                            margin-top:18px;
                            padding-top:12px;
                            border-top:1px solid var(--border);
                          "
                        >

                            <div
                              style="
                                color:var(--gold);
                                font-size:10px;
                                font-weight:bold;
                                letter-spacing:1px;
                                margin-bottom:8px;
                              "
                            >
                                EFFET STATISTIQUE
                            </div>


                            <div
                              style="
                                color:var(--muted);
                                font-size:10px;
                                margin-bottom:8px;
                              "
                            >
                                ${
                                    mesuresStat.length
                                }
                                mesure${
                                    mesuresStat.length > 1
                                        ? "s"
                                        : ""
                                }
                                concernée${
                                    mesuresStat.length > 1
                                        ? "s"
                                        : ""
                                }
                            </div>


                            ${
                                mesuresStat.length > 0

                                    ? `

                                      <div
                                        style="
                                          display:flex;
                                          flex-direction:column;
                                          gap:5px;
                                        "
                                      >

                                        ${
                                            mesuresStat
                                                .map(
                                                    mesure => `

                                                        <div
                                                          style="
                                                            display:flex;
                                                            align-items:flex-start;
                                                            gap:7px;
                                                            padding:6px 8px;
                                                            background:rgba(255,255,255,.025);
                                                            border:1px solid var(--border);
                                                            font-size:11px;
                                                            line-height:1.35;
                                                          "
                                                        >

                                                            <span
                                                              style="
                                                                color:var(--gold);
                                                                flex-shrink:0;
                                                              "
                                                            >
                                                                •
                                                            </span>

                                                            <span>
                                                                ${escapeHtml(
                                                                    mesure.titre
                                                                )}
                                                            </span>

                                                        </div>

                                                    `
                                                )
                                                .join("")
                                        }

                                      </div>

                                      `

                                    : `

                                      <div
                                        style="
                                          color:var(--muted);
                                          font-size:10px;
                                          font-style:italic;
                                        "
                                      >
                                        Cette statistique n'est utilisée
                                        par aucune mesure.
                                      </div>

                                      `
                            }

                        </div>

                    </div>


                    <!-- =================================================
                         APERÇU
                    ================================================== -->

                    <div
                      style="
                        width:110px;
                        height:80px;
                        display:flex;
                        align-items:center;
                        justify-content:center;
                        overflow:hidden;
                        border:1px solid var(--border);
                        background:rgba(255,255,255,.025);
                      "
                    >

                        ${
                            lien
                                ? `
                                  <img
                                    src="${escapeHtml(lien)}"
                                    alt="${escapeHtml(stat.nom)}"
                                    style="
                                      max-width:100%;
                                      max-height:100%;
                                      object-fit:contain;
                                    "
                                    onerror="
                                      this.style.display='none';
                                      this.nextElementSibling.style.display='block';
                                    "
                                  >

                                  <span
                                    style="
                                      display:none;
                                      color:var(--muted);
                                      font-size:9px;
                                      text-align:center;
                                      padding:8px;
                                    "
                                  >
                                    Aperçu indisponible
                                  </span>
                                  `
                                : `
                                  <span
                                    style="
                                      color:var(--muted);
                                      font-size:9px;
                                      text-align:center;
                                    "
                                  >
                                    Aucun aperçu
                                  </span>
                                  `
                        }

                    </div>


                    <!-- =================================================
                         ACTIONS
                    ================================================== -->

                    <div
                      style="
                        display:flex;
                        gap:4px;
                        flex-shrink:0;
                      "
                    >

                        <button
                          type="button"
                          class="icon-button"
                          title="Modifier"
                          data-action="edit"
                          data-id="${escapeHtml(stat.id)}"
                        >
                            ✎
                        </button>


                        <button
                          type="button"
                          class="icon-button danger"
                          title="Supprimer"
                          data-action="delete"
                          data-id="${escapeHtml(stat.id)}"
                        >
                            ×
                        </button>

                    </div>

                </div>

            `;


            statsList.appendChild(
                card
            );

        }
    );

}


/* =========================================================
   ESCAPE
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
   OUVERTURE FORMULAIRE
========================================================= */

function ouvrirFormulaire() {

    if (!statsEditor) {
        return;
    }


    editionId =
        null;


    if (statsId) {

        statsId.value =
            "";

    }


    if (statsNom) {

        statsNom.value =
            "";

    }


    if (statsLien) {

        statsLien.value =
            "";

    }


    if (statsSaveButton) {

        statsSaveButton.textContent =
            "AJOUTER L'ICÔNE";

    }


    if (statsCancelButton) {

        statsCancelButton.style.display =
            "block";

    }


    statsEditor.style.display =
        "block";


    statsNom?.focus();

}


/* =========================================================
   FERMETURE / RESET
========================================================= */

function reinitialiserFormulaire() {

    editionId =
        null;


    if (statsId) {

        statsId.value =
            "";

    }


    if (statsNom) {

        statsNom.value =
            "";

    }


    if (statsLien) {

        statsLien.value =
            "";

    }


    if (statsSaveButton) {

        statsSaveButton.textContent =
            "AJOUTER L'ICÔNE";

    }


    if (statsCancelButton) {

        statsCancelButton.style.display =
            "none";

    }


    if (statsEditor) {

        statsEditor.style.display =
            "none";

    }

}


/* =========================================================
   CREATION / MODIFICATION
========================================================= */

if (statsForm) {

    statsForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            const nom =
                statsNom
                    ? statsNom.value.trim()
                    : "";


            const lien =
                statsLien
                    ? statsLien.value.trim()
                    : "";


            if (!nom) {

                afficherMessage(
                    "Le nom est obligatoire.",
                    "error"
                );

                return;

            }


            if (!lien) {

                afficherMessage(
                    "Le lien est obligatoire.",
                    "error"
                );

                return;

            }


            if (statsSaveButton) {

                statsSaveButton.disabled =
                    true;

            }


            try {

                if (editionId) {

                    const {
                        error
                    } =
                        await supabase
                            .from("stats")
                            .update({

                                nom,

                                lien

                            })
                            .eq(
                                "id",
                                editionId
                            );


                    if (error) {
                        throw error;
                    }


                    afficherMessage(
                        "Icône modifiée."
                    );

                } else {

                    const {
                        error
                    } =
                        await supabase
                            .from("stats")
                            .insert({

                                nom,

                                lien

                            });


                    if (error) {
                        throw error;
                    }


                    afficherMessage(
                        "Icône ajoutée à la bibliothèque."
                    );

                }


                reinitialiserFormulaire();

                await chargerStatistiques();

                renderStats();

            }
            catch (error) {

                console.error(
                    "ENREGISTREMENT STAT :",
                    error
                );


                afficherMessage(
                    "Impossible d'enregistrer l'icône.",
                    "error"
                );

            }
            finally {

                if (statsSaveButton) {

                    statsSaveButton.disabled =
                        false;

                }

            }

        }
    );

}


/* =========================================================
   MODIFICATION
========================================================= */

function modifierStatistique(
    id
) {

    const stat =
        statistiques.find(
            item =>
                String(item.id) ===
                String(id)
        );


    if (!stat) {
        return;
    }


    editionId =
        stat.id;


    if (statsId) {

        statsId.value =
            stat.id;

    }


    if (statsNom) {

        statsNom.value =
            stat.nom || "";

    }


    if (statsLien) {

        statsLien.value =
            stat.lien || "";

    }


    if (statsEditor) {

        statsEditor.style.display =
            "block";

    }


    if (statsSaveButton) {

        statsSaveButton.textContent =
            "ENREGISTRER LA MODIFICATION";

    }


    if (statsCancelButton) {

        statsCancelButton.style.display =
            "block";

    }


    statsNom?.focus();

}


/* =========================================================
   VERIFICATION DES DEPENDANCES
========================================================= */

async function verifierUtilisation(
    id
) {

    const {
        count,
        error
    } =
        await supabase
            .from("contenus")
            .select(
                "id",
                {
                    count: "exact",
                    head: true
                }
            )
            .or(
                [
                    `stat_1.eq.${id}`,
                    `stat_2.eq.${id}`,
                    `stat_3.eq.${id}`
                ].join(",")
            );


    if (error) {

        console.error(
            "VERIFICATION UTILISATION :",
            error
        );

        throw new Error(
            "Impossible de vérifier si cette statistique est utilisée."
        );

    }


    return Number(
        count || 0
    );

}


/* =========================================================
   SUPPRESSION
========================================================= */

async function supprimerStatistique(
    id
) {

    const stat =
        statistiques.find(
            item =>
                String(item.id) ===
                String(id)
        );


    if (!stat) {
        return;
    }


    let utilisation;


    try {

        utilisation =
            await verifierUtilisation(
                id
            );

    }
    catch (error) {

        afficherMessage(
            error.message,
            "error"
        );

        return;

    }


    if (utilisation > 0) {

        afficherMessage(
            "Impossible de supprimer « " +
            stat.nom +
            " » : cette statistique est utilisée par " +
            utilisation +
            " mesure" +
            (
                utilisation > 1
                    ? "s"
                    : ""
            ) +
            ". Retirez-la d’abord des contenus concernés.",
            "error"
        );

        return;

    }


    if (
        !confirm(
            "Supprimer l’icône « " +
            stat.nom +
            " » ?"
        )
    ) {

        return;

    }


    const {
        error
    } =
        await supabase
            .from("stats")
            .delete()
            .eq(
                "id",
                id
            );


    if (error) {

        console.error(
            "SUPPRESSION STAT :",
            error
        );


        if (
            error.code ===
            "23503"
        ) {

            afficherMessage(
                "Impossible de supprimer cette statistique : elle est utilisée par un contenu.",
                "error"
            );

        } else {

            afficherMessage(
                "Impossible de supprimer l’icône.",
                "error"
            );

        }


        return;

    }


    if (
        String(editionId) ===
        String(id)
    ) {

        reinitialiserFormulaire();

    }


    await chargerStatistiques();


    renderStats();


    afficherMessage(
        "Icône supprimée."
    );

}


/* =========================================================
   ACTIONS LISTE
========================================================= */

if (statsList) {

    statsList.addEventListener(
        "click",
        event => {

            const button =
                event.target.closest(
                    "button[data-action]"
                );


            if (!button) {
                return;
            }


            const id =
                button.dataset.id;


            const action =
                button.dataset.action;


            if (
                action ===
                "edit"
            ) {

                modifierStatistique(
                    id
                );

            }


            if (
                action ===
                "delete"
            ) {

                supprimerStatistique(
                    id
                );

            }

        }
    );

}


/* =========================================================
   BOUTON AJOUTER
========================================================= */

if (statsAddButton) {

    statsAddButton.addEventListener(
        "click",
        ouvrirFormulaire
    );

}


if (statsCancelButton) {

    statsCancelButton.addEventListener(
        "click",
        reinitialiserFormulaire
    );

}


/* =========================================================
   INITIALISATION
========================================================= */

async function initialiser() {

    try {

        await verifierAdmin();


        if (statsTabButton) {

            statsTabButton.style.display =
                "block";

        }


        reinitialiserFormulaire();


        /*
         * On charge les deux sources avant
         * d'effectuer le rendu.
         */
        await Promise.all([
            chargerStatistiques(),
            chargerMesures()
        ]);


        /*
         * Un seul rendu une fois que les statistiques
         * ET les mesures sont disponibles.
         */
        renderStats();

    }
    catch (error) {

        console.error(
            "STATISTIQUES :",
            error
        );


        if (statsTabButton) {

            statsTabButton.style.display =
                "none";

        }


        afficherMessage(
            error.message ||
            "Impossible de charger les statistiques.",
            "error"
        );

    }

}


/* =========================================================
   LANCEMENT
========================================================= */

initialiser();
