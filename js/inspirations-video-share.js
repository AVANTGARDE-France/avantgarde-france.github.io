/* ==========================================================================
   AVANT-GARDE — INSPIRATIONS VIDEO SHARE
   Module autonome de test : MP4 direct OU YouTube via GenDownload.
   Les fichiers sont traités en mémoire dans le navigateur, sans Supabase.
   Utiliser uniquement des vidéos que l'utilisateur possède ou est autorisé
   à télécharger.
   ========================================================================== */
const FPS = 30;
const WIDTH = 1080;
const HEIGHT = 1350;
const WEBMOTION = "https://esm.sh/@superhq/webmotion@0.18.2";
const EXTRACT_API = "https://gendownload.com/api/extract";

async function fetchStage(url, options, stage) {
  try {
    return await fetch(url, options);
  } catch (error) {
    const reason = error?.message || String(error);
    throw new Error(stage + " : échec réseau/CORS (« " + reason + " »). Le navigateur n'a pas reçu de réponse exploitable.");
  }
}

function isYouTubeUrl(value) {
  try {
    const host = new URL(value).hostname.replace(/^www\./i, "").toLowerCase();
    return host === "youtube.com" || host === "m.youtube.com" || host === "youtu.be";
  } catch (_) {
    return false;
  }
}

function isDirectVideo(value) {
  try {
    return /\.(mp4|m4v)(?:$|[?#])/i.test(new URL(value, document.baseURI).href);
  } catch (_) {
    return false;
  }
}

function waitForMetadata(url) {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.crossOrigin = "anonymous";
    const cleanup = () => {
      video.removeEventListener("loadedmetadata", loaded);
      video.removeEventListener("error", failed);
      video.removeAttribute("src");
      video.load();
    };
    const loaded = () => {
      const result = { duration: video.duration, width: video.videoWidth, height: video.videoHeight };
      cleanup();
      if (!Number.isFinite(result.duration) || result.duration <= 0 || !result.width || !result.height) {
        reject(new Error("Durée ou dimensions de la vidéo source indisponibles."));
      } else resolve(result);
    };
    const failed = () => {
      const code = video.error?.code;
      cleanup();
      reject(new Error("Le fichier vidéo récupéré ne peut pas être décodé (erreur média " + (code || "inconnue") + ")."));
    };
    video.addEventListener("loadedmetadata", loaded, { once: true });
    video.addEventListener("error", failed, { once: true });
    video.src = url;
    video.load();
  });
}

export async function prepareYouTubeDownload(youtubeUrl, onProgress = () => {}) {
  onProgress("Extraction de la vidéo YouTube…");
  const response = await fetchStage(EXTRACT_API, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Accept": "application/json" },
    body: JSON.stringify({ url: youtubeUrl })
  }, "Extraction YouTube GenDownload");
  if (!response.ok) throw new Error("GenDownload a répondu HTTP " + response.status + ".");
  const data = await response.json();
  if (!Array.isArray(data.formats)) throw new Error(data.error || data.message || "Aucun format vidéo retourné.");
  const videos = data.formats.filter(f => f?.type === "video" && String(f.ext).toLowerCase() === "mp4" && f.url);
  if (!videos.length) throw new Error("Aucun fichier MP4 proposé par GenDownload.");
  const quality = f => Number((String(f.label || "").match(/(\\d{3,4})p?/i) || [])[1] || 0);
  videos.sort((a,b) => quality(b)-quality(a));
  const format = videos[0];
  return {
    url: new URL(format.url, "https://gendownload.com").href,
    filename: (data.title || "inspiration").replace(/[^a-z0-9-_]+/gi,"-") + ".mp4"
  };
}

