// ============================================================
// PASE DE LISTA
// Archivo: paseLista.js
// Funciones:
// - Obtener fecha y taller desde localStorage
// - Obtener alumnos y asistencias desde backend
// - Mostrar tabla
// - Ciclo de iconos: FALTA → ASIS → JUST → FALTA
// - Crear día activo
// - Marcar asistencia / justificación / inasistencia
// - Eliminar día activo
// ============================================================

// ============================================================
// 1. OBTENER DATOS DEL USUARIO Y DEL DÍA
// ============================================================
const usuario = getUser();
const fechaSeleccionada = localStorage.getItem("paseListaDia");
let idTaller = null;

// Instructor obtiene su taller del auth
if (usuario.userType === "INST") {
    idTaller = usuario.userTallerId;
}

// Gestor obtiene el taller desde calendario
if (usuario.userType === "GEST") {
    idTaller = localStorage.getItem("paseListaTaller");
}

// Mostrar etiquetas
document.getElementById("etiquetaFecha").textContent = fechaSeleccionada;
document.getElementById("etiquetaTaller").textContent = usuario.userTallerNombre || "";


// ============================================================
// 2. FUNCIÓN PRINCIPAL: CARGAR PASE DE LISTA
// ============================================================
async function cargarPaseLista() {

    const res = await fetch("/pase-lista/ver", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            tipo_usuario: usuario.userType,
            id_usuario: usuario.userId,
            id_taller: idTaller,
            fecha: fechaSeleccionada
        })
    });

    const data = await res.json();
    console.log("Respuesta pase-lista/ver:", data);

    const cuerpo = document.getElementById("cuerpoPaseLista");
    cuerpo.innerHTML = "";

    let diaActivo = data.dia_activo;
    let idDia = data.id_dia || null;

    actualizarIndicadorDia(diaActivo);

    // ============================================================
    // 3. MOSTRAR ALUMNOS
    // ============================================================
    data.alumnos.forEach(alum => {

        const tr = document.createElement("tr");

        const tdNombre = document.createElement("td");
        tdNombre.textContent = alum.nombre;

        const tdApellidos = document.createElement("td");
        tdApellidos.textContent = alum.apellidos;

        const tdMatricula = document.createElement("td");
        tdMatricula.textContent = alum.matricula;

        const tdAsistencia = document.createElement("td");
        const icono = document.createElement("span");

        // ============================================================
        // 4. DETERMINAR ESTADO INICIAL DEL ICONO
        // ============================================================
        let estado = "FALTA"; // default

        if (diaActivo && alum.tipo) {
            if (alum.tipo === "ASIS") estado = "ASIS";
            if (alum.tipo === "JUST") estado = "JUST";
        }

        aplicarIcono(icono, estado);

        // ============================================================
        // 5. CLICK EN ICONO → CICLO FALTA → ASIS → JUST → FALTA
        // ============================================================
        icono.onclick = async () => {

            // Si el día NO es activo → crear día activo
            if (!diaActivo) {
                const crear = await fetch("/pase-lista/crear-dia", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        fecha: fechaSeleccionada,
                        id_taller: idTaller
                    })
                });

                const r = await crear.json();
                idDia = r.id_dia;
                diaActivo = true;
                actualizarIndicadorDia(true);
            }

            // Cambiar estado
            estado = siguienteEstado(estado);
            aplicarIcono(icono, estado);

            // Registrar en backend
            await fetch("/pase-lista/marcar", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id_usuario: alum.id_usuario,
                    id_taller: idTaller,
                    id_dia: idDia,
                    tipo: estado === "FALTA" ? "NONE" : estado
                })
            });
        };

        tdAsistencia.appendChild(icono);

        tr.appendChild(tdNombre);
        tr.appendChild(tdApellidos);
        tr.appendChild(tdMatricula);
        tr.appendChild(tdAsistencia);

        cuerpo.appendChild(tr);
    });
}


// ============================================================
// 6. ICONOS Y CICLO
// ============================================================
function aplicarIcono(elemento, estado) {
    elemento.className = "icono";

    if (estado === "ASIS") elemento.classList.add("icono-asistencia");
    else if (estado === "JUST") elemento.classList.add("icono-justificacion");
    else elemento.classList.add("icono-falta");
}

function siguienteEstado(estadoActual) {
    if (estadoActual === "FALTA") return "ASIS";
    if (estadoActual === "ASIS") return "JUST";
    if (estadoActual === "JUST") return "FALTA";
}


// ============================================================
// 7. INDICADOR DE DÍA ACTIVO / INACTIVO
// ============================================================
function actualizarIndicadorDia(activo) {
    const indicador = document.getElementById("indicadorDia");

    if (activo) {
        indicador.textContent = "ACTIVO";
        indicador.className = "valor estado-dia activo";
    } else {
        indicador.textContent = "INACTIVO";
        indicador.className = "valor estado-dia inactivo";
    }
}


// ============================================================
// 8. DESACTIVAR DÍA
// ============================================================
document.getElementById("btnDesactivarDia").onclick = async () => {

    const res = await fetch("/pase-lista/ver", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            tipo_usuario: usuario.userType,
            id_usuario: usuario.userId,
            id_taller: idTaller,
            fecha: fechaSeleccionada
        })
    });

    const data = await res.json();

    if (!data.dia_activo) {
        alert("El día ya está inactivo.");
        return;
    }

    await fetch("/pase-lista/eliminar-dia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_dia: data.id_dia })
    });

    actualizarIndicadorDia(false);
    cargarPaseLista();
};


// ============================================================
// 9. INICIALIZAR
// ============================================================
cargarPaseLista();
