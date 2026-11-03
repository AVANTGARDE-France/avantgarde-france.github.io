/* =========================================================
   AVANT-GARDE — NOTRE ÉQUIPE
   js/equipe.js

   Logique spécifique à la page équipe.

   IMPORTANT :
   - Header / footer / rendez-vous = components.js
   - Supabase = supabase.js
   - Ce fichier ne gère que la page équipe
========================================================= */


/* =========================================================
   DONNÉES
========================================================= */

let membres = [];


/* =========================================================
   RÉSEAUX SOCIAUX
========================================================= */

const reseauxSociaux = [

    {
        champ: "facebook_url",
        nom: "Facebook",
        logo: "https://cdn.simpleicons.org/facebook/1877F2",
        audienceChamp: "facebook_audience"
    },

    {
        champ: "x_url",
        nom: "X",
        logo: "https://cdn.simpleicons.org/x/FFFFFF",
        audienceChamp: "x_audience"
    },

    {
        champ: "instagram_url",
        nom: "Instagram",
        logo: "https://cdn.simpleicons.org/instagram/E4405F",
        audienceChamp: "instagram_audience"
    },

    {
        champ: "youtube_url",
        nom: "YouTube",
        logo: "https://cdn.simpleicons.org/youtube/FF0000",
        audienceChamp: "youtube_audience"
    },

    {
        champ: "tiktok_url",
        nom: "TikTok",
        logo: "https://cdn.simpleicons.org/tiktok/FFFFFF",
        audienceChamp: "tiktok_audience"
    }

];


/* =========================================================
   OUTILS
========================================================= */

function imageValide(url) {

    if (!url || typeof url !== "string") {
        return false;
    }

    try {

        const parsed = new URL(url);

        return (
            parsed.protocol === "http:" ||
            parsed.protocol === "https:"
        );

    } catch (error) {

        return false;

    }

}


function urlValide(url) {

    if (!url || typeof url !== "string") {
        return false;
    }

    try {

        const parsed = new URL(url);

        return (
            parsed.protocol === "http:" ||
            parsed.protocol === "https:"
        );

    } catch (error) {

        return false;

    }

}


