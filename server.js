// ===============================
//  IMPORTS
// ===============================
const express = require('express');
const path = require('path');
const db = require('./db'); // conexión MySQL
const app = express();

// ===============================
//  MIDDLEWARES
// ===============================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// ===============================
//  RUTA PRINCIPAL (HTML)
// ===============================
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'P_Principal', 'index.html'));// Encuentra la ruta de la primer página a mostrar
});

/* REGISTRO DE MODULOS */
app.use(' /alumnos' , require('./routes/alumnos'));

// ===============================
//  INICIAR SERVIDOR
// ===============================
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});


