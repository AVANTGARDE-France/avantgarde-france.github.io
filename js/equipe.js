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
       PHOTO
    ====================================================== */

    if (
        imageValide(
            membre.image_url
        )
    ) {

        const image =
            document.createElement("img");


        image.className =
            "member-photo";


        image.src =
            membre.image_url;


        image.alt =
            membre.nom ||
            "Membre";


        image.loading =
            "lazy";


        image.onerror =
            function () {

                this.replaceWith(
                    creerPlaceholder(
                        membre
                    )
                );

            };


        card.appendChild(
            image
        );

    } else {

        card.appendChild(
            creerPlaceholder(
                membre
            )
        );

    }


    /* =====================================================
       INFORMATIONS
    ====================================================== */

    const info =
        document.createElement("div");


    info.className =
        "member-info";


    /* NOM */

    const name =
        document.createElement("h3");


    name.className =
        "member-name";


    name.textContent =
        membre.nom ||
        "Membre";


    info.appendChild(
        name
    );


    /* GRADE */

    const grade =
        document.createElement("div");


    grade.className =
        "member-grade";


    grade.textContent =
        membre.grade ||
        "user";


    info.appendChild(
        grade
    );


    /* REGION */

    if (membre.region) {

        const region =
            document.createElement("div");


        region.className =
            "member-region";


        region.textContent =
            membre.region;


        info.appendChild(
            region
        );

    }


    /* DESCRIPTION */

    if (membre.description) {

        const description =
            document.createElement("div");


        description.className =
            "member-description";


        description.textContent =
            membre.description;


        info.appendChild(
            description
        );

    }


    card.appendChild(
        info
    );


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
   CHARGEMENT DES MEMBRES
========================================================= */

async function chargerMembres() {

    const grid =
        document.getElementById(
            "teamGrid"
        );


    if (!grid) {
        return;
    }


    grid.innerHTML = `
        <div class="loading">
            Chargement des membres…
        </div>
    `;


    if (
        typeof supabaseClient ===
            "undefined" ||
        !supabaseClient
    ) {

        grid.innerHTML = `
            <div class="no-members">
                Impossible de contacter la base de données.
            </div>
        `;

        console.error(
            "supabaseClient est introuvable."
        );

        return;

    }


    const {
        data,
        error
    } = await supabaseClient

        .from("profiles")

        .select(`
            id,
            created_at,
            nom,
            grade,
            image_url,
            description,
            region,
            competences,
            anonyme,
            facebook_url,
            x_url,
            instagram_url,
            youtube_url,
            tiktok_url,
            facebook_audience,
            instagram_audience,
            x_audience,
            youtube_audience,
            tiktok_audience,
            audience_max,
            audience_reseau,
            audience_updated_at
        `)

        .eq(
            "anonyme",
            false
        )

        .order(
            "created_at",
            {
                ascending: true
            }
        );


    if (error) {

        console.error(
            "Erreur chargement membres :",
            error
        );


        grid.innerHTML = `
            <div class="no-members">
                Impossible de charger l’équipe.
            </div>
        `;

        return;

    }


    membres =
        Array.isArray(data)
            ? data
            : [];


    if (!membres.length) {

        grid.innerHTML = `
            <div class="no-members">
                Aucun membre public pour le moment.
            </div>
        `;

        return;

    }


    grid.innerHTML = "";


    membres.forEach(
        membre => {

            grid.appendChild(
                creerCarteMembre(
                    membre
                )
            );

        }
    );

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
            membre.grade ||
            "user";

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


        const competencesBrutes =
            normaliserCompetences(
                membre.competences
            );


        /*
         * VIP et Mécène sont des médailles informatives.
         * Ils ne sont jamais traités comme des compétences
         * sélectionnables.
         */

        const liste =
            competencesBrutes.filter(
                competence => {

                    const valeur =
                        String(
                            competence
                        )
                            .trim()
                            .toUpperCase();

                    return (
                        valeur !== "VIP" &&
                        valeur !== "MÉCÈNE" &&
                        valeur !== "MECENE"
                    );

                }
            );


        /* =================================================
           VIP

           Le statut VIP est déterminé automatiquement
           par l'audience maximale.
        ================================================= */

        const audienceMax =
            Number(
                membre.audience_max
            ) || 0;


        if (
            audienceMax >= 3000
        ) {

            liste.unshift(
                "VIP"
            );

        }


        /* =================================================
           MECENE

           Les anciennes données peuvent contenir Mécène
           dans la colonne competences. On le conserve alors
           comme médaille informative.
        ================================================= */

        const estMecene =
            competencesBrutes.some(
                competence => {

                    const valeur =
                        String(
                            competence
                        )
                            .trim()
                            .toUpperCase();

                    return (
                        valeur === "MÉCÈNE" ||
                        valeur === "MECENE"
                    );

                }
            );


        if (estMecene) {

            liste.push(
                "Mécène"
            );

        }


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


                    /* =================================================
                       MEDAILLE VIP
                    ================================================= */

                    if (
                        competence ===
                        "VIP"
                    ) {

                        const medal =
                            document.createElement(
                                "span"
                            );


                        medal.className =
                            "vip-medal";


                        medal.textContent =
                            "★";


                        medal.setAttribute(
                            "aria-hidden",
                            "true"
                        );


                        tag.appendChild(
                            medal
                        );


                        const vipText =
                            document.createElement(
                                "span"
                            );


                        vipText.textContent =
                            "VIP";


                        tag.appendChild(
                            vipText
                        );

                    }


                    /* =================================================
                       MEDAILLE MECENE
                    ================================================= */

                    else if (
                        competence ===
                        "Mécène"
                    ) {

                        const medal =
                            document.createElement(
                                "span"
                            );


                        medal.className =
                            "vip-medal";


                        medal.textContent =
                            "◆";


                        medal.setAttribute(
                            "aria-hidden",
                            "true"
                        );


                        tag.appendChild(
                            medal
                        );


                        const meceneText =
                            document.createElement(
                                "span"
                            );


                        meceneText.textContent =
                            "Mécène";


                        tag.appendChild(
                            meceneText
                        );

                    }


                    /* =================================================
                       COMPETENCE NORMALE
                    ================================================= */

                    else {

                        tag.textContent =
                            competence;

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
