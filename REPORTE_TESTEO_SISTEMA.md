# 🔍 REPORTE COMPLETO DE TESTEO DEL SISTEMA

**Fecha:** 3 de diciembre de 2025  
**Proyecto:** Sistema de Reservas Litúrgicas - LitBook  
**Rama:** joss_v5

---

## 📋 RESUMEN EJECUTIVO

Se realizó un análisis exhaustivo del sistema encontrando **38 problemas** clasificados por severidad:

- **🔴 CRÍTICO** (10): Requieren corrección inmediata
- **🟠 ALTO** (7): Deben corregirse pronto
- **🟡 MEDIO** (6): Mejoras importantes
- **🟢 BAJO** (15): Optimizaciones recomendadas

---

## 🔴 PROBLEMAS CRÍTICOS

### 1. Archivos Duplicados con Typos
**Ubicación:** `app/documento_requisito/`

Existen archivos duplicados:
- ❌ `controlador_documento_requisisto.py` (typo)
- ✅ `controlador_documento_requisito.py` (correcto)
- ❌ `routes_documento_requisisto.py` (typo)
- ✅ `route_documento_requisito.py` (correcto)

**Impacto:** Confusión, duplicación de código, errores de importación

**Solución:** Eliminar archivos con typo, consolidar funcionalidad

---

### 2. Contraseñas en Texto Plano 🚨🚨🚨
**Ubicación:** `app/auth/controlador_auth.py:83`

```python
if clave_db != clave_ingresada or not estado_cuenta:
```

**Problema:** Las contraseñas NO están hasheadas, se almacenan en texto plano.

**Riesgos:**
- Exposición total de contraseñas si hay breach
- Violación de OWASP, GDPR, estándares de seguridad
- Responsabilidad legal en caso de filtración

**Solución:** Implementar bcrypt/argon2

```python
import bcrypt

# Al registrar:
hashed = bcrypt.hashpw(clave.encode('utf-8'), bcrypt.gensalt())

# Al autenticar:
if bcrypt.checkpw(clave_ingresada.encode('utf-8'), clave_db.encode('utf-8')):
```

---

### 3. SECRET_KEY Hardcodeada
**Ubicación:** `app/__init__.py:58`

```python
app.config['SECRET_KEY'] = 'clave-super-segura-y-fija-123'
```

**Problema:** Clave secreta expuesta en código fuente

**Impacto:** Compromete sesiones, CSRF tokens, cookies firmadas

**Solución:**
```python
# .env
SECRET_KEY=tu_clave_secreta_generada_aleatoriamente_aqui

# app/__init__.py
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'fallback-only-dev')
```

---

### 4. Sin ON DELETE CASCADE en Foreign Keys
**Ubicación:** `bd_sistema.sql`

**Problema:** Ninguna FK tiene cascada definida

**Impacto:**
- No se pueden eliminar registros padre
- Registros huérfanos en BD
- Errores de integridad referencial

**Solución:**
```sql
ALTER TABLE FELIGRES
DROP FOREIGN KEY fk_feligres_usuario;

ALTER TABLE FELIGRES
ADD CONSTRAINT fk_feligres_usuario 
FOREIGN KEY (idUsuario) REFERENCES USUARIO(idUsuario)
ON DELETE CASCADE ON UPDATE CASCADE;
```

---

### 5. Inconsistencia en Estados de Requisito
**Ubicación:** `bd_sistema.sql` vs código

**Problema:**
- BD: `estadoRequisito BOOLEAN NOT NULL`
- Código: `WHERE r.estadoRequisito = 'ACTIVO'`

**Impacto:** Las consultas NUNCA retornan resultados (comparación BOOLEAN vs STRING)

**Solución:** Cambiar BD a VARCHAR(20) o usar 1/0 en código

---

### 6. Nombre de Base de Datos Inconsistente
**Ubicación:** `example.env.txt` vs uso real

```env
DB_NAME=bd_reserva
```

**Problema:** Probablemente la BD real se llama `bd_reserva_litbook`

**Solución:** Sincronizar nombres en documentación y archivo .env

---

### 7. Typo en requirements.txt
**Ubicación:** Raíz del proyecto

**Problema:** Archivo se llama `requeriments.txt` (typo)

