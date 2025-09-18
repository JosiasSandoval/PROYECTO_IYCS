document.addEventListener('DOMContentLoaded', () => {
    const botonesRequisitos = document.querySelectorAll('.requisitos');
    const contenedorRequisitos = document.querySelector('.requisitos-container');
    const contenedorGrid = document.querySelector('.grid');
    const botonCerrar = document.querySelector('.cerrar-requisitos');

    // Función para mostrar los requisitos
    const mostrarRequisitos = () => {
        contenedorRequisitos.classList.add('visible');
        contenedorGrid.classList.add('show-requisitos');
    };

    // Función para ocultar los requisitos y volver al estado inicial
    const ocultarRequisitos = () => {
        contenedorRequisitos.classList.remove('visible');
        contenedorGrid.classList.remove('show-requisitos');
    };

    // Evento para cada botón de "Requisitos necesarios"
    botonesRequisitos.forEach(boton => {
        boton.addEventListener('click', () => {
            mostrarRequisitos();
            // Lógica para cargar los datos desde la base de datos
            // Por ejemplo:
            // const tipoActo = boton.closest('.campo').querySelector('h3').textContent;
            // cargarRequisitosDesdeBD(tipoActo);
        });
    });

    // Evento para el botón de cerrar
    botonCerrar.addEventListener('click', () => {
        ocultarRequisitos();
    });
});