/* =========================================================
   AVANT-GARDE — ADMIN STATISTIQUES
   js/adminstats.js

   Bibliothèque des icônes animées utilisées
   par les cartes de mesures.

   ACCÈS :
   - Administrateurs uniquement.

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

   Il est possible de retirer directement le rattachement
   d'une statistique à une mesure depuis cette page.

   Suppression protégée si la statistique est encore utilisée
   par un contenu.
========================================================= */

import { supabase } from "./supabase.js";


/* =========================================================
   ETAT
========================================================= */

let statistiques = [];

let mesures = [];

let editionId = null;


/*
 * Empêche l'installation plusieurs fois du même
 * écouteur de changement d'onglet.
 */
let adminStatsTabListenerInitialized = false;


/*
 * Empêche plusieurs initialisations du module.
 */
let moduleInitialise = false;


/*
 * Indique que l'authentification est connue.
 */
let authVerifiee = false;


/*
 * Indique qu'une initialisation est en attente
 * de la fin du chargement de l'authentification.
 */
let initialisationEnAttente = false;


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
   VERIFICATION ADMIN LOCALE
========================================================= */

/*
 * Vérification rapide à partir du profil déjà chargé
 * par admin-core.js.
 *
 * IMPORTANT :
 * Cette fonction ne considère PAS l'absence de profil
 * comme une autorisation.
 */
function estAdministrateur(
    profile = window.currentProfile
) {

    return (
        profile?.grade ===
        "admin"
    );

}


/* =========================================================
   VERIFICATION ADMIN SUPABASE
========================================================= */

/*
 * Vérification renforcée utilisée avant les opérations
 * sensibles.
 *
 * Cela évite de se fier uniquement à l'état visuel
 * de l'interface.
 */
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


    /*
     * Si admin-core possède déjà le profil correspondant
     * à l'utilisateur connecté, on l'utilise.
     *
     * Cela évite une requête inutile dans le cas normal.
     */
    if (
        window.currentProfile &&
        String(
            window.currentProfile.id
        ) ===
        String(
            user.id
        )
    ) {

        if (
            window.currentProfile.grade !==
            "admin"
        ) {

            throw new Error(
                "Accès réservé aux administrateurs."
            );

        }

        authVerifiee = true;

        return true;

    }


    /*
     * Fallback :
     * récupération directe du profil.
     */
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


    authVerifiee = true;

    return true;

}


/* =========================================================
   GARDE MODULE
========================================================= */

/*
 * Garde locale stricte.
 *
 * IMPORTANT :
 * L'absence de profil ne vaut JAMAIS autorisation.
 *
 * Si l'authentification n'est pas encore prête,
 * cette fonction refuse l'accès au lieu de lancer
 * prématurément une requête métier.
 */
function accesAdminLocalDisponible() {

    if (
        !window.adminAuthReady
    ) {

        return false;

    }


    return estAdministrateur();

}


/*
 * Vérification utilisée pour les opérations sensibles.
 */
async function exigerAdmin() {

    /*
     * Premier niveau :
     * profil déjà chargé et authentification prête.
     */
    if (
        accesAdminLocalDisponible()
    ) {

        authVerifiee = true;

        return true;

    }


    /*
     * Si l'authentification n'est pas encore prête,
     * on ne doit pas lancer les opérations métier.
     *
     * L'initialisation attendra l'événement
     * avantgarde:admin-connected.
     */
    if (
        !window.adminAuthReady
    ) {

        return false;

    }


    /*
     * Si l'authentification est prête mais que le profil
     * local n'autorise pas l'accès, on effectue une
     * vérification renforcée.
     */
    try {

        await verifierAdmin();

        return true;

    }
    catch (error) {

        console.warn(
            "STATISTIQUES — ACCÈS REFUSÉ :",
            error.message
        );

        return false;

    }

}


/* =========================================================
   CHARGEMENT DES STATISTIQUES
========================================================= */