**Impacto:** `pip install -r requirements.txt` falla

**Solución:** Renombrar archivo

---

### 8. Falta Validación de idParroquia NULL
**Ubicación:** `app/auth/controlador_auth.py`

**Problema:** No se valida si usuario personal/secretaria tiene parroquia asignada

**Impacto:** Errores en todas las operaciones que filtran por parroquia

**Solución:** Validar en registro y asignación de cargo

---

### 9. Códigos de Recuperación en Memoria
**Ubicación:** `app/auth/route_auth.py:12`

```python
codigos_recuperacion = {}  # ❌ Diccionario en memoria
```

**Problema:**
- Se pierden al reiniciar servidor
- Sin expiración
- Vulnerables a fuerza bruta
- No válido para producción

**Solución:** Redis con TTL o tabla BD con timestamp

---

### 10. Sin Validación de Permisos en API
**Ubicación:** Todos los blueprints

**Problema:** `@requires_roles` solo en frontend, NO en API

**Ejemplo:**
```python
# ✅ Protegido
@app.route('/admi/pago')
@requires_roles('Administrador')

# ❌ NO protegido
@pago_bp.route('/', methods=['GET'])
def listar():
    # Cualquiera puede acceder
```

**Riesgo:** Bypass de seguridad accediendo directamente a endpoints

**Solución:** Decorador en todas las rutas API

---

## 🟠 PROBLEMAS DE ALTA PRIORIDAD

### 11. Inconsistencia en Estados de Reserva
**Ubicación:** Todo el sistema

**Estados encontrados:**
- `PENDIENTE_PAGO`
- `PENDIENTE_DOCUMENTO`
- `PENDIENTE_REVISION`
- `CONFIRMADO`
- `ATENDIDO`
- `CANCELADO` / `CANCELADA` ← Inconsistencia
- `RECHAZADO` / `RECHAZADA` ← Inconsistencia
- `RESERVA_PARROQUIA`

**Solución:** Crear ENUM o tabla de catálogo

```sql
ALTER TABLE RESERVA 
MODIFY estadoReserva ENUM(
    'PENDIENTE_PAGO',
    'PENDIENTE_DOCUMENTO', 
    'PENDIENTE_REVISION',
    'CONFIRMADO',
    'ATENDIDO',
    'CANCELADA',
    'RECHAZADA',
    'RESERVA_PARROQUIA'
) NOT NULL;
```

---

### 12. Sin Validación de Duplicados en PAGO_RESERVA
**Ubicación:** `app/pago/controlador_pago.py`

```python
def registrar_pago_reserva(idPago, idReserva, monto):
    # ❌ No valida si ya existe
    cursor.execute(
        """INSERT INTO pago_reserva (idPago, idReserva, montoReserva)
        VALUES (%s, %s, %s)""",
        (idPago, idReserva, monto)
    )
```

**Impacto:** Error de constraint UNIQUE si se paga dos veces

**Solución:**
```python
# Validar existencia
cursor.execute(
    "SELECT idPago FROM pago_reserva WHERE idReserva = %s",
    (idReserva,)
)
if cursor.fetchone():
    return {'ok': False, 'mensaje': 'Esta reserva ya tiene un pago registrado'}
```

---

### 13. Falta Manejo de Transacciones
**Ubicación:** Múltiples controladores

**Problema:** Operaciones multi-insert sin transacción explícita

**Ejemplo en `registrar_feligres`:**
```python
# Si falla paso 2 o 3, queda usuario sin perfil
cursor.execute(...)  # 1. INSERT usuario
cursor.execute(...)  # 2. INSERT feligres
cursor.execute(...)  # 3. INSERT rol_usuario
conexion.commit()    # Solo 1 commit al final
```

**Solución:**
```python
try:
    with conexion.cursor() as cursor:
        cursor.execute(...)  # 1
        cursor.execute(...)  # 2
        cursor.execute(...)  # 3
    conexion.commit()
except Exception as e:
    conexion.rollback()  # ✅ Rollback explícito
    raise
```

---

### 14. Datos Sensibles en Sesión
**Ubicación:** `app/auth/route_auth.py`

**Problema:** Muchos datos en cookies firmadas (legibles por cliente):
```python
session['idUsuario'] = resultado_auth['idUsuario']
session['email'] = resultado_auth['email']
session['idFeligres'] = resultado_auth.get('idFeligres')
session['idPersonal'] = resultado_auth.get('idPersonal')
session['idParroquia'] = resultado_auth.get('idParroquia')
```

**Solución:** Solo `idUsuario` en sesión, resto desde BD

---

### 15. Sin Paginación en Listados
**Ubicación:** Múltiples endpoints

- `/api/documento_requisito/listar_todos` → Sin límite
- `/api/reserva/listar` → Sin paginación
- `/api/usuario/feligres` → Carga todos

**Solución:**
```python
page = request.args.get('page', 1, type=int)
per_page = request.args.get('per_page', 20, type=int)
offset = (page - 1) * per_page

cursor.execute(
    "SELECT ... FROM reserva LIMIT %s OFFSET %s",
    (per_page, offset)
)
```

---

### 16. Validación de Horarios Solo para Actos con Requisitos
**Ubicación:** `app/reserva/controlador_reserva.py`

**Problema:** Las MISAS se excluyen completamente de bloqueo de horarios

```python
AND (al.nombActo IS NULL OR LOWER(al.nombActo) NOT LIKE '%%misa%%')
```

**Impacto:** Puede confundir a usuarios (múltiples misas a misma hora)

**Solución:** Mostrar con indicador visual diferente

---

### 17. Sin Validación de Vigencia de Documentos
**Ubicación:** `app/documento_requisito/`

**Problema:** Campo `vigenciaDocumento` existe pero no se valida:
- No se verifica vencimiento antes de aprobar
- No hay notificaciones de próximo vencimiento
- No se rechazan automáticamente documentos vencidos

**Solución:**
```python
def aprobar_documento(datos):
    vigencia = datos.get('vigenciaDocumento')
    if vigencia and vigencia < datetime.now().date():
        return False, "El documento está vencido"
```

---

## 🟡 PROBLEMAS DE PRIORIDAD MEDIA

### 18. Faltan Índices en BD
**Ubicación:** `bd_sistema.sql`

**Columnas sin índice usadas frecuentemente:**
- `RESERVA.f_reserva` (consultas por fecha)
- `RESERVA.estadoReserva` (filtros)
- `DOCUMENTO_REQUISITO.idReserva` (JOINs)
- `PAGO_RESERVA.idReserva` (JOINs)

**Solución:**
```sql
CREATE INDEX idx_reserva_fecha ON RESERVA(f_reserva);
CREATE INDEX idx_reserva_estado ON RESERVA(estadoReserva);
CREATE INDEX idx_reserva_parroquia_fecha ON RESERVA(idParroquia, f_reserva);
CREATE INDEX idx_doc_reserva ON DOCUMENTO_REQUISITO(idReserva);
CREATE INDEX idx_pago_reserva ON PAGO_RESERVA(idReserva);
```

---

### 19. Sin Validación de Tipos en Endpoints
**Ubicación:** Todas las rutas

```python
@pago_bp.route('/registrar', methods=['POST'])
def registrar():
    data = request.get_json()
    # ❌ No valida tipos
    monto = data.get('montoTotal')  # ¿Es numérico? ¿Positivo?
```

**Solución:** Usar Marshmallow o Pydantic

---

### 20. Consultas SQL Concatenadas
**Ubicación:** Varios controladores

```python
sql_res = "SELECT ... FROM RESERVA res ..."
if rol_seguro != 'administrador':
    sql_res += " WHERE per.idUsuario = %s"
```

**Riesgo:** Propenso a errores, difícil de mantener

**Solución:** ORM (SQLAlchemy) o Query Builder

---

### 21. Sin Logging Estructurado
**Ubicación:** Todo el proyecto

```python
except Exception as e:
    print(f'Error al registrar pago: {e}')  # ❌
```

**Solución:**
```python
import logging

logger = logging.getLogger(__name__)

try:
    ...
except Exception as e:
    logger.error(f'Error al registrar pago: {e}', exc_info=True)
```

---

### 22. Sin Manejo de Zona Horaria
**Ubicación:** `app/pago/controlador_pago.py`

```python
f_pago = datetime.now()  # ❌ Hora del servidor
```

