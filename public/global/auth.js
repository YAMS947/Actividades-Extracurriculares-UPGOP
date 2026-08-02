// Guarda los datos del usuario después de iniciar sesión
function setUser(data) {
    localStorage.setItem("userType", data.userType);
    localStorage.setItem("userName", data.userName);
    localStorage.setItem("userId", data.userId || "");
}

// Obtiene los datos del usuario
function getUser() {
    return {
        userType: localStorage.getItem("userType") || "NONE",
        userName: localStorage.getItem("userName") || "",
        userId: localStorage.getItem("userId") || null
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
    window.location.href = "/";
}
