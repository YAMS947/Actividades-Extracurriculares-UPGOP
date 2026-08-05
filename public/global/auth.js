// Guarda los datos del usuario después de iniciar sesión
function setUser(data) {
    console.log("Funcion setUser()")
    localStorage.setItem("userType", data.userType);
    localStorage.setItem("userName", data.userName);
    localStorage.setItem("userId", data.userId || "");
    if (data.userType === "INST" || data.userType === "ALUM") {
        localStorage.setItem("userTallerId", data.userIdTaller || "");
        localStorage.setItem("userTallerNombre", data.userNameTaller || "");
        console.log("Funcion setUser()", "Ingreso a if para inst y alum")
    }
    if (data.userType === "ALUM") {
        localStorage.setItem("fechaIngresoAlumno", data.fechaIngreso || "");
        
        console.log("Funcion setUser() faf", "Ingreso a if para alum")
    }

    console.log("Funcion setUser() fecha ingreso de data", data.fechaIngreso)
}

// Obtiene los datos del usuario
function getUser() {
    console.log(localStorage.getItem("fechaIngresoAlumno"), "desde auth")
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
