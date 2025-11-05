// ===========================
// VARIABLES GLOBALES
// ===========================
let metodosPago = [];
let metodoSeleccionado = null;
let datosReserva = {
    idReserva: 12345, // ID de prueba
    producto: 'Reserva Bautizo',
    duracion: '1 año',
    montoTotal: 120.00
};

// ===========================
// FUNCIONES DE MODAL (Reemplazo de alert())
// ===========================
function showMessage(type, title, message) {
    const modal = document.getElementById('custom-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalText = document.getElementById('modal-text');
    const modalIcon = document.getElementById('modal-icon');
    const closeBtn = document.getElementById('close-modal');

    // Asignar íconos basados en el tipo
    const icons = {
        'success': '✅',
        'error': '❌',
        'warning': '⚠️'
    };

    modalIcon.textContent = icons[type] || 'ℹ️';
    modalTitle.textContent = title;
    modalText.textContent = message.replace(/\n\n/g, ' '); 
    
    // Mostrar modal
    modal.classList.remove('hidden');

    // Cerrar modal
    closeBtn.onclick = () => modal.classList.add('hidden');
    modal.onclick = (e) => {
        if (e.target.id === 'custom-modal') {
            modal.classList.add('hidden');
        }
    };
}

function mostrarMensajeExito(data) {
    const metodoActivo = document.querySelector('.metodo-btn.active');
    const metodoNombre = metodoActivo ? metodoActivo.dataset.nombre : 'Pago';
    const message = `Tu pago de S/ ${datosReserva.montoTotal.toFixed(2)} usando ${metodoNombre} ha sido procesado exitosamente. Código de transacción: ${data.idPago || 'N/A'}.`;
    showMessage('success', '¡Pago Exitoso!', message);
}

// ===========================
// INICIALIZACIÓN
// ===========================
document.addEventListener('DOMContentLoaded', function() {
    cargarMetodosPago();
    cargarDatosReserva();
    inicializarEventos();
    
    // Ocultar modal al inicio
    document.getElementById('custom-modal')?.classList.add('hidden');
});

// ===========================
// CARGAR MÉTODOS DE PAGO (Simulación)
// ===========================
async function cargarMetodosPago() {
    try {
        // En un entorno real, descomentarías esto:
        // const response = await fetch('/api/metodo-pago/metodo');
        // const data = await response.json();
        
        // Simulación de datos exitosa (PLIN ELIMINADO)
        const data = {
             ok: true, 
             datos: [
                { idMetodo: 1, nombMetodo: 'Tarjeta', estadoMetodo: true },
                { idMetodo: 2, nombMetodo: 'Yape', estadoMetodo: true },
                { idMetodo: 3, nombMetodo: 'Efectivo', estadoMetodo: true } // ID 3 era Plin, ahora es Efectivo
            ]
        };

        if (data.ok) {
            metodosPago = data.datos.filter(m => m.estadoMetodo);
            renderizarMetodosPago();
        } else {
            console.error('Error al cargar métodos:', data.mensaje);
            mostrarMetodosPorDefecto();
        }
    } catch (error) {
        console.error('Error al cargar métodos de pago:', error);
        mostrarMetodosPorDefecto();
    }
}

// ===========================
// RENDERIZAR MÉTODOS DE PAGO
// ===========================
function renderizarMetodosPago() {
    const container = document.getElementById('metodos-container');
    
    if (metodosPago.length === 0) {
        mostrarMetodosPorDefecto();
        return;
    }

    const iconos = {
        'Tarjeta': '💳',
        'Yape': '📱',
        'Efectivo': '💵',
    };

    container.innerHTML = metodosPago.map((metodo, index) => {
        const icono = iconos[metodo.nombMetodo] || '💳';
        // Normalización: Asegurarse de que el data-metodo coincide con el id de la sección
        const sectionId = metodo.nombMetodo.toLowerCase(); 
        const activeClass = index === 0 ? 'active' : '';
        
        return `
            <button type="button" class="metodo-btn ${activeClass}" 
                    data-metodo="${sectionId}" 
                    data-id="${metodo.idMetodo}"
                    data-nombre="${metodo.nombMetodo}">
                <span class="metodo-icon">${icono}</span>
                <span class="metodo-nombre">${metodo.nombMetodo}</span>
            </button>
        `;
    }).join('');

    // Seleccionar primer método por defecto
    if (metodosPago.length > 0) {
        metodoSeleccionado = metodosPago[0].idMetodo;
        document.getElementById(`section-${metodosPago[0].nombMetodo.toLowerCase()}`).classList.add('active');
        actualizarCamposRequeridos(metodosPago[0].nombMetodo.toLowerCase());
        
        // Actualizar botón al cargar
        actualizarBotonPago(metodosPago[0].nombMetodo);
    }

    agregarEventosMetodos();
}

// ===========================
// MÉTODOS POR DEFECTO
// ===========================
function mostrarMetodosPorDefecto() {
    // PLIN ELIMINADO de la lista de fallback
    metodosPago = [
        { idMetodo: 1, nombMetodo: 'Tarjeta', estadoMetodo: true },
        { idMetodo: 2, nombMetodo: 'Yape', estadoMetodo: true },
        { idMetodo: 3, nombMetodo: 'Efectivo', estadoMetodo: true }
    ];
    renderizarMetodosPago();
}

// ===========================
// EVENTOS DE MÉTODOS DE PAGO
// ===========================
function agregarEventosMetodos() {
    document.querySelectorAll('.metodo-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            // Manejo de clase activa
            document.querySelectorAll('.metodo-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            const metodo = this.dataset.metodo;
            const metodoNombre = this.dataset.nombre;
            metodoSeleccionado = parseInt(this.dataset.id);
            
            // Mostrar/Ocultar secciones
            document.querySelectorAll('.form-section').forEach(section => {
                section.classList.remove('active');
            });
            
            const seccionActiva = document.getElementById(`section-${metodo}`);
            if (seccionActiva) {
                seccionActiva.classList.add('active');
            } else {
                // Fallback (solo si no se usa el mismo ID)
                document.getElementById('section-tarjeta')?.classList.add('active');
            }
            
            actualizarCamposRequeridos(metodo);
            actualizarBotonPago(metodoNombre); // <-- Actualiza el texto del botón
        });
    });
}

