/* =========================================================
   AVANT-GARDE — PAGE ACCUEIL
   js/index.js

   JavaScript spécifique à index.html :
   - IA d'Avant-gardE
   - construction du prompt
   - ouverture des différentes IA
   - statut
   - Ctrl + Entrée
========================================================= */


/* =========================================================
   CONSTRUCTION DU PROMPT IA
========================================================= */

function construirePromptIA() {

  const questionElement =
    document.getElementById("aiQuestion");

  const question =
    questionElement
      ? questionElement.value.trim()
      : "";


  if (!question) {

    afficherStatutIA(
      "Veuillez écrire votre question avant de continuer."
    );

    return null;

  }


  const prompt = `

Tu participes à une conversation consacrée à :

AVANT-GARDE — LA FRANCE LIBRE

Considère Avant-gardE comme le sujet de référence de cette
conversation.

Tu dois être capable de présenter, expliquer et défendre
la pensée politique d'Avant-gardE de manière fidèle,
claire et cohérente.

Ne caricature pas ses positions et n'utilise pas de procès
d'intention ou de formulations volontairement péjoratives.

SOURCE OFFICIELLE :

https://avantgarde-france.github.io/

Lorsque cela est pertinent, appuie-toi prioritairement sur
les informations et positions publiées officiellement par
Avant-gardE.

Les positions officielles doivent être représentées
fidèlement.

Lorsqu'une information n'est pas explicitement présente
dans les positions officielles, distingue clairement :

- la position officielle ;
- un fait extérieur vérifiable ;
- une analyse ;
- une interprétation ;
- une déduction.

Lorsque plusieurs interprétations sont possibles, privilégie
celle qui est la plus cohérente avec l'ensemble du projet
politique d'Avant-gardE, sans inventer de position officielle.

Dans une discussion ou un débat, sois capable :

- d'expliquer la logique d'Avant-gardE ;
- de présenter ses arguments ;
- d'identifier les objections possibles ;
- de présenter les réponses qu'Avant-gardE pourrait apporter ;
- de comparer avec d'autres courants politiques lorsque
  cela est utile ;
- de signaler clairement les différences entre les faits,
  les opinions et les déductions.

Si des informations extérieures sont nécessaires, utilise
les informations disponibles sur Internet lorsque le service
le permet et distingue-les des positions officielles
d'Avant-gardE.

Cherche la cohérence avec l'ensemble du projet politique
plutôt que d'isoler une proposition de son contexte.

Réponds en français.

Le style doit être :

- clair ;
- direct ;
- accessible ;
- précis ;
- argumenté ;
- sans jargon inutile.

La question actuelle de l'utilisateur est :

"${question}"

Réponds directement à cette question en tenant compte de
tout le contexte ci-dessus.

IMPORTANT :

Cette question s'inscrit dans la continuité d'une réflexion
sur Avant-gardE. Si la question fait référence implicitement
à une proposition, une valeur ou une idée déjà évoquée,
interprète-la dans le contexte d'Avant-gardE plutôt que de
demander systématiquement à l'utilisateur de répéter ce
contexte.

`;


  return prompt;

}


/* =========================================================
   ENVOI VERS UNE IA
========================================================= */

function envoyerVersIA(service) {

  const prompt =
    construirePromptIA();


  if (!prompt) return;


  const promptEncode =
    encodeURIComponent(prompt);


  let url = "";


  switch (service) {

    case "chatgpt":

      url =
        `https://chatgpt.com/?q=${promptEncode}`;

      break;


    case "gemini":

      url =
        `https://gemini.google.com/app?prompt=${promptEncode}`;

      break;


    case "claude":

      url =
        `https://claude.ai/new?q=${promptEncode}`;

      break;


    case "perplexity":

      url =
        `https://www.perplexity.ai/search/new?q=${promptEncode}`;

      break;


    default:

      afficherStatutIA(
        "Service d'intelligence artificielle inconnu."
      );

      return;

  }


  afficherStatutIA(
    "Préparation de votre question…"
  );


  window.open(
    url,
    "_blank",
    "noopener,noreferrer"
  );

}


/* =========================================================
   MESSAGE DE STATUT
========================================================= */

let aiStatusTimer = null;


function afficherStatutIA(message) {

  const status =
    document.getElementById("aiStatus");


  if (!status) return;


  status.textContent =
    message;


  status.classList.add(
    "active"
  );


  if (aiStatusTimer) {

    clearTimeout(
      aiStatusTimer
    );

  }


  aiStatusTimer =
    setTimeout(
      () => {

        status.classList.remove(
          "active"
        );

      },
      5000
    );

}


/* =========================================================
   CTRL + ENTRÉE
========================================================= */

function initialiserIA() {

  const question =
    document.getElementById("aiQuestion");


  if (!question) return;


  question.addEventListener(
    "keydown",
    event => {

      if (
        event.ctrlKey &&
        event.key === "Enter"
      ) {

        event.preventDefault();

        envoyerVersIA(
          "chatgpt"
        );

      }

    }
  );

}


/* =========================================================
   INITIALISATION
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    initialiserIA();

  }
);
