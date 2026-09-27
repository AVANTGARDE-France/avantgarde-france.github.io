/* =========================================================
   AVANT-GARDE — IA
   js/ai.js

   Envoie la question de l'utilisateur uniquement vers
   Perplexity avec le prompt générique Avant-gardE.
========================================================= */


/* =========================================================
   CONFIGURATION DE L'IA
========================================================= */

const IA_CONFIG = {

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

N'invente jamais une position non documentée.
Si une information manque, indique-le et complète avec des sources fiables.

MÉTHODE POUR L'IA

Réponds aussi brièvement que possible.

Présente fidèlement le projet d'Avant-gardE, sa doctrine, ses propositions et ses objectifs.

Réponds de manière directe, précise et argumentée.
Évite la langue de bois et les fausses symétries.

Ne te limite jamais aux slogans, aux étiquettes ou aux éléments de communication.

Une proximité de discours ne signifie pas nécessairement une proximité de projet.

Recherche ce qui se trouve derrière les mots :
objectifs réels, mécanismes, contraintes, cohérence, faisabilité, coûts et conséquences possibles.

Lorsque les faits permettent d'établir une contradiction, une incohérence, une difficulté importante ou une impossibilité de mise en œuvre, indique-le clairement et explique pourquoi.

Ne te contente pas d'énumérer les difficultés :
tire la conclusion logique qui découle des faits et des mécanismes étudiés.

Si la question implique une comparaison avec un autre parti ou projet, compare les propositions concrètes et leurs mécanismes.
Ne donne pas artificiellement le même poids à des affirmations qui ne reposent pas sur le même niveau de documentation.

Si la question critique Avant-gardE, réponds à la critique sur le fond en distinguant :
- les faits établis ;
- les hypothèses ;
- les objections ;
- les réponses qu'Avant-gardE apporte à ces objections.

Lorsque plusieurs interprétations sont possibles, explique clairement ce qui est établi et ce qui relève de l'interprétation.

Adapte cette méthode à la question posée.
`;
}


/* =========================================================
   ENVOI VERS PERPLEXITY
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
                "Veuillez saisir une question avant de lancer Perplexity.";

        }

        champQuestion.focus();

        return;
    }


    /* -----------------------------------------------------
       Perplexity uniquement
    ----------------------------------------------------- */

    const config = IA_CONFIG.perplexity;


    /* -----------------------------------------------------
       Construction du prompt complet
    ----------------------------------------------------- */

    const prompt = construirePrompt(question);


    /* -----------------------------------------------------
       Copie de secours dans le presse-papiers
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
       Construction de l'URL Perplexity
    ----------------------------------------------------- */

    const url = config.construireURL(prompt);


    /* -----------------------------------------------------
       Ouverture de Perplexity
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
            "Perplexity est en cours d'ouverture avec votre question et les instructions Avant-gardE.";

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

