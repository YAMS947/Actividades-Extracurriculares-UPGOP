// ===============================
// 1. Seguridad y contexto
// ===============================
if (!isLoggedIn()) {
    alert("No tienes una sesión activa.");
    window.location.href = "/public/Pages/P_Inicio_De_Sesion/inicioSesion.html";
}

const usuario = getUser();

// Instructor y Gestor pueden entrar.
// Alumno NO puede entrar.
if (usuario.userType !== "INST" && usuario.userType !== "GEST") {
    alert("No autorizado.");
    window.location.href = "/";
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
        alert("No se seleccionó ningún instructor.");
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

    console.log("BODY ENVIADO:", body);

    const res = await fetch("/gestion-instructor/datos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    });

    const data = await res.json();

    if (data.error) {
        alert("Error al obtener datos del instructor: " + data.error);
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
function validarDatosEditados() {
    const nombre    = celNombre.textContent.trim();
    const apellidos = celApellidos.textContent.trim();
    const telefono  = celTelefono.textContent.trim();

    if (!nombre || !apellidos) {
        alert("Nombre y apellidos son obligatorios.");
        return null;
    }

    if (nombre.length > 35) {
        alert("El nombre no puede tener más de 35 caracteres.");
        return null;
    }

    if (apellidos.length > 35) {
        alert("Los apellidos no pueden tener más de 35 caracteres.");
        return null;
    }

    // Teléfono opcional: si está vacío, se acepta.
    // Si tiene contenido, debe ser solo dígitos y máximo 15.
    if (telefono && !/^\d{0,15}$/.test(telefono)) {
        alert("El número telefónico no puede tener más de 15 dígitos.");
        return null;
    }

    const partesAp = apellidos.split(" ");
    const apP = partesAp[0] || "";
    const apM = partesAp.slice(1).join(" ") || "";

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

    const res = await fetch("/gestion-instructor/actualizar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    });

    const data = await res.json();

    if (data.error) {
        alert("Error al actualizar datos del instructor: " + data.error);
        return;
    }

    alert("Datos del instructor actualizados correctamente.");
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
    const res = await fetch("/gestion-instructor/baja", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            tipo_usuario: usuario.userType,
            id_usuario: datosInstructor.id_usuario
        })
    });

    const data = await res.json();

    if (data.error) {
        alert("Error al dar de baja al instructor del taller: " + data.error);
        return;
    }

    alert("Instructor dado de baja correctamente.");

    // ✔ Cerrar modal
    modalBaja.classList.add("oculto");

    // ✔ Regresar a la lista de instructores
    window.location.href = "/public/Pages/P_Gestion_De_Instructores/instructores.html";
};


// ===============================
// 12. Documento (simple)
// ===============================
btnDocumento.onclick = () => {
    alert("Documento se implementará más adelante.");
};

// ===============================
// 13. Cargar datos al inicio
// ===============================
cargarDatosInstructor();
