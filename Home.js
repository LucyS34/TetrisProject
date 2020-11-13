// vérification des champs du formulaire + stockage des valeurs dans le session storage 
// et redirection vers la page Partie.html
$("#buttonCreateGame").click( () => 
    { 
        const name = $("#namePlayer").val();
        if(name.length === 0) {
            window.alert("Veuillez entrez un pseudo");
        } else {
            sessionStorage.setItem("playerName", name);
            window.location.href = "Partie.html"; 
        }
    }
);

// vérification des champs du formulaire + stockage des valeurs dans le session storage 
// et redirection vers la page Partie.html
$("#buttonFormJoinGame").click( () => 
    { 
        const name = $("#namePlayer").val();
        const remoteId = $("#idRemotePlayer").val();

        if(name.length === 0 || remoteId.length === 0) {
            window.alert("Veuillez entrez un pseudo et un ID de partie valide");
        } else {
            sessionStorage.setItem("playerName", name);
            sessionStorage.setItem("gameIdToJoin",remoteId);
            window.location.href = "Partie.html"; 
        }
    }
);