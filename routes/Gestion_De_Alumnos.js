// ============================================================
// RUTA: Gestión de Alumnos
// Archivo: routes/Gestion_De_Alumnos.js
// Descripción:
// Maneja la obtención de la lista de alumnos, considerando el
// tipo de usuario (GESTOR o INSTRUCTOR), y permite dar de alta
// nuevos alumnos.
// ============================================================

const express = require('express');
const router = express.Router();
const db = require('../db'); // Ajusta la ruta según tu proyecto

// ============================================================
// 1. OBTENER TODOS LOS TALLERES (solo para gestores)
// ------------------------------------------------------------
// Esta ruta devuelve todos los talleres registrados.
// El frontend decide si mostrar el selector según tipo_usuario.
// ============================================================
router.get('/talleres', (req, res) => {

    const sql = `
        SELECT id_taller, nombre_taller
        FROM taller;
    `;

    db.query(sql, (err, result) => {
        if (err) {
            console.error("Error al obtener talleres:", err);
            return res.status(500).json({ error: "Error al obtener talleres" });
        }

        res.json({
            mensaje: "Talleres obtenidos correctamente",
            talleres: result
        });
    });
});


// ============================================================
// 2. OBTENER LISTA DE ALUMNOS
// ------------------------------------------------------------
// Recibe:
// - id_usuario
// - tipo_usuario
// - id_taller (solo si es gestor)
//
// Lógica:
// - Si es INSTRUCTOR → obtener su taller automáticamente.
// - Si es GESTOR → usar el taller enviado por el frontend.
// ============================================================
router.post('/lista', (req, res) => {

    const { id_usuario, tipo_usuario, id_taller } = req.body;

    if (!id_usuario || !tipo_usuario) {
        return res.status(400).json({ error: "Faltan datos de sesión" });
    }

    // ============================================================
    // CASO 1: INSTRUCTOR → obtener taller automáticamente
    // ============================================================
    if (tipo_usuario === "INST") {

        const sqlTallerInstructor = `
            SELECT id_taller
            FROM taller_usuario
            WHERE id_usuario = ?;
        `;

        db.query(sqlTallerInstructor, [id_usuario], (err, result) => {
            if (err) {
                console.error("Error al obtener taller del instructor:", err);
                return res.status(500).json({ error: "Error al obtener taller del instructor" });
            }

            if (result.length === 0) {
                return res.status(404).json({ error: "El instructor no tiene taller asignado" });
            }

            const tallerInstructor = result[0].id_taller;

            obtenerListaAlumnos(tallerInstructor, res);
        });

        return;
    }

    // ============================================================
    // CASO 2: GESTOR → usar taller enviado por el frontend
    // ============================================================
    if (tipo_usuario === "GEST") {

        if (!id_taller) {
            return res.status(400).json({ error: "El gestor debe enviar id_taller" });
        }

        obtenerListaAlumnos(id_taller, res);
        return;
    }

    // ============================================================
    // CASO 3: ALUMNO → no tiene permiso
    // ============================================================
    return res.status(403).json({ error: "No tienes permiso para ver esta lista" });
});


// ============================================================
// FUNCIÓN AUXILIAR: Obtener lista de alumnos
// ============================================================
function obtenerListaAlumnos(id_taller, res) {

    const sqlLista = `
        SELECT 
            usuarios.nombre,
            CONCAT(usuarios.apellido_paterno, ' ', usuarios.apellido_materno) AS apellidos,
            taller.nombre_taller,
            matricula_usuario.matricula
        FROM usuarios
        INNER JOIN taller_usuario
            ON usuarios.id_usuario = taller_usuario.id_usuario
        INNER JOIN taller
            ON taller_usuario.id_taller = taller.id_taller
        INNER JOIN matricula_usuario
            ON usuarios.id_usuario = matricula_usuario.id_usuario
        WHERE usuarios.tipo_usuario = "ALUM"
        AND taller.id_taller = ?;
    `;

    db.query(sqlLista, [id_taller], (err, result) => {
        if (err) {
            console.error("Error al obtener lista de alumnos:", err);
            return res.status(500).json({ error: "Error al obtener lista de alumnos" });
        }

        res.json({
            mensaje: "Lista de alumnos obtenida correctamente",
            alumnos: result
        });
    });
}


// ============================================================
// 3. DAR DE ALTA UN ALUMNO
// ------------------------------------------------------------
// Es exactamente igual que el registro del inicio de sesión.
// ============================================================
router.post('/alta', (req, res) => {

    const {
        nombre,
        apellido_paterno,
        apellido_materno,
        matricula,
        usuario,
        contrasena
    } = req.body;

    if (!nombre || !apellido_paterno || !apellido_materno ||
        !matricula || !usuario || !contrasena) {
        return res.status(400).json({ error: "faltan_datos" });
    }

    // ============================================================
    // 1. Verificar si el nombre de usuario ya existe
    // ============================================================
    const sqlCheckUsuario = `
        SELECT usuario 
        FROM usuarios 
        WHERE usuario = ?;
    `;

    db.query(sqlCheckUsuario, [usuario], (err, result) => {
        if (err) {
            console.error("Error al verificar usuario:", err);
            return res.status(500).json({ error: "error_servidor" });
        }

        if (result.length > 0) {
            return res.status(409).json({ error: "usuario_existente" });
        }

        // ============================================================
        // 2. Insertar usuario
        // ============================================================
        const sqlInsertUsuario = `
            INSERT INTO usuarios 
            (nombre, apellido_paterno, apellido_materno, usuario, contrasena, tipo_usuario)
            VALUES (?, ?, ?, ?, ?, "ALUM");
        `;

        db.query(sqlInsertUsuario,
            [nombre, apellido_paterno, apellido_materno, usuario, contrasena],
            (err, result) => {

                if (err) {
                    console.error("Error al registrar usuario:", err);
                    return res.status(500).json({ error: "error_registro_usuario" });
                }

                const id_usuario = result.insertId;

                // ============================================================
                // 3. Insertar matrícula
                // ============================================================
                const sqlInsertMatricula = `
                    INSERT INTO matricula_usuario (id_usuario, matricula)
                    VALUES (?, ?);
                `;

                db.query(sqlInsertMatricula, [id_usuario, matricula], (err) => {
                    if (err) {
                        console.error("Error al registrar matrícula:", err);
                        return res.status(500).json({ error: "error_registro_matricula" });
                    }

                    // ============================================================
                    // 4. Insertar fecha de ingreso
                    // ============================================================
                    const fechaActual = new Date();

                    const sqlInsertFecha = `
                        INSERT INTO fecha_ingreso (id_usuario, fecha)
                        VALUES (?, ?);
                    `;

                    db.query(sqlInsertFecha, [id_usuario, fechaActual], (err) => {
                        if (err) {
                            console.error("Error al registrar fecha:", err);
                            return res.status(500).json({ error: "error_registro_fecha" });
                        }

                        res.json({
                            mensaje: "registro_exitoso",
                            id_usuario: id_usuario
                        });
                    });
                });
            }
        );
    });
});

module.exports = router;
