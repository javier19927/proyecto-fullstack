-- ================================================================
-- SCRIPT DE AUDITORÍA PARA MÓDULO DE REPORTES
-- Garantiza trazabilidad completa de todas las acciones
-- ================================================================

-- Tabla específica para auditoría del módulo de reportes
CREATE TABLE IF NOT EXISTS auditoria_reportes (
    id SERIAL PRIMARY KEY,
    
    -- Información del usuario
    usuario_id INTEGER REFERENCES usuarios(id),
    usuario_email VARCHAR(255),
    usuario_roles JSONB,
    institucion_id INTEGER REFERENCES instituciones(id),
    
    -- Información de la acción
    accion VARCHAR(100) NOT NULL,
    modulo VARCHAR(50) DEFAULT 'REPORTES',
    tabla VARCHAR(100),
    registro_id VARCHAR(100),
    
    -- Datos de la operación
    datos_anteriores JSONB,
    datos_nuevos JSONB,
    
    -- Información técnica
    ip_address INET,
    user_agent TEXT,
    
    -- Resultado de la operación
    resultado VARCHAR(20) CHECK (resultado IN ('exitoso', 'error')),
    mensaje TEXT,
    
    -- Timestamp
    fecha_accion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Índices para optimizar consultas
    CONSTRAINT chk_accion_reportes CHECK (accion IN (
        'CONSULTAR_REPORTES',
        'FILTRAR_REPORTES', 
        'EXPORTAR_REPORTES',
        'GENERAR_REPORTE_OBJETIVOS',
        'GENERAR_REPORTE_PROYECTOS',
        'VISUALIZAR_RESUMEN_PRESUPUESTARIO',
        'REPORTE_DINAMICO_COMPARATIVO'
    ))
);

-- Tabla para registrar intentos de acceso (seguridad)
CREATE TABLE IF NOT EXISTS auditoria_acceso (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id),
    permiso_requerido VARCHAR(100) NOT NULL,
    accion_solicitada VARCHAR(100) NOT NULL,
    ip_address INET,
    user_agent TEXT,
    fecha_intento TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resultado VARCHAR(20) CHECK (resultado IN ('permitido', 'denegado'))
);

