/* ==========================================================================
   AVANT-GARDE — INSPIRATIONS VIDEO
   Module autonome : détection, aperçu 3 s et lecture agrandie.
   Ne modifie ni les cartes image/GIF, ni les votes, notes ou transitions.
   ========================================================================== */
(() => {
  "use strict";

  const GRID = document.getElementById("projectGrid");
  const MODAL = document.getElementById("projectModal");
  const MODAL_FRONT = document.getElementById("projectModalFront");
  if (!GRID || !MODAL || !MODAL_FRONT) return;

  const PREVIEW_SECONDS = 3;
  const VIDEO_EXTENSIONS = /\.(mp4|m4v|webm|ogv|ogg|mov|m3u8)$/i;
  const visibility = new Map();
  const previewTimers = new WeakMap();
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const videoStyle = document.createElement("style");
  videoStyle.textContent = ".project-card-image.inspiration-video{object-fit:cover;opacity:0;transition:opacity .18s ease}.project-card-image.inspiration-video[data-inspiration-ready='true']{opacity:1}.project-card-image-wrap.inspiration-platform-poster iframe.inspiration-platform-player{position:absolute;inset:0;width:100%;height:100%;border:0;z-index:0;background:#07152d}";
  document.head.appendChild(videoStyle);

  const intersectionObserver = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      visibility.set(entry.target, entry.isIntersecting ? entry.intersectionRatio : 0);
      const video = entry.target;
      if (entry.isIntersecting) {
        preparePreview(video);
      } else if (!MODAL_FRONT.contains(video)) {
        stopPreview(video, true);
      }
    }
    selectVisiblePreview();
  }, {
    root: null,
    rootMargin: "0px",
    threshold: [0, 0.05, 0.15, 0.3, 0.5, 0.75, 1]
  });

  function mediaType(value) {
    if (!value) return null;
    try {
      const url = new URL(value, document.baseURI);
      const host = url.hostname.toLowerCase().replace(/^www\./, "");
      if (host === "youtu.be" || host.includes("youtube")) return "youtube";
      if (host === "vimeo.com" || host === "player.vimeo.com") return "vimeo";
      if (host === "dailymotion.com" || host === "dai.ly" || host === "geo.dailymotion.com") return "dailymotion";
      if (VIDEO_EXTENSIONS.test(url.pathname)) return "file";
    } catch (_) {
      if (VIDEO_EXTENSIONS.test(String(value).split(/[?#]/)[0])) return "file";
    }
    return null;
  }
  function isVideoUrl(value) { return mediaType(value) === "file"; }
  function platformEmbed(value) {
    try {
      const url = new URL(value, document.baseURI);
      const host = url.hostname.toLowerCase().replace(/^www\./, "");
      let id = "";
      if (host === "youtu.be") id = url.pathname.split("/").filter(Boolean)[0] || "";
      else if (host.includes("youtube")) id = url.searchParams.get("v") || (url.pathname.match(/\/(?:embed|shorts|live)\/([^/?]+)/) || [])[1] || "";
      if (id && /^[a-zA-Z0-9_-]{6,}$/.test(id))
        return {provider:"youtube",src:"https://www.youtube-nocookie.com/embed/"+encodeURIComponent(id)+"?autoplay=1&mute=1&playsinline=1&controls=1&loop=1&playlist="+encodeURIComponent(id)};
      if (host === "vimeo.com" || host === "player.vimeo.com") {
        id = (url.pathname.match(/\/(?:video\/)?(\d+)/) || [])[1] || "";
        if (id) { const hash=url.searchParams.get("h")||""; return {provider:"vimeo",src:"https://player.vimeo.com/video/"+id+(hash?"?h="+encodeURIComponent(hash)+"&":"?")+"autoplay=1&muted=1&loop=1"}; }
      }
      if (host === "dai.ly" || host.includes("dailymotion.com")) {
        id = (url.pathname.match(/\/(?:video\/|embed\/video\/)([a-zA-Z0-9]+)/) || [])[1] || "";
        if (!id && host === "dai.ly") id=url.pathname.split("/").filter(Boolean)[0]||"";
        if (id) return {provider:"dailymotion",src:"https://www.dailymotion.com/embed/video/"+encodeURIComponent(id)+"?autoplay=1&mute=1&queue-enable=false"};
      }
    } catch (_) {}
    return null;
  }

  function sourceOf(video) {
    return video.dataset.inspirationVideoSrc || video.getAttribute("src") || "";
  }

  function inGrid(video) {
    return GRID.contains(video);
  }

  function inModal(video) {
    return MODAL_FRONT.contains(video);
  }

  function clearPreviewTimer(video) {
    const timer = previewTimers.get(video);
    if (timer) window.clearTimeout(timer);
    previewTimers.delete(video);
  }

  function attachVideoEvents(video) {
    if (video.dataset.inspirationVideoEvents === "ready") return;
    video.dataset.inspirationVideoEvents = "ready";

    video.addEventListener("timeupdate", () => {
      if (video.dataset.inspirationVideoMode !== "preview") return;
      if (video.currentTime >= PREVIEW_SECONDS) {
        video.pause();
        try { video.currentTime = 0; } catch (_) {}
        clearPreviewTimer(video);
        const timer = window.setTimeout(() => {
          if (video.dataset.inspirationVideoMode === "preview" &&
              video.dataset.inspirationPreviewActive === "true" &&
              inGrid(video) && !document.hidden) {
            video.play().catch(() => {});
          }
        }, 180);
        previewTimers.set(video, timer);
      }
    });

    video.addEventListener("loadeddata", () => {
      video.dataset.inspirationReady = "true";
    });

    video.addEventListener("emptied", () => {
      delete video.dataset.inspirationReady;
    });

    video.addEventListener("ended", () => {
      if (video.dataset.inspirationVideoMode !== "preview") return;
      try { video.currentTime = 0; } catch (_) {}
      if (video.dataset.inspirationPreviewActive === "true") {
        video.play().catch(() => {});
      }
    });

    video.addEventListener("error", () => {
      video.dataset.inspirationVideoError = "true";
      video.pause();
      console.warn("[Inspirations vidéo] Média impossible à lire :", sourceOf(video));
    });
  }

  function convertImageToVideo(img) {
    const url = img.currentSrc || img.getAttribute("src") || img.src || "";
    if (!isVideoUrl(url) || img.dataset.inspirationVideoConverted === "true") return null;

    const video = document.createElement("video");
    video.className = img.className;
    video.classList.add("inspiration-video");
    video.style.cssText = img.style.cssText;
    video.setAttribute("aria-hidden", "true");
    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "");
    video.setAttribute("muted", "");
    video.muted = true;
    video.defaultMuted = true;
    video.controls = false;
    video.disablePictureInPicture = true;
    video.preload = "none";
    video.loop = false;
    video.autoplay = false;
    video.dataset.inspirationVideo = "true";
    video.dataset.inspirationVideoSrc = url;
    video.dataset.inspirationVideoMode = "preview";
    video.dataset.inspirationPreviewActive = "false";
    attachVideoEvents(video);

    img.dataset.inspirationVideoConverted = "true";
    img.replaceWith(video);
    intersectionObserver.observe(video);
    return video;
  }

  function convertMediaWrapper(wrap) {
    const url = wrap.dataset.inspirationMediaUrl || "";
    const type = mediaType(url);
    if (!type || wrap.querySelector("video.inspiration-video, iframe.inspiration-platform-player")) return null;
    if (type !== "file") { wrap.dataset.inspirationPlatform = type; wrap.classList.add("inspiration-platform-poster"); return null; }

    const video = document.createElement("video");
    video.className = "project-card-image inspiration-video";
    video.setAttribute("aria-hidden", "true");
    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "");
    video.setAttribute("muted", "");
    video.muted = true;
    video.defaultMuted = true;
    video.controls = false;
    video.disablePictureInPicture = true;
    video.preload = "none";
    video.loop = false;
    video.autoplay = false;
    video.dataset.inspirationVideo = "true";
    video.dataset.inspirationVideoSrc = url;
    video.dataset.inspirationVideoMode = "preview";
    video.dataset.inspirationPreviewActive = "false";
    attachVideoEvents(video);
    wrap.appendChild(video);
    intersectionObserver.observe(video);
    return video;
  }

  function scan(root = document) {
    if (root.matches?.(".project-card-image-wrap[data-inspiration-media-url]")) convertMediaWrapper(root);
    root.querySelectorAll?.(".project-card-image-wrap[data-inspiration-media-url]").forEach(convertMediaWrapper);
    if (root.matches?.("img.project-card-image")) convertImageToVideo(root);
    root.querySelectorAll?.("img.project-card-image").forEach(convertImageToVideo);
    root.querySelectorAll?.("video.inspiration-video").forEach(video => {
      attachVideoEvents(video);
      if (inGrid(video)) intersectionObserver.observe(video);
    });
  }

  function ensureSource(video, preload) {
    const url = sourceOf(video);
    if (!url) return;
    video.preload = preload;
    if (video.getAttribute("src") !== url) {
      video.src = url;
      video.load();
    } else if (video.readyState === 0 && preload !== "none") {
      video.load();
    }
  }

  function preparePreview(video) {
    if (!inGrid(video) || reducedMotion.matches || document.hidden) return;
    video.dataset.inspirationVideoMode = "preview";
    ensureSource(video, "metadata");
  }

  function stopPreview(video, releaseSource) {
    clearPreviewTimer(video);
    video.dataset.inspirationPreviewActive = "false";
    video.pause();
    if (video.dataset.inspirationVideoMode === "preview") {
      try { video.currentTime = 0; } catch (_) {}
    }
    if (releaseSource && video.dataset.inspirationVideoMode !== "full") {
      video.removeAttribute("src");
      video.preload = "none";
      video.load();
    }
  }

  function selectVisiblePreview() {
    if (MODAL.classList.contains("open") || reducedMotion.matches || document.hidden) {
      document.querySelectorAll("video.inspiration-video").forEach(video => stopPreview(video, false));
      return;
    }

    let selected = null;
    let bestRatio = 0;
    for (const [video, ratio] of visibility.entries()) {
      if (!inGrid(video) || ratio <= bestRatio || video.dataset.inspirationVideoError === "true") continue;
      selected = video;
      bestRatio = ratio;
    }

    document.querySelectorAll("video.inspiration-video").forEach(video => {
      if (video === selected && bestRatio > 0.05) {
        video.dataset.inspirationPreviewActive = "true";
        preparePreview(video);
        if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && video.paused) {
          video.play().catch(() => {});
        } else {
          video.addEventListener("loadeddata", () => {
            if (video.dataset.inspirationPreviewActive === "true" && inGrid(video)) {
              video.play().catch(() => {});
            }
          }, { once: true });
        }
      } else {
        stopPreview(video, false);
      }
    });
  }

  function showFullVideo(video) {
    clearPreviewTimer(video);
    document.querySelectorAll("video.inspiration-video").forEach(other => {
      if (other !== video) stopPreview(other, false);
    });
    video.dataset.inspirationVideoMode = "full";
    video.dataset.inspirationPreviewActive = "false";
    video.muted = true;
    video.defaultMuted = true;
    video.loop = true;
    video.preload = "auto";
    ensureSource(video, "auto");
    const play = () => {
      if (inModal(video) && MODAL.dataset.cardStage === "RECTO_AGRANDI") {
        video.play().catch(error => console.warn("[Inspirations vidéo] Lecture agrandie refusée :", error));
      }
    };
    if (video.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) play();
    else video.addEventListener("canplay", play, { once: true });
  }

  function syncModalVideo() {
    const stage = MODAL.dataset.cardStage;
    const mediaWrap = MODAL_FRONT.querySelector(".project-card-image-wrap[data-inspiration-media-url]");
    const video = mediaWrap?.querySelector("video.inspiration-video");
    const platform = mediaWrap?.dataset.inspirationPlatform;
    const expanded = stage === "RECTO_AGRANDI";
    if (mediaWrap && platform && expanded) {
      let frame = mediaWrap.querySelector("iframe.inspiration-platform-player");
      if (!frame) {
        const embed = platformEmbed(mediaWrap.dataset.inspirationMediaUrl);
        if (embed) {
          frame = document.createElement("iframe");
          frame.className = "inspiration-platform-player";
          frame.title = "Lecteur " + embed.provider;
          frame.src = embed.src;
          frame.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
          frame.allowFullscreen = true;
          frame.loading = "eager";
          frame.referrerPolicy = "strict-origin-when-cross-origin";
          mediaWrap.appendChild(frame);
        }
      }
    } else if (mediaWrap) mediaWrap.querySelector("iframe.inspiration-platform-player")?.remove();

    if (!video) {
      document.querySelectorAll("video.inspiration-video").forEach(v => {
        if (inGrid(v)) { v.dataset.inspirationVideoMode = "preview"; v.loop = false; }
      });
      selectVisiblePreview();
      return;
    }
    if (expanded) showFullVideo(video);
    else {
      clearPreviewTimer(video);
      video.pause();
      video.dataset.inspirationPreviewActive = "false";
      try { video.currentTime = 0; } catch (_) {}
    }
  }

  const mutationObserver = new MutationObserver(records => {
    for (const record of records) {
      if (record.type === "childList") {
        record.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) scan(node);
        });
      }
    }
    syncModalVideo();
  });

  mutationObserver.observe(GRID, { childList: true, subtree: true });
  mutationObserver.observe(MODAL, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["class", "data-card-stage"]
  });
  mutationObserver.observe(MODAL_FRONT, { childList: true, subtree: true });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      document.querySelectorAll("video.inspiration-video").forEach(video => stopPreview(video, false));
    } else {
      syncModalVideo();
      selectVisiblePreview();
    }
  });

  reducedMotion.addEventListener?.("change", () => {
    if (reducedMotion.matches) {
      document.querySelectorAll("video.inspiration-video").forEach(video => stopPreview(video, false));
    } else {
      selectVisiblePreview();
    }
  });

  scan(GRID);
  scan(MODAL_FRONT);
  syncModalVideo();
  console.info("[Inspirations vidéo] Module autonome chargé.");
})();
