// document.addEventListener('DOMContentLoaded', () => {
// TODO : https://github.com/jmcker/Peer-to-Peer-Cue-System
// TODO : liste pièce aléatoire
// TODO : supression de ligne (on drop piece)
// TODO : Perdre

var KEY = { ESC: 27, SPACE: 32, LEFT: 37, UP: 38, RIGHT: 39, DOWN: 40 };
var DIR = { UP: 0, LEFT: 1, RIGHT: 2, DOWN: 3 };
var ACTIONS = { MOVE: 1, DROP: 2, ROTATE: 3, INIT: 4, INITPSEUDO: 5, START: 6, SELECTPIECE: 7 }
var numMaxX = 10; // nombre de pièces tetris max en largeur
var numMaxY = 20; // nombre de pièces tetris max en hauteur

var nbMaxPieceX = 10;// nombre max de block tetris X
var nbMaxPieceY = 20;// nombre max de block tetris Y

var objToSend = { action: null, value: null };

// https://github.com/jakesgordon/javascript-tetris/blob/master/index.html
//-------------------------------------------------------------------------
// tetris pieces
//
// blocks: each element represents a rotation of the piece (0, 90, 180, 270)
//         each element is a 16 bit integer where the 16 bits represent
//         a 4x4 set of blocks, e.g. j.blocks[0] = 0x44C0
//
//             0100 = 0x4 << 3 = 0x4000
//             0100 = 0x4 << 2 = 0x0400
//             1100 = 0xC << 1 = 0x00C0
//             0000 = 0x0 << 0 = 0x0000
//                               ------
//                               0x44C0
//
//-------------------------------------------------------------------------

var i = { size: 4, blocks: [0x0F00, 0x2222, 0x00F0, 0x4444], color: 'cyan' };
var j = { size: 3, blocks: [0x44C0, 0x8E00, 0x6440, 0x0E20], color: 'blue' };
var l = { size: 3, blocks: [0x4460, 0x0E80, 0xC440, 0x2E00], color: 'orange' };
var o = { size: 2, blocks: [0xCC00, 0xCC00, 0xCC00, 0xCC00], color: 'yellow' };
var s = { size: 3, blocks: [0x06C0, 0x8C40, 0x6C00, 0x4620], color: 'green' };
var t = { size: 3, blocks: [0x0E40, 0x4C40, 0x4E00, 0x4640], color: 'purple' };
var z = { size: 3, blocks: [0x0C60, 0x4C80, 0xC600, 0x2640], color: 'red' };
var listePieces = [i, j, l, o, s, t, z];

var currentPiece = {};
currentPiece.y = 0;
currentPiece.x = 0;
currentPiece.rotation = 0;
currentPiece.type = randomChoice(listePieces);

var adversairePiece = {};
adversairePiece.y = 0;
adversairePiece.x = 0;
adversairePiece.rotation = 0;
adversairePiece.type = currentPiece.type

var tailleX, //taille du block sur l'axe X
    tailleY; //taille du block sur l'axe Y

var pieces = [], // tableau à deux dimensions x/y pour la position de tous les pièces (numMaxX*numMaxY)
    piecesAdverses = [],
    canvas = document.getElementById('canvasHome'),
    ctx = canvas.getContext('2d'),
    canvasAdversaire = document.getElementById('canvasRemote'),
    ctxAdversaire = canvasAdversaire.getContext("2d"),
    currentPeer = null,
    connexion = null;



canvas.width = canvas.clientWidth;  // on met la taille logique du canvas à sa taille physique
canvas.height = canvas.clientHeight; // idem
tailleX = canvas.width / nbMaxPieceX; // taille en pixel d'une pièce tetris
tailleY = canvas.height / nbMaxPieceY; // idem

function chaqueMorceauPiece(typePiece, x, y, rotation, func) {
    let bit,                        // bit
        row = 0,                    // ligne ou se place le bock
        col = 0,                    // colonne ou se place le block
        blocks = typePiece.blocks[rotation];  // blocks en fonction de sa rotation

    for (bit = 0x8000; bit > 0; bit = bit >> 1) {
        if (blocks & bit) {
            func(x + col, y + row, typePiece.color);
        }
        if (++col === 4) {
            col = 0;
            ++row;
        }
    }
}

