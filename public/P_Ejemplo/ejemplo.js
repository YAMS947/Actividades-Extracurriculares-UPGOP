const modal = document.getElementById("modal");
const abrir = document.getElementById("abrirModal");
const cerrar = document.getElementById("cerrarModal");

abrir.onclick = function(){

    modal.style.display = "block";

}

cerrar.onclick = function(){

    modal.style.display = "none";

}

window.onclick = function(event){

    if(event.target == modal){

        modal.style.display = "none";

    }

}

const formulario = document.getElementById("formulario");

formulario.addEventListener("submit", function(e){
    e.preventDefault();

    // Capturar los datos del formulario
    const datos = {
        nombre: document.getElementById("nombre").value,
        apellido_paterno: document.getElementById("apellido_paterno").value,
        apellido_materno: document.getElementById("apellido_materno").value,
        matricula: document.getElementById("matricula").value,
        usuario: document.getElementById("usuario").value,
        contrasena: document.getElementById("contrasena").value
    };

    // Enviar datos al Back-End (ruta/registro)
    fetch('/registro', {
        // Convierte los datos a JSON
        method: 'POST', 
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(datos)
    })
        .then(res => res.json())
        .then(data => {
            // Mostrar mensaje al servidor
            alert(data.mensaje);

            // Limpiar formulario
            formulario.reset();

            // Cerrar modal
            modal.style.display = "none";
        })
        .catch(err => {
            alert("Error al registrar usuario");
            console.error(err);
        });
});