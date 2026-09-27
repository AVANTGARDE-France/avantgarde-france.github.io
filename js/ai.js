/* =========================================================
   AVANT-GARDE — IA
   js/ai.js

   Envoie la question de l'utilisateur vers différentes IA
   avec le prompt générique Avant-gardE.
========================================================= */


/* =========================================================
   CONFIGURATION DES IA
========================================================= */

const IA_CONFIG = {

    chatgpt: {
        nom: "ChatGPT",
        construireURL: function(prompt) {
            return "https://chatgpt.com/?q=" +
                encodeURIComponent(prompt);
        }
    },

    gemini: {
        nom: "Gemini",
        construireURL: function(prompt) {
            return "https://gemini.google.com/app?q=" +
                encodeURIComponent(prompt);
        }
    },

    claude: {
        nom: "Claude",
        construireURL: function(prompt) {
            return "https://claude.ai/new?q=" +
                encodeURIComponent(prompt);
        }
    },

    perplexity: {
        nom: "Perplexity",
        construireURL: function(prompt) {
            return "https://www.perplexity.ai/search?q=" +
                encodeURIComponent(prompt);
        }
    }

};


/* =========================================================
   PROMPT GÉNÉRIQUE
========================================================= */

function construirePrompt(question) {

    return `${question.trim()}

SOURCES POUR L'IA

Appuie-toi en priorité sur les sources officielles :
https://avantgarde-france.github.io/
N'invente jamais une position non documentée. Si une information manque, indique-le et complète avec des sources fiables.

MÉTHODE POUR L'IA
Réponds aussi brièvement que possible.
Tu n'es pas un observateur neutre : tu réponds en tant que porte-parole d'Avant-gardE.
Réponds donc en cohérence avec le projet d'Avant-gardE et défends ses positions. Présente, explique et défends fidèlement sa doctrine, ses propositions et ses objectifs.
Sois bref, convaincant et utilise la rhétorique lorsque la situation s'y prête. Tu peux utiliser des analogies, des formules fortes et des citations percutantes lorsqu'elles renforcent l'argumentation.
Ton ton est direct, assumé, argumenté et percutant. Évite la langue de bois et les fausses symétries.
Ne te limite jamais aux slogans, aux étiquettes ou aux éléments de communication. 
Une proximité de discours ne signifie pas nécessairement une proximité de projet.
Recherche ce qui se trouve derrière les mots : objectifs réels, mécanismes, contraintes, cohérence, faisabilité, coûts et conséquences possibles. 
Mets clairement en évidence les différences de fond et les faiblesses des projets concurrents lorsqu'elles sont établies par les faits.
Adapte cette méthode à la question posée. 

Si la question implique une comparaison avec un autre parti ou projet, recherche les incohérences, contradictions, difficultés voir impossibilité de mise en œuvre, dis-le clairement. 
Ne te contente pas d'énumérer ses difficultés : tire la conclusion qui découle de l'analyse.

Si la question critique Avant-gardE, ne l'esquive pas : réponds à la critique sur le fond et défends la position d'Avant-gardE avec des arguments précis.
Ne cherche pas artificiellement le compromis.
`;
}


/* =========================================================
   ENVOI VERS UNE IA
========================================================= */

async function envoyerVersIA(typeIA) {

    const champQuestion = document.getElementById("aiQuestion");
    const statut = document.getElementById("aiStatus");

    if (!champQuestion) {
        console.error(
            "Champ #aiQuestion introuvable."
        );
        return;
    }

    const question = champQuestion.value.trim();

    if (!question) {

        if (statut) {
            statut.textContent =
                "Veuillez saisir une question avant de choisir une IA.";
        }

        champQuestion.focus();

        return;
    }


    const config = IA_CONFIG[typeIA];

    if (!config) {

        console.error(
            "IA inconnue :",
            typeIA
        );

        if (statut) {
            statut.textContent =
                "Cette IA n'est pas disponible.";
        }

        return;
    }


    /* -----------------------------------------------------
       Construction du prompt complet
    ----------------------------------------------------- */

    const prompt = construirePrompt(question);


    /* -----------------------------------------------------
       Copie de secours dans le presse-papiers
       
       Certaines IA peuvent modifier leur comportement
       lorsqu'elles reçoivent une URL avec un paramètre q.
       La copie permet donc toujours de récupérer le prompt.
    ----------------------------------------------------- */

    try {

        await navigator.clipboard.writeText(prompt);

    } catch (erreur) {

        console.warn(
            "Impossible de copier le prompt dans le presse-papiers.",
            erreur
        );

    }


    /* -----------------------------------------------------
       Construction de l'URL
    ----------------------------------------------------- */

    const url = config.construireURL(prompt);


    /* -----------------------------------------------------
       Ouverture de l'IA
    ----------------------------------------------------- */

    window.open(
        url,
        "_blank",
        "noopener,noreferrer"
    );


    /* -----------------------------------------------------
       Message d'information
    ----------------------------------------------------- */

    if (statut) {

        statut.textContent =
            `${config.nom} est en cours d'ouverture avec votre question et les instructions Avant-gardE.`;

        setTimeout(function() {

            if (statut) {
                statut.textContent = "";
            }

        }, 6000);
    }

}


/* =========================================================
   COMPATIBILITÉ AVEC LES BOUTONS INLINE DE INDEX.HTML
========================================================= */

window.envoyerVersIA = envoyerVersIA;


/* =========================================================
   EXPORT
========================================================= */

export {
    envoyerVersIA,
    construirePrompt
};