// permet de savoir si la palce est occupée
function canDraw(typePiece, x, y, rotation, isThisPlayer) {
    let canDrawResult = true;

    chaqueMorceauPiece(typePiece, x, y, rotation, (x, y) => {
        //on regarde tous les cas où on ne pourrais pas poser de block
        if (x < 0 || y > nbMaxPieceY - 1 || x > nbMaxPieceX - 1 || y < 0 || (isThisPlayer ? (pieces && pieces[x] ? pieces[x][y] : null) : ((piecesAdverses && piecesAdverses[x] ? piecesAdverses[x][y] : null)))) {
            canDrawResult = false;
        }
    });
    return canDrawResult;
}

// permet de dessiner une pièce
function draw(typePiece, x, y, rotation, isThisPlayer) {
    chaqueMorceauPiece(typePiece, x, y, rotation, (x, y, color) => {
        drawMorceauPiece(x, y, color, isThisPlayer);
    })
}

function drawMorceauPiece(x, y, color, isThisPlayer) {
    let context = null
    if (isThisPlayer) {
        context = ctx;
    } else {
        context = ctxAdversaire;
    }

    context.fillStyle = color;
    context.fillRect(x * tailleX, y * tailleY, tailleX, tailleY);
    context.strokeRect(x * tailleX, y * tailleY, tailleX, tailleY);
}

function addEvents() {
    document.addEventListener('keydown', keydown, false);
}

// permet d'obtenir l'evènement keydown sur la fenêtre
function keydown(e) {
    var handled = false;
    // selon le code de la touche préssée on traite en conséquence

    switch (e.keyCode) {
        case KEY.LEFT:
            move(currentPiece, DIR.LEFT, true);
            handled = true;
            objToSend.action = ACTIONS.MOVE;
            objToSend.value = DIR.LEFT;
            connexion.send(JSON.stringify(objToSend));
            break;
        case KEY.RIGHT:
            move(currentPiece, DIR.RIGHT, true);
            handled = true;
            objToSend.action = ACTIONS.MOVE;
            objToSend.value = DIR.RIGHT;
            connexion.send(JSON.stringify(objToSend));
            break;
        case KEY.DOWN:
            move(currentPiece, DIR.DOWN, true);
            handled = true;
            objToSend.action = ACTIONS.MOVE;
            objToSend.value = DIR.DOWN;
            connexion.send(JSON.stringify(objToSend));
            break;
        case KEY.SPACE:
            dropPiece(currentPiece, pieces, true);
            handled = true;
            objToSend.action = ACTIONS.DROP;
            connexion.send(JSON.stringify(objToSend));
            break;
        case KEY.UP:
            move(currentPiece, DIR.UP, true);
            handled = true;
            objToSend.action = ACTIONS.ROTATE;
            connexion.send(JSON.stringify(objToSend));
            break;
    }

    if (handled) {
        e.preventDefault();// ne fait pas bouger l'ecran via les fleches si l'évènement et traité par nous
    }
}

// permet de déplacer la pièce "en cours"
function move(pieceToMove, direction, isThisPlayer) {
    switch (direction) {
        // à chaque fois on verifie que l'on peut déplacer la pièce
        case DIR.LEFT:
            if (canDraw(pieceToMove.type, pieceToMove.x - 1, pieceToMove.y, pieceToMove.rotation, isThisPlayer)) {
                pieceToMove.x -= 1;
            }
            break;
        case DIR.RIGHT:
            if (canDraw(pieceToMove.type, pieceToMove.x + 1, pieceToMove.y, pieceToMove.rotation, isThisPlayer)) {
                pieceToMove.x += 1;
            }
            break;
        case DIR.DOWN:
            if (canDraw(pieceToMove.type, pieceToMove.x, pieceToMove.y + 1, pieceToMove.rotation, isThisPlayer)) {
                pieceToMove.y += 1;
            }
            break;
        case DIR.UP:
            var newRotation = pieceToMove.rotation + 1 <= 3 ? pieceToMove.rotation + 1 : 0;
            if (canDraw(pieceToMove.type, pieceToMove.x, pieceToMove.y + 1, newRotation, isThisPlayer)) {
                pieceToMove.rotation = newRotation;
            }
            break;
    }

    // on vide le canvas
    clearCanvas(isThisPlayer);
    // on dessine les pièces déjà posées
    drawPieces(isThisPlayer);
    // on dessine la pièce que l'on viens de bouger
    draw(pieceToMove.type, pieceToMove.x, pieceToMove.y, pieceToMove.rotation, isThisPlayer);
}

