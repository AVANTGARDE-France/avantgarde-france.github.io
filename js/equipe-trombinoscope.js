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

    const info = document.createElement("div");
    info.className = "leadership-info";

    const role = document.createElement("div");
    role.className = "leadership-role";
    role.textContent = fonction;

    const name = document.createElement("h3");
    name.textContent = membre.nom || "Membre";

    info.append(role, name);

    if (membre.region) {
        const region = document.createElement("p");
        region.className = "leadership-member-region";
        region.textContent = membre.region;
        info.appendChild(region);
    }

    if (membre.description) {
        const description = document.createElement("p");
        description.className = "leadership-member-description";
        description.textContent = membre.description;
        info.appendChild(description);
    }

    if (typeof obtenirMedailleDistinctions === "function" && typeof ajouterMedailleCarte === "function") {
        ajouterMedailleCarte(photoZone, obtenirMedailleDistinctions(membre));
    }

    photoZone.appendChild(info);
    card.appendChild(photoZone);

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


/* =========================================================
   FILTRE DU TROMBINOSCOPE — LOCALISATION
========================================================= */

const REGIONS_METROPOLE = [
    "Auvergne-Rhône-Alpes", "Bourgogne-Franche-Comté", "Bretagne",
    "Centre-Val de Loire", "Corse", "Grand Est", "Hauts-de-France",
    "Île-de-France", "Normandie", "Nouvelle-Aquitaine", "Occitanie",
    "Pays de la Loire", "Provence-Alpes-Côte d’Azur"
];
const REGIONS_OUTREMER = ["Guadeloupe", "Martinique", "Guyane", "La Réunion", "Mayotte"];
const REGIONS_CLASSEMENT = [
    { nom: "Auvergne-Rhône-Alpes", sigle: "ARA", population: 8205557 },
    { nom: "Bourgogne-Franche-Comté", sigle: "BFC", population: 2802670 },
    { nom: "Bretagne", sigle: "BRE", population: 3449370 },
    { nom: "Centre-Val de Loire", sigle: "CVL", population: 2587031 },
    { nom: "Corse", sigle: "COR", population: 355486 },
    { nom: "Grand Est", sigle: "GES", population: 5563378 },
    { nom: "Hauts-de-France", sigle: "HDF", population: 5992194 },
    { nom: "Île-de-France", sigle: "IDF", population: 12463067 },
    { nom: "Normandie", sigle: "NOR", population: 3345842 },
    { nom: "Nouvelle-Aquitaine", sigle: "NAQ", population: 6150451 },
    { nom: "Occitanie", sigle: "OCC", population: 6124653 },
    { nom: "Pays de la Loire", sigle: "PDL", population: 3907156 },
    { nom: "Provence-Alpes-Côte d’Azur", sigle: "PACA", population: 5218960 },
    { nom: "Guadeloupe", sigle: "GUA", population: 384160 },
    { nom: "Martinique", sigle: "MAR", population: 360630 },
    { nom: "Guyane", sigle: "GUY", population: 293996 },
    { nom: "La Réunion", sigle: "REU", population: 889679 },
    { nom: "Mayotte", sigle: "MAY", population: 310563 }
];


