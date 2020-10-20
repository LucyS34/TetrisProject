const idsArray = new Set();
let idPlayer = "";

$("#buttonCreateGame").click( () => 
    { 
        const name = $("#namePlayer").val();
        if(name.length === 0) {
            window.alert("Veuillez entrez un pseudo");
        } else {
            sessionStorage.setItem("playerName", name);
            sessionStorage.setItem("playerId", idPlayer);
            // ! Chemin à remplacer par votre emplacement local
            window.location.href = "Partie.html"; 
        }
    }
);

$("#buttonFormJoinGame").click( () => 
    { 
        const name = $("#namePlayer").val();
        const remoteId = $("#idRemotePlayer").val();

        if(name.length === 0 || remoteId.length === 0) {
            window.alert("Veuillez entrez un pseudo et un ID de partie valide");
        } else {
            sessionStorage.setItem("playerName", name);
            sessionStorage.setItem("playerId", idPlayer);
            // code nécessaire pour la connexion peer to peer
        }
    }
);


const generatePlayerId = () => {
    let newId = "";
    for (let i = 0; i < 3; i++) {
        newId += (Math.floor(Math.random()*100)).toString(); 
    }
    const checkId = idsArray.has(newId); 
    if(!checkId) {
        idsArray.add(newId);
        idPlayer = newId;
        $("#idPlayer").text(`ID Joueur : ${idPlayer}`);
    } else {
        generatePlayerId();
        return;
    }
}

generatePlayerId();