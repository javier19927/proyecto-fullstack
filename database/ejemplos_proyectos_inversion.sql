-- ================================================================
-- EJEMPLOS ADICIONALES DE PROYECTOS DE INVERSIÓN
-- Con actividades POA e inversión detalladas
-- ================================================================

-- ================================================================
-- CREAR PLANES INSTITUCIONALES FALTANTES
-- ================================================================

INSERT INTO plan_institucional (nombre, descripcion, tipo, periodo_inicio, periodo_fin, estado, institucion_id, creado_por) VALUES
('Plan Estratégico Institucional 2025-2028', 'Plan estratégico para el fortalecimiento institucional y desarrollo de proyectos de inversión', 'ESTRATEGICO', '2025-01-01', '2028-12-31', 'ACTIVO', 1, 1),
('Plan Operativo Anual 2025', 'Plan operativo para la gestión de actividades y proyectos del año 2025', 'OPERATIVO', '2025-01-01', '2025-12-31', 'ACTIVO', 2, 1),
('Plan de Inversión Pública 2025-2027', 'Plan de inversión en infraestructura y desarrollo social', 'INVERSION', '2025-01-01', '2027-12-31', 'ACTIVO', 3, 1);

-- ================================================================
-- PROYECTOS DE INVERSIÓN - EJEMPLOS COMPLETOS
-- ================================================================

-- Insertar nuevos proyectos de inversión
INSERT INTO proyecto (
    codigo, nombre, descripcion, tipo, fecha_inicio, fecha_fin, duracion_meses,
    presupuesto_total, monto, estado, objetivo_id, responsable_id, supervisor_id,
    prioridad, ubicacion_geografica, beneficiarios_directos, beneficiarios_indirectos,
    institucion_id
) VALUES
-- Proyecto 1: Hospital de Tercer Nivel
(
    'PROY_HOSP_001',
    'Construcción Hospital de Tercer Nivel "San Juan de Dios"',
    'Construcción de un hospital de alta complejidad con 300 camas, 8 quirófanos, UCI, servicios de emergencia, laboratorios especializados, farmacia hospitalaria, y equipamiento médico de última generación. Incluye sistema de información hospitalaria integrado y helipuerto para emergencias.',
    'INVERSION',
    '2025-03-01',
    '2027-12-31',
    34,
    25000000.00,
    25000000.00,
    'Borrador',
    8, -- Objetivo de salud existente
    2, -- planificador@test.com
    3, -- revisor@test.com como supervisor
    'ALTA',
    'La Paz - Zona Sur, Distrito 14',
    500000, -- habitantes beneficiarios directos
    1500000, -- beneficiarios indirectos
    1
),

-- Proyecto 2: Parque Industrial Tecnológico
(
    'PROY_PARK_002',
    'Parque Industrial Tecnológico "Innovación Bolivia"',
    'Desarrollo de un parque industrial especializado en tecnología con 50 hectáreas, que incluye: zona de manufactura tecnológica, centro de investigación y desarrollo, incubadora de startups, centro de capacitación técnica, laboratorios de innovación, y zona de servicios logísticos.',
    'INVERSION',
    '2025-04-01',
    '2028-03-31',
    36,
    18000000.00,
    18000000.00,
    'Borrador',
    9, -- Objetivo de desarrollo económico existente
    2, -- planificador@test.com
    1, -- admin@test.com como supervisor
    'ALTA',
    'Santa Cruz - Parque Industrial',
    2000, -- empresas y trabajadores directos
    25000, -- beneficiarios indirectos
    2
),

-- Proyecto 3: Sistema de Transporte Masivo BRT
(
    'PROY_BRT_003',
    'Sistema BRT "Mi Transporte Rápido"',
    'Implementación de sistema de transporte rápido por autobús (BRT) con 4 líneas principales, 85 estaciones, 120 buses articulados eléctricos, sistema de pago electrónico, carriles exclusivos, puentes peatonales, y centro de control inteligente de tráfico.',
    'INVERSION',
    '2025-05-01',
    '2027-04-30',
    24,
    35000000.00,
    35000000.00,
    'Enviado',
    10, -- Objetivo de infraestructura existente
    2, -- planificador@test.com
    3, -- revisor@test.com como supervisor
    'ALTA',
    'Cochabamba - Área Metropolitana',
    800000, -- usuarios diarios
    1200000, -- beneficiarios indirectos
    3
),