-- Índices para optimizar consultas de auditoría
CREATE INDEX IF NOT EXISTS idx_auditoria_reportes_usuario ON auditoria_reportes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_reportes_fecha ON auditoria_reportes(fecha_accion);
CREATE INDEX IF NOT EXISTS idx_auditoria_reportes_accion ON auditoria_reportes(accion);
CREATE INDEX IF NOT EXISTS idx_auditoria_reportes_institucion ON auditoria_reportes(institucion_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_reportes_resultado ON auditoria_reportes(resultado);

CREATE INDEX IF NOT EXISTS idx_auditoria_acceso_usuario ON auditoria_acceso(usuario_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_acceso_fecha ON auditoria_acceso(fecha_intento);
CREATE INDEX IF NOT EXISTS idx_auditoria_acceso_resultado ON auditoria_acceso(resultado);

-- Vista para estadísticas de auditoría de reportes
CREATE OR REPLACE VIEW vista_estadisticas_auditoria_reportes AS
SELECT 
    ar.accion,
    COUNT(*) as total_acciones,
    COUNT(CASE WHEN ar.resultado = 'exitoso' THEN 1 END) as exitosas,
    COUNT(CASE WHEN ar.resultado = 'error' THEN 1 END) as errores,
    COUNT(DISTINCT ar.usuario_id) as usuarios_unicos,
    COUNT(DISTINCT ar.institucion_id) as instituciones_participantes,
    AVG(CASE WHEN ar.datos_nuevos->>'tiempo_ejecucion_ms' IS NOT NULL 
        THEN CAST(ar.datos_nuevos->>'tiempo_ejecucion_ms' AS NUMERIC) 
        ELSE NULL END) as tiempo_promedio_ms,
    MAX(ar.fecha_accion) as ultima_ejecucion,
    MIN(ar.fecha_accion) as primera_ejecucion
FROM auditoria_reportes ar
WHERE ar.fecha_accion >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY ar.accion
ORDER BY total_acciones DESC;

-- Vista para análisis de usuarios que más consultan reportes
CREATE OR REPLACE VIEW vista_usuarios_reportes AS
SELECT 
    u.id,
    u.nombre,
    u.apellido,
    u.email,
    i.nombre as institucion,
    COUNT(ar.id) as total_consultas,
    COUNT(DISTINCT ar.accion) as tipos_reportes_consultados,
    MAX(ar.fecha_accion) as ultima_consulta,
    COUNT(CASE WHEN ar.resultado = 'error' THEN 1 END) as errores_total
FROM usuarios u
LEFT JOIN auditoria_reportes ar ON u.id = ar.usuario_id
LEFT JOIN instituciones i ON u.id_institucion = i.id
WHERE ar.fecha_accion >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY u.id, u.nombre, u.apellido, u.email, i.nombre
HAVING COUNT(ar.id) > 0
ORDER BY total_consultas DESC;

-- Vista para análisis de seguridad de accesos
CREATE OR REPLACE VIEW vista_analisis_seguridad_reportes AS
SELECT 
    aa.ip_address,
    COUNT(*) as intentos_acceso,
    COUNT(CASE WHEN aa.resultado = 'denegado' THEN 1 END) as accesos_denegados,
    COUNT(DISTINCT aa.usuario_id) as usuarios_distintos,
    COUNT(DISTINCT aa.permiso_requerido) as permisos_solicitados,
    MAX(aa.fecha_intento) as ultimo_intento,
    ROUND(
        COUNT(CASE WHEN aa.resultado = 'denegado' THEN 1 END)::NUMERIC * 100.0 / COUNT(*), 
        2
    ) as porcentaje_denegados
FROM auditoria_acceso aa
WHERE aa.fecha_intento >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY aa.ip_address
HAVING COUNT(*) > 5  -- Solo IPs con más de 5 intentos
ORDER BY accesos_denegados DESC, intentos_acceso DESC;

-- Función para limpiar auditorías antiguas (mantenimiento)
CREATE OR REPLACE FUNCTION limpiar_auditoria_reportes()
RETURNS INTEGER AS $$
DECLARE
    registros_eliminados INTEGER;
BEGIN
    -- Mantener solo los últimos 365 días de auditoría
    DELETE FROM auditoria_reportes 
    WHERE fecha_accion < CURRENT_DATE - INTERVAL '365 days';
    
    GET DIAGNOSTICS registros_eliminados = ROW_COUNT;
    
    -- Mantener solo los últimos 90 días de intentos de acceso
    DELETE FROM auditoria_acceso 
    WHERE fecha_intento < CURRENT_DATE - INTERVAL '90 days';
    
    RETURN registros_eliminados;
END;
$$ LANGUAGE plpgsql;

-- Trigger para validar integridad de datos en auditoría
CREATE OR REPLACE FUNCTION validar_auditoria_reportes()
RETURNS TRIGGER AS $$
BEGIN
    -- Validar que el usuario existe si se proporciona
    IF NEW.usuario_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM usuarios WHERE id = NEW.usuario_id) THEN
            RAISE EXCEPTION 'Usuario con ID % no existe', NEW.usuario_id;
        END IF;
    END IF;
    
    -- Validar que la institución existe si se proporciona
    IF NEW.institucion_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM instituciones WHERE id = NEW.institucion_id) THEN
            RAISE EXCEPTION 'Institución con ID % no existe', NEW.institucion_id;
        END IF;
    END IF;
    
    -- Asegurar que datos_nuevos tenga al menos timestamp
    IF NEW.datos_nuevos IS NULL OR NOT (NEW.datos_nuevos ? 'timestamp') THEN
        NEW.datos_nuevos = COALESCE(NEW.datos_nuevos, '{}'::jsonb) || 
                          jsonb_build_object('timestamp', NOW()::text);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger
DROP TRIGGER IF EXISTS trigger_validar_auditoria_reportes ON auditoria_reportes;
CREATE TRIGGER trigger_validar_auditoria_reportes
    BEFORE INSERT ON auditoria_reportes
    FOR EACH ROW
    EXECUTE FUNCTION validar_auditoria_reportes();

-- Comentarios para documentación
COMMENT ON TABLE auditoria_reportes IS 'Auditoría específica del módulo de reportes para garantizar trazabilidad completa';
COMMENT ON TABLE auditoria_acceso IS 'Registro de intentos de acceso para análisis de seguridad';
COMMENT ON VIEW vista_estadisticas_auditoria_reportes IS 'Estadísticas de uso del módulo de reportes';
COMMENT ON VIEW vista_usuarios_reportes IS 'Análisis de usuarios que consultan reportes';
COMMENT ON VIEW vista_analisis_seguridad_reportes IS 'Análisis de seguridad de accesos al módulo';
COMMENT ON FUNCTION limpiar_auditoria_reportes() IS 'Función de mantenimiento para limpiar auditorías antiguas';

-- Insertar datos de ejemplo para testing (opcional)
INSERT INTO auditoria_reportes (
    usuario_id, usuario_email, usuario_roles, accion, 
    datos_nuevos, resultado, mensaje
) VALUES (
    1, 'admin@sistema.com', '["ADMIN"]', 'CONSULTAR_REPORTES',
    '{"timestamp": "2025-01-01T00:00:00Z", "test": true}',
    'exitoso', 'Configuración inicial del sistema de auditoría'
) ON CONFLICT DO NOTHING;

COMMIT;
