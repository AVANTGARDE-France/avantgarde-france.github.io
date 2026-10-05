/* =========================================================
   AVANT-GARDE — ADMIN ROLE

   js/admin-role.js

   Gestion :
   - accès au panneau ROLE
   - rôles
   - normalisation des compétences
   - affichage des rôles
   - sauvegarde des rôles
   - nettoyage automatique des rôles
   - médaille VIP
   - compteur de description

   REGLES :

   - Un membre sans grade2 n'a PAS accès à ROLE.
   - Un membre sans grade2 ne peut PAS modifier ses rôles.
   - Lorsqu'un grade2 est supprimé, les anciens rôles sont
     automatiquement retirés de profiles.competences.
   - Les compétences métier sont conservées.
   - Tout membre possédant un grade2 possède automatiquement
     le rôle "Militants".
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

        return value
            .map(
                competence =>
                    typeof competence === "string"
                        ? competence.trim()
                        : competence
            )
            .filter(Boolean);
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
   TEST GRADE2
========================================================= */

function possedeGrade2(profile = obtenirCurrentProfile()) {

    if (!profile) {

        return false;
    }


    return !!(
        profile.grade2 !== null &&
        profile.grade2 !== undefined &&
        String(profile.grade2).trim() !== ""
    );
}


/* =========================================================
   ACCES ROLE
========================================================= */

/*
 * ROLE n'est PAS accessible à tous les membres connectés.
 *
 * Un grade2 est nécessaire.
 *
 * Exemples :
 *
 * - ADMIN                    → accès si grade2 présent
 * - ARCHITECTE DU PROJET     → accès
 * - DELEGUE NATIONAL         → accès
 * - DELEGUE REGIONAL         → accès
 * - MILITANT                 → accès
 * - MEMBRE SANS GRADE2       → PAS d'accès
 *
 * Le grade2 est volontairement le critère d'accès.
 */

function peutGererRole() {

    const currentUser =
        obtenirCurrentUser();


    const currentProfile =
        obtenirCurrentProfile();


    if (
        !currentUser ||
        !currentProfile
    ) {

        return false;
    }


    return possedeGrade2(
        currentProfile
    );
}


/* =========================================================
   NETTOYAGE DES ROLES
========================================================= */

/*
 * Supprime uniquement les valeurs correspondant aux rôles.
 *
 * IMPORTANT :
 *
 * Les compétences métier sont conservées.
 *
 * Exemple :
 *
 * [
 *     "Maîtrise de doctrine",
 *     "Tactique",
 *     "Militants"
 * ]
 *
 * devient :
 *
 * [
 *     "Maîtrise de doctrine",
 *     "Tactique"
 * ]
 */

function retirerRolesDesCompetences(
    competences
) {

    const liste =
        normaliserCompetences(
            competences
        );


    return liste.filter(
        competence =>
            !ROLES.includes(
                competence
            )
    );
}


/* =========================================================
   NETTOYAGE AUTOMATIQUE EN BASE
========================================================= */

/*
 * Si grade2 est vide :
 *
 * - aucun rôle ne doit rester dans profiles.competences ;
 * - les compétences métier sont conservées.
 *
 * Cette fonction est appelée lorsque le profil courant
 * est relu par le module ROLE.
 */