-- Proyecto 4: Centro de Datos Nacional
(
    'PROY_DATA_004',
    'Centro de Datos Nacional "Bolivia Digital"',
    'Construcción del centro de datos más moderno del país con capacidad para 1000 servidores, sistemas de refrigeración eficientes, energía renovable, conectividad internacional, sistemas de backup, seguridad física y ciberseguridad avanzada. Incluye servicios de cloud computing gubernamental.',
    'INVERSION',
    '2025-06-01',
    '2026-12-31',
    19,
    8500000.00,
    8500000.00,
    'Borrador',
    9, -- Objetivo tecnológico existente
    2, -- planificador@test.com
    1, -- admin@test.com como supervisor
    'MEDIA',
    'La Paz - Zona Industrial Senkata',
    200, -- técnicos y administradores
    2000000, -- ciudadanos usuarios de servicios digitales
    1
),

-- Proyecto 5: Programa de Vivienda Social
(
    'PROY_VIV_005',
    'Programa Nacional de Vivienda Social "Mi Casa Digna"',
    'Construcción de 5000 viviendas sociales distribuidas en 10 departamentos, con servicios básicos completos (agua, luz, gas, internet), áreas verdes, centros comunitarios, escuelas, centros de salud, y transporte público accesible.',
    'INVERSION',
    '2025-07-01',
    '2028-06-30',
    36,
    45000000.00,
    45000000.00,
    'Borrador',
    11, -- Objetivo de vivienda existente
    2, -- planificador@test.com
    3, -- revisor@test.com como supervisor
    'ALTA',
    'Nacional - 10 Departamentos',
    25000, -- familias beneficiarias directas
    125000, -- beneficiarios indirectos
    4
);

-- ================================================================
-- ACTIVIDADES DETALLADAS PARA CADA PROYECTO
-- ================================================================

-- ACTIVIDADES PARA PROYECTO HOSPITAL (ID: 6 asumiendo)
INSERT INTO actividad (
    codigo, nombre, descripcion, proyecto_id, responsable, fecha_inicio, fecha_fin,
    fecha_inicio_planificada, fecha_fin_planificada, presupuesto, tipo, estado, porcentaje_avance
) VALUES
-- Hospital - Fase 1: Planificación y Diseño
('ACT001_HOSP', 'POA - Estudios de Factibilidad y Impacto Ambiental', 'Realización de estudios técnicos, económicos, ambientales y sociales. Incluye análisis de demanda médica, estudio de suelos, evaluación de impacto ambiental y obtención de licencias ambientales.', 6, 'Consultores Especializados en Salud', '2025-03-01', '2025-07-31', '2025-03-01', '2025-07-31', 500000.00, 'POA', 'PLANIFICADA', 0),

('ACT002_HOSP', 'POA - Diseño Arquitectónico y Especificaciones Médicas', 'Desarrollo de planos arquitectónicos especializados para hospital, diseño de sistemas médicos, especificaciones técnicas de equipamiento médico y sistemas de gases medicinales.', 6, 'Arquitectos Hospitalarios', '2025-05-01', '2025-10-31', '2025-05-01', '2025-10-31', 800000.00, 'POA', 'PLANIFICADA', 0),

('ACT003_HOSP', 'INVERSIÓN - Proceso de Licitación Pública Internacional', 'Gestión completa del proceso licitatorio para construcción y equipamiento médico. Incluye convocatorias internacionales, evaluación de propuestas y adjudicación de contratos.', 6, 'Comité de Contrataciones Médicas', '2025-08-01', '2025-12-31', '2025-08-01', '2025-12-31', 200000.00, 'INVERSION', 'PLANIFICADA', 0),

-- Hospital - Fase 2: Construcción
('ACT004_HOSP', 'INVERSIÓN - Construcción de Estructura Principal', 'Construcción del edificio principal del hospital con 8 plantas, incluyendo cimientos especiales, estructura antisísmica, instalaciones eléctricas hospitalarias y sistemas de climatización.', 6, 'Constructora Especializada en Hospitales', '2026-01-01', '2026-12-31', '2026-01-01', '2026-12-31', 15000000.00, 'INVERSION', 'PLANIFICADA', 0),

('ACT005_HOSP', 'INVERSIÓN - Instalación de Equipamiento Médico', 'Instalación y configuración de equipamiento médico de alta complejidad: resonancia magnética, tomógrafos, equipos de diálisis, incubadoras, equipos de quirófano y laboratorio.', 6, 'Proveedores de Tecnología Médica', '2027-01-01', '2027-08-31', '2027-01-01', '2027-08-31', 6000000.00, 'INVERSION', 'PLANIFICADA', 0),