// ===========================
// ACTUALIZAR CAMPOS REQUERIDOS
// ===========================
function actualizarCamposRequeridos(metodo) {
    // Remover required de todos los campos de todas las secciones
    document.querySelectorAll('.form-section input').forEach(input => {
        input.removeAttribute('required');
    });
    
    // Agregar required solo a los campos de la sección activa
    const seccionActiva = document.getElementById(`section-${metodo}`);
    if (seccionActiva) {
        seccionActiva.querySelectorAll('input').forEach(input => {
            const label = document.querySelector(`label[for="${input.id}"]`);
            if (label && label.textContent.includes('*')) {
                input.setAttribute('required', 'required');
            }
        });
    }
}

// ===========================
// ACTUALIZAR BOTÓN DE PAGO (Mejora UX)
// ===========================
function actualizarBotonPago(metodoNombre) {
    const btnSubmit = document.getElementById('btn-submit');
    const totalElement = document.getElementById('total');
    if (btnSubmit && totalElement) {
        const total = totalElement.textContent; // Ejemplo: S/ 120.00
        btnSubmit.textContent = `Procesar Pago con ${metodoNombre} ${total}`;
    }
}

// ===========================
// CARGAR DATOS DE RESERVA
// ===========================
function cargarDatosReserva() {
    const urlParams = new URLSearchParams(window.location.search);
    const idReserva = urlParams.get('idReserva');
    
    if (idReserva) {
        datosReserva.idReserva = idReserva;
        document.getElementById('idReserva').value = idReserva;
        
        // Cargar detalles de la reserva desde el backend (simulado)
        cargarDetallesReserva(idReserva);
    } else {
        // Usar datos por defecto
        actualizarResumen();
    }
}

// ===========================
// CARGAR DETALLES DE RESERVA (Simulada)
// ===========================
async function cargarDetallesReserva(idReserva) {
    try {
        // Reemplaza esta simulación con tu llamada fetch real:
        // const response = await fetch(`/api/reserva/${idReserva}`);
        // const data = await response.json();
        
        // Simulación:
        const data = {
            ok: true,
            datos: {
                idReserva: idReserva,
                tipoServicio: 'Tour de Aventura Extremo',
                duracion: '3 días',
                monto: 550.00
            }
        };

        if (data.ok && data.datos) {
            datosReserva = {
                idReserva: data.datos.idReserva,
                producto: data.datos.tipoServicio || datosReserva.producto,
                duracion: data.datos.duracion || datosReserva.duracion,
                montoTotal: parseFloat(data.datos.monto || datosReserva.montoTotal)
            };
            actualizarResumen();
        }
    } catch (error) {
        console.error('Error al cargar reserva:', error);
        actualizarResumen();
    }
}

