-- ================================================================
-- SCRIPT SIMPLIFICADO PARA EJEMPLOS DE PROYECTOS DE INVERSIÓN
-- ================================================================

-- Crear planes institucionales faltantes
INSERT INTO plan_institucional (nombre, descripcion, tipo, periodo_inicio, periodo_fin, estado, institucion_id, creado_por) VALUES
('Plan Estratégico Institucional 2025-2028', 'Plan estratégico para el fortalecimiento institucional', 'ESTRATEGICO', '2025-01-01', '2028-12-31', 'ACTIVO', 1, 1),
('Plan Operativo Anual 2025', 'Plan operativo para la gestión de actividades del año 2025', 'OPERATIVO', '2025-01-01', '2025-12-31', 'ACTIVO', 2, 1),
('Plan de Inversión Pública 2025-2027', 'Plan de inversión en infraestructura', 'INVERSION', '2025-01-01', '2027-12-31', 'ACTIVO', 3, 1);

-- Insertar nuevos proyectos de ejemplo
INSERT INTO proyecto (
    codigo, nombre, descripcion, tipo, fecha_inicio, fecha_fin, duracion_meses,
    presupuesto_total, monto, estado, objetivo_id, responsable_id, supervisor_id,
    prioridad, ubicacion_geografica, beneficiarios_directos, beneficiarios_indirectos,
    institucion_id
) VALUES
(
    'PROY_HOSP_001',
    'Hospital de Tercer Nivel San Juan de Dios',
    'Construcción de hospital de alta complejidad con 300 camas, quirófanos, UCI y equipamiento médico especializado',
    'INVERSION',
    '2025-03-01',
    '2027-12-31',
    34,
    25000000.00,
    25000000.00,
    'Borrador',
    8,
    2,
    3,
    'ALTA',
    'La Paz - Zona Sur',
    500000,
    1500000,
    1
),
(
    'PROY_PARK_002',
    'Parque Industrial Tecnológico Bolivia',
    'Desarrollo de parque industrial tecnológico con centro de I+D, incubadora de startups y zona logística',
    'INVERSION',
    '2025-04-01',
    '2028-03-31',
    36,
    18000000.00,
    18000000.00,
    'Borrador',
    9,
    2,
    1,
    'ALTA',
    'Santa Cruz - Parque Industrial',
    2000,
    25000,
    2
),
(
    'PROY_BRT_003',
    'Sistema BRT Mi Transporte Rápido',
    'Sistema de transporte rápido con 4 líneas, 85 estaciones y 120 buses eléctricos',
    'INVERSION',
    '2025-05-01',
    '2027-04-30',
    24,
    35000000.00,
    35000000.00,
    'Enviado',
    10,
    2,
    3,
    'ALTA',
    'Cochabamba - Área Metropolitana',
    800000,
    1200000,
    3
);

-- Obtener los IDs de los proyectos recién insertados
DO $$
DECLARE
    hosp_id INTEGER;
    park_id INTEGER;
    brt_id INTEGER;
