// ============================================================
// pieces.js — Les Bonnes Pièces (version sans back-end)
// Les données viennent du fichier JSON local.
// Les avis sont sauvegardés dans le localStorage du navigateur.
// ============================================================

// --- DONNÉES ---
// On définit les pièces directement ici (données du fichier pieces-autos.json)
// comme ça le site fonctionne sans serveur.
const PIECES_DATA = [
  {
    "id": 1,
    "nom": "Ampoule LED",
    "prix": 60,
    "categorie": "Optiques",
    "image": "images/ampoule-led.png",
    "emoji": "💡",
    "description": "Distance d'éclairage : 100 mètres !",
    "disponibilite": true
  },
  {
    "id": 2,
    "nom": "Plaquettes de frein (x4)",
    "prix": 40,
    "categorie": "Freinage",
    "image": "images/plaquettes-frein.png",
    "emoji": "🛑",
    "description": "Une qualité de freinage optimale, par tous les temps.",
    "disponibilite": true
  },
  {
    "id": 3,
    "nom": "Ampoule boîte à gants",
    "prix": 5.49,
    "categorie": "Optiques",
    "image": "images/ampoule-boite-a-gants.png",
    "emoji": "🔆",
    "description": "Pour y voir clair dans l'habitacle.",
    "disponibilite": false
  },
  {
    "id": 4,
    "nom": "Liquide de frein",
    "prix": 9.60,
    "categorie": "Freinage",
    "image": "images/liquide-frein.png",
    "emoji": "🧴",
    "description": "Liquide de frein haute performance, compatible tous véhicules.",
    "disponibilite": true
  },
  {
    "id": 5,
    "nom": "Balai d'essuie-glace",
    "prix": 29.10,
    "categorie": "Carrosserie",
    "image": "images/balai-essuie-glace.png",
    "emoji": "🌧️",
    "description": "Performances d'essuyage au top ! Longueur : 550 mm.",
    "disponibilite": true
  }
];

// --- ÉTAT DE L'APPLICATION ---
// Cet objet contient tous les filtres actifs en ce moment.
let etat = {
  search: "",
  prixMax: 60,
  categorie: null,
  sort: "default",
  filter: null
};

// On stocke ici les avis de chaque pièce (clé = id de la pièce)
let avisMap = {};

// ============================================================
// INITIALISATION — s'exécute quand la page est chargée
// ============================================================
function init() {
  chargerAvisDepuisLocalStorage();
  mettreAJourStats();
  genererCategories();
  afficherPieces();
  ajouterEcouteurs();
}

// ============================================================
// AVIS — chargement depuis le localStorage
// ============================================================
function chargerAvisDepuisLocalStorage() {
  // Pour chaque pièce, on regarde si des avis sont sauvegardés
  for (const piece of PIECES_DATA) {
    const cle = `avis-piece-${piece.id}`;
    const avisJSON = localStorage.getItem(cle);
    if (avisJSON) {
      avisMap[piece.id] = JSON.parse(avisJSON);
    } else {
      avisMap[piece.id] = [];
    }
  }
}

// ============================================================
// STATS — les chiffres dans le header
// ============================================================
function mettreAJourStats() {
  const total = PIECES_DATA.length;
  const dispo = PIECES_DATA.filter(p => p.disponibilite).length;
  const abordable = PIECES_DATA.filter(p => p.prix <= 35).length;

  document.getElementById("stat-total").textContent = total;
  document.getElementById("stat-dispo").textContent = dispo;
  document.getElementById("stat-abordable").textContent = abordable;
}

