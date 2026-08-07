// ===============================
// 1. Seguridad
// ===============================
if (!isLoggedIn()) {
    alert("No tienes una sesión activa.");
    window.location.href = "/public/Pages/P_Inicio_De_Sesion/inicioSesion.html";
}

const usuario = getUser();

// Solo GEST puede entrar
if (usuario.userType !== "GEST") {
    alert("No autorizado.");
    window.location.href = "/";
}

// ===============================
// 2. Elementos
// ===============================
const tabla = document.querySelector("#tablaInstructores tbody");
const btnDocumento = document.getElementById("btnDocumento");
const btnAltaInstructor = document.getElementById("btnAltaInstructor");

const modalAltaInstructor = document.getElementById("modalAltaInstructor");
const cerrarAltaInstructor = document.getElementById("cerrarAltaInstructor");
const btnConfirmarAltaInstructor = document.getElementById("btnConfirmarAltaInstructor");
const btnCancelarAltaInstructor = document.getElementById("btnCancelarAltaInstructor");

const avisoInstructorRegistrado = document.getElementById("avisoInstructorRegistrado");
const btnAceptarAvisoInstructor = document.getElementById("btnAceptarAvisoInstructor");

const btnSeleccionarTallerInst = document.getElementById("btnSeleccionarTallerInst");
const menuTalleresInst = document.getElementById("menuTalleresInst");

let tallerSeleccionadoInst = null;

// ===============================
// 3. Cargar talleres (solo para alta)
// ===============================
async function cargarTalleresInst() {
    const res = await fetch("/gestion-instructores/talleres");
    const data = await res.json();

    menuTalleresInst.innerHTML = "";

    data.talleres.forEach(t => {
        const div = document.createElement("div");
        div.textContent = t.nombre_taller;

        div.onclick = () => {
            tallerSeleccionadoInst = t.id_taller;
            document.getElementById("tallerSeleccionadoInst").textContent = t.nombre_taller;
            menuTalleresInst.classList.add("oculto");
        };

        menuTalleresInst.appendChild(div);
    });
}

// ===============================
// 4. Cargar instructores (TODOS)
// ===============================
async function cargarInstructores() {

    const res = await fetch("/gestion-instructores/lista", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            tipo_usuario: usuario.userType
        })
    });

    const data = await res.json();
    console.log(data)
    tabla.innerHTML = "";

    data.instructores.forEach(inst => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${inst.nombre}</td>
            <td>${inst.apellidos}</td>
            <td>${inst.nombre_taller}</td>
        `;

        tr.onclick = () => {
            localStorage.setItem("instructorSeleccionado", JSON.stringify(inst));
            window.location.href = "/public/Pages/P_Gestion_De_Instructor/instructor.html";
        };

        tabla.appendChild(tr);
    });
}

// ===============================
// 5. Modal Alta Instructor
// ===============================
btnAltaInstructor.onclick = () => {
    modalAltaInstructor.classList.remove("oculto");
};

cerrarAltaInstructor.onclick = () => modalAltaInstructor.classList.add("oculto");
btnCancelarAltaInstructor.onclick = () => modalAltaInstructor.classList.add("oculto");

// ===============================
// 6. Confirmar Alta Instructor
// ===============================
btnConfirmarAltaInstructor.onclick = async () => {

    const nombre = document.getElementById("instNombre").value.trim();
    const ap = document.getElementById("instApellidoP").value.trim();
    const am = document.getElementById("instApellidoM").value.trim();
    const usuarioNuevo = document.getElementById("instUsuario").value.trim();
    const pass = document.getElementById("instPassword").value.trim();
    const pass2 = document.getElementById("instPassword2").value.trim();

    if (!tallerSeleccionadoInst) {
        alert("Selecciona un taller.");
        return;
    }

    if (!nombre || !ap || !am || !usuarioNuevo || !pass || !pass2) {
        alert("Todos los campos son obligatorios.");
        return;
    }

    if (pass.length < 8) {
        alert("La contraseña debe tener al menos 8 caracteres.");
        return;
    }

    if (pass !== pass2) {
        alert("Las contraseñas no coinciden.");
        return;
    }

    const res = await fetch("/gestion-instructores/alta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            tipo_usuario: usuario.userType,
            nombre,
            apellido_paterno: ap,
            apellido_materno: am,
            usuario: usuarioNuevo,
            contrasena: pass,
            id_taller: tallerSeleccionadoInst
        })
    });

    const data = await res.json();

    if (data.mensaje === "registro_exitoso") {
        modalAltaInstructor.classList.add("oculto");
        avisoInstructorRegistrado.classList.remove("oculto");
        cargarInstructores();
    }
};

// ===============================
// 7. Aviso instructor registrado
// ===============================
btnAceptarAvisoInstructor.onclick = () => avisoInstructorRegistrado.classList.add("oculto");

// ===============================
// 8. Documento
// ===============================
btnDocumento.onclick = () => {
    alert("Documento se implementará si queda tiempo.");
};

// ===============================
// 9. Botón seleccionar taller
// ===============================
btnSeleccionarTallerInst.onclick = () => {
    menuTalleresInst.classList.toggle("oculto");
    cargarTalleresInst();
};

// ===============================
// 10. Cargar instructores al inicio
// ===============================
cargarInstructores();