// ===========================
// ACTUALIZAR RESUMEN
// ===========================
function actualizarResumen() {
    const total = datosReserva.montoTotal;
    const subtotal = total / 1.18; // Asume que el total ya incluye IGV
    const igvCalculado = total - subtotal;

    document.getElementById('producto-nombre').textContent = datosReserva.producto;
    document.getElementById('producto-duracion').textContent = datosReserva.duracion;
    document.getElementById('subtotal').textContent = `S/ ${subtotal.toFixed(2)}`;
    document.getElementById('igv').textContent = `S/ ${igvCalculado.toFixed(2)}`;
    document.getElementById('total').textContent = `S/ ${total.toFixed(2)}`;
    
    // Actualizar el botón de pago después de actualizar el total
    const metodoActivo = document.querySelector('.metodo-btn.active');
    if (metodoActivo) {
        actualizarBotonPago(metodoActivo.dataset.nombre);
    }
}

// ===========================
// INICIALIZAR EVENTOS DE INPUTS
// ===========================
function inicializarEventos() {
    // Formateo de número de tarjeta
    const numeroInput = document.getElementById('numero');
    const cardDisplay = document.getElementById('card-display');
    if (numeroInput && cardDisplay) {
        numeroInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\s/g, '').replace(/\D/g, '');
            let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
            e.target.value = formattedValue;
            cardDisplay.textContent = formattedValue || '•••• •••• •••• ••••';
        });
    }

    // Actualizar nombre en tarjeta
    const titularInput = document.getElementById('titular');
    const nameDisplay = document.getElementById('name-display');
    if (titularInput && nameDisplay) {
        titularInput.addEventListener('input', function(e) {
            nameDisplay.textContent = e.target.value.toUpperCase() || 'NOMBRE APELLIDO';
        });
    }

    // Formateo de fecha de expiración
    const expInput = document.getElementById('exp');
    const expDisplay = document.getElementById('exp-display');
    if (expInput && expDisplay) {
        expInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length >= 2) {
                value = value.slice(0, 2) + '/' + value.slice(2, 4);
            }
            e.target.value = value;
            expDisplay.textContent = value || 'MM/AA';
        });
    }

    // Restricción a solo números (CVV, DNI, Tel)
    document.getElementById('cvv')?.addEventListener('input', (e) => e.target.value = e.target.value.replace(/\D/g, '').slice(0, 4));
    document.getElementById('efectivo-dni')?.addEventListener('input', (e) => e.target.value = e.target.value.replace(/\D/g, '').slice(0, 8));

    // Formateo de números de celular (SOLO Yape)
    document.querySelectorAll('#yape-numero').forEach(input => {
        input.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            let formattedValue = '';
            if (value.length > 6) {
                formattedValue = value.slice(0, 3) + ' ' + value.slice(3, 6) + ' ' + value.slice(6, 9);
            } else if (value.length > 3) {
                formattedValue = value.slice(0, 3) + ' ' + value.slice(3);
            } else {
                formattedValue = value;
            }
            e.target.value = formattedValue;
        });
    });

    // Formateo de códigos de operación (SOLO Yape)
    document.querySelectorAll('#yape-codigo').forEach(input => {
        input.addEventListener('input', function(e) {
            e.target.value = e.target.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 20).toUpperCase();
        });
    });

    // Submit del formulario
    const formPago = document.getElementById('form-pago');
    if (formPago) {
        formPago.addEventListener('submit', procesarPago);
    }
}

// ===========================
// OBTENER DATOS DE PAGO
// ===========================
function obtenerDatosPago() {
    const metodoActivo = document.querySelector('.metodo-btn.active');
    const metodo = metodoActivo ? metodoActivo.dataset.metodo : '';
    
    switch(metodo) {
        case 'tarjeta':
            const numeroTarjeta = document.getElementById('numero')?.value.replace(/\s/g, '') || '';
            return {
                numTarjeta: numeroTarjeta,
                titular: document.getElementById('titular')?.value || '',
                fechaExp: document.getElementById('exp')?.value || '',
                cvv: document.getElementById('cvv')?.value || '',
                estadoPago: 'Completado'
            };
            
        case 'yape':
            return {
                numTarjeta: null,
                codigoOperacion: document.getElementById('yape-codigo')?.value.toUpperCase() || '',
                celular: document.getElementById('yape-numero')?.value.replace(/\s/g, '') || '',
                estadoPago: 'Pendiente'
            };

        // case 'plin' ha sido ELIMINADO

        case 'efectivo':
            return {
                numTarjeta: null,
                nombre: document.getElementById('efectivo-nombre')?.value || '',
                dni: document.getElementById('efectivo-dni')?.value.replace(/\s/g, '') || '',
                estadoPago: 'Pendiente'
            };

        default:
            return {};
    }
}

