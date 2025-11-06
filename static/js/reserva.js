// ==============================
// reserva.js — Lógica solo para la reserva
// ==============================

document.addEventListener('DOMContentLoaded', async () => {
    const idParroquiaSeleccionada = localStorage.getItem('idParroquiaSeleccionada');

    if (!idParroquiaSeleccionada) {
        const formContainer = document.getElementById('form-container');
        if (formContainer) {
            formContainer.innerHTML = `<p style="color:red; font-weight:bold;">Debes seleccionar una parroquia antes de continuar.</p>`;
        }
        return;
    }

    await cargarActosPorParroquia(idParroquiaSeleccionada);
    cargarDatosPrevios();
});

// ==============================
// Cargar actos litúrgicos
// ==============================

async function cargarActosPorParroquia(idParroquia) {
    const actoSelect = document.getElementById('acto-liturgico');
    if (!actoSelect) return;

    try {
        // 🔹 Petición real a la API Flask
        const respuesta = await fetch(`/api/acto/${idParroquia}`);
        if (!respuesta.ok) {
            throw new Error("Error al obtener los actos litúrgicos desde el servidor");
        }

        const data = await respuesta.json(); // contiene { success, mensaje, datos }

        actoSelect.innerHTML = '<option value="">--Seleccione un acto--</option>';

        // 🔹 Verificar que haya datos antes de recorrer
        if (data.success && Array.isArray(data.datos) && data.datos.length > 0) {
            data.datos.forEach(acto => {
                const option = document.createElement('option');
                option.value = acto.id;
                option.textContent = `${acto.acto} (Costo: S/ ${acto.costoBase})`;
                actoSelect.appendChild(option);
            });

                // 🔹 Guardar los actos en localStorage para el calendario
        localStorage.setItem('actosParroquia', JSON.stringify(data.datos));
        } else {
            actoSelect.innerHTML = '<option value="">No hay actos disponibles</option>';
        }

    } catch (error) {
        console.error("❌ Error cargando actos por parroquia:", error);
        actoSelect.innerHTML = '<option value="">Error al cargar actos</option>';
    }
}

// ==============================
// Confirmar reserva
// ==============================
document.getElementById('btn-siguiente')?.addEventListener('click', function() {
    const fecha = document.getElementById('fecha-acto')?.value;
    const hora = document.getElementById('hora-acto')?.value;
    const observaciones = document.getElementById('observaciones')?.value;
    const actoSelect = document.getElementById('acto-liturgico');
    const idActo = actoSelect?.value;
    const nombreActo = actoSelect?.options[actoSelect.selectedIndex]?.textContent || '';

    if (!fecha || !hora || !idActo) {
        alert("Debe completar todos los campos antes de continuar.");
        return;
    }

    localStorage.setItem('reserva', JSON.stringify({
        idActo,
        nombreActo,
        fecha,
        hora,
        observaciones
    }));

    // Mostrar modal de confirmación
    const modal = new bootstrap.Modal(document.getElementById('modalConfirmar'));
    document.getElementById('fechaSeleccionada').textContent = fecha;
    modal.show();

    document.getElementById('btnConfirmarReserva').onclick = () => {
        modal.hide();
        window.location.href = 'reserva_datos'; // ← Cambiar a tu ruta real
    };
});

// ==============================
// Cargar datos previos si vuelve atrás
// ==============================
function cargarDatosPrevios() {
    const datosPrevios = localStorage.getItem('reserva');
    if (!datosPrevios) return;

    const reserva = JSON.parse(datosPrevios);
    document.getElementById('fecha-acto').value = reserva.fecha || '';
    document.getElementById('hora-acto').value = reserva.hora || '';
    document.getElementById('observaciones').value = reserva.observaciones || '';
    document.getElementById('acto-liturgico').value = reserva.idActo || '';
}