function escapeHtml(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


function normaliserCompetences(value) {

    if (!value) {
        return [];
    }


    if (Array.isArray(value)) {

        return value
            .map(item => String(item).trim())
            .filter(Boolean);

    }


    if (typeof value === "string") {

        const texte = value.trim();

        if (!texte) {
            return [];
        }


        try {

            const parsed = JSON.parse(texte);

            if (Array.isArray(parsed)) {

                return parsed
                    .map(item => String(item).trim())
                    .filter(Boolean);

            }

        } catch (error) {

            // Ce n'est pas du JSON.

        }


        return texte
            .replace(/^\{|\}$/g, "")
            .split(",")
            .map(item =>
                item
                    .trim()
                    .replace(/^"|"$/g, "")
            )
            .filter(Boolean);

    }


    return [];

}


/* =========================================================
   FORMATAGE DES AUDIENCES
========================================================= */

function formaterAudience(valeur) {

    const nombre = Number(valeur);

    if (
        !Number.isFinite(nombre) ||
        nombre < 0
    ) {
        return "0";
    }


    /* =====================================================
       MILLIONS
    ===================================================== */

    if (nombre >= 1000000) {

        const millions =
            nombre / 1000000;


        let texte;


        if (millions >= 100) {

            texte =
                millions.toFixed(0);

        } else {

            texte =
                millions.toFixed(1);

        }


        texte =
            texte
                .replace(".", ",")
                .replace(/,0$/, "");


        return `${texte} M`;

    }


    /* =====================================================
       MILLIERS
    ===================================================== */

    if (nombre >= 1000) {

        const milliers =
            nombre / 1000;


        let texte;


        if (milliers >= 100) {

            texte =
                milliers.toFixed(0);

        } else {

            texte =
                milliers.toFixed(1);

        }


        texte =
            texte
                .replace(".", ",")
                .replace(/,0$/, "");


        return `${texte} k`;

    }


    /* =====================================================
       MOINS DE 1000
    ===================================================== */

    return new Intl.NumberFormat(
        "fr-FR",
        {
            maximumFractionDigits: 0
        }
    ).format(nombre);

}


function obtenirAudience(
    membre,
    reseau
) {

    const valeur = Number(
        membre[reseau.audienceChamp]
    );

    if (
        !Number.isFinite(valeur) ||
        valeur < 0
    ) {
        return 0;
    }

    return valeur;

}


/* =========================================================
   MODALES
========================================================= */

function ouvrirModalEquipe(modal) {

    if (!modal) {
        return;
    }

    modal.classList.add("active");

    modal.setAttribute(
        "aria-hidden",
        "false"
    );

    document.body.style.overflow = "hidden";

}


function fermerModalEquipe(modal) {

    if (!modal) {
        return;
    }

    modal.classList.remove("active");

    modal.setAttribute(
        "aria-hidden",
        "true"
    );


    const autreModalOuvert =
        document.querySelector(
            ".modal.active"
        );

    if (!autreModalOuvert) {

        document.body.style.overflow = "";

    }

}


/* =========================================================
   RÉSEAUX SOCIAUX DU PROFIL
========================================================= */

function afficherReseauxSociaux(membre) {

    const container =
        document.getElementById(
            "profileModalSocials"
        );


    const audienceMaxContainer =
        document.getElementById(
            "profileModalAudienceMax"
        );


    const section =
        document.getElementById(
            "profileSocialSection"
        );


    if (!container) {
        return;
    }


    container.innerHTML = "";


    if (audienceMaxContainer) {

        audienceMaxContainer.innerHTML = "";

        audienceMaxContainer.style.display =
            "none";

    }


    const reseauxDisponibles =
        reseauxSociaux.filter(
            reseau =>
                urlValide(
                    membre[reseau.champ]
                )
        );


    if (!reseauxDisponibles.length) {

        if (section) {
            section.style.display = "none";
        }

        return;

    }


    if (section) {
        section.style.display = "";
    }


    const audiences =
        reseauxDisponibles.map(
            reseau => {

                return {
                    reseau,
                    audience:
                        obtenirAudience(
                            membre,
                            reseau
                        )
                };

            }
        );


    let reseauMax = null;


    /* =====================================================
       RESEAU MAXIMUM ENREGISTRÉ
    ====================================================== */

    if (membre.audience_reseau) {

        const reseauIndique =
            audiences.find(
                item =>
                    String(
                        item.reseau.nom
                    ).toLowerCase() ===
                    String(
                        membre.audience_reseau
                    ).toLowerCase()
            );


        if (
            reseauIndique &&
            reseauIndique.audience > 0
        ) {

            reseauMax =
                reseauIndique;

        }

    }


    /* =====================================================
       SINON CALCUL AUTOMATIQUE
    ====================================================== */

    if (!reseauMax) {

        audiences.forEach(item => {

            if (
                item.audience > 0 &&
                (
                    !reseauMax ||
                    item.audience >
                    reseauMax.audience
                )
            ) {

                reseauMax = item;

            }

        });

    }


    /* =====================================================
       AFFICHAGE DES RÉSEAUX
    ====================================================== */

    audiences.forEach(item => {

        const reseau =
            item.reseau;

        const audience =
            item.audience;


        const isMax =
            Boolean(
                reseauMax &&
                reseauMax.reseau.nom ===
                    reseau.nom &&
                reseauMax.audience > 0
            );


        const itemHtml =
            document.createElement("div");

        itemHtml.className =
            "profile-social-item";


        if (isMax) {

            itemHtml.classList.add(
                "is-max"
            );

        }


        /* =================================================
           LIEN
        ================================================= */

        const lien =
            document.createElement("a");

        lien.className =
            "profile-social-link";

        lien.href =
            membre[reseau.champ];

        lien.target =
            "_blank";

        lien.rel =
            "noopener noreferrer";

        lien.title =
            `${reseau.nom} — ${formaterAudience(audience)} abonnés`;

        lien.setAttribute(
            "aria-label",
            reseau.nom
        );


        /* =================================================
           LOGO
        ================================================= */

        const image =
            document.createElement("img");

        image.src =
            reseau.logo;

        image.alt =
            reseau.nom;

        image.loading =
            "lazy";


        image.onerror =
            function () {

                itemHtml.style.display =
                    "none";

            };


        lien.appendChild(
            image
        );


        /* =================================================
           ÉTOILE — RÉSEAU À PLUS FORTE AUDIENCE

           L'étoile est volontairement placée À L'INTÉRIEUR
           du lien afin qu'elle soit totalement indépendante
           du calcul de largeur de la ligne flex.
        ================================================= */

        if (isMax) {

            const star =
                document.createElement("span");

            star.className =
                "profile-social-max-star";

            star.textContent =
                "★";

            star.title =
                "Audience maximale";

            star.setAttribute(
                "aria-hidden",
                "true"
            );

            star.setAttribute(
                "tabindex",
                "-1"
            );


            lien.appendChild(
                star
            );

        }


        itemHtml.appendChild(
            lien
        );


        /* =================================================
           AUDIENCE
        ================================================= */

        const audienceElement =
            document.createElement("span");

        audienceElement.className =
            "profile-social-audience";

        audienceElement.textContent =
            formaterAudience(
                audience
            );


        audienceElement.title =
            `${new Intl.NumberFormat(
                "fr-FR"
            ).format(audience)} abonnés`;


        itemHtml.appendChild(
            audienceElement
        );


        container.appendChild(
            itemHtml
        );

    });


    /* =====================================================
       AUDIENCE MAX
    ===================================================== */

    let audienceMax = 0;


    const audienceBase =
        Number(
            membre.audience_max
        );


    if (
        Number.isFinite(
            audienceBase
        ) &&
        audienceBase > 0
    ) {

        audienceMax =
            audienceBase;

    }


    if (
        reseauMax &&
        reseauMax.audience >
            audienceMax
    ) {

        audienceMax =
            reseauMax.audience;

    }


    if (
        audienceMaxContainer &&
        audienceMax > 0
    ) {

        let dateTexte = "";


        if (
            membre.audience_updated_at
        ) {

            const date =
                new Date(
                    membre.audience_updated_at
                );


            if (
                !Number.isNaN(
                    date.getTime()
                )
            ) {

                const datePart =
                    date.toLocaleDateString(
                        "fr-FR"
                    );


                const heurePart =
                    date.toLocaleTimeString(
                        "fr-FR",
                        {
                            hour: "2-digit",
                            minute: "2-digit"
                        }
                    );


                dateTexte =
                    ` · mis à jour le ${datePart} à ${heurePart}`;

            }

        }


        audienceMaxContainer.innerHTML =
            `Audience max :
             <strong>
                ${escapeHtml(
                    formaterAudience(
                        audienceMax
                    )
                )} abonnés
             </strong>
             ${
                dateTexte
                    ? `<small>${escapeHtml(dateTexte)}</small>`
                    : ""
             }`;


        audienceMaxContainer.style.display =
            "block";

    }

}


/* =========================================================
   CARTES MEMBRES
========================================================= */

const ICONES_MEDAILLES = {
    "radio-tower": '<path d="M4.9 16.1C1 12.2 1 5.8 4.9 1.9"/><path d="M7.8 4.7a6.14 6.14 0 0 0-.8 7.5"/><circle cx="12" cy="9" r="2"/><path d="M16.2 4.8c2 2 2.26 5.11.8 7.47"/><path d="M19.1 1.9a9.96 9.96 0 0 1 0 14.1"/><path d="M9.5 18h5"/><path d="m8 22 4-11 4 11"/>',
    "handshake": '<path d="m11 17 2 2a1 1 0 1 0 3-3"/><path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4"/><path d="m21 3 1 11h-2"/><path d="M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3"/><path d="M3 4h8"/>',
    "hand-coins": '<path d="M11 15h2a2 2 0 1 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 17"/><path d="m7 21 1.6-1.4c.3-.4.8-.6 1.4-.6h4c1.1 0 2.1-.4 2.8-1.2l4.6-4.4a2 2 0 0 0-2.75-2.91l-4.2 3.9"/><path d="m2 16 6 6"/><path d="M16 6.1a2.9 2.9 0 1 0 0 5.8 2.9 2.9 0 0 0 0-5.8z"/><path d="M6 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"/>',
    "landmark": '<path d="M10 18v-7"/><path d="M11.119 2.205a2 2 0 0 1 1.762 0l7.84 3.846A.5.5 0 0 1 20.5 7h-17a.5.5 0 0 1-.22-.949z"/><path d="M14 18v-7"/><path d="M18 18v-7"/><path d="M3 22h18"/><path d="M6 18v-7"/>',
    "swords": '<path d="m13 19 6-6"/><path d="M14.5 17.5 3.586 6.586A2 2 0 0 1 3 5.172V3h2.172a2 2 0 0 1 1.414.586L17.5 14.5"/><path d="m14.828 6.172 2.586-2.586A2 2 0 0 1 18.828 3H21v2.172a2 2 0 0 1-.586 1.414l-2.586 2.586"/><path d="m16 16 4 4"/><path d="m19 21 2-2"/><path d="m5 14 4 4"/><path d="m5 21-2-2"/><path d="m7.5 16.5-3.5 3.5"/>'
};

function creerIconeMedaille(type) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    svg.classList.add("medal-symbol");
    svg.innerHTML = ICONES_MEDAILLES[type] || "";
    return svg;
}

