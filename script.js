"use strict";


// HTML-Elemente auswählen
const canvas =
    document.getElementById("webglCanvas");

// Zweite Ansicht: derselbe Pinguin mit sichtbaren Dreiecken
const dreieckeCanvas =
    document.getElementById("dreieckeCanvas");

const dreieckeKontext =
    dreieckeCanvas.getContext("2d");

const webglStatus =
    document.getElementById("webglStatus");

const vertexAnzeige =
    document.getElementById("vertexAnzahl");

const dreieckAnzeige =
    document.getElementById("dreieckAnzahl");

const formenAnzeige =
    document.getElementById("formenAnzahl");


// WebGL-Kontext anfordern
const gl = canvas.getContext("webgl");

if (gl === null) {

    webglStatus.textContent =
        "WebGL konnte nicht gestartet werden.";

    throw new Error(
        "Der Browser unterstützt WebGL nicht."
    );
}


// --------------------------------------------------
// SHADER
// --------------------------------------------------

const vertexShaderQuelltext = `
    attribute vec2 position;
    attribute vec4 farbe;

    varying vec4 vertexFarbe;

    void main() {
        gl_Position = vec4(position, 0.0, 1.0);

        vertexFarbe = farbe;
    }
`;


const fragmentShaderQuelltext = `
    precision mediump float;

    varying vec4 vertexFarbe;

    void main() {
        gl_FragColor = vertexFarbe;
    }
`;


// Erstellt und überprüft einen Shader
function shaderErstellen(shaderTyp, quelltext) {

    const shader = gl.createShader(shaderTyp);

    gl.shaderSource(shader, quelltext);
    gl.compileShader(shader);

    const erfolgreich =
        gl.getShaderParameter(
            shader,
            gl.COMPILE_STATUS
        );

    if (erfolgreich === false) {

        const fehlermeldung =
            gl.getShaderInfoLog(shader);

        gl.deleteShader(shader);

        throw new Error(
            "Shader-Fehler: " + fehlermeldung
        );
    }

    return shader;
}


const vertexShader = shaderErstellen(
    gl.VERTEX_SHADER,
    vertexShaderQuelltext
);

const fragmentShader = shaderErstellen(
    gl.FRAGMENT_SHADER,
    fragmentShaderQuelltext
);


// Shader-Programm erzeugen
const shaderProgramm = gl.createProgram();

gl.attachShader(
    shaderProgramm,
    vertexShader
);

gl.attachShader(
    shaderProgramm,
    fragmentShader
);

gl.linkProgram(shaderProgramm);


const programmErfolgreich =
    gl.getProgramParameter(
        shaderProgramm,
        gl.LINK_STATUS
    );


if (programmErfolgreich === false) {

    throw new Error(
        "Das Shader-Programm konnte nicht verbunden werden: " +
        gl.getProgramInfoLog(shaderProgramm)
    );
}


gl.useProgram(shaderProgramm);


// Positionen der Attribute im Shader
const positionsPosition =
    gl.getAttribLocation(
        shaderProgramm,
        "position"
    );

const farbPosition =
    gl.getAttribLocation(
        shaderProgramm,
        "farbe"
    );


// --------------------------------------------------
// FARBEN
// --------------------------------------------------

const farben = {

    dunkelblau: [
        0.04, 0.13, 0.21, 1.0
    ],

    blau: [
        0.07, 0.25, 0.39, 1.0
    ],

    blauHell: [
        0.13, 0.38, 0.52, 1.0
    ],

    creme: [
        0.96, 0.88, 0.70, 1.0
    ],

    cremeHell: [
        1.00, 0.97, 0.88, 1.0
    ],

    weiss: [
        1.00, 1.00, 1.00, 1.0
    ],

    orange: [
        0.96, 0.48, 0.08, 1.0
    ],

    orangeHell: [
        1.00, 0.69, 0.18, 1.0
    ],

    braun: [
        0.30, 0.17, 0.11, 1.0
    ],

    braunHell: [
        0.48, 0.29, 0.18, 1.0
    ],

    rosa: [
        0.91, 0.42, 0.48, 1.0
    ],

    rosaHell: [
        1.00, 0.65, 0.68, 1.0
    ],

    schatten: [
        0.52, 0.68, 0.72, 0.55
    ]
};


