// Cargar los tipo de documentos
const selectDoc = document.getElementById('tipo-doc');
fetch('api/tipoDocumento/')
    .then(Response => {
        if (!Response.ok) {
            throw new Error("Error al obtener los tipo de documento");
        }
        return Response.json()
    })
    .then(data => {
        selectDoc.innerHTML = '';
        data.forEach(documento => {
            const option = document.createElement('option');
            option.value = documento.id;
            option.textContent = documento.nombre;
            selectDoc.appendChild(option)
        });
    })
    .catch(error => console.error("Error al cargar documentos:", error)); // Manejo de error de la carga inicial

// Validad la contraseña y su confirmación
document.addEventListener('DOMContentLoaded', () => {
    const formulario = document.getElementById('formulario');
    const claveInput = document.getElementById('clave');
    const confirmacionInput = document.getElementById('confirmacion') || document.getElementById('confirmar_clave');

    // **IMPORTANTE: Referencias Correctas a los elementos del modal**
    const modal = document.getElementById('modal_registro');
    const modalMensaje = document.getElementById('modal_mensaje');
    const modalTitulo = document.getElementById('modal-titulo'); // Referencia faltante o no usada correctamente
    const modalIcono = document.getElementById('modal-icono');   // Referencia faltante o no usada correctamente
    const cerrarBtn = document.getElementById('modal-cerrar');   // Referencia faltante o no usada correctamente
    
    if (!formulario) return;

    formulario.addEventListener('submit', async (e) => {
        e.preventDefault();

        // --- INICIO: VALIDACIÓN DE CAMPOS VACÍOS ---
        const formData = new FormData(formulario);
        const datos = Object.fromEntries(formData.entries());

        const camposRequeridos = [
            'nombre',
            'apePaterno',
            'apeMaterno',
            'telefono',
            'sexo',
            'direccion',
            'tipo-doc',
            'documento',
            'email',
            'contraseña',
            'confirmacion'
        ];

        let camposVacios = [];
        limpiarErrores(formulario);

        for (const campo of camposRequeridos) {
            const valor = datos[campo] ? datos[campo].trim() : '';
            if (valor === '') {
                camposVacios.push(campo);
                const inputElement = document.querySelector(`[name="${campo}"]`);
                if (inputElement) {
                    marcarError(inputElement);
                }
            }
        }

        if (camposVacios.length > 0) {
            const mensajeError = "Por favor, completa todos los campos requeridos: " + camposVacios.join(', ');
            mostrarMensaje(mensajeError, 'advertencia');
            return;
        }
        // --- FIN: VALIDACIÓN DE CAMPOS VACÍOS ---
    const telefonoInput = document.getElementById('telefono');
    const documentoInput = document.getElementById('documento');
    const documentoValor = datos['documento'] ? datos['documento'].trim() : '';
    const telefonoValor = datos['telefono'] ? datos['telefono'].trim() : '';

        // Utilizamos una expresión regular para verificar si el valor contiene CUALQUIER COSA que NO sea un dígito (0-9).
        // ^\d+$ significa: inicia (^) con dígitos (\d+), y finaliza ($). Es decir, solo dígitos.
        const esSoloNumerosD = /^\d+$/.test(documentoValor);
        const esSoloNumerosT = /^\d+$/.test(telefonoValor);
        if (!esSoloNumerosD || !esSoloNumerosT) {
            marcarError(documentoInput)
            marcarError(telefonoInput)
            mostrarMensaje("El número de documento o telefono debe contener solo dígitos numéricos.", 'advertencia');
            return; // Detiene el proceso si no es numérico
        }

        // Validación de formato de correo electrónico
        const emailInput = document.getElementById('email');
        const emailValor = datos['email'] ? datos['email'].trim() : '';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if (!emailRegex.test(emailValor)) {
            marcarError(emailInput);
            mostrarMensaje('Por favor, ingresa un correo electrónico válido.', 'advertencia');
            return;
        }

        const clave = claveInput.value;
        const confirmacion = confirmacionInput.value;

        // Limpiar errores visuales de la contraseña antes de validar
        limpiarErroresContraseñas();

        if (clave !== confirmacion) {
            marcarError(claveInput);
            marcarError(confirmacionInput);
            confirmacionInput.value = "";
            claveInput.value = "";
            mostrarMensaje('Las contraseñas no coinciden. Por favor, inténtalo nuevamente.', 'error');
            return;
        }

try {
    const response = await fetch('/api/auth/registrar_feligres', {
        method: 'POST',
        body: formData
    });
    
    // Intentamos leer el JSON. Si falla (porque el servidor envió texto o HTML), lo capturamos.
    let data;
    try {
        data = await response.json();
    } catch (e) {
        // Si el JSON falla, intentamos leer la respuesta como texto plano para debug.
        const textError = await response.text();
        console.error("Respuesta del servidor no JSON:", textError);
        data = { error: `Error ${response.status}: Respuesta no JSON. Revisa la consola para el cuerpo del error.` };
    }

    if (response.ok) {
        mostrarMensaje("¡Registro exitoso!", 'success');
        formulario.reset();
        setTimeout(() => {
            window.location.href = '/';
        }, 2000);
    } else {
        // Usa el error del servidor si existe, si no, usa el mensaje de fallback.
        const errorMessage = data.error || `Error ${response.status}: Fallo desconocido al procesar la solicitud.`;
        mostrarMensaje("Error: " + errorMessage, 'error');
    }
} catch (error) {
    // Esto captura errores de red (servidor caído, CORS, etc.)
    console.error('Error de red o servidor:', error);
    mostrarMensaje("Ocurrió un error de conexión al intentar registrar. El servidor podría estar inactivo.", 'error');
}
    });

    // --- FUNCIONES AUXILIARES ---

    function marcarError(inputElement) {
        inputElement.style.border = '2px solid red';
    }

    function limpiarErrores(form) {
        const inputs = form.querySelectorAll('input, select');
        inputs.forEach(input => {
            input.style.border = '';
        });
    }

    function limpiarErroresContraseñas() {
        claveInput.style.border = '';
        confirmacionInput.style.border = '';
    }

    // -------------------------------------------------------------------
    // FUNCIÓN MOSTRAR MENSAJE (CORREGIDA CON LÓGICA DE ICONOS)
    // -------------------------------------------------------------------
function mostrarMensaje(texto, tipo) {
    if (!modalMensaje || !modal || !modalTitulo || !modalIcono || !cerrarBtn) {
        console.error("Faltan elementos del modal en el HTML o no están declarados correctamente.");
        alert(texto);
        return;
    }

    modalMensaje.textContent = texto;

    // 1. Configurar Título e Icono según el tipo (¡Usando tus 3 PNGs!)
    if (tipo === 'success') {
        modalTitulo.textContent = 'Éxito';
        modalIcono.src = '/static/img/confirmacion.png';
    } else if (tipo === 'error') {
        modalTitulo.textContent = 'Error';
        modalIcono.src = '/static/img/rechazo.png';
    } else if (tipo === 'advertencia') {
        modalTitulo.textContent = 'Advertencia';
        modalIcono.src = '/static/img/advertencia.png';
    } else {
        modalTitulo.textContent = 'Información';
        modalIcono.src = '';
    }

    // 2. Mostrar el modal usando la clase 'activo'
    modal.classList.add('activo'); 
    // NOTA: ELIMINAMOS modal.style.display = 'flex'; para evitar conflictos con el CSS.

    // 4. Manejador del botón Aceptar para cierre manual
    cerrarBtn.onclick = () => {
        modal.classList.remove('activo'); // Ocultar quitando la clase
    };
}
});