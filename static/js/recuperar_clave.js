document.addEventListener('DOMContentLoaded', () => {
    // Referencias a elementos
    const pasoEmail = document.getElementById('paso-email');
    const pasoCodigo = document.getElementById('paso-codigo');
    const pasoContrasena = document.getElementById('paso-contrasena');
    
    const formEmail = document.getElementById('form-email');
    const formCodigo = document.getElementById('form-codigo');
    const formContrasena = document.getElementById('form-contrasena');
    
    const emailInput = document.getElementById('email');
    const codigoMostrado = document.getElementById('codigo-mostrado');
    const codigoInputs = document.querySelectorAll('.codigo-input');
    const nuevaContrasenaInput = document.getElementById('nueva-contrasena');
    const confirmarContrasenaInput = document.getElementById('confirmar-contrasena');
    
    const modal = document.getElementById('modal_recuperacion');
    const modalTitulo = document.getElementById('modal-titulo');
    const modalMensaje = document.getElementById('modal_mensaje');
    const modalIcono = document.getElementById('modal-icono');
    
    // Variables globales
    let emailActual = '';
    let codigoGenerado = '';
    
    // ==================================================
    // FUNCIONES AUXILIARES
    // ==================================================
    
    function mostrarMensaje(texto, tipo, duracion = 1000) {
        if (!modal || !modalMensaje || !modalTitulo || !modalIcono) return;
        
        modalMensaje.textContent = texto;
        
        switch(tipo) {
            case 'success':
                modalTitulo.textContent = 'Éxito';
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
        setTimeout(() => {
            modal.classList.remove('activo');
        }, duracion);
    }
    
    function cambiarPaso(pasoActual, pasoSiguiente) {
        pasoActual.classList.remove('activo');
        pasoSiguiente.classList.add('activo');
    }
    
    function limpiarCampos(...campos) {
        campos.forEach(campo => {
            if (campo) campo.value = '';
        });
    }
    
    // ==================================================
    // PASO 1: VERIFICAR EMAIL Y GENERAR CÓDIGO
    // ==================================================
    
    formEmail.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = emailInput.value.trim();
        
        if (!email) {
            mostrarMensaje('Por favor, ingresa tu correo electrónico.', 'advertencia');
            return;
        }
        
        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            mostrarMensaje('Por favor, ingresa un correo electrónico válido.', 'advertencia');
            return;
        }
        
        try {
            const response = await fetch('/api/auth/recuperar_contrasena/verificar_email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            
            const data = await response.json();
            
            if (data.success && data.codigo) {
                emailActual = email;
                codigoGenerado = data.codigo;
                
                // Mostrar el código generado
                codigoMostrado.textContent = codigoGenerado;
                
                mostrarMensaje('Código generado correctamente. Ingrésalo a continuación.', 'success');
                
                setTimeout(() => {
                    cambiarPaso(pasoEmail, pasoCodigo);
                    codigoInputs[0].focus();
                }, 1000);
            } else {
                mostrarMensaje(data.mensaje || 'No se pudo generar el código.', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            mostrarMensaje('Error de conexión con el servidor.', 'error');
        }
    });
    
    // ==================================================
    // PASO 2: VALIDAR CÓDIGO
    // ==================================================
    
    // Navegación automática entre inputs del código
    codigoInputs.forEach((input, index) => {
        input.addEventListener('input', (e) => {
            const valor = e.target.value.toUpperCase();
            
            if (valor.length === 1) {
                e.target.value = valor;
                
                // Mover al siguiente input
                if (index < codigoInputs.length - 1) {
                    codigoInputs[index + 1].focus();
                }
            }
        });
        
        // Permitir retroceder con backspace
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && e.target.value === '' && index > 0) {
                codigoInputs[index - 1].focus();
            }
        });
        
        // Permitir pegar código completo
        input.addEventListener('paste', (e) => {
            e.preventDefault();
            const pasteData = e.clipboardData.getData('text').toUpperCase().slice(0, 6);
            
            pasteData.split('').forEach((char, i) => {
                if (codigoInputs[i]) {
                    codigoInputs[i].value = char;
                }
            });
            
            // Enfocar el último input con valor o el primero vacío
            const ultimoIndice = Math.min(pasteData.length, codigoInputs.length - 1);
            codigoInputs[ultimoIndice].focus();
        });
    });
    
    formCodigo.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Obtener el código ingresado
        const codigoIngresado = Array.from(codigoInputs)
            .map(input => input.value.toUpperCase())
            .join('');
        
        if (codigoIngresado.length !== 6) {
            mostrarMensaje('Por favor, completa los 6 caracteres del código.', 'advertencia');
            return;
        }
        
        try {
            const response = await fetch('/api/auth/recuperar_contrasena/validar_codigo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: emailActual,
                    codigo: codigoIngresado
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                mostrarMensaje('Código válido. Ahora puedes cambiar tu contraseña.', 'success');
                
                setTimeout(() => {
                    cambiarPaso(pasoCodigo, pasoContrasena);
                    nuevaContrasenaInput.focus();
                }, 1000);
            } else {
                // Limpiar los inputs del código
                codigoInputs.forEach(input => input.value = '');
                codigoInputs[0].focus();
                
                mostrarMensaje(data.error || 'Código incorrecto. Intenta nuevamente.', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            mostrarMensaje('Error de conexión con el servidor.', 'error');
        }
    });
    
    // ==================================================
    // PASO 3: CAMBIAR CONTRASEÑA
    // ==================================================
    
    formContrasena.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const nuevaContrasena = nuevaContrasenaInput.value;
        const confirmarContrasena = confirmarContrasenaInput.value;
        
        if (!nuevaContrasena || !confirmarContrasena) {
            mostrarMensaje('Por favor, completa ambos campos.', 'advertencia');
            return;
        }
        
        if (nuevaContrasena !== confirmarContrasena) {
            limpiarCampos(nuevaContrasenaInput, confirmarContrasenaInput);
            nuevaContrasenaInput.focus();
            mostrarMensaje('Las contraseñas no coinciden. Intenta nuevamente.', 'error');
            return;
        }
        
        try {
            const codigoIngresado = Array.from(codigoInputs)
                .map(input => input.value.toUpperCase())
                .join('');
            
            const response = await fetch('/api/auth/recuperar_contrasena/cambiar_contrasena', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: emailActual,
                    codigo: codigoIngresado,
                    nueva_contrasena: nuevaContrasena
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                mostrarMensaje('¡Contraseña cambiada exitosamente! Redirigiendo al inicio de sesión...', 'success', 2000);
                
                setTimeout(() => {
                    window.location.href = '/';
                }, 2000);
            } else {
                mostrarMensaje(data.error || 'Error al cambiar la contraseña.', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            mostrarMensaje('Error de conexión con el servidor.', 'error');
        }
    });
});
