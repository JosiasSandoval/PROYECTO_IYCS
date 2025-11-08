document.addEventListener('DOMContentLoaded', () => {

    let ID_USUARIO_LOGUEADO = window.GLOBAL_USER_ID || 1;

    let datosOriginales = {};

    const form = document.getElementById('perfilForm');
    const btnModificar = document.getElementById('btnModificar');
    const btnGuardar = document.getElementById('btnGuardar');
    const inputs = form.querySelectorAll('input');
    const passwordInput = document.getElementById('password');
    const togglePassword = document.getElementById('togglePassword');
    const PASSWORD_PLACEHOLDER = '********';

    const poblarFormulario = (datos) => {
        datosOriginales = datos;

        document.getElementById('nombre').value = datos.nombreCompleto || '';
        document.getElementById('email').value = datos.email || '';
        document.getElementById('telefono').value = datos.telefonoFel || '';
        document.getElementById('direccion').value = datos.direccionFel || '';
        document.getElementById('fecha_nacimiento').value = datos.f_nacimiento || '';

        if (passwordInput) {
            passwordInput.value = PASSWORD_PLACEHOLDER;
            passwordInput.type = 'password';
        }

        const icon = togglePassword ? togglePassword.querySelector('i') : null;
        if (icon) {
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    };


    const cargarDatosPerfil = async () => {
        try {
            const response = await fetch('/api/usuario/api/perfil/datos');

            if (!response.ok) {
                console.error(`Error al cargar datos del perfil: ${response.status} ${response.statusText}`);
                alert('Ocurrió un error de red al cargar el perfil. Revisa la consola para más detalles.');
                return;
            }

            const data = await response.json();

            if (data.ok) {
                ID_USUARIO_LOGUEADO = data.datos.id || ID_USUARIO_LOGUEADO;
                poblarFormulario(data.datos);
            } else {
                console.error('Error al cargar datos del perfil:', data.mensaje);
                alert('No se pudieron cargar los datos del perfil.');
            }
        } catch (error) {
            console.error('Error de conexión al cargar el perfil:', error);
            alert('Ocurrió un error de red al cargar el perfil.');
        }
    };


    const toggleEdicion = (habilitar) => {
        inputs.forEach(input => {
            input.disabled = !habilitar;
        });

        if (habilitar) {
            btnModificar.style.display = 'none';
            btnGuardar.style.display = 'block';

            if (passwordInput) {
                passwordInput.value = '';
                // Aseguramos que el placeholder se muestre
                passwordInput.placeholder = "Ingrese nueva contraseña";
            }

        } else {
            btnModificar.style.display = 'block';
            btnGuardar.style.display = 'none';

            // Al deshabilitar, se reinicia al modo de visualización: "********"
            if (passwordInput) {
                passwordInput.value = PASSWORD_PLACEHOLDER;
                passwordInput.type = 'password';
                passwordInput.placeholder = "";
            }

            // Lógica para reiniciar el ícono de Font Awesome al modo NO edición
            const icon = togglePassword ? togglePassword.querySelector('i') : null;
            if (icon) {
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        }
    };


    const obtenerDatosParaActualizacion = () => {
        const nombreCompleto = document.getElementById('nombre').value.split(/\s+/);

        const datos = {
            email: document.getElementById('email').value,
            telefonoFel: document.getElementById('telefono').value,
            direccionFel: document.getElementById('direccion').value,
            f_nacimiento: document.getElementById('fecha_nacimiento').value,

            numDocFel: datosOriginales.numDocFel || '12345678',
            idRol: datosOriginales.idRol || 2,
            idTipoDocumento: datosOriginales.nombDocumento || 'DNI',
            sexoFel: datosOriginales.sexoFel || 'M',

            nombFel: nombreCompleto[0] || '',
            apePatFel: nombreCompleto[1] || datosOriginales.apePatFel || '',
            apeMatFel: nombreCompleto[2] || datosOriginales.apeMatFel || '',
        };

        if (passwordInput.value !== '') {
            datos.clave = passwordInput.value;
        }

        return datos;
    };

    if (btnModificar) {
        btnModificar.addEventListener('click', () => {
            toggleEdicion(true); // Habilita la edición
            document.getElementById('nombre').focus();
        });
    }

    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', () => {
            // Solo permitir el toggle si el input NO está deshabilitado Y NO ESTÁ EN MODO LECTURA "********"
            if (!passwordInput.disabled) {
                const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
                passwordInput.setAttribute('type', type);

                // Cambiar las clases del ícono de Font Awesome
                const icon = togglePassword.querySelector('i');
                if (icon) {
                    if (type === 'password') {
                        icon.classList.remove('fa-eye-slash');
                        icon.classList.add('fa-eye');
                    } else {
                        icon.classList.remove('fa-eye');
                        icon.classList.add('fa-eye-slash');
                    }
                }
            }
        });
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!ID_USUARIO_LOGUEADO) {
            alert('Error: ID de usuario no encontrado. No se puede guardar.');
            return;
        }

        const datosActualizados = obtenerDatosParaActualizacion();

        try {
            const response = await fetch(`/api/usuario/actualizar_feligres/${ID_USUARIO_LOGUEADO}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(datosActualizados)
            });

            const data = await response.json();

            if (data.ok) {
                alert('✅ Cambios guardados exitosamente.');
                // No recargamos aquí, solo volvemos al modo visualización
                toggleEdicion(false);
                // Recargamos los datos para asegurar que los campos reflejen lo guardado
                cargarDatosPerfil();
            } else {
                alert(`Error al guardar: ${data.mensaje}`);
            }

        } catch (error) {
            console.error('Error de red al intentar guardar:', error);
            alert('Ocurrió un error de red o de servidor al guardar los cambios.');
        }
    });

    cargarDatosPerfil();
    toggleEdicion(false);
});