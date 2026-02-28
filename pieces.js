// ============================================================
// pieces.js — Les Bonnes Pièces v2.0.0
// Données embarquées, avis en localStorage, sans back-end
// ============================================================

const PIECES_DATA = [
  {
    id: 1,
    nom: "Ampoule LED",
    prix: 60,
    categorie: "Optiques",
    image: "images/ampoule-led.png",
    emoji: "💡",
    description: "Distance d'éclairage : 100 mètres. Longue durée de vie garantie.",
    disponibilite: true
  },
  {
    id: 2,
    nom: "Plaquettes de frein (x4)",
    prix: 40,
    categorie: "Freinage",
    image: "images/plaquettes-frein.png",
    emoji: "🛑",
    description: "Qualité de freinage optimale par tous les temps.",
    disponibilite: true
  },
  {
    id: 3,
    nom: "Ampoule boîte à gants",
    prix: 5.49,
    categorie: "Optiques",
    image: "images/ampoule-boite-a-gants.png",
    emoji: "🔆",
    description: "Pour y voir clair dans l'habitacle.",
    disponibilite: false
  },
  {
    id: 4,
    nom: "Liquide de frein",
    prix: 9.60,
    categorie: "Freinage",
    image: "images/liquide-frein.png",
    emoji: "🧴",
    description: "Haute performance, compatible tous véhicules.",
    disponibilite: true
  },
  {
    id: 5,
    nom: "Balai d'essuie-glace",
    prix: 29.10,
    categorie: "Carrosserie",
    image: "images/balai-essuie-glace.png",
    emoji: "🌧️",
    description: "Performances d'essuyage optimales. Longueur : 550 mm.",
    disponibilite: true
  }
];

// ============================================================
// ÉTAT — tous les filtres actifs
// ============================================================
let etat = {
  search: "",
  prixMax: 60,
  categorie: null,
  sort: "default",
  filter: null
};

// Avis par pièce (id → tableau d'avis)
let avisMap = {};

// ============================================================
// INIT
// ============================================================
function init() {
  chargerAvis();
  mettreAJourStats();
  genererCategories();
  afficherPieces();
  ajouterEcouteurs();
  initFormulaire();
  mettreAJourAnnee();
}

// ============================================================
// ANNÉE DYNAMIQUE dans le footer
// ============================================================
function mettreAJourAnnee() {
  const annee = new Date().getFullYear();
  // On met l'année dans tous les éléments qui l'affichent
  document.getElementById("annee")?.textContent = annee;
  document.querySelectorAll(".annee2").forEach(el => el.textContent = annee);
}

// ============================================================
// AVIS — localStorage
// ============================================================
function chargerAvis() {
  for (const piece of PIECES_DATA) {
    const json = localStorage.getItem(`avis-piece-${piece.id}`);
    avisMap[piece.id] = json ? JSON.parse(json) : [];
  }
}

function sauvegarderAvis(pieceId) {
  localStorage.setItem(`avis-piece-${pieceId}`, JSON.stringify(avisMap[pieceId]));
}

// ============================================================
// STATS header
// ============================================================
function mettreAJourStats() {
  document.getElementById("stat-total").textContent = PIECES_DATA.length;
  document.getElementById("stat-dispo").textContent = PIECES_DATA.filter(p => p.disponibilite).length;
  document.getElementById("stat-abordable").textContent = PIECES_DATA.filter(p => p.prix <= 35).length;
}

