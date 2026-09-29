/* =========================================================
   AVANT-GARDE — ADMIN STATISTIQUES
   js/adminstats.js

   Gestion de la bibliothèque des statistiques.
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

const statsCode =
    document.getElementById(
        "statsCode"
    );

const statsNom =
    document.getElementById(
        "statsNom"
    );

const statsDescription =
    document.getElementById(
        "statsDescription"
    );

const statsIconeUrl =
    document.getElementById(
        "statsIconeUrl"
    );

const statsAnimationUrl =
    document.getElementById(
        "statsAnimationUrl"
    );

const statsActif =
    document.getElementById(
        "statsActif"
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

    clearTimeout(messageTimer);

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
                code,
                nom,
                description,
                icone_url,
                animation_url,
                actif,
                position
                `
            )
            .order(
                "position",
                {
                    ascending: true
                }
            );


    if (error) {

        console.error(error);

        afficherMessage(
            "Impossible de charger les statistiques.",
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
                Aucune statistique configurée.
            </div>

        `;

        return;

    }


    statistiques.forEach(
        (stat, index) => {

            const card =
                document.createElement(
                    "div"
                );

            card.className =
                "event-card";


            card.style.marginBottom =
                "10px";


            card.innerHTML = `

                <div
                  style="
                    display:flex;
                    justify-content:space-between;
                    align-items:flex-start;
                    gap:15px;
                  "
                >

                  <div>

                    <div
                      style="
                        color:var(--gold);
                        font-size:10px;
                        font-weight:bold;
                        letter-spacing:1px;
                      "
                    >
                      ${escapeHtml(
                          stat.code
                      )}
                    </div>


                    <div
                      style="
                        font-size:16px;
                        font-weight:bold;
                        margin-top:5px;
                      "
                    >
                      ${escapeHtml(
                          stat.nom
                      )}
                    </div>


                    ${
                        stat.description
                            ? `
                              <div
                                style="
                                  color:var(--muted);
                                  font-size:11px;
                                  line-height:1.5;
                                  margin-top:6px;
                                "
                              >
                                ${escapeHtml(
                                    stat.description
                                )}
                              </div>
                              `
                            : ""
                    }


                    <div
                      style="
                        color:${stat.actif ? "#8ed5ad" : "#d0b779"};
                        font-size:9px;
                        margin-top:8px;
                        font-weight:bold;
                      "
                    >
                      ${
                        stat.actif
                            ? "ACTIVE"
                            : "INACTIVE"
                      }
                    </div>

                  </div>


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
                      title="Monter"
                      data-action="up"
                      data-id="${stat.id}"
                      ${index === 0 ? "disabled" : ""}
                    >
                      ↑
                    </button>


                    <button
                      type="button"
                      class="icon-button"
                      title="Descendre"
                      data-action="down"
                      data-id="${stat.id}"
                      ${
                          index ===
                          statistiques.length - 1
                              ? "disabled"
                              : ""
                      }
                    >
                      ↓
                    </button>


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
   CREATION / MODIFICATION
========================================================= */