// --------------------------------------------------
// GEOMETRIEDATEN
// --------------------------------------------------

const positionen = [];
const vertexFarben = [];
const indices = [];

let anzahlFormen = 0;


// Fügt einen Vertex hinzu und liefert seine Nummer
function vertexHinzufuegen(x, y, farbe) {

    positionen.push(x, y);

    vertexFarben.push(
        farbe[0],
        farbe[1],
        farbe[2],
        farbe[3]
    );

    return positionen.length / 2 - 1;
}


// Erzeugt eine gefüllte Ellipse aus Dreiecken
function ellipseHinzufuegen(
    mittelpunktX,
    mittelpunktY,
    radiusX,
    radiusY,
    farbeMitte,
    farbeRand,
    anzahlSegmente
) {

    const ersterVertex =
        positionen.length / 2;

    // Mittelpunkt der Ellipse
    vertexHinzufuegen(
        mittelpunktX,
        mittelpunktY,
        farbeMitte
    );


    // Punkte am Rand der Ellipse
    for (
        let nummer = 0;
        nummer < anzahlSegmente;
        nummer++
    ) {

        const winkel =
            nummer /
            anzahlSegmente *
            Math.PI *
            2;

        const x =
            mittelpunktX +
            Math.cos(winkel) *
            radiusX;

        const y =
            mittelpunktY +
            Math.sin(winkel) *
            radiusY;

        vertexHinzufuegen(
            x,
            y,
            farbeRand
        );
    }


    /*
        Der Mittelpunkt wird mit jeweils zwei
        benachbarten Randpunkten verbunden.
        Dadurch entstehen einzelne Dreiecke.
    */
    for (
        let nummer = 0;
        nummer < anzahlSegmente;
        nummer++
    ) {

        const ersterRandpunkt =
            ersterVertex + 1 + nummer;

        const zweiterRandpunkt =
            ersterVertex +
            1 +
            (
                (nummer + 1) %
                anzahlSegmente
            );

        indices.push(
            ersterVertex,
            ersterRandpunkt,
            zweiterRandpunkt
        );
    }

    anzahlFormen++;
}


// Erzeugt eine gefüllte Form aus mehreren Punkten
function polygonHinzufuegen(
    punkte,
    farbenDerPunkte
) {

    const ersterVertex =
        positionen.length / 2;

    for (
        let nummer = 0;
        nummer < punkte.length;
        nummer++
    ) {

        vertexHinzufuegen(
            punkte[nummer][0],
            punkte[nummer][1],
            farbenDerPunkte[nummer]
        );
    }


    /*
        Die Form wird wie ein Fächer in mehrere
        Dreiecke aufgeteilt.
    */
    for (
        let nummer = 1;
        nummer < punkte.length - 1;
        nummer++
    ) {

        indices.push(
            ersterVertex,
            ersterVertex + nummer,
            ersterVertex + nummer + 1
        );
    }

    anzahlFormen++;
}


// --------------------------------------------------
// PINGUIN AUFBAUEN
// --------------------------------------------------

