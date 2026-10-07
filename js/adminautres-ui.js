/* =========================================================
   AVANT-GARDE — AUTRES PAGES
   Interface éditeur unique
   
   - Un seul éditeur visible à la fois
   - Sélection MANIFESTE / INSPIRATIONS
   - Bandeau technique sticky
   - Enregistrer / Annuler / message en haut
   - Les deux contenus restent présents dans le DOM :
     aucune donnée Supabase n'est supprimée.
========================================================= */

function initialiserInterfaceAutresPages() {

    const tab = document.getElementById("contentOtherTab");
    const editorRoot = tab?.querySelector(".other-content-editor");

    if (!tab || !editorRoot) {
        return;
    }

    if (editorRoot.dataset.singleEditorInitialized === "true") {
        return;
    }

    const manifestSection =
        document.getElementById("manifestWysiwyg")?.closest(".other-content-section");

    const inspirationsSection =
        document.getElementById("inspirationsWysiwyg")?.closest(".other-content-section");

    if (!manifestSection || !inspirationsSection) {
        return;
    }

    const manifestToolbar = document.getElementById("manifestToolbar");
    const inspirationsToolbar = document.getElementById("inspirationsToolbar");

    const manifestSave = document.getElementById("manifestSaveButton");
    const manifestCancel = document.getElementById("manifestCancelButton");
    const manifestMessage = document.getElementById("manifestMessage");

    const inspirationsSave = document.getElementById("inspirationsSaveButton");
    const inspirationsCancel = document.getElementById("inspirationsCancelButton");
    const inspirationsMessage = document.getElementById("inspirationsMessage");

    if (
        !manifestToolbar ||
        !inspirationsToolbar ||
        !manifestSave ||
        !manifestCancel ||
        !manifestMessage ||
        !inspirationsSave ||
        !inspirationsCancel ||
        !inspirationsMessage
    ) {
        return;
    }

    editorRoot.dataset.singleEditorInitialized = "true";

    const style = document.createElement("style");
    style.textContent = `
#contentOtherTab .other-single-editor {
    margin-top:25px;
}

#contentOtherTab .other-editor-control-bar {
    position:sticky;
    top:0;
    z-index:100;
    display:flex;
    align-items:center;
    gap:10px;
    flex-wrap:wrap;
    padding:10px 12px;
    margin-bottom:12px;
    border:1px solid var(--border);
    background:rgba(7,21,45,.97);
    box-shadow:0 6px 18px rgba(0,0,0,.22);
    backdrop-filter:blur(8px);
}

#contentOtherTab .other-editor-control-bar label {
    margin:0;
    color:var(--gold-light);
    font-size:10px;
    font-weight:bold;
    letter-spacing:.08em;
}

#contentOtherTab .other-editor-select {
    width:auto;
    min-width:190px;
    margin:0;
    padding:9px 34px 9px 11px;
    flex:0 0 auto;
}

#contentOtherTab .other-editor-control-actions {
    display:flex;
    align-items:center;
    gap:7px;
    margin-left:auto;
}

#contentOtherTab .other-editor-control-actions button {
    width:auto;
    margin:0;
    padding:9px 13px;
}

#contentOtherTab .other-editor-control-message {
    margin:0 0 0 4px;
    min-height:20px;
    flex:1 1 180px;
}

#contentOtherTab .other-editor-control-message.message {
    margin-top:0;
}

#contentOtherTab .other-single-editor > .other-content-section {
    margin:0;
    padding:0;
    border:0;
    background:transparent;
}

#contentOtherTab .other-single-editor > .other-content-section > .other-content-section-title {
    display:none;
}

#contentOtherTab .other-single-editor .other-content-actions,
#contentOtherTab .other-single-editor .other-content-message {
    display:none !important;
}

#contentOtherTab .other-single-editor .other-content-toolbar {
    margin-bottom:8px;
}

#contentOtherTab .other-single-editor .other-content-wysiwyg {
    min-height:calc(100vh - 300px);
}

#contentOtherTab .other-single-editor .other-content-source {
    min-height:calc(100vh - 300px);
}

#contentOtherTab .other-single-editor .other-content-section[data-other-page-active="false"] {
    display:none;
}

@media (max-width:700px) {
    #contentOtherTab .other-editor-control-actions {
        width:100%;
        margin-left:0;
    }

    #contentOtherTab .other-editor-control-message {
        width:100%;
        flex-basis:100%;
        margin-left:0;
    }

    #contentOtherTab .other-editor-select {
        width:100%;
    }
}
    `;
    document.head.appendChild(style);

    const wrapper = document.createElement("div");
    wrapper.className = "other-single-editor";

    const bar = document.createElement("div");
    bar.className = "other-editor-control-bar";
    bar.setAttribute("role", "toolbar");
    bar.setAttribute("aria-label", "Commandes de l'éditeur");

    const label = document.createElement("label");
    label.htmlFor = "otherPageSelector";
    label.textContent = "PAGE";

    const select = document.createElement("select");
    select.id = "otherPageSelector";
    select.className = "other-editor-select";
    select.innerHTML = `
        <option value="manifeste">MANIFESTE</option>
        <option value="inspirations">INSPIRATIONS</option>
    `;

    const actions = document.createElement("div");
    actions.className = "other-editor-control-actions";

    const message = document.createElement("div");
    message.className = "other-editor-control-message";

    actions.appendChild(manifestSave);
    actions.appendChild(manifestCancel);
    actions.appendChild(inspirationsSave);
    actions.appendChild(inspirationsCancel);
    bar.appendChild(label);
    bar.appendChild(select);
    bar.appendChild(actions);
    bar.appendChild(message);

    wrapper.appendChild(bar);
    wrapper.appendChild(manifestSection);
    wrapper.appendChild(inspirationsSection);

    editorRoot.replaceWith(wrapper);

    const pages = {
        manifeste: {
            section: manifestSection,
            toolbar: manifestToolbar,
            save: manifestSave,
            cancel: manifestCancel,
            message: manifestMessage
        },
        inspirations: {
            section: inspirationsSection,
            toolbar: inspirationsToolbar,
            save: inspirationsSave,
            cancel: inspirationsCancel,
            message: inspirationsMessage
        }
    };

    function afficherPage(slug) {

        const page = pages[slug];

        if (!page) {
            return;
        }

        for (const key of Object.keys(pages)) {
            const current = pages[key];
            const active = key === slug;

            current.section.dataset.otherPageActive = String(active);
            current.toolbar.style.display = active ? "" : "none";
            current.save.style.display = active ? "" : "none";
            current.cancel.style.display = active ? "" : "none";

            if (active) {
                if (current.message.className.includes("visible")) {
                    message.innerHTML = "";
                    message.className = "other-editor-control-message";
                }
                if (current.message.textContent.trim()) {
                    message.textContent = current.message.textContent;
                    message.className =
                        "other-editor-control-message " +
                        current.message.className.replace("message", "").trim();
                }
            }
        }

        select.value = slug;
    }

    select.addEventListener("change", () => {
        afficherPage(select.value);
    });

    for (const slug of Object.keys(pages)) {
        const page = pages[slug];

        const observer = new MutationObserver(() => {
            if (select.value !== slug) {
                return;
            }

            if (page.message.textContent.trim()) {
                message.textContent = page.message.textContent;
                message.className =
                    "other-editor-control-message " +
                    page.message.className.replace("message", "").trim();
            } else {
                message.textContent = "";
                message.className = "other-editor-control-message";
            }
        });

        observer.observe(page.message, {
            childList:true,
            characterData:true,
            attributes:true,
            subtree:true
        });
    }

    afficherPage("manifeste");
}

if (document.readyState === "loading") {
    document.addEventListener(
        "DOMContentLoaded",
        initialiserInterfaceAutresPages,
        { once:true }
    );
} else {
    initialiserInterfaceAutresPages();
}

window.addEventListener(
    "avantgarde:admin-connected",
    () => {
        setTimeout(initialiserInterfaceAutresPages, 0);
    }
);