function obtenirMedailleFonction(membre) {
    const fonction = String(membre?.grade2 || "").trim()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

    if (fonction === "architecte du projet" || fonction === "delegue national") {
        return { key: "fonction-direction", icon: "landmark", label: membre.grade2 };
    }
    if (fonction === "delegue regional" || fonction === "militant") {
        return {
            key: "fonction-terrain",
            icon: "swords",
            label: fonction === "militant" ? "Équipe Militante" : membre.grade2
        };
    }
    return null;
}

function obtenirMedailleDistinctions(membre) {
    const medailles = [];
    const fonction = obtenirMedailleFonction(membre);
    if (fonction) medailles.push(fonction);

    if (Number(membre?.audience_max || 0) >= 3000) {
        medailles.push({ key: "vip", icon: "radio-tower", label: "Influenceur VIP" });
    }
    if (Number(membre?.parrainage || 0) >= 50) {
        medailles.push({ key: "parrainage", icon: "handshake", label: "Parrain / Marraine" });
    }

    const competences = normaliserCompetences(membre?.competences)
        .map(valeur => String(valeur).trim().normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "").toLowerCase());
    if (competences.includes("mecene")) {
        medailles.push({ key: "mecene", icon: "hand-coins", label: "Mécène" });
    }

    return medailles.slice(0, 4);
}

function ajouterMedailleCarte(visual, medailles) {
    if (!medailles.length) return;

    const rail = document.createElement("div");
    rail.className = "member-medals";
    rail.setAttribute("aria-label", "Distinctions du membre");

    medailles.forEach(medaille => {
        const item = document.createElement("span");
        item.className = "member-medal member-medal-" + medaille.key;
        item.title = medaille.label;
        item.setAttribute("aria-label", medaille.label);
        item.appendChild(creerIconeMedaille(medaille.icon));
        rail.appendChild(item);
    });

    visual.appendChild(rail);
}

function creerPlaceholder(
    membre
) {

    const placeholder =
        document.createElement("div");

    placeholder.className =
        "member-photo-placeholder";


    const initiale =
        membre &&
        membre.nom
            ? String(membre.nom)
                .trim()
                .charAt(0)
                .toUpperCase()
            : "★";


    placeholder.textContent =
        initiale || "★";


    return placeholder;

}


function creerCarteMembre(
    membre
) {

    const card =
        document.createElement("article");


    card.className =
        "member-card";


    card.tabIndex =
        0;


    card.setAttribute(
        "role",
        "button"
    );


    card.setAttribute(
        "aria-label",
        `Voir le profil de ${
            membre.nom || "ce membre"
        }`
    );


    /* =====================================================
       VISUEL — PHOTO PLEINE CARTE + INFORMATIONS SUPERPOSÉES
    ====================================================== */

    const visual = document.createElement("div");
    visual.className = "member-visual";

    if (imageValide(membre.image_url)) {
        const image = document.createElement("img");
        image.className = "member-photo";
        image.src = membre.image_url;
        image.alt = membre.nom || "Membre";
        image.loading = "lazy";
        image.onerror = function () {
            this.replaceWith(creerPlaceholder(membre));
        };
        visual.appendChild(image);
    } else {
        visual.appendChild(creerPlaceholder(membre));
    }

    ajouterMedailleCarte(visual, obtenirMedailleDistinctions(membre));

    const info = document.createElement("div");
    info.className = "member-info";

    const name = document.createElement("h3");
    name.className = "member-name";
    name.textContent = membre.nom || "Membre";
    info.appendChild(name);

    const grade = document.createElement("div");
    grade.className = "member-grade";
    grade.textContent = membre.grade || "user";
    info.appendChild(grade);

    if (membre.region) {
        const region = document.createElement("div");
        region.className = "member-region";
        region.textContent = membre.region;
        info.appendChild(region);
    }

    visual.appendChild(info);
    card.appendChild(visual);


    /* =====================================================
       OUVERTURE PROFIL
    ====================================================== */

    card.addEventListener(
        "click",
        () => {

            ouvrirProfil(
                membre
            );

        }
    );


    card.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Enter" ||
                event.key === " "
            ) {

                event.preventDefault();

                ouvrirProfil(
                    membre
                );

            }

        }
    );


    return card;

}


/* =========================================================
   CHARGEMENT DU TROMBINOSCOPE
   Le chargement et le rendu sont isolés dans
   js/equipe-trombinoscope.js.
========================================================= */

async function chargerMembres() {
    if (typeof chargerTrombinoscope === "function") {
        await chargerTrombinoscope();
    }
}


/* =========================================================
   OUVERTURE PROFIL
========================================================= */



function ouvrirProfil(
    membre
) {

    if (!membre) {
        return;
    }


    const modal =
        document.getElementById(
            "memberModal"
        );


    if (!modal) {
        return;
    }


    const image =
        document.getElementById(
            "profileModalImage"
        );


    const placeholder =
        document.getElementById(
            "profilePlaceholder"
        );


    const name =
        document.getElementById(
            "profileModalName"
        );


    const grade =
        document.getElementById(
            "profileModalGrade"
        );

    const points =
        document.getElementById(
            "profileModalPoints"
        );


    const region =
        document.getElementById(
            "profileModalRegion"
        );


    const description =
        document.getElementById(
            "profileModalDescription"
        );


    const competencesContainer =
        document.getElementById(
            "profileModalCompetences"
        );


    const competenceSection =
        document.getElementById(
            "profileCompetenceSection"
        );


    /* =====================================================
       IDENTITE
    ====================================================== */

    if (name) {

        name.textContent =
            membre.nom ||
            "Membre";

    }


    if (grade) {

        grade.textContent =
            membre.grade2 ||
            membre.grade ||
            "user";

    }

    if (points) {
        const totalPoints = Number(membre.point);
        const scoreExact = Number.isFinite(totalPoints) ? totalPoints : 0;
        points.textContent = "Score : " + formaterAudience(scoreExact);
        points.title = "Score : " + scoreExact.toLocaleString("fr-FR");
        points.setAttribute("aria-label", "Score exact : " + scoreExact.toLocaleString("fr-FR"));
    }


    if (region) {

        region.textContent =
            membre.region ||
            "";

    }


    if (description) {

        description.textContent =
            membre.description ||
            "";

    }


    /* =====================================================
       PHOTO
    ====================================================== */

    if (
        image &&
        imageValide(
            membre.image_url
        )
    ) {

        image.src =
            membre.image_url;


        image.alt =
            membre.nom ||
            "Membre";


        image.style.display =
            "block";


        if (placeholder) {

            placeholder.style.display =
                "none";

        }

    } else {

        if (image) {

            image.removeAttribute(
                "src"
            );

            image.style.display =
                "none";

        }


        if (placeholder) {

            placeholder.style.display =
                "flex";


            placeholder.textContent =
                membre.nom
                    ? String(
                        membre.nom
                    )
                        .trim()
                        .charAt(0)
                        .toUpperCase()
                    : "★";

        }

    }


    /* =====================================================
       RESEAUX SOCIAUX
    ====================================================== */

    afficherReseauxSociaux(
        membre
    );


    /* =====================================================
       COMPETENCES
    ====================================================== */

    if (
        competencesContainer
    ) {

        competencesContainer.innerHTML =
            "";


        const competencesBrutes = normaliserCompetences(membre.competences);
        const competencesNormales = competencesBrutes.filter(competence => {
            const valeur = String(competence).trim().normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "").toLowerCase();
            return valeur !== "vip" && valeur !== "mecene";
        });
        const medaillesProfil = obtenirMedailleDistinctions(membre);
        const liste = [
            ...medaillesProfil.map(medaille => medaille.label),
            ...competencesNormales
        ];

        if (!liste.length) {

            const empty =
                document.createElement(
                    "span"
                );


            empty.style.color =
                "#8994a6";


            empty.style.fontFamily =
                "Arial,sans-serif";


            empty.style.fontSize =
                "11px";


            empty.textContent =
                "Aucune compétence renseignée.";


            competencesContainer.appendChild(
                empty
            );


            if (competenceSection) {

                competenceSection.style.display =
                    "";

            }

        } else {

            if (competenceSection) {

                competenceSection.style.display =
                    "";

            }


            liste.forEach(
                competence => {

                    const tag =
                        document.createElement(
                            "span"
                        );


                    tag.className =
                        "competence-tag";


                    const medaille = medaillesProfil.find(item => item.label === competence);
                    if (medaille) {
                        tag.classList.add("competence-medal-tag");
                        const icon = document.createElement("span");
                        icon.className = "competence-medal-icon";
                        icon.appendChild(creerIconeMedaille(medaille.icon));
                        tag.append(icon, document.createTextNode(competence));
                    } else {
                        tag.textContent = competence;
                    }

                    competencesContainer.appendChild(
                        tag
                    );

                }
            );

        }

    }


    /* =====================================================
       OUVERTURE
    ====================================================== */

    ouvrirModalEquipe(
        modal
    );

}


