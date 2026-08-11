// ===============================
// 1. Seguridad
// ===============================
if (!isLoggedIn()) {
    mostrarError("No tienes una sesión activa.");
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
// 3. Cargar talleres (solo GEST)
// ===============================
async function cargarTalleres() {
    const res = await fetch(`${API}/gestion-alumnos/talleres`);
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

    const res = await fetch(`${API}/gestion-alumnos/lista`, {
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

    let nombre    = capitalizarNombreCompleto(document.getElementById("altaNombre").value.trim());
    let apP       = capitalizarNombreCompleto(document.getElementById("altaApellidoP").value.trim());
    let apM       = capitalizarNombreCompleto(document.getElementById("altaApellidoM").value.trim());
    let matricula = document.getElementById("altaMatricula").value.trim().replace(/\s+/g, "");
    const usuario = document.getElementById("altaUsuario").value.trim();
    const pass    = document.getElementById("altaPassword").value.trim();
    const pass2   = document.getElementById("altaPassword2").value.trim();

    if (!tallerSeleccionado) {
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

    // Validar matrícula
    if (!/^\d{8}$/.test(matricula)) {
        mostrarError("La matrícula debe tener exactamente 8 dígitos.");
        return;
    }

    // Validar usuario case-sensitive
    if (usuario !== document.getElementById("altaUsuario").value) {
        mostrarError("El usuario distingue entre mayúsculas y minúsculas.");
        return;
    }

    // Validar contraseña case-sensitive
    if (pass !== document.getElementById("altaPassword").value) {
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
    const res = await fetch(`${API}/gestion-alumnos/alta`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            nombre,
            apellido_paterno: apP,
            apellido_materno: apM,
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
    mostrarError("Documento se implementará si queda tiempo.");
};

// ===============================
// 10. Cargar alumnos al inicio
// ===============================
if (usuario.userType === "INST") {
    cargarAlumnos();
}

async function cargarTalleresAlta() {
    const res = await fetch(`${API}/gestion-alumnos/talleres`);
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

modalAlta.addEventListener("click", (e) => {
    // Si el clic fue en el fondo (overlay), cerrar
    if (e.target === modalAlta) {
        modalAlta.classList.add("oculto");
    }
});

document.addEventListener("click", (e) => {

    // ===============================
    // 1. Menú de talleres dentro del modal de alta
    // ===============================
    const menuAlta = document.getElementById("menuTalleresAlta");

    if (menuAlta && !menuAlta.classList.contains("oculto")) {

        // Si el clic fue dentro del menú → no cerrar
        if (menuAlta.contains(e.target)) return;

        // Si el clic fue en el botón de abrir menú → no cerrar
        if (e.target === btnSeleccionarTaller) return;

        // Si el clic fue fuera → cerrar
        menuAlta.classList.add("oculto");
    }

    // ===============================
    // 2. Menú de talleres principal (GEST)
    // ===============================
    const menuPrincipal = document.getElementById("menuTalleres");

    if (menuPrincipal && !menuPrincipal.classList.contains("oculto")) {

        // Si el clic fue dentro del menú → no cerrar
        if (menuPrincipal.contains(e.target)) return;

        // Si el clic fue en el botón de abrir menú → no cerrar
        if (e.target === btnTaller) return;

        // Si el clic fue fuera → cerrar
        menuPrincipal.classList.add("oculto");
    }

});
