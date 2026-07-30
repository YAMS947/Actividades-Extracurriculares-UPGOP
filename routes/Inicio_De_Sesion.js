// ============================================================
// RUTA: Inicio de sesión
// Archivo: routes/Inicio_De_Sesion.js
// Descripción:
// Valida las credenciales del usuario y devuelve la información
// necesaria para manejar la sesión en el frontend.
// ============================================================

const express = require('express');
const router = express.Router();
const db = require('../db'); // Ajusta la ruta según tu proyecto

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
router.post('/', (req, res) => {

    // Extraemos usuario y contraseña del body
    const { usuario, contrasena } = req.body;

    // Consulta SQL para validar credenciales
    const sqlLogin = `
        SELECT 
            id_usuario,
            usuario,
            tipo_usuario
        FROM usuarios
        WHERE usuario = ? AND contrasena = ?;
    `;

    // Ejecutamos la consulta
    db.query(sqlLogin, [usuario, contrasena], (err, result) => {
        if (err) {
            console.error("Error en inicio de sesión:", err);
            return res.status(500).json({ error: "Error en el servidor" });
        }

        // Si no se encontró el usuario
        if (result.length === 0) {
            return res.status(401).json({ error: "Usuario o contraseña incorrectos" });
        }

        // Extraemos datos del usuario
        const user = result[0];

        // Si el usuario es GESTOR, no tiene taller asignado
        if (user.tipo_usuario === "GEST") {
            return res.json({
                mensaje: "Inicio de sesión exitoso",
                id_usuario: user.id_usuario,
                tipo_usuario: user.tipo_usuario
            });
        }

        // Si el usuario es ALUM o INST, obtenemos su taller
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

            // Si no tiene taller asignado (caso raro)
            if (tallerResult.length === 0) {
                return res.json({
                    mensaje: "Inicio de sesión exitoso",
                    id_usuario: user.id_usuario,
                    tipo_usuario: user.tipo_usuario,
                    id_taller: null,
                    nombre_taller: null
                });
            }

            // Taller encontrado
            const taller = tallerResult[0];

            res.json({
                mensaje: "Inicio de sesión exitoso",
                id_usuario: user.id_usuario,
                tipo_usuario: user.tipo_usuario,
                id_taller: taller.id_taller,
                nombre_taller: taller.nombre_taller
            });
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
