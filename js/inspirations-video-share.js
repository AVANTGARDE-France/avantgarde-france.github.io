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

async function fetchYouTubeAssets(youtubeUrl, onProgress) {
  onProgress("Demande d'extraction à GenDownload…");
  const response = await fetch(EXTRACT_API, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Accept": "application/json" },
    body: JSON.stringify({ url: youtubeUrl })
  });
  if (!response.ok) throw new Error("GenDownload a répondu HTTP " + response.status + ".");
  const data = await response.json();
  if (!Array.isArray(data.formats)) {
    throw new Error(data.error || data.message || "GenDownload n'a retourné aucun format vidéo.");
  }

  const videos = data.formats.filter(f => f?.type === "video" && String(f.ext).toLowerCase() === "mp4" && f.url);
  const audios = data.formats.filter(f => f?.type === "audio" && ["m4a", "mp4", "aac"].includes(String(f.ext).toLowerCase()) && f.url);
  if (!videos.length) throw new Error("Aucun flux vidéo MP4 proposé par GenDownload.");
  if (!audios.length) throw new Error("Aucune piste audio séparée compatible proposée. Arrêt pour éviter un export silencieux.");

  const quality = f => Number((String(f.label || "").match(/(\d{3,4})p?/i) || [])[1] || 0);
  videos.sort((a, b) => quality(b) - quality(a));
  const videoFormat = videos[0];
  const audioFormat = audios[0];
  const streamUrl = value => new URL(value, "https://gendownload.com").href;

  onProgress("Téléchargement du flux vidéo " + (videoFormat.label || "MP4") + "…");
  const videoResponse = await fetch(streamUrl(videoFormat.url));
  if (!videoResponse.ok) throw new Error("Récupération vidéo impossible (HTTP " + videoResponse.status + ").");
  const videoBlob = await videoResponse.blob();
  if (!videoBlob.size) throw new Error("Le fichier vidéo reçu est vide.");

  onProgress("Téléchargement de la piste audio…");
  const audioResponse = await fetch(streamUrl(audioFormat.url));
  if (!audioResponse.ok) throw new Error("Récupération audio impossible (HTTP " + audioResponse.status + ").");
  const audioBlob = await audioResponse.blob();
  if (!audioBlob.size) throw new Error("Le fichier audio reçu est vide.");

  return { videoBlob, audioBlob, title: data.title || "inspiration" };
}

export async function generateVideoShare({ source, mediaUrl, onProgress = () => {} }) {
  if (!source || !mediaUrl) throw new Error("Carte ou URL source introuvable.");
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

  try {
    let videoSource = mediaUrl;
    let audioSource = null;

    if (isYouTubeUrl(mediaUrl)) {
      const assets = await fetchYouTubeAssets(mediaUrl, onProgress);
      videoObjectUrl = URL.createObjectURL(assets.videoBlob);
      audioObjectUrl = URL.createObjectURL(assets.audioBlob);
      videoSource = videoObjectUrl;
      audioSource = audioObjectUrl;
    } else if (!isDirectVideo(mediaUrl)) {
      throw new Error("La source doit être une URL YouTube ou un fichier MP4 direct.");
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

    if (mediaWrap) mediaWrap.style.setProperty("visibility", "hidden", "important");
    overlay.appendChild(source);
    composition.appendChild(overlay);
    document.body.appendChild(composition);

    await composition.ready;
    if (document.fonts?.ready) await document.fonts.ready;
    onProgress("Vérification du décodage vidéo et audio…");
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

    onProgress("Création du MP4 0 %…");
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
    if (videoObjectUrl) URL.revokeObjectURL(videoObjectUrl);
    if (audioObjectUrl) URL.revokeObjectURL(audioObjectUrl);
  }
}