BEGIN
    -- Obtener IDs
    SELECT id INTO hosp_id FROM proyecto WHERE codigo = 'PROY_HOSP_001';
    SELECT id INTO park_id FROM proyecto WHERE codigo = 'PROY_PARK_002';
    SELECT id INTO brt_id FROM proyecto WHERE codigo = 'PROY_BRT_003';
    
    -- Insertar actividades para Hospital
    INSERT INTO actividad (codigo, nombre, descripcion, proyecto_id, responsable, fecha_inicio, fecha_fin, presupuesto, tipo, estado) VALUES
    ('ACT001_HOSP', 'POA - Estudios de Factibilidad', 'Estudios técnicos, económicos y ambientales', hosp_id, 'Consultores Especializados', '2025-03-01', '2025-07-31', 500000.00, 'POA', 'PLANIFICADA'),
    ('ACT002_HOSP', 'POA - Diseño Arquitectónico', 'Planos y especificaciones técnicas', hosp_id, 'Arquitectos Hospitalarios', '2025-05-01', '2025-10-31', 800000.00, 'POA', 'PLANIFICADA'),
    ('ACT003_HOSP', 'INVERSION - Construcción Principal', 'Construcción del edificio principal', hosp_id, 'Constructora Especializada', '2026-01-01', '2026-12-31', 15000000.00, 'INVERSION', 'PLANIFICADA'),
    ('ACT004_HOSP', 'INVERSION - Equipamiento Médico', 'Instalación de equipos médicos', hosp_id, 'Proveedores Médicos', '2027-01-01', '2027-08-31', 6000000.00, 'INVERSION', 'PLANIFICADA'),
    ('ACT005_HOSP', 'POA - Capacitación Personal', 'Capacitación del personal médico', hosp_id, 'Centro de Formación', '2027-07-01', '2027-11-30', 300000.00, 'POA', 'PLANIFICADA');
    
    -- Insertar actividades para Parque Industrial
    INSERT INTO actividad (codigo, nombre, descripcion, proyecto_id, responsable, fecha_inicio, fecha_fin, presupuesto, tipo, estado) VALUES
    ('ACT001_PARK', 'POA - Masterplan', 'Plan maestro y zonificación', park_id, 'Consultores Industriales', '2025-04-01', '2025-08-31', 400000.00, 'POA', 'PLANIFICADA'),
    ('ACT002_PARK', 'INVERSION - Adquisición Terrenos', 'Compra de terrenos y servicios básicos', park_id, 'Administradora de Bienes', '2025-06-01', '2026-03-31', 8000000.00, 'INVERSION', 'PLANIFICADA'),
    ('ACT003_PARK', 'INVERSION - Centro I+D', 'Construcción centro de investigación', park_id, 'Constructora Tecnológica', '2026-01-01', '2027-06-30', 5000000.00, 'INVERSION', 'PLANIFICADA'),
    ('ACT004_PARK', 'POA - Programa Incubación', 'Implementación programa startups', park_id, 'Coordinación Innovación', '2027-08-01', '2028-03-31', 600000.00, 'POA', 'PLANIFICADA');
    
    -- Insertar actividades para BRT
    INSERT INTO actividad (codigo, nombre, descripcion, proyecto_id, responsable, fecha_inicio, fecha_fin, presupuesto, tipo, estado) VALUES
    ('ACT001_BRT', 'POA - Estudios Movilidad', 'Análisis de patrones de movilidad urbana', brt_id, 'Consultores Transporte', '2025-05-01', '2025-09-30', 600000.00, 'POA', 'PLANIFICADA'),
    ('ACT002_BRT', 'INVERSION - Infraestructura Vial', 'Construcción carriles y estaciones', brt_id, 'Consorcio Vial', '2025-08-01', '2026-12-31', 20000000.00, 'INVERSION', 'PLANIFICADA'),
    ('ACT003_BRT', 'INVERSION - Flota Buses', 'Adquisición buses eléctricos', brt_id, 'Consorcio Transporte', '2026-01-01', '2026-10-31', 12000000.00, 'INVERSION', 'PLANIFICADA'),
    ('ACT004_BRT', 'INVERSION - Sistema Control', 'Sistema de control y pago electrónico', brt_id, 'Empresa Tecnología', '2026-08-01', '2027-02-28', 1500000.00, 'INVERSION', 'PLANIFICADA'),
    ('ACT005_BRT', 'POA - Capacitación', 'Capacitación conductores y personal', brt_id, 'Escuela Conductores', '2027-01-01', '2027-04-30', 400000.00, 'POA', 'PLANIFICADA');
    
    -- Insertar presupuestos
    INSERT INTO presupuesto (idpresupuesto, descripcion, monto, tipo, estado, fecha_asignacion, proyecto_id, responsable_id) VALUES
    ('PRES_HOSP_2025', 'Presupuesto Hospital San Juan de Dios', 25000000.00, 'INICIAL', 'APROBADO', '2025-03-01', hosp_id, 2),
    ('PRES_PARK_2025', 'Presupuesto Parque Industrial', 18000000.00, 'INICIAL', 'APROBADO', '2025-04-01', park_id, 2),
    ('PRES_BRT_2025', 'Presupuesto Sistema BRT', 35000000.00, 'INICIAL', 'APROBADO', '2025-05-01', brt_id, 2);
    
END $$;

-- Mostrar resumen de proyectos creados
SELECT 
    '🚀 PROYECTOS CREADOS' as categoria,
    p.codigo,
    p.nombre,
    p.estado,
    'BOB ' || TO_CHAR(p.presupuesto_total, 'FM999,999,999.00') as presupuesto,
    COUNT(a.id) as actividades,
    COUNT(CASE WHEN a.tipo = 'POA' THEN 1 END) as actividades_poa,
    COUNT(CASE WHEN a.tipo = 'INVERSION' THEN 1 END) as actividades_inversion
FROM proyecto p
LEFT JOIN actividad a ON p.id = a.proyecto_id
WHERE p.codigo IN ('PROY_HOSP_001', 'PROY_PARK_002', 'PROY_BRT_003')
GROUP BY p.id, p.codigo, p.nombre, p.estado, p.presupuesto_total
ORDER BY p.codigo;