export async function generateVideoShare({ source, mediaUrl, sourceFile = null, onProgress = () => {} }) {
  if (!source || !mediaUrl) throw new Error("Carte ou URL source introuvable.");
  if (sourceFile && !(sourceFile instanceof File)) throw new Error("Fichier vidéo local invalide.");
  if (!("VideoEncoder" in window) || !("OffscreenCanvas" in window)) {
    throw new Error("L'export MP4 nécessite un navigateur Chromium récent (WebCodecs), comme Edge ou Chrome.");
  }

  let videoObjectUrl = null;
  let audioObjectUrl = null;
  let composition = null;
  let originalParent = null;
  let originalNext = null;
  let originalStyle = null;
  let originalClass = null;
  let mediaWrap = null;
  let originalMediaStyle = null;
  let transparentLayers = [];
  let hiddenMediaNodes = [];

  try {
    let videoSource = mediaUrl;
    let audioSource = null;

    if (sourceFile) {
      // Le MP4 a déjà été téléchargé par l'utilisateur depuis GenDownload.
      // On le donne directement à WebMotion : l'audio reste dans le MP4.
      videoObjectUrl = URL.createObjectURL(sourceFile);
      videoSource = videoObjectUrl;
    } else if (isYouTubeUrl(mediaUrl)) {
      throw new Error("Télécharge d'abord le MP4 YouTube, puis sélectionne-le avec le bouton Test.");
    } else if (!isDirectVideo(mediaUrl)) {
      throw new Error("La source doit être un MP4 local ou une URL MP4 directe.");
    }

    onProgress("Analyse de la vidéo récupérée…");
    const metadata = await waitForMetadata(videoSource);
    const durationFrames = Math.max(1, Math.ceil(metadata.duration * FPS));

    onProgress("Chargement du moteur WebMotion…");
    await Promise.all([
      import(WEBMOTION + "/elements?bundle"),
      import(WEBMOTION + "/video?bundle")
    ]);

    const rect = source.getBoundingClientRect();
    if (!rect.width || !rect.height) throw new Error("Le recto agrandi de la carte est introuvable.");

    originalParent = source.parentNode;
    originalNext = source.nextSibling;
    originalStyle = source.getAttribute("style");
    originalClass = source.getAttribute("class");
    mediaWrap = source.querySelector(".project-card-image-wrap");
    originalMediaStyle = mediaWrap?.getAttribute("style") ?? null;

    // Le recto agrandi conserve son fond bleu opaque dans le DOM.
    // Dans le rendu vidéo, ce fond recouvrait le calque MP4 placé dessous.
    // On rend transparents uniquement les fonds des conteneurs de carte,
    // sans supprimer les cadres, textes, pseudo-éléments ni décorations.
    const cardRoot = source.querySelector(".project-card");
    const surfaces = [cardRoot, ...source.querySelectorAll(".project-card-inner, .project-card-face, .project-card-front")]
      .filter(Boolean);
    transparentLayers = surfaces.map(el => ({
      el,
      style: el.getAttribute("style")
    }));
    for (const { el } of transparentLayers) {
      el.style.setProperty("background", "transparent", "important");
      el.style.setProperty("background-color", "transparent", "important");
      el.style.setProperty("background-image", "none", "important");
    }

    onProgress("Préparation de la composition vidéo…");
    composition = document.createElement("w-composition");
    composition.setAttribute("width", String(WIDTH));
    composition.setAttribute("height", String(HEIGHT));
    composition.setAttribute("fps", String(FPS));
    composition.setAttribute("duration", String(durationFrames));
    composition.style.cssText = "position:fixed;left:-30000px;top:0;width:1080px;height:1350px;overflow:hidden;pointer-events:none";

    const videoLayer = document.createElement("w-video");
    videoLayer.setAttribute("src", videoSource);
    videoLayer.setAttribute("x", "0");
    videoLayer.setAttribute("y", "0");
    videoLayer.setAttribute("width", String(WIDTH));
    videoLayer.setAttribute("height", String(HEIGHT));
    videoLayer.setAttribute("fit", "cover");
    if (audioSource) videoLayer.setAttribute("muted", "");
    else videoLayer.setAttribute("volume", "1");
    composition.appendChild(videoLayer);

    if (audioSource) {
      const audioLayer = document.createElement("w-audio");
      audioLayer.setAttribute("src", audioSource);
      audioLayer.setAttribute("gain", "1");
      composition.appendChild(audioLayer);
    }

    const overlay = document.createElement("w-el");
    overlay.setAttribute("x", "0");
    overlay.setAttribute("y", "0");
    overlay.setAttribute("width", String(WIDTH));
    overlay.setAttribute("height", String(HEIGHT));
    overlay.style.cssText = "display:block;width:1080px;height:1350px;overflow:hidden";

    const scale = Math.min(WIDTH / rect.width, HEIGHT / rect.height);
    source.style.setProperty("position", "absolute", "important");
    source.style.setProperty("left", ((WIDTH - rect.width * scale) / 2) + "px", "important");
    source.style.setProperty("top", ((HEIGHT - rect.height * scale) / 2) + "px", "important");
    source.style.setProperty("width", rect.width + "px", "important");
    source.style.setProperty("height", rect.height + "px", "important");
    source.style.setProperty("min-width", rect.width + "px", "important");
    source.style.setProperty("min-height", rect.height + "px", "important");
    source.style.setProperty("transform", "scale(" + scale + ")", "important");
    source.style.setProperty("transform-origin", "top left", "important");
    source.style.setProperty("margin", "0", "important");

    // Garder le conteneur et ses dégradés décoratifs, mais masquer toute
    // image/vidéo de prévisualisation qui pourrait recouvrir la vraie vidéo.
    if (mediaWrap) {
      mediaWrap.style.setProperty("background", "transparent", "important");
      mediaWrap.style.setProperty("background-image", "none", "important");
      hiddenMediaNodes = Array.from(mediaWrap.querySelectorAll("img, video, picture, .inspiration-platform-poster-image"))
        .map(el => ({ el, style: el.getAttribute("style"), hidden: el.hidden }));
      for (const item of hiddenMediaNodes) {
        item.el.style.setProperty("visibility", "hidden", "important");
        item.el.style.setProperty("display", "none", "important");
        item.el.hidden = true;
      }
    }
    overlay.appendChild(source);
    composition.appendChild(overlay);
    document.body.appendChild(composition);

    await composition.ready;
    if (document.fonts?.ready) await document.fonts.ready;

    // Garantir que <w-video> soit un calque autonome directement dans la scène.
    // C'est une exigence de WebMotion : imbriqué dans <w-el>, son canvas serait
    // rasterisé comme du DOM et l'animation pourrait se figer sur la vignette.
    if (videoLayer.parentElement !== composition.stage) {
      composition.stage.insertBefore(videoLayer, composition.stage.firstChild);
    }

    // Le moteur appelle normalement wmApplyFrame pendant renderFrameAt.
    // On le relie explicitement au frame clock de l'export également : l'appel
    // est idempotent (WebMotion ignore les timestamps déjà affichés), et le
    // renderer attend ensuite wmAwaitFrame avant de capturer le canvas.
    const nativeRenderFrameAt = composition.renderFrameAt.bind(composition);
    composition.renderFrameAt = frame => {
      nativeRenderFrameAt(frame);
      videoLayer.wmApplyFrame({
        frame,
        globalFrame: frame,
        fps: FPS,
        width: WIDTH,
        height: HEIGHT
      });
    };

    // WebMotion prépare le MP4 source (démultiplexage MP4Box + premier décodage)
    // avant de pouvoir encoder la première image. Ne pas afficher 0 % pendant
    // cette phase : elle peut durer sur un fichier local volumineux.
    onProgress("Analyse du MP4 local (préparation vidéo)…");
    await videoLayer.wmReady;
    const liveVideoCanvas = videoLayer.wmLiveCanvas();
    if (!liveVideoCanvas || !liveVideoCanvas.width || !liveVideoCanvas.height) {
      throw new Error("WebMotion n'a pas créé le calque vidéo animé. Vérifie que le MP4 est compatible H.264.");
    }
    onProgress("Vidéo décodée. Préparation de la piste audio et de l'encodage…");
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

    onProgress("Encodage MP4 : démarrage…");
    const blob = await composition.export({
      onProgress: ({ frame, total }) => {
        const percent = total ? Math.min(100, Math.round(frame / total * 100)) : 0;
        onProgress("Création du MP4 " + percent + " %…");
      }
    });
    if (!(blob instanceof Blob) || blob.size < 10000) {
      throw new Error("WebMotion n'a pas produit de MP4 exploitable.");
    }
    return blob;
  } finally {
    composition?.remove();
    if (originalParent && source.parentNode !== originalParent) {
      if (originalNext && originalNext.parentNode === originalParent) originalParent.insertBefore(source, originalNext);
      else originalParent.appendChild(source);
    }
    if (source) {
      if (originalStyle === null) source.removeAttribute("style");
      else source.setAttribute("style", originalStyle);
      if (originalClass === null) source.removeAttribute("class");
      else source.setAttribute("class", originalClass);
    }
    if (mediaWrap) {
      if (originalMediaStyle === null) mediaWrap.removeAttribute("style");
      else mediaWrap.setAttribute("style", originalMediaStyle);
    }
    for (const item of hiddenMediaNodes) {
      if (item.style === null) item.el.removeAttribute("style");
      else item.el.setAttribute("style", item.style);
      item.el.hidden = item.hidden;
    }
    for (const item of transparentLayers) {
      if (item.style === null) item.el.removeAttribute("style");
      else item.el.setAttribute("style", item.style);
    }
    if (videoObjectUrl) URL.revokeObjectURL(videoObjectUrl);
    if (audioObjectUrl) URL.revokeObjectURL(audioObjectUrl);
  }
}
