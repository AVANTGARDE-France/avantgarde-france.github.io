/* =========================================================
   AVANT-GARDE — ADMIN ROLE
   js/admin-role.js

   Gestion de l'onglet ROLE :

   - Attribution des rôles
   - Synchronisation rôles / compétences
   - Médaille VIP
   - Compteur de description
========================================================= */

import { supabase } from "./supabase.js";

/* =========================================================
   UTILISATEUR / PROFIL COURANT
========================================================= */

function obtenirCurrentProfile() {
    return window.currentProfile || null;
}

function obtenirCurrentUser() {
    return window.currentUser || null;
}

/* =========================================================
   ROLES
========================================================= */

const ROLES = [
    "Organisateurs de terrain",
    "Conférenciers",
    "Influenceurs Réseaux Sociaux",
    "Parrains/marraines",
    "Militants"
];

/* =========================================================
   DROITS — GESTION DES ROLES
========================================================= */

/*
   Peuvent gérer les rôles :

   - Administrateur
   - Architecte du Projet
   - Délégué National

   Les Délégués Régionaux et les adhérents
   n'ont pas accès à cet onglet.
*/

function peutGererRole() {
    const profile = obtenirCurrentProfile();

    return !!(
        profile?.grade === "admin"
        ||
        profile?.grade2 === "Architecte du Projet"
        ||
        profile?.grade2 === "Délégué National"
    );
}

/* =========================================================
   NORMALISATION DES COMPETENCES
========================================================= */

function normaliserCompetences(value) {

    if (Array.isArray(value)) {
        return value;
    }

    if (typeof value === "string") {

        const trimmed = value.trim();

        if (!trimmed) {
            return [];
        }

        /*
           Gestion du format PostgreSQL :

           {"Role 1","Role 2"}
        */

        if (
            trimmed.startsWith("{") &&
            trimmed.endsWith("}")
        ) {

            const contenu = trimmed.slice(1, -1);

            if (!contenu.trim()) {
                return [];
            }

            return contenu
                .split(",")
                .map(item =>
                    item
                        .trim()
                        .replace(/^"(.*)"$/, "$1")
                        .replace(/\\"/g, '"')
                )
                .filter(Boolean);
        }

        /*
           Si la valeur est simplement une chaîne,
           on la considère comme une compétence unique.
        */

        return [trimmed];
    }

    return [];
}

/* =========================================================
   REMPLIR LES ROLES
========================================================= */

function remplirRoles(competences) {

    const roles = normaliserCompetences(competences);

    const inputs = document.querySelectorAll(
        'input[name="roles"]'
    );

    inputs.forEach(input => {

        input.checked = roles.includes(input.value);

    });
}

/* =========================================================
   SYNCHRONISER COMPETENCES / ROLES
========================================================= */

function synchroniserCompetencesEtRoles(competences) {

    const roles = normaliserCompetences(competences);

    /*
       Synchronisation avec les cases de compétences
       éventuellement présentes dans le profil.
    */

    const competenceInputs = document.querySelectorAll(
        'input[name="competences"]'
    );

    competenceInputs.forEach(input => {

        input.checked = roles.includes(input.value);

    });

    remplirRoles(competences);
}

/* =========================================================
   MEDAILLE VIP
========================================================= */

function mettreAJourMedailleVIP(audienceMax) {

    const vipMedal = document.getElementById("vipMedal");

    if (!vipMedal) {
        return;
    }

    const audience = Number(audienceMax || 0);

    if (audience > 0) {
        vipMedal.style.display = "inline-flex";
    } else {
        vipMedal.style.display = "none";
    }
}

/* =========================================================
   COMPTEUR DE DESCRIPTION
========================================================= */

function initialiserCompteurDescription() {

    const description = document.getElementById(
        "profileDescription"
    );

    const compteur = document.getElementById(
        "descriptionCounter"
    );

    if (!description || !compteur) {
        return;
    }

    function actualiserCompteur() {

        compteur.textContent =
            `${description.value.length}/500`;
    }

    description.addEventListener(
        "input",
        actualiserCompteur
    );

    actualiserCompteur();
}

/* =========================================================
   SAUVEGARDE DES ROLES
========================================================= */

async function sauvegarderRoles() {

    const user = obtenirCurrentUser();
    const profile = obtenirCurrentProfile();

    if (!user || !profile) {
        return;
    }

    if (!peutGererRole()) {
        return;
    }

    const roleInputs = document.querySelectorAll(
        'input[name="roles"]:checked'
    );

    const rolesSelectionnes = Array.from(roleInputs)
        .map(input => input.value);

    /*
       On récupère les compétences existantes
       afin de ne pas supprimer celles qui ne sont
       pas des rôles.
    */

    const competencesActuelles =
        normaliserCompetences(profile.competences);

    const competencesSansRoles =
        competencesActuelles.filter(
            competence => !ROLES.includes(competence)
        );

    const nouvellesCompetences = [
        ...competencesSansRoles,
        ...rolesSelectionnes
    ];

    const { data, error } = await supabase
        .from("profiles")
        .update({
            competences: nouvellesCompetences
        })
        .eq("id", user.id)
        .select()
        .single();

    if (error) {

        console.error(
            "Erreur lors de la sauvegarde des rôles :",
            error
        );

        if (
            typeof window.afficherMessageErreur === "function"
        ) {
            window.afficherMessageErreur(
                "Erreur lors de la sauvegarde des rôles."
            );
        }

        return;
    }

    /*
       Mise à jour du profil courant.
    */

    window.currentProfile = data;

    /*
       Synchronisation de l'interface.
    */

    synchroniserCompetencesEtRoles(
        data.competences
    );

    if (
        typeof window.afficherMessageSucces === "function"
    ) {

        window.afficherMessageSucces(
            "Les rôles ont été enregistrés."
        );
    }
}

/* =========================================================
   EXPORTS GLOBAUX
========================================================= */

window.ROLES = ROLES;

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
        document.getElementById("saveRolesButton");

    if (saveRolesButton) {

        saveRolesButton.addEventListener(
            "click",
            sauvegarderRoles
        );
    }

    initialiserCompteurDescription();
}

if (document.readyState === "loading") {

    document.addEventListener(
        "DOMContentLoaded",
        initialiserRole
    );

} else {

    initialiserRole();
}

