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

   L'authentification est volontairement chargée en dernier
   afin que toutes les fonctions dont elle dépend soient
   déjà disponibles lorsqu'elle lance verifierUtilisateur().
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
   SUPPRESSION PROFIL
========================================================= */

import "./admin-delete-profile.js";


/* =========================================================
   AUTHENTIFICATION
========================================================= */

/*
 * IMPORTANT :
 *
 * admin-auth.js lance immédiatement :
 *
 *     verifierUtilisateur();
 *
 * Il doit donc être chargé après les modules dont il utilise
 * les fonctions et l'état partagé.
 */

import "./admin-auth.js";
