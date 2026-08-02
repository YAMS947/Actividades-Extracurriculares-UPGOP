if (isLoggedIn()) {
    window.location.href = "/";
}

const vistaLogin = document.getElementById("vistaLogin");
const vistaRegistro = document.getElementById("vistaRegistro");

document.getElementById("abrirRegistro").onclick = () => {
    vistaLogin.classList.remove("visible");
    vistaRegistro.classList.add("visible");
};

document.getElementById("btnCancelar").onclick = () => {
    limpiarRegistro();
    vistaRegistro.classList.remove("visible");
    vistaLogin.classList.add("visible");
};

document.querySelector(".link-terminos").onclick = () => {
    document.getElementById("modalTerminos").style.display = "flex";
};

function camposVacios(campos) {
    return campos.some(c => c.trim() === "");
}

function limpiarRegistro() {
    document.getElementById("regNombre").value = "";
    document.getElementById("regApellidoP").value = "";
    document.getElementById("regApellidoM").value = "";
    document.getElementById("regMatricula").value = "";
    document.getElementById("regUsuario").value = "";
    document.getElementById("regPassword").value = "";
    document.getElementById("regPassword2").value = "";
    document.getElementById("aceptarTerminos").checked = false;
}

function mostrarError(mensaje) {
    document.getElementById("modalErrorMensaje").textContent = mensaje;
    document.getElementById("modalError").classList.add("visible");
}

document.getElementById("cerrarError").onclick = () => {
    document.getElementById("modalError").classList.remove("visible");
};

document.getElementById("modalError").onclick = (e) => {
    if (e.target.id === "modalError") {
        document.getElementById("modalError").classList.remove("visible");
    }
};

document.getElementById("btnLogin").onclick = async () => {

    const usuario = document.getElementById("loginUsuario").value.trim();
    const contrasena = document.getElementById("loginPassword").value.trim();

    if (camposVacios([usuario, contrasena])) {
        mostrarError("Usuario o contraseña incorrectos.");
        return;
    }

    try {
        const respuesta = await fetch("/inicio-sesion", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ usuario, contrasena })
        });

        const data = await respuesta.json();

        if (!respuesta.ok) {
            mostrarError(data.error || "Usuario o contraseña incorrectos.");
            return;
        }

        // Guardar en localStorage
        setUser({
            userType: data.tipo_usuario,
            userName: usuario,
            userId: data.id_usuario
        });

        window.location.href = "/";

    } catch (error) {
        mostrarError("Error en el servidor: " + error.message);
    }
};

document.getElementById("btnGuardar").onclick = async () => {

    const nombre = document.getElementById("regNombre").value.trim();
    const apellido_paterno = document.getElementById("regApellidoP").value.trim();
    const apellido_materno = document.getElementById("regApellidoM").value.trim();
    const matricula = document.getElementById("regMatricula").value.trim();
    const usuario = document.getElementById("regUsuario").value.trim();
    const contrasena = document.getElementById("regPassword").value.trim();
    const contrasena2 = document.getElementById("regPassword2").value.trim();
    const terminos = document.getElementById("aceptarTerminos").checked;

    if (camposVacios([nombre, apellido_paterno, apellido_materno, matricula, usuario, contrasena, contrasena2])) {
        mostrarError("Todos los campos son obligatorios.");
        return;
    }

    // Validar longitud mínima de contraseña
    if (contrasena.length < 8) {
        mostrarError("La contraseña debe tener al menos 8 caracteres.");
        return;
    }

    if (contrasena !== contrasena2) {
        mostrarError("Las contraseñas no coinciden.");
        return;
    }

    if (!terminos) {
        mostrarError("Debes aceptar los Términos y Condiciones.");
        return;
    }

    try {
        const respuesta = await fetch("/inicio-sesion/registro-alumno", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                nombre,
                apellido_paterno,
                apellido_materno,
                matricula,
                usuario,
                contrasena
            })
        });

        const data = await respuesta.json();

        if (!respuesta.ok) {
            if (data.error === "usuario_existente") {
                mostrarError("El usuario ya existe.");
            } else {
                mostrarError("Error al registrar: " + data.error);
            }
            return;
        }

        mostrarError("Registro exitoso. Ahora inicia sesión.");

        limpiarRegistro();

        vistaRegistro.classList.remove("visible");
        vistaLogin.classList.add("visible");

    } catch (error) {
        mostrarError("Error en el servidor: " + error.message);
    }
};

// Detectar Enter para iniciar sesión o registrar
document.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {

        // Si la vista de login está visible
        if (vistaLogin.classList.contains("visible")) {
            document.getElementById("btnLogin").click();
        }

        // Si la vista de registro está visible
        if (vistaRegistro.classList.contains("visible")) {
            document.getElementById("btnGuardar").click();
        }
    }
});

// Soporte de Enter/Escape para cerrar modales
document.addEventListener("keydown", (e) => {

    // Modal de error
    const modalError = document.getElementById("modalError");
    if (modalError.classList.contains("visible")) {

        // Enter o Escape cierran el modal de error
        if (e.key === "Enter" || e.key === "Escape") {
            modalError.classList.remove("visible");
        }
    }

    // Modal de términos
    const modalTerminos = document.getElementById("modalTerminos");
    if (modalTerminos.style.display === "flex") {

        // Solo Escape cierra el modal de términos
        if (e.key === "Escape") {
            modalTerminos.style.display = "none";
        }
    }
});
