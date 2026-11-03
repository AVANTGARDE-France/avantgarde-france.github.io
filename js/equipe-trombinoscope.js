/* =========================================================
   AVANT-GARDE — TROMBINOSCOPE ET DIRECTION
   js/equipe-trombinoscope.js

   Les deux fonctions dirigeantes sont lues depuis profiles.grade2.
   Les membres dirigeants sont affichés dans leur bloc dédié et
   exclus du trombinoscope pour éviter les doublons.
========================================================= */

const FONCTIONS_DIRECTION = [
    "Architecte du Projet",
    "Délégué National"
];

function normaliserFonctionDirection(valeur) {
    return String(valeur || "")
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
}

function creerCarteDirection(membre, fonction) {
    const card = document.createElement("article");
    card.className = "leadership-card leadership-card-profile";
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", "Voir le profil de " + (membre.nom || fonction));

    const photoZone = document.createElement("div");
    photoZone.className = "leadership-photo-wrap";

    if (membre.image_url && typeof imageValide === "function" && imageValide(membre.image_url)) {
        const image = document.createElement("img");
        image.className = "leadership-photo";
        image.src = membre.image_url;
        image.alt = membre.nom || fonction;
        image.loading = "lazy";
        image.onerror = () => {
            image.replaceWith(creerMonogrammeDirection(membre.nom));
        };
        photoZone.appendChild(image);
    } else {
        photoZone.appendChild(creerMonogrammeDirection(membre.nom));
    }

    const role = document.createElement("div");
    role.className = "leadership-role";
    role.textContent = fonction;

    const name = document.createElement("h3");
    name.textContent = membre.nom || "Membre";

    const region = document.createElement("p");
    region.className = "leadership-member-region";
    region.textContent = membre.region || "";

    card.append(photoZone, role, name);
    if (membre.region) card.appendChild(region);

    const ouvrir = () => ouvrirProfil(membre);
    card.addEventListener("click", ouvrir);
    card.addEventListener("keydown", event => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            ouvrir();
        }
    });

    return card;
}

function creerMonogrammeDirection(nom) {
    const monogramme = document.createElement("div");
    monogramme.className = "leadership-monogram";
    monogramme.setAttribute("aria-hidden", "true");
    monogramme.textContent = String(nom || "A").trim().charAt(0).toUpperCase();
    return monogramme;
}

function afficherDirection(membres) {
    const grid = document.querySelector(".leadership-grid");
    if (!grid) return;

    grid.innerHTML = "";

    FONCTIONS_DIRECTION.forEach(fonction => {
        const cible = normaliserFonctionDirection(fonction);
        const membre = membres.find(item =>
            normaliserFonctionDirection(item.grade2) === cible
        );

        if (membre) {
            grid.appendChild(creerCarteDirection(membre, fonction));
        } else {
            const placeholder = document.createElement("article");
            placeholder.className = "leadership-card leadership-card-missing";
            const role = document.createElement("div");
            role.className = "leadership-role";
            role.textContent = fonction;
            const title = document.createElement("h3");
            title.textContent = "Poste à pourvoir";
            placeholder.append(role, title);
            grid.appendChild(placeholder);
        }
    });
}

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
        /*
         * Lecture dédiée des fonctions dirigeantes.
         * Cette requête ciblée évite qu'un tri ou un filtrage du
         * trombinoscope empêche l'affichage d'un profil dirigeant.
         */
        const { data: directionData, error: directionError } = await supabaseClient
            .from("profiles")
            .select(`
                id, created_at, nom, grade, grade2, image_url, description, region,
                competences, anonyme, facebook_url, x_url, instagram_url,
                youtube_url, tiktok_url, facebook_audience, instagram_audience,
                x_audience, youtube_audience, tiktok_audience, audience_max,
                audience_reseau, audience_updated_at
            `)
            .eq("anonyme", false)
            .in("grade2", FONCTIONS_DIRECTION);

        if (directionError) throw directionError;

        const dirigeants = Array.isArray(directionData) ? directionData : [];
        afficherDirection(dirigeants);

        /*
         * Chargement séparé des autres membres publics.
         */
        const { data, error } = await supabaseClient
            .from("profiles")
            .select(`
                id, created_at, nom, grade, grade2, image_url, description, region,
                competences, anonyme, facebook_url, x_url, instagram_url,
                youtube_url, tiktok_url, facebook_audience, instagram_audience,
                x_audience, youtube_audience, tiktok_audience, audience_max,
                audience_reseau, audience_updated_at
            `)
            .eq("anonyme", false)
            .order("created_at", { ascending: true });

        if (error) throw error;

        const tousLesMembres = Array.isArray(data) ? data : [];
        membres = tousLesMembres;

        const idsDirigeants = new Set(dirigeants.map(membre => membre.id));
        const membresTrombinoscope = tousLesMembres.filter(membre =>
            !idsDirigeants.has(membre.id)
        );

        if (!membresTrombinoscope.length) {
            grid.innerHTML = '<div class="no-members">Aucun autre membre public pour le moment.</div>';
            return;
        }

        grid.innerHTML = "";
        membresTrombinoscope.forEach(membre => {
            grid.appendChild(creerCarteMembre(membre));
        });

    } catch (error) {
        console.error("Erreur chargement trombinoscope ou direction :", error);
        grid.innerHTML = '<div class="no-members">Impossible de charger le trombinoscope.</div>';
    }
}