function clearCanvas(isThisPlayer) {
    if (isThisPlayer) {
        ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
    } else {
        ctxAdversaire.clearRect(0, 0, canvasAdversaire.clientWidth, canvasAdversaire.clientHeight);
    }
}

//permet de lacher une pièce
function dropPiece(pieceToDrop, pieceList, isThisPlayer) {
    //on regarde le y le plus bas possible pour poser la pièce
    let lowestY = GetLowestYPossible(pieceToDrop.type, pieceToDrop.x, pieceToDrop.y, pieceToDrop.rotation, isThisPlayer);
    // on vide le canvas
    clearCanvas(isThisPlayer);

    //on pose la pièce
    chaqueMorceauPiece(pieceToDrop.type, pieceToDrop.x, lowestY, pieceToDrop.rotation, (x, y) => {
        //on verifie l'endoit où on souhaite poser la pièce et on met un tableau vide si c'est null
        if (pieceList[x] == null) {
            pieceList[x] = [];
        }
        if (pieceList[x][y] == null) {
            pieceList[x][y] = [];
        }
        pieceList[x][y] = pieceToDrop;
    });

    // on dessine les pièces déjà posées, dont celle que l'on viens de poser
    drawPieces(isThisPlayer);

    //on change l'objet par la nouvelle pièce
    pieceToDrop = {}
    pieceToDrop.type = randomChoice(listePieces); //TODO à changer ?
    pieceToDrop.rotation = 0;
    pieceToDrop.x = 0;
    pieceToDrop.y = 0;
    //on dessine la nouvelle pièce
    draw(pieceToDrop.type, pieceToDrop.x, pieceToDrop.y, pieceToDrop.rotation, isThisPlayer);

}

function GetLowestYPossible(typePiece, x, y, rotation, isThisPlayer) {
    let lowestY = y;
    for (let cpt = y + 1; cpt < nbMaxPieceY; cpt++) {
        let result = canDraw(typePiece, x, cpt, rotation, isThisPlayer);
        if (!result) {
            lowestY = cpt - 1;
            break;
        }
    }
    return lowestY;
}

// permet de dessiner toutes les pièces déjà posées
function drawPieces(isThisPlayer) {
    if (isThisPlayer) {
        for (let cpt1 = 0; cpt1 < numMaxX; cpt1++) {
            if (pieces[cpt1] != null) {

                for (let cpt2 = 0; cpt2 < numMaxY; cpt2++) {
                    if (pieces[cpt1][cpt2] != null) {
                        let piece = pieces[cpt1][cpt2];

                        drawMorceauPiece(cpt1, cpt2, piece.type.color, isThisPlayer);
                    }
                }
            }
        }
    } else {
        for (let cpt1 = 0; cpt1 < numMaxX; cpt1++) {
            if (piecesAdverses[cpt1] != null) {

                for (let cpt2 = 0; cpt2 < numMaxY; cpt2++) {
                    if (piecesAdverses[cpt1][cpt2] != null) {
                        let piece = piecesAdverses[cpt1][cpt2];

                        drawMorceauPiece(cpt1, cpt2, piece.type.color, isThisPlayer);
                    }
                }
            }
        }
    }
}

function random(min, max) {
    return (min + (Math.random() * (max - min)));
}

function randomChoice(choix) {
    return choix[Math.round(random(0, choix.length - 1))];
}

function run() {
    addEvents();

    draw(currentPiece.type, currentPiece.x, currentPiece.y, currentPiece.rotation, true)
}

