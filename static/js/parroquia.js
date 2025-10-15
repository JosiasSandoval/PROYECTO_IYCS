document.addEventListener('DOMContentLoaded', async () => {
    const idParroquia = localStorage.getItem('idParroquiaSeleccionada');
    if (!idParroquia) {
        document.body.innerHTML = '<p style="color:red;">No se encontró ID de parroquia.</p>';
        return;
    }

    try {
        const response = await fetch(`/api/parroquia/informacion/${idParroquia}`);
        if (!response.ok) throw new Error("Error al obtener la información");

        const data = await response.json();
        console.log("Datos recibidos:", data);

        if (!data.datos || data.datos.length === 0) {
            document.body.innerHTML = '<p style="color:red;">No se encontró información de la parroquia.</p>';
            return;
        }

        const p = data.datos[0];
        document.getElementById('nombre').textContent = p.nombParroquia || '';
        document.getElementById('historia').textContent = p.historiaParroquia || '';
        document.getElementById('ruc').textContent = p.ruc || '';
        document.getElementById('ubicacion').textContent = p.direccion || '';
        document.getElementById('contacto').textContent = p.telefonoContacto || '';
        document.getElementById('info').textContent = p.infoAdicional || '';
        document.getElementById('fecha').textContent = p.f_creacion || '';
        document.getElementById('horario').textContent = `${p.horaAtencionInicial || ''} - ${p.horaAtencionFinal || ''}`;
    } catch (e) {
        console.error("Error al cargar la información:", e);
        document.body.innerHTML = '<p style="color:red;">Error al cargar la información.</p>';
    }
});
