// ===============================
// 1. Seguridad y contexto
// ===============================
if (!isLoggedIn()) {
    mostrarError("No tienes una sesión activa.");
    window.location.href = "/public/Pages/P_Inicio_De_Sesion/inicioSesion.html";
}

const usuario = getUser();

// Instructor y Gestor pueden entrar.
// Alumno NO puede entrar.
if (usuario.userType !== "INST" && usuario.userType !== "GEST") {
    mostrarError("No autorizado.");
    window.location.href = "/";
}

if (user.userType !== "GEST") {
    document.getElementById("btnRegresar").classList.add("oculto");
}

if (usuario.userType === "GEST"){
    document.getElementById("btnRegresar").onclick = () => {
        window.location.href = "/public/Pages/P_Gestion_De_Instructores/instructores.html";
    };
}

// ===============================
// 2. Elementos del DOM
// ===============================
const celNombre       = document.getElementById("instNombre");
const celApellidos    = document.getElementById("instApellidos");
const celTaller       = document.getElementById("instTaller");
const celTelefono     = document.getElementById("instTelefono");

const btnDocumento        = document.getElementById("btnDocumento");
const btnModificar        = document.getElementById("btnModificar");
const btnCancelarEdicion  = document.getElementById("btnCancelarEdicion");
const btnBaja             = document.getElementById("btnBaja");

const modalBaja        = document.getElementById("modalBaja");
const cerrarModalBaja  = document.getElementById("cerrarModalBaja");
const btnConfirmarBaja = document.getElementById("btnConfirmarBaja");
const btnCancelarBaja  = document.getElementById("btnCancelarBaja");
const nombreInstructorBaja = document.getElementById("nombreInstructorBaja");

let datosInstructor = null;
let modoEdicion = false;

// ===============================
// 3. Determinar qué instructor mostrar
// ===============================
function construirBodyDatos() {

    // Instructor viendo sus propios datos
    if (usuario.userType === "INST") {
        return {
            tipo_usuario: "INST",
            id_usuario: usuario.userId
        };
    }

    // Gestor viendo datos de un instructor seleccionado
    const seleccionadoStr = localStorage.getItem("instructorSeleccionado");
    if (!seleccionadoStr) {
        mostrarError("No se seleccionó ningún instructor.");
        window.location.href = "/public/Pages/P_Gestion_De_Instructores/instructores.html";
        return null;
    }

    const seleccionado = JSON.parse(seleccionadoStr);

    return {
        tipo_usuario: "GEST",
        id_usuario: seleccionado.id_usuario
    };
}

