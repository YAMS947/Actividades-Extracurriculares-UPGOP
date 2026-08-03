// ===============================
// 1. Seguridad y contexto
// ===============================
if (!isLoggedIn()) {
    alert("No tienes una sesión activa.");
    window.location.href = "../P_Inicio_De_Sesion/inicioSesion.html";
}

const usuario = getUser();

if (usuario.userType !== "ALUM" && usuario.userType !== "INST" && usuario.userType !== "GEST") {
    alert("No autorizado.");
    window.location.href = "/";
}

// ===============================
// 2. Elementos del DOM
// ===============================
const celNombre       = document.getElementById("alumNombre");
const celApellidos    = document.getElementById("alumApellidos");
const celCarrera      = document.getElementById("alumCarrera");
const celGrado        = document.getElementById("alumGrado");
const celMatricula    = document.getElementById("alumMatricula");
const celTaller       = document.getElementById("alumTaller");
const celTelefono     = document.getElementById("alumTelefono");
const celFechaIngreso = document.getElementById("alumFechaIngreso");
const celAsistencias  = document.getElementById("alumAsistencias");

const btnDocumento = document.getElementById("btnDocumento");
const btnModificar = document.getElementById("btnModificar");
const btnCancelarEdicion = document.getElementById("btnCancelarEdicion");
const btnBaja      = document.getElementById("btnBaja");

const menuCarreras = document.getElementById("menuCarreras");
const menuGrados   = document.getElementById("menuGrados");

const modalBaja          = document.getElementById("modalBaja");
const cerrarModalBaja    = document.getElementById("cerrarModalBaja");
const btnConfirmarBaja   = document.getElementById("btnConfirmarBaja");
const btnCancelarBaja    = document.getElementById("btnCancelarBaja");
const nombreAlumnoBaja   = document.getElementById("nombreAlumnoBaja");

let datosAlumno = null;
let listaCarreras = [];
let modoEdicion = false;

// ===============================
// 3. Determinar qué alumno mostrar
// ===============================
function construirBodyDatos() {
    if (usuario.userType === "ALUM") {
        return {
            tipo_usuario: "ALUM",
            id_usuario: usuario.userId
        };
    }

    const seleccionadoStr = localStorage.getItem("alumnoSeleccionado");
    if (!seleccionadoStr) {
        alert("No se seleccionó ningún alumno.");
        window.location.href = "../P_Gestion_De_Alumnos/alumnos.html";
        return null;
    }

    const seleccionado = JSON.parse(seleccionadoStr);

    return {
    tipo_usuario: usuario.userType,
    matricula: seleccionado.matricula
};

}