// ===========================
// VALIDACIÓN DE DATOS ESPECÍFICOS
// ===========================
function validarDatosPago(datos) {
    const metodoActivo = document.querySelector('.metodo-btn.active');
    const metodoNombre = metodoActivo ? metodoActivo.dataset.nombre : '';
    
    function showAndFocus(message, elementId) {
        showMessage('error', 'Error de Validación', message);
        document.getElementById(elementId)?.focus();
        return false;
    }

    switch(metodoNombre.toLowerCase()) {
        case 'tarjeta':
            if (datos.numTarjeta.length !== 16 || !/^\d{16}$/.test(datos.numTarjeta)) {
                return showAndFocus('El número de tarjeta debe tener 16 dígitos.', 'numero');
            }
            if (!datos.titular.trim()) {
                return showAndFocus('El nombre del titular es requerido.', 'titular');
            }
            if (!/^\d{2}\/\d{2}$/.test(datos.fechaExp)) {
                 return showAndFocus('La fecha de expiración debe estar en formato MM/AA.', 'exp');
            }
            const [mesStr, anioStr] = datos.fechaExp.split('/');
            const mes = parseInt(mesStr);
            const anioActual = new Date().getFullYear() % 100;
            const anio = parseInt(anioStr);

            if (mes < 1 || mes > 12) {
                return showAndFocus('El mes de expiración no es válido.', 'exp');
            }
            if (anio < anioActual || (anio === anioActual && mes < (new Date().getMonth() + 1))) {
                return showAndFocus('La tarjeta ha expirado.', 'exp');
            }

            if (datos.cvv.length < 3 || datos.cvv.length > 4 || !/^\d{3,4}$/.test(datos.cvv)) {
                return showAndFocus('El CVV debe tener 3 o 4 dígitos.', 'cvv');
            }
            break;
        case 'yape':
            if (datos.celular.length !== 9 || !/^\d{9}$/.test(datos.celular)) {
                return showAndFocus(`El número de celular para ${metodoNombre} debe tener 9 dígitos.`, 'yape-numero');
            }
            if (!datos.codigoOperacion.trim()) {
                return showAndFocus(`El código de operación de ${metodoNombre} es requerido.`, 'yape-codigo');
            }
            break;
        // case 'plin' ha sido ELIMINADO
        
        case 'efectivo':
            if (!datos.nombre.trim()) {
                return showAndFocus('El nombre para el pago en efectivo es requerido.', 'efectivo-nombre');
            }
            if (datos.dni.length !== 8 || !/^\d{8}$/.test(datos.dni)) {
                return showAndFocus('El DNI debe tener 8 dígitos.', 'efectivo-dni');
            }
            break;
        default:
            break;
    }

    return true;
}

// ===========================
// PROCESAR PAGO
// ===========================
async function procesarPago(e) {
    e.preventDefault();
    
    if (!metodoSeleccionado) {
        showMessage('warning', 'Atención', 'Por favor selecciona un método de pago.');
        return;
    }

    if (!datosReserva.idReserva) {
        showMessage('error', 'Error de Reserva', 'No se ha especificado una reserva. Imposible continuar.');
        return;
    }

    const btnSubmit = document.getElementById('btn-submit');
    const textoOriginal = btnSubmit.textContent;
    btnSubmit.disabled = true;
    btnSubmit.textContent = '⏳ Procesando...';

    const datosPago = obtenerDatosPago();
    
    // Validar datos específicos del método
    if (!validarDatosPago(datosPago)) {
        btnSubmit.disabled = false;
        btnSubmit.textContent = textoOriginal;
        return;
    }
    
    try {
        // **AQUÍ VA TU LLAMADA FETCH REAL AL BACKEND**
        // Por ahora es una simulación
        /*
        const response = await fetch('/api/pago/procesar_pago', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                montoTotal: datosReserva.montoTotal,
                idMetodo: metodoSeleccionado,
                idReserva: datosReserva.idReserva,
                ...datosPago
            })
        });
        const data = await response.json();
        */

        // SIMULACIÓN DE RESPUESTA EXITOSA:
        const data = {
            ok: true,
            idPago: `PAG-${Math.floor(Math.random() * 100000) + 10000}`
        };

        if (data.ok) {
            mostrarMensajeExito(data);
            setTimeout(() => {
                // window.location.href = `/api/pago/confirmacion_pago?idPago=${data.idPago}`;
                console.log(`Redirigiendo a confirmación de pago: /api/pago/confirmacion_pago?idPago=${data.idPago}`);
                btnSubmit.textContent = '✅ Completado';
            }, 2000);
        } else {
            throw new Error(data.mensaje || 'Error al procesar el pago');
        }
        
    } catch (error) {
        console.error('Error:', error);
        showMessage('error', 'Error de Transacción', 'Ocurrió un error al procesar el pago. Intenta de nuevo.');
        btnSubmit.disabled = false;
        btnSubmit.textContent = textoOriginal;
    }
}