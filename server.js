// ===============================
//  IMPORTS
// ===============================
const express = require('express'); // Framework para crear el servidor
const path = require('path'); // Manejo de rutas de archivos 
const db = require('./db'); // conexión MySQL
const app = express(); // Inicializa la app de express
const cors = require('cors');

// ===============================
//  MIDDLEWARES
// ===============================
// Permite recibir datos en formato JSON desde el frontend
app.use(express.json()); 

// Permite recibir datos desde formularios HTML
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos (HTML, CSS, JS)
app.use('/public', express.static(path.join(__dirname, 'public')));

// Permite la comunicación entre el Front-End y el Back-End
// Incluso cuando tienen origenes diferentes
// Para producción se requiere configuración extra para evitar vulnerabilidades
app.use(cors());

// ===============================
//  RUTA PRINCIPAL (HTML)
// ===============================
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));// Encuentra la ruta de la primer página a mostrar
});

// =======================
// IMPORTAR RUTAS
// =======================

// Inicio de sesión
const inicioSesionRoutes = require('./routes/Inicio_De_Sesion');

// Gestión de un alumno (datos, baja, actualizar)
const gestionAlumnoRoutes = require('./routes/Gestion_De_Alumno');

// Gestión de alumnos (lista, alta, etc.)
const gestionAlumnosRoutes = require('./routes/Gestion_De_Alumnos');

// Gestión de un instructor (datos, baja, actualizar)
const gestionInstructorRoutes = require('./routes/Gestion_De_Instructor');

// Gestión de instructores (lista, alta, etc.)
const gestionInstructoresRoutes = require('./routes/Gestion_De_Instructores');

// Pase de lista
const paseListaRoutes = require('./routes/Pase_De_Lista');

// Calendario
const calendarioRoutes = require('./routes/Calendario');

// Solicitudes (consultar, aceptar, rechazar)
const solicitudesRoutes = require('./routes/Solicitudes');

// Registrar solicitud (alumno)
const registrarSolicitudRoutes = require('./routes/Registrar_Solicitud');

// =======================
// REGISTRAR RUTAS
// =======================

const API = require("./api");

// Inicio de sesión
app.use(`${API}/inicio-sesion`, inicioSesionRoutes);

// Gestión de un alumno
app.use(`${API}/gestion-alumno`, gestionAlumnoRoutes);

// Gestión de alumnos (lista, alta)
app.use(`${API}/gestion-alumnos`, gestionAlumnosRoutes);

// Gestión de un instructor
app.use(`${API}/gestion-instructor`, gestionInstructorRoutes);

// Gestión de instructores (lista, alta)
app.use(`${API}/gestion-instructores`, gestionInstructoresRoutes);

// Pase de lista
app.use(`${API}/pase-lista`, paseListaRoutes);

// Calendario
app.use(`${API}/calendario`, calendarioRoutes);

// Solicitudes (gestor/instructor)
app.use(`${API}/solicitudes`, solicitudesRoutes);

// Registrar solicitud (alumno)
app.use(`${API}/registrar-solicitud`, registrarSolicitudRoutes);

app.use((req, res, next) => {
    console.log("Petición recibida:", req.method, req.originalUrl);
    next();
});


// ===============================
//  INICIAR SERVIDOR
// ===============================
const PORT = 3000; // Es el puerto que abrimos con nginx
app.listen(PORT, () => { 
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});


