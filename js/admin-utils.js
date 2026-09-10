/* =========================================================
   AVANT-GARDE — ADMIN UTILITIES
   js/admin-utils.js

   Fonctions utilitaires communes à l'administration.
========================================================= */


/* =========================================================
   MESSAGES
========================================================= */

export function afficherMessage(element, type, texte){

  element.className =
    "message " + type;

  element.textContent =
    texte;

}


export function viderMessage(element){

  element.className =
    "message";

  element.textContent =
    "";

}


/* =========================================================
   COMPETENCES
========================================================= */

export function normaliserCompetences(value){

  if(Array.isArray(value)){
    return value;
  }

  if(typeof value === "string"){

    return value
      .replace(/^\{|\}$/g,"")
      .split(",")
      .map(x =>
        x.trim()
         .replace(/^"|"$/g,"")
      )
      .filter(Boolean);

  }

  return [];

}


/* =========================================================
   REMPLIR ROLES
========================================================= */

export function remplirRoles(
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

export function synchroniserCompetencesEtRoles(
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
   ECHAPPEMENT HTML
========================================================= */

export function escapeHtml(
  value
){

  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}
