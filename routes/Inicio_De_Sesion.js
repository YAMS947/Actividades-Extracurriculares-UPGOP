// ============================================================
// RUTA: Inicio de sesión
// Archivo: routes/Inicio_De_Sesion.js
// Descripción:
// Valida las credenciales del usuario y devuelve la información
// necesaria para manejar la sesión en el frontend.
// ============================================================

const express = require('express');
const router = express.Router();
const db = require('../db'); 
// ============================================================
// 1. INICIO DE SESIÓN
// ------------------------------------------------------------
// Recibe usuario y contraseña.
// Verifica si existe en la base de datos.
// Devuelve:
// - id_usuario
// - tipo_usuario
// - id_taller (si aplica)
// - nombre_taller (si aplica)
// ============================================================
router.post("/", (req, res) => {

    const usuario = req.body.usuario;
    const contrasena = req.body.contrasena;

    if (!usuario || !contrasena) {
        return res.status(400).json({ error: "Usuario o contraseña incorrectos." });
    }

    const sqlUsuario = `
        SELECT id_usuario, usuario, contrasena, tipo_usuario
        FROM usuarios
        WHERE usuario = ?;
    `;

    db.query(sqlUsuario, [usuario], (err, result) => {
        if (err) {
            console.error("Error al obtener usuario:", err);
            return res.status(500).json({ error: "Error al obtener usuario" });
        }

        if (result.length === 0) {
            return res.status(400).json({ error: "Usuario o contraseña incorrectos." });
        }

        const user = result[0];

        if (user.contrasena !== contrasena) {
            return res.status(400).json({ error: "Usuario o contraseña incorrectos." });
        }

        // ============================
        // OBTENER TALLER DEL USUARIO
        // ============================
        const sqlTaller = `
            SELECT 
                taller.id_taller,
                taller.nombre_taller
            FROM taller_usuario
            INNER JOIN taller
                ON taller_usuario.id_taller = taller.id_taller
            WHERE taller_usuario.id_usuario = ?;
        `;

        db.query(sqlTaller, [user.id_usuario], (err, tallerResult) => {
            if (err) {
                console.error("Error al obtener taller:", err);
                return res.status(500).json({ error: "Error al obtener taller" });
            }

            const taller = tallerResult.length > 0
                ? tallerResult[0]
                : { id_taller: null, nombre_taller: null };

            // ============================
            // OBTENER FECHA DE INGRESO (ALUM)
            // ============================
            if (user.tipo_usuario === "ALUM") {

            const sqlFechaIngreso = `
                SELECT fecha
                FROM fecha_ingreso
                WHERE id_usuario = ? AND id_taller = ?;
            `;

            db.query(sqlFechaIngreso, [user.id_usuario, taller.id_taller], (err, fechaResult) => {
                if (err) {
                    console.error("Error al obtener fecha de ingreso:", err);
                    return res.status(500).json({ error: "Error al obtener fecha de ingreso" });
                }

                const fechaIngreso = fechaResult.length > 0
                    ? fechaResult[0].fecha
                    : null;
                console.log("La fecha ingreso de la ruta es: ",fechaIngreso)
                return res.json({
                    mensaje: "Inicio de sesión exitoso",
                    id_usuario: user.id_usuario,
                    tipo_usuario: user.tipo_usuario,
                    id_taller: taller.id_taller,
                    nombre_taller: taller.nombre_taller,
                    fecha_ingreso: fechaIngreso
                });
            });
        }
            else {
                console.log("Se considero no alumno")
                // INST y GEST no tienen fecha de ingreso
                return res.json({
                    mensaje: "Inicio de sesión exitoso",
                    id_usuario: user.id_usuario,
                    tipo_usuario: user.tipo_usuario,
                    id_taller: taller.id_taller,
                    nombre_taller: taller.nombre_taller,
                    fecha_ingreso: null
                });
            }
        });
    });
});


// ============================================================
// RUTA: Registro de alumno
// Archivo: routes/Inicio_De_Sesion.js
// Descripción:
// Registra un nuevo alumno en el sistema. Inserta datos en la
// tabla usuarios, matricula_usuario y fecha_ingreso.
// ============================================================

router.post('/registro-alumno', (req, res) => {

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

                    res.json({
                    mensaje: "registro_exitoso",
                    id_usuario: user.id_usuario
                    });
                });
            }
        );
    });
});


module.exports = router;
