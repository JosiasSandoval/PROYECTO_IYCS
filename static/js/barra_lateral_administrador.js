fetch('/static/templates/barra_lateral_administrador.html')
    .then(response => response.text())
    .then(data => {
        const placeholder = document.getElementById('barra_lateral_administrador-placeholder');
        placeholder.innerHTML = data;

        // Ahora sí selecciona los botones y agrega los eventos
        const botonesDesplegables = placeholder.querySelectorAll(".boton-desplegable");

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
    });