**Solución:**
```python
from datetime import timezone
f_pago = datetime.now(timezone.utc)
```

---

### 23. Sin Validación Frontend
**Ubicación:** Formularios JavaScript

**Problemas:**
- Emails sin validación de formato
- Teléfonos sin formato
- Fechas futuras en nacimiento

**Solución:** Validación JavaScript + backend

---

## 🟢 MEJORAS RECOMENDADAS

### 24. Renombrar Variables con Typos
- `apePaFel` → `apePatFel` (inconsistente en parámetros)
- `logParroquia` → `lonParroquia` (longitude)

### 25. Separar Lógica de Negocio
Rutas con demasiada lógica, mover a servicios/controladores

### 26. Comentar SQL Complejo
Consultas como `validar_horario_disponible` necesitan comentarios

### 27. Unificar Formato de Respuestas
```python
# A veces:
{"success": true, "datos": [...]}

# A veces:
{"ok": true, "mensaje": "..."}
```

### 28. Agregar Tests Unitarios
- `validar_horario_disponible()`
- `registrar_pago()`
- `autenticar_usuario()`

### 29. Documentar API (Swagger)

### 30. Optimizar Queries N+1
```python
for reserva in reservas:
    docs = obtener_documentos_reserva(reserva['id'])  # ❌ N+1
```

### 31. Rate Limiting en Login

### 32. Configurar CORS

### 33. Health Check Endpoint
```python
@app.route('/health')
def health():
    return jsonify({"status": "ok"})
```

### 34. Optimizar FullCalendar
Cargar solo mes visible, no todos los eventos

### 35. Compresión Gzip

### 36. Implementar Caché
Para parroquias, actos litúrgicos, tipos documento

### 37. CSRF Tokens (Flask-WTF)

### 38. Backup Automático BD

---

## 📊 RESUMEN DE HALLAZGOS

| Severidad | Cantidad | Acción |
|-----------|----------|--------|
| 🔴 Crítico | 10 | Corregir INMEDIATAMENTE |
| 🟠 Alto | 7 | Próxima iteración |
| 🟡 Medio | 6 | Sprint futuro |
| 🟢 Bajo | 15 | Backlog |

---

## 🎯 PLAN DE ACCIÓN

### FASE 1: Seguridad (1-2 días)
- [ ] Hash de contraseñas (bcrypt)
- [ ] SECRET_KEY en .env
- [ ] Validación de permisos en API
- [ ] Expiración de códigos recuperación

### FASE 2: Corrección de Datos (1 día)
- [ ] Eliminar archivos duplicados
- [ ] Corregir estadoRequisito
- [ ] Renombrar requeriments.txt
- [ ] Unificar estados CANCELADO/CANCELADA

### FASE 3: Integridad (2 días)
- [ ] ON DELETE CASCADE
- [ ] Transacciones con rollback
- [ ] Validación duplicados PAGO_RESERVA
- [ ] Índices en BD

### FASE 4: Validaciones Reservas y Pagos (2-3 días) ⭐ PRIORITARIO
- [ ] Validar monto pago > 0
- [ ] Validar fecha reserva no en pasado
- [ ] Validar horario dentro de disponibilidad
- [ ] Validar estado de pago antes de confirmar reserva
- [ ] Validar documentos aprobados antes de confirmar
- [ ] Prevenir doble pago misma reserva
- [ ] Validar método de pago válido
- [ ] Actualizar estado reserva según flujo pago
- [ ] Validar vigencia documentos
- [ ] Prevenir reservas en horarios bloqueados

---

## ✅ CONCLUSIÓN

**Fortalezas del Sistema:**
- ✅ Arquitectura modular clara
- ✅ Separación frontend/backend
- ✅ Uso de parámetros SQL (previene injection)
- ✅ Manejo de sesiones Flask

**Áreas Críticas:**
- ❌ Seguridad (contraseñas, SECRET_KEY)
- ❌ Validaciones de reservas y pagos
- ❌ Integridad referencial
- ❌ Manejo de errores

**Recomendación:** Corregir problemas críticos antes de producción.

---

**Generado:** 3 de diciembre de 2025  
**Autor:** Análisis Automático GitHub Copilot
