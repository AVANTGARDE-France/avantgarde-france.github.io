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

  function isVideoUrl(value) {
    if (!value) return false;
    try {
      const url = new URL(value, document.baseURI);
      return VIDEO_EXTENSIONS.test(url.pathname);
    } catch (_) {
      return VIDEO_EXTENSIONS.test(String(value).split(/[?#]/)[0]);
    }
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

  function scan(root = document) {
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
    const video = MODAL_FRONT.querySelector("video.inspiration-video");
    if (!video) {
      document.querySelectorAll("video.inspiration-video").forEach(v => {
        if (inGrid(v)) {
          v.dataset.inspirationVideoMode = "preview";
          v.loop = false;
        }
      });
      selectVisiblePreview();
      return;
    }

    if (MODAL.dataset.cardStage === "RECTO_AGRANDI") {
      showFullVideo(video);
    } else {
      clearPreviewTimer(video);
      video.pause();
      video.dataset.inspirationPreviewActive = "false";
      if (MODAL.dataset.cardStage === "VERSO") {
        try { video.currentTime = 0; } catch (_) {}
      }
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
