/* =========================================================
   AVANT-GARDE — TROMBINOSCOPE
   js/equipe-trombinoscope.js

   Chargement et affichage des membres publics.
   Les tris, filtres et regroupements seront ajoutés ici.
========================================================= */

async function chargerTrombinoscope() {

    const grid = document.getElementById("teamGrid");
    if (!grid) return;

    grid.innerHTML = '<div class="loading">Chargement des membres…</div>';

    if (typeof supabaseClient === "undefined" || !supabaseClient) {
        grid.innerHTML = '<div class="no-members">Impossible de contacter la base de données.</div>';
        console.error("supabaseClient est introuvable.");
        return;
    }

    try {

        const { data, error } = await supabaseClient
            .from("profiles")
            .select(`
                id, created_at, nom, grade, image_url, description, region,
                competences, anonyme, facebook_url, x_url, instagram_url,
                youtube_url, tiktok_url, facebook_audience, instagram_audience,
                x_audience, youtube_audience, tiktok_audience, audience_max,
                audience_reseau, audience_updated_at
            `)
            .eq("anonyme", false)
            .order("created_at", { ascending: true });

        if (error) throw error;

        membres = Array.isArray(data) ? data : [];

        if (!membres.length) {
            grid.innerHTML = '<div class="no-members">Aucun membre public pour le moment.</div>';
            return;
        }

        grid.innerHTML = "";
        membres.forEach(membre => grid.appendChild(creerCarteMembre(membre)));

    } catch (error) {

        console.error("Erreur chargement trombinoscope :", error);
        grid.innerHTML = '<div class="no-members">Impossible de charger le trombinoscope.</div>';

    }

}
