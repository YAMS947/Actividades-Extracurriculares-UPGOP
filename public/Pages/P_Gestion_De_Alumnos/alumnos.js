// ===============================
// 1. Seguridad
// ===============================
if (!isLoggedIn()) {
    alert("No tienes una sesión activa.");
    window.location.href = "/public/Pages/P_Inicio_De_Sesion/inicioSesion.html";
}

const usuario = getUser();

if (usuario.userType === "ALUM") {
    window.location.href = "/";
}

// ===============================
// 2. Elementos
// ===============================
const tabla = document.querySelector("#tablaAlumnos tbody");
const btnTaller = document.getElementById("btnTaller");
const btnDocumento = document.getElementById("btnDocumento");
const btnAlta = document.getElementById("btnAlta");

const menuTalleres = document.getElementById("menuTalleres");

const modalAlta = document.getElementById("modalAlta");
const cerrarAlta = document.getElementById("cerrarAlta");
const btnConfirmarAlta = document.getElementById("btnConfirmarAlta");
const btnCancelarAlta = document.getElementById("btnCancelarAlta");

const avisoInscrito = document.getElementById("avisoInscrito");
const btnAceptarAviso = document.getElementById("btnAceptarAviso");

let tallerSeleccionado = null;

// ===============================
// 3. Cargar talleres (solo GEST)
// ===============================
async function cargarTalleres() {
    const res = await fetch("/gestion-alumnos/talleres");
    const data = await res.json();

    menuTalleres.innerHTML = "";

    data.talleres.forEach(t => {
        const div = document.createElement("div");
        div.textContent = t.nombre_taller;

        div.onclick = () => {
        tallerSeleccionado = t.id_taller;   // ✔ ahora guardamos el ID
        menuTalleres.classList.add("oculto");
        cargarAlumnos();
    };

        menuTalleres.appendChild(div);
    });
}

// ===============================
// 4. Cargar alumnos
// ===============================
async function cargarAlumnos() {

    let body = {
        id_usuario: usuario.userId,
        tipo_usuario: usuario.userType
    };

    if (usuario.userType === "GEST") {
        if (!tallerSeleccionado) return;
        body.id_taller = tallerSeleccionado;
    }

    const res = await fetch("/gestion-alumnos/lista", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    });

    const data = await res.json();

    tabla.innerHTML = "";

    data.alumnos.forEach(a => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${a.nombre}</td>
            <td>${a.apellidos}</td>
            <td>${a.nombre_taller}</td>
            <td>${a.matricula}</td>
        `;

        tr.onclick = () => {
            localStorage.setItem("alumnoSeleccionado", JSON.stringify(a));
            window.location.href = "/public/Pages/P_Gestion_De_Alumno/alumno.html";
        };

        tabla.appendChild(tr);
    });
}

// ===============================
// 5. Botón Taller (solo GEST)
// ===============================
if (usuario.userType === "GEST") {
    btnTaller.onclick = () => {
        menuTalleres.classList.toggle("oculto");
        cargarTalleres();
    };
} else {
    btnTaller.style.display = "none";
}

// ===============================
// 6. Modal Alta
// ===============================
btnAlta.onclick = () => {
    modalAlta.classList.remove("oculto");
    if (usuario.userType === "INST") {
    tallerSeleccionado = usuario.userTallerId; // el ID del taller del instructor
    document.getElementById("tallerSeleccionado").textContent = usuario.userTallerNombre;
    }
}
cerrarAlta.onclick = () => modalAlta.classList.add("oculto");
btnCancelarAlta.onclick = () => modalAlta.classList.add("oculto");

// ===============================
// 7. Confirmar Alta
// ===============================
btnConfirmarAlta.onclick = async () => {

    const nombre = document.getElementById("altaNombre").value.trim();
    const ap = document.getElementById("altaApellidoP").value.trim();
    const am = document.getElementById("altaApellidoM").value.trim();
    const matricula = document.getElementById("altaMatricula").value.trim();
    const usuario = document.getElementById("altaUsuario").value.trim();
    const pass = document.getElementById("altaPassword").value.trim();
    const pass2 = document.getElementById("altaPassword2").value.trim();

    if (!tallerSeleccionado) {
        alert("Selecciona un taller.");
        return;
    }

    if (!nombre || !ap || !am || !matricula || !usuario || !pass || !pass2) {
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

    const res = await fetch("/gestion-alumnos/alta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            nombre,
            apellido_paterno: ap,
            apellido_materno: am,
            matricula,
            usuario,
            contrasena: pass,
            id_taller: tallerSeleccionado
        })
    });

    const data = await res.json();

    if (data.mensaje === "registro_exitoso") {
        modalAlta.classList.add("oculto");
        avisoInscrito.classList.remove("oculto");
        cargarAlumnos();
    }
};

// ===============================
// 8. Aviso inscrito
// ===============================
btnAceptarAviso.onclick = () => avisoInscrito.classList.add("oculto");

// ===============================
// 9. Documento (simple)
// ===============================
btnDocumento.onclick = () => {
    alert("Documento se implementará si queda tiempo.");
};

// ===============================
// 10. Cargar alumnos al inicio
// ===============================
if (usuario.userType === "INST") {
    cargarAlumnos();
}

async function cargarTalleresAlta() {
    const res = await fetch("/gestion-alumnos/talleres");
    const data = await res.json();

    const menu = document.getElementById("menuTalleresAlta");
    menu.innerHTML = "";

    data.talleres.forEach(t => {
        const div = document.createElement("div");
        div.textContent = t.nombre_taller;

        div.onclick = () => {
            tallerSeleccionado = t.id_taller;   // ✔ usar ID
            document.getElementById("tallerSeleccionado").textContent = t.nombre_taller;
            menu.classList.add("oculto");
        };

        menu.appendChild(div);
    });
}

btnSeleccionarTaller.onclick = () => {
    const menu = document.getElementById("menuTalleresAlta");
    menu.classList.toggle("oculto");
    cargarTalleresAlta();
};

if (usuario.userType === "GEST") {
    btnSeleccionarTaller.style.display = "block";
} else {
    btnSeleccionarTaller.style.display = "none";
}

