// ============================================================
// PARROQUIA.JS - DETALLE DE PARROQUIA (API objeto + color dinámico + fecha formateada)
// ============================================================

document.addEventListener('DOMContentLoaded', async () => {
    // Obtenemos el ID de la parroquia desde sessionStorage
    const idParroquia = sessionStorage.getItem('idParroquiaSeleccionada');

    if (!idParroquia) {
        console.error('❌ No se encontró ID de parroquia en sessionStorage.');
        document.body.innerHTML = '<p style="color:red;">No se encontró ID de parroquia.</p>';
        return;
    }

    // Función para formatear fecha en español usando UTC
    function formatearFechaUTC(fechaStr) {
        if (!fechaStr) return '';
        const dias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
        const meses = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];

        const fecha = new Date(fechaStr);

        const diaSemana = dias[fecha.getUTCDay()];
        const dia = fecha.getUTCDate();
        const mes = meses[fecha.getUTCMonth()];
        const anio = fecha.getUTCFullYear();

        return `${diaSemana} ${dia} de ${mes} de ${anio}`;
    }

    try {
        // Petición al API para obtener información de la parroquia
        const response = await fetch(`/api/parroquia/informacion/${idParroquia}`);
        if (!response.ok) throw new Error("Error al obtener la información de la parroquia");

        const data = await response.json();
        console.log("Datos recibidos:", data);

        const p = data.datos; // objeto directamente

        if (!p) {
            document.body.innerHTML = '<p style="color:red;">No se encontró información de la parroquia.</p>';
            return;
        }

        // Función auxiliar para asignar texto de manera segura
        function setText(id, text) {
            const el = document.getElementById(id);
            if (el) el.textContent = text || '';
        }

        // Campos principales
        setText('nombre', p.nombParroquia);
        setText('historia', p.historiaParroquia);
        setText('ruc', p.ruc);
        setText('ubicacion', p.direccion);
        setText('contacto', p.telefonoContacto);
        setText('email', p.email);
        setText('info', p.infoAdicional);
        setText('fecha', formatearFechaUTC(p.f_creacion)); // fecha formateada correctamente
        setText('horario', `${p.horaAtencionInicial || ''} - ${p.horaAtencionFinal || ''}`);

        // Imagen de la parroquia
        const imagenEl = document.getElementById('imagen');
        if (imagenEl) {
            imagenEl.src = p.imagenParroquia || '/static/img/default_parroquia.png';
            imagenEl.alt = p.nombParroquia || 'Imagen de la parroquia';
        }

        // Color dinámico de la parroquia
        const detalleEl = document.querySelector('.detalle');
        if (detalleEl && p.color) {
            detalleEl.style.borderLeft = `8px solid ${p.color}`;
            detalleEl.style.boxShadow = `0 8px 20px ${p.color}33`; // sombra ligera con transparencia
        }

        // Lista de sacerdotes
        const listaSacerdotes = document.getElementById('lista-sacerdotes');
        if (listaSacerdotes) {
            listaSacerdotes.innerHTML = '';
            if (p.sacerdotes && p.sacerdotes.length > 0) {
                p.sacerdotes.forEach(s => {
                    const li = document.createElement('li');
                    li.textContent = s.nombre || '';
                    listaSacerdotes.appendChild(li);
                });
            } else {
                const li = document.createElement('li');
                li.textContent = 'No hay sacerdotes registrados.';
                listaSacerdotes.appendChild(li);
            }
        }

        // Lista de actos litúrgicos
        const listaActos = document.getElementById('lista-actos');
        if (listaActos) {
            listaActos.innerHTML = '';
            if (p.actos && p.actos.length > 0) {
                p.actos.forEach(a => {
                    const li = document.createElement('li');
                    li.textContent = `${a.nombre || ''} (${formatearFechaUTC(a.fecha) || ''})`;
                    listaActos.appendChild(li);
                });
            } else {
                const li = document.createElement('li');
                li.textContent = 'No hay actos registrados.';
                listaActos.appendChild(li);
            }
        }

        // Botón "Ver calendario" - guardar idParroquia en sesión y redirigir
        const btnVerCalendario = document.getElementById('btn-ver-calendario');
        if (btnVerCalendario) {
            btnVerCalendario.addEventListener('click', (e) => {
                e.preventDefault();
                // Guardar idParroquia en la sesión del servidor
                fetch(`/cliente/calendario?idParroquia=${idParroquia}`, {
                    method: 'GET'
                }).then(() => {
                    window.location.href = '/cliente/calendario';
                }).catch(err => {
                    console.error('Error al guardar idParroquia:', err);
                    // Redirigir de todas formas
                    window.location.href = '/cliente/calendario';
                });
            });
        }

    } catch (e) {
        console.error("❌ Error al cargar la información de la parroquia:", e);
        document.body.innerHTML = '<p style="color:red;">Error al cargar la información de la parroquia.</p>';
    }
});
