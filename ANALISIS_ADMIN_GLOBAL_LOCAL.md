# 📊 ANÁLISIS: Administradores Globales vs Locales

## 🔍 Estado Actual del Sistema

### Estructura de Roles Identificada

Según el análisis de tu código, actualmente tienes:

1. **ROL en Base de Datos** (`bd_sistema.sql`):
   - `idRol` (PK)
   - `nombRol` (VARCHAR) - Ejemplo: "Administrador", "Sacerdote", "Secretaria", "Feligres"
   - `estadoRol` (BOOLEAN)

2. **ROL_USUARIO** (Relación muchos a muchos):
   - Un usuario puede tener múltiples roles
   - Ejemplo: Usuario 32 puede ser "Administrador" Y "Sacerdote"

3. **PARROQUIA_PERSONAL** (Asignación de personal a parroquias):
   - `idParroquia` - A qué parroquia pertenece
   - `idPersonal` - Qué personal es
   - `idCargo` - Qué cargo tiene
   - `vigenciaParrPers` - Si está activo o no

### Sistema de Autenticación Actual

En `app/auth/controlador_auth.py`, la función `autenticar_usuario()`:
- ✅ Obtiene `idParroquia` desde `PARROQUIA_PERSONAL` (línea 117)
- ✅ Solo para **PERSONAL** (Sacerdote, Secretaria, etc.)
- ❌ Los **Administradores Globales** NO tienen `idParroquia` (es NULL)

En `app/auth/route_auth.py`, el login guarda en sesión:
```python
session['idParroquia'] = resultado_auth.get('idParroquia')  # Puede ser NULL
```

### Control de Acceso Actual

En `app/__init__.py`, el decorador `@requires_roles()`:
```python
def requires_roles(*roles):
    # Administrador SIEMPRE TIENE ACCESO (línea 38)
    if rol and rol.lower() == 'administrador':
        return fn(*args, **kwargs)
```

**Problema Identificado:** 
- ⚠️ **TODOS los administradores** (globales y locales) tienen acceso completo
- ⚠️ No hay filtro por `idParroquia` en las consultas de administradores

---

## 🎯 Propuesta de Implementación

### Opción 1: Usar Campo en Tabla ROL (RECOMENDADA)

**Ventaja:** Simple, no requiere cambios en estructura de tablas

#### Cambios en Base de Datos:

```sql
-- Agregar columna 'alcance' a la tabla ROL
ALTER TABLE ROL ADD COLUMN alcance ENUM('GLOBAL', 'LOCAL') DEFAULT 'LOCAL' AFTER nombRol;

-- Actualizar roles existentes
UPDATE ROL SET alcance = 'GLOBAL' WHERE nombRol = 'Administrador';
UPDATE ROL SET alcance = 'LOCAL' WHERE nombRol IN ('Sacerdote', 'Secretaria');
```

#### Cambios en Código:

**1. Modificar `app/auth/controlador_auth.py`** (línea ~150):

```python
# Obtener roles con su alcance
sql_roles = """
    SELECT r.nombRol, r.alcance
    FROM rol_usuario ru
    INNER JOIN rol r ON ru.idRol = r.idRol
    WHERE ru.idUsuario = %s
    ORDER BY ru.idRolUsuario ASC
"""
cursor.execute(sql_roles, (idUsuario,))
roles_data = cursor.fetchall()

roles = [rol[0] for rol in roles_data]
rol_principal = roles[0] if roles else None

# Nuevo: determinar si es administrador global
alcance_admin = None
for rol_name, alcance in roles_data:
    if rol_name == 'Administrador':
        alcance_admin = alcance
        break

usuario_data = {
    'idUsuario': idUsuario,
    'nombre': nombre,
    # ... otros campos
    'es_admin_global': (alcance_admin == 'GLOBAL'),
    'idParroquia': idParroquia  # NULL para globales
}
```

**2. Modificar `app/__init__.py` - Decorador**:

```python
def requires_roles(*roles):
    def wrapper(fn):
        @wraps(fn)
        def decorated_view(*args, **kwargs):
            if 'idUsuario' not in session:
                return redirect(url_for('iniciar_sesion'))

            rol = session.get('rol_sistema')
            es_admin_global = session.get('es_admin_global', False)
            
            # Administrador GLOBAL siempre tiene acceso
            if rol and rol.lower() == 'administrador' and es_admin_global:
                return fn(*args, **kwargs)
            
            # Administrador LOCAL debe tener parroquia asignada
            if rol and rol.lower() == 'administrador' and not es_admin_global:
                if not session.get('idParroquia'):
                    return redirect(url_for('principal'))
            
            # Validación normal
            roles_lower = [r.lower() for r in roles]
            if rol and rol.lower() not in roles_lower:
                return redirect(url_for('principal'))

            return fn(*args, **kwargs)
        return decorated_view
    return wrapper
```

**3. Filtrar Consultas por Parroquia**:

Ejemplo en `app/parroquia/controlador_parroquia.py`:

```python
def listar_parroquia(es_admin_global, idParroquia=None):
    try:
        conexion = obtener_conexion()
        with conexion.cursor() as cursor:
            # Administrador GLOBAL: ve todas las parroquias
            if es_admin_global:
                sql = """
                    SELECT idParroquia, nombParroquia, ruc, 
                           telefonoContacto, email, direccion, 
                           f_creacion, estadoParroquia
                    FROM PARROQUIA
                    ORDER BY nombParroquia
                """
                cursor.execute(sql)
            
            # Administrador LOCAL: solo su parroquia
            else:
                if not idParroquia:
                    return []
                
                sql = """
                    SELECT idParroquia, nombParroquia, ruc, 
                           telefonoContacto, email, direccion, 
                           f_creacion, estadoParroquia
                    FROM PARROQUIA
                    WHERE idParroquia = %s
                """
                cursor.execute(sql, (idParroquia,))
            
            return cursor.fetchall()
    except Exception as e:
        print(f"Error: {e}")
        return []
    finally:
        if conexion:
            conexion.close()
```

**4. Actualizar Routes para pasar parámetros**:

```python
@parroquia_bp.route('/', methods=['GET'])
def route_listar_parroquia():
    from flask import session
    es_admin_global = session.get('es_admin_global', False)
    idParroquia = session.get('idParroquia')
    
    parroquias = listar_parroquia(es_admin_global, idParroquia)
    return jsonify(parroquias)
```

**5. Frontend JavaScript** (`static/js/admin_parroquia.js`):

```javascript
// Detectar si el usuario es admin global
let esAdminGlobal = false;

// Al cargar la página
fetch('/api/auth/get_session_data')
    .then(res => res.json())
    .then(data => {
        esAdminGlobal = data.es_admin_global || false;
        
        if (!esAdminGlobal) {
            // Ocultar botones de agregar/eliminar para admin local
            document.getElementById('btn_guardar').style.display = 'none';
        }
        
        cargarParroquias();
    });
```

---

### Opción 2: Crear Roles Separados

**Ventaja:** Más explícito, mejor para auditoría

#### Cambios en Base de Datos:

```sql
-- Crear nuevos roles
INSERT INTO ROL (nombRol, estadoRol) VALUES 
('Administrador Global', TRUE),
('Administrador Local', TRUE);

-- Migrar usuarios existentes
-- Administradores sin parroquia → Global
UPDATE ROL_USUARIO ru
INNER JOIN USUARIO u ON ru.idUsuario = u.idUsuario
LEFT JOIN PERSONAL p ON u.idUsuario = p.idUsuario
LEFT JOIN PARROQUIA_PERSONAL pp ON p.idPersonal = pp.idPersonal AND pp.vigenciaParrPers = TRUE
SET ru.idRol = (SELECT idRol FROM ROL WHERE nombRol = 'Administrador Global')
WHERE ru.idRol = (SELECT idRol FROM ROL WHERE nombRol = 'Administrador')
  AND pp.idParroquia IS NULL;

-- Administradores con parroquia → Local
UPDATE ROL_USUARIO ru
INNER JOIN USUARIO u ON ru.idUsuario = u.idUsuario
INNER JOIN PERSONAL p ON u.idUsuario = p.idUsuario
INNER JOIN PARROQUIA_PERSONAL pp ON p.idPersonal = pp.idPersonal AND pp.vigenciaParrPers = TRUE
SET ru.idRol = (SELECT idRol FROM ROL WHERE nombRol = 'Administrador Local')
WHERE ru.idRol = (SELECT idRol FROM ROL WHERE nombRol = 'Administrador')
  AND pp.idParroquia IS NOT NULL;

-- Opcional: eliminar rol antiguo
-- DELETE FROM ROL WHERE nombRol = 'Administrador';
```

#### Cambios en Código:

Similar a Opción 1, pero reemplazando:
- `'Administrador'` → `'Administrador Global'` o `'Administrador Local'`
- `es_admin_global` → `rol == 'Administrador Global'`

---

## 📋 Módulos que Requieren Filtrado

### Módulos que SOLO Admins Globales deben ver COMPLETO:

1. **✅ Parroquias** (`app/parroquia/`)
   - Admin Global: Crea/edita/elimina TODAS las parroquias
   - Admin Local: Solo VE su propia parroquia (sin editar)

2. **✅ Usuarios Personal** (`app/usuario/controlador_personal.py`)
   - Admin Global: Ve TODO el personal del sistema
   - Admin Local: Solo ve personal de SU parroquia

3. **✅ Actos Litúrgicos** (`app/acto_liturgico/`)
   - Admin Global: Gestiona actos de TODAS las parroquias
   - Admin Local: Solo actos de SU parroquia

4. **✅ Configuración de Actos** (`app/acto_liturgico/`)
   - Admin Global: Modifica configuración global
   - Admin Local: Solo consulta (no modifica)

5. **✅ Reportes** (`app/reportes/`)
   - Admin Global: Reportes de TODAS las parroquias
   - Admin Local: Reportes solo de SU parroquia

### Módulos Compartidos (con filtro por parroquia):

6. **⚠️ Reservas** (`app/reserva/`)
   - Ambos: Solo reservas de su(s) parroquia(s)
   - Ya tiene filtro: `WHERE r.idParroquia = %s`

7. **⚠️ Pagos** (`app/pago/`)
   - Ambos: Solo pagos de reservas de su(s) parroquia(s)

8. **⚠️ Documentos/Requisitos** (`app/documento_requisito/`)
   - Ambos: Solo documentos de su(s) parroquia(s)

### Módulos SOLO Admin Global:

9. **🔒 Roles y Permisos** (`app/rol_permiso/`)
   - SOLO Admin Global puede modificar
   - Admin Local: Sin acceso

10. **🔒 Tipos de Documento** (`app/tipo_documento/`)
    - SOLO Admin Global (configuración del sistema)

11. **🔒 Métodos de Pago** (`app/pago_metodo/`)
    - SOLO Admin Global (configuración del sistema)

12. **🔒 Cargos** (`app/cargo/`)
    - SOLO Admin Global (estructura organizacional)

---

## 🚀 Plan de Implementación Paso a Paso

### Fase 1: Base de Datos (30 min)
1. ✅ Agregar columna `alcance` a tabla `ROL`
2. ✅ Actualizar datos existentes
3. ✅ Crear usuarios de prueba (1 global, 2 locales)

### Fase 2: Backend - Autenticación (45 min)
1. ✅ Modificar `controlador_auth.py` para obtener `alcance`
2. ✅ Guardar `es_admin_global` en sesión
3. ✅ Actualizar endpoint `/get_session_data` para incluir flag

### Fase 3: Backend - Decoradores y Permisos (1 hora)
1. ✅ Modificar `@requires_roles` para distinguir global/local
2. ✅ Crear decorador adicional `@requires_global_admin`
3. ✅ Aplicar en rutas críticas (roles, tipos documento, etc.)

