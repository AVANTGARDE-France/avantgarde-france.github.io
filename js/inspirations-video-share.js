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
  if (!response.ok) {
    let detail = "";
    let payload = null;
    try {
      payload = await response.clone().json();
      detail = payload?.error || payload?.message || payload?.detail || payload?.reason || "";
      if (typeof detail !== "string") detail = JSON.stringify(detail);
    } catch (_) {
      try { detail = (await response.text()).slice(0, 1200); } catch (_) {}
    }
    const label = response.status === 422
      ? "GenDownload n'a pas réussi à extraire cette vidéo (HTTP 422)"
      : "GenDownload a répondu HTTP " + response.status;
    throw new Error(label + (detail ? " : " + detail : ".") +
      " La demande envoyée était : " + youtubeUrl);
  }
  const data = await response.json();
  if (!Array.isArray(data.formats)) throw new Error(data.error || data.message || "Aucun format vidéo retourné.");
  const videos = data.formats.filter(f => f?.type === "video" && String(f.ext).toLowerCase() === "mp4" && f.url);
  if (!videos.length) throw new Error("Aucun fichier MP4 proposé par GenDownload.");
  const quality = f => Number((String(f.label || "").match(/(\\d{3,4})p?/i) || [])[1] || 0);
  videos.sort((a,b) => quality(b)-quality(a));
  const format = videos[0];
  return {
    url: new URL(format.url, "https://gendownload.com").href,
    // Nom stable : le titre YouTube n'est pas repris dans le fichier téléchargé.
    filename: "Avantgarde-Video-source.mp4"
  };
}

async function probeNativePlayback(url) {
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";
  video.src = url;
  try {
    await new Promise((resolve, reject) => {
      if (video.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) return resolve();
      const timer = setTimeout(() => reject(new Error("Le lecteur natif n'a pas chargé assez de données en 15 secondes.")), 15000);
      video.addEventListener("canplay", () => { clearTimeout(timer); resolve(); }, { once: true });
      video.addEventListener("error", () => { clearTimeout(timer); reject(new Error("Erreur média native " + (video.error?.code || "inconnue") + ".")); }, { once: true });
      video.load();
    });
    const start = video.currentTime;
    await video.play();
    const deadline = performance.now() + 5000;
    while (video.currentTime - start < 0.75 && performance.now() < deadline) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    const advanced = video.currentTime - start;
    video.pause();
    if (advanced < 0.5) throw new Error("La lecture native n'a avancé que de " + advanced.toFixed(2) + " seconde.");
    return { advanced, width: video.videoWidth, height: video.videoHeight };
  } finally {
    video.pause();
    video.removeAttribute("src");
    video.load();
  }
}

async function exportVideoAwaitingDecodedFrames({ compositionElement, onProgress }) {
  // Utiliser l'export officiel du module elements de WebMotion.
  // Il installe StageLayerPlanner : les <w-video> sont capturés comme calques
  // vivants via wmLiveCanvas(), après wmAwaitFrame(), et non comme DOM statique.
  const elements = await import(WEBMOTION + "/elements?bundle&deps=mp4box@2.4.1");
  if (typeof elements.exportComposition !== "function") {
    throw new Error("L'export officiel exportComposition de WebMotion est indisponible.");
  }
  return await elements.exportComposition(compositionElement, {
    bitrate: 8_000_000,
    onProgress: ({ frame, total }) => {
      const percent = total ? Math.min(100, Math.round(frame / total * 100)) : 0;
      onProgress("Création du MP4 " + percent + " %…");
    }
  });
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
    onProgress("Vérification de la lecture native du MP4…");
    const nativeProbe = await probeNativePlayback(videoSource);
    console.info("[Inspirations vidéo] Lecture native MP4 validée :", nativeProbe);
    const durationFrames = Math.max(1, Math.ceil(metadata.duration * FPS));

    onProgress("Chargement du moteur WebMotion…");
    await Promise.all([
      import(WEBMOTION + "/elements?bundle"),
      import(WEBMOTION + "/video?bundle&deps=mp4box@2.4.1")
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

    // Ne pas surcharger renderFrameAt ni appeler wmApplyFrame manuellement.
    // WebMotion 0.18.2 pilote lui-même le décodage frame-exact de <w-video>
    // pendant composition.export(). Le calque doit simplement rester un enfant
    // direct de stage (contrat documenté de WebMotion pour les vidéos).
    
    // WebMotion 0.18.2 expose wmReady, mais son composant <w-video>
    // absorbe en interne les erreurs de démultiplexage. Vérifier la taille
    // du canvas réellement initialisé : le canvas vierge reste en 300×150.
    onProgress("Analyse du MP4 local (démultiplexage et décodage WebMotion)…");
    await videoLayer.wmReady;
    const liveVideoCanvas = videoLayer.wmLiveCanvas();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const expectedCanvasWidth = Math.round(WIDTH * dpr);
    const expectedCanvasHeight = Math.round(HEIGHT * dpr);
    if (!liveVideoCanvas ||
        liveVideoCanvas.width !== expectedCanvasWidth ||
        liveVideoCanvas.height !== expectedCanvasHeight) {
      throw new Error(
        "WebMotion n'a pas initialisé son décodeur MP4 (canvas vidéo non dimensionné). " +
        "Le module vidéo doit charger MP4Box pour démultiplexer le fichier. " +
        "Vérifie le chargement du module vidéo et la compatibilité du MP4."
      );
    }

    // Le seek déclenche le décodage frame-exact de WebMotion. On attend la
    // promesse du calque après chaque navigation, sans comparer les pixels :
    // deux images légitimement proches ou identiques ne doivent pas bloquer
    // la génération d'une vidéo pourtant décodable.
    await composition.seek(0);
    await videoLayer.wmAwaitFrame();
    const firstFrameContext = liveVideoCanvas.getContext("2d", { willReadFrequently: true });
    if (!firstFrameContext) throw new Error("Canvas du décodeur WebMotion inaccessible.");
    const firstFramePixels = firstFrameContext.getImageData(
      Math.floor(liveVideoCanvas.width / 2),
      Math.floor(liveVideoCanvas.height / 2),
      1, 1
    ).data;
    if (firstFramePixels[3] === 0) {
      throw new Error("WebMotion a créé son canvas, mais n'a pas peint la première image du MP4.");
    }

    const diagnosticFrame = Math.min(30, durationFrames - 1);
    if (diagnosticFrame > 0) {
      await composition.seek(diagnosticFrame);
      await videoLayer.wmAwaitFrame();
    }
    await composition.seek(0);
    await videoLayer.wmAwaitFrame();
    onProgress("Décodage WebMotion validé. Vérification de la composition…");
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

    onProgress("Encodage MP4 : démarrage…");
    const blob = await exportVideoAwaitingDecodedFrames({
      compositionElement: composition,
      onProgress
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
