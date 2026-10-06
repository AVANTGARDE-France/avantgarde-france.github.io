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
   NETTOYAGE DU CONTENU ÉDITORIAL
============================================================ */

/*
 * Le back-office doit enregistrer le contenu éditorial, pas une
 * copie complète de manifeste.html.
 *
 * Si un ancien enregistrement Supabase contient déjà une page
 * complète (article, section, styles, scripts, etc.), on extrait
 * uniquement le premier bloc éditorial utile avant publication.
 *
 * IMPORTANT :
 * Le lecteur audio n'est PAS dans ce contenu. Il appartient au
 * squelette statique de manifeste.html et reste donc totalement
 * indépendant de cette normalisation.
 */

const VOID_ELEMENTS = new Set([
    "area", "base", "br", "col", "embed", "hr", "img", "input",
    "link", "meta", "param", "source", "track", "wbr"
]);

function trouverOuverture(html, tagName, className) {
    const pattern = new RegExp(
        "<" + tagName + "\\b[^>]*\\bclass=[\\\"']([^\\\"']*)[\\\"'][^>]*>",
        "ig"
    );

    let match;

    while ((match = pattern.exec(html)) !== null) {
        const classes = match[1]
            .split(/\\s+/)
            .filter(Boolean);

        if (classes.includes(className)) {
            return {
                index: match.index,
                end: pattern.lastIndex
            };
        }
    }

    return null;
}

function extraireElementEquilibre(html, ouverture) {
    if (!ouverture) return null;

    const ouvertureMatch = html
        .slice(ouverture.index, ouverture.end)
        .match(/^<([a-z0-9]+)/i);

    if (!ouvertureMatch) return null;

    const tagName = ouvertureMatch[1].toLowerCase();

    const tokenPattern =
        /<\\/?([a-z0-9]+)\\b[^>]*>/gi;

    tokenPattern.lastIndex = ouverture.end;

    let depth = 1;
    let match;

    while ((match = tokenPattern.exec(html)) !== null) {
        const token = match[0];
        const tokenTag = match[1].toLowerCase();

        if (tokenTag !== tagName || token.startsWith("<!")) {
            continue;
        }

        if (/^<\\//.test(token)) {
            depth--;

            if (depth === 0) {
                return html.slice(
                    ouverture.index,
                    tokenPattern.lastIndex
                );
            }
        } else if (
            !token.endsWith("/>") &&
            !VOID_ELEMENTS.has(tokenTag)
        ) {
            depth++;
        }
    }

    return null;
}

function extraireInterieurElement(html, id) {
    const pattern = new RegExp(
        "<article\\b[^>]*\\bid=[\\\"']" +
        id +
        "[\\\"'][^>]*>([\\s\\S]*?)<\\/article>",
        "i"
    );

    const match = html.match(pattern);

    return match ? match[1].trim() : null;
}

function extrairePremierStyleApres(html, position) {
    const suite = html.slice(position);

    const match = suite.match(
        /<style\\b[^>]*>[\\s\\S]*?<\\/style>/i
    );

    return match ? match[0].trim() : "";
}

function nettoyerContenuEditorial(html, slug) {
    let source = String(html || "").trim();

    if (!source) return "";

    /*
     * Cas 1 : Supabase contient une ancienne copie complète de
     * l'article. On récupère uniquement son contenu intérieur.
     */
    const articleContent =
        extraireInterieurElement(source, "editorialContent");

    if (articleContent) {
        source = articleContent;
    }

    /*
     * Cas 2 : Supabase contient encore une page complète ou
     * plusieurs copies successives du manifeste.
     *
     * On conserve le premier <section class="manifeste">,
     * qui correspond au contenu éditorial réel, puis uniquement
     * le premier <style> qui le suit.
     */
    const ouvertureManifeste =
        trouverOuverture(
            source,
            "section",
            "manifeste"
        );

    if (ouvertureManifeste) {
        const manifeste =
            extraireElementEquilibre(
                source,
                ouvertureManifeste
            );

        if (manifeste) {
            const finManifeste =
                ouvertureManifeste.index +
                manifeste.length;

            const style =
                extrairePremierStyleApres(
                    source,
                    finManifeste
                );

            source =
                style
                    ? manifeste + "\\n\\n" + style
                    : manifeste;
        }
    }

    /*
     * Sécurité : le contenu éditorial ne doit jamais embarquer
     * le lecteur, les scripts de page, le footer ou les wrappers
     * globaux. Le lecteur reste celui du squelette HTML statique.
     */
    source = source
        .replace(/<script\\b[^>]*>[\\s\\S]*?<\\/script>/gi, "")
        .replace(/<link\\b[^>]*>/gi, "")
        .replace(/<iframe\\b[^>]*>[\\s\\S]*?<\\/iframe>/gi, "")
        .replace(/<div\\b[^>]*\\bid=[\\\"']site-header[\\\"'][^>]*>[\\s\\S]*?<\\/div>/gi, "")
        .replace(/<div\\b[^>]*\\bid=[\\\"']site-footer[\\\"'][^>]*>[\\s\\S]*?<\\/div>/gi, "")
        .replace(/<div\\b[^>]*\\bid=[\\\"']site-rdv-modal[\\\"'][^>]*>[\\s\\S]*?<\\/div>/gi, "")
        .trim();

    /*
     * Les anciennes publications peuvent avoir laissé plusieurs
     * copies exactes du CSS du manifeste. On n'en conserve qu'une.
     */
    source = deduplicateStyleBlocks(source);

    if (slug === "manifeste") {
        console.log(
            "✓ Contenu manifeste normalisé : wrappers/scripts/duplications exclus."
        );
    }

    return source;
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
        /(<meta\b[^>]*name=["']description["'][^>]*content=["'])[^"]*(["'][^>]*>)/i;


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
        nettoyerContenuEditorial(
            String(
                data.contenu_html ||
                ""
            ),
            page.slug
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