function pinguinErstellen() {

    /*
        Die Reihenfolge ist wichtig:
        Früh hinzugefügte Flächen liegen hinten.
        Später hinzugefügte Flächen liegen davor.
    */


    // Schatten unter dem Pinguin
    ellipseHinzufuegen(
        0.00, -0.86,
        0.48, 0.07,
        farben.schatten,
        farben.schatten,
        32
    );


    // Linker Flügel
    polygonHinzufuegen(
        [
            [-0.35,  0.23],
            [-0.58,  0.05],
            [-0.67, -0.27],
            [-0.55, -0.46],
            [-0.40, -0.25]
        ],
        [
            farben.blauHell,
            farben.blau,
            farben.dunkelblau,
            farben.blau,
            farben.blauHell
        ]
    );


    // Rechter Flügel
    polygonHinzufuegen(
        [
            [0.35,  0.23],
            [0.58,  0.05],
            [0.67, -0.27],
            [0.55, -0.46],
            [0.40, -0.25]
        ],
        [
            farben.blauHell,
            farben.blau,
            farben.dunkelblau,
            farben.blau,
            farben.blauHell
        ]
    );


    // Linker Fuß
    polygonHinzufuegen(
        [
            [-0.27, -0.72],
            [-0.36, -0.85],
            [-0.27, -0.83],
            [-0.20, -0.90],
            [-0.13, -0.80]
        ],
        [
            farben.orange,
            farben.orangeHell,
            farben.orange,
            farben.orangeHell,
            farben.orange
        ]
    );


    // Rechter Fuß
    polygonHinzufuegen(
        [
            [0.27, -0.72],
            [0.36, -0.85],
            [0.27, -0.83],
            [0.20, -0.90],
            [0.13, -0.80]
        ],
        [
            farben.orange,
            farben.orangeHell,
            farben.orange,
            farben.orangeHell,
            farben.orange
        ]
    );


    // Körper und Kopf
    ellipseHinzufuegen(
        0.00, -0.05,
        0.49, 0.77,
        farben.blauHell,
        farben.dunkelblau,
        48
    );


    // Bauch
    ellipseHinzufuegen(
        0.00, -0.28,
        0.33, 0.47,
        farben.cremeHell,
        farben.creme,
        40
    );


    // Gesicht
    ellipseHinzufuegen(
        0.00, 0.38,
        0.36, 0.30,
        farben.cremeHell,
        farben.creme,
        40
    );


    // Dunkler Haaransatz
    ellipseHinzufuegen(
        0.00, 0.66,
        0.29, 0.15,
        farben.braunHell,
        farben.braun,
        28
    );


    /*
        Zwei helle Gesichtsflächen werden über den
        Haaransatz gelegt. Dadurch entsteht die
        typische Gesichtsform des Pinguins.
    */

    ellipseHinzufuegen(
        -0.14, 0.46,
        0.20, 0.23,
        farben.cremeHell,
        farben.creme,
        28
    );

    ellipseHinzufuegen(
        0.14, 0.46,
        0.20, 0.23,
        farben.cremeHell,
        farben.creme,
        28
    );


    // Dutt
    ellipseHinzufuegen(
        0.00, 0.87,
        0.18, 0.12,
        farben.braunHell,
        farben.braun,
        28
    );


    // Kleines Haarband
    polygonHinzufuegen(
        [
            [-0.14, 0.79],
            [ 0.14, 0.79],
            [ 0.11, 0.83],
            [-0.11, 0.83]
        ],
        [
            farben.dunkelblau,
            farben.blauHell,
            farben.blau,
            farben.dunkelblau
        ]
    );


    // Linkes Auge
    ellipseHinzufuegen(
        -0.15, 0.47,
        0.09, 0.12,
        farben.weiss,
        farben.cremeHell,
        24
    );


    // Rechtes Auge
    ellipseHinzufuegen(
        0.15, 0.47,
        0.09, 0.12,
        farben.weiss,
        farben.cremeHell,
        24
    );


    // Linke Iris
    ellipseHinzufuegen(
        -0.15, 0.45,
        0.047, 0.068,
        farben.braunHell,
        farben.braun,
        20
    );


    // Rechte Iris
    ellipseHinzufuegen(
        0.15, 0.45,
        0.047, 0.068,
        farben.braunHell,
        farben.braun,
        20
    );


    // Linke Pupille
    ellipseHinzufuegen(
        -0.15, 0.445,
        0.023, 0.040,
        farben.dunkelblau,
        farben.dunkelblau,
        16
    );


    // Rechte Pupille
    ellipseHinzufuegen(
        0.15, 0.445,
        0.023, 0.040,
        farben.dunkelblau,
        farben.dunkelblau,
        16
    );


    // Lichtpunkte in den Augen
    ellipseHinzufuegen(
        -0.137, 0.468,
        0.010, 0.015,
        farben.weiss,
        farben.weiss,
        12
    );

    ellipseHinzufuegen(
        0.163, 0.468,
        0.010, 0.015,
        farben.weiss,
        farben.weiss,
        12
    );


    // Schnabel
    polygonHinzufuegen(
        [
            [ 0.00, 0.39],
            [-0.14, 0.29],
            [ 0.00, 0.24],
            [ 0.14, 0.29]
        ],
        [
            farben.orangeHell,
            farben.orange,
            farben.orange,
            farben.orangeHell
        ]
    );


    // Linke Wange
    ellipseHinzufuegen(
        -0.29, 0.28,
        0.07, 0.035,
        farben.rosaHell,
        farben.rosa,
        18
    );


    // Rechte Wange
    ellipseHinzufuegen(
        0.29, 0.28,
        0.07, 0.035,
        farben.rosaHell,
        farben.rosa,
        18
    );
}