### Fase 4: Backend - Filtros por Módulo (2-3 horas)
1. ✅ **Parroquias**: Filtrar por `idParroquia` si admin local
2. ✅ **Usuarios**: Filtrar personal por parroquia
3. ✅ **Reservas**: Ya filtrado, validar
4. ✅ **Reportes**: Agregar filtro parroquia
5. ✅ **Actos Litúrgicos**: Filtrar por parroquia

### Fase 5: Frontend - Ajustes UI (1-2 horas)
1. ✅ Ocultar botones "Agregar/Eliminar" para admin local
2. ✅ Mostrar badge "Admin Global" vs "Admin Local" en header
3. ✅ Deshabilitar campos de edición sensibles para admin local
4. ✅ Agregar indicador visual en tablas (solo su parroquia)

### Fase 6: Testing (1 hora)
1. ✅ Probar login como admin global
2. ✅ Probar login como admin local
3. ✅ Verificar filtros en cada módulo
4. ✅ Validar permisos de edición/eliminación

---

## 📝 Ejemplo Completo: Módulo Parroquias

### 1. SQL Migration:

```sql
-- migration_admin_global_local.sql
ALTER TABLE ROL ADD COLUMN alcance ENUM('GLOBAL', 'LOCAL') DEFAULT 'LOCAL' AFTER nombRol;
UPDATE ROL SET alcance = 'GLOBAL' WHERE nombRol = 'Administrador';
```

### 2. Backend - Controlador:

```python
# app/parroquia/controlador_parroquia.py

def listar_parroquia(es_admin_global=False, idParroquia=None):
    """
    Lista parroquias según el tipo de administrador.
    
    Args:
        es_admin_global (bool): True si es admin global
        idParroquia (int): ID de parroquia del admin local
    
    Returns:
        list: Lista de parroquias según permisos
    """
    try:
        conexion = obtener_conexion()
        with conexion.cursor() as cursor:
            if es_admin_global:
                # Admin Global: todas las parroquias
                sql = """
                    SELECT idParroquia, nombParroquia, ruc, 
                           telefonoContacto, email, direccion, 
                           f_creacion, estadoParroquia,
                           'TODAS' as alcance
                    FROM PARROQUIA
                    ORDER BY estadoParroquia DESC, nombParroquia ASC
                """
                cursor.execute(sql)
            else:
                # Admin Local: solo su parroquia
                if not idParroquia:
                    return []
                
                sql = """
                    SELECT idParroquia, nombParroquia, ruc, 
                           telefonoContacto, email, direccion, 
                           f_creacion, estadoParroquia,
                           'MI PARROQUIA' as alcance
                    FROM PARROQUIA
                    WHERE idParroquia = %s
                """
                cursor.execute(sql, (idParroquia,))
            
            columnas = ['id', 'nombre', 'ruc', 'telefono', 'email', 
                       'direccion', 'fecha_creacion', 'estado', 'alcance']
            
            resultados = []
            for fila in cursor.fetchall():
                resultados.append(dict(zip(columnas, fila)))
            
            return resultados
            
    except Exception as e:
        print(f"Error en listar_parroquia: {e}")
        return []
    finally:
        if conexion:
            conexion.close()


def puede_modificar_parroquia(es_admin_global, idParroquia_usuario, idParroquia_target):
    """
    Valida si el usuario puede modificar una parroquia específica.
    
    Returns:
        tuple: (puede_modificar: bool, mensaje: str)
    """
    if es_admin_global:
        return True, ""
    
    if idParroquia_usuario == idParroquia_target:
        return True, ""
    
    return False, "No tienes permisos para modificar esta parroquia"
```

### 3. Backend - Route:

