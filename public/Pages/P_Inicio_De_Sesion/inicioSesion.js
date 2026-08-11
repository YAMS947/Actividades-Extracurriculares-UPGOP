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

function capitalizarNombreCompleto(texto) {
    if (!texto) return "";

    return texto
        .toLowerCase()
        .replace(/\s+/g, " ") // evitar dobles espacios
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

document.getElementById("btnLogin").onclick = async () => {

    const usuario = document.getElementById("loginUsuario").value.trim();
    const contrasena = document.getElementById("loginPassword").value.trim();

    if (usuario !== document.getElementById("loginUsuario").value) {
        mostrarError("El usuario distingue entre mayúsculas y minúsculas.");
        return;
    }

    if (contrasena !== document.getElementById("loginPassword").value) {
        mostrarError("La contraseña distingue entre mayúsculas y minúsculas.");
        return;
    }

    if (camposVacios([usuario, contrasena])) {
        mostrarError("Usuario o contraseña incorrectos.");
        return;
    }

    try {
        const respuesta = await fetch(`${API}/inicio-sesion/`, {
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
        if (data.tipo_usuario === "GEST") {
            setUser({
                userType: data.tipo_usuario,
                userName: usuario,
                userId: data.id_usuario
            });
        }
        if (data.tipo_usuario === "INST") {
            setUser({
                userType: data.tipo_usuario,
                userName: usuario,
                userId: data.id_usuario,
                userIdTaller: data.id_taller,
                userNameTaller: data.nombre_taller
            });
        }
        if (data.tipo_usuario === "ALUM") {
            setUser({
                userType: data.tipo_usuario,
                userName: usuario,
                userId: data.id_usuario,
                userIdTaller: data.id_taller,
                userNameTaller: data.nombre_taller,
                fechaIngreso: data.fecha_ingreso
            });
        }
        window.location.href = "/";

    } catch (error) {
        mostrarError("Error en el servidor: " + error.message);
    }
};

document.getElementById("btnGuardar").onclick = async () => {

    const usuario = document.getElementById("regUsuario").value.trim();
    const contrasena = document.getElementById("regPassword").value.trim();
    const contrasena2 = document.getElementById("regPassword2").value.trim();
    const terminos = document.getElementById("aceptarTerminos").checked;

    let nombre = capitalizarNombreCompleto(document.getElementById("regNombre").value.trim());
    let apellido_paterno = capitalizarNombreCompleto(document.getElementById("regApellidoP").value.trim());
    let apellido_materno = capitalizarNombreCompleto(document.getElementById("regApellidoM").value.trim());
    let matricula = document.getElementById("regMatricula").value.trim().replace(/\s+/g, "");

    const soloLetras = /^[A-Za-zÁÉÍÓÚáéíóúÑñ ]+$/;

    // Validar nombre
    if (!soloLetras.test(nombre)) {
        mostrarError("El nombre solo puede contener letras y espacios.");
        return;
    }
    if (nombre.length < 2) {
        mostrarError("El nombre debe tener al menos 2 caracteres.");
        return;
    }
    if (nombre.length > 35) {
        mostrarError("El nombre no puede tener más de 35 caracteres.");
        return;
    }

    // Validar apellidos
    if (!soloLetras.test(apellido_paterno)) {
        mostrarError("El apellido paterno solo puede contener letras y espacios.");
        return;
    }
    if (!soloLetras.test(apellido_materno)) {
        mostrarError("El apellido materno solo puede contener letras y espacios.");
        return;
    }

    if (apellido_paterno.length < 2 || apellido_materno.length < 2) {
        mostrarError("Los apellidos deben tener al menos 2 caracteres.");
        return;
    }

    if (apellido_paterno.length > 20 || apellido_materno.length > 20) {
        mostrarError("Los apellidos no pueden tener más de 20 caracteres.");
        return;
    }


    if (usuario !== document.getElementById("regUsuario").value) {
        mostrarError("El usuario distingue entre mayúsculas y minúsculas.");
        return;
    }

    if (contrasena !== document.getElementById("regPassword").value) {
        mostrarError("La contraseña distingue entre mayúsculas y minúsculas.");
        return;
    }

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

    if (!/^\d{8}$/.test(matricula)) {
        mostrarError("La matrícula debe tener exactamente 8 dígitos.");
        return;
    }

    try {
        const respuesta = await fetch(`${API}/inicio-sesion/registro-alumno`, {
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
