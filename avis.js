export function ajoutListenersAvis() {

    const piecesElements = document.querySelectorAll(".fiches article button");

    for (let i = 0; i < piecesElements.length; i++) {

        piecesElements[i].addEventListener("click", async function (event) {

            const id = event.target.dataset.id;
            //Récupération de la réponse depuis le fichier JSON
            const reponse = await fetch("http://localhost:8081/pieces/" + id + "/avis");
            // Vérification de la réponse
            const avis = await reponse.json();

            // Transformation des avis en JSON
            const valeurAvis = JSON.stringify(avis);

            // sauvegardez les avis dans le localStorage quand on reçoit la réponse de l’API HTTP à notre requête
            window.localStorage.setItem(`avis-piece-${id}`, valeurAvis);
            // Affichage des avis dans la page
            // Récupération de l'élément parent de l'élément cliqué qui est l'article de la pièce automobile
            const pieceElement = event.target.parentElement;
            afficherAvis(pieceElement, avis);

        });

    }
}

export function afficherAvis(pieceElement, avis) {
    const avisElement = document.createElement("p");
    for (let i = 0; i < avis.length; i++) {
        avisElement.innerHTML += `<b>${avis[i].utilisateur}:</b> ${avis[i].commentaire} <br>`;
    }
    pieceElement.appendChild(avisElement);
}

export function ajoutListenerEnvoyerAvis() {
    const formulaireAvis = document.querySelector(".formulaire-avis");
    formulaireAvis.addEventListener("submit", function (event) {
        event.preventDefault();
        // Création de l’objet du nouvel avis.
        const avis = {
            pieceId: parseInt(event.target.querySelector("[name=piece-id]").value),
            utilisateur: event.target.querySelector("[name=utilisateur]").value,
            commentaire: event.target.querySelector("[name=commentaire]").value,
            nbEtoiles: parseInt(event.target.querySelector("[name=nbEtoiles]").value)
        };
        // Création de la charge utile au format JSON
        const chargeUtile = JSON.stringify(avis);
        // Appel de la fonction fetch avec toutes les informations nécessaires
        fetch("http://localhost:8081/avis", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: chargeUtile
        });
    });

}

export async function afficherGraphiqueAvis() {
    // Calcul du nombre total d'avis par quantité d'étoiles attribuées
    const avis = await fetch("http://localhost:8081/avis").then(avis => avis.json());
    //Ce tableau représente le nombre de commentaires pour chaque nombre d’étoiles, de 1 à 5
    const nb_commentaires = [0, 0, 0, 0, 0];
    for (let commentaire of avis) {
        //Pour chaque commentaire, on regarde combien d’étoiles il a (commentaire.nbEtoiles)
        //On soustrait 1 pour trouver l’indice correct dans le tableau (car les indices commencent à 0).
        //On incrémente (++) le compteur correspondant dans nb_commentaires.
        nb_commentaires[commentaire.nbEtoiles - 1]++;
    }

    // Légende qui s'affichera sur la gauche à côté de la barre horizontale
    const labels = ["5", "4", "3", "2", "1"];
    // Données et personnalisation du graphique
    const data = {
        labels: labels,
        datasets: [{
            label: "Étoiles attribuées",
            data: nb_commentaires.reverse(),
            backgroundColor: "rgba(255, 230, 0, 1)", // couleur jaune
        }],
    };
    // Objet de configuration final
    const config = {
        type: "bar",
        data: data,
        options: {
            indexAxis: "y",
        },
    };
    // Rendu du graphique dans l'élément canvas
    const graphiqueAvis = new Chart(
        document.getElementById("graphique-avis"),
        config,
    );


    //Rajoutez un deuxième graphique sur votre site web. 
    // Ce graphique devra afficher deux barres verticales représentant 
    // chacune la quantité de commentaires déposés sur : 
    // les pièces disponibles 
    // les pièces non disponibles.
    const piecesJSON = window.localStorage.getItem("pieces");
    const pieces = JSON.parse(piecesJSON);
    let nbCommentairesdispo = 0
    let nbCommentairesindispo = 0

    for (let i = 0; i < avis.length; i++) {
        const piece = pieces.find(piece => piece.id === avis[i].pieceId);
        if (piece) {
            if (piece.disponibilite) {
                nbCommentairesdispo++;
            } else {
                nbCommentairesindispo++;
            }
        }
    }

    // Légende qui s'affichera sur la gauche à côté de la barre verticale
    const labelsCommentaires = ["Disponibles", "Indisponibles"];
    // Données et personnalisation du graphique
    const dataCommentaires = {
        labels: labelsCommentaires,
        datasets: [{
            label: "Nombre de commentaires",
            data: [nbCommentairesdispo, nbCommentairesindispo],
            backgroundColor: ["rgba(0, 255, 0, 1)", "rgba(255, 0, 0, 1)"], // vert pour disponibles, rouge pour indisponibles
        }],
    };
    const configCommentaires = {
        type: "bar",
        data: dataCommentaires,
    };
    // Rendu du graphique dans l'élément canvas
    const graphiqueCommentaires = new Chart(
        document.getElementById("graphique-commentaires"),
        configCommentaires,
    );
}
