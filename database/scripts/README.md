# 📊 Database Scripts - Guía de Ejecución

Este directorio contiene todos los scripts SQL necesarios para configurar y mantener la base de datos del proyecto Bufala Bella.

## 📋 Scripts Disponibles

### Tablas Principales

| Script                                    | Propósito                                    | Estado        |
| ----------------------------------------- | -------------------------------------------- | ------------- |
| `crear_tabla_historial_correos.sql`       | Historial de correos, plantillas, documentos | ✅ Producción |
| `crear_tabla_correos_cuentas.sql`         | Configuración de cuentas SMTP                | ✅ Producción |
| `crear_tabla_configuraciones_sistema.sql` | Configuraciones globales del sistema         | ✅ Producción |
| `create_costos_transporte_diario.sql`     | Costos de transporte diarios                 | ✅ Producción |

## 🚀 Cómo Ejecutar los Scripts

### Opción 1: phpMyAdmin (Recomendado para principiantes)

```
1. Abre phpMyAdmin: http://localhost/phpmyadmin
2. Selecciona tu base de datos (ej: DiBufala)
3. Pestaña: "Importar"
4. Busca y selecciona el script SQL
5. Haz clic en "Continuar"
6. Espera mensaje: "La importación se ha completado exitosamente"
```

### Opción 2: Línea de Comandos (MySQL CLI)

```bash
# Conectar a MySQL
mysql -u tu_usuario -p

# Seleccionar base de datos
USE tu_base_de_datos;

# Ejecutar script
source /ruta/al/script.sql;

# O en una línea:
mysql -u tu_usuario -p tu_base_de_datos < /ruta/al/script.sql
```

### Opción 3: Comando One-Liner

```bash
mysql -h localhost -u root -p tu_base_de_datos < crear_tabla_historial_correos.sql
```

## ✅ Verificación Después de Ejecutar

Después de ejecutar cada script, verifica que se creó correctamente:

```sql
-- Ver todas las tablas
SHOW TABLES;

-- Ver estructura de una tabla
DESCRIBE correos_enviados;

-- Ver datos (debe estar vacío al principio)
SELECT COUNT(*) FROM correos_enviados;

-- Ver si las vistas existen
SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_TYPE='VIEW' AND TABLE_SCHEMA='tu_base_de_datos';
```

## 🔄 Orden de Ejecución Recomendado

Si es primera vez configurando, ejecuta en este orden:

1. **crear_tabla_configuraciones_sistema.sql**
   - Carga configuraciones globales
   - Necesario para otros scripts

2. **crear_tabla_correos_cuentas.sql**
   - Configura cuentas SMTP
   - Necesario antes de usar correos

3. **crear_tabla_historial_correos.sql**
   - Sistema de correos (plantillas, documentos, historial)
   - Depende de configuraciones previas

4. **create_costos_transporte_diario.sql**
   - Costos de transporte
   - Independiente de otros

## 📊 Información de las Tablas Principales

### correos_enviados

```
Propósito: Historial de todos los correos enviados
Campos principales:
  - id: ID único
  - modulo: Módulo que envió (facturacion, pedidos, consolidacion)
  - referencia_numero: Número legible (FEX-001234)
  - destinatarios_lista: JSON con emails
  - estado: enviado, fallido, pendiente
  - fecha_envio: Timestamp del envío
  - usuario_nombre: Quién envió
```

### correos_enviados (Vistas)

```
vw_correos_resumen: Resumen para listados
vw_estadisticas_correos: Estadísticas por módulo
```

### plantillas_correos_modulos

```
Propósito: Plantillas de correos reutilizables
Soporta: Variables {{variable}} en asunto y cuerpo
Módulos: facturacion, pedidos, consolidacion
```

### documentos_adjuntables

```
Propósito: Catálogo de documentos por módulo
Campos:
  - codigo_documento: Identificador (factura, carta-policia, etc)
  - generador_funcion: Función que lo genera
  - es_obligatorio: Si debe estar siempre
```

## 🆘 Problemas Comunes

### "Error 1064: You have an error in your SQL syntax"

- El archivo tiene errores de sintaxis
- Verifica que es un archivo SQL válido
- Intenta ejecutar solo una parte del script

### "Error 1046: No database selected"

- Necesitas seleccionar la base de datos primero
- En phpMyAdmin: asegúrate de seleccionar la BD
- En CLI: incluye `-D nombre_base_datos`

### "Table already exists"

- La tabla ya existe (puede ser de una ejecución anterior)
- El script usa `CREATE TABLE IF NOT EXISTS` así que debería ignorarse
- Si hay conflicto, puedes eliminar primero: `DROP TABLE nombre;`

### "Permission denied"

- Tu usuario no tiene permisos suficientes
- Asegúrate de tener permisos CREATE, ALTER, INSERT

## 🔐 Respaldo y Seguridad

### Hacer Backup de la BD

```bash
# Exportar toda la base de datos
mysqldump -u usuario -p tu_base_de_datos > backup_fecha.sql

# Restaurar desde backup
mysql -u usuario -p tu_base_de_datos < backup_fecha.sql
```

### Mejores Prácticas

```
✅ Hacer backup ANTES de cambios importantes
✅ Probar scripts en ambiente de desarrollo primero
✅ Ejecutar scripts en horarios de bajo uso
✅ Verificar datos después de cada script
✅ Mantener historial de cambios
```

## 📝 Cómo Crear un Nuevo Script

Si necesitas agregar tablas nuevas:

```sql
-- Crear tabla con estructura completa
CREATE TABLE IF NOT EXISTS mi_tabla (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_nombre (nombre),
    UNIQUE KEY uk_nombre (nombre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Agregar comentarios
ALTER TABLE mi_tabla COMMENT = 'Descripción de qué es';
ALTER TABLE mi_tabla MODIFY COLUMN nombre VARCHAR(100) COMMENT 'Qué es este campo';

-- Crear vista si es necesario
CREATE OR REPLACE VIEW vw_mi_tabla AS
SELECT id, nombre FROM mi_tabla WHERE activo = 1;
```

Luego:

1. Guarda como `crear_tabla_mi_tabla.sql`
2. Prueba en desarrollo
3. Documenta en este README
4. Commit a git con mensaje descriptivo

## 🔗 Enlaces Útiles

- [MySQL Documentation](https://dev.mysql.com/doc/)
- [phpMyAdmin](https://www.phpmyadmin.net/)
- [SQL Best Practices](https://use-the-index-luke.com/)

## 📞 Soporte

Si tienes problemas:

1. Revisa este README
2. Mira el archivo del script en cuestión
3. Consulta logs de MySQL
4. Verifica permisos de usuario en BD

---

**Última actualización:** 16 de Abril de 2026  
**Responsable:** Equipo de Desarrollo  
**Próxima revisión:** Cuando agregues nuevos scripts
