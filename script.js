const MAP_IMAGE_SRC = "assets/images/naver_map.png";
const STORE_ADDRESS_TEXT = "월곶중앙로14번길 65-1 경성빌딩 2층";
const MAP_MIN_SCALE = 1;
const MAP_MAX_SCALE = 4;
const MAP_ZOOM_STEP = 0.25;
const MAP_WHEEL_STEP = 0.2;

const navLinks = document.querySelectorAll(".nav-link");
const sections = document.querySelectorAll("section");
const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;
const enableSectionAnimations = !prefersReducedMotion;

const isSectionInViewport = (section) => {
  const rect = section.getBoundingClientRect();
  const viewportHeight =
    window.innerHeight || document.documentElement.clientHeight;
  return (
    rect.top <= viewportHeight * 0.9 && rect.bottom >= viewportHeight * 0.1
  );
};

const primeSectionVisibility = () => {
  if (!enableSectionAnimations) return;
  sections.forEach((section) => {
    const isVisible = isSectionInViewport(section);
    section.classList.toggle("is-visible", isVisible);
  });
};

if (enableSectionAnimations) {
  primeSectionVisibility();
  document.body.classList.add("anim-ready");
} else {
  sections.forEach((section) => section.classList.add("is-visible"));
}

const setActiveSection = (id) => {
  navLinks.forEach((link) => {
    const isActive = id && link.dataset.section === id;
    link.classList.toggle("active", isActive);
    link.setAttribute("aria-current", isActive ? "true" : "false");
  });
};

// Highlight nav on scroll when a section is in view
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (enableSectionAnimations) {
        entry.target.classList.toggle("is-visible", entry.isIntersecting);
      }
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute("id");
        setActiveSection(id);
      }
    });
  },
  {
    rootMargin: "-30% 0px -45% 0px",
    threshold: 0.25,
  }
);

sections.forEach((section) => observer.observe(section));

// Scroll/resize fallback to ensure all sections activate correctly
let ticking = false;
const handleScroll = () => {
  const header = document.querySelector(".site-header");
  const offset = (header?.offsetHeight || 0) + 12;
  let currentId = null;

  if (enableSectionAnimations) {
    sections.forEach((section) => {
      const visible = isSectionInViewport(section);
      section.classList.toggle("is-visible", visible);
    });
  }

  sections.forEach((section) => {
    const rect = section.getBoundingClientRect();
    if (rect.top <= offset && rect.bottom >= offset + 40) {
      currentId = section.id;
    }
  });

  if (currentId) {
    setActiveSection(currentId);
  } else {
    // If no section is deemed current, clear all active states
    setActiveSection("");
  }
  ticking = false;
};

window.addEventListener("scroll", () => {
  if (!ticking) {
    window.requestAnimationFrame(handleScroll);
    ticking = true;
  }
});
window.addEventListener("resize", handleScroll);

navLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    const targetId = link.getAttribute("href");
    const target = document.querySelector(targetId);
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth" });

    // Also set active immediately on click
    const cleanId = targetId.replace("#", "");
    setActiveSection(cleanId);

    // Remove focus so focus styles don't linger after scroll
    link.blur();
  });
});

// Initialize: highlight Home on first load
setActiveSection("home");
handleScroll();
window.addEventListener("load", primeSectionVisibility);