pinguinErstellen();


// --------------------------------------------------
// DATEN PRÜFEN
// --------------------------------------------------

const anzahlVertices =
    positionen.length / 2;

const anzahlFarben =
    vertexFarben.length / 4;

const anzahlDreiecke =
    indices.length / 3;


if (anzahlVertices !== anzahlFarben) {

    throw new Error(
        "Die Anzahl der Vertices und Farben stimmt nicht überein."
    );
}


if (indices.length % 3 !== 0) {

    throw new Error(
        "Die Anzahl der Indices ist nicht durch drei teilbar."
    );
}


const groessterIndex =
    Math.max(...indices);


if (groessterIndex >= anzahlVertices) {

    throw new Error(
        "Ein Index verweist auf einen nicht vorhandenen Vertex."
    );
}


// --------------------------------------------------
// BUFFER ERSTELLEN
// --------------------------------------------------

// Positionen
const positionsBuffer =
    gl.createBuffer();

gl.bindBuffer(
    gl.ARRAY_BUFFER,
    positionsBuffer
);

gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array(positionen),
    gl.STATIC_DRAW
);

gl.enableVertexAttribArray(
    positionsPosition
);

gl.vertexAttribPointer(
    positionsPosition,
    2,
    gl.FLOAT,
    false,
    0,
    0
);


// Farben
const farbBuffer =
    gl.createBuffer();

gl.bindBuffer(
    gl.ARRAY_BUFFER,
    farbBuffer
);

gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array(vertexFarben),
    gl.STATIC_DRAW
);

gl.enableVertexAttribArray(
    farbPosition
);

gl.vertexAttribPointer(
    farbPosition,
    4,
    gl.FLOAT,
    false,
    0,
    0
);


// Indices
const indexBuffer =
    gl.createBuffer();

gl.bindBuffer(
    gl.ELEMENT_ARRAY_BUFFER,
    indexBuffer
);

gl.bufferData(
    gl.ELEMENT_ARRAY_BUFFER,
    new Uint16Array(indices),
    gl.STATIC_DRAW
);



