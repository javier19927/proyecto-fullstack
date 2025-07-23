'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import ErrorHandler from '../components/ErrorHandler';
import PermissionIndicator from '../components/PermissionIndicator';
import { useAuth } from '../hooks/useAuth';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { buildApiUrl } from '../utils/apiConfig';

interface Usuario {
  id: number;
  codigo: string;
  nombre: string;
  apellido: string;
  nombreCompleto: string;
  correo: string;
  telefono: string;
  documento: string;
  cargo: string;
  institucion_id: number;
  estado: boolean;
  ultimo_acceso?: string;
  created_at: string;
  updated_at?: string;
  institucion_nombre: string;
  rol_id: number;
  rol_nombre: string;
  rol_descripcion: string;
  rol_nivel: number;
}

interface Rol {
  id: number;
  nombre: string;
  descripcion: string;
  nivel: number;
  permisos: string[];
  estado: boolean;
  created_at: string;
  updated_at?: string;
}

export default function GestionUsuariosPage() {
  const { user, token, loading: isLoading, permissions } = useAuth();
  const router = useRouter();
  const { error, errorType, handleError, clearError, retryAction } = useErrorHandler();

  const [activeTab, setActiveTab] = useState('usuarios');
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Estados para formularios
  const [showUsuarioForm, setShowUsuarioForm] = useState(false);
  const [showRolForm, setShowRolForm] = useState(false);
  const [editingItem, setEditingItem] = useState<Usuario | Rol | null>(null);

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
      loadData();
    }
  }, [user, token, isLoading, canConsult, router]);

  const loadData = async () => {
    setLoading(true);
    clearError();
    try {
      if (activeTab === 'usuarios') {
        await loadUsuarios();
      } else if (activeTab === 'roles') {
        await loadRoles();
      }
    } catch (err) {
      console.error('Error:', err);
      handleError(err, 'data');
    } finally {
      setLoading(false);
    }
  };

  const loadUsuarios = async () => {
    try {
      const response = await fetch(buildApiUrl('/api/usuarios'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUsuarios(data.data || []);
      } else {
        throw new Error(`Error HTTP: ${response.status}`);
      }
    } catch (err) {
      console.error('Error al cargar usuarios:', err);
      throw err; // Re-throw to be handled by loadData
    }
  };

  const loadRoles = async () => {
    try {
      const response = await fetch(buildApiUrl('/api/roles'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const data = await response.json();
        setRoles(data.data || []);
      } else {
        throw new Error(`Error HTTP: ${response.status}`);
      }
    } catch (err) {
      console.error('Error al cargar roles:', err);
      throw err; // Re-throw to be handled by loadData
    }
  };

  const cleanText = (text: any): string => {
    if (text === null || text === undefined) return '';
    return String(text).replace(/\\u([0-9a-fA-F]{4})/g, (match, p1) => {
      return String.fromCharCode(parseInt(p1, 16));
    });
  };

  const toggleEstado = async (tipo: 'usuarios' | 'roles', id: number, estadoActual: boolean) => {
    try {
      const endpoint = tipo === 'usuarios' 
        ? `/api/usuarios/${id}/toggle-estado`
        : `/api/roles/${id}/toggle-estado`;
        
      const response = await fetch(buildApiUrl(endpoint), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        loadData();
      } else {
        throw new Error(`Error HTTP: ${response.status}`);
      }
    } catch (err) {
      console.error('Error al cambiar estado:', err);
      handleError(err, 'general');
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    clearError();
  };

  useEffect(() => {
    if (activeTab && user && token) {
      loadData();
    }
  }, [activeTab]);

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
              No tienes permisos para acceder a la Gestion de Usuarios.
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
                👥 Gestion de Usuarios
              </h1>
              <p className="text-gray-600">
                Administrar usuarios y roles del sistema
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

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { id: 'usuarios', label: '👤 Usuarios', desc: 'Administracion de usuarios' },
                { id: 'roles', label: '🔐 Roles', desc: 'Control de permisos' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div>{tab.label}</div>
                  <div className="text-xs text-gray-400">{tab.desc}</div>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            <ErrorHandler 
              error={error} 
              type={errorType} 
              onRetry={retryAction(loadData)}
              compact={true}
            />

            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                <span className="ml-3 text-gray-600">Cargando...</span>
              </div>
            ) : (
              <div>
                {/* Header de cada seccion */}
                <div className="flex justify-between items-center mb-6">
                  <div>
                    {activeTab === 'usuarios' && (
                      <div>
                        <h2 className="text-2xl font-bold text-gray-800">👤 Gestion de Usuarios</h2>
                        <p className="text-gray-600">Total: {usuarios.length} usuarios</p>
                      </div>
                    )}
                    {activeTab === 'roles' && (
                      <div>
                        <h2 className="text-2xl font-bold text-gray-800">🔐 Gestion de Roles</h2>
                        <p className="text-gray-600">Total: {roles.length} roles</p>
                      </div>
                    )}
                  </div>
                  
                  {canRegisterEdit && (
                    <button 
                      onClick={() => {
                        if (activeTab === 'usuarios') setShowUsuarioForm(true);
                        if (activeTab === 'roles') setShowRolForm(true);
                        setEditingItem(null);
                      }}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      ➕ Crear {activeTab === 'usuarios' ? 'Usuario' : 'Rol'}
                    </button>
                  )}
                </div>

                {/* Tabla de Usuarios */}
                {activeTab === 'usuarios' && (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Usuario
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Rol
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Institucion
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
                        {usuarios.map((usuario) => (
                          <tr key={usuario.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="h-10 w-10 flex-shrink-0">
                                  <div className="h-10 w-10 rounded-full bg-purple-500 flex items-center justify-center">
                                    <span className="text-sm font-medium text-white">
                                      {usuario.nombre.charAt(0)}{usuario.apellido.charAt(0)}
                                    </span>
                                  </div>
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">
                                    {cleanText(usuario.nombreCompleto)}
                                  </div>
                                  <div className="text-sm text-gray-500">{usuario.correo}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                {cleanText(usuario.rol_nombre)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {cleanText(usuario.institucion_nombre)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                usuario.estado
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {usuario.estado ? '✅ Activo' : '❌ Inactivo'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                              {canRegisterEdit && (
                                <>
                                  <button 
                                    onClick={() => {
                                      setEditingItem(usuario);
                                      setShowUsuarioForm(true);
                                    }}
                                    className="text-blue-600 hover:text-blue-900"
                                  >
                                     Editar
                                  </button>
                                  <button 
                                    onClick={() => toggleEstado('usuarios', usuario.id, usuario.estado)}
                                    className={`${
                                      usuario.estado ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'
                                    }`}
                                  >
                                    {usuario.estado ? '❌ Inactivar' : '✅ Activar'}
                                  </button>
                                </>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Tabla de Roles */}
                {activeTab === 'roles' && (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Rol
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Descripcion
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Nivel
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
                        {roles.map((rol) => (
                          <tr key={rol.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="h-10 w-10 flex-shrink-0">
                                  <div className="h-10 w-10 rounded-full bg-indigo-500 flex items-center justify-center">
                                    <span className="text-sm font-medium text-white">
                                      {rol.nombre.charAt(0)}
                                    </span>
                                  </div>
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">
                                    {cleanText(rol.nombre)}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {cleanText(rol.descripcion)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                                Nivel {rol.nivel}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                rol.estado
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {rol.estado ? '✅ Activo' : '❌ Inactivo'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                              {canRegisterEdit && (
                                <>
                                  <button 
                                    onClick={() => {
                                      setEditingItem(rol);
                                      setShowRolForm(true);
                                    }}
                                    className="text-blue-600 hover:text-blue-900"
                                  >
                                     Editar
                                  </button>
                                  <button 
                                    onClick={() => toggleEstado('roles', rol.id, rol.estado)}
                                    className={`${
                                      rol.estado ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'
                                    }`}
                                  >
                                    {rol.estado ? '❌ Inactivar' : '✅ Activar'}
                                  </button>
                                </>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Formularios */}
        {showUsuarioForm && (
          <FormularioUsuario
            usuario={editingItem as Usuario}
            onClose={() => {
              setShowUsuarioForm(false);
              setEditingItem(null);
            }}
            onSave={() => {
              setShowUsuarioForm(false);
              setEditingItem(null);
              loadData();
            }}
          />
        )}

        {showRolForm && (
          <FormularioRol
            rol={editingItem as Rol}
            onClose={() => {
              setShowRolForm(false);
              setEditingItem(null);
            }}
            onSave={() => {
              setShowRolForm(false);
              setEditingItem(null);
              loadData();
            }}
          />
        )}
      </div>
    </div>
  );
}

// Componente FormularioUsuario segun especificacion
function FormularioUsuario({ usuario, onClose, onSave }: {
  usuario?: Usuario | null;
  onClose: () => void;
  onSave: () => void;
}) {
  const { token } = useAuth();
  const { error, errorType, handleError, clearError } = useErrorHandler();
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<any[]>([]);
  
  // Solo los atributos especificados: correo, nombreCompleto, rol, password, estado
  const [formData, setFormData] = useState({
    correo: usuario?.correo || '',
    nombreCompleto: usuario?.nombreCompleto || '',
    rol: usuario?.rol_id?.toString() || '',
    password: '',
    estado: usuario?.estado !== undefined ? usuario.estado : true
  });

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      const response = await fetch(buildApiUrl('/api/roles'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });
      if (response.ok) {
        const data = await response.json();
        setRoles(data.data || []);
      }
    } catch (err) {
      console.error('Error al cargar roles:', err);
    }
  };

  // Metodo crearUsuario() segun especificacion
  const crearUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    clearError();

    try {
      const url = usuario 
        ? buildApiUrl(`/api/usuarios/${usuario.id}`)
        : buildApiUrl('/api/usuarios');
      
      const method = usuario ? 'PUT' : 'POST';
      
      const body: any = {
        correo: formData.correo,
        nombreCompleto: formData.nombreCompleto,
        rol: parseInt(formData.rol),
        estado: formData.estado
      };

      // Solo incluir password si es nuevo usuario o si se cambio
      if (!usuario || formData.password) {
        body.password = formData.password;
      }
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        onSave();
      } else {
        const errorData = await response.json();
        handleError(errorData.message || 'Error al crear usuario', 'general');
      }
    } catch (err) {
      console.error('Error al crear usuario:', err);
      handleError(err, 'network');
    } finally {
      setLoading(false);
    }
  };

  // Metodo modificarUsuario() segun especificacion
  const modificarUsuario = crearUsuario; // Mismo metodo para crear y modificar

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
        <h3 className="text-xl font-semibold mb-6">
          {usuario ? 'Modificar Usuario' : 'Crear Nuevo Usuario'}
        </h3>

        <ErrorHandler 
          error={error} 
          type={errorType} 
          compact={true}
        />

        <form onSubmit={usuario ? modificarUsuario : crearUsuario}>
          <div className="space-y-4">
            {/* Correo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Correo *
              </label>
              <input
                type="email"
                name="correo"
                value={formData.correo}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="usuario@ejemplo.com"
              />
            </div>

            {/* Nombre Completo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre Completo *
              </label>
              <input
                type="text"
                name="nombreCompleto"
                value={formData.nombreCompleto}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nombre completo del usuario"
              />
            </div>

            {/* Rol */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rol *
              </label>
              <select
                name="rol"
                value={formData.rol}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleccionar rol</option>
                {roles.length > 0 ? (
                  roles.map((rol) => (
                    <option key={rol.id} value={rol.id}>
                      {rol.nombre} - {rol.descripcion}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="1">Administrador</option>
                    <option value="2">Planificador</option>
                    <option value="3">Revisor</option>
                    <option value="4">Validador</option>
                  </>
                )}
              </select>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {usuario ? 'Nueva Contrasena (dejar vacio para mantener)' : 'Contrasena *'}
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required={!usuario}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Contrasena"
              />
            </div>

            {/* Estado */}
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="estado"
                  checked={formData.estado}
                  onChange={handleChange}
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
                <span className="ml-2 text-sm text-gray-700">Usuario Activo</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end space-x-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              {loading ? (usuario ? 'Modificando...' : 'Creando...') : (usuario ? 'Modificar Usuario' : 'Crear Usuario')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Componente FormularioRol segun especificacion
function FormularioRol({ rol, onClose, onSave }: {
  rol?: Rol | null;
  onClose: () => void;
  onSave: () => void;
}) {
  const { token } = useAuth();
  const { error, errorType, handleError, clearError } = useErrorHandler();
  const [loading, setLoading] = useState(false);
  
  // Solo los atributos especificados: descripcion, nivel
  const [formData, setFormData] = useState({
    descripcion: rol?.descripcion || '',
    nivel: rol?.nivel?.toString() || '1'
  });

  // Metodo crearRol() segun especificacion
  const crearRol = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    clearError();

    try {
      const url = rol 
        ? buildApiUrl(`/api/roles/${rol.id}`)
        : buildApiUrl('/api/roles');
      
      const method = rol ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          descripcion: formData.descripcion,
          nivel: parseInt(formData.nivel)
        })
      });

      if (response.ok) {
        onSave();
      } else {
        const errorData = await response.json();
        handleError(errorData.message || 'Error al crear rol', 'general');
      }
    } catch (err) {
      console.error('Error al crear rol:', err);
      handleError(err, 'network');
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
      <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
        <h3 className="text-xl font-semibold mb-6">
          {rol ? 'Editar Rol' : 'Crear Nuevo Rol'}
        </h3>

        <ErrorHandler 
          error={error} 
          type={errorType} 
          compact={true}
        />

        <form onSubmit={crearRol}>
          <div className="space-y-4">
            {/* Descripcion */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rol *
              </label>
              <select
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleccionar rol</option>
                <option value="Administrador">Administrador</option>
                <option value="Planificador">Planificador</option>
                <option value="Revisor">Revisor</option>
                <option value="Validador">Validador</option>
              </select>
            </div>

            {/* Nivel */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nivel de Acceso *
              </label>
              <select
                name="nivel"
                value={formData.nivel}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="1">1 - Administrador (Acceso Total)</option>
                <option value="2">2 - Planificador (Gestion de Proyectos)</option>
                <option value="3">3 - Revisor (Revision y Seguimiento)</option>
                <option value="4">4 - Validador (Validacion Final)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              {loading ? 'Creando...' : (rol ? 'Actualizar Rol' : 'Crear Rol')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