statsForm.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        const code =
            statsCode.value
                .trim();

        const nom =
            statsNom.value
                .trim();

        const description =
            statsDescription.value
                .trim();

        const icone_url =
            statsIconeUrl.value
                .trim();

        const animation_url =
            statsAnimationUrl.value
                .trim();

        const actif =
            statsActif.checked;


        if (!code) {

            afficherMessage(
                "Le code est obligatoire.",
                "error"
            );

            return;

        }


        if (!nom) {

            afficherMessage(
                "Le nom est obligatoire.",
                "error"
            );

            return;

        }


        statsSaveButton.disabled =
            true;


        try {

            if (editionId) {

                const {
                    error
                } =
                    await supabase
                        .from("stats")
                        .update({

                            code,

                            nom,

                            description:
                                description ||
                                null,

                            icone_url:
                                icone_url ||
                                null,

                            animation_url:
                                animation_url ||
                                null,

                            actif

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

                const position =
                    statistiques.length
                        ? Math.max(
                            ...statistiques.map(
                                stat =>
                                    Number(
                                        stat.position
                                    ) || 0
                            )
                          ) + 1
                        : 0;


                const {
                    error
                } =
                    await supabase
                        .from("stats")
                        .insert({

                            code,

                            nom,

                            description:
                                description ||
                                null,

                            icone_url:
                                icone_url ||
                                null,

                            animation_url:
                                animation_url ||
                                null,

                            actif,

                            position

                        });


                if (error) {
                    throw error;
                }


                afficherMessage(
                    "Statistique créée."
                );

            }


            reinitialiserFormulaire();

            await chargerStatistiques();

        }
        catch (error) {

            console.error(error);

            if (
                error.code ===
                "23505"
            ) {

                afficherMessage(
                    "Ce code de statistique existe déjà.",
                    "error"
                );

            } else {

                afficherMessage(
                    "Impossible d'enregistrer la statistique.",
                    "error"
                );

            }

        }
        finally {

            statsSaveButton.disabled =
                false;

        }

    }
);


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


    statsId.value =
        stat.id;

    statsCode.value =
        stat.code || "";

    statsNom.value =
        stat.nom || "";

    statsDescription.value =
        stat.description || "";

    statsIconeUrl.value =
        stat.icone_url || "";

    statsAnimationUrl.value =
        stat.animation_url || "";

    statsActif.checked =
        stat.actif !== false;


    statsSaveButton.textContent =
        "ENREGISTRER LA MODIFICATION";

    statsCancelButton.style.display =
        "block";


    statsCode.focus();

}


/* =========================================================
   RESET
========================================================= */

function reinitialiserFormulaire() {

    editionId =
        null;

    statsId.value =
        "";

    statsCode.value =
        "";

    statsNom.value =
        "";

    statsDescription.value =
        "";

    statsIconeUrl.value =
        "";

    statsAnimationUrl.value =
        "";

    statsActif.checked =
        true;


    statsSaveButton.textContent =
        "CRÉER LA STATISTIQUE";

    statsCancelButton.style.display =
        "none";

}


statsCancelButton.addEventListener(
    "click",
    reinitialiserFormulaire
);


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
            "Supprimer la statistique « " +
            stat.nom +
            " » ?\n\n" +
            "Les mesures qui utilisent ce code " +
            "ne seront pas automatiquement modifiées."
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

        console.error(error);

        afficherMessage(
            "Impossible de supprimer la statistique.",
            "error"
        );

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


/* =========================================================
   ORDRE
========================================================= */

async function deplacerStatistique(
    id,
    direction
) {

    const index =
        statistiques.findIndex(
            item =>
                String(item.id) ===
                String(id)
        );


    if (index < 0) {
        return;
    }


    const autreIndex =
        index + direction;


    if (
        autreIndex < 0 ||
        autreIndex >=
        statistiques.length
    ) {

        return;

    }


    const first =
        statistiques[index];

    const second =
        statistiques[autreIndex];


    const firstPosition =
        Number(
            first.position
        ) || 0;

    const secondPosition =
        Number(
            second.position
        ) || 0;


    const firstUpdate =
        await supabase
            .from("stats")
            .update({
                position:
                    secondPosition
            })
            .eq(
                "id",
                first.id
            );


    if (firstUpdate.error) {

        console.error(
            firstUpdate.error
        );

        afficherMessage(
            "Impossible de modifier l'ordre.",
            "error"
        );

        return;

    }


    const secondUpdate =
        await supabase
            .from("stats")
            .update({
                position:
                    firstPosition
            })
            .eq(
                "id",
                second.id
            );


    if (secondUpdate.error) {

        console.error(
            secondUpdate.error
        );

        afficherMessage(
            "Impossible de modifier l'ordre.",
            "error"
        );

        return;

    }


    await chargerStatistiques();

}


/* =========================================================
   ACTIONS LISTE
========================================================= */

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


        if (
            action ===
            "up"
        ) {

            deplacerStatistique(
                id,
                -1
            );

        }


        if (
            action ===
            "down"
        ) {

            deplacerStatistique(
                id,
                1
            );

        }

    }
);


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
