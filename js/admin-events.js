/* =========================================================
   AVANT-GARDE — ADMIN EVENTS
   js/admin-events.js

   Gestion des rendez-vous / évènements
========================================================= */


/* =========================================================
   EVENEMENTS
   CLASSEMENT AUTOMATIQUE PAR DATE
========================================================= */

async function chargerRendezVous(){

  if(!peutGererRendezVous()){
    return;
  }


  const eventList =
    document.getElementById("eventList");

  eventList.innerHTML =
    "Chargement…";


  const {
    data,
    error
  } =
    await supabaseClient
      .from("rendezvous")
      .select("*")
      .order(
        "date_evenement",
        {
          ascending:true
        }
      );


  if(error){

    console.error(
      "Erreur RDV :",
      error
    );

    eventList.innerHTML =
      "<div class='message error' style='display:block'>Impossible de charger les évènements.</div>";

    return;
  }


  eventList.innerHTML = "";


  if(!data || data.length === 0){

    eventList.innerHTML =
      "<div style='color:#8994a6;font-family:Arial,sans-serif;font-size:10px;'>Aucun évènement.</div>";

    return;
  }


  data.forEach(event => {

    const card =
      document.createElement("div");

    card.className =
      "event-card";


    const date =
      event.date_evenement
        ? new Date(
            event.date_evenement
          ).toLocaleDateString(
            "fr-FR",
            {
              day:"2-digit",
              month:"2-digit",
              year:"numeric"
            }
          )
        : "";


    card.innerHTML = `
      <div class="event-card-header">

        <div>

          <h3>
            ${escapeHtml(event.titre || "Evènement")}
          </h3>

          <div class="event-card-date">

            ${escapeHtml(date)}

            ${event.heure
              ? " · " + escapeHtml(event.heure)
              : ""}

            ${event.lieu
              ? " · " + escapeHtml(event.lieu)
              : ""}

          </div>

        </div>

        <div
          style="
            color:${event.actif ? '#b9e5c4' : '#ffb5ae'};
            font-family:Arial,sans-serif;
            font-size:8px;
            font-weight:bold;
          "
        >
          ${event.actif ? "ACTIF" : "INACTIF"}
        </div>

      </div>

      <div class="event-card-text">
        ${escapeHtml(event.texte || event.description || "")}
      </div>

      <div class="event-actions">

        <button
          class="edit-button"
          data-id="${event.id}"
        >
          MODIFIER
        </button>

        <button
          class="delete-event-button"
          data-id="${event.id}"
        >
          SUPPRIMER
        </button>

      </div>

    `;


    card
      .querySelector(".edit-button")
      .addEventListener(
        "click",
        () => modifierEvenement(event)
      );


    card
      .querySelector(".delete-event-button")
      .addEventListener(
        "click",
        () => supprimerEvenement(event.id)
      );


    eventList.appendChild(card);

  });

}


/* =========================================================
   MODIFIER EVENEMENT
========================================================= */

function modifierEvenement(event){

  if(!peutGererRendezVous()){
    return;
  }


  document
    .getElementById("eventId")
    .value =
      event.id;


  document
    .getElementById("eventTitle")
    .value =
      event.titre || "";


  document
    .getElementById("eventDate")
    .value =
      event.date_evenement
        ? String(event.date_evenement).substring(0,10)
        : "";


  document
    .getElementById("eventTime")
    .value =
      event.heure || "";


  document
    .getElementById("eventPlace")
    .value =
      event.lieu || "";


  document
    .getElementById("eventText")
    .value =
      event.texte ||
      event.description ||
      "";


  document
    .getElementById("eventLink")
    .value =
      event.lien || "";


  document
    .getElementById("eventActive")
    .checked =
      event.actif !== false;


  document
    .getElementById("eventSubmitButton")
    .textContent =
      "ENREGISTRER LA MODIFICATION";


  document
    .getElementById("eventCancelButton")
    .style.display =
      "block";


  document
    .getElementById("rdvTab")
    .scrollIntoView({
      behavior:"smooth"
    });

}


/* =========================================================
   RESET EVENEMENT
========================================================= */

document
  .getElementById("eventCancelButton")
  .addEventListener(
    "click",
    resetEventForm
  );


function resetEventForm(){

  document
    .getElementById("eventForm")
    .reset();


  document
    .getElementById("eventId")
    .value = "";


  document
    .getElementById("eventActive")
    .checked = true;


  document
    .getElementById("eventSubmitButton")
    .textContent =
      "AJOUTER L'ÉVÈNEMENT";


  document
    .getElementById("eventCancelButton")
    .style.display =
      "none";


  viderMessage(
    document.getElementById("eventMessage")
  );

}


/* =========================================================
   AJOUT / MODIFICATION EVENEMENT
========================================================= */

document
  .getElementById("eventForm")
  .addEventListener(
    "submit",
    async event => {

      event.preventDefault();


      if(!peutGererRendezVous()){
        return;
      }


      const message =
        document.getElementById("eventMessage");


      viderMessage(message);


      const id =
        document
          .getElementById("eventId")
          .value;


      const payload = {

        titre:
          document
            .getElementById("eventTitle")
            .value
            .trim(),

        texte:
          document
            .getElementById("eventText")
            .value
            .trim(),

        date_evenement:
          document
            .getElementById("eventDate")
            .value,

        heure:
          document
            .getElementById("eventTime")
            .value
            .trim(),

        lieu:
          document
            .getElementById("eventPlace")
            .value
            .trim(),

        lien:
          document
            .getElementById("eventLink")
            .value
            .trim(),

        actif:
          document
            .getElementById("eventActive")
            .checked

      };


      let result;


      if(id){

        result =
          await supabaseClient
            .from("rendezvous")
            .update(payload)
            .eq("id",id);

      }else{

        result =
          await supabaseClient
            .from("rendezvous")
            .insert(payload);

      }


      if(result.error){

        console.error(
          "Erreur évènement :",
          result.error
        );


        afficherMessage(
          message,
          "error",
          "Impossible d'enregistrer l'évènement."
        );

        return;
      }


      afficherMessage(
        message,
        "success",
        id
          ? "L’évènement a été modifié."
          : "L’évènement a été ajouté."
      );


      resetEventForm();

      chargerRendezVous();

    }
  );


/* =========================================================
   SUPPRIMER EVENEMENT
========================================================= */

async function supprimerEvenement(id){

  if(!peutGererRendezVous()){
    return;
  }


  if(
    !confirm(
      "Supprimer définitivement cet évènement ?"
    )
  ){
    return;
  }


  const {error} =
    await supabaseClient
      .from("rendezvous")
      .delete()
      .eq("id",id);


  if(error){

    console.error(
      "Erreur suppression évènement :",
      error
    );


    alert(
      "Impossible de supprimer l’évènement."
    );

    return;
  }


  chargerRendezVous();

}
