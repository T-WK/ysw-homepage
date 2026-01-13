const navLinks = document.querySelectorAll('.nav-link');
const sections = document.querySelectorAll('section');

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        navLinks.forEach((link) => {
          link.classList.toggle('active', link.dataset.section === id);
        });
      }
    });
  },
  {
    rootMargin: '-40% 0px -50% 0px',
    threshold: 0.2,
  }
);

sections.forEach((section) => observer.observe(section));

navLinks.forEach((link) => {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    const targetId = link.getAttribute('href');
    const target = document.querySelector(targetId);
    if (!target) return;
    target.scrollIntoView({ behavior: 'smooth' });
  });
});

const exploreLinks = document.querySelectorAll('.inline-link');
exploreLinks.forEach((link) => {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    const id = link.dataset.cardId || 'unknown';
    alert(`Explore card: ${id}`);
  });
});
