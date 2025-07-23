'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import ErrorHandler from '../components/ErrorHandler';
import PermissionIndicator from '../components/PermissionIndicator';
import { useAuth } from '../hooks/useAuth';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { buildApiUrl } from '../utils/apiConfig';

interface Institucion {
  id: number;
  codigo: string;
  nombre: string;
  sigla?: string;
  tipo: string;
  mision?: string;
  vision?: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  web?: string;
  jerarquia: number;
  responsable?: number; // Optional
  estado: boolean;
  created_at: string;
  updated_at?: string;
  responsable_nombre?: string;
  sub_instituciones?: number;
}

export default function ConfiguracionInstitucionalPage() {
  const { user, token, loading: isLoading, permissions } = useAuth();
  const router = useRouter();

  const [instituciones, setInstituciones] = useState<Institucion[]>([]);
  const [loading, setLoading] = useState(false);
  const { error, errorType, handleError, clearError } = useErrorHandler();
  const [showInstitucionForm, setShowInstitucionForm] = useState(false);
  const [editingItem, setEditingItem] = useState<Institucion | null>(null);

  // Permisos
  const canRegisterEdit = permissions.configuracionInstitucional?.canRegisterEdit();
  const canConsult = permissions.configuracionInstitucional?.canConsult();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
      return;
    }

    if (user && !canConsult) {
      return;
    }

    if (user && token) {
      loadInstituciones();
    }
  }, [user, token, isLoading, canConsult, router]);

  const loadInstituciones = async () => {
    setLoading(true);
    try {
      const response = await fetch(buildApiUrl('/api/instituciones/all'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const data = await response.json();
        setInstituciones(data.data || []);
      } else {
        handleError('Error al cargar instituciones');
      }
    } catch (err) {
      console.error('Error:', err);
      handleError('Error de conexion');
    } finally {
      setLoading(false);
    }
  };

  const cleanText = (text: any): string => {
    if (text === null || text === undefined) return '';
    return String(text).replace(/\\u([0-9a-fA-F]{4})/g, (match, p1) => {
      return String.fromCharCode(parseInt(p1, 16));
    });
  };

  const toggleEstado = async (id: number, estadoActual: boolean) => {
    try {
      const action = estadoActual ? 'inactivar' : 'activar';
      const response = await fetch(buildApiUrl(`/api/instituciones/${id}/${action}`), {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          usuario_id: user?.id
        })
      });

      if (response.ok) {
        loadInstituciones();
      } else {
        handleError('Error al cambiar estado');
      }
    } catch (err) {
      console.error('Error:', err);
      handleError('Error de conexion');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full border-blue-600 border-r-transparent"></div>
          <p className="mt-2 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (!canConsult) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <div className="text-center">
            <div className="text-6xl mb-4">🚫</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Acceso Denegado</h2>
            <p className="text-gray-600 mb-6">
              No tienes permisos para acceder al modulo de Configuracion Institucional.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Roles permitidos: Administrador
            </p>
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Volver al Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                🏢 Configuracion Institucional
              </h1>
              <p className="text-gray-600">
                Administrar la estructura organizativa de las instituciones del sistema
              </p>
              <div className="mt-3">
                <PermissionIndicator module="configuracionInstitucional" />
              </div>
            </div>
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span>Regresar al Inicio</span>
            </button>
          </div>
        </div>

        {/* Contenido Principal */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="border-b border-gray-200">
            <div className="px-6 py-4">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                🏢 Gestion de Instituciones
              </h2>
              <p className="text-gray-600 mt-1">
                Administrar instituciones del sistema
              </p>
              {/* Mensaje para planificadores */}
              {!canRegisterEdit && canConsult && (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-yellow-800 flex items-center">
                    <span className="mr-2">⚠️</span>
                    Solo tienes permisos de consulta en este modulo
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="p-6">
            <ErrorHandler 
              error={error} 
              type={errorType} 
              compact={true}
            />

            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                <span className="ml-3 text-gray-600">Cargando...</span>
              </div>
            ) : (
              <div>
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">Lista de Instituciones</h3>
                    <p className="text-gray-600">Total: {instituciones.length} instituciones</p>
                  </div>
                  
                  {canRegisterEdit && (
                    <button 
                      onClick={() => {
                        setShowInstitucionForm(true);
                        setEditingItem(null);
                      }}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      ➕ Crear Institucion
                    </button>
                  )}
                </div>

                {/* Tabla de Instituciones */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Institucion
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tipo
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Responsable
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Estado
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {instituciones.map((institucion) => (
                        <tr key={institucion.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-10 w-10 flex-shrink-0">
                                <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                                  <span className="text-sm font-medium text-white">
                                    {institucion.nombre.charAt(0)}
                                  </span>
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{cleanText(institucion.nombre)}</div>
                                <div className="text-sm text-gray-500">{cleanText(institucion.sigla)}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                              {cleanText(institucion.tipo)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {cleanText(institucion.responsable_nombre) || 'No asignado'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              institucion.estado
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {institucion.estado ? '✅ Activa' : '❌ Inactiva'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            {canRegisterEdit ? (
                              <>
                                <button 
                                  onClick={() => {
                                    setEditingItem(institucion);
                                    setShowInstitucionForm(true);
                                  }}
                                  className="text-blue-600 hover:text-blue-900"
                                >
                                   Editar
                                </button>
                                <button 
                                  onClick={() => toggleEstado(institucion.id, institucion.estado)}
                                  className={`${
                                    institucion.estado ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'
                                  }`}
                                >
                                  {institucion.estado ? '🚫 Inactivar' : '✅ Activar'}
                                </button>
                              </>
                            ) : (
                              <span className="text-gray-400 text-sm italic">Solo consulta</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Formulario Modal */}
        {showInstitucionForm && (
          <FormularioInstitucion
            institucion={editingItem}
            onClose={() => {
              setShowInstitucionForm(false);
              setEditingItem(null);
            }}
            onSave={() => {
              setShowInstitucionForm(false);
              setEditingItem(null);
              loadInstituciones();
            }}
          />
        )}
      </div>
    </div>
  );
}

// Componente FormularioInstitucion segun especificacion
function FormularioInstitucion({ institucion, onClose, onSave }: {
  institucion?: Institucion | null;
  onClose: () => void;
  onSave: () => void;
}) {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [usuarios, setUsuarios] = useState<any[]>([]);
  
  // Solo los atributos especificados: codigo, nombre, tipo, jerarquia, responsable
  const [formData, setFormData] = useState({
    codigo: institucion?.codigo || '',
    nombre: institucion?.nombre || '',
    tipo: institucion?.tipo || 'PUBLICA',
    jerarquia: institucion?.jerarquia?.toString() || '1',
    responsable: institucion?.responsable?.toString() || ''
  });
  const [loadingUsuarios, setLoadingUsuarios] = useState(false);

  useEffect(() => {
    console.log('Iniciando carga de usuarios...');
    loadUsuarios();
  }, []);

  const loadUsuarios = async () => {
    setLoadingUsuarios(true);
    try {
      console.log('Token:', token ? 'EXISTE' : 'NO EXISTE');
      console.log('URL:', buildApiUrl('/api/usuarios'));
      
      const response = await fetch(buildApiUrl('/api/usuarios'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });
      
      console.log('Status response:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Usuarios cargados:', data);
        setUsuarios(data.data || []);
      } else {
        const errorData = await response.text();
        console.error('Error al cargar usuarios:', response.status, errorData);
      }
    } catch (err) {
      console.error('Error al cargar usuarios:', err);
    } finally {
      setLoadingUsuarios(false);
    }
  };

  // Metodo registrarInstitucion() segun especificacion
  const registrarInstitucion = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const url = institucion 
        ? buildApiUrl(`/api/instituciones/${institucion.id}`)
        : buildApiUrl('/api/instituciones');
      
      const method = institucion ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          codigo: formData.codigo,
          nombre: formData.nombre,
          tipo: formData.tipo,
          jerarquia: parseInt(formData.jerarquia),
          responsable: formData.responsable ? parseInt(formData.responsable) : null
        })
      });

      if (response.ok) {
        onSave();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Error al registrar institucion');
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Error de conexion');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
        <h3 className="text-xl font-semibold mb-6">
          {institucion ? 'Editar Institucion' : 'Registrar Nueva Institucion'}
        </h3>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <form onSubmit={registrarInstitucion}>
          <div className="grid grid-cols-1 gap-6">
            {/* Codigo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Codigo *
              </label>
              <input
                type="text"
                name="codigo"
                value={formData.codigo}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: INST001"
              />
            </div>

            {/* Nombre */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre *
              </label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nombre de la institucion"
              />
            </div>

            {/* Tipo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo *
              </label>
              <select
                name="tipo"
                value={formData.tipo}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="PUBLICA">Publica</option>
                <option value="PRIVADA">Privada</option>
                <option value="MIXTA">Mixta</option>
                <option value="AUTONOMA">Autonoma</option>
              </select>
            </div>

            {/* Jerarquia */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Jerarquia *
              </label>
              <select
                name="jerarquia"
                value={formData.jerarquia}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="1">1 - Ministerio</option>
                <option value="2">2 - Viceministerio</option>
                <option value="3">3 - Direccion General</option>
                <option value="4">4 - Direccion</option>
                <option value="5">5 - Unidad</option>
              </select>
            </div>

            {/* Responsable */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Responsable (Opcional)
              </label>
              <select
                name="responsable"
                value={formData.responsable}
                onChange={handleChange}
                disabled={loadingUsuarios}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              >
                <option value="">
                  {loadingUsuarios ? 'Cargando usuarios...' : 'Seleccionar responsable (opcional)'}
                </option>
                {usuarios.map((usuario) => (
                  <option key={usuario.id} value={usuario.id}>
                    {usuario.nombre} {usuario.apellido} - {usuario.cargo || 'Sin cargo'}
                  </option>
                ))}
              </select>
              {loadingUsuarios && (
                <p className="text-sm text-blue-500 mt-1">
                  🔄 Cargando lista de usuarios...
                </p>
              )}
              {!loadingUsuarios && usuarios.length === 0 && (
                <p className="text-sm text-gray-500 mt-1">
                  ℹ️ No hay usuarios disponibles. La institucion se puede crear sin responsable y asignar uno despues.
                </p>
              )}
              {!loadingUsuarios && usuarios.length > 0 && (
                <p className="text-sm text-green-600 mt-1">
                  ✅ {usuarios.length} usuarios disponibles
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-4 mt-8">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              {loading ? 'Registrando...' : (institucion ? 'Actualizar' : 'Registrar Institucion')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
