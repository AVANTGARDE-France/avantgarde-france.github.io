/* =========================================================
   AVANT-GARDE — ADMIN

   js/admin.js

   Fichier principal de l'espace membre.

   Il charge les différents modules de l'administration
   dans un environnement commun.

   ORDRE DE CHARGEMENT :

   1. OUTILS COMMUNS
   2. COEUR ADMINISTRATION
   3. PROFIL
   4. EVENEMENTS / RDV
   5. EQUIPES
   6. ROLES
   7. ONGLETS
   8. SUPPRESSION PROFIL
   9. AUTHENTIFICATION EN DERNIER

========================================================= */


/* =========================================================
   OUTILS COMMUNS
========================================================= */

import "./admin-utils.js";


/* =========================================================
   COEUR ADMINISTRATION
========================================================= */

import "./admin-core.js";


/* =========================================================
   PROFIL
========================================================= */

import "./admin-profile.js";


/* =========================================================
   EVENEMENTS / RDV
========================================================= */

import "./admin-events.js";


/* =========================================================
   GESTION DES EQUIPES
========================================================= */

import "./admin-team.js";


/* =========================================================
   GESTION DES ROLES
========================================================= */

import "./admin-role.js";


/* =========================================================
   ONGLETS
========================================================= */

import "./admin-tabs.js";


/* =========================================================
   SUPPRESSION DU PROFIL
========================================================= */

import "./admin-delete-profile.js";


/* =========================================================
   AUTHENTIFICATION
========================================================= */

/*
 * admin-auth.js est volontairement chargé en dernier.
 *
 * Il lance verifierUtilisateur() dès son chargement.
 * Les autres modules doivent donc être chargés avant lui.
 */

import "./admin-auth.js";