-- Hospital - Fase 3: Puesta en Marcha
('ACT006_HOSP', 'POA - Capacitación del Personal Médico', 'Programa integral de capacitación para 400 profesionales de salud en uso de equipamiento especializado, protocolos hospitalarios y sistemas de información médica.', 6, 'Centro de Formación Médica Continua', '2027-07-01', '2027-11-30', '2027-07-01', '2027-11-30', 300000.00, 'POA', 'PLANIFICADA', 0),

('ACT007_HOSP', 'POA - Habilitación y Certificación Sanitaria', 'Proceso de habilitación ante autoridades sanitarias, certificación de calidad hospitalaria, implementación de protocolos de bioseguridad y sistemas de calidad médica.', 6, 'Comité de Calidad Hospitalaria', '2027-10-01', '2027-12-31', '2027-10-01', '2027-12-31', 200000.00, 'POA', 'PLANIFICADA', 0),

-- ACTIVIDADES PARA PARQUE INDUSTRIAL (ID: 7 asumiendo)
-- Parque Industrial - Fase 1: Planificación
('ACT001_PARK', 'POA - Masterplan y Zonificación Especializada', 'Desarrollo del plan maestro del parque industrial tecnológico, zonificación por sectores (manufactura, I+D, servicios), estudios de demanda empresarial y análisis de mercado tecnológico.', 7, 'Consultores en Desarrollo Industrial', '2025-04-01', '2025-08-31', '2025-04-01', '2025-08-31', 400000.00, 'POA', 'PLANIFICADA', 0),

('ACT002_PARK', 'INVERSIÓN - Adquisición de Terrenos y Servicios Básicos', 'Adquisición de 50 hectáreas, saneamiento legal, instalación de servicios básicos (agua, electricidad, gas), construcción de vías de acceso y sistemas de telecomunicaciones.', 7, 'Administradora de Bienes del Estado', '2025-06-01', '2026-03-31', '2025-06-01', '2026-03-31', 8000000.00, 'INVERSION', 'PLANIFICADA', 0),

-- Parque Industrial - Fase 2: Construcción de Infraestructura
('ACT003_PARK', 'INVERSIÓN - Construcción del Centro de I+D', 'Construcción del centro de investigación y desarrollo con laboratorios especializados, salas limpias para manufactura tecnológica, espacios de coworking y auditorio para 300 personas.', 7, 'Constructora de Proyectos Tecnológicos', '2026-01-01', '2027-06-30', '2026-01-01', '2027-06-30', 5000000.00, 'INVERSION', 'PLANIFICADA', 0),

('ACT004_PARK', 'INVERSIÓN - Nave Industrial y Zona Logística', 'Construcción de 10 naves industriales modulares, centro logístico con cámaras frigoríficas, zona de carga y descarga, y sistema de tratamiento de residuos industriales.', 7, 'Empresa de Construcción Industrial', '2026-07-01', '2027-12-31', '2026-07-01', '2027-12-31', 3500000.00, 'INVERSION', 'PLANIFICADA', 0),

-- Parque Industrial - Fase 3: Equipamiento y Operación
('ACT005_PARK', 'POA - Programa de Incubación de Startups', 'Implementación del programa de incubación con mentorías especializadas, acceso a financiamiento, capacitación en innovación y vinculación con mercados internacionales.', 7, 'Coordinación de Innovación Empresarial', '2027-08-01', '2028-03-31', '2027-08-01', '2028-03-31', 600000.00, 'POA', 'PLANIFICADA', 0),

('ACT006_PARK', 'POA - Certificación y Promoción Internacional', 'Obtención de certificaciones internacionales de calidad, participación en ferias tecnológicas, misiones comerciales y programa de atracción de inversión extranjera.', 7, 'Oficina de Promoción de Exportaciones', '2027-10-01', '2028-03-31', '2027-10-01', '2028-03-31', 500000.00, 'POA', 'PLANIFICADA', 0),

-- ACTIVIDADES PARA SISTEMA BRT (ID: 8 asumiendo)
-- BRT - Fase 1: Planificación y Diseño
('ACT001_BRT', 'POA - Estudios de Movilidad y Tráfico', 'Análisis completo de patrones de movilidad urbana, estudios de demanda de transporte, modelamiento de tráfico y definición de rutas óptimas para el sistema BRT.', 8, 'Consultores en Transporte Urbano', '2025-05-01', '2025-09-30', '2025-05-01', '2025-09-30', 600000.00, 'POA', 'PLANIFICADA', 0),

('ACT002_BRT', 'INVERSIÓN - Infraestructura Vial y Estaciones', 'Construcción de carriles exclusivos, 85 estaciones BRT con accesibilidad universal, puentes peatonales, semáforos inteligentes y señalización especializada.', 8, 'Consorcio de Construcción Vial', '2025-08-01', '2026-12-31', '2025-08-01', '2026-12-31', 20000000.00, 'INVERSION', 'PLANIFICADA', 0),

-- BRT - Fase 2: Sistema y Equipamiento
('ACT003_BRT', 'INVERSIÓN - Adquisición de Flota de Buses Eléctricos', 'Compra de 120 buses articulados eléctricos con tecnología europea, estaciones de carga rápida, sistema de mantenimiento especializado y repuestos por 10 años.', 8, 'Consorcio Internacional de Transporte', '2026-01-01', '2026-10-31', '2026-01-01', '2026-10-31', 12000000.00, 'INVERSION', 'PLANIFICADA', 0),

('ACT004_BRT', 'INVERSIÓN - Sistema de Control y Pago Electrónico', 'Implementación del centro de control inteligente, sistema de pago con tarjetas RFID, aplicación móvil para usuarios, GPS en tiempo real y sistema de videovigilancia.', 8, 'Empresa de Tecnología de Transporte', '2026-08-01', '2027-02-28', '2026-08-01', '2027-02-28', 1500000.00, 'INVERSION', 'PLANIFICADA', 0),

-- BRT - Fase 3: Operación
('ACT005_BRT', 'POA - Capacitación de Conductores y Personal', 'Programa de formación para 200 conductores especializados en BRT, personal de mantenimiento, operadores de estaciones y personal administrativo del sistema.', 8, 'Escuela de Conductores Profesionales', '2027-01-01', '2027-04-30', '2027-01-01', '2027-04-30', 400000.00, 'POA', 'PLANIFICADA', 0),

('ACT006_BRT', 'POA - Campaña de Educación Vial Ciudadana', 'Programa masivo de educación vial para usuarios del BRT, campañas publicitarias, talleres comunitarios y sistema de atención al usuario.', 8, 'Dirección de Educación Vial', '2027-02-01', '2027-04-30', '2027-02-01', '2027-04-30', 500000.00, 'POA', 'PLANIFICADA', 0);

-- ================================================================
-- PRESUPUESTOS DETALLADOS PARA LOS NUEVOS PROYECTOS
-- ================================================================

INSERT INTO presupuesto (
    idPresupuesto, descripcion, monto, tipo, estado, fecha_asignacion,
    proyecto_id, responsable_id
) VALUES
-- Presupuestos Hospital
('PRES_HOSP_001', 'Presupuesto Fase 1 - Estudios y Diseños Hospital San Juan de Dios', 1500000.00, 'INICIAL', 'APROBADO', '2025-03-01', 6, 2),
('PRES_HOSP_002', 'Presupuesto Fase 2 - Construcción e Infraestructura', 21000000.00, 'CONSTRUCCION', 'PENDIENTE', '2026-01-01', 6, 2),
('PRES_HOSP_003', 'Presupuesto Fase 3 - Equipamiento y Puesta en Marcha', 2500000.00, 'EQUIPAMIENTO', 'PENDIENTE', '2027-01-01', 6, 2),

-- Presupuestos Parque Industrial
('PRES_PARK_001', 'Presupuesto Inicial - Planificación Parque Industrial Tecnológico', 8900000.00, 'INICIAL', 'APROBADO', '2025-04-01', 7, 2),
('PRES_PARK_002', 'Presupuesto Construcción - Infraestructura Especializada', 8500000.00, 'CONSTRUCCION', 'PENDIENTE', '2026-01-01', 7, 2),
('PRES_PARK_003', 'Presupuesto Operación - Programas de Incubación', 600000.00, 'OPERATIVO', 'PENDIENTE', '2027-08-01', 7, 2),

