document.addEventListener('DOMContentLoaded', () => {

    let ID_USUARIO_LOGUEADO = window.GLOBAL_USER_ID || 1;
    let TIPO_PERFIL = 'feligres'; // 'feligres' o 'personal'

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
        TIPO_PERFIL = datos.tipo_perfil || 'feligres';

        // Campos comunes para ambos tipos de perfil
        document.getElementById('nombre').value = datos.nombreCompleto || '';
        document.getElementById('email').value = datos.email || '';
        
        // Para feligrés
        if (TIPO_PERFIL === 'feligres') {
            document.getElementById('telefono').value = datos.telefonoFel || '';
            document.getElementById('direccion').value = datos.direccionFel || '';
            document.getElementById('fecha_nacimiento').value = datos.f_nacimiento || '';
            
            // Mostrar campos de feligrés y ocultar de personal
            document.querySelectorAll('.feligres-only').forEach(el => el.style.display = '');
            document.querySelectorAll('.personal-only').forEach(el => el.style.display = 'none');
        }
        // Para personal (Sacerdote, Secretaria, etc.)
        else if (TIPO_PERFIL === 'personal') {
            document.getElementById('telefono').value = datos.telefonoPers || '';
            document.getElementById('direccion').value = datos.direccionPers || '';
            
            // Mostrar información de cargo y parroquia
            const cargoInput = document.getElementById('cargo');
            const parroquiaInput = document.getElementById('parroquia');
            
            if (cargoInput) {
                cargoInput.value = datos.nombCargo || 'Sin cargo';
            }
            if (parroquiaInput) {
                parroquiaInput.value = datos.nombParroquia || 'Sin asignación';
            }
            
            // Ocultar campos de feligrés y mostrar de personal
            document.querySelectorAll('.feligres-only').forEach(el => el.style.display = 'none');
            document.querySelectorAll('.personal-only').forEach(el => {
                el.style.display = '';
                // Para los labels
                if (el.tagName === 'LABEL') {
                    el.style.display = 'block';
                }
            });
        }

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
            const response = await fetch('/api/usuario/perfil/datos');

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

        if (TIPO_PERFIL === 'feligres') {
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

            if (passwordInput.value !== '' && passwordInput.value !== PASSWORD_PLACEHOLDER) {
                datos.clave = passwordInput.value;
            }

            return datos;
        } else {
            // Para personal
            const datos = {
                email: document.getElementById('email').value,
                telefonoPers: document.getElementById('telefono').value,
                direccionPers: document.getElementById('direccion').value,

                numDocPers: datosOriginales.numDocPers || '12345678',
                idTipoDocumento: datosOriginales.nombDocumento || 'DNI',
                sexoPers: datosOriginales.sexoPers || 'M',

                nombPers: nombreCompleto[0] || '',
                apePatPers: nombreCompleto[1] || datosOriginales.apePatPers || '',
                apeMatPers: nombreCompleto[2] || datosOriginales.apeMatPers || '',
            };

            if (passwordInput.value !== '' && passwordInput.value !== PASSWORD_PLACEHOLDER) {
                datos.clave = passwordInput.value;
            }

            return datos;
        }
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
            // Usar la ruta unificada de actualización de perfil
            const response = await fetch('/api/usuario/perfil/actualizar', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(datosActualizados)
            });

            const data = await response.json();

            if (data.ok) {
                alert('✅ Cambios guardados exitosamente.');
                toggleEdicion(false);
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