/* =========================================================
   COMPTEUR DESCRIPTION
========================================================= */

function mettreAJourCompteurDescription() {

    const textarea =
        document.getElementById(
            "description"
        );


    const compteur =
        document.getElementById(
            "descriptionCount"
        );


    const counter =
        document.getElementById(
            "descriptionCounter"
        );


    if (
        !textarea ||
        !compteur
    ) {

        return;

    }


    const longueur =
        textarea.value.length;


    compteur.textContent =
        longueur;


    if (counter) {

        counter.classList.remove(
            "warning",
            "limit"
        );


        if (
            longueur >= 300
        ) {

            counter.classList.add(
                "limit"
            );

        } else if (
            longueur >= 270
        ) {

            counter.classList.add(
                "warning"
            );

        }

    }

}


/* =========================================================
   OUVERTURE INSCRIPTION
========================================================= */

function initialiserOuvertureInscription() {

    const bouton =
        document.getElementById(
            "openJoin"
        );


    const modal =
        document.getElementById(
            "joinModal"
        );


    const message =
        document.getElementById(
            "formMessage"
        );


    if (
        !bouton ||
        !modal
    ) {

        return;

    }


    bouton.addEventListener(
        "click",
        () => {

            if (message) {

                message.textContent =
                    "";

                message.className =
                    "form-message";

            }


            mettreAJourCompteurDescription();


            ouvrirModalEquipe(
                modal
            );

        }
    );

}


/* =========================================================
   FERMETURE MODALES
========================================================= */