-- Presupuestos BRT
('PRES_BRT_001', 'Presupuesto Fase 1 - Estudios y Infraestructura Vial', 20600000.00, 'INICIAL', 'APROBADO', '2025-05-01', 8, 2),
('PRES_BRT_002', 'Presupuesto Fase 2 - Flota y Tecnología', 13500000.00, 'EQUIPAMIENTO', 'PENDIENTE', '2026-01-01', 8, 2),
('PRES_BRT_003', 'Presupuesto Fase 3 - Operación y Capacitación', 900000.00, 'OPERATIVO', 'PENDIENTE', '2027-01-01', 8, 2),

-- Presupuestos Centro de Datos
('PRES_DATA_001', 'Presupuesto Completo - Centro de Datos Nacional Bolivia Digital', 8500000.00, 'INICIAL', 'PENDIENTE', '2025-06-01', 9, 2),

-- Presupuestos Vivienda Social
('PRES_VIV_001', 'Presupuesto Total - Programa Nacional Vivienda Social Mi Casa Digna', 45000000.00, 'INICIAL', 'PENDIENTE', '2025-07-01', 10, 2);

-- ================================================================
-- DATOS ADICIONALES DE CONFIGURACIÓN
-- ================================================================

-- Agregar más objetivos específicos si es necesario
INSERT INTO objetivo (
    codigo, descripcion, resultado_esperado, tipo, prioridad, 
    fecha_inicio, fecha_fin, presupuesto_asignado, 
    plan_institucional_id, responsable_id
) VALUES
('OBJ_SALUD_006', 'Fortalecimiento del Sistema de Salud Nacional', 'Incrementar la cobertura de servicios de salud especializados en un 40% y reducir la mortalidad infantil en 25%', 'ESTRATEGICO', 'ALTA', '2025-01-01', '2028-12-31', 30000000.00, 1, 2),
('OBJ_INDUSTRIAL_007', 'Desarrollo del Sector Industrial Tecnológico', 'Crear 50 nuevas empresas tecnológicas y generar 2000 empleos especializados en el sector industrial-tecnológico', 'OPERATIVO', 'ALTA', '2025-01-01', '2028-12-31', 20000000.00, 2, 2),
('OBJ_TRANSPORTE_008', 'Modernización del Transporte Público Urbano', 'Reducir en 30% los tiempos de viaje y mejorar la calidad del aire urbano mediante transporte eléctrico masivo', 'ESTRATEGICO', 'ALTA', '2025-01-01', '2027-12-31', 40000000.00, 3, 2);

-- ================================================================
-- REPORTES Y VERIFICACIONES
-- ================================================================

-- Mostrar resumen de nuevos proyectos creados
SELECT 
    '🚀 NUEVOS PROYECTOS DE INVERSIÓN CREADOS' as categoria,
    codigo,
    nombre,
    estado,
    'BOB ' || TO_CHAR(presupuesto_total, 'FM999,999,999.00') as presupuesto_total,
    fecha_inicio,
    fecha_fin,
    duracion_meses || ' meses' as duracion,
    beneficiarios_directos || ' directos / ' || beneficiarios_indirectos || ' indirectos' as beneficiarios
FROM proyecto 
WHERE codigo IN ('PROY_HOSP_001', 'PROY_PARK_002', 'PROY_BRT_003', 'PROY_DATA_004', 'PROY_VIV_005')
ORDER BY codigo;

-- Mostrar actividades por tipo (POA vs INVERSIÓN)
SELECT 
    '📋 ACTIVIDADES POR TIPO' as categoria,
    tipo,
    COUNT(*) as cantidad_actividades,
    'BOB ' || TO_CHAR(SUM(presupuesto), 'FM999,999,999.00') as presupuesto_total
FROM actividad 
WHERE codigo LIKE 'ACT%_HOSP' OR codigo LIKE 'ACT%_PARK' OR codigo LIKE 'ACT%_BRT'
GROUP BY tipo
ORDER BY tipo;

-- Mostrar resumen de presupuestos
SELECT 
    '💰 PRESUPUESTOS ASIGNADOS' as categoria,
    tipo,
    estado,
    COUNT(*) as cantidad,
    'BOB ' || TO_CHAR(SUM(monto), 'FM999,999,999.00') as monto_total
FROM presupuesto 
WHERE idPresupuesto LIKE 'PRES_HOSP_%' OR idPresupuesto LIKE 'PRES_PARK_%' OR idPresupuesto LIKE 'PRES_BRT_%'
GROUP BY tipo, estado
ORDER BY tipo, estado;
