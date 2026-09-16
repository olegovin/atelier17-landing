const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const loaderCount = document.querySelector("#loaderCount");
const loadingStarted = performance.now();
const previewMode = new URLSearchParams(window.location.search).has("preview");
const loadingDuration = previewMode ? 1 : reducedMotion ? 100 : 1600;

function finishLoading() {
  document.body.classList.remove("is-loading");
  document.body.classList.add("is-ready");
}

function updateLoader(now) {
  const elapsed = Math.min((now - loadingStarted) / loadingDuration, 1);
  const eased = 1 - Math.pow(1 - elapsed, 3);
  if (loaderCount) loaderCount.textContent = String(Math.round(eased * 100)).padStart(2, "0");
  if (elapsed < 1) requestAnimationFrame(updateLoader);
  else window.setTimeout(finishLoading, reducedMotion ? 0 : 180);
}

requestAnimationFrame(updateLoader);

const menuToggle = document.querySelector(".menu-toggle");
const mobileMenu = document.querySelector(".mobile-menu");

function closeMenu() {
  menuToggle?.classList.remove("is-open");
  menuToggle?.setAttribute("aria-expanded", "false");
  menuToggle?.setAttribute("aria-label", "Открыть меню");
  mobileMenu?.classList.remove("is-open");
  mobileMenu?.setAttribute("aria-hidden", "true");
}

menuToggle?.addEventListener("click", () => {
  const open = !menuToggle.classList.contains("is-open");
  menuToggle.classList.toggle("is-open", open);
  menuToggle.setAttribute("aria-expanded", String(open));
  menuToggle.setAttribute("aria-label", open ? "Закрыть меню" : "Открыть меню");
  mobileMenu?.classList.toggle("is-open", open);
  mobileMenu?.setAttribute("aria-hidden", String(!open));
});

mobileMenu?.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));

const revealObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add("is-visible");
    observer.unobserve(entry.target);
  });
}, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });

document.querySelectorAll(".reveal").forEach((item) => revealObserver.observe(item));

const wordReveal = document.querySelector(".word-reveal");
if (wordReveal) {
  [...wordReveal.childNodes].forEach((node) => {
    if (node.nodeType !== Node.TEXT_NODE || !node.textContent.trim()) return;
    const fragment = document.createDocumentFragment();
    node.textContent.trim().split(/\s+/).forEach((word, index, words) => {
      const span = document.createElement("span");
      span.className = "word";
      span.textContent = word;
      fragment.append(span);
      if (index < words.length - 1) fragment.append(" ");
    });
    node.replaceWith(fragment);
  });

  const wordObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const words = [...entry.target.querySelectorAll(".word")];
      words.forEach((word, index) => window.setTimeout(() => word.classList.add("is-lit"), index * 70));
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.45 });
  wordObserver.observe(wordReveal);
}

const projects = [
  {
    district: "Пресненский",
    title: "Кухня<br>для высоты",
    address: "Первый Красногвардейский проезд, 22",
    copy: "Монолитный остров длиной 3,2 метра объединяет готовку и вечерний бар. Высокие колонны скрывают всю технику, а матовые фасады не спорят с панорамой города.",
    materials: "Шпон дуба, кварцит",
    time: "68 дней",
    transform: "translate(40px, 80px) scale(1.12)"
  },
  {
    district: "Таганский",
    title: "Тихий графит<br>у воды",
    address: "Котельническая набережная, 1/15",
    copy: "Глубокий графит собрал в одну линию хранение, вытяжку и технику. Тёплый орех внутри пеналов смягчает строгую архитектуру и появляется только при открывании.",
    materials: "Матовый лак, орех",
    time: "74 дня",
    transform: "translate(-96px, -24px) scale(1.08)"
  },
  {
    district: "Хамовники",
    title: "Свет,<br>камень, воздух",
    address: "улица Усачёва, 11",
    copy: "Светлая кухня растворяется в общей гостиной. Рабочая зона спрятана за складными фасадами, а остров из кварцита становится столом для завтраков и домашних встреч.",
    materials: "Эмаль, светлый кварцит",
    time: "63 дня",
    transform: "translate(72px, -96px) scale(1.15)"
  },
  {
    district: "Аэропорт",
    title: "Архитектура<br>для семьи",
    address: "Ленинградский проспект, 36с11",
    copy: "Два полноценных сценария в одном пространстве: быстрый завтрак у окна и большая готовка на острове. Детская посуда находится ниже, повседневная техника скрыта в колонне.",
    materials: "Дуб, сталь, керамика",
    time: "71 день",
    transform: "translate(0, 144px) scale(1.18)"
  }
];

