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
   NORMALISATION DU CONTENU ÉDITORIAL
============================================================ */

/*
 * Le contenu historique de Supabase peut contenir plusieurs
 * copies identiques des mêmes blocs <style>. On les conserve
 * une seule fois dans le HTML publié afin d'éviter de gonfler
 * inutilement la page et de rendre son contenu difficile à
 * traiter par les robots et les systèmes d'IA.
 *
 * Les blocs <style> différents sont tous conservés.
 */

function deduplicateStyleBlocks(html) {

    const seen =
        new Set();

    return html.replace(
        /<style\b[^>]*>[\s\S]*?<\/style>/gi,
        (block) => {

            const normalized =
                block.trim();

            if (seen.has(normalized)) {

                return "";

            }

            seen.add(normalized);

            return block;

        }
    );
}


/* ============================================================
   RESSOURCES D'ACCÈS AUX ROBOTS ET AUX IA
============================================================ */

function generateRobotsTxt() {

    return [
        "User-agent: *",
        "Allow: /",
        "",
        "User-agent: GPTBot",
        "Allow: /",
        "",
        "User-agent: ClaudeBot",
        "Allow: /",
        "",
        "User-agent: Google-Extended",
        "Allow: /",
        "",
        "User-agent: PerplexityBot",
        "Allow: /",
        "",
        "User-agent: Applebot-Extended",
        "Allow: /",
        "",
        "Sitemap: https://avantgarde-france.github.io/sitemap.xml",
        ""
    ].join("\n");
}


function generateSitemapXml() {

    return [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        '  <url><loc>https://avantgarde-france.github.io/</loc></url>',
        '  <url><loc>https://avantgarde-france.github.io/manifeste.html</loc></url>',
        '  <url><loc>https://avantgarde-france.github.io/projet.html</loc></url>',
        '  <url><loc>https://avantgarde-france.github.io/inspirations.html</loc></url>',
        '  <url><loc>https://avantgarde-france.github.io/equipe.html</loc></url>',
        '</urlset>',
        ""
    ].join("\n");
}


/*
 * llms.txt fournit une porte d'entrée explicite aux agents IA.
 * Il ne remplace pas le HTML : le manifeste reste entièrement
 * présent dans manifeste.html.
 */

function generateLlmsTxt() {

    return [
        "# Avant-gardE",
        "",
        "> La France libre.",
        "",
        "## Pages principales",
        "",
        "- [Accueil](https://avantgarde-france.github.io/): Présentation d'Avant-gardE.",
        "- [Manifeste](https://avantgarde-france.github.io/manifeste.html): Texte intégral du Manifeste d'Avant-gardE, disponible directement dans le HTML.",
        "- [Projet](https://avantgarde-france.github.io/projet.html): Présentation du projet.",
        "- [Inspirations](https://avantgarde-france.github.io/inspirations.html): Inspirations revendiquées par Avant-gardE.",
        "- [Équipe](https://avantgarde-france.github.io/equipe.html): Présentation de l'équipe.",
        "",
        "## Principe d'accès",
        "",
        "Les pages éditoriales sont publiées en HTML statique afin que leur contenu puisse être lu directement par les moteurs de recherche, robots et systèmes d'IA, sans dépendre d'une exécution JavaScript.",
        ""
    ].join("\n");
}


function generateLlmsFullTxt(manifestHtml) {

    const withoutScripts =
        manifestHtml.replace(
            /<script\b[^>]*>[\s\S]*?<\/script>/gi,
            ""
        );

    const withoutStyles =
        withoutScripts.replace(
            /<style\b[^>]*>[\s\S]*?<\/style>/gi,
            ""
        );

    const text =
        withoutStyles
            .replace(/<br\s*\/?\s*>/gi, "\n")
            .replace(/<\/p>/gi, "\n\n")
            .replace(/<\/h[1-6]>/gi, "\n\n")
            .replace(/<li\b[^>]*>/gi, "- ")
            .replace(/<\/li>/gi, "\n")
            .replace(/<[^>]+>/g, "")
            .replace(/&nbsp;/gi, " ")
            .replace(/&amp;/gi, "&")
            .replace(/&lt;/gi, "<")
            .replace(/&gt;/gi, ">")
            .replace(/&quot;/gi, '"')
            .replace(/&#039;/gi, "'")
            .replace(/\\n[ \\t]+/g, "\n")
            .replace(/[ \\t]{2,}/g, " ")
            .replace(/\\n{3,}/g, "\n\n")
            .trim();

    return [
        "# Manifeste — Avant-gardE",
        "",
        "Source HTML : https://avantgarde-france.github.io/manifeste.html",
        "",
        text,
        ""
    ].join("\n");
}


async function writeDiscoveryFiles(manifestHtml) {

    await fs.writeFile(
        path.resolve(process.cwd(), "robots.txt"),
        generateRobotsTxt(),
        "utf8"
    );

    await fs.writeFile(
        path.resolve(process.cwd(), "sitemap.xml"),
        generateSitemapXml(),
        "utf8"
    );

    await fs.writeFile(
        path.resolve(process.cwd(), "llms.txt"),
        generateLlmsTxt(),
        "utf8"
    );

    await fs.writeFile(
        path.resolve(process.cwd(), "llms-full.txt"),
        generateLlmsFullTxt(manifestHtml),
        "utf8"
    );
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
        (_match, openingTag, closingTag) =>
            `${openingTag}\n\n${content}\n\n${closingTag}`
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

        console.log(
            'ℹ Aucun <h1 id="editorialTitle"> à mettre à jour sur cette page.'
        );

        return html;
    }


    return html.replace(
        pattern,
        (_match, openingTag, closingTag) =>
            `${openingTag}\n                ${safeTitle}\n            ${closingTag}`
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
        deduplicateStyleBlocks(
            String(
                data.contenu_html ||
                ""
            ).trim()
        );


    if (!content) {

        console.warn(
            `⚠ Le contenu HTML de "${page.slug}" est vide dans Supabase. ` +
            `La page existante est conservée et la publication continue.`
        );

        return false;
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


    const manifestPath =
        path.resolve(
            process.cwd(),
            "manifeste.html"
        );

    const manifestHtml =
        await fs.readFile(
            manifestPath,
            "utf8"
        );

    await writeDiscoveryFiles(
        manifestHtml
    );


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
