-- Crear planes institucionales si no existen
INSERT INTO plan_institucional (nombre, descripcion, tipo, periodo_inicio, periodo_fin, estado, institucion_id, creado_por) 
SELECT 'Plan Estrategico 2025-2028', 'Plan estrategico institucional', 'ESTRATEGICO', '2025-01-01', '2028-12-31', 'ACTIVO', 1, 1
WHERE NOT EXISTS (SELECT 1 FROM plan_institucional WHERE nombre = 'Plan Estrategico 2025-2028');

-- Insertar proyectos de ejemplo
INSERT INTO proyecto (codigo, nombre, descripcion, tipo, fecha_inicio, fecha_fin, duracion_meses, presupuesto_total, monto, estado, objetivo_id, responsable_id, supervisor_id, prioridad, ubicacion_geografica, beneficiarios_directos, beneficiarios_indirectos, institucion_id) VALUES
('PROY_HOSP_NEW', 'Hospital Tercer Nivel', 'Hospital de alta complejidad con equipamiento especializado', 'INVERSION', '2025-03-01', '2027-12-31', 34, 25000000.00, 25000000.00, 'Borrador', 8, 2, 3, 'ALTA', 'La Paz', 500000, 1500000, 1),
('PROY_PARK_NEW', 'Parque Industrial Tech', 'Parque industrial tecnologico con centro I+D', 'INVERSION', '2025-04-01', '2028-03-31', 36, 18000000.00, 18000000.00, 'Borrador', 9, 2, 1, 'ALTA', 'Santa Cruz', 2000, 25000, 2),
('PROY_BRT_NEW', 'Sistema BRT Rapido', 'Sistema de transporte rapido con buses electricos', 'INVERSION', '2025-05-01', '2027-04-30', 24, 35000000.00, 35000000.00, 'Enviado', 10, 2, 3, 'ALTA', 'Cochabamba', 800000, 1200000, 3);

-- Verificar proyectos insertados
SELECT codigo, nombre, estado, presupuesto_total FROM proyecto WHERE codigo LIKE 'PROY_%_NEW';
