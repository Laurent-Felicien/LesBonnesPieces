// ============================================================
// pieces.js — Les Bonnes Pièces v2.0.1
//
// Versionnage SemVer (Semantic Versioning) :
//   MAJOR . MINOR . PATCH
//     2   .   0   .   1
//   └─ MAJOR : refonte totale ou rupture de compatibilité
//   └─ MINOR : nouvelle fonctionnalité ajoutée
//   └─ PATCH : correction de bugs uniquement (c'est notre cas ici)
//
// Architecture :
//   - Pas de back-end : les données sont définies directement ici
//   - Les avis sont sauvegardés dans le localStorage du navigateur
//     (ils persistent même après fermeture du navigateur)
//   - Toutes les fonctions sont appelées depuis init() en bas du fichier
// ============================================================


// ============================================================
// DONNÉES DU CATALOGUE
// Dans une vraie application, ces données viendraient d'une API
// (ex: GET /api/pieces en Laravel). Ici on les écrit directement
// pour que le site fonctionne sans serveur (déploiement statique sur Vercel).
// ============================================================
const PIECES_DATA = [
  {
    id: 1,
    nom: "Ampoule LED",
    prix: 60,
    categorie: "Optiques",
    image: "images/Ampoule-LED.png",
    emoji: "💡",
    description: "Distance d'éclairage : 100 mètres. Longue durée de vie garantie.",
    disponibilite: true
  },
  {
    id: 2,
    nom: "Plaquettes de frein (x4)",
    prix: 40,
    categorie: "Freinage",
    image: "images/Plaquettes-de-frein(x4).jpg",
    emoji: "🛑",
    description: "Qualité de freinage optimale par tous les temps.",
    disponibilite: true
  },
  {
    id: 3,
    nom: "Ampoule boîte à gants",
    prix: 5.49,
    categorie: "Optiques",
    image: "images/ampoule-boite-gants.jpg",
    emoji: "🔆",
    description: "Pour y voir clair dans l'habitacle.",
    disponibilite: false
  },
  {
    id: 4,
    nom: "Liquide de frein",
    prix: 9.60,
    categorie: "Freinage",
    image: "images/Liquide-de-frein.webp",
    emoji: "🧴",
    description: "Haute performance, compatible tous véhicules.",
    disponibilite: true
  },
  {
    id: 5,
    nom: "Balai d'essuie-glace",
    prix: 29.10,
    categorie: "Carrosserie",
    image: "images/Balai-dessuie-glace.jpg",
    emoji: "🌧️",
    description: "Performances d'essuyage optimales. Longueur : 550 mm.",
    disponibilite: true
  }
];


// ============================================================
// ÉTAT DE L'APPLICATION
// Cet objet centralise tous les filtres actifs à un instant T.
// Quand l'utilisateur change un filtre, on met à jour cet objet
// puis on rappelle afficherPieces() qui relit l'état pour décider
// quelles pièces afficher et dans quel ordre.
// ============================================================
let etat = {
  search:    "",        // texte tapé dans la barre de recherche
  prixMax:   60,        // valeur max du slider de prix
  categorie: null,      // catégorie choisie (null = toutes)
  sort:      "default", // "default" | "asc" (croissant) | "desc" (décroissant)
  filter:    null       // filtre rapide : null | "abordable" | "dispo" | "desc-only"
};

// Dictionnaire des avis : { 1: [{utilisateur, commentaire, nbEtoiles}, ...], 2: [...] }
// Chargé depuis le localStorage au démarrage, mis à jour à chaque nouvel avis.
let avisMap = {};


// ============================================================
// INITIALISATION
// Point d'entrée — appelé une seule fois au chargement de la page.
// L'ordre est important : on charge les données avant d'afficher.
// ============================================================
function init() {
  chargerAvis();         // 1. Charger les avis depuis localStorage
  mettreAJourStats();    // 2. Afficher les chiffres dans le hero (total, dispo, abordable)
  genererCategories();   // 3. Créer les boutons de catégorie dynamiquement
  remplirSelectPieces(); // 4. Remplir la liste déroulante du formulaire d'avis
  afficherPieces();      // 5. Afficher toutes les cartes pièces
  ajouterEcouteurs();    // 6. Brancher tous les événements (recherche, slider, tri...)
  initFormulaire();      // 7. Gérer le formulaire d'avis (étoiles + soumission)
  mettreAJourAnnee();    // 8. Injecter l'année courante dans le footer
}


