'use client'

import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Title,
  Tooltip
} from 'chart.js'
import { useEffect, useState } from 'react'
import { Bar, Doughnut } from 'react-chartjs-2'
import { useAuth } from '../hooks/useAuth'
import { useErrorHandler } from '../hooks/useErrorHandler'
import { buildApiUrl, buildHeaders } from '../utils/apiConfig'
import ErrorHandler from './ErrorHandler'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
)

interface DashboardData {
  success: boolean;
  data: {
    estadisticas: {
      total_instituciones: number;
      total_usuarios: number;
      total_objetivos: number;
      total_proyectos: number;
      proyectos_borrador: number;
      proyectos_pendientes: number;
      proyectos_aprobados: number;
      proyectos_rechazados: number;
      total_actividades: number;
      total_presupuestos: number;
      monto_total_aprobado: number;
    };
    tipo_dashboard: string;
    titulo: string;
    descripcion: string;
  };
}

const DashboardStats = () => {
  const { user } = useAuth()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const { error, errorType, handleError, clearError, retryAction } = useErrorHandler()

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        clearError()
        const token = localStorage.getItem('token')
        if (!token) {
          throw new Error('No se encontro token de autenticacion')
        }

        const response = await fetch(buildApiUrl('/api/dashboard/stats'), {
          method: 'GET',
          headers: buildHeaders(token)
        })

        if (!response.ok) {
          throw new Error(`Error HTTP: ${response.status}`)
        }

        const dashboardData = await response.json()
        setData(dashboardData)
      } catch (err) {
        console.error('Error al cargar datos del dashboard:', err)
        handleError(err, 'data')
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [clearError, handleError])

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="backdrop-blur-sm bg-white/80 rounded-2xl shadow-xl border border-white/20 p-6 animate-pulse">
            <div className="flex items-center justify-between">
              <div>
                <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-16"></div>
              </div>
              <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <ErrorHandler 
        error={error} 
        type={errorType} 
        onRetry={retryAction(() => {
          setLoading(true)
          const token = localStorage.getItem('token')
          if (!token) {
            throw new Error('No se encontro token de autenticacion')
          }

          return fetch(buildApiUrl('/api/dashboard/stats'), {
            method: 'GET',
            headers: buildHeaders(token)
          })
          .then(response => {
            if (!response.ok) {
              throw new Error(`Error HTTP: ${response.status}`)
            }
            return response.json()
          })
          .then(dashboardData => {
            setData(dashboardData)
            setLoading(false)
          })
        })}
      />
    )
  }

  if (!data || !data.data || !data.data.estadisticas) {
    return (
      <div className="backdrop-blur-sm bg-white/80 rounded-2xl shadow-xl border border-white/20 p-8 text-center text-gray-500 mb-8">
        <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-lg font-medium">No hay datos disponibles</p>
        <p className="text-sm">Verifica la conexion con el servidor</p>
      </div>
    )
  }

  const stats = data.data.estadisticas;

  // Panel especifico para REVISOR
  const RevisorPanel = () => {
    if (!user?.roles?.includes('REVISOR')) return null;

    return (
      <div className="mb-6 bg-purple-50 border border-purple-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-purple-800 mb-4 flex items-center">
          <span className="mr-2">🧑‍⚖️</span>
          Panel de Alertas - Revisor Institucional
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-4 border-l-4 border-orange-400">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Proyectos Pendientes</h4>
                <p className="text-sm text-gray-600">Requieren revision inmediata</p>
              </div>
              <div className="text-3xl font-bold text-orange-600">
                {stats.proyectos_pendientes || 0}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border-l-4 border-green-400">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Revisiones Completadas</h4>
                <p className="text-sm text-gray-600">Proyectos ya revisados</p>
              </div>
              <div className="text-3xl font-bold text-green-600">
                {(stats.proyectos_aprobados || 0) + (stats.proyectos_rechazados || 0)}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          <button className="bg-white hover:bg-gray-50 border border-gray-200 rounded-lg p-3 text-left transition-colors">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">✔️</span>
              <div>
                <h5 className="font-medium text-gray-900">Ver Proyectos en Revision</h5>
                <p className="text-sm text-gray-600">Acceder a proyectos enviados</p>
              </div>
            </div>
          </button>
          
          <button className="bg-white hover:bg-gray-50 border border-gray-200 rounded-lg p-3 text-left transition-colors">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">📜</span>
              <div>
                <h5 className="font-medium text-gray-900">Consultar Decisiones Anteriores</h5>
                <p className="text-sm text-gray-600">Historial de validaciones</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    );
  };

  // Panel especifico para VALIDADOR
  const ValidadorPanel = () => {
    if (!user?.roles?.includes('VALIDADOR')) return null;

    return (
      <div className="mb-6 bg-orange-50 border border-orange-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-orange-800 mb-4 flex items-center">
          <span className="mr-2">🧑‍⚖️</span>
          Panel de Alertas - Validador
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="bg-white rounded-lg p-4 border-l-4 border-blue-400">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Objetivos Pendientes por Validar</h4>
                <p className="text-sm text-gray-600">Requieren validacion inmediata</p>
              </div>
              <div className="text-3xl font-bold text-blue-600">
                {/* Estimacion de objetivos pendientes de validacion */}
                {Math.floor((stats.total_objetivos || 0) * 0.3)}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border-l-4 border-green-400">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Objetivos Aprobados / Rechazados</h4>
                <p className="text-sm text-gray-600">Validaciones recientes</p>
              </div>
              <div className="text-3xl font-bold text-green-600">
                {/* Estimacion de objetivos ya validados */}
                {Math.floor((stats.total_objetivos || 0) * 0.7)}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <button 
            onClick={() => window.location.href = '/gestion-objetivos'}
            className="bg-white hover:bg-gray-50 border border-gray-200 rounded-lg p-3 text-left transition-colors"
          >
            <div className="flex items-center space-x-3">
              <span className="text-2xl">✔️</span>
              <div>
                <h5 className="font-medium text-gray-900">Ver Objetivos Pendientes</h5>
                <p className="text-sm text-gray-600">Acceder a objetivos para validar</p>
              </div>
            </div>
          </button>
          
          <button className="bg-white hover:bg-gray-50 border border-gray-200 rounded-lg p-3 text-left transition-colors">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">📊</span>
              <div>
                <h5 className="font-medium text-gray-900">Historial de Validaciones</h5>
                <p className="text-sm text-gray-600">Consultar objetivos validados</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    );
  };

  // Configuracion de graficos
  const proyectosChartData = {
    labels: ['Borrador', 'Pendientes', 'Aprobados', 'Rechazados'],
    datasets: [{
      label: 'Proyectos por Estado',
      data: [
        stats.proyectos_borrador,
        stats.proyectos_pendientes,
        stats.proyectos_aprobados,
        stats.proyectos_rechazados
      ],
      backgroundColor: [
        '#FEF3C7',
        '#BFDBFE',
        '#BBF7D0',
        '#FECACA'
      ],
      borderColor: [
        '#F59E0B',
        '#3B82F6',
        '#10B981',
        '#EF4444'
      ],
      borderWidth: 2
    }]
  }

  const estadisticasGenerales = {
    labels: ['Instituciones', 'Usuarios', 'Objetivos', 'Proyectos'],
    datasets: [{
      label: 'Estadisticas Generales',
      data: [
        stats.total_instituciones,
        stats.total_usuarios,
        stats.total_objetivos,
        stats.total_proyectos
      ],
      backgroundColor: [
        '#E0E7FF',
        '#FEF3C7',
        '#DBEAFE',
        '#D1FAE5'
      ]
    }]
  }

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-BO', {
      style: 'currency',
      currency: 'BOB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="space-y-8">
      <RevisorPanel />
      <ValidadorPanel />

      {/* Tarjetas de estadisticas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="backdrop-blur-sm bg-white/80 rounded-2xl shadow-xl border border-white/20 p-6 transform hover:scale-105 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Instituciones</p>
              <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {stats.total_instituciones}
              </p>
              <p className="text-xs text-gray-500 mt-1">Total registradas</p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
        </div>

        <div className="backdrop-blur-sm bg-white/80 rounded-2xl shadow-xl border border-white/20 p-6 transform hover:scale-105 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Usuarios</p>
              <p className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                {stats.total_usuarios}
              </p>
              <p className="text-xs text-gray-500 mt-1">Activos en sistema</p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="backdrop-blur-sm bg-white/80 rounded-2xl shadow-xl border border-white/20 p-6 transform hover:scale-105 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Objetivos</p>
              <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                {stats.total_objetivos}
              </p>
              <p className="text-xs text-gray-500 mt-1">Estrategicos</p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="backdrop-blur-sm bg-white/80 rounded-2xl shadow-xl border border-white/20 p-6 transform hover:scale-105 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Proyectos</p>
              <p className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                {stats.total_proyectos}
              </p>
              <p className="text-xs text-gray-500 mt-1">De inversion</p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Graficos y estadisticas detalladas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="backdrop-blur-sm bg-white/80 rounded-2xl shadow-xl border border-white/20 p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Distribucion de Proyectos</h3>
            <div className="w-3 h-3 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full"></div>
          </div>
          <div className="h-64">
            <Doughnut data={proyectosChartData} options={chartOptions} />
          </div>
        </div>

        <div className="backdrop-blur-sm bg-white/80 rounded-2xl shadow-xl border border-white/20 p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Estadisticas Generales</h3>
            <div className="w-3 h-3 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full"></div>
          </div>
          <div className="h-64">
            <Bar data={estadisticasGenerales} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Panel de informacion presupuestaria */}
      <div className="backdrop-blur-sm bg-white/80 rounded-2xl shadow-xl border border-white/20 p-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900 flex items-center">
            <svg className="w-6 h-6 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
            Informacion Presupuestaria
          </h3>
          <div className="text-sm text-gray-500">Montos en guaranies</div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl border border-green-200">
            <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-sm text-gray-600 mb-1">Proyectos Aprobados</p>
            <p className="text-2xl font-bold text-green-700">{stats.proyectos_aprobados}</p>
          </div>
          
          <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl border border-blue-200">
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <p className="text-sm text-gray-600 mb-1">Monto Total Aprobado</p>
            <p className="text-2xl font-bold text-blue-700">{formatCurrency(stats.monto_total_aprobado || 0)}</p>
          </div>
          
          <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-pink-100 rounded-xl border border-purple-200">
            <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-sm text-gray-600 mb-1">Total Presupuestos</p>
            <p className="text-2xl font-bold text-purple-700">{stats.total_presupuestos}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-amber-50 to-yellow-100 p-4 rounded-xl text-center border border-amber-200">
            <p className="text-xs text-gray-600 mb-1">Borradores</p>
            <p className="text-lg font-bold text-amber-700">{stats.proyectos_borrador}</p>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-cyan-100 p-4 rounded-xl text-center border border-blue-200">
            <p className="text-xs text-gray-600 mb-1">Pendientes</p>
            <p className="text-lg font-bold text-blue-700">{stats.proyectos_pendientes}</p>
          </div>
          <div className="bg-gradient-to-br from-red-50 to-pink-100 p-4 rounded-xl text-center border border-red-200">
            <p className="text-xs text-gray-600 mb-1">Rechazados</p>
            <p className="text-lg font-bold text-red-700">{stats.proyectos_rechazados}</p>
          </div>
          <div className="bg-gradient-to-br from-indigo-50 to-purple-100 p-4 rounded-xl text-center border border-indigo-200">
            <p className="text-xs text-gray-600 mb-1">Actividades</p>
            <p className="text-lg font-bold text-indigo-700">{stats.total_actividades}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardStats
