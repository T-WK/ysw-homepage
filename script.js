const navLinks = document.querySelectorAll(".nav-link");
const sections = document.querySelectorAll("section");

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
