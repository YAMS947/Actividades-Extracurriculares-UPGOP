const user = getUser();

const menu = document.getElementById("menu-hamb");

function construirMenu() {
    menu.innerHTML = "";

    const inicio = crearItem(user.userName, "/Pages/P_Inicio_De_Sesion/inicioSesion.html");
    menu.appendChild(inicio);

    if (user.userType === "NONE") return;

    if (user.userType === "ALUM") {
        menu.appendChild(crearItem("Horarios", "/Pages/P_Calendario/calendario.html"));
        menu.appendChild(crearItem("Mis datos", "/Pages/P_Gestion_De_Alumno/alumno.html"));
        menu.appendChild(crearCerrarSesion());
    }

    if (user.userType === "INST") {
        menu.appendChild(crearItem("Horarios", "/Pages/P_Calendario/calendario.html"));
        menu.appendChild(crearItem("Alumnos", "/Pages/P_Gestion_De_Alumnos/alumnos.html"));
        menu.appendChild(crearItem("Solicitudes", "/Pages/P_Solicitudes/solicitudes.html"));
        menu.appendChild(crearItem("Mis datos", "/Pages/P_Gestion_De_Instructor/instructor.html"));
        menu.appendChild(crearCerrarSesion());
    }

    if (user.userType === "GEST") {
        menu.appendChild(crearItem("Horarios", "/Pages/P_Calendario/calendario.html"));
        menu.appendChild(crearItem("Alumnos", "/Pages/P_Gestion_De_Alumnos/alumnos.html"));
        menu.appendChild(crearItem("Instructores", "/Pages/P_Gestion_De_Instructores/instructores.html"));
        menu.appendChild(crearItem("Solicitudes", "/Pages/P_Solicitudes/solicitudes.html"));
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