// ===============================
// 4. Cargar datos del alumno
// ===============================
async function cargarDatosAlumno() {
    const body = construirBodyDatos();
    if (!body) return;

    const res = await fetch("/gestion-alumno/datos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    });

    const data = await res.json();

    if (data.error) {
        alert("Error al obtener datos del alumno: " + data.error);
        return;
    }

    datosAlumno   = data.alumno;
    listaCarreras = data.carreras || [];

    // Manejo de nulls: mostrar vacío si no hay dato
    const nombre   = datosAlumno.nombre || "";
    const apP      = datosAlumno.apellido_paterno || "";
    const apM      = datosAlumno.apellido_materno || "";
    const carrera  = datosAlumno.nombre_carrera || "";
    const grado    = datosAlumno.grado || "";
    const matric   = datosAlumno.matricula || "";
    const taller   = datosAlumno.nombre_taller || "";
    const tel      = datosAlumno.telefono || "";
    const fecha    = datosAlumno.fecha || datosAlumno.fecha_ingreso || "";
    const asistAct = datosAlumno.dias_asistidos || 0;
    const asistTot = datosAlumno.dias_totales || 0;

    celNombre.textContent       = nombre;
    celApellidos.textContent    = `${apP} ${apM}`.trim();
    celCarrera.textContent      = carrera;
    celGrado.textContent        = grado ? `${grado}°` : "";
    celMatricula.textContent    = matric;
    celTaller.textContent       = taller;
    celTelefono.textContent     = tel;
    celFechaIngreso.textContent = fecha;
    celAsistencias.textContent  = `${asistAct} de ${asistTot}`;

    // Seguridad extra: si es ALUM y no es su propio id, no puede modificar
    if (usuario.userType === "ALUM" && String(datosAlumno.id_usuario) !== String(usuario.userId)) {
        btnModificar.disabled = true;
        btnModificar.textContent = "No puedes modificar estos datos";
    }

    // Nombre para el modal de baja
    nombreAlumnoBaja.textContent = `${nombre} ${apP} ${apM}`.trim();
}

// ===============================
// 5. Modo edición: activar / desactivar
// ===============================
function activarEdicion() {
    modoEdicion = true;
    btnModificar.textContent = "Guardar";
    btnCancelarEdicion.classList.remove("oculto");

    celNombre.classList.add("campo-editable");
    celApellidos.classList.add("campo-editable");
    celCarrera.classList.add("campo-editable");
    celGrado.classList.add("campo-editable");
    celMatricula.classList.add("campo-editable");
    celTelefono.classList.add("campo-editable");

    celNombre.contentEditable    = "true";
    celApellidos.contentEditable = "true";
    celMatricula.contentEditable = "true";
    celTelefono.contentEditable  = "true";

    // Carreras: menú desplegable
    celCarrera.onclick = () => {
        if (!modoEdicion) return;
        mostrarMenuCarreras();
    };

    // Grados: menú desplegable
    celGrado.onclick = () => {
        if (!modoEdicion) return;
        mostrarMenuGrados();
    };
}

function desactivarEdicion() {
    modoEdicion = false;
    btnModificar.textContent = "Modificar datos";
    btnCancelarEdicion.classList.add("oculto");

    celNombre.classList.remove("campo-editable");
    celApellidos.classList.remove("campo-editable");
    celCarrera.classList.remove("campo-editable");
    celGrado.classList.remove("campo-editable");
    celMatricula.classList.remove("campo-editable");
    celTelefono.classList.remove("campo-editable");

    celNombre.contentEditable    = "false";
    celApellidos.contentEditable = "false";
    celMatricula.contentEditable = "false";
    celTelefono.contentEditable  = "false";

    celCarrera.onclick = null;
    celGrado.onclick   = null;

    menuCarreras.classList.add("oculto");
    menuGrados.classList.add("oculto");
}

// ===============================
// 6. Menú de carreras y grados
// ===============================
function mostrarMenuCarreras() {
    menuCarreras.innerHTML = "";
    listaCarreras.forEach(c => {
        const div = document.createElement("div");
        div.textContent = c.nombre_carrera;
        div.onclick = () => {
            celCarrera.textContent = c.nombre_carrera;
            datosAlumno.id_carrera = c.id_carrera;
            menuCarreras.classList.add("oculto");
        };
        menuCarreras.appendChild(div);
    });

    menuCarreras.style.top  = (celCarrera.getBoundingClientRect().bottom + window.scrollY) + "px";
    menuCarreras.style.left = (celCarrera.getBoundingClientRect().left + window.scrollX) + "px";
    menuCarreras.classList.remove("oculto");
}

function mostrarMenuGrados() {
    menuGrados.innerHTML = "";
    for (let i = 1; i <= 10; i++) {
        const div = document.createElement("div");
        div.textContent = `${i}°`;
        div.onclick = () => {
            celGrado.textContent = `${i}°`;
            datosAlumno.grado = String(i);
            menuGrados.classList.add("oculto");
        };
        menuGrados.appendChild(div);
    }

    menuGrados.style.top  = (celGrado.getBoundingClientRect().bottom + window.scrollY) + "px";
    menuGrados.style.left = (celGrado.getBoundingClientRect().left + window.scrollX) + "px";
    menuGrados.classList.remove("oculto");
}

// ===============================
// 7. Validaciones antes de guardar
// ===============================
function validarDatosEditados() {
    const nombre    = celNombre.textContent.trim();
    const apellidos = celApellidos.textContent.trim();
    const carrera   = celCarrera.textContent.trim();
    const gradoTxt  = celGrado.textContent.trim();
    const matricula = celMatricula.textContent.trim();
    const telefono  = celTelefono.textContent.trim();

    if (!nombre || !apellidos || !matricula) {
    alert("Nombre, apellidos y matrícula son obligatorios.");
    return null;
    }

    if (nombre.length > 35) {
        alert("El nombre no puede tener más de 35 caracteres.");
        return null;
    }

    if (apellidos.length > 20) {
        alert("Los apellidos no pueden tener más de 20 caracteres.");
        return null;
    }

    if (!/^\d{8}$/.test(matricula)) {
        alert("La matrícula debe tener exactamente 8 dígitos.");
        return null;
    }

   // Teléfono opcional: si está vacío, se acepta.
    // Si tiene contenido, debe ser solo dígitos y máximo 15.
    if (telefono && !/^\d{0,15}$/.test(telefono)) {
        alert("El número telefónico no puede tener más de 15 dígitos.");
        return null;
    }

    const gradoNum = gradoTxt.replace("°", "");
    if (!/^\d+$/.test(gradoNum) || Number(gradoNum) < 1 || Number(gradoNum) > 10) {
        alert("El grado debe estar entre 1° y 10°.");
        return null;
    }

    const partesAp = apellidos.split(" ");
    const apP = partesAp[0] || "";
    const apM = partesAp.slice(1).join(" ") || "";

    return {
        nombre,
        apellido_paterno: apP,
        apellido_materno: apM,
        matricula_nueva: matricula,
        telefono,
        grado: gradoNum,
        id_carrera: datosAlumno.id_carrera ?? null
    };
}

// ===============================
// 8. Guardar cambios
// ===============================
async function guardarCambios() {
    const datos = validarDatosEditados();
    if (!datos) return;

    // Si el alumno no tiene carrera y el usuario no seleccionó una, no enviar id_carrera
    if (datos.id_carrera === null) {
        delete body.id_carrera;
    }

    const body = {
        tipo_usuario: usuario.userType,
        nombre: datos.nombre,
        apellido_paterno: datos.apellido_paterno,
        apellido_materno: datos.apellido_materno,
        matricula_nueva: datos.matricula_nueva,
        telefono: datos.telefono,
        id_carrera: datos.id_carrera,
        grado: datos.grado
    };

    if (usuario.userType === "ALUM") {
        body.id_usuario = datosAlumno.id_usuario;
    } else {
        body.matricula = datosAlumno.matricula;
    }

    const res = await fetch("/gestion-alumno/actualizar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    });

    const data = await res.json();

    if (data.error) {
        alert("Error al actualizar datos: " + data.error);
        return;
    }

    alert("Datos del alumno actualizados correctamente.");
    desactivarEdicion();
    cargarDatosAlumno();
}

// ===============================
// 9. Botón Modificar / Guardar
// ===============================
btnModificar.onclick = () => {
    if (usuario.userType === "ALUM" && String(datosAlumno.id_usuario) !== String(usuario.userId)) {
        alert("No puedes modificar datos de otro alumno.");
        return;
    }

    if (!modoEdicion) {
        activarEdicion();
    } else {
        guardarCambios();
    }
};

// ===============================
// 10. Dar de baja (modal)
// ===============================
btnBaja.onclick = () => {
    modalBaja.classList.remove("oculto");
};

cerrarModalBaja.onclick = () => modalBaja.classList.add("oculto");
btnCancelarBaja.onclick = () => modalBaja.classList.add("oculto");

btnConfirmarBaja.onclick = async () => {
    const res = await fetch("/gestion-alumno/baja", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_usuario: datosAlumno.id_usuario })
    });

    const data = await res.json();

    if (data.error) {
        alert("Error al dar de baja al alumno del taller: " + data.error);
        return;
    }

    alert("Alumno dado de baja del taller correctamente.");
    modalBaja.classList.add("oculto");
    cargarDatosAlumno();
};

// ===============================
// 11. Documento (simple)
// ===============================
btnDocumento.onclick = () => {
    alert("Documento se implementará más adelante.");
};

// ===============================
// 12. Cargar datos al inicio
// ===============================
cargarDatosAlumno();


btnCancelarEdicion.onclick = () => {
    desactivarEdicion();
    cargarDatosAlumno(); // restaurar valores originales
};

