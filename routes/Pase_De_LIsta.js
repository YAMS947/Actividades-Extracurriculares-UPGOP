// ============================================================
// RUTA: Pase de Lista
// Archivo: routes/Pase_De_Lista.js
// Descripción:
// - Muestra lista de alumnos para un día específico.
// - Permite marcar asistencia, justificación o inasistencia.
// - Permite crear y eliminar días activos.
// ============================================================

const express = require('express');
const router = express.Router();
const db = require('../db');

// ============================================================
// 1. VER LISTA DE ALUMNOS Y ESTADO DEL DÍA
// ------------------------------------------------------------
// Body:
//   {
//     tipo_usuario: "INST" | "GEST",
//     id_usuario: 12,          // si es instructor
//     id_taller: 3,            // si es gestor
//     fecha: "2026-07-30"
//   }
// ============================================================
router.post('/ver', (req, res) => {

    const { tipo_usuario, id_usuario, id_taller, fecha } = req.body;

    if (!tipo_usuario || !fecha) {
        return res.status(400).json({ error: "faltan_datos" });
    }

    // ============================================================
    // 1. Determinar taller según tipo de usuario
    // ============================================================
    function continuarConTaller(idTallerFinal) {

        // ============================================================
        // 2. Verificar si ya existe día activo
        // ============================================================
        const sqlDia = `
            SELECT id_dia
            FROM dia_activo
            WHERE fecha = ?
            AND id_taller = ?;
        `;

        db.query(sqlDia, [fecha, idTallerFinal], (err, resultDia) => {
            if (err) {
                console.error("Error al verificar día activo:", err);
                return res.status(500).json({ error: "error_verificar_dia" });
            }

            // ============================================================
            // CASO A: Día NO existe → enviar lista de alumnos sin asistencia
            // ============================================================
            if (resultDia.length === 0) {

                const sqlAlumnos = `
                    SELECT 
                        usuarios.id_usuario,
                        usuarios.nombre,
                        CONCAT(usuarios.apellido_paterno, ' ', usuarios.apellido_materno) AS apellidos,
                        matricula_usuario.matricula
                    FROM usuarios
                    INNER JOIN taller_usuario
                        ON usuarios.id_usuario = taller_usuario.id_usuario
                    INNER JOIN matricula_usuario
                        ON usuarios.id_usuario = matricula_usuario.id_usuario
                    WHERE usuarios.tipo_usuario = "ALUM"
                    AND taller_usuario.id_taller = ?;
                `;

                db.query(sqlAlumnos, [idTallerFinal], (err, alumnos) => {
                    if (err) {
                        console.error("Error al obtener alumnos:", err);
                        return res.status(500).json({ error: "error_obtener_alumnos" });
                    }

                    res.json({
                        mensaje: "dia_nuevo",
                        dia_activo: false,
                        alumnos: alumnos
                    });
                });

                return;
            }

            // ============================================================
            // CASO B: Día SÍ existe → obtener asistencias
            // ============================================================
            const idDia = resultDia[0].id_dia;

            const sqlAsistencias = `
                SELECT 
                    usuarios.id_usuario,
                    usuarios.nombre,
                    CONCAT(usuarios.apellido_paterno, ' ', usuarios.apellido_materno) AS apellidos,
                    matricula_usuario.matricula,
                    asistencia.tipo
                FROM usuarios
                INNER JOIN matricula_usuario
                    ON usuarios.id_usuario = matricula_usuario.id_usuario
                INNER JOIN taller_usuario
                    ON usuarios.id_usuario = taller_usuario.id_usuario
                LEFT JOIN asistencia
                    ON usuarios.id_usuario = asistencia.id_usuario
                    AND asistencia.id_dia = ?
                WHERE usuarios.tipo_usuario = "ALUM"
                AND taller_usuario.id_taller = ?;
            `;

            db.query(sqlAsistencias, [idDia, idTallerFinal], (err, alumnos) => {
                if (err) {
                    console.error("Error al obtener asistencias:", err);
                    return res.status(500).json({ error: "error_obtener_asistencias" });
                }

                res.json({
                    mensaje: "dia_existente",
                    dia_activo: true,
                    id_dia: idDia,
                    alumnos: alumnos
                });
            });
        });
    }

    // ============================================================
    // Determinar taller según tipo de usuario
    // ============================================================
    if (tipo_usuario === "INST") {

        const sqlTaller = `
            SELECT id_taller
            FROM taller_usuario
            WHERE id_usuario = ?;
        `;

        db.query(sqlTaller, [id_usuario], (err, result) => {
            if (err) {
                console.error("Error al obtener taller del instructor:", err);
                return res.status(500).json({ error: "error_taller_instructor" });
            }

            if (result.length === 0) {
                return res.status(404).json({ error: "instructor_sin_taller" });
            }

            continuarConTaller(result[0].id_taller);
        });

        return;
    }

    if (tipo_usuario === "GEST") {
        continuarConTaller(id_taller);
        return;
    }

    return res.status(403).json({ error: "no_autorizado" });
});