// ============================================================
// CATÉGORIES sidebar
// ============================================================
function genererCategories() {
  const categories = [...new Set(PIECES_DATA.map(p => p.categorie).filter(Boolean))];
  const container = document.getElementById("categories");

  // Bouton "Toutes"
  const btnToutes = creerBoutonCategorie("Toutes", "", true);
  container.appendChild(btnToutes);

  for (const cat of categories) {
    container.appendChild(creerBoutonCategorie(cat, cat, false));
  }

  // Délégation d'événement sur le container
  container.addEventListener("click", (e) => {
    const btn = e.target.closest(".cat-btn");
    if (!btn) return;

    container.querySelectorAll(".cat-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    etat.categorie = btn.dataset.cat || null;
    afficherPieces();
  });
}

function creerBoutonCategorie(label, valeur, actif) {
  const btn = document.createElement("button");
  btn.className = `cat-btn${actif ? " active" : ""}`;
  btn.textContent = label;
  btn.dataset.cat = valeur;
  return btn;
}

// ============================================================
// FILTRAGE
// ============================================================
function getPiecesFiltrees() {
  let pieces = [...PIECES_DATA];

  if (etat.search) {
    const terme = etat.search.toLowerCase();
    pieces = pieces.filter(p => p.nom.toLowerCase().includes(terme));
  }

  pieces = pieces.filter(p => p.prix <= etat.prixMax);

  if (etat.categorie) pieces = pieces.filter(p => p.categorie === etat.categorie);
  if (etat.filter === "abordable") pieces = pieces.filter(p => p.prix <= 35);
  if (etat.filter === "dispo") pieces = pieces.filter(p => p.disponibilite);
  if (etat.filter === "desc-only") pieces = pieces.filter(p => p.description);

  if (etat.sort === "asc")  pieces.sort((a, b) => a.prix - b.prix);
  if (etat.sort === "desc") pieces.sort((a, b) => b.prix - a.prix);

  return pieces;
}

// ============================================================
// AFFICHAGE DES PIÈCES
// ============================================================
function afficherPieces() {
  const pieces = getPiecesFiltrees();
  const container = document.getElementById("fiches");
  const emptyState = document.getElementById("empty-state");
  const resultsCount = document.getElementById("results-count");

  container.innerHTML = "";

  const n = pieces.length;
  resultsCount.textContent = `${n} pièce${n > 1 ? "s" : ""} trouvée${n > 1 ? "s" : ""}`;

  if (n === 0) {
    emptyState.style.display = "block";
    return;
  }

  emptyState.style.display = "none";

  for (const piece of pieces) {
    container.appendChild(creerCarte(piece));
  }
}

// ============================================================
// CARTE
// ============================================================
function creerCarte(piece) {
  const card = document.createElement("article");
  // Classe dispo/rupture pour la ligne de couleur en haut
  card.className = `card ${piece.disponibilite ? "dispo" : "rupture"}`;

  const nbAvis = avisMap[piece.id]?.length ?? 0;
  const estAbordable = piece.prix <= 35;

  card.innerHTML = `
    <div class="card-img-zone">
      <img
        src="${piece.image}"
        alt="${piece.nom}"
        onerror="this.style.display='none'; this.nextElementSibling.style.display='block'"
        loading="lazy"
      >
      <div class="card-img-fallback">${piece.emoji || "🔩"}</div>
      <span class="badge-stock ${piece.disponibilite ? "ok" : "no"}">
        ${piece.disponibilite ? "En stock" : "Rupture"}
      </span>
    </div>
    <div class="card-body">
      <div class="card-cat">${piece.categorie || "Non catégorisé"}</div>
      <div class="card-nom">${piece.nom}</div>
      <div class="card-desc">${piece.description || "Aucune description."}</div>
    </div>
    <div class="card-footer">
      <div class="card-prix ${estAbordable ? "abordable" : "normal"}">
        ${piece.prix.toFixed(2)} €
      </div>
      <button class="btn-avis" data-id="${piece.id}">
        💬 ${nbAvis > 0 ? `${nbAvis} avis` : "Avis"}
      </button>
    </div>
  `;

  card.querySelector(".btn-avis").addEventListener("click", () => ouvrirModal(piece));
  return card;
}

// ============================================================
// MODAL AVIS
// ============================================================
function ouvrirModal(piece) {
  document.getElementById("modal-title").textContent = `Avis — ${piece.nom}`;
  const body = document.getElementById("modal-body");
  const avis = avisMap[piece.id] || [];

  if (avis.length === 0) {
    body.innerHTML = `<div class="no-avis">Aucun avis pour cette pièce.<br>Utilisez le formulaire pour être le premier !</div>`;
  } else {
    body.innerHTML = avis.map(a => `
      <div class="avis-item">
        <div class="avis-user">
          <span>${escapeHTML(a.utilisateur)}</span>
          <span class="avis-stars">${"★".repeat(a.nbEtoiles)}${"☆".repeat(5 - a.nbEtoiles)}</span>
        </div>
        <div class="avis-comment">${escapeHTML(a.commentaire)}</div>
      </div>
    `).join("");
  }

  document.getElementById("modal-overlay").classList.add("open");
}

// Sécurité basique : éviter l'injection HTML dans les avis
function escapeHTML(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function fermerModal() {
  document.getElementById("modal-overlay").classList.remove("open");
}

document.addEventListener("keydown", e => { if (e.key === "Escape") fermerModal(); });

// ============================================================
// FORMULAIRE AVIS
// ============================================================
function initFormulaire() {
  const form = document.getElementById("form-avis");
  const message = document.getElementById("form-message");
  const stars = document.querySelectorAll("#stars-picker span");
  let note = 0;

  // Gestion étoiles
  stars.forEach((star, i) => {
    star.addEventListener("mouseenter", () => {
      stars.forEach((s, j) => s.classList.toggle("hover", j <= i));
    });
    star.addEventListener("mouseleave", () => {
      stars.forEach((s, j) => { s.classList.remove("hover"); s.classList.toggle("active", j < note); });
    });
    star.addEventListener("click", () => {
      note = i + 1;
      document.getElementById("nbEtoiles").value = note;
      stars.forEach((s, j) => s.classList.toggle("active", j < note));
    });
  });

  // Soumission
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const pieceId  = parseInt(form.querySelector("[name=piece-id]").value);
    const utilisateur = form.querySelector("[name=utilisateur]").value.trim();
    const commentaire = form.querySelector("[name=commentaire]").value.trim();
    const nbEtoiles   = parseInt(document.getElementById("nbEtoiles").value);

    if (!pieceId || !utilisateur || !commentaire || !nbEtoiles) {
      afficherMessage(message, "⚠️ Veuillez remplir tous les champs et noter la pièce.", "error");
      return;
    }

    const piece = PIECES_DATA.find(p => p.id === pieceId);
    if (!piece) {
      afficherMessage(message, "⚠️ Aucune pièce avec cet identifiant.", "error");
      return;
    }

    avisMap[pieceId].push({ utilisateur, commentaire, nbEtoiles });
    sauvegarderAvis(pieceId);

    afficherMessage(message, `✅ Avis ajouté pour "${piece.nom}" !`, "success");

    form.reset();
    note = 0;
    stars.forEach(s => s.classList.remove("active", "hover"));
    document.getElementById("nbEtoiles").value = 0;

    afficherPieces(); // met à jour le compteur d'avis sur la carte

    setTimeout(() => { message.textContent = ""; message.className = "form-message"; }, 3000);
  });
}

