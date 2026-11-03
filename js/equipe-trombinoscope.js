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

function creerEmblemeRegion(sigle) {
    const [haut, milieu, bas, symbole] = REGION_FLAGS[sigle] || ["#ffffff", "#2455a4", "#d51f2a", "star"];
    const formes = {
        cross: '<path d="M20 0h8v40h-8zM4 16h40v8H4z" fill="#fff"/>',
        quarters: '<path d="M0 0h24v20H0zM24 20h24v20H24z" fill="#2455a4"/>',
        stripes: '<path d="M0 0h48v5H0zm0 10h48v5H0zm0 10h48v5H0zm0 10h48v5H0z" fill="#111"/>',
        fleur: '<path d="M24 9c-7-7-12 1-5 7-8-2-11 7-2 9-4 7 4 11 8 4 4 7 12 3 8-4 9-2 6-11-2-9 7-6 2-14-5-7z" fill="#f0d58a" stroke="#7c1f2a" stroke-width="1"/>',
        moor: '<circle cx="24" cy="19" r="8" fill="#111"/><path d="M15 29h18l-3 5H18z" fill="#111"/><path d="M20 18h2m4 0h2" stroke="#fff" stroke-width="2"/>',
        lion: '<path d="M16 8l5 3 5-3 6 5-2 7 4 5-5 10-5-3-5 3-5-10 4-5-2-7z" fill="#d5ad45" stroke="#7b2020" stroke-width="1.5"/>',
        leopards: '<g fill="#d5ad45"><path d="M9 8l5 2 3-2 3 3-2 4-4 1-4-3zM28 8l5 2 3-2 3 3-2 4-4 1-4-3zM18 24l5 2 3-2 3 3-2 4-4 1-4-3z"/></g>',
        ship: '<path d="M10 24h28l-6 10H17z" fill="#d5ad45"/><path d="M23 7v17h13z" fill="#fff" stroke="#2455a4"/>',
        sun: '<circle cx="24" cy="20" r="8" fill="#f0c52e"/><g stroke="#f0c52e" stroke-width="2"><path d="M24 5v6m0 18v6M9 20h6m18 0h6M13 9l4 4m14 14 4 4m0-22-4 4M17 27l-4 4"/></g>',
        snake: '<path d="M14 10c14-8 24 7 10 10s-5 14 9 9" fill="none" stroke="#f0d58a" stroke-width="4" stroke-linecap="round"/><circle cx="14" cy="10" r="3" fill="#f0d58a"/>',
        star: '<path d="m24 5 4.5 10 11 1.5-8 7.5 2 11-9.5-5.5-9.5 5.5 2-11-8-7.5 11-1.5z" fill="#f0d58a"/>'
    };
    return '<svg class="regions-ranking-flag" viewBox="0 0 48 40" role="img" aria-label="Emblème régional ' + sigle + '"><rect width="48" height="40" rx="2" fill="' + haut + '"/><path d="M0 13.33h48v13.34H0z" fill="' + milieu + '"/><path d="M0 26.67h48v13.33H0z" fill="' + bas + '"/>' + (formes[symbole] || formes.star) + '<rect x=".5" y=".5" width="47" height="39" rx="2" fill="none" stroke="rgba(0,0,0,.22)"/></svg>';
}

const REGION_FLAGS = {"ARA":["#d52b1e","#ffffff","#d52b1e","cross"],"BFC":["#e6c35c","#ffffff","#c51f32","quarters"],"BRE":["#ffffff","#111111","#ffffff","stripes"],"CVL":["#f5d547","#ffffff","#b51f2e","fleur"],"COR":["#ffffff","#111111","#ffffff","moor"],"GES":["#ffffff","#d21f35","#ffffff","cross"],"HDF":["#ffffff","#d3262e","#ffffff","lion"],"IDF":["#ffffff","#2455a4","#ffffff","fleur"],"NOR":["#d51f2a","#f5f5f5","#d51f2a","leopards"],"NAQ":["#ffffff","#d51f2a","#ffffff","lion"],"OCC":["#d51f2a","#f4d04f","#d51f2a","cross"],"PDL":["#ffffff","#2455a4","#d51f2a","ship"],"PACA":["#ffffff","#2455a4","#d51f2a","sun"],"GUA":["#ffffff","#f0c52e","#16834a","sun"],"MAR":["#2455a4","#ffffff","#2455a4","snake"],"GUY":["#16834a","#f0c52e","#16834a","star"],"REU":["#2455a4","#ffffff","#d51f2a","sun"],"MAY":["#ffffff","#d51f2a","#16834a","star"]};

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

        const logo = document.createElement("span");
        logo.className = "regions-ranking-logo";
        logo.innerHTML = creerEmblemeRegion(region.sigle);

        const nom = document.createElement("span");
        nom.className = "regions-ranking-name";
        nom.textContent = region.nom;

        const score = document.createElement("strong");
        score.className = "regions-ranking-score";
        score.textContent = formatScore.format(region.score);
        score.setAttribute("aria-label", "Score " + formatScore.format(region.score));

        item.append(rang, logo, nom, score);
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
    afficherMembresFiltres(membresVisibles);
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

