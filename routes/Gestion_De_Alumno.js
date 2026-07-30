// ============================================================
// RUTA: Gestión de Alumno
// Archivo: routes/Gestion_De_Alumno.js
// Descripción:
// - Obtiene los datos completos de un alumno.
// - Permite dar de baja al alumno (eliminar su taller).
// Considera quién está viendo la información:
//   - Alumno (ve sus propios datos)
//   - Instructor / Gestor (ve datos de un alumno seleccionado)
// ============================================================

const express = require('express');
const router = express.Router();
const db = require('../db'); // Ajusta la ruta según tu proyecto

// ============================================================
// 1. OBTENER DATOS DE UN ALUMNO
// ------------------------------------------------------------
// POST /gestion-alumno/datos
//
// Body (casos):
//  A) Alumno viendo sus propios datos:
//     {
//       "tipo_usuario": "ALUM",
//       "id_usuario": 12
//     }
//
//  B) Instructor / Gestor viendo datos de un alumno:
//     {
//       "tipo_usuario": "INST" | "GEST",
//       "matricula": "A12345",
//       "nombre": "Juan",
//       "apellido_paterno": "Pérez",
//       "apellido_materno": "López"
//     }
//
// Lógica:
//  - Si es ALUM → usar id_usuario directamente.
//  - Si es INST/GESTOR → buscar alumno por matrícula (y opcionalmente nombre).
//  - Con el id_usuario del alumno, ejecutar la consulta completa.
// ============================================================
router.post('/datos', (req, res) => {
    const {
        tipo_usuario,
        id_usuario,
        matricula,
        nombre,
        apellido_paterno,
        apellido_materno
    } = req.body;

    if (!tipo_usuario) {
        return res.status(400).json({ error: "Falta tipo_usuario" });
    }

    // ==========================
    // CASO A: Alumno
    // ==========================
    if (tipo_usuario === "ALUM") {
        if (!id_usuario) {
            return res.status(400).json({ error: "Falta id_usuario para alumno" });
        }

        return obtenerDatosAlumnoPorId(id_usuario, res);
    }

    // ==========================
    // CASO B: Instructor / Gestor
    // ==========================
    if (tipo_usuario === "INST" || tipo_usuario === "GEST") {

        if (!matricula) {
            return res.status(400).json({ error: "Falta matrícula del alumno" });
        }

        // Buscar al alumno por matrícula (y opcionalmente nombre completo)
        const sqlBuscarAlumno = `
            SELECT 
                id_usuario,
                nombre,
                apellido_paterno,
                apellido_materno
            FROM usuarios
            INNER JOIN matricula_usuario
                ON usuarios.id_usuario = matricula_usuario.id_usuario
            WHERE matricula_usuario.matricula = ?;
        `;

        db.query(sqlBuscarAlumno, [matricula], (err, result) => {
            if (err) {
                console.error("Error al buscar alumno por matrícula:", err);
                return res.status(500).json({ error: "Error al buscar alumno" });
            }

            if (result.length === 0) {
                return res.status(404).json({ error: "No se encontró alumno con esa matrícula" });
            }

            // Si quisieras validar también nombre completo, aquí podrías hacerlo.
            const alumno = result[0];
            const idAlumno = alumno.id_usuario;

            return obtenerDatosAlumnoPorId(idAlumno, res);
        });

        return;
    }

    // ==========================
    // CASO C: Otros tipos
    // ==========================
    return res.status(403).json({ error: "Tipo de usuario no autorizado para esta operación" });
});


// ============================================================
// FUNCIÓN AUXILIAR: Obtener datos completos de un alumno por id
// ------------------------------------------------------------
// Ejecuta la consulta grande que trae:
// - Nombre, apellidos
// - Carrera, grado
// - Matrícula
// - Taller
// - Teléfono
// - Fecha de ingreso
// - Días asistidos
// - Días totales posibles
// ============================================================
function obtenerDatosAlumnoPorId(id_usuario, res) {

    const sqlDatosAlumno = `
        SELECT
            usuarios.nombre,     
            usuarios.apellido_paterno,     
            usuarios.apellido_materno,     
            carrera.nombre_carrera,     
            grado_usuario.grado,     
            matricula_usuario.matricula,     
            taller.nombre_taller,     
            usuarios.telefono,
            fecha_ingreso.fecha,   
            (SELECT 
                COUNT(id_dia)
             FROM asistencia
             WHERE id_usuario = ?) AS dias_asistidos,
            (SELECT 
                COUNT(id_dia)
             FROM dia_activo
             WHERE fecha > 
                (SELECT fecha FROM fecha_ingreso WHERE id_usuario = ?) 
             AND id_taller = 
                (SELECT id_taller FROM taller_usuario WHERE id_usuario = ?)
            ) AS dias_totales
        FROM usuarios 
        LEFT JOIN carrera_usuario 
            ON usuarios.id_usuario = carrera_usuario.id_usuario 
        LEFT JOIN carrera 
            ON carrera_usuario.id_carrera = carrera.id_carrera 
        LEFT JOIN grado_usuario 
            ON usuarios.id_usuario = grado_usuario.id_usuario 
        LEFT JOIN matricula_usuario 
            ON usuarios.id_usuario = matricula_usuario.id_usuario 
        LEFT JOIN taller_usuario 
            ON usuarios.id_usuario = taller_usuario.id_usuario 
        LEFT JOIN taller 
            ON taller_usuario.id_taller = taller.id_taller 
        LEFT JOIN fecha_ingreso 
            ON usuarios.id_usuario = fecha_ingreso.id_usuario 
        WHERE usuarios.id_usuario = ?;
    `;

    db.query(
        sqlDatosAlumno,
        [id_usuario, id_usuario, id_usuario, id_usuario],
        (err, result) => {
            if (err) {
                console.error("Error al obtener datos del alumno:", err);
                return res.status(500).json({ error: "Error al obtener datos del alumno" });
            }

            if (result.length === 0) {
                return res.status(404).json({ error: "No se encontraron datos para este alumno" });
            }

            res.json({
                mensaje: "Datos del alumno obtenidos correctamente",
                alumno: result[0]
            });
        }
    );
}


// ============================================================
// 2. DAR DE BAJA AL ALUMNO (ELIMINAR SU TALLER)
// ------------------------------------------------------------
// POST /gestion-alumno/baja
//
// Body:
//   {
//     "id_usuario": 12
//   }
//
// Lógica:
//   - Elimina el registro de taller_usuario para ese alumno.
//   - No elimina al usuario, solo lo desasocia del taller.
// ============================================================
router.post('/baja', (req, res) => {
    const { id_usuario } = req.body;

    if (!id_usuario) {
        return res.status(400).json({ error: "Falta id_usuario del alumno" });
    }

    const sqlBajaTaller = `
        DELETE FROM taller_usuario
        WHERE id_usuario = ?;
    `;

    db.query(sqlBajaTaller, [id_usuario], (err, result) => {
        if (err) {
            console.error("Error al dar de baja al alumno del taller:", err);
            return res.status(500).json({ error: "Error al dar de baja al alumno del taller" });
        }

        res.json({
            mensaje: "Alumno dado de baja del taller correctamente",
            filas_afectadas: result.affectedRows
        });
    });
});

module.exports = router;