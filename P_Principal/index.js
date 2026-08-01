// Lista de talleres desde la BD (sin acentos)
const talleres = [
    "Futbol",
    "Baloncesto",
    "Voleibol",
    "Robotica",
    "Ajedrez",
    "Taekwondo",
    "Rondalla",
    "Baile_Folklorico"
];

let indice = 0;
const img = document.getElementById("img-carrusel");

// Colocar ruta de imagen (tú la reemplazas)
function mostrarTaller() {
    img.src = `../public/global/img/principal/${talleres[indice]}.png`;
    img.onclick = () => {
        location.href = `../Pages/P_Talleres/${talleres[indice]}/${talleres[indice]}.html`;
    };
}

document.getElementById("btn-next").onclick = () => {
    indice = (indice + 1) % talleres.length;
    mostrarTaller();
};

document.getElementById("btn-prev").onclick = () => {
    indice = (indice - 1 + talleres.length) % talleres.length;
    mostrarTaller();
};

// Auto-rotación
setInterval(() => {
    indice = (indice + 1) % talleres.length;
    mostrarTaller();
}, 5000);

// Inicial
mostrarTaller();
