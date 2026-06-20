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
    res.sendFile(path.join(__dirname, 'P_Principal', 'index.html'));
    console.log(Exitoso)
});

// ===============================
//  RUTA DE PRUEBA DE BASE DE DATOS
// ===============================
app.get('/test-db', (req, res) => {
    db.query('SELECT 1 + 1 AS resultado', (err, results) => {
        if (err) {
            console.error('Error en la consulta:', err);
            return res.status(500).json({ error: 'Error en la base de datos' });
        }
        res.json({ mensaje: 'Conexión exitosa', resultado: results[0].resultado });
    });
});

// ===============================
//  INICIAR SERVIDOR
// ===============================
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
