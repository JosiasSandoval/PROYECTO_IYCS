document.addEventListener('DOMContentLoaded', () => {
    const headerPlaceholder = document.getElementById('header-placeholder');

    if (!headerPlaceholder) return;

    fetch('/static/templates/header.html')
        .then(res => res.text())
        .then(html => {
            headerPlaceholder.innerHTML = html;

            const nombreEl = headerPlaceholder.querySelector('#header_nombre_usuario');
            const cargoEl = headerPlaceholder.querySelector('#header_cargo_usuario');
            const rolActualEl = headerPlaceholder.querySelector('#rol_actual');
            const modalUsuario = headerPlaceholder.querySelector('#modal_usuario');
            const btnUsuario = headerPlaceholder.querySelector('#btn_usuario');
            const btnCerrarSesion = headerPlaceholder.querySelector('#btn_cerrar_sesion');

            // ---------- Abrir/Cerrar modal ----------
            if (btnUsuario && modalUsuario) {
                btnUsuario.addEventListener('click', e => {
                    e.preventDefault();
                    e.stopPropagation();
                    modalUsuario.classList.toggle('mostrar');
                });

                document.addEventListener('click', e => {
                    if (modalUsuario.classList.contains('mostrar') &&
                        !modalUsuario.contains(e.target) &&
                        !btnUsuario.contains(e.target)) {
                        modalUsuario.classList.remove('mostrar');
                    }
                });

                document.addEventListener('keydown', e => {
                    if (e.key === 'Escape') modalUsuario.classList.remove('mostrar');
                });
            }

            // ---------- Obtener sesión ----------
            fetch('/api/auth/get_session_data', { credentials: 'same-origin' })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        if (nombreEl) nombreEl.textContent = data.nombre;
                        if (cargoEl) cargoEl.textContent = data.cargo;
                        if (rolActualEl) rolActualEl.textContent = data.rol_actual;

                        // Renderizar roles disponibles (opcional selector)
                        if (data.roles_disponibles.length > 1) {
                            const rolSelector = document.createElement('select');
                            rolSelector.id = 'rol_selector';
                            data.roles_disponibles.forEach(rol => {
                                const opt = document.createElement('option');
                                opt.value = rol;
                                opt.textContent = rol;
                                if (rol === data.rol_actual) opt.selected = true;
                                rolSelector.appendChild(opt);
                            });
                            rolActualEl.replaceWith(rolSelector);

                            rolSelector.addEventListener('change', async () => {
                                const nuevoRol = rolSelector.value;
                                try {
                                    const res = await fetch('/api/auth/cambiar_rol', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ rol: nuevoRol }),
                                        credentials: 'same-origin'
                                    });
                                    const resp = await res.json();
                                    if (resp.success) {
                                        alert(`Rol cambiado a ${nuevoRol}`);
                                        cargoEl.textContent = nuevoRol;
                                    }
                                } catch (err) {
                                    console.error('Error al cambiar rol:', err);
                                }
                            });
                        }

                    } else {
                        if (nombreEl) nombreEl.textContent = "Visitante";
                        if (cargoEl) cargoEl.textContent = "Invitado";
                    }
                });

            // ---------- Logout ----------
            if (btnCerrarSesion) {
                btnCerrarSesion.addEventListener('click', async e => {
                    e.preventDefault();
                    try {
                        const res = await fetch('/api/auth/cerrar_sesion', { credentials: 'same-origin' });
                        if (res.ok) window.location.href = '/';
                    } catch (err) {
                        console.error('Error al cerrar sesión:', err);
                    }
                });
            }
        });
});