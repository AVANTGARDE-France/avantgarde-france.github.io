/* =========================================================
   AVANT-GARDE — SUPABASE
   js/supabase.js

   Connexion Supabase unique utilisée par les pages du site.
========================================================= */

export const supabase =
    window.supabase.createClient(
        "https://wlhtegrciehmtxqecopv.supabase.co",
        "sb_publishable_eBPx2UZFdHbLzxSgoBor-Q_FJobVvjs"
    );

/*
 * Compatibilité avec les anciens scripts du site.
 *
 * equipe.js utilise encore supabaseClient.
 * On conserve donc cet alias sans modifier toute la logique
 * existante de la page équipe.
 */
window.supabaseClient = supabase;
