const selectActo = document.getElementById('acto-liturgico');

// Obtener el ID de la parroquia desde localStorage
const idParroquia = localStorage.getItem('idParroquiaSeleccionada');

if (idParroquia) {
    fetch(`/api/acto/reserva/${idParroquia}`)
        .then(response => {
            if (!response.ok) throw new Error("Error al obtener los actos litúrgicos");
            return response.json();
        })
        .then(data => {
            selectActo.innerHTML = ''; // limpiar select
            data.datos.forEach(acto => {
                const option = document.createElement('option');
                option.value = acto.id;
                option.textContent = `${acto.acto} - S/.${acto.costoBase}`;
                selectActo.appendChild(option);
            });
        })
        .catch(err => console.error(err));
} else {
    console.warn("No se ha seleccionado ninguna parroquia todavía.");
}