function afficherMessage(el, texte, type) {
  el.textContent = texte;
  el.className = `form-message ${type}`;
}

// ============================================================
// ÉCOUTEURS
// ============================================================
function ajouterEcouteurs() {
  // Recherche
  document.getElementById("search").addEventListener("input", function () {
    etat.search = this.value.trim();
    afficherPieces();
  });

  // Slider prix
  document.getElementById("prix-max").addEventListener("input", function () {
    etat.prixMax = parseInt(this.value);
    document.getElementById("prix-label").textContent = `${this.value} €`;
    afficherPieces();
  });

  // Tri
  document.querySelectorAll("[data-sort]").forEach(btn => {
    btn.addEventListener("click", function () {
      document.querySelectorAll("[data-sort]").forEach(b => b.classList.remove("active"));
      this.classList.add("active");
      etat.sort = this.dataset.sort;
      afficherPieces();
    });
  });

  // Filtres rapides (toggle)
  document.querySelectorAll("[data-filter]").forEach(btn => {
    btn.addEventListener("click", function () {
      if (this.classList.contains("active")) {
        this.classList.remove("active");
        etat.filter = null;
      } else {
        document.querySelectorAll("[data-filter]").forEach(b => b.classList.remove("active"));
        this.classList.add("active");
        etat.filter = this.dataset.filter;
      }
      afficherPieces();
    });
  });

  // Reset
  document.getElementById("btn-reset").addEventListener("click", resetAll);
}

// ============================================================
// RESET COMPLET
// ============================================================
function resetAll() {
  etat = { search: "", prixMax: 60, categorie: null, sort: "default", filter: null };

  document.getElementById("search").value = "";
  document.getElementById("prix-max").value = 60;
  document.getElementById("prix-label").textContent = "60 €";

  document.querySelectorAll("[data-sort]").forEach(b => b.classList.remove("active"));
  document.querySelector("[data-sort='default']").classList.add("active");

  document.querySelectorAll("[data-filter]").forEach(b => b.classList.remove("active"));

  document.querySelectorAll(".cat-btn").forEach(b => b.classList.remove("active"));
  document.querySelector(".cat-btn[data-cat='']")?.classList.add("active");

  afficherPieces();
}

// ============================================================
// DÉMARRAGE
// ============================================================
init();
