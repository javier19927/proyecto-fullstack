'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { buildApiUrl, buildHeaders } from '../utils/apiConfig';

interface RoleBasedTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  itemCounts?: {
    objetivos?: number;
    proyectos?: number;
    pendingValidation?: number;
    pendingReview?: number;
  };
}

export default function RoleBasedTabs({ activeTab, onTabChange, itemCounts = {} }: RoleBasedTabsProps) {
  const { user } = useAuth();
  const [counts, setCounts] = useState(itemCounts);

  useEffect(() => {
    setCounts(itemCounts);
  }, [itemCounts]);

  if (!user?.roles) return null;

  const userRoles = user.roles;

  // Definir las pestañas disponibles según el rol
  const getAvailableTabs = () => {
    const tabs = [];

    // Dashboard siempre disponible
    tabs.push({
      id: 'dashboard',
      label: 'Dashboard',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      roles: ['ADMIN', 'PLANIF', 'REVISOR', 'VALID', 'AUDITOR']
    });

    // Objetivos - ADMIN, PLANIF, VALID, AUDITOR
    if (userRoles.some(role => ['ADMIN', 'PLANIF', 'VALID', 'AUDITOR'].includes(role))) {
      tabs.push({
        id: 'objetivos',
        label: 'Objetivos',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
        ),
        roles: ['ADMIN', 'PLANIF', 'VALID', 'AUDITOR'],
        count: counts.objetivos
      });
    }

    // Proyectos - ADMIN, PLANIF, REVISOR, AUDITOR
    if (userRoles.some(role => ['ADMIN', 'PLANIF', 'REVISOR', 'AUDITOR'].includes(role))) {
      tabs.push({
        id: 'proyectos',
        label: 'Proyectos',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
        ),
        roles: ['ADMIN', 'PLANIF', 'REVISOR', 'AUDITOR'],
        count: counts.proyectos
      });
    }

    // Validación de Objetivos - Solo VALID
    if (userRoles.includes('VALID')) {
      tabs.push({
        id: 'validacion-objetivos',
        label: 'Validar Objetivos',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
        roles: ['VALID'],
        count: counts.pendingValidation,
        badge: counts.pendingValidation ? 'primary' : undefined
      });
    }

    // Revisión de Proyectos - Solo REVISOR
    if (userRoles.includes('REVISOR')) {
      tabs.push({
        id: 'revision-proyectos',
        label: 'Revisar Proyectos',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        ),
        roles: ['REVISOR'],
        count: counts.pendingReview,
        badge: counts.pendingReview ? 'primary' : undefined
      });
    }

    // Reportes - Todos los roles
    tabs.push({
      id: 'reportes',
      label: 'Reportes',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      roles: ['ADMIN', 'PLANIF', 'REVISOR', 'VALID', 'AUDITOR']
    });

    // Auditoría - Solo AUDITOR
    if (userRoles.includes('AUDITOR')) {
      tabs.push({
        id: 'auditoria',
        label: 'Auditoría',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        ),
        roles: ['AUDITOR']
      });
    }

    // Configuración - Solo ADMIN
    if (userRoles.includes('ADMIN')) {
      tabs.push({
        id: 'configuracion',
        label: 'Configuración',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        ),
        roles: ['ADMIN']
      });
    }

    // Gestión de Usuarios - Solo ADMIN
    if (userRoles.includes('ADMIN')) {
      tabs.push({
        id: 'usuarios',
        label: 'Usuarios',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
          </svg>
        ),
        roles: ['ADMIN']
      });
    }

    return tabs.filter(tab => tab.roles.some(role => userRoles.includes(role)));
  };

  const availableTabs = getAvailableTabs();

  const getBadgeColor = (badge?: string) => {
    switch (badge) {
      case 'primary':
        return 'bg-blue-600 text-white';
      case 'warning':
        return 'bg-yellow-500 text-white';
      case 'danger':
        return 'bg-red-600 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  return (
    <div className="border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {availableTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getBadgeColor(tab.badge)}`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
