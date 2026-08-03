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
const db = require('../db'); 

// ============================================================
// 1. OBTENER DATOS DE UN ALUMNO + CARRERAS DISPONIBLES
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
        nombre,
        apellido_paterno,
        apellido_materno,
        matricula,
    } = req.body;

    if (!tipo_usuario) {
        return res.status(400).json({ error: "falta_tipo_usuario" });
    }

    // ============================================================
    // FUNCIÓN AUXILIAR: Obtener datos completos del alumno
    // ============================================================
    function obtenerDatosAlumno(idAlumno) {

        const sqlDatos = `
            SELECT
                usuarios.id_usuario,
                usuarios.nombre,
                usuarios.apellido_paterno,
                usuarios.apellido_materno,
                carrera_usuario.id_carrera,
                carrera.nombre_carrera,
                grado_usuario.grado,
                matricula_usuario.matricula,
                taller.nombre_taller,
                usuarios.telefono,
                fecha_ingreso.fecha AS fecha_ingreso,

                -- Asistencias actuales
                (SELECT COUNT(id_dia)
                 FROM asistencia
                 WHERE id_usuario = ?) AS dias_asistidos,

                -- Asistencias totales
                (SELECT COUNT(id_dia)
                 FROM dia_activo
                 WHERE fecha > (SELECT fecha FROM fecha_ingreso WHERE id_usuario = ?)
                 AND id_taller = (SELECT id_taller FROM fecha_ingreso WHERE id_usuario = ?)
                ) AS dias_totales

            FROM usuarios
            LEFT JOIN carrera_usuario ON usuarios.id_usuario = carrera_usuario.id_usuario
            LEFT JOIN carrera ON carrera_usuario.id_carrera = carrera.id_carrera
            LEFT JOIN grado_usuario ON usuarios.id_usuario = grado_usuario.id_usuario
            LEFT JOIN matricula_usuario ON usuarios.id_usuario = matricula_usuario.id_usuario
            LEFT JOIN taller_usuario ON usuarios.id_usuario = taller_usuario.id_usuario
            LEFT JOIN taller ON taller_usuario.id_taller = taller.id_taller
            LEFT JOIN fecha_ingreso ON usuarios.id_usuario = fecha_ingreso.id_usuario
            WHERE usuarios.id_usuario = ?;
        `;

        db.query(sqlDatos, [idAlumno, idAlumno, idAlumno, idAlumno], (err, resultAlumno) => {
            if (err) {
                console.error("Error al obtener datos del alumno:", err);
                return res.status(500).json({ error: "error_obtener_datos" });
            }

            if (resultAlumno.length === 0) {
                return res.status(404).json({ error: "alumno_no_encontrado" });
            }

            // ============================================================
            // Obtener carreras disponibles
            // ============================================================
            const sqlCarreras = `
                SELECT id_carrera, nombre_carrera
                FROM carrera;
            `;

            db.query(sqlCarreras, (err, resultCarreras) => {
                if (err) {
                    console.error("Error al obtener carreras:", err);
                    return res.status(500).json({ error: "error_obtener_carreras" });
                }

                res.json({
                    mensaje: "datos_obtenidos",
                    alumno: resultAlumno[0],
                    carreras: resultCarreras
                });
            });
        });
    }

    // ============================================================
    // CASO A: Alumno viendo sus propios datos
    // ============================================================
    if (tipo_usuario === "ALUM") {

        if (!id_usuario) {
            return res.status(400).json({ error: "falta_id_usuario" });
        }

        return obtenerDatosAlumno(id_usuario);
    }

    // ============================================================
    // CASO B: Gestor o Instructor viendo datos de un alumno
    // ============================================================
    if (tipo_usuario === "GEST" || tipo_usuario === "INST") {

        if (!matricula) {
            return res.status(400).json({ error: "faltan_datos_busqueda" });
        }

        const sqlBuscar = `
            SELECT usuarios.id_usuario
            FROM usuarios
            INNER JOIN matricula_usuario
                ON usuarios.id_usuario = matricula_usuario.id_usuario
            WHERE matricula_usuario.matricula = ?;
        `;

        db.query(sqlBuscar, [matricula],
            (err, result) => {

                if (err) {
                    console.error("Error al buscar alumno:", err);
                    return res.status(500).json({ error: "error_busqueda" });
                }

                if (result.length === 0) {
                    return res.status(404).json({ error: "alumno_no_encontrado" });
                }

                const idAlumno = result[0].id_usuario;

                return obtenerDatosAlumno(idAlumno);
            }
        );

        return;
    }

    return res.status(403).json({ error: "no_autorizado" });
});


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

