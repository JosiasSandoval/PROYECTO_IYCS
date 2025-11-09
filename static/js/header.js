fetch('/static/templates/header.html')
  .then(response => response.text())
  .then(data => {
    const headerPlaceholder = document.getElementById('header-placeholder');
    headerPlaceholder.innerHTML = data;

    // ✅ Ahora que el header está cargado, buscamos el botón dentro de él
    const btnCerrarSesion = headerPlaceholder.querySelector('#btn_cerrar_sesion');
    if (btnCerrarSesion) {
      btnCerrarSesion.addEventListener('click', () => {
        window.location.href = '/cerrar_sesion'; // redirige al endpoint Flask
      });
    }
  })
  .catch(error => console.error('Error al cargar el header:', error));
