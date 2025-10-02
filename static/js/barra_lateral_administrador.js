fetch('/static/templates/barra_lateral_administrador.html')
            .then(response => response.text())
            .then(data => {
                document.getElementById('barra_lateral_administrador-placeholder').innerHTML = data;
            });