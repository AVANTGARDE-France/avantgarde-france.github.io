/**
 * ============================================================
 * AVANT-GARDE — PUBLICATION AUTOMATIQUE SUPABASE → HTML
 *
 * Source :
 *   Supabase / other_contents
 *
 * Destination :
 *   manifeste.html
 *   inspirations.html
 *
 * Le contenu Supabase est pré-rendu directement dans le HTML.
 * Les robots et IA peuvent donc le lire sans exécuter JavaScript.
 * ============================================================
 */

import fs from "node:fs/promises";
import path from "node:path";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY =
    process.env.SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL) {
    throw new Error("SUPABASE_URL est absent des variables d'environnement.");
}

if (!SUPABASE_PUBLISHABLE_KEY) {
    throw new Error(
        "SUPABASE_PUBLISHABLE_KEY est absent des variables d'environnement."
    );
}

/* ============================================================
   CONFIGURATION
============================================================ */

const PAGES = [
    {
        slug: "manifeste",
        file: "manifeste.html",
    },
    {
        slug: "inspirations",
        file: "inspirations.html",
    },
];

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

function normalizeBaseUrl(url) {
    return url.replace(/\/+$/, "");
}

async function fetchSupabasePage(slug) {
    const url =
        `${normalizeBaseUrl(SUPABASE_URL)}/rest/v1/other_contents` +
        `?select=id,slug,titre,contenu_html,updated_at` +
        `&slug=eq.${encodeURIComponent(slug)}` +
        `&order=id.asc` +
        `&limit=1`;

    const response = await fetch(url, {
        headers: {
            apikey: SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
            Accept: "application/json",
        },
    });

    if (!response.ok) {
        const body = await response.text();

        throw new Error(
            `Supabase a répondu ${response.status} pour "${slug}".\n${body}`
        );
    }

    const rows = await response.json();

    if (!Array.isArray(rows) || rows.length === 0) {
        throw new Error(
            `Aucun contenu Supabase trouvé pour le slug "${slug}".`
        );
    }

    return rows[0];
}

/* ============================================================
   REMPLACEMENT DU CONTENU
============================================================ */

function replaceBetweenMarkers(html, startMarker, endMarker, content) {
    const start = html.indexOf(startMarker);
    const end = html.indexOf(endMarker);

    if (start === -1 || end === -1) {
        throw new Error(
            `Marqueurs introuvables : ${startMarker} / ${endMarker}`
        );
    }

    if (end < start) {
        throw new Error(
            `Ordre incorrect des marqueurs : ${startMarker} / ${endMarker}`
        );
    }

    const contentStart = start + startMarker.length;

    return (
        html.slice(0, contentStart) +
        "\n" +
        content +
        "\n" +
        html.slice(end)
    );
}

function replaceTitle(html, title) {
    const safeTitle = escapeHtml(title);

    return html.replace(
        /<title\b[^>]*>[\s\S]*?<\/title>/i,
        `<title>${safeTitle} — Avant-gardE</title>`
    );
}

function replaceEditorialTitle(html, title) {
    const safeTitle = escapeHtml(title);

    return html.replace(
        /(<h1\b[^>]*id=["']editorialTitle["'][^>]*>)[\s\S]*?(<\/h1>)/i,
        `$1${safeTitle}$2`
    );
}

/* ============================================================
   PUBLICATION D'UNE PAGE
============================================================ */

async function publishPage(page) {
    console.log("");
    console.log("============================================================");
    console.log(`Publication : ${page.slug}`);
    console.log("============================================================");

    const data = await fetchSupabasePage(page.slug);

    const title = String(data.titre || page.slug).trim();
    const content = String(data.contenu_html || "").trim();

    if (!content) {
        throw new Error(
            `Le contenu HTML de "${page.slug}" est vide dans Supabase.`
        );
    }

    const filePath = path.resolve(process.cwd(), page.file);

    let html = await fs.readFile(filePath, "utf8");

    /*
     * Les marqueurs doivent être présents dans le HTML :
     *
     * <!-- SUPABASE:START -->
     *
     * contenu
     *
     * <!-- SUPABASE:END -->
     */

    html = replaceBetweenMarkers(
        html,
        "<!-- SUPABASE:START -->",
        "<!-- SUPABASE:END -->",
        content
    );

    html = replaceTitle(html, title);
    html = replaceEditorialTitle(html, title);

    /*
     * Évite de modifier le fichier si rien n'a changé.
     */

    const previousHtml = await fs.readFile(filePath, "utf8");

    if (html === previousHtml) {
        console.log("Aucune modification nécessaire.");
        console.log(`Source Supabase : ${data.updated_at || "inconnue"}`);
        return false;
    }

    await fs.writeFile(filePath, html, "utf8");

    console.log(`✓ ${page.file} mis à jour`);
    console.log(`  Titre : ${title}`);
    console.log(`  Source : Supabase`);
    console.log(`  updated_at : ${data.updated_at || "inconnu"}`);

    return true;
}

/* ============================================================
   MAIN
============================================================ */

async function main() {
    console.log("");
    console.log("AVANT-GARDE — Publication Supabase → GitHub Pages");
    console.log("");

    let changed = false;

    for (const page of PAGES) {
        const pageChanged = await publishPage(page);

        if (pageChanged) {
            changed = true;
        }
    }

    console.log("");

    if (changed) {
        console.log("✓ Publication terminée : des fichiers ont été modifiés.");
    } else {
        console.log("✓ Publication terminée : aucun changement.");
    }

    console.log("");
}

main().catch((error) => {
    console.error("");
    console.error("✗ ÉCHEC DE LA PUBLICATION");
    console.error("");
    console.error(error);
    console.error("");

    process.exit(1);
});
