/**
 * ============================================================
 * AVANT-GARDE
 * PUBLICATION AUTOMATIQUE SUPABASE → HTML
 * ============================================================
 *
 * Source :
 *   Supabase / other_contents
 *
 * Pages publiées :
 *   manifeste.html
 *   inspirations.html
 *
 * Principe :
 *
 *   BACK-OFFICE
 *        ↓
 *   SUPABASE
 *        ↓
 *   GÉNÉRATEUR
 *        ↓
 *   HTML STATIQUE
 *        ↓
 *   GITHUB PAGES
 *
 * Le contenu éditorial est donc présent directement
 * dans le HTML envoyé aux robots, moteurs de recherche
 * et systèmes d'IA.
 *
 * Le JavaScript côté visiteur reste uniquement un
 * mécanisme de secours.
 * ============================================================
 */

import fs from "node:fs/promises";
import path from "node:path";


/* ============================================================
   CONFIGURATION
============================================================ */

const SUPABASE_URL = process.env.SUPABASE_URL;

const SUPABASE_PUBLISHABLE_KEY =
    process.env.SUPABASE_PUBLISHABLE_KEY;


const PAGES = [
    {
        slug: "manifeste",
        file: "manifeste.html",
        defaultTitle: "MANIFESTE",
        defaultDescription:
            "Le Manifeste d'Avant-gardE — La France libre."
    },

    {
        slug: "inspirations",
        file: "inspirations.html",
        defaultTitle: "INSPIRATIONS",
        defaultDescription:
            "Les inspirations d'Avant-gardE — La France libre."
    }
];


/* ============================================================
   VÉRIFICATION DES VARIABLES
============================================================ */

if (!SUPABASE_URL) {
    throw new Error(
        "La variable SUPABASE_URL est absente."
    );
}


if (!SUPABASE_PUBLISHABLE_KEY) {
    throw new Error(
        "La variable SUPABASE_PUBLISHABLE_KEY est absente."
    );
}


/* ============================================================
   OUTILS
============================================================ */

