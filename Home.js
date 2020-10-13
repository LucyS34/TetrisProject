const idsArray = [];

/*$("buttonCreateGame").click( () => 
{ 
    window.location.href = "file:///C:/Users/Cours EPSI/Documents/TetrisProject/TetrisProject/Partie.html";
});

$("buttonJoinGame").click( () => 
{ 
    window.location.href = "file:///C:/Users/Cours EPSI/Documents/TetrisProject/TetrisProject/Partie.html";
});
*/
const generatePlayerId = () => {
    let newId = "";
    for (let i = 0; i < 3; i++) {
        newId += (Math.floor(Math.random()*100)).toString(); 
    }
    console.log(newId);
    const checkId = idsArray.filter(element => element.id === newId); 
    if(checkId.length === 0) {
        idsArray.push(newId);
        $("#idPlayer").text(`ID Joueur : ${newId}`);
    }
}

generatePlayerId();