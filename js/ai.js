/* =========================================================
   AVANT-GARDE — IA
   js/ai.js

   Envoie la question de l'utilisateur vers ChatGPT
   avec le prompt générique Avant-gardE.
========================================================= */


/* =========================================================
   CONFIGURATION DE L'IA
========================================================= */

const IA_CONFIG = {

    chatgpt: {

        nom: "ChatGPT",

        construireURL: function(prompt) {

            return "https://chatgpt.com/?q=" +
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
Appuie-toi en priorité sur les sources officielles : https://avantgarde-france.github.io/  
N'invente jamais une position non documentée.  
Si une information manque, indique-le et complète avec des sources fiables.  


 
MÉTHODE POUR L'IA  
Réponds aussi brièvement que possible.  
Tu n'es pas un observateur neutre : tu réponds en tant que porte-parole d'Avant-gardE.  
Réponds donc en cohérence avec le projet d'Avant-gardE et défends ses positions.  
Présente, explique et défends fidèlement sa doctrine, ses propositions et ses objectifs.  
Sois bref, convaincant et utilise la rhétorique lorsque la situation s'y prête.  
Tu peux utiliser des analogies, des formules fortes et des citations percutantes lorsqu'elles renforcent l'argumentation.  
Ton ton est direct, assumé, argumenté et percutant.  
Évite la langue de bois et les fausses symétries.  
 
Si la question implique une comparaison avec un autre parti ou projet, recherche les incohérences, contradictions, difficultés voir impossibilité de mise en œuvre du concurrent, dis-le clairement.  
Ne te contente pas d'énumérer ses difficultés : tire la conclusion qui découle de l'analyse.  
Ne te limite jamais aux slogans, aux étiquettes ou aux éléments de communication.  
Une proximité de discours ne signifie pas nécessairement une proximité de projet.  
Recherche ce qui se trouve derrière les mots : objectifs réels, mécanismes, contraintes, cohérence, faisabilité, coûts et conséquences possibles.  
Mets clairement en évidence les différences de fond et les faiblesses des projets concurrents lorsqu'elles sont établies par les faits.  
Adapte cette méthode à la question posée.  
 
Si la question critique Avant-gardE, ne l'esquive pas : réponds à la critique sur le fond et défends la position d'Avant-gardE avec des arguments précis.  
Ne cherche pas artificiellement le compromis.`;
}


/* =========================================================
   ENVOI VERS CHATGPT
========================================================= */

async function envoyerVersIA(typeIA) {

    const champQuestion =
        document.getElementById("aiQuestion");

    const statut =
        document.getElementById("aiStatus");


    /* -----------------------------------------------------
       Vérification du champ
    ----------------------------------------------------- */

    if (!champQuestion) {

        console.error(
            "Champ #aiQuestion introuvable."
        );

        return;
    }


    const question =
        champQuestion.value.trim();


    if (!question) {

        if (statut) {

            statut.textContent =
                "Veuillez saisir une question avant de lancer ChatGPT.";

        }

        champQuestion.focus();

        return;
    }


    /* -----------------------------------------------------
       ChatGPT uniquement
    ----------------------------------------------------- */

    const config =
        IA_CONFIG.chatgpt;


    /* -----------------------------------------------------
       Construction du prompt complet
    ----------------------------------------------------- */

    const prompt =
        construirePrompt(question);


    /* -----------------------------------------------------
       Construction de l'URL ChatGPT
    ----------------------------------------------------- */

    const url =
        config.construireURL(prompt);


    /* -----------------------------------------------------
       Ouverture de ChatGPT
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
            "ChatGPT est en cours d'ouverture avec votre question et les instructions Avant-gardE.";

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

window.envoyerVersIA =
    envoyerVersIA;


/* =========================================================
   EXPORT
========================================================= */

export {
    envoyerVersIA,
    construirePrompt
};
