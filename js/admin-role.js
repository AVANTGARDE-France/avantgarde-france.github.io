/* =========================================================
   AVANT-GARDE — ADMIN ROLE

   js/admin-role.js

   Gestion :
   - accès au panneau ROLE
   - rôles
   - normalisation des compétences
   - affichage des rôles
   - sauvegarde des rôles

   Les fonctions utilisées par les autres modules sont
   exposées sur window afin de conserver le comportement
   du monolithe après séparation en modules ES.
========================================================= */

import { supabase } from "./supabase.js";


/* =========================================================
   OUTILS INTERNES
========================================================= */

function obtenirCurrentProfile() {

    return window.currentProfile || null;
}


function obtenirCurrentUser() {

    return window.currentUser || null;
}


/* =========================================================
   LISTE DES ROLES
========================================================= */

const ROLES = [

    "Organisateurs de terrain",

    "Conférenciers",

    "Influenceurs Réseaux Sociaux",

    "Parrains/marraines",

    "Militants"

];


/* =========================================================
   NORMALISATION DES COMPETENCES
========================================================= */

function normaliserCompetences(value) {

    if (Array.isArray(value)) {

        return value;
    }


    if (typeof value === "string") {

        return value

            .replace(/^\{|\}$/g, "")

            .split(",")

            .map(x =>

                x
                    .trim()
                    .replace(/^"|"$/g, "")

            )

            .filter(Boolean);
    }


    return [];
}


/* =========================================================
   ACCES ROLE
========================================================= */

function peutGererRole() {

    const profile =
        obtenirCurrentProfile();


    return !!(

        profile?.grade2 &&

        String(
            profile.grade2
        ).trim() !== ""

    );
}


/* =========================================================
   REMPLIR ROLES
========================================================= */

function remplirRoles(
    competences
) {

    const liste =
        normaliserCompetences(
            competences
        );


    document

        .querySelectorAll(
            'input[name="roles"]'
        )

        .forEach(
            input => {

                input.checked =
                    liste.includes(
                        input.value
                    );

            }
        );
}


/* =========================================================
   SYNCHRONISER COMPETENCES / ROLES
========================================================= */

function synchroniserCompetencesEtRoles(
    competences
) {

    const liste =
        normaliserCompetences(
            competences
        );


    document

        .querySelectorAll(
            'input[name="competences"]'
        )

        .forEach(
            input => {

                input.checked =
                    liste.includes(
                        input.value
                    );

            }
        );


    remplirRoles(
        liste
    );
}


/* =========================================================
   MEDAILLE VIP
========================================================= */

function mettreAJourMedailleVIP(
    audienceMax
) {

    const audience =
        Number(audienceMax) || 0;


    const vipMedal =
        document.getElementById(
            "vipMedal"
        );

    const vipAudience =
        document.getElementById(
            "vipAudience"
        );


    if (!vipMedal || !vipAudience) {

        return;
    }


    if (audience >= 3000) {

        vipMedal.classList.add(
            "active"
        );


        vipAudience.textContent =
            "Audience actuelle : " +

            audience.toLocaleString(
                "fr-FR"
            ) +

            " followers";

    } else {

        vipMedal.classList.remove(
            "active"
        );


        vipAudience.textContent =
            audience > 0

                ? "Audience actuelle : " +

                  audience.toLocaleString(
                      "fr-FR"
                  ) +

                  " followers"

                : "Audience actuelle : —";
    }
}


/* =========================================================
   COMPTEUR DESCRIPTION
========================================================= */

function initialiserCompteurDescription() {

    const descriptionField =
        document.getElementById(
            "profileDescription"
        );

    const descriptionCounter =
        document.getElementById(
            "descriptionCounter"
        );


    if (
        !descriptionField ||
        !descriptionCounter
    ) {

        return;
    }


    function mettreAJourCompteur() {

        const longueur =
            descriptionField.value.length;


        descriptionCounter.textContent =
            longueur + " / 300";


        if (longueur >= 300) {

            descriptionCounter.classList.add(
                "limit"
            );

        } else {

            descriptionCounter.classList.remove(
                "limit"
            );
        }
    }


    descriptionField.addEventListener(
        "input",
        mettreAJourCompteur
    );


    mettreAJourCompteur();
}