function afficherClassementRegions(listeMembres) {
    const liste = document.getElementById("regionsRankingList");
    if (!liste) return;

    const classement = REGIONS_CLASSEMENT.map(region => {
        const membresRegion = (Array.isArray(listeMembres) ? listeMembres : [])
            .filter(membre => normaliserRegion(membre.region) === normaliserRegion(region.nom));
        const totalPoints = membresRegion.reduce((total, membre) => {
            const points = Number(membre.point);
            return total + (Number.isFinite(points) ? points : 0);
        }, 0);
        return {
            ...region,
            totalPoints,
            score: totalPoints / region.population
        };
    }).sort((a, b) => b.score - a.score);

    const formatScore = new Intl.NumberFormat("fr-FR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

    liste.replaceChildren();
    classement.forEach((region, index) => {
        const item = document.createElement("li");
        item.className = "regions-ranking-item";
        item.title = "Total des points : " + region.totalPoints.toLocaleString("fr-FR")
            + " · Population : " + region.population.toLocaleString("fr-FR") + " habitants";

        const rang = document.createElement("span");
        rang.className = "regions-ranking-rank";
        rang.textContent = String(index + 1).padStart(2, "0");

        const nom = document.createElement("span");
        nom.className = "regions-ranking-name";
        nom.textContent = region.nom;

        const score = document.createElement("strong");
        score.className = "regions-ranking-score";
        score.textContent = formatScore.format(region.score);
        score.setAttribute("aria-label", "Score " + formatScore.format(region.score));

        item.append(rang, nom, score);
        liste.appendChild(item);
    });
}

const REGIONS_ETRANGER = [
    "Europe", "Amérique du Nord", "Amérique centrale et Caraïbes",
    "Amérique du Sud", "Afrique", "Asie", "Océanie", "Autre"
];
const ROLES_ANNUAIRE = [
    "Organisateurs de terrain",
    "Conférenciers",
    "Militants"
];
let filtresAttributsAnnuaire = { medailles: [], competences: [], roles: [] };
let regionsSelectionnees = [];
let membresVisibles = [];
let membresPourComptage = [];
let categoriesAnnuaire = { delegues: true, militants: true, inscrits: true };
let identifiantsDirection = new Set();
let cartesChargees = false;

function normaliserRegion(valeur) {
    return String(valeur || "").trim()
        .replace(/[’']/g, "'")
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
}

function normaliserValeurAnnuaire(valeur) {
    return String(valeur || "").trim()
        .replace(/[’']/g, "'")
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
}

function normaliserCompetencesAnnuaire(valeur) {
    if (Array.isArray(valeur)) return valeur.map(item => String(item).trim()).filter(Boolean);
    if (typeof valeur !== "string" || !valeur.trim()) return [];
    try {
        const parsed = JSON.parse(valeur);
        if (Array.isArray(parsed)) return parsed.map(item => String(item).trim()).filter(Boolean);
    } catch (error) {
        // Les anciennes données peuvent être stockées sous forme de liste textuelle.
    }
    return valeur.trim().replace(/^\[|\]$/g, "").split(",")
        .map(item => item.trim().replace(/^"|"$/g, "")).filter(Boolean);
}

function lireFiltresAttributsAnnuaire() {
    const lire = nom => Array.from(document.querySelectorAll(
        'input[name="' + nom + '"]:checked'
    )).map(input => input.value);
    filtresAttributsAnnuaire = {
        medailles: lire("directoryMedals"),
        competences: lire("directorySkills"),
        roles: lire("directoryRoles")
    };
}

function ouvrirFiltreAnnuaire() {
    const modal = document.getElementById("directoryFilterModal");
    if (!modal) return;
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("directory-filter-open");
    chargerCartesRegions();
    actualiserSelectionCarte();
}

function fermerFiltreAnnuaire() {
    const modal = document.getElementById("directoryFilterModal");
    if (!modal) return;
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("directory-filter-open");
}

async function chargerCartesRegions() {
    if (cartesChargees) return;
    const cartes = [
        ["directoryMetropoleMap", "assets/carte-regions-metropole.svg"],
        ["directoryOutremerMap", "assets/carte-regions-outremer.svg"],
        ["directoryWorldMap", "assets/carte-monde.svg"]
    ];
    try {
        for (const [id, url] of cartes) {
            const cible = document.getElementById(id);
            const reponse = await fetch(url);
            if (!reponse.ok) throw new Error("Carte indisponible : " + url);
            cible.innerHTML = await reponse.text();
            cible.querySelectorAll(".region-shape").forEach(zone => {
                zone.setAttribute("tabindex", "0");
                zone.setAttribute("role", "button");
                zone.setAttribute("aria-label", "Sélectionner " + zone.dataset.region);
                zone.addEventListener("click", () => basculerRegion(zone.dataset.region));
                zone.addEventListener("keydown", event => {
                    if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        basculerRegion(zone.dataset.region);
                    }
                });
            });
        }
        cartesChargees = true;
        actualiserSelectionCarte();
    } catch (error) {
        console.error("Erreur chargement des cartes régionales :", error);
        document.querySelectorAll(".directory-map-loading").forEach(el => {
            el.textContent = "La carte n’a pas pu être chargée. Vous pouvez réessayer en rechargeant la page.";
        });
    }
}

function basculerRegion(region) {
    const dejaSelectionnee = regionsSelectionnees.some(item => normaliserRegion(item) === normaliserRegion(region));
    regionsSelectionnees = dejaSelectionnee ? [] : [region];
    actualiserSelectionCarte();
    appliquerFiltreAnnuaire(false);
}

function reinitialiserLocalisationAnnuaire() {
    regionsSelectionnees = [];
    actualiserSelectionCarte();
    appliquerFiltreAnnuaire(false);
}

function nombreFiltresAnnuaireActifs() {
    // Les trois catégories affichées dans la barre de classement ne comptent pas
    // dans l’alerte du bouton : celle-ci concerne uniquement les filtres avancés.
    return document.querySelectorAll(
        'input[name="directoryMedals"]:checked, input[name="directorySkills"]:checked, input[name="directoryRoles"]:checked'
    ).length;
}

function filtresAnnuaireActifs() {
    return nombreFiltresAnnuaireActifs() > 0;
}

function actualiserAlerteFiltres() {
    const alerte = document.getElementById("directoryFilterAlert");
    if (!alerte) return;

    const nombre = nombreFiltresAnnuaireActifs();
    alerte.textContent = nombre;
    alerte.hidden = nombre === 0;
    alerte.setAttribute("aria-label", nombre + (nombre > 1 ? " filtres actifs" : " filtre actif"));
}

function reinitialiserTousFiltresAnnuaire() {
    regionsSelectionnees = [];

    ["directoryDelegues", "directoryMilitants", "directoryInscrits"].forEach(id => {
        const input = document.getElementById(id);
        if (input) input.checked = true;
    });
    document.querySelectorAll(
        'input[name="directoryMedals"], input[name="directorySkills"], input[name="directoryRoles"]'
    ).forEach(input => { input.checked = false; });

    filtresAttributsAnnuaire = { medailles: [], competences: [], roles: [] };
    categoriesAnnuaire = { delegues: true, militants: true, inscrits: true };

    document.querySelectorAll("[data-map-tab]").forEach(tab => {
        const active = tab.dataset.mapTab === "metropole";
        tab.classList.toggle("active", active);
        tab.setAttribute("aria-selected", active ? "true" : "false");
    });
    document.querySelectorAll(".directory-map-panel").forEach(panel => {
        const active = panel.id === "directoryMapMetropole";
        panel.hidden = !active;
        panel.classList.toggle("active", active);
    });

    actualiserSelectionCarte();
    appliquerFiltreAnnuaire(false);
    const libelle = document.getElementById("directoryLocationName");
    const effacer = document.getElementById("directoryLocationClear");
    if (libelle) libelle.textContent = "CLASSEMENT GÉNÉRAL";
    if (effacer) effacer.hidden = true;
    actualiserAlerteFiltres();
}

function actualiserSelectionCarte() {
    document.querySelectorAll(".region-shape").forEach(zone => {
        const selected = regionsSelectionnees.some(region => normaliserRegion(region) === normaliserRegion(zone.dataset.region));
        zone.classList.toggle("selected", selected);
        zone.setAttribute("aria-pressed", selected ? "true" : "false");
    });
    document.querySelectorAll("[data-world-zone]").forEach(button => {
        const selected = regionsSelectionnees.some(region =>
            normaliserRegion(region) === normaliserRegion(button.dataset.worldZone)
        );
        button.classList.toggle("selected", selected);
        button.setAttribute("aria-pressed", selected ? "true" : "false");
    });
    actualiserAlerteFiltres();
}

function filtrerMembresAnnuaire(liste) {
    const regions = regionsSelectionnees.map(normaliserRegion);
    let resultat = (Array.isArray(liste) ? liste : []).filter(membre => {
        const fonction = normaliserRegion(membre.grade2);
        const estDelegue = fonction === normaliserRegion("Délégué Régional");
        const estMilitant = fonction === normaliserRegion("Militant");
        const estInscrit = !estDelegue && !estMilitant;
        const statutValide = (
            (categoriesAnnuaire.delegues && estDelegue) ||
            (categoriesAnnuaire.militants && estMilitant) ||
            (categoriesAnnuaire.inscrits && estInscrit)
        );
        if (!statutValide) return false;

        const competences = normaliserCompetencesAnnuaire(membre.competences);
        const competencesNormalisees = competences.map(normaliserValeurAnnuaire);
        const rolesNormalises = ROLES_ANNUAIRE.map(normaliserValeurAnnuaire);
        const competencesMetier = competencesNormalisees.filter(valeur =>
            !rolesNormalises.includes(valeur) && valeur !== "vip" && valeur !== "mecene"
        );
        const possedeVIP = Number(membre.audience_max || 0) >= 3000;
        const possedeParrainage = Number(membre.parrainage || 0) >= 50;
        const possedeMecene = competencesNormalisees.includes("mecene");
        const medailleValide = !filtresAttributsAnnuaire.medailles.length ||
            filtresAttributsAnnuaire.medailles.some(medaille => {
                const valeur = normaliserValeurAnnuaire(medaille);
                if (valeur === "vip" || valeur === "influenceurs reseaux sociaux") return possedeVIP;
                if (valeur === "parrain/marraine" || valeur === "parrain" || valeur === "marraine") return possedeParrainage;
                if (valeur === "mecene") return possedeMecene;
                return false;
            });
        const competenceValide = !filtresAttributsAnnuaire.competences.length ||
            filtresAttributsAnnuaire.competences.some(competence =>
                competencesMetier.includes(normaliserValeurAnnuaire(competence))
            );
        const roleValide = !filtresAttributsAnnuaire.roles.length ||
            filtresAttributsAnnuaire.roles.some(role =>
                competencesNormalisees.includes(normaliserValeurAnnuaire(role))
            );
        return medailleValide && competenceValide && roleValide;
    });

    if (regions.length) {
        resultat = resultat.filter(membre => regions.includes(normaliserRegion(membre.region)));
    }
    return resultat;
}

function appliquerFiltreAnnuaire(fermer = true) {
    categoriesAnnuaire = {
        delegues: document.getElementById("directoryDelegues")?.checked ?? true,
        militants: document.getElementById("directoryMilitants")?.checked ?? true,
        inscrits: document.getElementById("directoryInscrits")?.checked ?? true
    };
    lireFiltresAttributsAnnuaire();

    const membresPublicsFiltres = filtrerMembresAnnuaire(membresVisibles);
    const profilsPublicsFiltres = filtrerMembresAnnuaire(
        membresPourComptage.filter(membre => membre.anonyme === false)
    );
    const profilsAnonymesFiltres = filtrerMembresAnnuaire(
        membresPourComptage.filter(membre => membre.anonyme === true)
    );
    const statistiques = {
        sympathisants: profilsPublicsFiltres.length,
        anonymes: profilsAnonymesFiltres.length
    };
    statistiques.total = statistiques.sympathisants + statistiques.anonymes;

    afficherMembresFiltres(membresPublicsFiltres, statistiques);
    actualiserAlerteFiltres();
    const libelle = document.getElementById("directoryLocationName");
    const effacer = document.getElementById("directoryLocationClear");
    if (libelle) libelle.textContent = regionsSelectionnees[0] || "CLASSEMENT GÉNÉRAL";
    if (effacer) effacer.hidden = regionsSelectionnees.length === 0;
    if (fermer) fermerFiltreAnnuaire();
}

function afficherMembresFiltres(liste, statistiques = null) {
    const grid = document.getElementById("teamGrid");
    const compteur = document.getElementById("directoryResultCount");
    if (!grid) return;

    const stats = statistiques || {
        sympathisants: Array.isArray(liste) ? liste.length : 0,
        anonymes: 0,
        total: Array.isArray(liste) ? liste.length : 0
    };
    const total = Number(stats.total) || 0;
    const detail = stats.sympathisants.toLocaleString("fr-FR") +
        " sympathisants publics (direction comprise) · " +
        stats.anonymes.toLocaleString("fr-FR") +
        " inscrits anonymes · 300 fiches maximum affichées";

    grid.innerHTML = "";
    if (compteur) {
        compteur.textContent = total.toLocaleString("fr-FR") +
            (total > 1 ? " MEMBRES" : " MEMBRE");
        compteur.title = detail;
        compteur.setAttribute("aria-label",
            total.toLocaleString("fr-FR") + " membres au total. " + detail
        );
    }

    if (!liste.length) {
        grid.innerHTML = stats.anonymes > 0
            ? '<div class="no-members">Aucun profil public à afficher pour ce filtre.</div>'
            : '<div class="no-members">Aucun membre public ne correspond à votre filtre.</div>';
        return;
    }

    const listeTriee = [...liste].sort((a, b) => {
        const aDelegue = normaliserValeurAnnuaire(a.grade2) === normaliserValeurAnnuaire("Délégué Régional");
        const bDelegue = normaliserValeurAnnuaire(b.grade2) === normaliserValeurAnnuaire("Délégué Régional");
        if (aDelegue !== bDelegue) return aDelegue ? -1 : 1;
        const pointsA = Number.isFinite(Number(a.point)) ? Number(a.point) : 0;
        const pointsB = Number.isFinite(Number(b.point)) ? Number(b.point) : 0;
        return pointsB - pointsA;
    });

    // Le compteur reste exhaustif ; seule la génération des cartes est plafonnée.
    listeTriee.slice(0, 300).forEach((membre, index) => {
        const rang = index + 1;
        const carte = creerCarteMembre(membre);
        carte.classList.add(
            rang <= 10 ? "member-card-top10" :
            rang <= 100 ? "member-card-compact" : "member-card-standard"
        );
        carte.dataset.rank = String(rang);
        const numero = document.createElement("span");
        numero.className = "member-rank";
        numero.textContent = String(rang);
        numero.setAttribute("aria-label", "Classement : " + rang);
        carte.prepend(numero);
        grid.appendChild(carte);
    });
}

function initialiserFiltreAnnuaire() {
    document.getElementById("openDirectoryFilter")?.addEventListener("click", ouvrirFiltreAnnuaire);
    document.getElementById("closeDirectoryFilter")?.addEventListener("click", fermerFiltreAnnuaire);
    document.querySelector("[data-close-directory-filter]")?.addEventListener("click", fermerFiltreAnnuaire);
    document.getElementById("directoryLocationClear")?.addEventListener("click", reinitialiserLocalisationAnnuaire);
    document.getElementById("directoryAttributesAll")?.addEventListener("click", () => {
        document.querySelectorAll(
            'input[name="directoryMedals"], input[name="directorySkills"], input[name="directoryRoles"]'
        ).forEach(input => { input.checked = false; });
        lireFiltresAttributsAnnuaire();
    });
    document.getElementById("directoryApply")?.addEventListener("click", appliquerFiltreAnnuaire);
    // Les trois catégories visibles dans la barre appliquent le filtre immédiatement.
    document.querySelectorAll("#directoryDelegues, #directoryMilitants, #directoryInscrits").forEach(input => {
        input.addEventListener("change", () => appliquerFiltreAnnuaire(false));
    });
    // Les filtres avancés conservent leur validation dans la fenêtre dédiée.
    document.querySelectorAll("input[name='directoryMedals'], input[name='directorySkills'], input[name='directoryRoles']").forEach(input => {
        input.addEventListener("change", actualiserAlerteFiltres);
    });
    document.querySelectorAll("[data-world-zone]").forEach(button => {
        button.addEventListener("click", () => basculerRegion(button.dataset.worldZone));
    });
    document.querySelectorAll("[data-map-tab]").forEach(tab => {
        tab.addEventListener("click", () => {
            const cible = tab.dataset.mapTab;
            document.querySelectorAll("[data-map-tab]").forEach(item => {
                const active = item === tab;
                item.classList.toggle("active", active);
                item.setAttribute("aria-selected", active ? "true" : "false");
            });
            document.querySelectorAll(".directory-map-panel").forEach(panel => {
                const idCible = "directoryMap" + cible.charAt(0).toUpperCase() + cible.slice(1);
                panel.hidden = panel.id !== idCible;
                panel.classList.toggle("active", !panel.hidden);
            });
            // Changer d'onglet ne modifie jamais les sélections des autres cartes.
            actualiserSelectionCarte();
        });
    });
    document.addEventListener("keydown", event => {
        if (event.key === "Escape") fermerFiltreAnnuaire();
    });
    actualiserAlerteFiltres();
}

initialiserFiltreAnnuaire();
chargerCartesRegions();

async function chargerProfilsPaginees(selection, anonymes = null) {
    const taillePage = 1000;
    let debut = 0;
    const resultats = [];

    while (true) {
        let requete = supabaseClient
            .from("profiles")
            .select(selection)
            .order("id", { ascending: true })
            .range(debut, debut + taillePage - 1);
        if (typeof anonymes === "boolean") {
            requete = requete.eq("anonyme", anonymes);
        }

        const { data, error } = await requete;
        if (error) throw error;
        const page = Array.isArray(data) ? data : [];
        resultats.push(...page);
        if (page.length < taillePage) break;
        debut += taillePage;
    }
    return resultats;
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
        const colonnesAnnuaire = "id, anonyme, grade2, competences, parrainage, audience_max, region";
        const colonnesPubliques = `
            id, created_at, nom, grade, grade2, point, image_url, description, region,
            competences, parrainage, anonyme, facebook_url, x_url, instagram_url,
            youtube_url, tiktok_url, facebook_audience, instagram_audience,
            x_audience, youtube_audience, tiktok_audience, audience_max,
            audience_reseau, audience_updated_at
        `;

        // Chargement paginé : le compteur n'est pas limité aux 1 000 lignes par défaut.
        const [profilsComptage, tousLesMembres] = await Promise.all([
            chargerProfilsPaginees(colonnesAnnuaire),
            chargerProfilsPaginees(colonnesPubliques, false)
        ]);

        membresPourComptage = profilsComptage;
        membres = tousLesMembres;
        afficherClassementRegions(tousLesMembres);

        const dirigeants = tousLesMembres.filter(membre =>
            FONCTIONS_DIRECTION.some(fonction =>
                normaliserFonctionDirection(membre.grade2) === normaliserFonctionDirection(fonction)
            )
        );
        afficherDirection(dirigeants);
        identifiantsDirection = new Set(dirigeants.map(membre => membre.id));
        membresVisibles = tousLesMembres.filter(membre => !identifiantsDirection.has(membre.id));

        appliquerFiltreAnnuaire(false);
        actualiserAlerteFiltres();
    } catch (error) {
        console.error("Erreur chargement trombinoscope ou direction :", error);
        const classement = document.getElementById("regionsRankingList");
        if (classement) classement.innerHTML = '<li class="regions-ranking-loading">Le classement régional est temporairement indisponible.</li>';
        grid.innerHTML = '<div class="no-members">Impossible de charger le trombinoscope.</div>';
    }
}