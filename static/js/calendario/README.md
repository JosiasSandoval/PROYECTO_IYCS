# 📅 Sistema de Calendario Modular

## 📁 Estructura de Archivos

```
static/js/calendario/
├── calendario-core.js          # ⚙️ Núcleo: Inicialización y FullCalendar
├── calendario-data-loader.js   # 📡 Carga de datos desde API
├── calendario-utils.js         # 🛠️ Utilidades compartidas
├── calendario-feligres.js      # 🙏 Lógica específica de feligrés
├── calendario-secretaria.js    # 👩‍💼 Lógica específica de secretaria
├── calendario-sacerdote.js     # ✝️ Lógica específica de sacerdote
└── calendario-modals.js        # 📋 Modales (a refactorizar)
```

---

## 🎯 Ventajas de la Nueva Arquitectura

### ✅ **Separación de Responsabilidades**
Cada archivo tiene una función clara y específica:
- ❌ **Antes:** Todo en un archivo de 745 líneas
- ✅ **Ahora:** 7 módulos de ~200-300 líneas cada uno

### ✅ **Mantenibilidad**
- Cambios en feligrés NO afectan a secretaria
- Fácil localizar bugs por rol
- Código autodocumentado

### ✅ **Escalabilidad**
- Agregar nuevos roles es simple
- Nuevas funcionalidades se aíslan
- Tests unitarios más fáciles

### ✅ **Reutilización**
- Utilidades compartidas (`utils.js`)
- Data loader único para todos
- Colores y estilos centralizados

---

## 🔧 Cómo Funciona

### **1. Flujo de Inicialización**

```javascript
// 1. index.html carga calendario-core.js (type="module")
// 2. core.js lee datos del usuario desde body.dataset
// 3. core.js determina el rol (feligres/secretaria/sacerdote)
// 4. core.js delega al módulo específico del rol
// 5. Cada módulo configura su calendario independientemente
```

### **2. Carga de Datos**

```javascript
// data-loader.js maneja TODAS las fuentes:
- window.reservasParaCalendario (mis_reservas.js)
- /api/reserva/feligres/{id}
- /api/reserva/secretaria/{id}
- /api/reserva/sacerdote/{id}
- /api/acto/parroquia/{id}/actos-horarios
```

### **3. Módulos por Rol**

#### **🙏 Feligrés (calendario-feligres.js)**
- ✅ Vista mensual (dayGridMonth)
- ✅ Ver todas sus reservas
- ✅ Filtrar por estado
- ✅ Click en evento → detalle
- ❌ No puede editar ni eliminar

#### **👩‍💼 Secretaria (calendario-secretaria.js)**
- ✅ **DOS MODOS:**
  1. **Vista Reservas:** Similar a feligrés pero con gestión
  2. **Gestión Horarios:** Agregar/eliminar horarios disponibles
- ✅ Filtros avanzados (estado + búsqueda)
- ✅ Aprobar/rechazar documentos
- ✅ Gestionar horarios de actos litúrgicos

#### **✝️ Sacerdote (calendario-sacerdote.js)**
- ✅ Vista semanal (timeGridWeek)
- ✅ **3 TABS:**
  - **Confirmadas:** Solo CONFIRMADO + ATENDIDO
  - **Todas:** Todas excepto canceladas
  - **Pendientes:** PENDIENTE_REVISION + PENDIENTE_DOCUMENTO
- ✅ Filtro por fecha y búsqueda
- ✅ Marcar como atendida

---

## 📖 Uso de los Módulos

### **Importar en HTML**

```html
<!-- ❌ ANTIGUA FORMA (ya no usar) -->
<script src="/static/js/calendario.js"></script>

<!-- ✅ NUEVA FORMA (modular) -->
<script type="module" src="/static/js/calendario/calendario-core.js"></script>
```

### **Acceder al Estado Global**

```javascript
// Desde cualquier parte del código:
const state = window.calendarioState;

console.log(state.rol);           // 'feligres' | 'secretaria' | 'sacerdote'
console.log(state.calendar);      // Instancia de FullCalendar
console.log(state.datos);         // Array de datos originales
console.log(state.datosFiltrados); // Array filtrado
```

### **Recargar Datos**

```javascript
import { refrescarDatos } from './calendario-data-loader.js';

// Recargar después de una acción (ej: pago aprobado)
await refrescarDatos(window.calendarioState);
```

---

## 🔍 API de Utilidades

### **Colores y Estados**

```javascript
import { obtenerColorPorEstado, obtenerNombreEstado } from './calendario-utils.js';

const color = obtenerColorPorEstado('CONFIRMADO'); // '#22c55e'
const nombre = obtenerNombreEstado('PENDIENTE_PAGO'); // 'Pendiente de Pago'
```

