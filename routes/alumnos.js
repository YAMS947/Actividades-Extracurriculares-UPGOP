const express = require('express');
const router = express.Router();
const db = require('../db');

/* CRUDs */
/* READ - Mostrar alumnos */
router.get ('/', (req, res) => {
    const sql = `
        SELECT id_usuario, nombre, apellido_paterno, apellido materno 
        FROM usuarios 
        WHERE tipo_usuario = 'ALU'
    `;

    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({error: 'Error al obtener alumos'});
        res.json(results);
    });
});

/* UPDATE - Cambiar nombre del alumno */
router.put ('/:id', (req,res) => {
    const { id } = req.params;
    const { nombre, apellido_paterno, apellido_materno } = req.body;

    const sql = `
        UPDATE usuarios 
        SET nombre = ?, apellido_paterno = ?, apellido_materno = ?
        WHERE id_usuario = ? 
    `;

    db.query(sql, [nombre, apellido_paterno, apellido_materno, id], (err, results) => {
        if (err) return res.status(500).json({ error: 'Error al actualizar alumno'});
        res.json({ mensaje: 'Alumno actualizado correctamente' });
    });
});

module.exports = router;