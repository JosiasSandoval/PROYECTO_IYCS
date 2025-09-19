document.addEventListener('DOMContentLoaded', () => {
    // Selecciona todos los botones de "Requisitos necesarios"
    const botonesRequisitos = document.querySelectorAll('.requisitos');
    
    // Selecciona el contenedor de requisitos
    const contenedorRequisitos = document.querySelector('.requisitos-container');
    
    // Selecciona la imagen de cerrar dentro del nuevo contenedor .requisitos-header
    const botonCerrar = document.querySelector('.requisitos-header img');

    // Función para mostrar los requisitos
    const mostrarRequisitos = () => {
        contenedorRequisitos.classList.remove('oculto');
        contenedorRequisitos.classList.add('visible');
    };

    // Función para ocultar los requisitos
    const ocultarRequisitos = () => {
        contenedorRequisitos.classList.remove('visible');
        contenedorRequisitos.classList.add('oculto');
    };

    // Agrega el evento de clic a cada botón de "Requisitos"
    botonesRequisitos.forEach(boton => {
        boton.addEventListener('click', () => {
            mostrarRequisitos();
        });
    });

    // Agrega el evento de clic a la imagen de cerrar
    botonCerrar.addEventListener('click', () => {
        ocultarRequisitos();
    });
});