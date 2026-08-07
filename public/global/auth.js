initLocalStorage();

function initLocalStorage() {
    if (!localStorage.getItem("userType") || !localStorage.getItem("userName") || !localStorage.getItem("userId") ) {
        localStorage.setItem("userType", "NONE");
    localStorage.setItem("userName", "Iniciar Sesión");
    localStorage.setItem("userId", "");
    }
}

// Guarda los datos del usuario después de iniciar sesión
function setUser(data) {
    localStorage.setItem("userType", data.userType);
    localStorage.setItem("userName", data.userName);
    localStorage.setItem("userId", data.userId || "");
    if (data.userType === "INST" || data.userType === "ALUM") {
        localStorage.setItem("userTallerId", data.userIdTaller || "");
        localStorage.setItem("userTallerNombre", data.userNameTaller || "");
    }
    if (data.userType === "ALUM") {
        localStorage.setItem("fechaIngresoAlumno", data.fechaIngreso || "");
    }
}

// Obtiene los datos del usuario
function getUser() {
    return {
        userType: localStorage.getItem("userType") || "NONE",
        userName: localStorage.getItem("userName") || "",
        userId: localStorage.getItem("userId") || null,
        userTallerId: localStorage.getItem("userTallerId") || null,
        userTallerNombre: localStorage.getItem("userTallerNombre") || "",
        fechaIngresoAlumno: localStorage.getItem("fechaIngresoAlumno") || null
    };
}

// Verifica si hay sesión activa
function isLoggedIn() {
    return localStorage.getItem("userType") !== "NONE";
}

// Cierra sesión
function logout() {
    localStorage.setItem("userType", "NONE");
    localStorage.setItem("userName", "");
    localStorage.setItem("userId", "");
    localStorage.removeItem("userTallerId");
    localStorage.removeItem("userTallerNombre");
    localStorage.removeItem("fechaIngresoAlumno")
    window.location.href = "/";
}