// ============================================================
// CATÉGORIES — boutons dans la sidebar
// ============================================================
function genererCategories() {
  // On récupère toutes les catégories uniques
  const categories = [...new Set(PIECES_DATA.map(p => p.categorie).filter(Boolean))];
  const container = document.getElementById("categories");

  // Bouton "Toutes"
  const btnToutes = document.createElement("button");
  btnToutes.className = "cat-btn active";
  btnToutes.textContent = "Toutes";
  btnToutes.dataset.cat = "";
  container.appendChild(btnToutes);

  // Un bouton par catégorie
  for (const cat of categories) {
    const btn = document.createElement("button");
    btn.className = "cat-btn";
    btn.textContent = cat;
    btn.dataset.cat = cat;
    container.appendChild(btn);
  }

  // Écouteur sur le container (on utilise la délégation d'événements)
  container.addEventListener("click", function(e) {
    const btn = e.target.closest(".cat-btn");
    if (!btn) return;

    // On retire "active" de tous les boutons
    container.querySelectorAll(".cat-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    // On met à jour l'état
    etat.categorie = btn.dataset.cat || null;
    afficherPieces();
  });
}

// ============================================================
// FILTRAGE & TRI — retourne les pièces filtrées
// ============================================================
function getPiecesFiltrees() {
  let pieces = [...PIECES_DATA];

  // Filtre par recherche texte
  if (etat.search) {
    const terme = etat.search.toLowerCase();
    pieces = pieces.filter(p => p.nom.toLowerCase().includes(terme));
  }

  // Filtre par prix maximum
  pieces = pieces.filter(p => p.prix <= etat.prixMax);

  // Filtre par catégorie
  if (etat.categorie) {
    pieces = pieces.filter(p => p.categorie === etat.categorie);
  }

  // Filtres rapides
  if (etat.filter === "abordable") pieces = pieces.filter(p => p.prix <= 35);
  if (etat.filter === "dispo") pieces = pieces.filter(p => p.disponibilite);
  if (etat.filter === "desc-only") pieces = pieces.filter(p => p.description);

  // Tri
  if (etat.sort === "asc") pieces.sort((a, b) => a.prix - b.prix);
  if (etat.sort === "desc") pieces.sort((a, b) => b.prix - a.prix);

  return pieces;
}

// ============================================================
// AFFICHAGE DES PIÈCES — génère les cartes HTML
// ============================================================
function afficherPieces() {
  const pieces = getPiecesFiltrees();
  const container = document.getElementById("fiches");
  const emptyState = document.getElementById("empty-state");
  const resultsCount = document.getElementById("results-count");

  // Vider le container
  container.innerHTML = "";

  // Mettre à jour le compteur de résultats
  resultsCount.textContent = `${pieces.length} pièce${pieces.length > 1 ? "s" : ""} trouvée${pieces.length > 1 ? "s" : ""}`;

  if (pieces.length === 0) {
    emptyState.style.display = "block";
    return;
  }

  emptyState.style.display = "none";

  // Générer une carte pour chaque pièce
  for (const piece of pieces) {
    const card = creerCarteHTML(piece);
    container.appendChild(card);
  }
}

// ============================================================
// CRÉATION D'UNE CARTE — retourne un élément DOM
// ============================================================
function creerCarteHTML(piece) {
  const card = document.createElement("article");
  card.className = "card";

  // Nombre d'avis pour cette pièce
  const nbAvis = avisMap[piece.id]?.length ?? 0;
  const estAbordable = piece.prix <= 35;

  card.innerHTML = `
    <div class="card-img-zone">
      <img
        src="${piece.image}"
        alt="${piece.nom}"
        onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'"
      >
      <div class="card-img-fallback" style="display:none">${piece.emoji || "🔩"}</div>
      <span class="badge-stock ${piece.disponibilite ? 'ok' : 'no'}">
        ${piece.disponibilite ? "En stock" : "Rupture"}
      </span>
    </div>
    <div class="card-body">
      <div class="card-cat">${piece.categorie || "Non catégorisé"}</div>
      <div class="card-nom">${piece.nom}</div>
      <div class="card-desc">${piece.description || "Pas de description."}</div>
    </div>
    <div class="card-footer">
      <div class="card-prix ${estAbordable ? 'abordable' : 'cher'}">${piece.prix.toFixed(2)} €</div>
      <button class="btn-avis" data-id="${piece.id}">
        💬 ${nbAvis > 0 ? `${nbAvis} avis` : "Avis"}
      </button>
    </div>
  `;

  // Écouteur sur le bouton "Avis"
  card.querySelector(".btn-avis").addEventListener("click", () => {
    ouvrirModal(piece);
  });

  return card;
}

// ============================================================
// MODAL AVIS — afficher les avis d'une pièce
// ============================================================
function ouvrirModal(piece) {
  const overlay = document.getElementById("modal-overlay");
  const modalTitle = document.getElementById("modal-title");
  const modalBody = document.getElementById("modal-body");

  modalTitle.textContent = `Avis — ${piece.nom}`;

  const avis = avisMap[piece.id] || [];

  if (avis.length === 0) {
    modalBody.innerHTML = `<div class="no-avis">Aucun avis pour le moment.<br>Soyez le premier à en laisser un !</div>`;
  } else {
    modalBody.innerHTML = avis.map(a => `
      <div class="avis-item">
        <div class="avis-user">
          <span>${a.utilisateur}</span>
          <span class="avis-stars">${"★".repeat(a.nbEtoiles)}${"☆".repeat(5 - a.nbEtoiles)}</span>
        </div>
        <div class="avis-comment">${a.commentaire}</div>
      </div>
    `).join("");
  }

  overlay.classList.add("open");
}

function fermerModal() {
  document.getElementById("modal-overlay").classList.remove("open");
}

// Fermer la modal avec Echap
document.addEventListener("keydown", e => {
  if (e.key === "Escape") fermerModal();
});

// ============================================================
// FORMULAIRE AVIS — envoyer un avis
// ============================================================
function initFormulaire() {
  const form = document.getElementById("form-avis");
  const message = document.getElementById("form-message");

  // Gestion des étoiles (clic)
  const stars = document.querySelectorAll("#stars-picker span");
  let noteSelectionnee = 0;

  stars.forEach((star, index) => {
    // Au survol : colorer jusqu'à l'étoile survolée
    star.addEventListener("mouseenter", () => {
      stars.forEach((s, i) => {
        s.classList.toggle("hover", i <= index);
      });
    });

    // Quand la souris quitte : revenir à la note sélectionnée
    star.addEventListener("mouseleave", () => {
      stars.forEach((s, i) => {
        s.classList.remove("hover");
        s.classList.toggle("active", i < noteSelectionnee);
      });
    });

    // Au clic : enregistrer la note
    star.addEventListener("click", () => {
      noteSelectionnee = index + 1;
      document.getElementById("nbEtoiles").value = noteSelectionnee;
      stars.forEach((s, i) => s.classList.toggle("active", i < noteSelectionnee));
    });
  });

  // Soumission du formulaire
  form.addEventListener("submit", function(e) {
    e.preventDefault();

    const pieceId = parseInt(form.querySelector("[name=piece-id]").value);
    const utilisateur = form.querySelector("[name=utilisateur]").value.trim();
    const commentaire = form.querySelector("[name=commentaire]").value.trim();
    const nbEtoiles = parseInt(document.getElementById("nbEtoiles").value);

    // Validation simple
    if (!pieceId || !utilisateur || !commentaire || !nbEtoiles) {
      message.textContent = "⚠️ Veuillez remplir tous les champs.";
      message.className = "form-message error";
      return;
    }

    // Vérifier que la pièce existe
    const piece = PIECES_DATA.find(p => p.id === pieceId);
    if (!piece) {
      message.textContent = "⚠️ Aucune pièce avec cet identifiant.";
      message.className = "form-message error";
      return;
    }

    // Créer l'objet avis
    const nouvelAvis = { utilisateur, commentaire, nbEtoiles };

    // Sauvegarder dans le tableau en mémoire
    if (!avisMap[pieceId]) avisMap[pieceId] = [];
    avisMap[pieceId].push(nouvelAvis);

    // Sauvegarder dans le localStorage pour persister entre les visites
    localStorage.setItem(`avis-piece-${pieceId}`, JSON.stringify(avisMap[pieceId]));

    // Message de succès
    message.textContent = `✅ Avis ajouté pour "${piece.nom}" !`;
    message.className = "form-message success";

    // Réinitialiser le formulaire
    form.reset();
    noteSelectionnee = 0;
    stars.forEach(s => { s.classList.remove("active", "hover"); });
    document.getElementById("nbEtoiles").value = 0;

    // Rafraîchir l'affichage (les boutons avis montrent le bon nombre)
    afficherPieces();

    // Effacer le message après 3 secondes
    setTimeout(() => { message.textContent = ""; }, 3000);
  });
}

// ============================================================
// ÉCOUTEURS D'ÉVÉNEMENTS — tous les contrôles de la page
// ============================================================
function ajouterEcouteurs() {
  // Barre de recherche
  document.getElementById("search").addEventListener("input", function() {
    etat.search = this.value.trim();
    afficherPieces();
  });

  // Slider prix max
  const slider = document.getElementById("prix-max");
  slider.addEventListener("input", function() {
    etat.prixMax = parseInt(this.value);
    document.getElementById("prix-label").textContent = `${this.value}€`;
    afficherPieces();
  });

  // Boutons de tri
  document.querySelectorAll("[data-sort]").forEach(btn => {
    btn.addEventListener("click", function() {
      document.querySelectorAll("[data-sort]").forEach(b => b.classList.remove("active"));
      this.classList.add("active");
      etat.sort = this.dataset.sort;
      afficherPieces();
    });
  });

  // Boutons de filtres rapides
  document.querySelectorAll("[data-filter]").forEach(btn => {
    btn.addEventListener("click", function() {
      // Si le filtre est déjà actif, on le désactive (toggle)
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

  // Bouton réinitialiser
  document.getElementById("btn-reset").addEventListener("click", resetAll);

  // Initialiser le formulaire d'avis
  initFormulaire();
}

// ============================================================
// RESET — remettre tous les filtres à zéro
// ============================================================
function resetAll() {
  etat = { search: "", prixMax: 60, categorie: null, sort: "default", filter: null };

  document.getElementById("search").value = "";
  document.getElementById("prix-max").value = 60;
  document.getElementById("prix-label").textContent = "60€";

  document.querySelectorAll("[data-sort]").forEach(b => b.classList.remove("active"));
  document.querySelector("[data-sort='default']").classList.add("active");

  document.querySelectorAll("[data-filter]").forEach(b => b.classList.remove("active"));

  document.querySelectorAll(".cat-btn").forEach(b => b.classList.remove("active"));
  document.querySelector(".cat-btn[data-cat='']").classList.add("active");

  afficherPieces();
}

// ============================================================
// DÉMARRAGE
// ============================================================
init();