function escapeHtml(value = "") {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


function normalizeSupabaseUrl(url) {

    return url.replace(/\/+$/, "");
}


/* ============================================================
   RÉCUPÉRATION SUPABASE
============================================================ */

async function fetchContent(slug) {

    const url =
        `${normalizeSupabaseUrl(SUPABASE_URL)}` +
        `/rest/v1/other_contents` +
        `?select=id,slug,titre,contenu_html,updated_at` +
        `&slug=eq.${encodeURIComponent(slug)}` +
        `&order=id.asc` +
        `&limit=1`;


    const response = await fetch(url, {

        method: "GET",

        headers: {

            "apikey":
                SUPABASE_PUBLISHABLE_KEY,

            "Authorization":
                `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,

            "Accept":
                "application/json"
        }
    });


    if (!response.ok) {

        const body =
            await response.text();

        throw new Error(
            `Erreur Supabase ${response.status} ` +
            `pour "${slug}".\n${body}`
        );
    }


    const rows =
        await response.json();


    if (
        !Array.isArray(rows) ||
        rows.length === 0
    ) {

        throw new Error(
            `Aucun contenu trouvé dans ` +
            `other_contents pour le slug "${slug}".`
        );
    }


    return rows[0];
}


/* ============================================================
   REMPLACEMENT DU CONTENU DE L'ARTICLE
============================================================ */

function replaceEditorialContent(
    html,
    content
) {

    const pattern =
        /(<article\b[^>]*\bid=["']editorialContent["'][^>]*>)[\s\S]*?(<\/article>)/i;


    if (!pattern.test(html)) {

        throw new Error(
            "Impossible de trouver " +
            '<article id="editorialContent">.'
        );
    }


    return html.replace(
        pattern,
        `$1\n\n${content}\n\n$2`
    );
}


/* ============================================================
   REMPLACEMENT DU TITRE <TITLE>
============================================================ */

function replacePageTitle(
    html,
    title
) {

    const safeTitle =
        escapeHtml(title);


    const pattern =
        /<title\b[^>]*>[\s\S]*?<\/title>/i;


    if (!pattern.test(html)) {

        throw new Error(
            "Balise <title> introuvable."
        );
    }


    return html.replace(
        pattern,
        `<title>${safeTitle} — Avant-gardE</title>`
    );
}


/* ============================================================
   REMPLACEMENT DU H1
============================================================ */

function replaceEditorialTitle(
    html,
    title
) {

    const safeTitle =
        escapeHtml(title);


    const pattern =
        /(<h1\b[^>]*\bid=["']editorialTitle["'][^>]*>)[\s\S]*?(<\/h1>)/i;


    if (!pattern.test(html)) {

        throw new Error(
            'Balise <h1 id="editorialTitle"> introuvable.'
        );
    }


    return html.replace(
        pattern,
        `$1\n                ${safeTitle}\n            $2`
    );
}


/* ============================================================
   REMPLACEMENT DE LA DESCRIPTION
============================================================ */

function replaceDescription(
    html,
    description
) {

    const safeDescription =
        escapeHtml(description);


    const pattern =
        /(<meta\b[^>]*name=["']description["'][^>]*content=["'])[^"']*(["'][^>]*>)/i;


    if (!pattern.test(html)) {

        return html;
    }


    return html.replace(
        pattern,
        `$1${safeDescription}$2`
    );
}


/* ============================================================
   PUBLICATION D'UNE PAGE
============================================================ */

async function publishPage(page) {

    console.log("");
    console.log(
        "============================================================"
    );

    console.log(
        `PUBLICATION : ${page.slug}`
    );

    console.log(
        "============================================================"
    );


    const data =
        await fetchContent(page.slug);


    const title =
        String(
            data.titre ||
            page.defaultTitle
        ).trim();


    const content =
        String(
            data.contenu_html ||
            ""
        ).trim();


    if (!content) {

        throw new Error(
            `Le contenu HTML de "${page.slug}" ` +
            `est vide dans Supabase.`
        );
    }


    const description =
        page.defaultDescription;


    const filePath =
        path.resolve(
            process.cwd(),
            page.file
        );


    let html =
        await fs.readFile(
            filePath,
            "utf8"
        );


    const originalHtml =
        html;


    /* --------------------------------------------------------
       INJECTION DU CONTENU SUPABASE
    -------------------------------------------------------- */

    html =
        replaceEditorialContent(
            html,
            content
        );


    /* --------------------------------------------------------
       TITRE DE LA PAGE
    -------------------------------------------------------- */

    html =
        replacePageTitle(
            html,
            title
        );


    /* --------------------------------------------------------
       H1
    -------------------------------------------------------- */

    html =
        replaceEditorialTitle(
            html,
            title
        );


    /* --------------------------------------------------------
       DESCRIPTION
    -------------------------------------------------------- */

    html =
        replaceDescription(
            html,
            description
        );


    /* --------------------------------------------------------
       ÉCRITURE UNIQUEMENT SI NÉCESSAIRE
    -------------------------------------------------------- */

    if (html === originalHtml) {

        console.log(
            "Aucune modification nécessaire."
        );

        console.log(
            `updated_at Supabase : ` +
            `${data.updated_at || "inconnu"}`
        );

        return false;
    }


    await fs.writeFile(
        filePath,
        html,
        "utf8"
    );


    console.log(
        `✓ ${page.file} mis à jour`
    );

    console.log(
        `✓ Titre : ${title}`
    );

    console.log(
        `✓ Contenu injecté depuis Supabase`
    );

    console.log(
        `✓ updated_at : ` +
        `${data.updated_at || "inconnu"}`
    );


    return true;
}


/* ============================================================
   PROGRAMME PRINCIPAL
============================================================ */

async function main() {

    console.log("");
    console.log(
        "AVANT-GARDE"
    );

    console.log(
        "Publication automatique Supabase → HTML"
    );

    console.log("");


    let changed = false;


    for (const page of PAGES) {

        const pageChanged =
            await publishPage(page);


        if (pageChanged) {

            changed = true;
        }
    }


    console.log("");
    console.log(
        "============================================================"
    );


    if (changed) {

        console.log(
            "✓ PUBLICATION TERMINÉE"
        );

        console.log(
            "Des fichiers HTML ont été modifiés."
        );

    } else {

        console.log(
            "✓ PUBLICATION TERMINÉE"
        );

        console.log(
            "Aucune modification détectée."
        );
    }


    console.log(
        "============================================================"
    );

    console.log("");
}


main().catch((error) => {

    console.error("");
    console.error(
        "✗ ERREUR DE PUBLICATION"
    );

    console.error("");

    console.error(
        error.message || error
    );

    console.error("");

    process.exit(1);
});