// ============================================================
// 3. ACTUALIZAR DATOS DEL ALUMNO
// ------------------------------------------------------------
// POST /gestion-alumno/actualizar
//
// Body:
//   {
//     "tipo_usuario": "ALUM" | "INST" | "GEST",
//     "id_usuario": 12,                // si es alumno
//     "matricula": "A12345",           // si es instructor/gestor
//     "nombre": "Juan",
//     "apellido_paterno": "Pérez",
//     "apellido_materno": "López",
//     "matricula_nueva": "A98765",
//     "telefono": "8711234567",
//     "id_carrera": 3,
//     "grado": "7"
//   }
//
// Lógica:
//   - Determinar id_usuario del alumno.
//   - UPDATE directo en usuarios.
//   - UPSERT en carrera_usuario.
//   - UPSERT en grado_usuario.
//   - UPSERT en telefono (si aplica).
// ============================================================
router.post('/actualizar', (req, res) => {

    const {
        tipo_usuario,
        id_usuario,
        matricula,
        nombre,
        apellido_paterno,
        apellido_materno,
        matricula_nueva,
        telefono,
        id_carrera,
        grado
    } = req.body;

    if (!tipo_usuario) {
        return res.status(400).json({ error: "Falta tipo_usuario" });
    }

    // ============================================================
    // 1. Determinar id_usuario del alumno
    // ============================================================
    function continuarConActualizacion(idAlumno) {

        // ============================================================
        // 2. UPDATE en usuarios (sin matrícula)
        // ============================================================
        const sqlUpdateUsuario = `
            UPDATE usuarios
            SET nombre = ?, apellido_paterno = ?, apellido_materno = ?, telefono = ?
            WHERE id_usuario = ?;
        `;

        db.query(sqlUpdateUsuario,
            [nombre, apellido_paterno, apellido_materno, telefono, idAlumno],
            (err) => {
                if (err) {
                    console.error("Error al actualizar usuario:", err);
                    return res.status(500).json({ error: "Error al actualizar usuario" });
                }

                // ============================================================
                // 3. UPDATE/INSERT matrícula_usuario
                // ============================================================
                const sqlCheckMatricula = `
                    SELECT matricula FROM matricula_usuario WHERE id_usuario = ?;
                `;

                db.query(sqlCheckMatricula, [idAlumno], (err, resultMat) => {
                    if (err) {
                        console.error("Error al verificar matrícula:", err);
                        return res.status(500).json({ error: "Error al verificar matrícula" });
                    }

                    if (resultMat.length === 0) {
                        // INSERT
                        const sqlInsertMatricula = `
                            INSERT INTO matricula_usuario (id_usuario, matricula)
                            VALUES (?, ?);
                        `;
                        db.query(sqlInsertMatricula, [idAlumno, matricula_nueva]);
                    } else {
                        // UPDATE
                        const sqlUpdateMatricula = `
                            UPDATE matricula_usuario
                            SET matricula = ?
                            WHERE id_usuario = ?;
                        `;
                        db.query(sqlUpdateMatricula, [matricula_nueva, idAlumno]);
                    }
                });

                // 3. UPSERT carrera_usuario
                if (id_carrera) {
                    const sqlCheckCarrera = `
                        SELECT id_carrera FROM carrera_usuario WHERE id_usuario = ?;
                    `;

                    db.query(sqlCheckCarrera, [idAlumno], (err, resultCarrera) => {
                        if (err) {
                            console.error("Error al verificar carrera:", err);
                            return res.status(500).json({ error: "Error al verificar carrera" });
                        }

                        if (resultCarrera.length === 0) {
                            const sqlInsertCarrera = `
                                INSERT INTO carrera_usuario (id_usuario, id_carrera)
                                VALUES (?, ?);
                            `;
                            db.query(sqlInsertCarrera, [idAlumno, id_carrera]);
                        } else {
                            const sqlUpdateCarrera = `
                                UPDATE carrera_usuario
                                SET id_carrera = ?
                                WHERE id_usuario = ?;
                            `;
                            db.query(sqlUpdateCarrera, [id_carrera, idAlumno]);
                        }
                    });
}


                // ============================================================
                // 5. UPSERT grado_usuario
                // ============================================================
                const sqlCheckGrado = `
                    SELECT grado FROM grado_usuario WHERE id_usuario = ?;
                `;

                db.query(sqlCheckGrado, [idAlumno], (err, resultGrado) => {
                    if (err) {
                        console.error("Error al verificar grado:", err);
                        return res.status(500).json({ error: "Error al verificar grado" });
                    }

                    if (resultGrado.length === 0) {
                        const sqlInsertGrado = `
                            INSERT INTO grado_usuario (id_usuario, grado)
                            VALUES (?, ?);
                        `;
                        db.query(sqlInsertGrado, [idAlumno, grado]);
                    } else {
                        const sqlUpdateGrado = `
                            UPDATE grado_usuario
                            SET grado = ?
                            WHERE id_usuario = ?;
                        `;
                        db.query(sqlUpdateGrado, [grado, idAlumno]);
                    }
                });

                // ============================================================
                // 6. RESPUESTA FINAL
                // ============================================================
                res.json({
                    mensaje: "Datos del alumno actualizados correctamente"
                });
            }
        );
    }

    // ============================================================
    // CASO A: Alumno actualizando sus propios datos
    // ============================================================
    if (tipo_usuario === "ALUM") {
        if (!id_usuario) {
            return res.status(400).json({ error: "Falta id_usuario del alumno" });
        }
        return continuarConActualizacion(id_usuario);
    }

    // ============================================================
    // CASO B: Instructor / Gestor actualizando datos de un alumno
    // ============================================================
    if (tipo_usuario === "INST" || tipo_usuario === "GEST") {

        if (!matricula) {
            return res.status(400).json({ error: "Falta matrícula del alumno" });
        }

        const sqlBuscarAlumno = `
            SELECT usuarios.id_usuario
            FROM usuarios
            INNER JOIN matricula_usuario
                ON usuarios.id_usuario = matricula_usuario.id_usuario
            WHERE matricula_usuario.matricula = ?;
        `;

        db.query(sqlBuscarAlumno, [matricula], (err, result) => {
            if (err) {
                console.error("Error al buscar alumno:", err);
                return res.status(500).json({ error: "Error al buscar alumno" });
            }

            if (result.length === 0) {
                return res.status(404).json({ error: "No se encontró alumno con esa matrícula" });
            }

            const idAlumno = result[0].id_usuario;

            return continuarConActualizacion(idAlumno);
        });

        return;
    }

    // ============================================================
    // CASO C: Tipo no permitido
    // ============================================================
    return res.status(403).json({ error: "No tienes permiso para actualizar datos" });
});


module.exports = router;