// Review carousel controls (horizontal scroll)
const reviewCarousel = document.querySelector(".review-carousel");
if (reviewCarousel) {
  const track = reviewCarousel.querySelector(".card-grid--horizontal");
  const prevBtn = reviewCarousel.querySelector(".carousel-btn.prev");
  const nextBtn = reviewCarousel.querySelector(".carousel-btn.next");
  const body = document.body;

  const getStep = () => {
    const firstCard = track.querySelector(".card");
    if (!firstCard) return 0;
    const gap = parseFloat(getComputedStyle(track).gap || "0");
    return firstCard.offsetWidth + gap;
    // If no gap retrieved, fallback to firstCard width only
  };

  const scrollByStep = (direction) => {
    const step = getStep();
    if (step === 0) return;
    track.scrollBy({ left: step * direction, behavior: "smooth" });
  };

  const addPressEffect = (btn) => {
    btn?.addEventListener("click", () => {
      btn.classList.add("is-pressed");
      setTimeout(() => btn.classList.remove("is-pressed"), 180);
    });
  };

  prevBtn?.addEventListener("click", () => scrollByStep(-1));
  nextBtn?.addEventListener("click", () => scrollByStep(1));
  addPressEffect(prevBtn);
  addPressEffect(nextBtn);

  // Drag-to-scroll
  let isDragging = false;
  let startX = 0;
  let startScroll = 0;

  const onPointerDown = (e) => {
    isDragging = true;
    startX = e.clientX || e.touches?.[0]?.clientX || 0;
    startScroll = track.scrollLeft;
    track.classList.add("is-dragging");
  };

  const onPointerMove = (e) => {
    if (!isDragging) return;
    const x = e.clientX || e.touches?.[0]?.clientX || 0;
    const delta = startX - x;
    track.scrollLeft = startScroll + delta;
  };

  const endDrag = () => {
    isDragging = false;
    track.classList.remove("is-dragging");
  };

  track.addEventListener("pointerdown", onPointerDown);
  track.addEventListener("pointermove", onPointerMove);
  track.addEventListener("pointerup", endDrag);
  track.addEventListener("pointerleave", endDrag);
  track.addEventListener("pointercancel", endDrag);

  // Modal for review details
  const modalOverlay = document.createElement("div");
  modalOverlay.className = "modal-overlay";
  modalOverlay.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true" aria-label="리뷰 상세">
      <div class="modal__header">
        <h4 class="modal__title">리뷰 상세</h4>
        <button class="modal__close" aria-label="close modal">×</button>
      </div>
      <div class="modal__media" aria-hidden="true"></div>
      <div class="modal__body"></div>
    </div>
  `;
  body.appendChild(modalOverlay);

  const modalBody = modalOverlay.querySelector(".modal__body");
  const modalMedia = modalOverlay.querySelector(".modal__media");
  const modalClose = modalOverlay.querySelector(".modal__close");

  const closeModal = () => {
    modalOverlay.classList.remove("is-open");
    body.style.overflow = "";
  };

  const openModal = ({ image, text }) => {
    modalMedia.innerHTML = image || "";
    modalBody.innerHTML = text;
    modalOverlay.classList.add("is-open");
    body.style.overflow = "hidden";
  };

  modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) closeModal();
  });
  modalClose.addEventListener("click", closeModal);
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });

  // Add "더보기" buttons to review text cards to open modal
  const reviewTextCards = track.querySelectorAll(".card:not(.review-more-card) .text-card");
  reviewTextCards.forEach((card) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn-more";
    btn.textContent = "더보기";
    btn.addEventListener("click", () => {
      const textHtml = card.querySelector("p")?.innerHTML || "";
      const imageHtml =
        card.querySelector(".image-placeholder img")?.outerHTML || "";
      openModal({ image: imageHtml, text: `<p>${textHtml}</p>` });
    });
    card.appendChild(btn);
  });
}

const slideTrack = document.querySelector(".image-slides .slide-track");
const slidePrev = document.querySelector(".image-slides .slide-btn.prev");
const slideNext = document.querySelector(".image-slides .slide-btn.next");
const slideDots = document.querySelectorAll(".image-slides .slide-dots .dot");

if (slideTrack && (slidePrev || slideNext)) {
  const getSlideStep = () => {
    const slide = slideTrack.querySelector("img");
    if (!slide) return 0;
    const gap = parseFloat(getComputedStyle(slideTrack).gap || "0");
    return slide.offsetWidth + gap;
  };

  const updateActiveDot = () => {
    if (!slideTrack || slideDots.length === 0) return;
    const maxScroll =
      slideTrack.scrollWidth - slideTrack.clientWidth || 0;
    const ratio = maxScroll ? slideTrack.scrollLeft / maxScroll : 0;
    const targetIndex = Math.round(ratio * (slideDots.length - 1));
    slideDots.forEach((dot, index) => {
      dot.classList.toggle("active", index === targetIndex);
    });
  };

  const scrollSlides = (direction) => {
    const step = getSlideStep();
    if (!step) return;
    slideTrack.scrollBy({ left: step * direction, behavior: "smooth" });
  };

  slidePrev?.addEventListener("click", () => scrollSlides(-1));
  slideNext?.addEventListener("click", () => scrollSlides(1));

  let isDragging = false;
  let startX = 0;
  let startScrollLeft = 0;

  const startDrag = (event) => {
    isDragging = true;
    startX = event.clientX;
    startScrollLeft = slideTrack.scrollLeft;
    slideTrack.classList.add("is-dragging");
  };

  const drag = (event) => {
    if (!isDragging) return;
    const delta = startX - event.clientX;
    slideTrack.scrollLeft = startScrollLeft + delta;
  };

  const stopDrag = () => {
    isDragging = false;
    slideTrack.classList.remove("is-dragging");
  };

  slideTrack.addEventListener("pointerdown", startDrag);
  slideTrack.addEventListener("pointermove", drag);
  slideTrack.addEventListener("pointerup", stopDrag);
  slideTrack.addEventListener("pointerleave", stopDrag);
  slideTrack.addEventListener("pointercancel", stopDrag);
  slideTrack.addEventListener("scroll", updateActiveDot);

  updateActiveDot();
}

// Directions: map modal + zoom/pan
const mapPreviewButton = document.querySelector("[data-map-open]");
const mapModalOverlay = document.querySelector("[data-map-modal]");
const mapModalClose = mapModalOverlay?.querySelector(".map-modal__close");
const mapModalImg = mapModalOverlay?.querySelector(".map-panzoom__image");
const mapViewer = mapModalOverlay?.querySelector("[data-map-viewer]");
const mapPanzoom = mapModalOverlay?.querySelector("[data-map-panzoom]");
const zoomInBtn = mapModalOverlay?.querySelector("[data-zoom-in]");
const zoomOutBtn = mapModalOverlay?.querySelector("[data-zoom-out]");
const zoomResetBtn = mapModalOverlay?.querySelector("[data-zoom-reset]");
const mapOpenButtons = document.querySelectorAll("[data-map-open], .btn-open-map");
const addressTextEl = document.querySelector(".directions__address-text");
const copyAddressBtn = document.querySelector(".btn-copy-address");
const toastEl = document.querySelector(".toast");

if (mapModalImg) {
  mapModalImg.src = MAP_IMAGE_SRC;
}
const mapPreviewImg = mapPreviewButton?.querySelector(".map-preview__image");
if (mapPreviewImg) {
  mapPreviewImg.src = MAP_IMAGE_SRC;
}
if (addressTextEl) {
  addressTextEl.textContent = STORE_ADDRESS_TEXT;
}

let toastTimer;
const showToast = (message, isError = false) => {
  if (!toastEl) return;
  toastEl.textContent = message;
  toastEl.classList.toggle("is-error", isError);
  toastEl.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastEl.classList.remove("is-visible");
    toastEl.classList.remove("is-error");
  }, 2200);
};

const copyAddress = async () => {
  const text = STORE_ADDRESS_TEXT;
  if (!text) return;
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      showToast("주소를 복사했습니다.");
      return;
    }
  } catch (error) {
    // Fallback below
  }

  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const successful = document.execCommand("copy");
    document.body.removeChild(textarea);
    if (successful) {
      showToast("주소를 복사했습니다.");
    } else {
      throw new Error("execCommand copy failed");
    }
  } catch (error) {
    showToast("주소 복사에 실패했어요. 다시 시도해주세요.", true);
  }
};
copyAddressBtn?.addEventListener("click", copyAddress);

const mapState = {
  scale: MAP_MIN_SCALE,
  tx: 0,
  ty: 0,
  naturalWidth: 0,
  naturalHeight: 0,
};
let isMapOpen = false;
let previousBodyOverflow = "";

const syncNaturalSize = () => {
  if (!mapModalImg) return;
  mapState.naturalWidth = mapModalImg.naturalWidth || mapState.naturalWidth;
  mapState.naturalHeight = mapModalImg.naturalHeight || mapState.naturalHeight;
};

mapModalImg?.addEventListener("load", () => {
  syncNaturalSize();
  renderMapTransform();
});
if (mapModalImg?.complete) {
  syncNaturalSize();
}

const getBaseSize = () => {
  const viewerRect = mapPanzoom?.getBoundingClientRect();
  if (!viewerRect) {
    return {
      baseWidth: 0,
      baseHeight: 0,
      containerWidth: 0,
      containerHeight: 0,
    };
  }
  const naturalWidth = mapState.naturalWidth || viewerRect.width || 1;
  const naturalHeight = mapState.naturalHeight || viewerRect.height || 1;
  const fitScale = Math.min(
    viewerRect.width / naturalWidth || 1,
    viewerRect.height / naturalHeight || 1
  );
  return {
    baseWidth: naturalWidth * fitScale,
    baseHeight: naturalHeight * fitScale,
    containerWidth: viewerRect.width,
    containerHeight: viewerRect.height,
  };
};

const clampTranslation = () => {
  const { baseWidth, baseHeight, containerWidth, containerHeight } = getBaseSize();
  const scaledWidth = baseWidth * mapState.scale;
  const scaledHeight = baseHeight * mapState.scale;
  const limitX = Math.max((scaledWidth - containerWidth) / 2, 0);
  const limitY = Math.max((scaledHeight - containerHeight) / 2, 0);

  mapState.tx = Math.min(limitX, Math.max(-limitX, mapState.tx));
  mapState.ty = Math.min(limitY, Math.max(-limitY, mapState.ty));
};

const renderMapTransform = () => {
  if (!mapModalImg) return;
  clampTranslation();
  mapModalImg.style.transform = `scale(${mapState.scale}) translate(${mapState.tx}px, ${mapState.ty}px)`;
};

const resetMapPosition = (animate = true) => {
  mapState.scale = MAP_MIN_SCALE;
  mapState.tx = 0;
  mapState.ty = 0;
  if (animate && mapModalImg) {
    mapModalImg.classList.add("is-resetting");
    setTimeout(() => mapModalImg.classList.remove("is-resetting"), 260);
  }
  renderMapTransform();
};

const handleZoom = (deltaScale, center) => {
  const nextScale = Math.min(
    MAP_MAX_SCALE,
    Math.max(MAP_MIN_SCALE, mapState.scale + deltaScale)
  );
  if (nextScale === mapState.scale) return;

  const viewerRect = mapViewer?.getBoundingClientRect();
  if (viewerRect) {
    const originX = center?.x ?? viewerRect.left + viewerRect.width / 2;
    const originY = center?.y ?? viewerRect.top + viewerRect.height / 2;
    if (Number.isFinite(originX) && Number.isFinite(originY)) {
      const centerX = originX - (viewerRect.left + viewerRect.width / 2);
      const centerY = originY - (viewerRect.top + viewerRect.height / 2);
      const scaleFactor = nextScale / mapState.scale;
      mapState.tx -= centerX * (scaleFactor - 1);
      mapState.ty -= centerY * (scaleFactor - 1);
    }
  }

  mapState.scale = nextScale;
  renderMapTransform();
};

const openMapModal = () => {
  if (!mapModalOverlay) return;
  mapModalOverlay.classList.add("is-open");
  previousBodyOverflow = document.body.style.overflow;
  document.body.style.overflow = "hidden";
  isMapOpen = true;
  requestAnimationFrame(() => resetMapPosition(false));
  mapModalClose?.focus();
};

const closeMapModal = () => {
  if (!mapModalOverlay) return;
  mapModalOverlay.classList.remove("is-open");
  document.body.style.overflow = previousBodyOverflow;
  previousBodyOverflow = "";
  isMapOpen = false;
  resetMapPosition(false);
};

mapOpenButtons.forEach((btn) => btn.addEventListener("click", openMapModal));
mapModalClose?.addEventListener("click", closeMapModal);
mapModalOverlay?.addEventListener("click", (event) => {
  if (event.target === mapModalOverlay) {
    closeMapModal();
  }
});
window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && isMapOpen) {
    closeMapModal();
  }
});

let isPanning = false;
let startX = 0;
let startY = 0;
let startTx = 0;
let startTy = 0;

const startPan = (event) => {
  if (!mapPanzoom) return;
  isPanning = true;
  startX = event.clientX ?? 0;
  startY = event.clientY ?? 0;
  startTx = mapState.tx;
  startTy = mapState.ty;
  mapPanzoom.classList.add("is-panning");
  if (event.pointerId !== undefined) {
    mapPanzoom.setPointerCapture(event.pointerId);
  }
};

const panMove = (event) => {
  if (!isPanning) return;
  const currentX = event.clientX ?? 0;
  const currentY = event.clientY ?? 0;
  mapState.tx = startTx + (currentX - startX);
  mapState.ty = startTy + (currentY - startY);
  renderMapTransform();
};

const endPan = (event) => {
  if (!mapPanzoom) return;
  isPanning = false;
  mapPanzoom.classList.remove("is-panning");
  if (event?.pointerId !== undefined) {
    mapPanzoom.releasePointerCapture(event.pointerId);
  }
};

mapPanzoom?.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  startPan(event);
});
mapPanzoom?.addEventListener("pointermove", (event) => {
  if (isPanning) {
    event.preventDefault();
    panMove(event);
  }
});
mapPanzoom?.addEventListener("pointerup", endPan);
mapPanzoom?.addEventListener("pointerleave", endPan);
mapPanzoom?.addEventListener("pointercancel", endPan);
mapPanzoom?.addEventListener(
  "wheel",
  (event) => {
    event.preventDefault();
    const delta = event.deltaY < 0 ? MAP_WHEEL_STEP : -MAP_WHEEL_STEP;
    handleZoom(delta, { x: event.clientX, y: event.clientY });
  },
  { passive: false }
);

zoomInBtn?.addEventListener("click", () => handleZoom(MAP_ZOOM_STEP));
zoomOutBtn?.addEventListener("click", () => handleZoom(-MAP_ZOOM_STEP));
zoomResetBtn?.addEventListener("click", () => resetMapPosition(true));

window.addEventListener("resize", () => {
  if (isMapOpen) {
    renderMapTransform();
  }
});
