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
        // ⚠️ Aquí ahora se puede simular localmente si no hay API
        const actos = [
            { id: 1, acto: "Matrimonio", costoBase: 150 },
            { id: 2, acto: "Bautismo", costoBase: 80 },
            { id: 3, acto: "Primera Comunión", costoBase: 120 }
        ];

        actoSelect.innerHTML = '<option value="">--Seleccione un acto--</option>';
        actos.forEach(acto => {
            const option = document.createElement('option');
            option.value = acto.id;
            option.textContent = `${acto.acto} (Costo: S/ ${acto.costoBase})`;
            actoSelect.appendChild(option);
        });

    } catch (error) {
        console.error("Error cargando actos por parroquia:", error);
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
