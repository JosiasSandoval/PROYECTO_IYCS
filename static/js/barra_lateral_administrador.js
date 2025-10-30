fetch('/static/templates/barra_lateral_administrador.html')
    .then(response => response.text())
    .then(data => {
        document.getElementById('barra_lateral_administrador-placeholder').innerHTML = data;
    });

// Selecciona todos los botones desplegables
const botonesDesplegables = document.querySelectorAll(".boton-desplegable");

botonesDesplegables.forEach((boton) => {
    boton.addEventListener("click", () => {
        const submenu = boton.nextElementSibling;
        submenu.classList.toggle("activo");
        const flecha = boton.querySelector(".flecha");
        if (submenu.classList.contains("activo")) {
            flecha.textContent = "▾";
        } else {
            flecha.textContent = "▸";
        }
    });
});
