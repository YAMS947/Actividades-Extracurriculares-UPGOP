// Seguridad de sesión
if (!isLoggedIn()) {
    alert("No tienes una sesión activa.");
    window.location.href = "../P_Inicio_De_Sesion/inicioSesion.html";
}

const usuario = getUser();

// Elementos del DOM
const cuerpoCalendario = document.getElementById("cuerpoCalendario");
const textoMes = document.getElementById("textoMes");

const btnMesPrev = document.getElementById("btnMesPrev");
const btnMesNext = document.getElementById("btnMesNext");

const contenedorSelectorTaller = document.getElementById("contenedorSelectorTaller");
const btnSeleccionarTaller = document.getElementById("btnSeleccionarTaller");
const menuTalleres = document.getElementById("menuTalleres");

// Variables globales
let talleres = [];
let tallerSeleccionado = null;

let diasActivos = [];
let asistencias = [];

let fechaActual = new Date();
let mesActual = fechaActual.getMonth();
let anioActual = fechaActual.getFullYear();

let primerDiaPermitido = null;
let ultimoDiaPermitido = null;

// ===============================
// 1. Cargar talleres (solo GEST)
// ===============================
async function cargarTalleres() {
    try {
        const res = await fetch("/calendario/talleres");
        const data = await res.json();

        talleres = data.talleres || [];

        menuTalleres.innerHTML = "";

        talleres.forEach(t => {
            const div = document.createElement("div");
            div.textContent = t.nombre_taller;

            div.onclick = () => {
                tallerSeleccionado = t.id_taller;
                btnSeleccionarTaller.textContent = t.nombre_taller;

                menuTalleres.classList.add("oculto");

                cargarDatosCalendario(true);
            };

            menuTalleres.appendChild(div);
        });

    } catch (err) {
        console.error("Error al cargar talleres:", err);
    }
}

if (usuario.userType === "GEST") {
    contenedorSelectorTaller.classList.remove("oculto");
    btnSeleccionarTaller.onclick = () => {
        menuTalleres.classList.toggle("oculto");
        cargarTalleres();
    };
} else {
    contenedorSelectorTaller.classList.add("oculto");
}

// ===============================
// 2. Cargar datos del calendario
// ===============================
async function cargarDatosCalendario(irAPrimerDiaActivo = false) {

    if (usuario.userType === "GEST" && !tallerSeleccionado) {
        textoMes.textContent = "Selecciona un taller";
        cuerpoCalendario.innerHTML = "";
        return;
    }

    let body = {
        id_usuario: usuario.userId,
        tipo_usuario: usuario.userType
    };

    if (usuario.userType === "GEST") {
        body.id_taller = tallerSeleccionado;
    }

    try {
        const res = await fetch("/calendario/dias-activos", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });

        const data = await res.json();

        diasActivos = data.dias_activos || [];
        asistencias = data.asistencias || [];

        // ===============================
        // FILTRO DE DÍAS ACTIVOS (ALUM)
        // ===============================
        if (usuario.userType === "ALUM") {
            const fechaIngresoStr = localStorage.getItem("fechaIngresoAlumno");
            const fechaIngreso = new Date(fechaIngresoStr);

            diasActivos = diasActivos.filter(d => {
                const f = new Date(d.fecha);
                return f >= fechaIngreso;
            });
        }

        calcularLimitesNavegacion();

        // Si el mes actual no tiene días activos, mover al primer mes válido
        const mesActualTieneDiasActivos = diasActivos.some(d => {
            const f = new Date(d.fecha);
            return f.getMonth() === mesActual && f.getFullYear() === anioActual;
        });

        if (!mesActualTieneDiasActivos && diasActivos.length > 0) {
            const primer = new Date(diasActivos[0].fecha);
            mesActual = primer.getMonth();
            anioActual = primer.getFullYear();
        }

        construirCalendario();

    } catch (err) {
        console.error("Error al cargar días activos:", err);
    }
}

// ===============================
// 3. Cálculo de límites de navegación
// ===============================
function calcularLimitesNavegacion() {

    if (usuario.userType === "ALUM") {
        calcularLimitesAlumno();
    } else {
        calcularLimitesInstGest();
    }

    console.log("Primer dia permitido:", primerDiaPermitido);
    console.log("Ultimo dia permitido:", ultimoDiaPermitido);
}