// ===============================
// 4. Cargar datos del instructor
// ===============================
async function cargarDatosInstructor() {
    const body = construirBodyDatos();
    if (!body) return;

    const res = await fetch(`${API}/gestion-instructor/datos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    });

    const data = await res.json();

    if (data.error) {
        mostrarError("Error al obtener datos del instructor: " + data.error);
        return;
    }

    datosInstructor = data.instructor;

    // Manejo de nulls
    const nombre   = datosInstructor.nombre || "";
    const apP      = datosInstructor.apellido_paterno || "";
    const apM      = datosInstructor.apellido_materno || "";
    const taller   = datosInstructor.nombre_taller || "";
    const telefono = datosInstructor.telefono || "";

    celNombre.textContent    = nombre;
    celApellidos.textContent = `${apP} ${apM}`.trim();
    celTaller.textContent    = taller;
    celTelefono.textContent  = telefono;

    // Ocultar botón de baja si eres instructor
    if (usuario.userType === "INST") {
        btnBaja.style.display = "none";
    }

    // Seguridad: Instructor solo puede modificar sus propios datos
    if (usuario.userType === "INST" && String(datosInstructor.id_usuario) !== String(usuario.userId)) {
        btnModificar.disabled = true;
        btnModificar.textContent = "No puedes modificar estos datos";
    }

    // Nombre para el modal de baja
    nombreInstructorBaja.textContent = `${nombre} ${apP} ${apM}`.trim();
}

// ===============================
// 5. Activar edición
// ===============================
function activarEdicion() {
    modoEdicion = true;

    celNombre.classList.add("campo-editable");
    celApellidos.classList.add("campo-editable");
    celTelefono.classList.add("campo-editable");

    celNombre.contentEditable = true;
    celApellidos.contentEditable = true;
    celTelefono.contentEditable = true;

    btnModificar.textContent = "Guardar";
    btnCancelarEdicion.classList.remove("oculto");
}

// ===============================
// 6. Desactivar edición
// ===============================
function desactivarEdicion() {
    modoEdicion = false;

    celNombre.classList.remove("campo-editable");
    celApellidos.classList.remove("campo-editable");
    celTelefono.classList.remove("campo-editable");

    celNombre.contentEditable = false;
    celApellidos.contentEditable = false;
    celTelefono.contentEditable = false;

    btnModificar.textContent = "Modificar datos";
    btnCancelarEdicion.classList.add("oculto");
}

// ===============================
// 7. Validaciones antes de guardar
// ===============================
function capitalizarNombreCompleto(texto) {
    if (!texto) return "";

    return texto
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim()
        .split(" ")
        .map(p => {
            const excepciones = ["de", "del", "la", "las", "los", "y"];
            return excepciones.includes(p)
                ? p
                : p.charAt(0).toUpperCase() + p.slice(1);
        })
        .join(" ");
}

function validarDatosInstructor() {

    let nombre = capitalizarNombreCompleto(celNombre.textContent.trim());
    let apellidos = capitalizarNombreCompleto(celApellidos.textContent.trim());
    let telefono = celTelefono.textContent.trim();

    const soloLetras = /^[A-Za-zÁÉÍÓÚáéíóúÑñ ]+$/;

    // Validar nombre
    if (!soloLetras.test(nombre)) {
        mostrarError("El nombre solo puede contener letras y espacios.");
        return null;
    }
    if (nombre.length < 2 || nombre.length > 35) {
        mostrarError("El nombre debe tener entre 2 y 35 caracteres.");
        return null;
    }

    // Validar apellidos
    if (!soloLetras.test(apellidos)) {
        mostrarError("Los apellidos solo pueden contener letras y espacios.");
        return null;
    }
    if (apellidos.length < 2 || apellidos.length > 20) {
        mostrarError("Los apellidos deben tener entre 2 y 20 caracteres.");
        return null;
    }

    // Validar teléfono
    if (telefono.length > 0 && !/^\d+$/.test(telefono)) {
        mostrarError("El número telefónico solo puede contener dígitos.");
        return null;
    }
    if (telefono.length > 0 && (telefono.length < 10 || telefono.length > 15)) {
        mostrarError("El número telefónico debe tener entre 10 y 15 dígitos.");
        return null;
    }

    return { nombre, apellidos, telefono };
}

celTelefono.addEventListener("input", () => {
    const sel = window.getSelection();
    const pos = sel.anchorOffset;

    const original = celTelefono.textContent;
    const limpio = original.replace(/\D/g, "");

    if (original !== limpio) {
        celTelefono.textContent = limpio;

        const range = document.createRange();
        range.setStart(celTelefono.childNodes[0], limpio.length);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
    }
});

function validarDatosEditados() {

    // Normalizar y capitalizar
    let nombre    = capitalizarNombreCompleto(celNombre.textContent.trim());
    let apellidos = capitalizarNombreCompleto(celApellidos.textContent.trim());
    let telefono  = celTelefono.textContent.trim();

    const soloLetras = /^[A-Za-zÁÉÍÓÚáéíóúÑñ ]+$/;

    // Validar nombre
    if (!soloLetras.test(nombre)) {
        mostrarError("El nombre solo puede contener letras y espacios.");
        return null;
    }
    if (nombre.length < 2 || nombre.length > 35) {
        mostrarError("El nombre debe tener entre 2 y 35 caracteres.");
        return null;
    }

    // Validar apellidos
    if (!soloLetras.test(apellidos)) {
        mostrarError("Los apellidos solo pueden contener letras y espacios.");
        return null;
    }
    if (apellidos.length < 2 || apellidos.length > 40) {
        mostrarError("Los apellidos deben tener entre 2 y 40 caracteres.");
        return null;
    }

    // Separar apellidos en paterno y materno
    const partesAp = apellidos.split(" ");
    const apP = partesAp[0] || "";
    const apM = partesAp.slice(1).join(" ") || "";

    if (apP.length > 20 || apM.length > 20) {
        mostrarError("Cada apellido no puede tener más de 20 caracteres.");
        return null;
    }

    // Validar teléfono
    if (telefono.length > 0) {

        if (!/^\d+$/.test(telefono)) {
            mostrarError("El número telefónico solo puede contener dígitos.");
            return null;
        }

        if (telefono.length < 10 || telefono.length > 15) {
            mostrarError("El número telefónico debe tener entre 10 y 15 dígitos.");
            return null;
        }
    }

    return {
        nombre,
        apellido_paterno: apP,
        apellido_materno: apM,
        telefono
    };
}

// ===============================
// 8. Guardar cambios
// ===============================
async function guardarCambios() {
    const datos = validarDatosEditados();
    if (!datos) return;

    const body = {
        tipo_usuario: usuario.userType,
        id_usuario: datosInstructor.id_usuario,
        nombre: datos.nombre,
        apellido_paterno: datos.apellido_paterno,
        apellido_materno: datos.apellido_materno,
        telefono: datos.telefono
    };

    const res = await fetch(`${API}/gestion-instructor/actualizar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    });

    const data = await res.json();

    if (data.error) {
        mostrarError("Error al actualizar datos del instructor: " + data.error);
        return;
    }

    mostrarError("Datos del instructor actualizados correctamente.");
    desactivarEdicion();
    cargarDatosInstructor();
}

// ===============================
// 9. Botón Modificar / Guardar
// ===============================
btnModificar.onclick = () => {
    if (!modoEdicion) {
        activarEdicion();
    } else {
        guardarCambios();
    }
};

// ===============================
// 10. Cancelar edición
// ===============================
btnCancelarEdicion.onclick = () => {
    desactivarEdicion();
    cargarDatosInstructor();
};

// ===============================
// 11. Dar de baja (modal)
// ===============================
btnBaja.onclick = () => {
    modalBaja.classList.remove("oculto");
};

cerrarModalBaja.onclick = () => modalBaja.classList.add("oculto");
btnCancelarBaja.onclick = () => modalBaja.classList.add("oculto");

btnConfirmarBaja.onclick = async () => {
    const res = await fetch(`${API}/gestion-instructor/baja`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            tipo_usuario: usuario.userType,
            id_usuario: datosInstructor.id_usuario
        })
    });

    const data = await res.json();

    if (data.error) {
        mostrarError("Error al dar de baja al instructor del taller: " + data.error);
        return;
    }

    mostrarError("Instructor dado de baja correctamente.");

    // ✔ Cerrar modal
    modalBaja.classList.add("oculto");

    // ✔ Regresar a la lista de instructores
    window.location.href = "/public/Pages/P_Gestion_De_Instructores/instructores.html";
};


// ===============================
// 12. Documento (simple)
// ===============================
btnDocumento.onclick = () => {
    mostrarError("Documento se implementará más adelante.");
};

// ===============================
// 13. Cargar datos al inicio
// ===============================
cargarDatosInstructor();