const mapSection = document.querySelector(".map-portfolio");
const projectPanel = document.querySelector(".project-panel");
const projectElements = {
  number: document.querySelector("#projectNumber"),
  district: document.querySelector("#projectDistrict"),
  title: document.querySelector("#projects-title"),
  address: document.querySelector("#projectAddress"),
  copy: document.querySelector("#projectCopy"),
  materials: document.querySelector("#projectMaterials"),
  time: document.querySelector("#projectTime")
};
const markers = [...document.querySelectorAll(".map-marker")];
const progressItems = [...document.querySelectorAll(".project-progress i")];
const mapCanvas = document.querySelector(".map-canvas");
let activeProject = 0;
let mapCycle;
let mapHasStarted = false;

function renderProject(index, immediate = false) {
  const nextIndex = (index + projects.length) % projects.length;
  const project = projects[nextIndex];
  if (!immediate) projectPanel?.classList.add("is-changing");

  const commit = () => {
    activeProject = nextIndex;
    if (projectElements.number) projectElements.number.textContent = `${String(nextIndex + 1).padStart(2, "0")} / 04`;
    if (projectElements.district) projectElements.district.textContent = project.district;
    if (projectElements.title) projectElements.title.innerHTML = project.title;
    if (projectElements.address) projectElements.address.textContent = project.address;
    if (projectElements.copy) projectElements.copy.textContent = project.copy;
    if (projectElements.materials) projectElements.materials.textContent = project.materials;
    if (projectElements.time) projectElements.time.textContent = project.time;
    markers.forEach((marker, markerIndex) => marker.classList.toggle("is-active", markerIndex === nextIndex));
    progressItems.forEach((item, itemIndex) => item.classList.toggle("is-active", itemIndex === nextIndex));
    if (mapCanvas) mapCanvas.style.transform = project.transform;
    projectPanel?.classList.remove("is-changing");
  };

  if (immediate) commit();
  else window.setTimeout(commit, 360);
}

function restartCycle() {
  window.clearInterval(mapCycle);
  if (!reducedMotion && mapHasStarted) {
    mapCycle = window.setInterval(() => renderProject(activeProject + 1), 5200);
  }
}

renderProject(0, true);

markers.forEach((marker) => {
  const activate = () => {
    renderProject(Number(marker.dataset.project));
    restartCycle();
  };
  marker.addEventListener("click", activate);
  marker.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      activate();
    }
  });
});

document.querySelectorAll(".project-controls button").forEach((button) => {
  button.addEventListener("click", () => {
    renderProject(activeProject + (button.dataset.direction === "next" ? 1 : -1));
    restartCycle();
  });
});

if (mapSection) {
  const mapObserver = new IntersectionObserver((entries, observer) => {
    if (!entries[0].isIntersecting) return;
    mapHasStarted = true;
    window.setTimeout(() => {
      mapSection.classList.add("is-started");
      restartCycle();
    }, reducedMotion ? 0 : 1100);
    observer.disconnect();
  }, { threshold: 0.24 });
  mapObserver.observe(mapSection);
  mapSection.addEventListener("mouseenter", () => window.clearInterval(mapCycle));
  mapSection.addEventListener("mouseleave", restartCycle);
  mapSection.addEventListener("focusin", () => window.clearInterval(mapCycle));
  mapSection.addEventListener("focusout", restartCycle);
}

const navAnchors = [...document.querySelectorAll(".nav-links a")];
const navSections = navAnchors.map((anchor) => document.querySelector(anchor.getAttribute("href"))).filter(Boolean);
const navObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    navAnchors.forEach((anchor) => {
      const current = anchor.getAttribute("href") === `#${entry.target.id}`;
      if (current) anchor.setAttribute("aria-current", "page");
      else anchor.removeAttribute("aria-current");
    });
  });
}, { rootMargin: "-40% 0px -50% 0px" });
navSections.forEach((section) => navObserver.observe(section));

const form = document.querySelector(".lead-form");
form?.addEventListener("submit", (event) => {
  event.preventDefault();
  const fields = [...form.querySelectorAll("input")];
  fields.forEach((field) => field.closest("label")?.classList.toggle("has-error", !field.checkValidity()));
  const invalid = fields.find((field) => !field.checkValidity());
  if (invalid) {
    invalid.focus();
    return;
  }

  const button = form.querySelector("button");
  const status = form.querySelector(".form-status");
  button.disabled = true;
  button.textContent = "Отправляем";
  status.textContent = "";

  window.setTimeout(() => {
    button.textContent = "Заявка принята";
    status.textContent = "Дизайнер свяжется с вами в рабочее время";
    form.reset();
    window.setTimeout(() => {
      button.disabled = false;
      button.textContent = "Получить дизайн проект";
    }, 2600);
  }, 900);
});

form?.querySelectorAll("input").forEach((field) => {
  field.addEventListener("input", () => {
    if (field.checkValidity()) field.closest("label")?.classList.remove("has-error");
  });
});

document.querySelectorAll(".accordion details").forEach((detail) => {
  detail.addEventListener("toggle", () => {
    if (!detail.open) return;
    document.querySelectorAll(".accordion details[open]").forEach((other) => {
      if (other !== detail) other.removeAttribute("open");
    });
  });
});
