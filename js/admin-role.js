/* =========================================================
AVANT-GARDE — ADMIN ROLE
js/admin-role.js

Gestion des rôles du profil :

* Liste des rôles
* Vérification de l'accès à l'onglet ROLE
* Synchronisation compétences / rôles
* Affichage de la médaille VIP
* Compteur de description
* Enregistrement des rôles

Ce fichier reprend la logique du admin.html monolithique
sans modification fonctionnelle.
========================================================= */

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
ELEMENTS
========================================================= */

const descriptionField =
document.getElementById("profileDescription");

const descriptionCounter =
document.getElementById("descriptionCounter");

const vipMedal =
document.getElementById("vipMedal");

const vipAudience =
document.getElementById("vipAudience");

const saveRolesButton =
document.getElementById("saveRolesButton");

const roleMessage =
document.getElementById("roleMessage");

/* =========================================================
COMPETENCES
========================================================= */

function normaliserCompetences(value){


if(Array.isArray(value)){

    return value;

}


if(typeof value === "string"){

    return value
        .replace(/^\{|\}$/g,"")
        .split(",")
        .map(
            x =>
                x.trim()
                 .replace(/^"|"$/g,"")
        )
        .filter(Boolean);

}


return [];


}

/* =========================================================
ACCES ROLE
========================================================= */

function peutGererRole(){


return (
    currentProfile?.grade2 &&
    String(
        currentProfile.grade2
    ).trim() !== ""
);


}

/* =========================================================
REMPLIR ROLES
========================================================= */

function remplirRoles(
competences
){


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
){


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
){


const audience =
    Number(audienceMax) || 0;


if(audience >= 3000){

    vipMedal.classList.add(
        "active"
    );


    vipAudience.textContent =
        "Audience actuelle : " +
        audience.toLocaleString(
            "fr-FR"
        ) +
        " followers";


}else{

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

function mettreAJourCompteur(){


const longueur =
    descriptionField.value.length;


descriptionCounter.textContent =
    longueur +
    " / 300";


if(longueur >= 300){

    descriptionCounter.classList.add(
        "limit"
    );


}else{

    descriptionCounter.classList.remove(
        "limit"
    );

}


}

/* =========================================================
ECOUTEUR COMPTEUR
========================================================= */

if(descriptionField){


descriptionField.addEventListener(
    "input",
    mettreAJourCompteur
);


}

/* =========================================================
SAUVEGARDE ROLE
========================================================= */

if(saveRolesButton){


saveRolesButton.addEventListener(
    "click",
    async () => {

        if(!peutGererRole()){

            return;

        }


        viderMessage(
            roleMessage
        );


        saveRolesButton.disabled =
            true;


        saveRolesButton.textContent =
            "ENREGISTREMENT…";


        /*
         * On récupère toutes les valeurs déjà présentes
         * dans competences.
         *
         * On retire uniquement les anciens rôles,
         * puis on ajoute les rôles actuellement sélectionnés.
         */

        const anciennesCompetences =
            normaliserCompetences(
                currentProfile?.competences
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
            await supabaseClient
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


        if(error){

            console.error(
                "Erreur sauvegarde rôles :",
                error
            );


            afficherMessage(
                roleMessage,
                "error",
                "Impossible d'enregistrer vos rôles. Vérifiez les droits de la table profiles dans Supabase."
            );


            saveRolesButton.disabled =
                false;


            saveRolesButton.textContent =
                "ENREGISTRER MES RÔLES";


            return;

        }


        currentProfile =
            data;


        synchroniserCompetencesEtRoles(
            data.competences
        );


        afficherMessage(
            roleMessage,
            "success",
            "Vos rôles ont bien été enregistrés."
        );


        saveRolesButton.disabled =
            false;


        saveRolesButton.textContent =
            "ENREGISTRER MES RÔLES";

    }
);


}