```python
# app/parroquia/route_parroquia.py

@parroquia_bp.route('/', methods=['GET'])
def route_listar_parroquia():
    from flask import session
    
    es_admin_global = session.get('es_admin_global', False)
    idParroquia = session.get('idParroquia')
    
    parroquias = listar_parroquia(es_admin_global, idParroquia)
    
    return jsonify({
        'success': True,
        'datos': parroquias,
        'es_admin_global': es_admin_global
    })


@parroquia_bp.route('/actualizar/<int:idParroquia>', methods=['PUT'])
def route_actualizar_parroquia(idParroquia):
    from flask import session
    
    es_admin_global = session.get('es_admin_global', False)
    idParroquia_usuario = session.get('idParroquia')
    
    # Validar permisos
    puede, mensaje = puede_modificar_parroquia(
        es_admin_global, 
        idParroquia_usuario, 
        idParroquia
    )
    
    if not puede:
        return jsonify({'success': False, 'mensaje': mensaje}), 403
    
    # Continuar con actualización...
    data = request.get_json()
    exito, resultado = actualizar_parroquia(idParroquia, data)
    
    return jsonify({
        'success': exito,
        'mensaje': resultado
    })
```

### 4. Frontend - JavaScript:

```javascript
// static/js/admin_parroquia.js

let esAdminGlobal = false;
let idParroquiaUsuario = null;

document.addEventListener("DOMContentLoaded", async () => {
    // Obtener permisos del usuario
    await cargarDatosUsuario();
    
    // Configurar UI según permisos
    configurarInterfazSegunPermisos();
    
    // Cargar datos
    cargarParroquias();
});

async function cargarDatosUsuario() {
    try {
        const res = await fetch('/api/auth/get_session_data');
        const data = await res.json();
        
        esAdminGlobal = data.es_admin_global || false;
        idParroquiaUsuario = data.idParroquia;
        
        console.log('Usuario:', {
            esAdminGlobal,
            idParroquiaUsuario
        });
    } catch (error) {
        console.error('Error cargando datos usuario:', error);
    }
}

function configurarInterfazSegunPermisos() {
    const btnAgregar = document.getElementById('btn_guardar');
    
    if (!esAdminGlobal) {
        // Admin Local: solo lectura
        btnAgregar.style.display = 'none';
        
        // Mostrar badge
        const badge = document.createElement('span');
        badge.className = 'badge-admin-local';
        badge.textContent = 'Administrador Local';
        badge.style.cssText = 'background:#ffc107; color:#000; padding:5px 10px; border-radius:4px; margin-left:10px;';
        
        const titulo = document.querySelector('.titulo-seccion');
        if (titulo) titulo.appendChild(badge);
    } else {
        // Admin Global: acceso completo
        const badge = document.createElement('span');
        badge.className = 'badge-admin-global';
        badge.textContent = 'Administrador Global';
        badge.style.cssText = 'background:#28a745; color:#fff; padding:5px 10px; border-radius:4px; margin-left:10px;';
        
        const titulo = document.querySelector('.titulo-seccion');
        if (titulo) titulo.appendChild(badge);
    }
}

function renderizarTabla(parroquiasAMostrar) {
    tabla.innerHTML = "";
    
    if (!parroquiasAMostrar || parroquiasAMostrar.length === 0) {
        tabla.innerHTML = '<tr><td colspan="8">No hay parroquias registradas</td></tr>';
        return;
    }

    parroquiasAMostrar.forEach((p) => {
        const fila = document.createElement("tr");
        
        // Marcar visualmente si es su parroquia
        if (!esAdminGlobal && p.id === idParroquiaUsuario) {
            fila.style.backgroundColor = '#fff3cd';
        }
        
        fila.innerHTML = `
            <td>${p.id}</td>
            <td>${p.nombre}</td>
            <td>${p.ruc}</td>
            <td>${p.telefono}</td>
            <td>${p.email}</td>
            <td>${p.direccion}</td>
            <td>${formatearFecha(p.fecha_creacion)}</td>
            <td>
                ${p.estado ? 
                    '<span class="badge-activo">Activo</span>' : 
                    '<span class="badge-inactivo">Inactivo</span>'
                }
            </td>
            <td>
                <button class="btn-icono" onclick="verParroquia(${p.id})" title="Ver">
                    <img src="/static/img/ver.png" alt="Ver">
                </button>
                ${esAdminGlobal ? `
                    <button class="btn-icono" onclick="editarParroquia(${p.id})" title="Editar">
                        <img src="/static/img/editar.png" alt="Editar">
                    </button>
                    <button class="btn-icono" onclick="cambiarEstado(${p.id}, ${p.estado})" title="Cambiar Estado">
                        <img src="/static/img/${p.estado ? 'desactivar' : 'activar'}.png" alt="Estado">
                    </button>
                    <button class="btn-icono" onclick="confirmarEliminar(${p.id})" title="Eliminar">
                        <img src="/static/img/eliminar.png" alt="Eliminar">
                    </button>
                ` : ''}
            </td>
        `;
        
        tabla.appendChild(fila);
    });
}
```

