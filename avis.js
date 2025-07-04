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