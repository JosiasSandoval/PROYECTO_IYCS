fetch('/static/templates/barra_lateral.html')
    .then(response => response.text())
    .then(data => {
        document.getElementById('barra_lateral-placeholder').innerHTML = data;

        // Selecciona todos los botones desplegables dentro de la barra cargada
        const botonesDesplegables = document.querySelectorAll(".boton-desplegable");

        botonesDesplegables.forEach((boton) => {
            boton.addEventListener("click", () => {
                const submenu = boton.nextElementSibling;
                submenu.classList.toggle("activo");
                const flecha = boton.querySelector(".flecha");
                flecha.textContent = submenu.classList.contains("activo") ? "▾" : "▸";
            });
        });
    })
    .catch(err => console.error("Error al cargar la barra lateral:", err));