// ===============================
// 3A. Límites para ALUMNO
// ===============================
function calcularLimitesAlumno() {

    const fechaIngresoStr = localStorage.getItem("fechaIngresoAlumno");
    const fechaIngreso = new Date(fechaIngresoStr);

    const hoy = new Date();
    const mesActualHoy = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    console.log("calendario.js calcalum" )
    console.log("calendario.js fechaIngresoStr", fechaIngresoStr)
    console.log("calendario.js fechaIngreso", fechaIngreso)
    console.log("calendario.js hoy", hoy)
    console.log("calendario.js mesActualHoy", mesActualHoy)
    console.log("calendario.js fin calcalum" )
    if (diasActivos.length > 0) {

        const primerDiaActivo = new Date(diasActivos[0].fecha);
        const ultimoDiaActivo = new Date(diasActivos[diasActivos.length - 1].fecha);

        const mesUltimoActivo = ultimoDiaActivo;

        primerDiaPermitido = new Date(primerDiaActivo.getFullYear(), primerDiaActivo.getMonth(), 1);

        ultimoDiaPermitido = (mesUltimoActivo > mesActualHoy) ? mesUltimoActivo : mesActualHoy;

    } else {

        primerDiaPermitido = mesActualHoy;
        ultimoDiaPermitido = mesActualHoy;
    }

    console.log("calendario.js alum primerDiaPermitido: ", primerDiaPermitido)
    console.log("calendario.js alum ultimoDiaPermitido: ", ultimoDiaPermitido)
}

// ===============================
// 3B. Límites para INST y GEST
// ===============================
function calcularLimitesInstGest() {

    const hoy = new Date();
    console.log("calendario.js hoy: ", hoy)

    if (diasActivos.length === 0) {
        primerDiaPermitido = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
        ultimoDiaPermitido = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 1);
        return;
    }

    const primer = new Date(diasActivos[0].fecha);

    
    primerDiaPermitido = new Date(primer.getFullYear(), primer.getMonth() - 1, 1);
    ultimoDiaPermitido = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 1);
}

// ===============================
// 4. Construir calendario
// ===============================
const nombresMes = [
    "ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO",
    "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"
];

function construirCalendario() {

    cuerpoCalendario.innerHTML = "";

    const fechaMes = new Date(anioActual, mesActual, 1);
    const primerDiaSemana = fechaMes.getDay();
    const diasEnMes = new Date(anioActual, mesActual + 1, 0).getDate();

    textoMes.textContent = `${nombresMes[mesActual]} ${anioActual}`;

    let fila = document.createElement("div");
    fila.classList.add("fila");

    for (let i = 0; i < primerDiaSemana; i++) {
        const celdaVacia = document.createElement("div");
        celdaVacia.classList.add("dia", "inactivo");
        fila.appendChild(celdaVacia);
    }

    for (let dia = 1; dia <= diasEnMes; dia++) {

        const celda = document.createElement("div");
        celda.classList.add("dia");
        celda.textContent = dia;

        const fechaDia = new Date(anioActual, mesActual, dia);

        // Validación por día, no por mes
        if (fechaDia < primerDiaPermitido || fechaDia > ultimoDiaPermitido) {
            celda.classList.add("inactivo");
            fila.appendChild(celda);
            continue;
        }

        const fechaISO = `${anioActual}-${String(mesActual + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;

        const diaActivo = diasActivos.find(d => {
            const fechaBDISO = new Date(d.fecha).toISOString().split("T")[0];
            return fechaBDISO === fechaISO;
        });

        const hoy = new Date();
const sieteDiasAntes = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - 7);
const sieteDiasDespues = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 7);

if (!diaActivo) {
    celda.classList.add("inactivo");

    // Permitir selección si es INST o GEST y está dentro del rango de ±7 días
    if ((usuario.userType === "INST" || usuario.userType === "GEST") &&
        fechaDia >= sieteDiasAntes &&
        fechaDia <= sieteDiasDespues) {

        celda.classList.add("seleccionable");

        celda.onclick = () => {
            localStorage.setItem("paseListaDia", fechaISO);

            if (usuario.userType === "GEST") {
                localStorage.setItem("paseListaTaller", tallerSeleccionado);
            }

            window.location.href = "../P_Pase_De_Lista/paseLista.html";
        };
    }

} else {
    // Día activo
    if (usuario.userType === "INST" || usuario.userType === "GEST") {
        celda.classList.add("activo-inst");

        celda.onclick = () => {
            localStorage.setItem("paseListaDia", fechaISO);

            if (usuario.userType === "GEST") {
                localStorage.setItem("paseListaTaller", tallerSeleccionado);
            }

            window.location.href = "../P_Pase_De_Lista/paseLista.html";
        };
    }
}


        fila.appendChild(celda);

        if ((primerDiaSemana + dia) % 7 === 0) {
            cuerpoCalendario.appendChild(fila);
            fila = document.createElement("div");
            fila.classList.add("fila");
        }
    }

    if (fila.children.length > 0) {
        cuerpoCalendario.appendChild(fila);
    }
}

// ===============================
// 5. Navegación de meses
// ===============================
btnMesPrev.onclick = () => {

    const fechaMesActual = new Date(anioActual, mesActual, 15);

    if (fechaMesActual <= primerDiaPermitido) return;

    mesActual--;
    if (mesActual < 0) {
        mesActual = 11;
        anioActual--;
    }

    construirCalendario();
};

btnMesNext.onclick = () => {

    const fechaMesActual = new Date(anioActual, mesActual, 15);

    if (fechaMesActual >= ultimoDiaPermitido) return;

    mesActual++;
    if (mesActual > 11) {
        mesActual = 0;
        anioActual++;
    }

    construirCalendario();
};

// ===============================
// 6. Inicialización
// ===============================
cargarDatosCalendario();