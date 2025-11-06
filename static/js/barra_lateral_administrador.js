fetch('/static/templates/barra_lateral_administrador.html')
    .then(response => response.text())
    .then(data => {
        const placeholder = document.getElementById('barra_lateral_administrador-placeholder');
        placeholder.innerHTML = data;

        const botonesDesplegables = placeholder.querySelectorAll(".boton-desplegable");

        botonesDesplegables.forEach((boton) => {
            boton.addEventListener("click", () => {
                const submenu = boton.nextElementSibling;
                const flecha = boton.querySelector(".flecha");

                // Cierra otros submenús abiertos
                placeholder.querySelectorAll(".submenu.activo").forEach((activo) => {
                    if (activo !== submenu) {
                        activo.classList.remove("activo");
                        const otraFlecha = activo.previousElementSibling.querySelector(".flecha");
                        if (otraFlecha) otraFlecha.textContent = "▸";
                    }
                });

                // Alterna el actual
                submenu.classList.toggle("activo");
                flecha.textContent = submenu.classList.contains("activo") ? "▾" : "▸";
            });
        });
    });