// Zeigt das fertige WebGL-Bild mit den echten Dreieckskanten
function dreieckeAnzeigen() {

    const breite = dreieckeCanvas.width;
    const hoehe = dreieckeCanvas.height;

    dreieckeKontext.clearRect(0, 0, breite, hoehe);

    // Zuerst den fertigen WebGL-Pinguin übernehmen.
    dreieckeKontext.drawImage(canvas, 0, 0);

    // Jeweils drei Indices gehören zu einem Dreieck.
    for (let nummer = 0; nummer < indices.length; nummer += 3) {

        const dreieck = new Path2D();

        for (let ecke = 0; ecke < 3; ecke++) {

            const vertexNummer = indices[nummer + ecke];

            // Ein Vertex besteht aus einer X- und einer Y-Zahl.
            const x = positionen[vertexNummer * 2];
            const y = positionen[vertexNummer * 2 + 1];

            // WebGL-Koordinaten in Bildkoordinaten umrechnen.
            const bildX = (x + 1) * breite / 2;
            const bildY = (1 - y) * hoehe / 2;

            if (ecke === 0) {
                dreieck.moveTo(bildX, bildY);
            } else {
                dreieck.lineTo(bildX, bildY);
            }
        }

        dreieck.closePath();

        /*
            Später gezeichnete Dreiecke verdecken frühere.
            Deshalb wird ihr Bildausschnitt neu übernommen:
            verdeckte Linien scheinen nicht durch die Figur.
        */
        dreieckeKontext.save();
        dreieckeKontext.clip(dreieck);
        dreieckeKontext.clearRect(0, 0, breite, hoehe);
        dreieckeKontext.drawImage(canvas, 0, 0);
        dreieckeKontext.restore();

        dreieckeKontext.strokeStyle = "#213746";
        dreieckeKontext.lineWidth = 2;
        dreieckeKontext.stroke(dreieck);
    }
}

// --------------------------------------------------
// SZENE ZEICHNEN
// --------------------------------------------------

function szeneZeichnen() {

    gl.viewport(
        0,
        0,
        canvas.width,
        canvas.height
    );


    // Der CSS-Hintergrund bleibt sichtbar.
    gl.clearColor(
        0.0,
        0.0,
        0.0,
        0.0
    );

    gl.clear(
        gl.COLOR_BUFFER_BIT
    );


    /*
        Transparente Farben, beispielsweise beim
        Schatten, werden mit dem Hintergrund gemischt.
    */
    gl.enable(gl.BLEND);

    gl.blendFunc(
        gl.SRC_ALPHA,
        gl.ONE_MINUS_SRC_ALPHA
    );


    /*
        Alle Indices werden als Dreiecke gezeichnet.
        Es werden keine Linien verwendet.
    */
    gl.drawElements(
        gl.TRIANGLES,
        indices.length,
        gl.UNSIGNED_SHORT,
        0
    );

    dreieckeAnzeigen();


    // Berechnete Werte auf der Webseite anzeigen
    vertexAnzeige.textContent =
        anzahlVertices;

    dreieckAnzeige.textContent =
        anzahlDreiecke;

    formenAnzeige.textContent =
        anzahlFormen;


    webglStatus.textContent =
        "WebGL wurde erfolgreich gestartet und der Pinguin wird aus gefüllten Dreiecken dargestellt.";


    console.log(
        "Vertices: " + anzahlVertices
    );

    console.log(
        "Dreiecke: " + anzahlDreiecke
    );

    console.log(
        "Farbflächen: " + anzahlFormen
    );
}


szeneZeichnen();

// --------------------------------------------------
// SLIDESHOW ZUM ENTSTEHUNGSPROZESS
// --------------------------------------------------

// Alle Bilder und dazugehörigen Texte
const entwicklungsschritte = [
    {
        bild: "bilder/entwicklung/schritt_01.png",
        alt: "Erster Entwicklungsschritt mit der Grundform des Pinguins",
        titel: "Die Grundform entsteht",
        beschreibung:
            "Körper, Bauch, Kopf, Flügel und Füße bilden zunächst die einfache Grundform."
    },
    {
        bild: "bilder/entwicklung/schritt_02.png",
        alt: "Zweiter Entwicklungsschritt mit Haaren und Gesichtsform",
        titel: "Gesichtsform und Haare",
        beschreibung:
            "Die hellen Gesichtsflächen, der Haaransatz und der Dutt geben dem Pinguin mehr Persönlichkeit."
    },
    {
        bild: "bilder/entwicklung/schritt_03.png",
        alt: "Dritter Entwicklungsschritt mit Augen und Schnabel",
        titel: "Augen und Schnabel",
        beschreibung:
            "Augen, Pupillen, Lichtpunkte und der Schnabel werden aus weiteren gefüllten Flächen ergänzt."
    },
    {
        bild: "bilder/entwicklung/schritt_04.png",
        alt: "Vierter Entwicklungsschritt mit den letzten Details",
        titel: "Die letzten Details",
        beschreibung:
            "Farben, Wangen und kleine Einzelheiten vervollständigen die Gestaltung des Pinguins."
    },
    {
        bild: "bilder/entwicklung/schritt_05.png",
        alt: "Fertige Darstellung des farbig gefüllten Pinguins",
        titel: "Der fertige Pinguin",
        beschreibung:
            "Am Ende besteht der vollständige Pinguin aus vielen farbigen Dreiecken und weich interpolierten Farbverläufen."
    }
];


