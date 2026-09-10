/* =========================================================
   AVANT-GARDE — ADMIN

   js/admin.js

   Fichier principal de l'espace membre.

   Il charge les différents modules de l'administration
   dans un environnement commun.

   IMPORTANT :
   - Ne contient pas la logique métier des différents modules.
   - Ne remplace aucun des modules spécialisés.
   - Sert uniquement à charger l'ensemble du système.
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
=========================================================

   IMPORTANT :

   admin-auth.js est chargé EN DERNIER.

   Il dépend de plusieurs fonctions exposées
   par les modules précédents.

========================================================= */

import "./admin-auth.js";
