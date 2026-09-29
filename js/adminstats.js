/* =========================================================
   AVANT-GARDE — ADMIN STATISTIQUES
   js/adminstats.js

   Bibliothèque simple des statistiques / icônes animées.

   Chaque entrée possède :
   - un nom
   - un lien
   - un aperçu
   - une modification
   - une suppression sécurisée

   La base de données empêche également la suppression
   d'une statistique utilisée par un contenu.
========================================================= */

import { supabase } from "./supabase.js";


/* =========================================================
   ETAT
========================================================= */

let statistiques = [];

let editionId = null;


/* =========================================================
   ELEMENTS
========================================================= */

const statsTabButton =
    document.getElementById(
        "statsTabButton"
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
   CHARGEMENT
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
            "STATS :",
            error
        );


        afficherMessage(
            "Impossible de charger la bibliothèque.",
            "error"
        );


        return;

    }


    statistiques =
        data || [];


    renderStats();

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
                String(
                    stat.lien || ""
                ).trim();


            card.innerHTML = `

                <div
                  style="
                    display:grid;
                    grid-template-columns:minmax(0,1fr) 180px auto;
                    gap:20px;
                    align-items:center;
                  "
                >

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
                            margin-bottom:6px;
                          "
                        >
                            NOM
                        </div>

                        <div
                          style="
                            font-size:16px;
                            font-weight:bold;
                            line-height:1.3;
                          "
                        >
                            ${escapeHtml(
                                stat.nom
                            )}
                        </div>


                        <div
                          style="
                            margin-top:10px;
                            font-family:Arial,sans-serif;
                            font-size:10px;
                            line-height:1.5;
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
                                          text-decoration:none;
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

                    </div>


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
                            margin-bottom:6px;
                          "
                        >
                            APERÇU
                        </div>

                        <div
                          style="
                            height:90px;
                            border:1px solid var(--border);
                            background:rgba(255,255,255,.025);
                            display:flex;
                            align-items:center;
                            justify-content:center;
                            overflow:hidden;
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
                                          max-height:80px;
                                          object-fit:contain;
                                        "
                                        loading="lazy"
                                        onerror="
                                          this.style.display='none';
                                          this.nextElementSibling.style.display='block';
                                        "
                                      >

                                      <span
                                        style="
                                          display:none;
                                          color:var(--muted);
                                          font-family:Arial,sans-serif;
                                          font-size:9px;
                                          text-align:center;
                                          padding:10px;
                                        "
                                      >
                                        Aperçu indisponible
                                      </span>
                                      `
                                    : `
                                      <span
                                        style="
                                          color:var(--muted);
                                          font-family:Arial,sans-serif;
                                          font-size:9px;
                                        "
                                      >
                                        Aucun aperçu
                                      </span>
                                      `
                            }

                        </div>

                    </div>


                    <div
                      style="
                        display:flex;
                        gap:5px;
                        flex-shrink:0;
                      "
                    >

                        <button
                          type="button"
                          class="icon-button"
                          title="Modifier"
                          data-action="edit"
                          data-id="${stat.id}"
                        >
                            ✎
                        </button>


                        <button
                          type="button"
                          class="icon-button danger"
                          title="Supprimer"
                          data-action="delete"
                          data-id="${stat.id}"
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
   ESCAPE HTML
========================================================= */

function escapeHtml(value) {

    return String(
        value ?? ""
    )
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );

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


            if (
                !/^https?:\/\//i.test(
                    lien
                )
            ) {

                afficherMessage(
                    "Le lien doit commencer par http:// ou https://.",
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
                        "Statistique modifiée."
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
                        "Statistique ajoutée à la bibliothèque."
                    );

                }


                reinitialiserFormulaire();

                await chargerStatistiques();

            }
            catch (error) {

                console.error(
                    "STATS :",
                    error
                );


                afficherMessage(
                    "Impossible d'enregistrer la statistique.",
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
   EDITION
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


    if (statsSaveButton) {

        statsSaveButton.textContent =
            "ENREGISTRER LA MODIFICATION";

    }


    if (statsCancelButton) {

        statsCancelButton.style.display =
            "block";

    }


    if (statsNom) {

        statsNom.focus();

    }


    if (statsForm) {

        statsForm.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

    }

}


/* =========================================================
   RESET
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
            "AJOUTER LA STATISTIQUE";

    }


    if (statsCancelButton) {

        statsCancelButton.style.display =
            "none";

    }

}


if (statsCancelButton) {

    statsCancelButton.addEventListener(
        "click",
        reinitialiserFormulaire
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


    if (
        !confirm(
            "Supprimer « " +
            stat.nom +
            " » de la bibliothèque ?\n\n" +
            "La suppression sera refusée si cette statistique " +
            "est actuellement utilisée par une mesure."
        )
    ) {

        return;

    }


    try {

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
                "STATS SUPPRESSION :",
                error
            );


            /*
             * PostgreSQL renvoie généralement 23503
             * lorsqu'une clé étrangère empêche la suppression.
             */
            if (
                error.code ===
                "23503"
            ) {

                afficherMessage(
                    "Suppression impossible : cette statistique est utilisée par au moins une mesure. Retirez-la d'abord du contenu concerné.",
                    "error"
                );

            } else {

                afficherMessage(
                    "Impossible de supprimer cette statistique.",
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


        afficherMessage(
            "Statistique supprimée."
        );

    }
    catch (error) {

        console.error(
            "STATS SUPPRESSION :",
            error
        );


        afficherMessage(
            "Impossible de supprimer cette statistique.",
            "error"
        );

    }

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
   INITIALISATION
========================================================= */

async function initialiser() {

    try {

        await verifierAdmin();


        if (statsTabButton) {

            statsTabButton.style.display =
                "block";

        }


        await chargerStatistiques();

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

    }

}


initialiser();
