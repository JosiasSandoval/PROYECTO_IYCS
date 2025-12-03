# Sistema de Sincronización de Sesión entre Pestañas

## ¿Qué hace este sistema?

Este sistema sincroniza el estado de la sesión del usuario entre todas las pestañas abiertas del navegador. Cuando cierras sesión en una pestaña, **automáticamente se cierra en todas las demás pestañas**.

## Archivos Modificados/Creados

### 1. **session_sync.js** (NUEVO)
- **Ubicación**: `static/js/session_sync.js`
- **Función**: Maneja la sincronización de sesión entre pestañas usando `localStorage`
- **Características**:
  - Detecta cuando se cierra sesión en otra pestaña
  - Valida el estado de sesión cada 30 segundos
  - Actualiza timestamp de actividad con interacciones del usuario
  - Expone API global `window.SessionSync` para otros scripts

### 2. **header.js** (MODIFICADO)
- **Cambios**:
  - Carga automáticamente `session_sync.js`
  - Al cerrar sesión, llama a `window.SessionSync.finalizar()`
  - Notifica a todas las pestañas del cierre de sesión

### 3. **iniciar_sesion.js** (MODIFICADO)
- **Cambios**:
  - Al iniciar sesión exitosamente, llama a `window.SessionSync.inicializar()`
  - Marca la sesión como activa en `localStorage`

### 4. **iniciar_sesion.html** (MODIFICADO)
- **Cambios**:
  - Incluye el script `session_sync.js` antes de `iniciar_sesion.js`

### 5. **pagina_principal.html** (MODIFICADO)
- **Cambios**:
  - Incluye el script `session_sync.js` antes de `header.js`

## Cómo Funciona

### Flujo de Inicio de Sesión:
1. Usuario ingresa credenciales
2. API valida y crea sesión en el servidor
3. `iniciar_sesion.js` llama a `SessionSync.inicializar()`
4. Se guarda en `localStorage`:
   - `sesion_activa = 'true'`
   - `sesion_timestamp = [fecha_actual]`

### Flujo de Cierre de Sesión:
1. Usuario hace clic en "Cerrar Sesión" en cualquier pestaña
2. `header.js` llama a `SessionSync.finalizar()`
3. Se actualiza `localStorage`:
   - `sesion_activa = 'false'`
4. **EVENTO STORAGE**: Todas las otras pestañas detectan el cambio
5. Cada pestaña:
   - Muestra notificación visual por 2 segundos
   - Redirige automáticamente a `/iniciar_sesion`

### Detección entre Pestañas:
```javascript
// El navegador dispara este evento en TODAS las pestañas (excepto la que hizo el cambio)
window.addEventListener('storage', function(e) {
    if (e.key === 'sesion_activa' && e.newValue === 'false') {
        cerrarSesionLocal(); // Cierra esta pestaña también
    }
});
```

## Sistema de Validación

### Verificación Periódica:
- Cada **30 segundos** verifica si la sesión sigue activa
- Si `sesion_activa === 'false'`, cierra la sesión local

### Timeout de Inactividad:
- Si no hay actividad por **30 minutos**, cierra la sesión automáticamente
- Se actualiza el timestamp con cada interacción del usuario:
  - Clicks
  - Teclas presionadas
  - Scroll
  - Movimiento del mouse

## API Pública

El sistema expone la siguiente API global:

```javascript
window.SessionSync = {
    inicializar: function() { ... },     // Marca sesión como activa
    finalizar: function() { ... },       // Marca sesión como inactiva
    verificar: function() { ... },       // Verifica estado actual
    actualizarActividad: function() { ... } // Actualiza timestamp
};
```

## Ventajas

✅ **Seguridad**: Evita que sesiones queden abiertas en pestañas olvidadas
✅ **UX Mejorada**: Usuario sabe inmediatamente cuando se cerró la sesión
✅ **Sincronización Instantánea**: Usa eventos nativos del navegador
✅ **Sin Polling Constante**: Solo verifica cada 30 segundos (bajo consumo)
✅ **Cross-Tab**: Funciona entre múltiples pestañas y ventanas

## Limitaciones

⚠️ Solo funciona en el **mismo navegador** (no sincroniza entre Chrome y Firefox)
⚠️ Usa `localStorage` que es **compartido por dominio**
⚠️ No protege contra ataques CSRF o XSS (usa sesiones HTTP seguras)

## Pruebas

### Cómo Probar:
1. Abre el sistema en **dos pestañas diferentes**
2. Inicia sesión en ambas
3. En una pestaña, haz clic en "Cerrar Sesión"
4. **Observa**: La otra pestaña debe mostrar notificación y redirigir automáticamente

### Resultado Esperado:
- Pestaña 1: Cierra sesión normalmente → redirige a `/`
- Pestaña 2: Detecta el cambio → muestra notificación roja → redirige a `/iniciar_sesion`

## Notas Técnicas

- **localStorage vs sessionStorage**:
  - `localStorage`: Compartido entre pestañas (usado para sincronización)
  - `sessionStorage`: Individual por pestaña (usado para datos temporales)

- **Evento `storage`**:
  - Solo se dispara en **otras pestañas**, no en la que hizo el cambio
  - Por eso la pestaña que cierra sesión usa el método normal

## Soporte de Navegadores

✅ Chrome/Edge: Completo
✅ Firefox: Completo
✅ Safari: Completo
✅ Opera: Completo
✅ IE11+: Completo (con polyfills)

---

**Desarrollado para LITBOOK - Sistema de Reservas Litúrgicas**
