/**
 * Sistema de Sincronización de Sesión entre Pestañas
 * Detecta cuando se cierra sesión en una pestaña y cierra automáticamente en todas las demás
 */

(function() {
    'use strict';

    // Verificar estado de sesión al cargar
    function verificarSesion() {
        const sesionActiva = localStorage.getItem('sesion_activa');
        const timestampSesion = localStorage.getItem('sesion_timestamp');
        const ahora = Date.now();

        // Si no hay sesión activa o expiró (más de 30 minutos inactivo)
        if (sesionActiva === 'false' || !timestampSesion || (ahora - parseInt(timestampSesion)) > 1800000) {
            cerrarSesionLocal();
            return false;
        }
        return true;
    }

    // Cerrar sesión en esta pestaña sin llamar al servidor
    function cerrarSesionLocal() {
        const paginasPublicas = ['/', '/iniciar_sesion', '/registrarse', '/recuperar_contrasena'];
        const rutaActual = window.location.pathname;
        
        // Limpiar datos locales SIEMPRE
        sessionStorage.clear();
        localStorage.setItem('sesion_activa', 'false');
        localStorage.removeItem('sesion_timestamp');
        
        // Si ya estamos en una página pública, no redirigir
        if (paginasPublicas.includes(rutaActual)) {
            return;
        }

        // Mostrar notificación y redirigir automáticamente
        console.log('🔒 Sesión cerrada en otra pestaña. Redirigiendo al inicio...');
        
        // Crear notificación visual temporal
        const notif = document.createElement('div');
        notif.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #ff6b6b;
            color: white;
            padding: 15px 25px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 999999;
            font-family: Arial, sans-serif;
            font-size: 14px;
            animation: slideIn 0.3s ease;
        `;
        notif.innerHTML = '⚠️ <strong>Sesión cerrada</strong><br>Tu sesión fue cerrada en otra pestaña';
        document.body.appendChild(notif);
        
        // Redirigir inmediatamente (sin delay) para evitar problemas
        window.location.href = '/';
    }

    // Actualizar timestamp de actividad
    function actualizarActividad() {
        if (localStorage.getItem('sesion_activa') === 'true') {
            localStorage.setItem('sesion_timestamp', Date.now().toString());
        }
    }

    // Inicializar sesión cuando se inicia sesión exitosamente
    function inicializarSesion() {
        localStorage.setItem('sesion_activa', 'true');
        localStorage.setItem('sesion_timestamp', Date.now().toString());
    }

    // Finalizar sesión cuando se cierra manualmente
    function finalizarSesion() {
        localStorage.setItem('sesion_activa', 'false');
        localStorage.removeItem('sesion_timestamp');
    }

    // Escuchar cambios en localStorage desde otras pestañas
    window.addEventListener('storage', function(e) {
        // Detectar cuando otra pestaña cierra sesión
        if (e.key === 'sesion_activa' && e.newValue === 'false') {
            console.log('🔒 Sesión cerrada en otra pestaña. Cerrando esta pestaña...');
            cerrarSesionLocal();
        }
    });

    // Verificar sesión periódicamente cada 30 segundos
    setInterval(verificarSesion, 30000);

    // Actualizar actividad con interacciones del usuario
    ['click', 'keydown', 'scroll', 'mousemove'].forEach(evento => {
        document.addEventListener(evento, actualizarActividad, { passive: true, once: false });
    });

    // Verificar sesión al cargar la página
    document.addEventListener('DOMContentLoaded', function() {
        const paginasPublicas = ['/', '/iniciar_sesion', '/registrarse', '/recuperar_contrasena'];
        const rutaActual = window.location.pathname;
        
        // Si estamos en una página pública, limpiar localStorage si la sesión está cerrada
        if (paginasPublicas.includes(rutaActual)) {
            const sesionActiva = localStorage.getItem('sesion_activa');
            if (sesionActiva === 'false') {
                // Limpiar completamente para permitir nuevo inicio de sesión
                localStorage.removeItem('sesion_activa');
                localStorage.removeItem('sesion_timestamp');
                sessionStorage.clear();
            }
        } else {
            // Si estamos en una página protegida, verificar sesión
            verificarSesion();
        }
    });

    // Exponer funciones globales para que otros scripts puedan usarlas
    window.SessionSync = {
        inicializar: inicializarSesion,
        finalizar: finalizarSesion,
        verificar: verificarSesion,
        actualizarActividad: actualizarActividad
    };

})();