// Benötigte HTML-Elemente auswählen
const slideshow =
    document.getElementById("slideshow");

const slideshowBild =
    document.getElementById("slideshowBild");

const bildZaehler =
    document.getElementById("bildZaehler");

const bildTitel =
    document.getElementById("bildTitel");

const bildBeschreibung =
    document.getElementById("bildBeschreibung");

const zurueckButton =
    document.getElementById("zurueckButton");

const weiterButton =
    document.getElementById("weiterButton");

const bildpunkte =
    document.getElementById("bildpunkte");


// Zu Beginn wird das erste Bild angezeigt
let aktuellerEntwicklungsschritt = 0;


// Erstellt die fünf kleinen Anzeigepunkte
function bildpunkteErstellen() {

    for (
        let nummer = 0;
        nummer < entwicklungsschritte.length;
        nummer++
    ) {

        const punkt =
            document.createElement("span");

        punkt.classList.add("bildpunkt");

        bildpunkte.appendChild(punkt);
    }
}


// Zeigt den ausgewählten Entwicklungsschritt an
function entwicklungsschrittAnzeigen() {

    const schritt =
        entwicklungsschritte[
            aktuellerEntwicklungsschritt
        ];

    slideshowBild.src =
        schritt.bild;

    slideshowBild.alt =
        schritt.alt;

    bildZaehler.textContent =
        "Bild " +
        (aktuellerEntwicklungsschritt + 1) +
        " von " +
        entwicklungsschritte.length;

    bildTitel.textContent =
        schritt.titel;

    bildBeschreibung.textContent =
        schritt.beschreibung;


    // Den Punkt des aktuellen Bildes hervorheben
    const punkte =
        bildpunkte.querySelectorAll(".bildpunkt");

    for (
        let nummer = 0;
        nummer < punkte.length;
        nummer++
    ) {

        punkte[nummer].classList.toggle(
            "aktiv",
            nummer === aktuellerEntwicklungsschritt
        );
    }
}


// Zeigt das vorherige Bild an
function vorherigesEntwicklungsbild() {

    aktuellerEntwicklungsschritt--;

    // Vom ersten Bild zum letzten Bild wechseln
    if (aktuellerEntwicklungsschritt < 0) {

        aktuellerEntwicklungsschritt =
            entwicklungsschritte.length - 1;
    }

    entwicklungsschrittAnzeigen();
}


// Zeigt das nächste Bild an
function naechstesEntwicklungsbild() {

    aktuellerEntwicklungsschritt++;

    // Vom letzten Bild zurück zum ersten wechseln
    if (
        aktuellerEntwicklungsschritt >=
        entwicklungsschritte.length
    ) {

        aktuellerEntwicklungsschritt = 0;
    }

    entwicklungsschrittAnzeigen();
}


// Bedienung mit den beiden Buttons
zurueckButton.addEventListener(
    "click",
    vorherigesEntwicklungsbild
);

weiterButton.addEventListener(
    "click",
    naechstesEntwicklungsbild
);


// Bedienung mit den Pfeiltasten
slideshow.addEventListener(
    "keydown",
    function(event) {

        if (event.key === "ArrowLeft") {

            event.preventDefault();

            vorherigesEntwicklungsbild();
        }

        if (event.key === "ArrowRight") {

            event.preventDefault();

            naechstesEntwicklungsbild();
        }
    }
);


// Slideshow vorbereiten
bildpunkteErstellen();
entwicklungsschrittAnzeigen();