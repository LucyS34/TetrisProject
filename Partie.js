// TODO : https://github.com/jmcker/Peer-to-Peer-Cue-System

var KEY = { ESC: 27, SPACE: 32, LEFT: 37, UP: 38, RIGHT: 39, DOWN: 40 };
var DIR = { LEFT: 1, RIGHT: 2, DOWN: 3 };
var numMaxX = 10; // nombre de pièces tetris max en largeur
var numMaxY = 20; // nombre de pièces tetris max en hauteur

var nbMaxPieceX = 10;// nombre max de block tetris X
var nbMaxPieceY = 20;// nombre max de block tetris Y

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

var currentPiece = {};
currentPiece.y = 0;
currentPiece.x = 0;
currentPiece.rotation = 0;
currentPiece.type = i;

var tailleX, //taille du block sur l'axe X
    tailleY; //taille du block sur l'axe Y

var pieces = [], // tableau à deux dimensions x/y pour la position de tous les pièces (numMaxX*numMaxY)
    canvas = document.getElementById('canvas'),
    ctx = canvas.getContext('2d');



canvas.width = canvas.clientWidth;  // on met la taille logique du canvas à sa taille physique
canvas.height = canvas.clientHeight; // idem
tailleX = canvas.width / nbMaxPieceX; // taille en pixel d'une pièce tetris
tailleY = canvas.height / nbMaxPieceY; // idem

function chaqueMorceauPiece(typePiece, x, y, rotation, func) {
    var bit,                        // bit
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
function canDraw(typePiece, x, y, rotation) {
    let canDrawResult = true;

    chaqueMorceauPiece(typePiece, x, y, rotation, (x, y) => {
        //on regarde tous les cas où on ne pourrais pas poser de block
        if (x < 0 || y > nbMaxPieceY - 1 || x > nbMaxPieceX - 1 || y < 0 || (pieces && pieces[x] ? pieces[x][y] : null)) {
            canDrawResult = false;
        }
    });
    return canDrawResult;
}

// permet de dessiner une pièce
function draw(typePiece, x, y, rotation) {
    chaqueMorceauPiece(typePiece, x, y, rotation, (x, y, color) => {
        drawMorceauPiece(x, y, color);
    })
}

function drawMorceauPiece(x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x * tailleX, y * tailleY, tailleX, tailleY);
    ctx.strokeRect(x * tailleX, y * tailleY, tailleX, tailleY);
}

function addEvents() {
    document.addEventListener('keydown', keydown, false);
}

// permet d'obtenir l'evènement keydown sur la fenêtre
function keydown(e) {
    var handled = false;
    // selon le code de la touche préssée on traite en conséquence
    switch (e.keyCode) {
        case KEY.LEFT: move(DIR.LEFT); handled = true; break;
        case KEY.RIGHT: move(DIR.RIGHT); handled = true; break;
        case KEY.DOWN: move(DIR.DOWN); handled = true; break;
        case KEY.SPACE: dropPiece(); handled = true; break;
    }

    if (handled) {
        e.preventDefault();// ne fait pas bouger l'ecran via les fleches si l'évènement et traité par nous
    }
}

// permet de déplacer la pièce "en cours"
function move(direction) {
    switch (direction) {
        // à chaque fois on verifie que l'on peut déplacer la pièce
        case DIR.LEFT:
            if (canDraw(currentPiece.type, currentPiece.x - 1, currentPiece.y, currentPiece.rotation)) {
                currentPiece.x -= 1;
            }
            break;
        case DIR.RIGHT:
            if (canDraw(currentPiece.type, currentPiece.x + 1, currentPiece.y, currentPiece.rotation)) {
                currentPiece.x += 1;
            }
            break;
        case DIR.DOWN:
            if (canDraw(currentPiece.type, currentPiece.x, currentPiece.y + 1, currentPiece.rotation)) {
                currentPiece.y += 1;
            }
            break;
    }

    // on vide le canvas
    ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
    // on dessine les pièces déjà posées
    drawPieces();
    // on dessine la pièce que l'on viens de bouger
    draw(currentPiece.type, currentPiece.x, currentPiece.y, 0)
}

//permet de lacher une pièce
function dropPiece() {
    //on pose la pièce
    chaqueMorceauPiece(currentPiece.type, currentPiece.x, currentPiece.y, currentPiece.rotation, (x, y) => {
        //on verifie l'endoit où on souhaite poser la pièce et on met un tableau vide si c'est null
        if (pieces[x] == null) {
            pieces[x] = [];
        }
        if (pieces[x][y] == null) {
            pieces[x][y] = [];
        }
        pieces[x][y] = currentPiece;
    });


    //on change l'objet par la nouvelle pièce
    currentPiece = {}
    currentPiece.type = j;
    currentPiece.rotation = 0;
    currentPiece.x = 0;
    currentPiece.y = 0;
    //on dessine la nouvelle pièce
    draw(currentPiece.type, currentPiece.x, currentPiece.y, 0);

}

// permet de dessiner toutes les pièces déjà posées
function drawPieces() {
    for (let cpt1 = 0; cpt1 < numMaxX; cpt1++) {
        if (pieces[cpt1] != null) {

            for (let cpt2 = 0; cpt2 < numMaxY; cpt2++) {
                if (pieces[cpt1][cpt2] != null) {
                    let piece = pieces[cpt1][cpt2];
                    
                    drawMorceauPiece(cpt1, cpt2, piece.type.color);
                }
            }
        }
    }
}

function run() {
    addEvents();

    draw(currentPiece.type, currentPiece.x, currentPiece.y, currentPiece.rotation)

}
run();