async function nettoyerRolesSiNecessaire(
    profile
) {

    if (!profile) {

        return profile;
    }


    /*
     * Si grade2 existe, aucun nettoyage n'est nécessaire.
     */

    if (
        possedeGrade2(
            profile
        )
    ) {

        return profile;
    }


    const anciennesCompetences =
        normaliserCompetences(
            profile.competences
        );


    const nouvellesCompetences =
        retirerRolesDesCompetences(
            anciennesCompetences
        );


    /*
     * Rien à modifier.
     */

    if (
        nouvellesCompetences.length ===
        anciennesCompetences.length
    ) {

        return profile;
    }


    const currentUser =
        obtenirCurrentUser();


    if (!currentUser) {

        return profile;
    }


    const {
        data,
        error
    } =
        await supabase

            .from("profiles")

            .update({

                competences:
                    nouvellesCompetences

            })

            .eq(
                "id",
                currentUser.id
            )

            .select()
            .single();


    if (error) {

        console.error(
            "ROLE — erreur nettoyage automatique des rôles :",
            error
        );


        /*
         * Même si le nettoyage en base échoue,
         * on nettoie l'état local pour empêcher
         * l'affichage des anciens rôles.
         */

        profile.competences =
            nouvellesCompetences;


        return profile;
    }


    if (data) {

        window.currentProfile =
            data;

        return data;
    }


    return profile;
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
        possedeGrade2(
            profil
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
                 * possède automatiquement le rôle
                 * "Militants".
                 */

                if (
                    input.value === "Militants" &&
                    grade2Existe
                ) {

                    coche = true;
                }


                /*
                 * Sans grade2 :
                 *
                 * aucun rôle ne doit être affiché
                 * comme sélectionné.
                 */

                if (
                    !grade2Existe
                ) {

                    coche = false;
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
     * Compétences métier.
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
     * Rôles.
     */

    remplirRoles(
        liste
    );
}


/* =========================================================
   VERROUILLAGE VISUEL DU PANNEAU ROLE
========================================================= */

function actualiserInterfaceRole() {

    const autorise =
        peutGererRole();


    const roleTabButton =
        document.getElementById(
            "roleTabButton"
        );


    const roleTab =
        document.getElementById(
            "roleTab"
        );


    const saveRolesButton =
        document.getElementById(
            "saveRolesButton"
        );


    /*
     * Bouton de navigation.
     *
     * IMPORTANT :
     * on utilise style.display sans !important.
     */

    if (roleTabButton) {

        roleTabButton.style.display =
            autorise
                ? ""
                : "none";
    }


    /*
     * Panneau ROLE.
     */

    if (roleTab) {

        if (!autorise) {

            roleTab.style.display =
                "none";
        }
    }


    /*
     * Sauvegarde.
     */

    if (saveRolesButton) {

        saveRolesButton.disabled =
            !autorise;
    }


    /*
     * Cases de rôles.
     */

    document

        .querySelectorAll(
            'input[name="roles"]'
        )

        .forEach(
            input => {

                input.disabled =
                    !autorise;
            }
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
     * Evite de créer plusieurs écouteurs.
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
   ACTUALISATION DU PROFIL POUR L'ONGLET ROLE
========================================================= */

async function actualiserProfilRole() {

    const currentUser =
        obtenirCurrentUser();


    if (
        !currentUser
    ) {

        actualiserInterfaceRole();

        return;
    }


    const {
        data,
        error
    } =
        await supabase

            .from("profiles")

            .select("*")

            .eq(
                "id",
                currentUser.id
            )

            .single();


    if (
        error
    ) {

        console.error(
            "ROLE — erreur actualisation profil :",
            error
        );


        actualiserInterfaceRole();

        return;
    }


    if (
        !data
    ) {

        actualiserInterfaceRole();

        return;
    }


    /*
     * Mise à jour du profil global.
     */

    window.currentProfile =
        data;


    /*
     * Si grade2 est vide, les anciens rôles
     * sont supprimés automatiquement.
     */

    const profilNettoye =
        await nettoyerRolesSiNecessaire(
            data
        );


    const profilFinal =
        profilNettoye ||
        window.currentProfile ||
        data;


    /*
     * Après nettoyage, on recalcule le droit.
     */

    window.currentProfile =
        profilFinal;


    actualiserInterfaceRole();


    /*
     * Si aucun grade2 :
     *
     * on ne synchronise pas les rôles
     * comme des rôles actifs.
     */

    synchroniserCompetencesEtRoles(
        profilFinal.competences
    );


    /*
     * Mise à jour de la médaille VIP.
     */

    mettreAJourMedailleVIP(

        profilFinal.audience_max ??
        profilFinal.audienceMax ??
        profilFinal.audience ??
        0

    );


    /*
     * Mise à jour éventuelle de la description.
     */

    const descriptionField =
        document.getElementById(
            "profileDescription"
        );


    if (
        descriptionField &&
        typeof profilFinal.description === "string"
    ) {

        descriptionField.value =
            profilFinal.description;
    }


    initialiserCompteurDescription();
}


/* =========================================================
   ACTUALISATION DYNAMIQUE DE L'ONGLET
========================================================= */

let adminRoleTabListenerInitialized =
    false;


let actualisationRoleEnCours =
    false;


function initialiserEcouteurOnglet() {

    if (
        adminRoleTabListenerInitialized
    ) {

        return;
    }


    adminRoleTabListenerInitialized =
        true;


    window.addEventListener(
        "avantgarde:admin-tab-changed",
        async event => {

            const onglet =
                event?.detail?.tab;


            if (
                onglet !==
                "roleTab"
            ) {

                /*
                 * Même hors ROLE, on peut vérifier
                 * si grade2 a changé depuis un autre
                 * module.
                 */

                actualiserInterfaceRole();

                return;
            }


            if (
                actualisationRoleEnCours
            ) {

                return;
            }


            actualisationRoleEnCours =
                true;


            try {

                await actualiserProfilRole();

            }
            catch (error) {

                console.error(
                    "ROLE — actualisation de l'onglet :",
                    error
                );

            }
            finally {

                actualisationRoleEnCours =
                    false;

            }

        }
    );
}


/* =========================================================
   BLOCAGE D'ACCES DIRECT AU ROLE
========================================================= */

/*
 * Si un utilisateur tente d'ouvrir directement :
 *
 * ?tab=roleTab
 *
 * sans grade2, on empêche l'affichage du panneau.
 *
 * Le module admin-tabs doit également appliquer
 * ses propres contrôles de navigation.
 */

function bloquerAccesRoleSiNecessaire() {

    if (
        peutGererRole()
    ) {

        return;
    }


    const roleTab =
        document.getElementById(
            "roleTab"
        );


    const roleTabButton =
        document.getElementById(
            "roleTabButton"
        );


    if (roleTab) {

        roleTab.style.display =
            "none";
    }


    if (roleTabButton) {

        roleTabButton.style.display =
            "none";
    }
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
     * IMPORTANT :
     * le contrôle est effectué au moment exact
     * de la sauvegarde.
     */

    if (
        !peutGererRole()
    ) {

        actualiserInterfaceRole();


        if (
            typeof window.afficherMessage ===
            "function"
        ) {

            window.afficherMessage(

                roleMessage,

                "error",

                "Vous n'avez pas de grade vous permettant de modifier les rôles."

            );
        }


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
        retirerRolesDesCompetences(
            anciennesCompetences
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
     * "Militants" est obligatoire.
     */

    if (
        possedeGrade2(
            currentProfile
        ) &&
        !rolesSelectionnes.includes(
            "Militants"
        )
    ) {

        rolesSelectionnes.push(
            "Militants"
        );
    }


    /*
     * Sécurité supplémentaire :
     *
     * on ne sauvegarde que des valeurs
     * appartenant à la liste officielle des rôles.
     */

    rolesSelectionnes =
        rolesSelectionnes.filter(
            role =>
                ROLES.includes(
                    role
                )
        );


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


    actualiserInterfaceRole();


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


window.actualiserProfilRole =
    actualiserProfilRole;


window.actualiserInterfaceRole =
    actualiserInterfaceRole;


/* =========================================================
   INITIALISATION
========================================================= */

function initialiserRole() {

    /*
     * Installe l'écouteur avant toute interaction
     * avec l'onglet ROLE.
     */

    initialiserEcouteurOnglet();


    /*
     * Contrôle immédiat de l'accès.
     */

    actualiserInterfaceRole();


    bloquerAccesRoleSiNecessaire();


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