function startGame() {
    run();
    objToSend.action = ACTIONS.SELECTPIECE;
    objToSend.value = currentPiece;
    connexion.send(JSON.stringify(objToSend));
    draw(adversairePiece.type, adversairePiece.x, adversairePiece.y, adversairePiece.rotation, false)
}

///-------------------------------
///
///     PARTIE PEER TO PEER
///
///-------------------------------


function peerInitialize() {

    currentPeer = new Peer();
    connexion = null;

    currentPeer.on('open', function (id) {
        sessionStorage.setItem("playerId", id);
        $("#gameId").text(`ID Partie : ${id}`);
        verifyIsTryingToConnect();
    })
    // lorsque que quelqu'un se connecte
    currentPeer.on('connection', function (conn) {
        connexion = conn;

        connexion.on('open', function () {
            console.log("quelqu'un se connecte à moi ...");
            //$("#idRemotePlayer").text(`ID Joueur :` + connexion.peer);

            //une fois que l'on est connecté on lance le jeu
            objToSend.action = ACTIONS.INIT;
            objToSend.value = listePieces;
            connexion.send(JSON.stringify(objToSend));

            objToSend.action = ACTIONS.INITPSEUDO;
            objToSend.value = sessionStorage.getItem("playerName");
            connexion.send(JSON.stringify(objToSend));

            objToSend.action = ACTIONS.START;
            connexion.send(JSON.stringify(objToSend));
            startGame();
        });

        readDataFromConn(connexion);

        //$("#idRemotePlayer").text(`ID Partie :` + connexion.peer);
    });

    currentPeer.on('error', function (err) {
        console.log("une erreur est survenue : " + err.type);
        console.log(err);
    });

    currentPeer.on('disconnected', function () {
        console.log("disconnected");
    });
}

function readDataFromConn(connect) {
    connect.on('data', function (data) {
        console.log("Data recieved");
        console.log(data);
        try {
            var obj = JSON.parse(data)
        } catch {

        }
        switch (obj.action) {
            case ACTIONS.INIT:
                listePieces = obj.value;
                break;
            case ACTIONS.INITPSEUDO:
                $("#nameRemotePlayer").text(`Pseudo Joueur 2 : ` + obj.value);
                break;
            case ACTIONS.MOVE:
                move(adversairePiece, obj.value, false);
                break;
            case ACTIONS.DROP:
                dropPiece(adversairePiece, piecesAdverses, false);
                break;
            case ACTIONS.ROTATE:
                move(adversairePiece, DIR.UP, false);
                break;
            case ACTIONS.START:
                startGame();
                break;
            case ACTIONS.SELECTPIECE:
                console.log("selectpiece")
                adversairePiece.y = obj.value.y;
                adversairePiece.x = obj.value.x;
                adversairePiece.rotation = obj.value.rotation;
                adversairePiece.type = obj.value.type;
                clearCanvas(false);
                draw(adversairePiece.type,adversairePiece.x,adversairePiece.y,adversairePiece.rotation,false);
                break;
            default:
                console.log(data);
                break;
        };
    });
}

const generateGameStartInfos = () => {
    const playerName = sessionStorage.getItem("playerName");
    $("#nameHomePlayer").text(`Pseudo Joueur 1 : ${playerName}`);
}

function verifyIsTryingToConnect() {
    let idToJoin = sessionStorage.getItem("gameIdToJoin");
    sessionStorage.setItem("gameIdToJoin", null);
    if (idToJoin !== undefined && idToJoin !== null && idToJoin !== "null") {
        console.log("rejoins la partie : " + idToJoin);

        connexion = currentPeer.connect(idToJoin,
            {
                metadata:
                {
                    name: sessionStorage.getItem("playerName")
                },
                reliable: true
            }
        );
        connexion.on('open', () => {
            readDataFromConn(connexion);

            objToSend.action = ACTIONS.INITPSEUDO
            objToSend.value = sessionStorage.getItem("playerName");
            connexion.send(JSON.stringify(objToSend));

        });

        console.log(connexion);
    }
}

peerInitialize();
generatePlayersInfos();
$('.modal').modal('show');
$("#currentScore").text(`points`);
$("#currentLineScore").text(`Lignes`);
