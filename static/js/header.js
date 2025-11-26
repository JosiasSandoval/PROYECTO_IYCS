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

            // ============================================================
            // INICIO BLOQUE NUEVO: NOTIFICACIONES
            // ============================================================
            const btnNotif = headerPlaceholder.querySelector('#btn_notificaciones');
            const dropdownNotif = headerPlaceholder.querySelector('#dropdown_notificaciones');
            const badge = headerPlaceholder.querySelector('#badge_notificacion');
            const listaNotif = headerPlaceholder.querySelector('#lista_notificaciones');

            // Funciones auxiliares para notificaciones
            const actualizarContador = () => {
                fetch('/api/notificacion/conteo')
                    .then(res => res.json())
                    .then(data => {
                        if (data.count > 0 && badge) {
                            badge.textContent = data.count;
                            badge.style.display = "inline-block";
                        } else if (badge) {
                            badge.style.display = "none";
                        }
                    })
                    .catch(err => console.error("Error contador notif:", err));
            };

            const cargarNotificaciones = () => {
                if (!listaNotif) return;
                listaNotif.innerHTML = '<p style="padding:15px; text-align:center; color:#888;">Cargando...</p>';

                fetch('/api/notificacion/listar')
                    .then(res => res.json())
                    .then(data => {
                        listaNotif.innerHTML = "";
                        if (data.length === 0) {
                            listaNotif.innerHTML = '<p style="padding:15px; text-align:center; color:#888;">Sin notificaciones</p>';
                            return;
                        }
                        data.forEach(notif => {
                            const item = document.createElement("div");
                            // Se asume que tienes los estilos CSS definidos anteriormente
                            item.className = `notificacion-item ${notif.leido === 0 ? 'no-leido' : ''}`;
                            item.innerHTML = `
                                <div class="notif-titulo" style="font-weight:bold; font-size:13px;">${notif.titulo}</div>
                                <div class="notif-msg" style="font-size:12px;">${notif.mensaje}</div>
                                <div class="notif-fecha" style="font-size:10px; color:#999;">${notif.fecha}</div>
                            `;
                            item.addEventListener("click", () => {
                                if (notif.enlace) window.location.href = notif.enlace;
                            });
                            listaNotif.appendChild(item);
                        });
                        // Marcar como leídas
                        fetch('/api/notificacion/marcar_leida', { method: 'POST' })
                            .then(res => res.json())
                            .then(data => { if (data.status === 'ok' && badge) badge.style.display = "none"; });
                    })
                    .catch(err => console.error(err));
            };

            // Event Listeners para Notificaciones
            if (btnNotif && dropdownNotif) {
                // 1. Cargar contador al iniciar
                actualizarContador();

                // 2. Click en campana
                btnNotif.addEventListener('click', (e) => {
                    e.stopPropagation();
                    // Cerrar modal de usuario si está abierto (para evitar solapamiento)
                    if (modalUsuario) modalUsuario.classList.remove('mostrar');
                    
                    dropdownNotif.classList.toggle('active');
                    
                    if (dropdownNotif.classList.contains('active')) {
                        cargarNotificaciones();
                    }
                });

                // 3. Cerrar al hacer click fuera (Document)
                document.addEventListener('click', (e) => {
                    if (dropdownNotif.classList.contains('active') &&
                        !dropdownNotif.contains(e.target) &&
                        !btnNotif.contains(e.target)) {
                        dropdownNotif.classList.remove('active');
                    }
                });
            }
            // ============================================================
            // FIN BLOQUE NUEVO
            // ============================================================


            // ---------- Abrir/Cerrar modal Usuario (TU CÓDIGO ORIGINAL) ----------
            if (btnUsuario && modalUsuario) {
                btnUsuario.addEventListener('click', e => {
                    e.preventDefault();
                    e.stopPropagation();
                    // AGREGADO: Cerrar notificaciones si abrimos usuario
                    if (dropdownNotif) dropdownNotif.classList.remove('active'); 
                    
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
                    if (e.key === 'Escape') {
                        modalUsuario.classList.remove('mostrar');
                        // AGREGADO: También cerrar notificaciones con ESC
                        if (dropdownNotif) dropdownNotif.classList.remove('active');
                    }
                });
            }

            // ---------- Obtener sesión (TU CÓDIGO ORIGINAL) ----------
            fetch('/api/auth/get_session_data', { credentials: 'same-origin' })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        if (nombreEl) nombreEl.textContent = data.nombre;
                        if (cargoEl) cargoEl.textContent = data.cargo;
                        if (rolActualEl) rolActualEl.textContent = data.rol_actual;

                        // Renderizar selector de roles si hay más de uno
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
                                        // AGREGADO: Recargar página para reflejar permisos o actualizar contador notif
                                        actualizarContador(); 
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

            // ---------- Logout (TU CÓDIGO ORIGINAL) ----------
            if (btnCerrarSesion) {
                btnCerrarSesion.addEventListener('click', async e => {
                    e.preventDefault();
                    try {
                        const res = await fetch('/api/auth/cerrar_sesion', {
                            method: 'GET',
                            credentials: 'same-origin'
                        });
                        const data = await res.json();
                        if (data.success) {
                            window.location.href = '/'; 
                        } else {
                            console.error('Error al cerrar sesión:', data.mensaje || 'Desconocido');
                        }
                    } catch (err) {
                        console.error('Error al cerrar sesión:', err);
                    }
                });
            }
        });

});