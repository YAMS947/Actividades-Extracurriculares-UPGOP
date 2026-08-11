const user = getUser();

const menu = document.getElementById("menu-hamb");

function construirMenu() {
    menu.innerHTML = "";

    let inicio;

    if (user.userType === "NONE") {
        // Usuario sin sesión → botón funciona normal
        inicio = crearItem("Iniciar sesión", "/public/Pages/P_Inicio_De_Sesion/inicioSesion.html");
    } else {
        // Usuario con sesión → botón deshabilitado
        inicio = document.createElement("div");
        inicio.className = "menu-item menu-item-disabled";
        inicio.textContent = user.userName;
    }

    menu.appendChild(inicio);

    if (user.userType === "NONE") return;

    if (user.userType === "ALUM") {
        menu.appendChild(crearItem("Horarios", "/public/Pages/P_Calendario/calendario.html"));
        menu.appendChild(crearItem("Mis datos", "/public/Pages/P_Gestion_De_Alumno/alumno.html"));
        menu.appendChild(crearCerrarSesion());
    }

    if (user.userType === "INST") {
        menu.appendChild(crearItem("Horarios", "/public/Pages/P_Calendario/calendario.html"));
        menu.appendChild(crearItem("Alumnos", "/public/Pages/P_Gestion_De_Alumnos/alumnos.html"));
        menu.appendChild(crearItem("Solicitudes", "/public/Pages/P_Solicitudes/solicitudes.html"));
        menu.appendChild(crearItem("Mis datos", "/public/Pages/P_Gestion_De_Instructor/instructor.html"));
        menu.appendChild(crearCerrarSesion());
    }

    if (user.userType === "GEST") {
        menu.appendChild(crearItem("Horarios", "/public/Pages/P_Calendario/calendario.html"));
        menu.appendChild(crearItem("Alumnos", "/public/Pages/P_Gestion_De_Alumnos/alumnos.html"));
        menu.appendChild(crearItem("Instructores", "/public/Pages/P_Gestion_De_Instructores/instructores.html"));
        menu.appendChild(crearItem("Solicitudes", "/public/Pages/P_Solicitudes/solicitudes.html"));
        menu.appendChild(crearCerrarSesion());
    }
}

function crearItem(texto, ruta) {
    const a = document.createElement("a");
    a.className = "menu-item";
    a.textContent = texto;
    a.href = ruta;
    return a;
}

function crearCerrarSesion() {
    const a = document.createElement("a");
    a.className = "menu-item";
    a.textContent = "Cerrar sesión";
    a.href = "#";
    a.onclick = () => {
        if (confirm("¿Deseas cerrar sesión?")) {
            localStorage.setItem("userType", "NONE");
            localStorage.setItem("userName", "Iniciar sesión");
            location.href = "/";
        }
    };
    return a;
}

construirMenu();

function mostrarError(mensaje) {
    const modal = document.getElementById("modalErrorGlobal");
    const texto = document.getElementById("modalErrorGlobalMensaje");

    texto.textContent = mensaje;
    modal.classList.add("visible");
}

function cerrarErrorGlobal() {
    const modal = document.getElementById("modalErrorGlobal");
    modal.classList.remove("visible");
}

document.getElementById("btnCerrarErrorGlobal").onclick = cerrarErrorGlobal;

// Cerrar al hacer clic fuera del modal
document.getElementById("modalErrorGlobal").onclick = (e) => {
    if (e.target.id === "modalErrorGlobal") {
        cerrarErrorGlobal();
    }
};
