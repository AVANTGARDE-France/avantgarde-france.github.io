/* =========================================================
   AVANT-GARDE — SUPABASE
   js/supabase.js

   Connexion Supabase unique utilisée par les pages du site.
========================================================= */

import { createClient } from
    "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";


const SUPABASE_URL =
    "https://wlhtegrciehmtxqecopv.supabase.co";


const SUPABASE_KEY =
    "sb_publishable_eBPx2UZFdHbLzxSgoBor-Q_FJobVvjs";


export const supabase =
    createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );


/*
 * Compatibilité avec les anciens scripts du site.
 *
 * equipe.js utilise encore supabaseClient.
 */
window.supabaseClient = supabase;