// ============================================================
// ANNÉE DYNAMIQUE — footer
// On récupère l'année via JavaScript pour ne pas avoir à
// mettre à jour le HTML manuellement chaque année.
// ============================================================
function mettreAJourAnnee() {
  const annee = new Date().getFullYear();

  // getElementById peut retourner null si l'élément n'existe pas → on vérifie
  const el = document.getElementById("annee");
  if (el) el.textContent = annee;

  // querySelectorAll retourne une NodeList (jamais null, juste vide si rien trouvé)
  document.querySelectorAll(".annee2").forEach(el => el.textContent = annee);
}


// ============================================================
// SELECT PIÈCES — liste déroulante du formulaire
// Plutôt que de demander à l'utilisateur de taper un ID qu'il
// ne connaît pas, on génère un <select> avec le nom et le prix
// de chaque pièce. Bien plus user-friendly.
// ============================================================
function remplirSelectPieces() {
  const select = document.getElementById("select-piece");
  if (!select) return; // sécurité : on sort si l'élément n'existe pas dans le HTML

  // On repart d'une liste propre avec juste l'option par défaut
  select.innerHTML = `<option value="">— Choisir une pièce —</option>`;

  for (const piece of PIECES_DATA) {
    const option = document.createElement("option");
    option.value = piece.id;
    // On affiche "Nom — prix €" pour que l'utilisateur identifie bien la pièce
    option.textContent = piece.nom;
    select.appendChild(option);
  }
}


// ============================================================
// AVIS — lecture et écriture dans le localStorage
// Le localStorage stocke des données clé/valeur sous forme de texte.
// Il persiste même après fermeture de l'onglet ou du navigateur.
// On stocke les avis sous la clé "avis-piece-{id}" au format JSON.
// ============================================================
function chargerAvis() {
  for (const piece of PIECES_DATA) {
    const json = localStorage.getItem(`avis-piece-${piece.id}`);
    // Si aucun avis sauvegardé → on initialise avec un tableau vide
    avisMap[piece.id] = json ? JSON.parse(json) : [];
  }
}

function sauvegarderAvis(pieceId) {
  // JSON.stringify convertit le tableau JS en texte pour le stocker
  localStorage.setItem(`avis-piece-${pieceId}`, JSON.stringify(avisMap[pieceId]));
}


// ============================================================
// STATS — chiffres affichés dans le hero (section du haut)
// ============================================================
function mettreAJourStats() {
  document.getElementById("stat-total").textContent = PIECES_DATA.length;

  // .filter() retourne un nouveau tableau avec seulement les éléments qui passent le test
  document.getElementById("stat-dispo").textContent =
    PIECES_DATA.filter(p => p.disponibilite).length;

  document.getElementById("stat-abordable").textContent =
    PIECES_DATA.filter(p => p.prix <= 35).length;
}