async function chargerStatistiques() {

    if (
        !await exigerAdmin()
    ) {

        return;

    }


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

    if (
        !await exigerAdmin()
    ) {

        return;

    }


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
   CHAMP CONTENANT LA STATISTIQUE
========================================================= */

function trouverChampStatistique(
    mesure,
    statId
) {

    const champs = [
        "stat_1",
        "stat_2",
        "stat_3"
    ];


    for (
        const champ of champs
    ) {

        if (
            String(
                mesure[champ] ?? ""
            ) ===
            String(statId)
        ) {

            return champ;

        }

    }


    return null;

}


/* =========================================================
   RETIRER LE RATTACHEMENT
========================================================= */

async function retirerRattachement(
    statId,
    mesureId
) {

    /*
     * GARDE ADMIN
     */
    if (
        !await exigerAdmin()
    ) {

        afficherMessage(
            "Accès réservé aux administrateurs.",
            "error"
        );

        return;

    }


    const mesure =
        mesures.find(
            item =>
                String(item.id) ===
                String(mesureId)
        );


    if (!mesure) {

        afficherMessage(
            "Mesure introuvable.",
            "error"
        );

        return;

    }


    const champ =
        trouverChampStatistique(
            mesure,
            statId
        );


    if (!champ) {

        afficherMessage(
            "Ce rattachement n'existe plus.",
            "error"
        );


        try {

            await chargerMesures();

            renderStats();

        }
        catch (error) {

            console.error(error);

        }

        return;

    }


    const confirmation =
        confirm(
            "Retirer la statistique « " +
            (
                statistiques.find(
                    stat =>
                        String(stat.id) ===
                        String(statId)
                )?.nom ||
                "cette statistique"
            ) +
            " de la mesure « " +
            (
                mesure.titre ||
                "Mesure sans titre"
            ) +
            " » ?"
        );


    if (!confirmation) {
        return;
    }


    const bouton =
        document.querySelector(
            `button[data-action="detach-stat"][data-stat-id="${CSS.escape(String(statId))}"][data-mesure-id="${CSS.escape(String(mesureId))}"]`
        );


    if (bouton) {

        bouton.disabled =
            true;

        bouton.style.opacity =
            "0.5";

        bouton.style.pointerEvents =
            "none";

    }


    try {

        /*
         * Nouvelle vérification juste avant écriture.
         */
        await verifierAdmin();


        const {
            error
        } =
            await supabase
                .from("contenus")
                .update({

                    [champ]: null

                })
                .eq(
                    "id",
                    mesureId
                );


        if (error) {
            throw error;
        }


        mesure[champ] =
            null;


        renderStats();


        afficherMessage(
            "Statistique retirée de la mesure."
        );

    }
    catch (error) {

        console.error(
            "RETRAIT RATTACHEMENT :",
            error
        );


        afficherMessage(
            "Impossible de retirer cette statistique de la mesure.",
            "error"
        );

    }

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
   RENDU
========================================================= */

function renderStats() {

    /*
     * GARDE UI
     */
    if (
        !estAdministrateur()
    ) {

        if (statsList) {
            statsList.innerHTML = "";
        }

        return;

    }


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
                                ${mesuresStat.length}
                                mesure${mesuresStat.length > 1 ? "s" : ""}
                                concernée${mesuresStat.length > 1 ? "s" : ""}
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
                                                            align-items:center;
                                                            gap:8px;
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


                                                            <span
                                                              style="
                                                                flex:1;
                                                                min-width:0;
                                                              "
                                                            >
                                                                ${escapeHtml(
                                                                    mesure.titre
                                                                )}
                                                            </span>


                                                            <button
                                                              type="button"
                                                              class="icon-button danger"
                                                              title="Retirer cette statistique de cette mesure"
                                                              data-action="detach-stat"
                                                              data-stat-id="${escapeHtml(stat.id)}"
                                                              data-mesure-id="${escapeHtml(mesure.id)}"
                                                              style="
                                                                width:24px;
                                                                height:24px;
                                                                min-width:24px;
                                                                padding:0;
                                                                font-size:15px;
                                                                line-height:1;
                                                                flex-shrink:0;
                                                              "
                                                            >
                                                                ×
                                                            </button>

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
   OUVERTURE FORMULAIRE
========================================================= */

function ouvrirFormulaire() {

    if (
        !estAdministrateur()
    ) {

        afficherMessage(
            "Accès réservé aux administrateurs.",
            "error"
        );

        return;

    }


    if (!statsEditor) {
        return;
    }


    editionId =
        null;


    if (statsId) {
        statsId.value = "";
    }


    if (statsNom) {
        statsNom.value = "";
    }


    if (statsLien) {
        statsLien.value = "";
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
        statsId.value = "";
    }


    if (statsNom) {
        statsNom.value = "";
    }


    if (statsLien) {
        statsLien.value = "";
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


            /*
             * GARDE IMMEDIATE
             */
            if (
                !await exigerAdmin()
            ) {

                afficherMessage(
                    "Accès réservé aux administrateurs.",
                    "error"
                );

                return;

            }


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

                /*
                 * Vérification juste avant écriture.
                 */
                await verifierAdmin();


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

                }
                else {

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
                    error.message ===
                        "Accès réservé aux administrateurs."
                        ? error.message
                        : "Impossible d'enregistrer l'icône.",
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

    if (
        !estAdministrateur()
    ) {

        afficherMessage(
            "Accès réservé aux administrateurs.",
            "error"
        );

        return;

    }


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
        statsId.value = stat.id;
    }


    if (statsNom) {
        statsNom.value = stat.nom || "";
    }


    if (statsLien) {
        statsLien.value = stat.lien || "";
    }


    if (statsEditor) {
        statsEditor.style.display = "block";
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

    if (
        !await exigerAdmin()
    ) {

        throw new Error(
            "Accès réservé aux administrateurs."
        );

    }


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

    if (
        !await exigerAdmin()
    ) {

        afficherMessage(
            "Accès réservé aux administrateurs.",
            "error"
        );

        return;

    }


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


    try {

        /*
         * Vérification finale avant suppression.
         */
        await verifierAdmin();


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

            }
            else {

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
    catch (error) {

        console.error(
            "SUPPRESSION STAT :",
            error
        );


        afficherMessage(
            error.message ===
                "Accès réservé aux administrateurs."
                ? error.message
                : "Impossible de supprimer l’icône.",
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

            if (
                !estAdministrateur()
            ) {
                return;
            }


            const button =
                event.target.closest(
                    "button[data-action]"
                );


            if (!button) {
                return;
            }


            const action =
                button.dataset.action;


            const id =
                button.dataset.id;


            if (
                action ===
                "edit"
            ) {

                modifierStatistique(
                    id
                );

                return;

            }


            if (
                action ===
                "delete"
            ) {

                supprimerStatistique(
                    id
                );

                return;

            }


            if (
                action ===
                "detach-stat"
            ) {

                const statId =
                    button.dataset.statId;

                const mesureId =
                    button.dataset.mesureId;


                retirerRattachement(
                    statId,
                    mesureId
                );

                return;

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
   ACTUALISATION AU CHANGEMENT D'ONGLET
========================================================= */

function initialiserEcouteurOnglet() {

    if (
        adminStatsTabListenerInitialized
    ) {
        return;
    }


    adminStatsTabListenerInitialized =
        true;


    window.addEventListener(
        "avantgarde:admin-tab-changed",
        async event => {

            if (
                event.detail?.tab !==
                "statsTab"
            ) {
                return;
            }


            /*
             * Un non-admin ne doit jamais déclencher
             * le chargement des données.
             */
            if (
                !estAdministrateur()
            ) {

                return;

            }


            try {

                /*
                 * Vérification avant actualisation.
                 */
                if (
                    !await exigerAdmin()
                ) {

                    return;

                }


                await Promise.all([

                    chargerStatistiques(),

                    chargerMesures()

                ]);


                renderStats();

            }
            catch (error) {

                console.error(
                    "STATISTIQUES — ACTUALISATION ONGLET :",
                    error
                );


                afficherMessage(
                    "Impossible d'actualiser les statistiques.",
                    "error"
                );

            }

        }
    );

}


/* =========================================================
   MASQUAGE NON-ADMIN
========================================================= */

function appliquerProtectionNonAdmin() {

    /*
     * Le module ne doit rien laisser apparaître
     * pour un profil non administrateur.
     */

    if (statsTabButton) {

        statsTabButton.style.display =
            "none";

    }


    if (statsEditor) {

        statsEditor.style.display =
            "none";

    }


    if (statsList) {

        statsList.innerHTML =
            "";

    }


    statistiques =
        [];

    mesures =
        [];

    editionId =
        null;

}


/* =========================================================
   INITIALISATION MODULE
========================================================= */

async function initialiserModule() {

    if (moduleInitialise) {
        return;
    }


    /*
     * Tant que l'authentification n'est pas prête,
     * on ne fait aucune requête métier.
     */
    if (
        !window.adminAuthReady
    ) {

        initialisationEnAttente =
            true;

        return;

    }


    /*
     * Le profil est maintenant connu.
     *
     * Un non-admin est définitivement refusé.
     */
    if (
        !estAdministrateur()
    ) {

        initialisationEnAttente =
            false;

        appliquerProtectionNonAdmin();

        return;

    }


    /*
     * Double vérification avant initialisation.
     */
    if (
        !await exigerAdmin()
    ) {

        initialisationEnAttente =
            false;

        appliquerProtectionNonAdmin();

        return;

    }


    moduleInitialise =
        true;

    initialisationEnAttente =
        false;


    if (statsTabButton) {

        statsTabButton.style.display =
            "block";

    }


    reinitialiserFormulaire();


    try {

        await Promise.all([
            chargerStatistiques(),
            chargerMesures()
        ]);


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
   AUTHENTIFICATION ADMIN
========================================================= */

/*
 * admin-core.js déclenche normalement cet événement
 * après avoir chargé currentProfile.
 *
 * Le module ne se lance qu'après réception du profil.
 */
window.addEventListener(
    "avantgarde:admin-connected",
    event => {

        const profile =
            event.detail?.profile ||
            window.currentProfile;


        /*
         * Mise à jour de l'état partagé si nécessaire.
         *
         * On ne remplace pas currentProfile :
         * admin-core.js en reste la source officielle.
         */
        if (
            profile?.grade !==
            "admin"
        ) {

            initialisationEnAttente =
                false;

            appliquerProtectionNonAdmin();

            return;

        }


        /*
         * L'événement confirme que le profil admin
         * est maintenant disponible.
         */
        authVerifiee =
            true;


        initialiserModule();

    }
);


/* =========================================================
   LANCEMENT
========================================================= */

initialiserEcouteurOnglet();


/*
 * Cas où admin-core est déjà initialisé avant
 * le chargement de ce module.
 *
 * IMPORTANT :
 * Aucun appel à initialiserModule() n'est effectué
 * avant que adminAuthReady soit vrai.
 */
if (
    window.adminAuthReady
) {

    initialiserModule();

}