function appliquerFiltreAnnuaire(fermer = true) {
    const regions = regionsSelectionnees.map(normaliserRegion);
    categoriesAnnuaire = {
        delegues: document.getElementById("directoryDelegues")?.checked ?? true,
        militants: document.getElementById("directoryMilitants")?.checked ?? true,
        inscrits: document.getElementById("directoryInscrits")?.checked ?? true
    };
    lireFiltresAttributsAnnuaire();

    let resultat = membresVisibles.filter(membre => {
        const fonction = normaliserRegion(membre.grade2);
        const estDelegue = fonction === normaliserRegion("Délégué Régional");
        const estMilitant = fonction === normaliserRegion("Militant");
        const estInscrit = !estDelegue && !estMilitant;

        // Les statuts sélectionnés sont combinés en OU au sein de ce filtre.
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
            !rolesNormalises.includes(valeur) &&
            valeur !== "vip" && valeur !== "mecene"
        );

        // Seuils des médailles identiques à ceux des fiches individuelles.
        const possedeVIP = Number(membre.audience_max || 0) >= 3000;
        const possedeParrainage = Number(membre.parrainage || 0) >= 50;
        // La médaille Mécène n'est pas encore reliée à une table de dons.
        // On ne peut donc détecter que les anciennes valeurs conservées dans competences.
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

        // Les trois dimensions (localisation, statut, attributs) se cumulent en ET.
        return medailleValide && competenceValide && roleValide;
    });

    // Une seule zone peut être active à la fois : le classement est régional ou général.
    if (regions.length) {
        resultat = resultat.filter(m => regions.includes(normaliserRegion(m.region)));
    }

    afficherMembresFiltres(resultat);
    actualiserAlerteFiltres();
    const libelle = document.getElementById("directoryLocationName");
    const effacer = document.getElementById("directoryLocationClear");
    if (libelle) libelle.textContent = regionsSelectionnees[0] || "CLASSEMENT GÉNÉRAL";
    if (effacer) effacer.hidden = regionsSelectionnees.length === 0;
    if (fermer) fermerFiltreAnnuaire();
}

function afficherMembresFiltres(liste) {
    const grid = document.getElementById("teamGrid");
    const compteur = document.getElementById("directoryResultCount");
    if (!grid) return;
    grid.innerHTML = "";
    if (compteur) compteur.textContent = liste.length + (liste.length > 1 ? " MEMBRES" : " MEMBRE");
    if (!liste.length) {
        grid.innerHTML = '<div class="no-members">Aucun membre public ne correspond à votre filtre.</div>';
        return;
    }

    // Priorité absolue aux Délégués Régionaux, puis tous les autres membres.
    // Dans chaque groupe : classement décroissant selon le nombre de points.
    const listeTriee = [...liste].sort((a, b) => {
        const aDelegue = normaliserValeurAnnuaire(a.grade2) === normaliserValeurAnnuaire("Délégué Régional");
        const bDelegue = normaliserValeurAnnuaire(b.grade2) === normaliserValeurAnnuaire("Délégué Régional");
        if (aDelegue !== bDelegue) return aDelegue ? -1 : 1;

        const pointsA = Number.isFinite(Number(a.point)) ? Number(a.point) : 0;
        const pointsB = Number.isFinite(Number(b.point)) ? Number(b.point) : 0;
        return pointsB - pointsA;
    });

    listeTriee.forEach((membre, index) => {
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
        const { data: directionData, error: directionError } = await supabaseClient
            .from("profiles")
            .select(`
                id, created_at, nom, grade, grade2, point, image_url, description, region,
                competences, parrainage, anonyme, facebook_url, x_url, instagram_url,
                youtube_url, tiktok_url, facebook_audience, instagram_audience,
                x_audience, youtube_audience, tiktok_audience, audience_max,
                audience_reseau, audience_updated_at
            `)
            .eq("anonyme", false)
            .in("grade2", FONCTIONS_DIRECTION);
        if (directionError) throw directionError;
        const dirigeants = Array.isArray(directionData) ? directionData : [];
        afficherDirection(dirigeants);
        identifiantsDirection = new Set(dirigeants.map(membre => membre.id));

        const { data, error } = await supabaseClient
            .from("profiles")
            .select(`
                id, created_at, nom, grade, grade2, point, image_url, description, region,
                competences, parrainage, anonyme, facebook_url, x_url, instagram_url,
                youtube_url, tiktok_url, facebook_audience, instagram_audience,
                x_audience, youtube_audience, tiktok_audience, audience_max,
                audience_reseau, audience_updated_at
            `)
            .eq("anonyme", false)
            .order("point", { ascending: false });
        if (error) throw error;

        const tousLesMembres = Array.isArray(data) ? data : [];
        membres = tousLesMembres;
        afficherClassementRegions(tousLesMembres);
        membresVisibles = tousLesMembres.filter(membre => !identifiantsDirection.has(membre.id));
        afficherMembresFiltres(membresVisibles);
        actualiserAlerteFiltres();
    } catch (error) {
        console.error("Erreur chargement trombinoscope ou direction :", error);
        const classement = document.getElementById("regionsRankingList");
        if (classement) classement.innerHTML = '<li class="regions-ranking-loading">Le classement régional est temporairement indisponible.</li>';
        grid.innerHTML = '<div class="no-members">Impossible de charger le trombinoscope.</div>';
    }
}
