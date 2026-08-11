// ===============================
// 1. Seguridad
// ===============================
if (!isLoggedIn()) {
    mostrarError("No tienes una sesión activa.");
    window.location.href = "/public/Pages/P_Inicio_De_Sesion/inicioSesion.html";
}

const usuario = getUser();

// Solo GEST puede entrar
if (usuario.userType !== "GEST") {
    mostrarError("No autorizado.");
    window.location.href = "/";
}

// ================================
// Funcion de blindado de alta
// ================================
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
    const res = await fetch(`${API}/gestion-instructores/talleres`);
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

    const res = await fetch(`${API}/gestion-instructores/lista`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            tipo_usuario: usuario.userType
        })
    });

    const data = await res.json();
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

    let nombre = capitalizarNombreCompleto(document.getElementById("instNombre").value.trim());
    let apP = capitalizarNombreCompleto(document.getElementById("instApellidoP").value.trim());
    let apM = capitalizarNombreCompleto(document.getElementById("instApellidoM").value.trim());
    const usuarioNuevo = document.getElementById("instUsuario").value.trim();
    const pass = document.getElementById("instPassword").value.trim();
    const pass2 = document.getElementById("instPassword2").value.trim();

    if (!tallerSeleccionadoInst) {
        mostrarError("Selecciona un taller.");
        return;
    }

    const soloLetras = /^[A-Za-zÁÉÍÓÚáéíóúÑñ ]+$/;

    // Validar nombre
    if (!soloLetras.test(nombre)) {
        mostrarError("El nombre solo puede contener letras y espacios.");
        return;
    }
    if (nombre.length < 2 || nombre.length > 35) {
        mostrarError("El nombre debe tener entre 2 y 35 caracteres.");
        return;
    }

    // Validar apellidos
    if (!soloLetras.test(apP) || !soloLetras.test(apM)) {
        mostrarError("Los apellidos solo pueden contener letras y espacios.");
        return;
    }
    if (apP.length < 2 || apP.length > 20 || apM.length < 2 || apM.length > 20) {
        mostrarError("Cada apellido debe tener entre 2 y 20 caracteres.");
        return;
    }

    // Validar usuario case-sensitive
    if (usuarioNuevo !== document.getElementById("instUsuario").value) {
        mostrarError("El usuario distingue entre mayúsculas y minúsculas.");
        return;
    }

    // Validar contraseña case-sensitive
    if (pass !== document.getElementById("instPassword").value) {
        mostrarError("La contraseña distingue entre mayúsculas y minúsculas.");
        return;
    }

    // Validar contraseñas
    if (pass.length < 8) {
        mostrarError("La contraseña debe tener al menos 8 caracteres.");
        return;
    }
    if (pass !== pass2) {
        mostrarError("Las contraseñas no coinciden.");
        return;
    }

    // Enviar datos blindados
    const res = await fetch(`${API}/gestion-instructores/alta`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            tipo_usuario: usuario.userType,
            nombre,
            apellido_paterno: apP,
            apellido_materno: apM,
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
    mostrarError("Documento se implementará si queda tiempo.");
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

document.addEventListener("click", (e) => {

    const menuInst = document.getElementById("menuTalleresInst");

    // Si el menú está oculto, no hacemos nada
    if (menuInst && !menuInst.classList.contains("oculto")) {

        // Si el clic fue dentro del menú → no cerrar
        if (menuInst.contains(e.target)) return;

        // Si el clic fue en el botón de abrir menú → no cerrar
        if (e.target === btnSeleccionarTallerInst) return;

        // Si el clic fue fuera → cerrar
        menuInst.classList.add("oculto");
    }

});