function initialiserFermetureModales() {

    const memberModal =
        document.getElementById(
            "memberModal"
        );


    const joinModal =
        document.getElementById(
            "joinModal"
        );


    const closeMember =
        document.getElementById(
            "closeMember"
        );


    const closeJoin =
        document.getElementById(
            "closeJoin"
        );


    if (
        closeMember &&
        memberModal
    ) {

        closeMember.addEventListener(
            "click",
            () => {

                fermerModalEquipe(
                    memberModal
                );

            }
        );

    }


    if (
        closeJoin &&
        joinModal
    ) {

        closeJoin.addEventListener(
            "click",
            () => {

                fermerModalEquipe(
                    joinModal
                );

            }
        );

    }


    if (memberModal) {

        memberModal.addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    memberModal
                ) {

                    fermerModalEquipe(
                        memberModal
                    );

                }

            }
        );

    }


    if (joinModal) {

        joinModal.addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    joinModal
                ) {

                    fermerModalEquipe(
                        joinModal
                    );

                }

            }
        );

    }


    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key !==
                "Escape"
            ) {

                return;

            }


            if (
                memberModal &&
                memberModal.classList.contains(
                    "active"
                )
            ) {

                fermerModalEquipe(
                    memberModal
                );

                return;

            }


            if (
                joinModal &&
                joinModal.classList.contains(
                    "active"
                )
            ) {

                fermerModalEquipe(
                    joinModal
                );

            }

        }
    );

}


/* =========================================================
   MESSAGE ERREUR
========================================================= */

function afficherErreurFormulaire(
    element,
    texte
) {

    if (!element) {
        return;
    }


    element.textContent =
        texte;


    element.className =
        "form-message error";

}


/* =========================================================
   FORMULAIRE INSCRIPTION
========================================================= */

