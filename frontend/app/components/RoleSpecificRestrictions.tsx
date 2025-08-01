'use client';

import { useAuth } from '../hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface RestrictionNoticeProps {
  message: string;
  allowedActions?: string[];
  suggestedRedirect?: string;
}

function RestrictionNotice({ message, allowedActions, suggestedRedirect }: RestrictionNoticeProps) {
  const router = useRouter();

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 m-4">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <span className="text-2xl">⚠️</span>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-lg font-medium text-amber-800 mb-2">
            Acceso Restringido
          </h3>
          <p className="text-amber-700 mb-4">{message}</p>
          
          {allowedActions && allowedActions.length > 0 && (
            <div className="mb-4">
              <h4 className="font-medium text-amber-800 mb-2">
                Acciones permitidas para tu rol:
              </h4>
              <ul className="list-disc list-inside text-amber-700 space-y-1">
                {allowedActions.map((action, index) => (
                  <li key={index}>{action}</li>
                ))}
              </ul>
            </div>
          )}

          {suggestedRedirect && (
            <button
              onClick={() => router.push(suggestedRedirect)}
              className="bg-amber-600 text-white px-4 py-2 rounded-md hover:bg-amber-700 transition-colors"
            >
              Ir a tu panel principal
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Restricción para ADMIN - No puede validar
export function AdminValidationRestriction() {
  return (
    <RestrictionNotice
      message="Como Administrador del Sistema, tu función es supervisar y gestionar el sistema, no validar objetivos o proyectos directamente."
      allowedActions={[
        "Supervisión general del sistema",
        "Gestión de usuarios y permisos",
        "Configuración institucional",
        "Generación de reportes de auditoría",
        "Monitoreo de todas las actividades"
      ]}
      suggestedRedirect="/dashboard"
    />
  );
}

// Restricción para PLANIF - Solo Módulo 1
export function PlanifierModuleRestriction({ currentModule }: { currentModule?: string }) {
  const allowedModules = ['objetivos', 'metas-indicadores'];
  
  if (currentModule && !allowedModules.some(module => currentModule.includes(module))) {
    return (
      <RestrictionNotice
        message="Como Técnico Planificador, tu acceso está limitado al Módulo 1: Planificación Estratégica."
        allowedActions={[
          "Formulación de objetivos estratégicos",
          "Definición de metas e indicadores", 
          "Alineación con PND y ODS",
          "Gestión de la planificación estratégica"
        ]}
        suggestedRedirect="/gestion-objetivos"
      />
    );
  }
  return null;
}

// Restricción para REVISOR - Solo revisión, no validación
export function ReviewerValidationRestriction() {
  return (
    <RestrictionNotice
      message="Como Revisor Institucional, tu función es revisar proyectos de inversión, no validar objetivos estratégicos."
      allowedActions={[
        "Revisión técnica de proyectos de inversión",
        "Evaluación de viabilidad de proyectos",
        "Aprobación o rechazo de proyectos",
        "Seguimiento de proyectos aprobados"
      ]}
      suggestedRedirect="/proyectos-revision"
    />
  );
}

// Restricción para VALID - Solo validación, no revisión de proyectos
export function ValidatorProjectRestriction() {
  return (
    <RestrictionNotice
      message="Como Autoridad Validadora, tu función es validar objetivos estratégicos y presupuestos, no revisar proyectos de inversión."
      allowedActions={[
        "Validación de objetivos estratégicos",
        "Aprobación de presupuestos",
        "Validación final de planificación",
        "Autorización de documentos oficiales"
      ]}
      suggestedRedirect="/objetivos-validacion"
    />
  );
}

// Restricción para AUDITOR - Solo auditoría
export function AuditorOperationalRestriction() {
  return (
    <RestrictionNotice
      message="Como Auditor, tu función es supervisar, auditar y generar reportes, no realizar operaciones directas en el sistema."
      allowedActions={[
        "Auditoría completa del sistema",
        "Generación de reportes de cumplimiento",
        "Seguimiento de todas las actividades",
        "Verificación de procesos y controles",
        "Análisis de datos históricos"
      ]}
      suggestedRedirect="/auditoria"
    />
  );
}

// Hook para verificar restricciones específicas del rol
export function useRoleRestrictions() {
  const { user } = useAuth();
  const [restrictions, setRestrictions] = useState<{
    canValidateObjectives: boolean;
    canReviewProjects: boolean;
    canAccessModule: (module: string) => boolean;
    canPerformOperations: boolean;
  }>({
    canValidateObjectives: false,
    canReviewProjects: false,
    canAccessModule: () => false,
    canPerformOperations: false
  });

  useEffect(() => {
    if (user?.roles && user.roles.length > 0) {
      const role = user.roles[0]; // Asumimos que el primer rol es el principal
      
      setRestrictions({
        canValidateObjectives: role === 'VALID',
        canReviewProjects: role === 'REVISOR',
        canAccessModule: (module: string) => {
          switch (role) {
            case 'ADMIN':
              return true; // Admin puede acceder a todo
            case 'PLANIF':
              return ['objetivos', 'metas-indicadores', 'alineacion-pnd-ods'].some(allowed => 
                module.includes(allowed)
              );
            case 'REVISOR':
              return ['proyectos', 'seguimiento'].some(allowed => 
                module.includes(allowed)
              );
            case 'VALID':
              return ['objetivos', 'presupuestos', 'validacion'].some(allowed => 
                module.includes(allowed)
              );
            case 'AUDITOR':
              return ['auditoria', 'reportes', 'supervision'].some(allowed => 
                module.includes(allowed)
              );
            default:
              return false;
          }
        },
        canPerformOperations: role !== 'AUDITOR' // Auditor solo observa
      });
    }
  }, [user]);

  return restrictions;
}
