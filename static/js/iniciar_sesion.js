document.addEventListener('DOMContentLoaded', () => {
    const login = document.getElementById('login');
    const modal = document.getElementById('modal_registro');
    const modalMensaje = document.getElementById('modal_mensaje');
    const modalTitulo = document.getElementById('modal-titulo'); 
    const modalIcono = document.getElementById('modal-icono');   
    
    function cerrarModal() {
        if (modal) {
            modal.classList.remove('activo');
        }
    }

    function mostrarMensaje(texto, tipo) {
        if (!modalMensaje || !modal || !modalTitulo || !modalIcono) {
            console.error("Faltan elementos del modal.");
            return;
        }

        modalMensaje.textContent = texto;

        if (tipo === 'success') {
            modalTitulo.textContent = 'Bienvenido al sistema Litbook';
            modalIcono.src = '/static/img/confirmacion.png';
        } else if (tipo === 'error') {
            modalTitulo.textContent = 'Error';
            modalIcono.src = '/static/img/rechazo.png';
        }else if(tipo === 'advertencia'){
            modalTitulo.textContent = 'Advertencia';
            modalIcono.src = '/static/img/advertencia.png'; 
        }

        modal.classList.add('activo'); 

        if (tipo === 'error') {
             setTimeout(cerrarModal, 5000);
        }
    }

    if (!login) {
        return;
    }

    login.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(login); 
        try {
            const response = await fetch('/api/usuario/verificar_usuario', {
                method: 'POST',
                body: formData 
            });
            
            if (response.redirected) {
                mostrarMensaje("¡Inicio de sesión exitoso!", 'success');
                
                setTimeout(() => {
                    cerrarModal();
                    window.location.href = response.url;
                }, 1000);

            } else {
                let data;
                try {
                    data = await response.json();
                } catch (jsonError) {
                    data = { error: `Error ${response.status}: Respuesta del servidor no válida.` };
                }
                
                mostrarMensaje(data.error || "Fallo desconocido al iniciar sesión.", 'error');
            }
            
        } catch (error) {
            console.error('Error de conexión:', error);
            mostrarMensaje("No se pudo conectar con el servidor. El API podría estar inactivo.", 'error');
        }
    });
});