function initialiserFormulaireInscription() {

    const form =
        document.getElementById(
            "joinForm"
        );


    if (!form) {
        return;
    }


    form.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            const nomField =
                document.getElementById(
                    "nom"
                );


            const emailField =
                document.getElementById(
                    "email"
                );


            const regionField =
                document.getElementById(
                    "region"
                );


            const imageField =
                document.getElementById(
                    "image_url"
                );


            const descriptionField =
                document.getElementById(
                    "description"
                );


            const submitButton =
                document.getElementById(
                    "submitButton"
                );


            const message =
                document.getElementById(
                    "formMessage"
                );


            const typeInscription =
                document.querySelector(
                    'input[name="type_inscription"]:checked'
                );


            if (
                !nomField ||
                !emailField ||
                !regionField ||
                !descriptionField
            ) {

                return;

            }


            const nom =
                nomField.value.trim();


            const email =
                emailField.value
                    .trim()
                    .toLowerCase();


            const region =
                regionField.value.trim();


            const image_url =
                imageField
                    ? imageField.value.trim()
                    : "";


            const description =
                descriptionField.value.trim();


            const anonyme =
                typeInscription
                    ? typeInscription.value ===
                      "anonyme"
                    : false;


            const competences =
                Array.from(
                    document.querySelectorAll(
                        'input[name="competences"]:checked'
                    )
                )
                .map(
                    input =>
                        input.value
                )
                .filter(
                    value =>
                        value !== "VIP" &&
                        value !== "Mécène"
                )
                .filter(Boolean);


            if (message) {

                message.textContent =
                    "";

                message.className =
                    "form-message";

            }


            /* =================================================
               VALIDATION
            ================================================= */

            if (!nom) {

                afficherErreurFormulaire(
                    message,
                    "Merci d’indiquer votre nom."
                );

                nomField.focus();

                return;

            }


            if (!email) {

                afficherErreurFormulaire(
                    message,
                    "Merci d’indiquer votre adresse email."
                );

                emailField.focus();

                return;

            }


            const emailValide =
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/
                    .test(email);


            if (!emailValide) {

                afficherErreurFormulaire(
                    message,
                    "L’adresse email semble invalide."
                );

                emailField.focus();

                return;

            }


            if (!region) {

                afficherErreurFormulaire(
                    message,
                    "Merci d’indiquer votre région."
                );

                regionField.focus();

                return;

            }


            if (
                description.length >
                300
            ) {

                afficherErreurFormulaire(
                    message,
                    "La présentation ne doit pas dépasser 300 caractères."
                );

                descriptionField.focus();

                return;

            }


            if (
                image_url &&
                !imageValide(
                    image_url
                )
            ) {

                afficherErreurFormulaire(
                    message,
                    "L’URL de la photo semble invalide."
                );

                imageField.focus();

                return;

            }


            if (
                typeof supabaseClient ===
                    "undefined" ||
                !supabaseClient
            ) {

                afficherErreurFormulaire(
                    message,
                    "La connexion à la base de données est indisponible."
                );

                return;

            }


            /* =================================================
               BOUTON
            ================================================= */

            if (submitButton) {

                submitButton.disabled =
                    true;

                submitButton.textContent =
                    "VÉRIFICATION EN COURS…";

            }


            try {

                /* =============================================
                   VERIFICATION EMAIL
                ============================================== */

                const {
                    data: emailExistant,
                    error: emailCheckError
                } = await supabaseClient

                    .from("profiles")

                    .select("id")

                    .ilike(
                        "email",
                        email
                    )

                    .limit(1);


                if (emailCheckError) {

                    throw emailCheckError;

                }


                if (
                    Array.isArray(
                        emailExistant
                    ) &&
                    emailExistant.length >
                        0
                ) {

                    afficherErreurFormulaire(
                        message,
                        "Cette adresse e-mail est déjà utilisée. Un seul profil peut être créé avec cette adresse."
                    );


                    return;

                }


                /* =============================================
                   CREATION
                ============================================== */

                const profil = {

                    id:
                        crypto.randomUUID(),

                    nom:
                        nom,

                    grade:
                        "user",

                    email:
                        email,

                    image_url:
                        image_url ||
                        null,

                    description:
                        description ||
                        null,

                    region:
                        region,

                    competences:
                        competences,

                    anonyme:
                        anonyme

                };


                if (submitButton) {

                    submitButton.textContent =
                        "CRÉATION DU PROFIL…";

                }


                const {
                    error
                } = await supabaseClient

                    .from("profiles")

                    .insert(
                        profil
                    );


                if (error) {

                    console.error(
                        "Erreur création profil :",
                        error
                    );


                    if (
                        error.code ===
                        "23505"
                    ) {

                        afficherErreurFormulaire(
                            message,
                            "Cette adresse e-mail est déjà utilisée. Un seul profil peut être créé avec cette adresse."
                        );

                    } else {

                        afficherErreurFormulaire(
                            message,
                            "Impossible de créer le profil pour le moment. Veuillez réessayer."
                        );

                    }


                    return;

                }


                /* =============================================
                   SUCCES
                ============================================== */

                if (message) {

                    message.className =
                        "form-message success";


                    if (anonyme) {

                        message.textContent =
                            "Votre profil a bien été créé. Il restera caché de la liste publique des membres.";

                    } else {

                        message.textContent =
                            "Votre profil a bien été créé. Il apparaît désormais dans la liste des membres.";

                    }

                }


                form.reset();


                const radioSympathisant =
                    document.querySelector(
                        'input[name="type_inscription"][value="sympathisant"]'
                    );


                if (
                    radioSympathisant
                ) {

                    radioSympathisant.checked =
                        true;

                }


                mettreAJourCompteurDescription();


                setTimeout(
                    () => {

                        const joinModal =
                            document.getElementById(
                                "joinModal"
                            );


                        fermerModalEquipe(
                            joinModal
                        );


                        chargerMembres();

                    },
                    1800
                );


            } catch (error) {

                console.error(
                    "Erreur inscription :",
                    error
                );


                afficherErreurFormulaire(
                    message,
                    "Une erreur est survenue lors de l’inscription. Veuillez réessayer."
                );


            } finally {

                if (submitButton) {

                    submitButton.disabled =
                        false;

                    submitButton.textContent =
                        "CRÉER MON PROFIL";

                }

            }

        }
    );

}


/* =========================================================
   COMPTEUR
========================================================= */

function initialiserCompteurDescription() {

    const textarea =
        document.getElementById(
            "description"
        );


    if (!textarea) {
        return;
    }


    textarea.addEventListener(
        "input",
        mettreAJourCompteurDescription
    );


    mettreAJourCompteurDescription();

}


/* =========================================================
   INITIALISATION
========================================================= */

async function initialiserEquipe() {

    await chargerMembres();

    initialiserOuvertureInscription();

    initialiserFermetureModales();

    initialiserFormulaireInscription();

    initialiserCompteurDescription();

}


/* =========================================================
   DOM READY
========================================================= */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initialiserEquipe
    );

} else {

    initialiserEquipe();

}
