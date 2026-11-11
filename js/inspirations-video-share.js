/* ==========================================================================
   AVANT-GARDE — INSPIRATIONS VIDEO SHARE
   Export MP4 vidéo intégrale + audio avec WebMotion.
   Module appelé uniquement pour les cartes dont la source est un fichier vidéo.
   Le moteur photo/GIF et le parcours de partage existant restent séparés.
   ========================================================================== */
const FPS = 30;
const WIDTH = 1080;
const HEIGHT = 1350;
const WEBMOTION = "https://esm.sh/@superhq/webmotion@0.18.2";

function waitForMetadata(url) {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.crossOrigin = "anonymous";
    video.muted = true;
    const cleanup = () => {
      video.removeEventListener("loadedmetadata", loaded);
      video.removeEventListener("error", failed);
      video.removeAttribute("src");
      video.load();
    };
    const loaded = () => {
      const duration = video.duration;
      const width = video.videoWidth;
      const height = video.videoHeight;
      cleanup();
      if (!Number.isFinite(duration) || duration <= 0 || !width || !height) {
        reject(new Error("Durée ou dimensions de la vidéo source indisponibles."));
        return;
      }
      resolve({ duration, width, height });
    };
    const failed = () => {
      const error = video.error;
      cleanup();
      reject(new Error("La vidéo source ne peut pas être chargée. Vérifie son URL et les autorisations CORS de son hébergement." + (error?.message ? " " + error.message : "")));
    };
    video.addEventListener("loadedmetadata", loaded, { once: true });
    video.addEventListener("error", failed, { once: true });
    video.src = url;
    video.load();
  });
}

function isDirectVideo(url) {
  try {
    return /\.(mp4|m4v)(?:$|[?#])/i.test(new URL(url, document.baseURI).href);
  } catch (_) {
    return false;
  }
}

export async function generateVideoShare({ source, mediaUrl, onProgress = () => {} }) {
  if (!source || !mediaUrl) throw new Error("Source vidéo introuvable.");
  if (!isDirectVideo(mediaUrl)) {
    throw new Error("Pour exporter une carte YouTube, il faut disposer du fichier vidéo MP4 original. Le lecteur YouTube intégré ne donne pas accès au flux vidéo complet pour un export WebMotion.");
  }
  if (!("VideoEncoder" in window) || !("OffscreenCanvas" in window)) {
    throw new Error("L’export MP4 WebMotion nécessite un navigateur Chromium récent (WebCodecs).");
  }

  onProgress("Analyse de la vidéo source…");
  const metadata = await waitForMetadata(mediaUrl);
  const durationFrames = Math.max(1, Math.ceil(metadata.duration * FPS));

  await import(WEBMOTION + "/elements");
  await import(WEBMOTION + "/video");

  const rect = source.getBoundingClientRect();
  if (!rect.width || !rect.height) throw new Error("Le recto agrandi est introuvable.");

  const originalParent = source.parentNode;
  const originalNext = source.nextSibling;
  const originalStyle = source.getAttribute("style");
  const originalClass = source.getAttribute("class");
  const mediaWrap = source.querySelector(".project-card-image-wrap");
  const originalMediaStyle = mediaWrap?.getAttribute("style") ?? null;
  let composition = null;

  try {
    onProgress("Préparation de la composition vidéo…");
    composition = document.createElement("w-composition");
    composition.setAttribute("width", String(WIDTH));
    composition.setAttribute("height", String(HEIGHT));
    composition.setAttribute("fps", String(FPS));
    composition.setAttribute("duration", String(durationFrames));
    composition.style.cssText = "position:fixed;left:-30000px;top:0;width:1080px;height:1350px;overflow:hidden;pointer-events:none";

    const videoLayer = document.createElement("w-video");
    videoLayer.setAttribute("src", mediaUrl);
    videoLayer.setAttribute("x", "0");
    videoLayer.setAttribute("y", "0");
    videoLayer.setAttribute("width", String(WIDTH));
    videoLayer.setAttribute("height", String(HEIGHT));
    videoLayer.setAttribute("fit", "cover");
    videoLayer.setAttribute("volume", "1");
    composition.appendChild(videoLayer);

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

    // La vidéo source est fournie par w-video, sous l’habillage HTML existant.
    // Masquer seulement l’ancienne couche média évite un doublon de l’image/lecteur.
    if (mediaWrap) mediaWrap.style.setProperty("visibility", "hidden", "important");
    overlay.appendChild(source);
    composition.appendChild(overlay);
    document.body.appendChild(composition);

    await composition.ready;
    if (document.fonts?.ready) await document.fonts.ready;

    onProgress("Vérification du décodage vidéo et audio…");
    // Le moteur WebMotion attend que son décodeur vidéo ait préparé la source.
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

    onProgress("Création vidéo 0 %…");
    const blob = await composition.export({
      onProgress: ({ frame, total }) => {
        onProgress("Création vidéo " + Math.min(100, Math.round(frame / total * 100)) + " %…");
      }
    });
    if (!(blob instanceof Blob) || blob.size < 10000) {
      throw new Error("WebMotion n’a pas produit de vidéo MP4 exploitable.");
    }
    return blob;
  } finally {
    composition?.remove();
    if (originalParent && source.parentNode !== originalParent) {
      if (originalNext && originalNext.parentNode === originalParent) originalParent.insertBefore(source, originalNext);
      else originalParent.appendChild(source);
    }
    if (originalStyle === null) source.removeAttribute("style");
    else source.setAttribute("style", originalStyle);
    if (originalClass === null) source.removeAttribute("class");
    else source.setAttribute("class", originalClass);
    if (mediaWrap) {
      if (originalMediaStyle === null) mediaWrap.removeAttribute("style");
      else mediaWrap.setAttribute("style", originalMediaStyle);
    }
  }
}