// ============================================================
// 2. CREAR DÍA ACTIVO
// ------------------------------------------------------------
// Se ejecuta cuando se marca la primera asistencia o justificación.
// ============================================================
router.post('/crear-dia', (req, res) => {

    const { fecha, id_taller } = req.body;

    if (!fecha || !id_taller) {
        return res.status(400).json({ error: "faltan_datos" });
    }

    const sqlInsertDia = `
        INSERT INTO dia_activo (fecha, id_taller)
        VALUES (?, ?);
    `;

    db.query(sqlInsertDia, [fecha, id_taller], (err, result) => {
        if (err) {
            console.error("Error al crear día activo:", err);
            return res.status(500).json({ error: "error_crear_dia" });
        }

        res.json({
            mensaje: "dia_creado",
            id_dia: result.insertId
        });
    });
});


// ============================================================
// 3. MARCAR ASISTENCIA / JUSTIFICACIÓN / INASISTENCIA
// ------------------------------------------------------------
// Body:
//   {
//     id_usuario: 12,
//     id_taller: 3,
//     id_dia: 5,
//     tipo: "ASIS" | "JUST" | "NONE"
//   }
// ============================================================
router.post('/marcar', (req, res) => {

    const { id_usuario, id_taller, id_dia, tipo } = req.body;

    if (!id_usuario || !id_taller || !id_dia || !tipo) {
        return res.status(400).json({ error: "faltan_datos" });
    }

    // ============================================================
    // INASISTENCIA → eliminar registro
    // ============================================================
    if (tipo === "NONE") {

        const sqlDelete = `
            DELETE FROM asistencia
            WHERE id_usuario = ?
            AND id_taller = ?
            AND id_dia = ?;
        `;

        db.query(sqlDelete, [id_usuario, id_taller, id_dia], (err) => {
            if (err) {
                console.error("Error al eliminar asistencia:", err);
                return res.status(500).json({ error: "error_eliminar_asistencia" });
            }

            return res.json({ mensaje: "inasistencia_registrada" });
        });

        return;
    }

    // ============================================================
    // ASISTENCIA o JUSTIFICACIÓN → verificar si ya existe
    // ============================================================
    const sqlCheck = `
        SELECT tipo
        FROM asistencia
        WHERE id_usuario = ?
        AND id_taller = ?
        AND id_dia = ?;
    `;

    db.query(sqlCheck, [id_usuario, id_taller, id_dia], (err, result) => {
        if (err) {
            console.error("Error al verificar asistencia:", err);
            return res.status(500).json({ error: "error_verificar_asistencia" });
        }

        // ============================================================
        // Si NO existe → INSERT
        // ============================================================
        if (result.length === 0) {

            const sqlInsert = `
                INSERT INTO asistencia (id_usuario, id_taller, id_dia, tipo)
                VALUES (?, ?, ?, ?);
            `;

            db.query(sqlInsert, [id_usuario, id_taller, id_dia, tipo], (err) => {
                if (err) {
                    console.error("Error al registrar asistencia:", err);
                    return res.status(500).json({ error: "error_insert_asistencia" });
                }

                return res.json({ mensaje: "asistencia_registrada" });
            });

            return;
        }

        // ============================================================
        // Si SÍ existe → UPDATE
        // ============================================================
        const sqlUpdate = `
            UPDATE asistencia
            SET tipo = ?
            WHERE id_usuario = ?
            AND id_taller = ?
            AND id_dia = ?;
        `;

        db.query(sqlUpdate, [tipo, id_usuario, id_taller, id_dia], (err) => {
            if (err) {
                console.error("Error al actualizar asistencia:", err);
                return res.status(500).json({ error: "error_update_asistencia" });
            }

            return res.json({ mensaje: "asistencia_actualizada" });
        });
    });
});


// ============================================================
// 4. ELIMINAR DÍA ACTIVO
// ------------------------------------------------------------
// Body:
//   {
//     id_dia: 5
//   }
// ============================================================
router.post('/eliminar-dia', (req, res) => {

    const { id_dia } = req.body;

    if (!id_dia) {
        return res.status(400).json({ error: "faltan_datos" });
    }

    const sqlDeleteDia = `
        DELETE FROM dia_activo
        WHERE id_dia = ?;
    `;

    db.query(sqlDeleteDia, [id_dia], (err) => {
        if (err) {
            console.error("Error al eliminar día activo:", err);
            return res.status(500).json({ error: "error_eliminar_dia" });
        }

        res.json({ mensaje: "dia_eliminado" });
    });
});

module.exports = router;