### 5. HTML - Vista:

```html
<!-- site/administradores/parroquia_admi.html -->

<div class="contenido-principal">
    <div class="contenido">   
        <h3 class="titulo-seccion">
            GESTIÓN DE PARROQUIAS
            <!-- Badge se agregará dinámicamente con JS -->
        </h3>
        
        <!-- Admin Local verá nota informativa -->
        <div id="nota-admin-local" style="display:none;" class="alert alert-info">
            ℹ️ Como Administrador Local, solo puedes ver la información de tu parroquia.
            No puedes crear, editar o eliminar parroquias.
        </div>
        
        <!-- Resto del contenido... -->
    </div>
</div>
```

---

## ✅ Checklist de Implementación

### Base de Datos
- [ ] Agregar columna `alcance` a `ROL`
- [ ] Actualizar rol Administrador con `alcance='GLOBAL'`
- [ ] Crear usuarios de prueba

### Backend - Core
- [ ] Modificar `autenticar_usuario()` para obtener alcance
- [ ] Agregar `es_admin_global` a datos de sesión
- [ ] Actualizar `/api/auth/get_session_data`

### Backend - Permisos
- [ ] Modificar decorador `@requires_roles`
- [ ] Crear `@requires_global_admin`
- [ ] Aplicar a rutas críticas

### Backend - Controladores (por módulo)
- [ ] Parroquias: Filtrar por idParroquia si local
- [ ] Usuarios: Filtrar personal por parroquia
- [ ] Actos: Filtrar por parroquia
- [ ] Reservas: Validar filtro existente
- [ ] Reportes: Agregar filtro parroquia
- [ ] Pagos: Filtrar por parroquia de reserva
- [ ] Documentos: Filtrar por parroquia

### Frontend - UI
- [ ] Detectar `es_admin_global` en JS
- [ ] Ocultar botones para admin local
- [ ] Mostrar badges visuales
- [ ] Resaltar filas de "mi parroquia"
- [ ] Deshabilitar campos sensibles

### Testing
- [ ] Login admin global
- [ ] Login admin local
- [ ] Verificar listados filtrados
- [ ] Probar ediciones (permitidas/bloqueadas)
- [ ] Validar permisos en cada módulo

---

## 💡 Recomendación Final

**Usa la Opción 1 (campo `alcance` en ROL)** porque:

1. ✅ **Menos invasivo**: No requiere duplicar roles
2. ✅ **Flexible**: Fácil agregar más alcances futuro (REGIONAL, etc.)
3. ✅ **Migración simple**: Solo 2 líneas SQL
4. ✅ **Retrocompatible**: Los Administradores existentes se vuelven GLOBAL por defecto

**Prioridad de Implementación:**

1. **Alta**: Parroquias, Usuarios, Reportes (datos sensibles)
2. **Media**: Reservas, Pagos, Documentos (ya tienen filtros parciales)
3. **Baja**: UI/UX (badges, colores, mensajes)

---

**¿Necesitas ayuda implementando algún módulo específico?** 🚀