// ============================================================
// CATÉGORIES — boutons dynamiques dans la sidebar
// On utilise Set pour éliminer automatiquement les doublons.
// La délégation d'événement sur le container est plus performante
// que d'attacher un écouteur sur chaque bouton individuellement.
// ============================================================
function genererCategories() {
  // new Set(...) élimine les doublons | [...] le convertit en tableau
  const categories = [...new Set(PIECES_DATA.map(p => p.categorie).filter(Boolean))];
  const container  = document.getElementById("categories");

  // Bouton "Toutes" actif par défaut
  container.appendChild(creerBoutonCategorie("Toutes", "", true));

  // Un bouton par catégorie unique trouvée dans les données
  for (const cat of categories) {
    container.appendChild(creerBoutonCategorie(cat, cat, false));
  }

  // Délégation d'événement : un seul écouteur sur le container parent
  // plutôt qu'un écouteur sur chaque bouton. Plus efficace.
  container.addEventListener("click", (e) => {
    // .closest() remonte le DOM jusqu'à trouver un ancêtre avec la classe .cat-btn
    const btn = e.target.closest(".cat-btn");
    if (!btn) return; // clic en dehors d'un bouton → on ignore

    container.querySelectorAll(".cat-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    // dataset.cat correspond à l'attribut data-cat="" dans le HTML
    etat.categorie = btn.dataset.cat || null; // chaîne vide → null (= pas de filtre)
    afficherPieces();
  });
}

// Crée et retourne un bouton de catégorie configuré
function creerBoutonCategorie(label, valeur, actif) {
  const btn = document.createElement("button");
  btn.className = `cat-btn${actif ? " active" : ""}`;
  btn.textContent = label;
  btn.dataset.cat = valeur; // stocké dans l'attribut data-cat du HTML
  return btn;
}


// ============================================================
// FILTRAGE ET TRI
// Lit l'objet "etat" et retourne une liste de pièces filtrées et triées.
// On travaille sur une copie du tableau pour ne jamais modifier PIECES_DATA.
// ============================================================
function getPiecesFiltrees() {
  // ... (spread operator) crée une copie du tableau, sans modifier l'original
  let pieces = [...PIECES_DATA];

  // Filtre texte : toLowerCase() pour ignorer la casse (FREIN = frein = Frein)
  if (etat.search) {
    const terme = etat.search.toLowerCase();
    pieces = pieces.filter(p => p.nom.toLowerCase().includes(terme));
  }

  // Filtre slider : on garde seulement les pièces dont le prix ≤ prixMax
  pieces = pieces.filter(p => p.prix <= etat.prixMax);

  // Filtre catégorie (null = pas de filtre → on garde tout)
  if (etat.categorie) pieces = pieces.filter(p => p.categorie === etat.categorie);

  // Filtres rapides (un seul actif à la fois)
  if (etat.filter === "abordable") pieces = pieces.filter(p => p.prix <= 35);
  if (etat.filter === "dispo")     pieces = pieces.filter(p => p.disponibilite);
  if (etat.filter === "desc-only") pieces = pieces.filter(p => p.description);

  // Tri par prix via la fonction de comparaison de .sort() :
  // (a, b) → négatif : a avant b | positif : b avant a | 0 : égal
  if (etat.sort === "asc")  pieces.sort((a, b) => a.prix - b.prix); // croissant
  if (etat.sort === "desc") pieces.sort((a, b) => b.prix - a.prix); // décroissant

  return pieces;
}


// ============================================================
// AFFICHAGE DES PIÈCES
// Vide le container et le remplit avec les cartes filtrées.
// Affiche un message "empty state" si aucun résultat.
// ============================================================
function afficherPieces() {
  const pieces       = getPiecesFiltrees();
  const container    = document.getElementById("fiches");
  const emptyState   = document.getElementById("empty-state");
  const resultsCount = document.getElementById("results-count");

  // On vide le container avant de le remplir (évite les doublons)
  container.innerHTML = "";

  // Mise à jour du compteur ex: "3 pièces trouvées"
  const n = pieces.length;
  resultsCount.textContent = `${n} pièce${n > 1 ? "s" : ""} trouvée${n > 1 ? "s" : ""}`;

  if (n === 0) {
    emptyState.style.display = "block"; // on affiche le message "aucun résultat"
    return; // on sort sans afficher de cartes
  }

  emptyState.style.display = "none";

  for (const piece of pieces) {
    container.appendChild(creerCarte(piece));
  }
}


// ============================================================
// CRÉATION D'UNE CARTE HTML
// Reçoit un objet pièce, retourne un élément <article> DOM complet.
// On construit le HTML interne avec innerHTML, puis on attache
// l'écouteur sur le bouton après coup.
// ============================================================
function creerCarte(piece) {
  const card = document.createElement("article");

  // "dispo" ou "rupture" → contrôle la couleur de la barre en haut de la carte via CSS
  // (définie par .card.dispo::before et .card.rupture::before)
  card.className = `card ${piece.disponibilite ? "dispo" : "rupture"}`;

  // ?. = optional chaining : accède à .length sans planter si avisMap[id] est undefined
  // ?? = nullish coalescing : retourne 0 si le résultat est null ou undefined
  const nbAvis = avisMap[piece.id]?.length ?? 0;

  // Prix ≤ 35€ → classe "abordable" (vert) | sinon "normal" (ambre)
  const estAbordable = piece.prix <= 35;

  card.innerHTML = `
    <div class="card-img-zone">
      <img
        src="${piece.image}"
        alt="${piece.nom}"
        onerror="this.style.display='none'; this.nextElementSibling.style.display='block'"
        loading="lazy"
      >
      <!-- Affiché seulement si l'image ne charge pas (onerror ci-dessus) -->
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

  // On attache l'écouteur après l'injection du HTML (sinon le bouton n'existe pas encore)
  card.querySelector(".btn-avis").addEventListener("click", () => ouvrirModal(piece));
  return card;
}


// ============================================================
// PROTECTION XSS (Cross-Site Scripting)
// Si un utilisateur tape du HTML dans un champ texte (ex: <script>alert()>),
// cette fonction le convertit en texte inoffensif avant l'affichage.
// Sans ça, le code injecté pourrait s'exécuter dans le navigateur.
// ============================================================
function escapeHTML(str) {
  return str
    .replace(/&/g, "&amp;")  // & en premier (sinon on double-escape les autres)
    .replace(/</g, "&lt;")   // empêche l'ouverture de balises HTML
    .replace(/>/g, "&gt;");  // empêche la fermeture de balises HTML
}


// ============================================================
// MODAL AVIS — afficher les avis d'une pièce en popup
// ============================================================
function ouvrirModal(piece) {
  document.getElementById("modal-title").textContent = `Avis — ${piece.nom}`;
  const body = document.getElementById("modal-body");
  const avis = avisMap[piece.id] || [];

  if (avis.length === 0) {
    body.innerHTML = `
      <div class="no-avis">
        Aucun avis pour cette pièce.<br>
        Utilisez le formulaire pour être le premier !
      </div>`;
  } else {
    // .map() transforme chaque avis en HTML | .join("") colle tout sans séparateur
    // "★".repeat(3) → "★★★" | "☆".repeat(2) → "☆☆"
    body.innerHTML = avis.map(a => `
      <div class="avis-item">
        <div class="avis-user">
          <span>${escapeHTML(a.utilisateur)}</span>
          <span class="avis-stars">
            ${"★".repeat(a.nbEtoiles)}${"☆".repeat(5 - a.nbEtoiles)}
          </span>
        </div>
        <div class="avis-comment">${escapeHTML(a.commentaire)}</div>
      </div>
    `).join("");
  }

  document.getElementById("modal-overlay").classList.add("open");
}

// Ferme la modal en retirant la classe "open"
function fermerModal() {
  document.getElementById("modal-overlay").classList.remove("open");
}

// Fermeture par la touche Echap (bonne pratique UX / accessibilité)
document.addEventListener("keydown", e => {
  if (e.key === "Escape") fermerModal();
});


// ============================================================
// FORMULAIRE D'AVIS
// Gère deux choses :
//   1. Le système d'étoiles interactif (survol + clic)
//   2. La soumission et validation du formulaire
// ============================================================
function initFormulaire() {
  const form    = document.getElementById("form-avis");
  const message = document.getElementById("form-message");
  const stars   = document.querySelectorAll("#stars-picker span");
  let note = 0; // note sélectionnée (0 = aucune étoile cliquée)

  // ---- Système d'étoiles ----
  stars.forEach((star, i) => {

    // mouseenter : colore toutes les étoiles jusqu'à celle survolée
    star.addEventListener("mouseenter", () => {
      stars.forEach((s, j) => {
        s.classList.toggle("hover", j <= i); // "hover" si j est ≤ à i
        s.classList.remove("active");         // on cache la sélection pendant le survol
      });
    });

    // mouseleave : on revient à l'état de la note cliquée (ou aucune si pas encore cliqué)
    star.addEventListener("mouseleave", () => {
      stars.forEach((s, j) => {
        s.classList.remove("hover");
        s.classList.toggle("active", j < note); // "active" si j est avant la note choisie
      });
    });

    // click : on enregistre définitivement la note
    star.addEventListener("click", () => {
      note = i + 1; // i commence à 0, la note va de 1 à 5
      document.getElementById("nbEtoiles").value = note; // champ caché dans le formulaire

      stars.forEach((s, j) => {
        s.classList.toggle("active", j < note); // on colore jusqu'à la note
        s.classList.remove("hover");
      });
    });
  });

  // ---- Soumission du formulaire ----
  form.addEventListener("submit", (e) => {
    // preventDefault() empêche le rechargement de la page (comportement HTML par défaut)
    e.preventDefault();

    // Lecture des valeurs
    const selectPiece = document.getElementById("select-piece");
    const pieceId     = parseInt(selectPiece?.value);
    const utilisateur = form.querySelector("[name=utilisateur]").value.trim();
    const commentaire = form.querySelector("[name=commentaire]").value.trim();
    const nbEtoiles   = parseInt(document.getElementById("nbEtoiles").value);

    // Validation : on vérifie chaque champ et on sort tôt si problème
    if (!pieceId) {
      afficherMessage(message, "⚠️ Veuillez choisir une pièce.", "error");
      return;
    }
    if (!utilisateur || !commentaire) {
      afficherMessage(message, "⚠️ Veuillez remplir votre nom et votre avis.", "error");
      return;
    }
    if (!nbEtoiles) {
      afficherMessage(message, "⚠️ Veuillez attribuer une note (cliquez sur les étoiles).", "error");
      return;
    }

    const piece = PIECES_DATA.find(p => p.id === pieceId);
    if (!piece) {
      afficherMessage(message, "⚠️ Pièce introuvable.", "error");
      return;
    }

    // Ajout de l'avis en mémoire + sauvegarde persistante dans localStorage
    avisMap[pieceId].push({ utilisateur, commentaire, nbEtoiles });
    sauvegarderAvis(pieceId);

    afficherMessage(message, `✅ Avis ajouté pour "${piece.nom}" !`, "success");

    // Réinitialisation du formulaire
    form.reset();
    note = 0;
    stars.forEach(s => s.classList.remove("active", "hover"));
    document.getElementById("nbEtoiles").value = 0;

    // On rafraîchit les cartes pour mettre à jour le compteur d'avis sur chaque carte
    afficherPieces();

    // On efface le message de succès après 3 secondes
    setTimeout(() => {
      message.textContent = "";
      message.className = "form-message";
    }, 3000);
  });
}

// Affiche un message de feedback (succès ou erreur) dans le formulaire
function afficherMessage(el, texte, type) {
  el.textContent = texte;
  el.className = `form-message ${type}`; // ex: "form-message success" ou "form-message error"
}


// ============================================================
// ÉCOUTEURS D'ÉVÉNEMENTS
// Branche tous les contrôles interactifs de la sidebar.
// ============================================================
function ajouterEcouteurs() {

  // Recherche : se déclenche à chaque frappe (event "input", plus réactif que "change")
  document.getElementById("search").addEventListener("input", function () {
    etat.search = this.value.trim(); // .trim() enlève les espaces en début et fin
    afficherPieces();
  });

  // Slider prix : se déclenche pendant le glissement du curseur
  document.getElementById("prix-max").addEventListener("input", function () {
    etat.prixMax = parseInt(this.value);
    document.getElementById("prix-label").textContent = `${this.value} €`;
    afficherPieces();
  });

  // Boutons de tri — on retire "active" de tous, puis on l'ajoute au bouton cliqué
  document.querySelectorAll("[data-sort]").forEach(btn => {
    btn.addEventListener("click", function () {
      document.querySelectorAll("[data-sort]").forEach(b => b.classList.remove("active"));
      this.classList.add("active");
      etat.sort = this.dataset.sort; // "default", "asc" ou "desc"
      afficherPieces();
    });
  });

  // Filtres rapides avec comportement toggle :
  // clic sur le filtre actif → on le désactive | clic sur un autre → on bascule
  document.querySelectorAll("[data-filter]").forEach(btn => {
    btn.addEventListener("click", function () {
      if (this.classList.contains("active")) {
        // Toggle off : désactiver le filtre courant
        this.classList.remove("active");
        etat.filter = null;
      } else {
        // Désactiver les autres, activer celui-ci
        document.querySelectorAll("[data-filter]").forEach(b => b.classList.remove("active"));
        this.classList.add("active");
        etat.filter = this.dataset.filter;
      }
      afficherPieces();
    });
  });

  // Bouton "Réinitialiser"
  document.getElementById("btn-reset").addEventListener("click", resetAll);
}


// ============================================================
// RÉINITIALISATION COMPLÈTE
// Remet l'état à ses valeurs initiales et synchronise l'interface.
// ============================================================
function resetAll() {
  // Remise à zéro de l'objet état
  etat = { search: "", prixMax: 60, categorie: null, sort: "default", filter: null };

  // Remise à zéro visuelle de tous les contrôles
  document.getElementById("search").value = "";
  document.getElementById("prix-max").value = 60;
  document.getElementById("prix-label").textContent = "60 €";

  document.querySelectorAll("[data-sort]").forEach(b => b.classList.remove("active"));
  document.querySelector("[data-sort='default']").classList.add("active");

  document.querySelectorAll("[data-filter]").forEach(b => b.classList.remove("active"));

  document.querySelectorAll(".cat-btn").forEach(b => b.classList.remove("active"));
  // ?. = optional chaining : pas d'erreur si l'élément n'existe pas dans le DOM
  document.querySelector(".cat-btn[data-cat='']")?.classList.add("active");

  afficherPieces();
}


// ============================================================
// DÉMARRAGE
// On appelle init() ici, en bas du fichier.
// Grâce à l'attribut "defer" sur <script> dans le HTML,
// ce code s'exécute seulement après que tout le HTML soit chargé.
// ============================================================
init();
