export function ajoutListenersAvis() {

    const piecesElements = document.querySelectorAll(".fiches article button");

    for (let i = 0; i < piecesElements.length; i++) {

        piecesElements[i].addEventListener("click", async function (event) {

           const id = event.target.dataset.id;
            const reponse = await fetch("http://localhost:8081/pieces/" + id + "/avis");
            //stocker la reponse de l'API dans une constante
            const avis = await reponse.json();
            //recuperer l'element parent grace à la propriété parentElement sur la cible de l'événement
            const pieceElement = event.target.parentElement;

            const avisElement = document.createElement("p");
            for (let i = 0; i < avis.length; i++) {
            //On parcourt le tableau d'avis et on ajoute le nom d'utilisateur et son commentaire suivi d'un retour à la ligne
            avisElement.innerHTML += `${avis[i].utilisateur}: ${avis[i].commentaire} <br>`;
            }
            //On rattache l'element p au parent que nous avons récupéré preécédemment
            pieceElement.appendChild(avisElement);


        });

    }

}

//Creation de la fonction pour permettre aux utilisateurs de donner leur avis
export async function ajoutListenerEnvoyerAvis() {
     const formulaireAvis = document.querySelector(".formulaire-avis");
     formulaireAvis.addEventListener("submit", (event)=> {
        //// Désactivation du comportement par défaut du navigateur
        event.preventDefault()

        // Création de l’objet du nouvel avis.
            const avis = {
        pieceId: parseInt(event.target.querySelector("[name=piece-id]").value),
        utilisateur: event.target.querySelector("[name=utilisateur").value,
        commentaire: event.target.querySelector("[name=commentaire]").value,
            }
        // On transforme l'objet avis en texte (format JSON) pour pouvoir l'envoyer avec la requête
        const chargeUtile = JSON.stringify(avis);

        // On envoie la requête POST à l'API
        fetch("http://localhost:8081/avis", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: chargeUtile
});

     })
}
