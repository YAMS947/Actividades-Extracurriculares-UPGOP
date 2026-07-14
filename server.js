// ===============================
//  IMPORTS
// ===============================
const express = require('express'); // Framework para crear el servidor
const path = require('path'); // Manejo de rutas de archivos 
const db = require('./db'); // conexión MySQL
const app = express(); // Inicializa la app de express

// ===============================
//  MIDDLEWARES
// ===============================
// Permite recibir datos en formato JSON desde el frontend
app.use(express.json()); 

// Permite recibir datos desde formularios HTML
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// ===============================
//  RUTA PRINCIPAL (HTML)
// ===============================
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'P_Principal', 'index.html'));// Encuentra la ruta de la primer página a mostrar
});

/* REGISTRO DE MODULOS 
    Con estos creamos las conexiónes entre el .js lógico de cada sección
    y .js donde accedemos a la base de datos con su conexión a este mismo .js
*/
//       (Referencia a usar,     Ruta donde se encuentra la logíca para manejar los datos)


// ===============================
//  INICIAR SERVIDOR
// ===============================
const PORT = 3000; // Es el puerto que abrimos con nginx
app.listen(PORT, () => { 
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});


