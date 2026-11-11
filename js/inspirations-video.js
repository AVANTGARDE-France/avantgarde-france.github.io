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
  videoStyle.textContent = ".project-card-image.inspiration-video{object-fit:cover;opacity:0;transition:opacity .18s ease}.project-card-image.inspiration-video[data-inspiration-ready='true']{opacity:1}.project-card-image-wrap.inspiration-platform-poster{position:relative;background:linear-gradient(135deg,#07152d,#17345b)}.inspiration-platform-poster-image{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:0}.inspiration-platform-poster-image[data-poster-unavailable='true']{display:none}.project-card-image-wrap.inspiration-platform-poster iframe.inspiration-platform-player{position:absolute;inset:0;width:100%;height:100%;border:0;z-index:2;background:#07152d}.project-card-image-wrap.inspiration-platform-expanded .inspiration-platform-poster-image{display:block;pointer-events:none}.project-card-image-wrap.inspiration-platform-expanded iframe.inspiration-platform-player{z-index:5;pointer-events:auto}";
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

  function platformIdAndPoster(value, type) {
    try {
      const url = new URL(value, document.baseURI);
      const host = url.hostname.toLowerCase().replace(/^www\./, "");
      const parts = url.pathname.split("/").filter(Boolean);
      let id = "";

      if (type === "youtube") {
        id = host === "youtu.be"
          ? (parts[0] || "")
          : (url.searchParams.get("v") || (parts[0] === "embed" || parts[0] === "shorts" || parts[0] === "live" ? (parts[1] || "") : ""));
        return id ? { id, poster: "https://i.ytimg.com/vi/" + encodeURIComponent(id) + "/hqdefault.jpg" } : null;
      }

      if (type === "vimeo") {
        id = parts[0] === "video" ? (parts[1] || "") : (parts.find(part => /^\d+$/.test(part)) || "");
        return id ? { id, oembed: "https://vimeo.com/api/oembed.json?url=" + encodeURIComponent(url.href) } : null;
      }

      if (type === "dailymotion") {
        id = host === "dai.ly" ? (parts[0] || "") : (parts[0] === "video" ? (parts[1] || "") : (parts[0] === "embed" && parts[1] === "video" ? (parts[2] || "") : ""));
        return id ? { id, oembed: "https://www.dailymotion.com/services/oembed?url=" + encodeURIComponent(url.href) } : null;
      }
    } catch (_) {}
    return null;
  }

  function ensurePlatformPoster(wrap, type, value) {
    if (wrap.querySelector(".inspiration-platform-poster-image")) return;
    const info = platformIdAndPoster(value, type);
    const poster = document.createElement("img");
    poster.className = "inspiration-platform-poster-image";
    poster.alt = "";
    poster.setAttribute("aria-hidden", "true");
    poster.loading = "lazy";
    poster.decoding = "async";
    poster.referrerPolicy = "no-referrer";
    poster.src = info?.poster || "";
    wrap.appendChild(poster);

    if (info?.oembed) {
      fetch(info.oembed, { mode: "cors", credentials: "omit" })
        .then(response => {
          if (!response.ok) throw new Error("Métadonnées vidéo indisponibles");
          return response.json();
        })
        .then(data => {
          if (data.thumbnail_url) poster.src = data.thumbnail_url;
        })
        .catch(() => {
          // Le visuel de repli CSS reste affiché si la plateforme ne fournit pas de miniature.
          poster.dataset.posterUnavailable = "true";
        });
    }
    if (!info?.poster && !info?.oembed) poster.dataset.posterUnavailable = "true";
    poster.addEventListener("error", () => {
      poster.dataset.posterUnavailable = "true";
      if (type === "youtube" && info?.id && !poster.dataset.triedFallback) {
        poster.dataset.triedFallback = "true";
        poster.src = "https://img.youtube.com/vi/" + encodeURIComponent(info.id) + "/0.jpg";
      }
    });
  }

  function platformEmbed(value) {
    try {
      const url = new URL(value, document.baseURI);
      const host = url.hostname.toLowerCase().replace(/^www\./, "");
      let id = "";
      if (host === "youtu.be") id = url.pathname.split("/").filter(Boolean)[0] || "";
      else if (host.includes("youtube")) id = url.searchParams.get("v") || (url.pathname.match(/\/(?:embed|shorts|live)\/([^/?]+)/) || [])[1] || "";
      if (id && /^[a-zA-Z0-9_-]{6,}$/.test(id))
        return {provider:"youtube",src:"https://www.youtube-nocookie.com/embed/"+encodeURIComponent(id)+"?autoplay=0&mute=0&playsinline=1&controls=1&cc_load_policy=0&loop=1&playlist="+encodeURIComponent(id)};
      if (host === "vimeo.com" || host === "player.vimeo.com") {
        id = (url.pathname.match(/\/(?:video\/)?(\d+)/) || [])[1] || "";
        if (id) { const hash=url.searchParams.get("h")||""; return {provider:"vimeo",src:"https://player.vimeo.com/video/"+id+(hash?"?h="+encodeURIComponent(hash)+"&":"?")+"autoplay=1&muted=0&loop=1&controls=1&cc_load_policy=0"}; }
      }
      if (host === "dai.ly" || host.includes("dailymotion.com")) {
        id = (url.pathname.match(/\/(?:video\/|embed\/video\/)([a-zA-Z0-9]+)/) || [])[1] || "";
        if (!id && host === "dai.ly") id=url.pathname.split("/").filter(Boolean)[0]||"";
        if (id) return {provider:"dailymotion",src:"https://www.dailymotion.com/embed/video/"+encodeURIComponent(id)+"?autoplay=1&mute=0&queue-enable=false&cc_load_policy=0"};
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
    if (type !== "file") {
      wrap.dataset.inspirationPlatform = type;
      wrap.classList.add("inspiration-platform-poster");
      ensurePlatformPoster(wrap, type, url);
      return null;
    }

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
    // In full view restore sound; small previews remain muted.
    video.muted = false;
    video.defaultMuted = false;
    video.removeAttribute("muted");
    video.loop = true;
    video.preload = "auto";
    video.controls = false;
    ensureSource(video, "auto");
    if (video.dataset.inspirationFullPlayAttempted === "true") return;
    const play = () => {
      if (!inModal(video) || MODAL.dataset.cardStage !== "RECTO_AGRANDI") return;
      if (video.dataset.inspirationFullPlayAttempted === "true") return;
      video.dataset.inspirationFullPlayAttempted = "true";
      // The card-opening click may no longer count as a media gesture after async loading.
      // Try audible playback; if the browser blocks it, expose native controls for one explicit tap.
      video.play().then(() => {
        video.controls = false;
      }).catch(error => {
        video.controls = true;
        console.info("[Inspirations vidéo] Le navigateur demande un clic pour autoriser le son.", error);
      });
    };
    if (video.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) play();
    else video.addEventListener("canplay", play, { once: true });
  }

  function syncModalVideo() {
    const stage = MODAL.dataset.cardStage;
    const mediaWrap = MODAL_FRONT.querySelector(".project-card-image-wrap[data-inspiration-media-url]");
    if (mediaWrap) {
      const url = mediaWrap.dataset.inspirationMediaUrl || "";
      const type = mediaWrap.dataset.inspirationPlatform || mediaType(url);
      const existingFrame = mediaWrap.querySelector("iframe.inspiration-platform-player");

      // Keep the poster only during the small-card and enlargement stages.
      // Mount the third-party player only after the historical enlargement finishes.
      if (stage === "RECTO_AGRANDI" && type && type !== "file") {
        const embed = platformEmbed(url);
        if (embed && (!existingFrame || existingFrame.dataset.embedSrc !== embed.src)) {
          existingFrame?.remove();
          const frame = document.createElement("iframe");
          frame.className = "inspiration-platform-player";
          frame.addEventListener("click", event => event.stopPropagation());
          frame.dataset.embedSrc = embed.src;
          frame.src = embed.src;
          frame.title = "Lecteur vidéo " + embed.provider;
          frame.loading = "eager";
          frame.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
          frame.allowFullscreen = true;
          frame.referrerPolicy = "strict-origin-when-cross-origin";
          mediaWrap.appendChild(frame);
        }
        mediaWrap.classList.add("inspiration-platform-expanded");
        return;
      }
      existingFrame?.remove();
      mediaWrap.classList.remove("inspiration-platform-expanded");
    }

    const video = mediaWrap?.querySelector("video.inspiration-video");
    if (!video) {
      document.querySelectorAll("video.inspiration-video").forEach(v => {
        if (inGrid(v)) { v.dataset.inspirationVideoMode = "preview"; v.loop = false; }
      });
      selectVisiblePreview();
      return;
    }
    if (stage === "RECTO_AGRANDI") showFullVideo(video);
    else {
      delete video.dataset.inspirationFullPlayAttempted;
      clearPreviewTimer(video);
      video.pause();
      video.dataset.inspirationPreviewActive = "false";
      try { video.currentTime = 0; } catch (_) {}
    }
  }

  // The card is already initialized while it is in GRID.
  // Do not rescan its subtree when openInspirationCard moves it into the modal:
  // that transfer is presentation-only and must not trigger media conversion.
  const gridObserver = new MutationObserver(records => {
    for (const record of records) {
      if (record.type !== "childList") continue;
      record.addedNodes.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE) scan(node);
      });
    }
  });

  // Synchronize the player only when the modal state changes, never on card transfer.
  const modalObserver = new MutationObserver(() => syncModalVideo());

  gridObserver.observe(GRID, { childList: true, subtree: true });
  modalObserver.observe(MODAL, {
    attributes: true,
    attributeFilter: ["class", "data-card-stage"]
  });

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