/* =========================================================
   SAUVEGARDE DES ROLES
========================================================= */

async function sauvegarderRoles() {

    const currentUser =
        obtenirCurrentUser();

    const currentProfile =
        obtenirCurrentProfile();


    const saveRolesButton =
        document.getElementById(
            "saveRolesButton"
        );

    const roleMessage =
        document.getElementById(
            "roleMessage"
        );


    if (
        !currentUser ||
        !currentProfile
    ) {

        return;
    }


    if (!peutGererRole()) {

        return;
    }


    if (
        typeof window.viderMessage ===
        "function"
    ) {

        window.viderMessage(
            roleMessage
        );
    }


    if (saveRolesButton) {

        saveRolesButton.disabled =
            true;

        saveRolesButton.textContent =
            "ENREGISTREMENT…";
    }


    /*
     * On conserve toutes les anciennes
     * compétences qui ne sont pas des rôles.
     */

    const anciennesCompetences =
        normaliserCompetences(
            currentProfile.competences
        );


    const competencesExistantes =
        anciennesCompetences.filter(
            competence =>
                !ROLES.includes(
                    competence
                )
        );


    const rolesSelectionnes =
        Array.from(
            document.querySelectorAll(
                'input[name="roles"]:checked'
            )
        )
        .map(
            input =>
                input.value
        );


    const competences =
        Array.from(
            new Set([
                ...competencesExistantes,
                ...rolesSelectionnes
            ])
        );


    const {
        data,
        error
    } =
        await supabase

            .from("profiles")

            .update({

                competences:
                    competences

            })

            .eq(
                "id",
                currentUser.id
            )

            .select()
            .single();


    if (error) {

        console.error(
            "Erreur sauvegarde rôles :",
            error
        );


        if (
            typeof window.afficherMessage ===
            "function"
        ) {

            window.afficherMessage(

                roleMessage,

                "error",

                "Impossible d'enregistrer vos rôles. Vérifiez les droits de la table profiles dans Supabase."

            );
        }


        if (saveRolesButton) {

            saveRolesButton.disabled =
                false;

            saveRolesButton.textContent =
                "ENREGISTRER MES RÔLES";
        }


        return;
    }


    /*
     * Mise à jour du profil global.
     */

    window.currentProfile =
        data;


    synchroniserCompetencesEtRoles(
        data.competences
    );


    if (
        typeof window.afficherMessage ===
        "function"
    ) {

        window.afficherMessage(

            roleMessage,

            "success",

            "Vos rôles ont bien été enregistrés."

        );
    }


    if (saveRolesButton) {

        saveRolesButton.disabled =
            false;

        saveRolesButton.textContent =
            "ENREGISTRER MES RÔLES";
    }
}


/* =========================================================
   EXPOSITION GLOBALE
========================================================= */

window.ROLES =
    ROLES;


window.normaliserCompetences =
    normaliserCompetences;


window.peutGererRole =
    peutGererRole;


window.remplirRoles =
    remplirRoles;


window.synchroniserCompetencesEtRoles =
    synchroniserCompetencesEtRoles;


window.mettreAJourMedailleVIP =
    mettreAJourMedailleVIP;


window.sauvegarderRoles =
    sauvegarderRoles;


/* =========================================================
   INITIALISATION
========================================================= */

function initialiserRole() {

    const saveRolesButton =
        document.getElementById(
            "saveRolesButton"
        );


    if (
        saveRolesButton &&
        saveRolesButton.dataset.initialized !==
            "true"
    ) {

        saveRolesButton.dataset.initialized =
            "true";


        saveRolesButton.addEventListener(
            "click",
            sauvegarderRoles
        );
    }


    initialiserCompteurDescription();
}


if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initialiserRole,
        {
            once: true
        }
    );

} else {

    initialiserRole();
}

