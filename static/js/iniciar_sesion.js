document.addEventListener('DOMContentLoaded', () => {
    const login = document.getElementById('login');
    const modal = document.getElementById('modal_registro');
    const modalMensaje = document.getElementById('modal_mensaje');
    const modalTitulo = document.getElementById('modal-titulo'); 
    const modalIcono = document.getElementById('modal-icono');   
    
    function cerrarModal() {
        if (modal) modal.classList.remove('activo');
    }

    function mostrarMensaje(texto, tipo) {
        if (!modal || !modalMensaje || !modalTitulo || !modalIcono) return;

        modalMensaje.textContent = texto;

        switch(tipo) {
            case 'success':
                modalTitulo.textContent = 'Bienvenido al sistema Litbook';
                modalIcono.src = '/static/img/confirmacion.png';
                break;
            case 'error':
                modalTitulo.textContent = 'Error';
                modalIcono.src = '/static/img/rechazo.png';
                break;
            case 'advertencia':
                modalTitulo.textContent = 'Advertencia';
                modalIcono.src = '/static/img/advertencia.png';
                break;
        }

        modal.classList.add('activo');
        setTimeout(cerrarModal, 1000);
    }

    if (!login) return;

    login.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = {
            email: login.email.value.trim(),
            clave: login.clave.value.trim()
        };

        try {
            const response = await fetch('/api/auth/verificar_usuario', {  // CORREGIDO
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (data.success) {
                mostrarMensaje("¡Inicio de sesión exitoso!", 'success');
                setTimeout(() => {
                    window.location.href = '/principal'; // Pantalla principal
                }, 1000);
            } else {
                // Vaciar los campos cuando hay error
                login.email.value = '';
                login.clave.value = '';
                mostrarMensaje(data.error || "Fallo desconocido al iniciar sesión.", 'error');
            }

        } catch (error) {
            console.error('Error de conexión:', error);
            // Vaciar los campos también cuando hay error de conexión
            login.email.value = '';
            login.clave.value = '';
            mostrarMensaje("No se pudo conectar con el servidor. El API podría estar inactivo.", 'error');
        }
    });
});