### **Validaciones**

```javascript
import { esFechaFutura, esHoraValida } from './calendario-utils.js';

if (!esFechaFutura('2024-01-01')) {
    alert('La fecha está en el pasado');
}

if (!esHoraValida('25:00')) {
    alert('Hora inválida');
}
```

### **Alertas**

```javascript
import { mostrarAlerta } from './calendario-utils.js';

mostrarAlerta('Reserva confirmada exitosamente', 'success');
mostrarAlerta('Error al procesar pago', 'error');
```

---

## 🛠️ Personalización por Rol

### **Agregar Nueva Funcionalidad a Feligrés**

1. Editar `calendario-feligres.js`
2. Agregar función
3. Llamar desde event listener
4. ✅ No afecta a secretaria ni sacerdote

**Ejemplo:**

```javascript
// En calendario-feligres.js
export function descargarComprobante(idReserva) {
    window.open(`/api/reserva/comprobante/${idReserva}`, '_blank');
}

// En la inicialización:
document.getElementById('btnDescargar')?.addEventListener('click', () => {
    descargarComprobante(idReserva);
});
```

### **Agregar Nuevo Rol**

1. Crear `calendario-nuevo-rol.js`
2. Implementar función `inicializarNuevoRol(state)`
3. Agregar case en `calendario-core.js`:

```javascript
case 'nuevo_rol':
    await inicializarNuevoRol(calendarioState);
    break;
```

---

## 🐛 Debugging

### **Logs**

```javascript
import { log, logError } from './calendario-utils.js';

log('Cargando datos...', { idUsuario, rol });
logError('Error en API', error);
```

### **Inspeccionar Estado**

```javascript
// En la consola del navegador:
console.table(window.calendarioState.datos);
console.table(window.calendarioState.datosFiltrados);
```

---

## 📝 TODOs y Mejoras Futuras

### **Prioridad Alta**
- [ ] Refactorizar `calendario-modals.js` siguiendo la misma estructura
- [ ] Implementar tests unitarios para cada módulo
- [ ] Agregar validaciones de permisos en cada acción

### **Prioridad Media**
- [ ] Implementar caché de datos para reducir llamadas API
- [ ] Agregar animaciones de transición entre vistas
- [ ] Optimizar rendimiento con lazy loading

### **Prioridad Baja**
- [ ] Soporte para múltiples idiomas
- [ ] Exportar calendario a PDF/Excel
- [ ] Vista de timeline para sacerdote

---

## 🚀 Migración desde el Sistema Antiguo

### **Paso 1: Actualizar HTML**

```html
<!-- Reemplazar en todos los templates de calendario -->
<script src="/static/js/calendario.js"></script>
<!-- Por -->
<script type="module" src="/static/js/calendario/calendario-core.js"></script>
```

### **Paso 2: Verificar Compatibilidad**

El nuevo sistema es **RETROCOMPATIBLE** con:
- ✅ `window.reservasParaCalendario` (mis_reservas.js)
- ✅ Dataset del body (rol, id, parroquia)
- ✅ Modales existentes (calendario-modals.js)

### **Paso 3: Probar por Rol**

1. **Feligrés:** Login → Mis Reservas
2. **Secretaria:** Login → Calendario (ambos modos)
3. **Sacerdote:** Login → Calendario → Tabs

---

## 📞 Soporte

¿Problemas? Revisa:
1. Consola del navegador (F12)
2. Network tab (llamadas API)
3. Logs con timestamp en consola

**Ejemplo de log normal:**
```
[2025-12-03T10:30:00.000Z] 🚀 Inicializando sistema de calendario...
[2025-12-03T10:30:00.100Z] 📋 Datos del usuario: {rol: 'feligres', idUsuario: '5'}
[2025-12-03T10:30:00.500Z] 🔄 Cargando datos del calendario
[2025-12-03T10:30:01.200Z] ✅ 6 reservas cargadas
[2025-12-03T10:30:01.300Z] 🙏 Inicializando calendario para feligrés
[2025-12-03T10:30:01.500Z] ✅ Calendario feligrés renderizado con 6 reservas
```

---

## 📚 Referencias

- [FullCalendar Docs](https://fullcalendar.io/docs)
- [ES6 Modules](https://developer.mozilla.org/es/docs/Web/JavaScript/Guide/Modules)
- [Clean Code Principles](https://github.com/ryanmcdermott/clean-code-javascript)

---

**Última actualización:** 3 de diciembre de 2025  
**Versión:** 2.0.0 (Modular)  
**Autor:** Sistema de Mejora Continua
