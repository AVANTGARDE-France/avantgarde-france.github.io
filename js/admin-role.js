/* =========================================================
   AVANT-GARDE — ADMIN ROLE

   js/admin-role.js

   Gestion :
   - accès au panneau ROLE
   - rôles
   - normalisation des compétences
   - affichage des rôles
   - sauvegarde des rôles
   - médaille VIP
   - compteur de description

   IMPORTANT :
   Le panneau ROLE est un espace personnel.
   Il est donc accessible à tout membre connecté,
   quel que soit son grade ou grade2.

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

            .map(
                x =>
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

/*
 * IMPORTANT :
 *
 * ROLE est un espace personnel.
 *
 * Tous les membres connectés peuvent sélectionner
 * et modifier leurs propres rôles.
 *
 * Il ne faut donc PAS tester grade ou grade2 ici.
 *
 * Ainsi :
 *
 * - ADMIN                    → accès
 * - ARCHITECTE DU PROJET     → accès
 * - DELEGUE NATIONAL         → accès
 * - DELEGUE REGIONAL         → accès
 * - MEMBRE / EQUIPE MILITANTE→ accès
 *
 * grade2 peut donc parfaitement être null.
 */

function peutGererRole() {

    return !!(
        obtenirCurrentUser() &&
        obtenirCurrentProfile()
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


    const profil =
        obtenirCurrentProfile();


    const grade2Existe =
        !!(
            profil &&
            profil.grade2 !== null &&
            profil.grade2 !== undefined &&
            String(profil.grade2).trim() !== ""
        );


    document

        .querySelectorAll(
            'input[name="roles"]'
        )

        .forEach(
            input => {

                let coche =
                    liste.includes(
                        input.value
                    );


                /*
                 * REGLE AUTOMATIQUE :
                 *
                 * Tout membre ayant un grade2
                 * est automatiquement considéré
                 * comme militant.
                 *
                 * Le rôle "Militants" est donc
                 * coché par défaut dès que grade2
                 * n'est pas null.
                 */

                if (
                    input.value === "Militants" &&
                    grade2Existe
                ) {

                    coche = true;

                }


                input.checked =
                    coche;

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


    /*
     * Compétences métier
     */

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


    /*
     * Rôles
     */

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


    if (
        !vipMedal ||
        !vipAudience
    ) {

        return;
    }


    if (
        audience >= 3000
    ) {

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


        if (
            longueur >= 300
        ) {

            descriptionCounter.classList.add(
                "limit"
            );

        } else {

            descriptionCounter.classList.remove(
                "limit"
            );
        }
    }


    /*
     * Evite de créer plusieurs écouteurs
     * si le module est initialisé plusieurs fois.
     */

    if (
        descriptionField.dataset.counterInitialized !==
        "true"
    ) {

        descriptionField.dataset.counterInitialized =
            "true";


        descriptionField.addEventListener(
            "input",
            mettreAJourCompteur
        );
    }


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


    /*
     * Vérification de connexion.
     */

    if (
        !currentUser ||
        !currentProfile
    ) {

        if (
            typeof window.afficherMessage ===
            "function"
        ) {

            window.afficherMessage(

                roleMessage,

                "error",

                "Vous devez être connecté pour modifier vos rôles."

            );
        }


        return;
    }


    /*
     * Vérification du droit.
     *
     * Tous les membres connectés sont autorisés.
     */

    if (
        !peutGererRole()
    ) {

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


    if (
        saveRolesButton
    ) {

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


    /*
     * Récupération des rôles cochés.
     */

    let rolesSelectionnes =
        Array.from(

            document.querySelectorAll(
                'input[name="roles"]:checked'
            )

        )

        .map(
            input =>
                input.value
        );


    /*
     * REGLE AUTOMATIQUE :
     *
     * Si le membre possède un grade2,
     * le rôle "Militants" doit obligatoirement
     * être présent dans ses rôles.
     *
     * Cela garantit que le rôle ne disparaît
     * pas simplement parce que la case a été
     * décochée manuellement.
     */

    const grade2Existe =
        currentProfile.grade2 !== null &&
        currentProfile.grade2 !== undefined &&
        String(currentProfile.grade2).trim() !== "";


    if (
        grade2Existe &&
        !rolesSelectionnes.includes(
            "Militants"
        )
    ) {

        rolesSelectionnes.push(
            "Militants"
        );

    }


    /*
     * Fusion compétences + rôles.
     *
     * Les doublons sont supprimés.
     */

    const competences =
        Array.from(

            new Set([

                ...competencesExistantes,

                ...rolesSelectionnes

            ])

        );


    /*
     * Sauvegarde Supabase.
     */

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


    if (
        error
    ) {

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


        if (
            saveRolesButton
        ) {

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


    /*
     * Resynchronisation immédiate
     * de l'affichage.
     */

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


    if (
        saveRolesButton
    ) {

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


/* =========================================================
   DOM READY
========================================================= */

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
