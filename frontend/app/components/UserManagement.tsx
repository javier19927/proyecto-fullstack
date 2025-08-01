'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { buildApiUrl, buildHeaders } from '../utils/apiConfig';
import { useErrorHandler } from '../hooks/useErrorHandler';

interface Usuario {
  id: number;
  nombre: string;
  email: string;
  roles: string[];
  estado: boolean;
  institucion_id?: number;
  institucion_nombre?: string;
  created_at: string;
  last_login?: string;
}

interface Rol {
  id: string;
  nombre: string;
  descripcion: string;
}

interface Institucion {
  id: number;
  nombre: string;
  codigo: string;
}

export default function UserManagement() {
  const { token } = useAuth();
  const { error, errorType, handleError, clearError } = useErrorHandler();
  
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [instituciones, setInstituciones] = useState<Institucion[]>([]);
  const [loading, setLoading] = useState(false);
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);

  // Formulario de usuario
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    confirmPassword: '',
    roles: [] as string[],
    institucion_id: '',
    estado: true
  });

  const rolesDefinidos: Rol[] = [
    {
      id: '1',
      nombre: 'Administrador del Sistema',
      descripcion: 'Configurar el sistema institucionalmente, gestionar usuarios y supervisar la planificación.'
    },
    {
      id: '2',
      nombre: 'Técnico Planificador',
      descripcion: 'Registrar y gestionar toda la planificación estratégica (objetivos, metas, indicadores, proyectos, presupuesto).'
    },
    {
      id: '4',
      nombre: 'Revisor Institucional',
      descripcion: 'Evaluar y decidir sobre la validez de los proyectos de inversión.'
    },
    {
      id: '3',
      nombre: 'Autoridad Validadora',
      descripcion: 'Evaluar y aprobar o rechazar los objetivos estratégicos institucionales.'
    },
    {
      id: '5',
      nombre: 'Consultor',
      descripcion: 'Usuario con acceso de solo lectura a la información del sistema.'
    }
  ];

  useEffect(() => {
    if (token) {
      cargarDatos();
    }
  }, [token]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      await Promise.all([
        cargarUsuarios(),
        cargarInstituciones()
      ]);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const cargarUsuarios = async () => {
    if (!token) {
      console.log('❌ No hay token disponible para cargar usuarios');
      return;
    }

    try {
      console.log('🔍 Cargando usuarios...');
      console.log('🔑 Token disponible:', token ? 'SÍ' : 'NO');
      console.log('🌐 URL completa:', buildApiUrl('/api/usuarios/all'));
      
      const response = await fetch(buildApiUrl('/api/usuarios/all'), {
        headers: buildHeaders(token)
      });

      console.log('📡 Respuesta usuarios:', response.status, response.statusText);

      if (response.ok) {
        const data = await response.json();
        console.log('📋 Datos de usuarios recibidos:', data);
        
        if (data.success && data.data) {
          setUsuarios(data.data);
          console.log('✅ Usuarios cargados exitosamente:', data.data.length);
        } else {
          console.error('❌ Formato de respuesta inesperado:', data);
          handleError(new Error('Formato de respuesta inesperado'), 'data');
        }
      } else {
        const errorText = await response.text();
        console.error('❌ Error en respuesta usuarios:', errorText);
        handleError(new Error(`Error ${response.status}: ${errorText}`), 'data');
      }
    } catch (error) {
      console.error('❌ Error en cargarUsuarios:', error);
      handleError(error as Error, 'network');
    }
  };

  const cargarInstituciones = async () => {
    if (!token) {
      console.log('❌ No hay token disponible para cargar instituciones');
      return;
    }

    try {
      console.log('🔍 Cargando instituciones...');
      const response = await fetch(buildApiUrl('/api/instituciones/all'), {
        headers: buildHeaders(token)
      });

      console.log('📡 Respuesta instituciones:', response.status, response.statusText);

      if (response.ok) {
        const data = await response.json();
        console.log('🏢 Datos de instituciones recibidos:', data);
        
        if (data.success && data.data) {
          setInstituciones(data.data);
          console.log('✅ Instituciones cargadas exitosamente:', data.data.length);
        } else {
          console.error('❌ Formato de respuesta inesperado en instituciones:', data);
          handleError(new Error('Error al cargar instituciones'), 'data');
        }
      } else {
        const errorText = await response.text();
        console.error('❌ Error en respuesta instituciones:', errorText);
        handleError(new Error(`Error ${response.status}: ${errorText}`), 'data');
      }
    } catch (error) {
      console.error('❌ Error en cargarInstituciones:', error);
      handleError(error as Error, 'network');
    }
  };

  const crearUsuario = async () => {
    try {
      if (formData.password !== formData.confirmPassword) {
        handleError(new Error('Las contraseñas no coinciden'), 'data');
        return;
      }

      const userData = {
        nombreCompleto: formData.nombre,
        correo: formData.email,
        password: formData.password,
        rol: formData.roles && formData.roles.length > 0 ? parseInt(formData.roles[0]) : null,
        institucion_id: formData.institucion_id ? parseInt(formData.institucion_id) : null,
        estado: formData.estado
      };

      const response = await fetch(buildApiUrl('/api/usuarios'), {
        method: 'POST',
        headers: buildHeaders(token),
        body: JSON.stringify(userData)
      });

      if (response.ok) {
        const data = await response.json();
        setUsuarios(prev => [data.data, ...prev]);
        resetForm();
        setShowUserForm(false);
        clearError();
      } else {
        const errorData = await response.json();
        handleError(new Error(errorData.error || 'Error al crear usuario'), 'data');
      }
    } catch (error) {
      handleError(error as Error, 'network');
    }
  };

  const editarUsuario = async () => {
    if (!editingUser) return;

    try {
      const userData = {
        nombreCompleto: formData.nombre,
        correo: formData.email,
        rol: formData.roles && formData.roles.length > 0 ? parseInt(formData.roles[0]) : null,
        institucion_id: formData.institucion_id ? parseInt(formData.institucion_id) : null,
        estado: formData.estado
      };

      // Solo incluir password si se proporcionó
      if (formData.password) {
        if (formData.password !== formData.confirmPassword) {
          handleError(new Error('Las contraseñas no coinciden'), 'data');
          return;
        }
        (userData as any).password = formData.password;
      }

      const response = await fetch(buildApiUrl(`/api/usuarios/${editingUser.id}`), {
        method: 'PUT',
        headers: buildHeaders(token),
        body: JSON.stringify(userData)
      });

      if (response.ok) {
        const data = await response.json();
        setUsuarios(prev => prev.map(u => u.id === editingUser.id ? data.data : u));
        resetForm();
        setShowUserForm(false);
        setEditingUser(null);
        clearError();
      } else {
        const errorData = await response.json();
        handleError(new Error(errorData.error || 'Error al editar usuario'), 'data');
      }
    } catch (error) {
      handleError(error as Error, 'network');
    }
  };

  const toggleEstadoUsuario = async (userId: number, estadoActual: boolean) => {
    try {
      const action = estadoActual ? 'inactivar' : 'activar';
      const response = await fetch(buildApiUrl(`/api/usuarios/${userId}/${action}`), {
        method: 'PATCH',
        headers: buildHeaders(token)
      });

      if (response.ok) {
        setUsuarios(prev => prev.map(u => 
          u.id === userId ? { ...u, estado: !estadoActual } : u
        ));
        clearError();
      } else {
        const errorData = await response.json();
        handleError(new Error(errorData.error || `Error al ${action} usuario`), 'data');
      }
    } catch (error) {
      handleError(error as Error, 'network');
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      email: '',
      password: '',
      confirmPassword: '',
      roles: [],
      institucion_id: '',
      estado: true
    });
  };

  const openEditForm = (usuario: Usuario) => {
    setEditingUser(usuario);
    setFormData({
      nombre: usuario.nombre,
      email: usuario.email,
      password: '',
      confirmPassword: '',
      roles: usuario.roles.map(r => r.toString()),
      institucion_id: usuario.institucion_id?.toString() || '',
      estado: usuario.estado
    });
    setShowUserForm(true);
  };

  const handleRoleChange = (roleId: string, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        roles: [...prev.roles, roleId]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        roles: prev.roles.filter(r => r !== roleId)
      }));
    }
  };

  const getRoleName = (roleId: string) => {
    const rol = rolesDefinidos.find(r => r.id === roleId);
    return rol ? rol.nombre : roleId;
  };

  const getEstadoBadge = (estado: boolean) => {
    return estado ? (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        Activo
      </span>
    ) : (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
        Inactivo
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h2>
          <p className="text-sm text-gray-600 mt-1">
            Administre usuarios del sistema y asigne roles y permisos
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setEditingUser(null);
            setShowUserForm(true);
          }}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Nuevo Usuario
        </button>
      </div>

      {/* Error Handler */}
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={clearError}
                className="text-red-800 hover:text-red-900"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lista de usuarios */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Usuarios del Sistema</h3>
          {/* Debug info */}
          <div className="text-xs text-gray-500 mt-1">
            Debug: {usuarios.length} usuarios cargados
            {usuarios.length > 0 && ` (${usuarios.map(u => u.nombre).join(', ')})`}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Roles
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Institución
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Último Acceso
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {usuarios.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="text-gray-500">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-2.035M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No hay usuarios</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {loading ? 'Cargando usuarios...' : 'No se encontraron usuarios en el sistema'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                usuarios.map((usuario) => (
                  <tr key={usuario.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{usuario.nombre}</div>
                        <div className="text-sm text-gray-500">{usuario.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {usuario.roles.map((role) => (
                          <span
                            key={role}
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {getRoleName(role)}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {usuario.institucion_nombre || 'Sin asignar'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getEstadoBadge(usuario.estado)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {usuario.last_login 
                        ? new Date(usuario.last_login).toLocaleDateString()
                        : 'Nunca'
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => openEditForm(usuario)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => toggleEstadoUsuario(usuario.id, usuario.estado)}
                          className={`${
                            usuario.estado 
                              ? 'text-red-600 hover:text-red-900' 
                              : 'text-green-600 hover:text-green-900'
                          }`}
                        >
                          {usuario.estado ? 'Desactivar' : 'Activar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de formulario */}
      {showUserForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-screen overflow-y-auto">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
              </h3>
            </div>

            <div className="space-y-4">
              {/* Nombre */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre completo *
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Correo electrónico *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Contraseña */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contraseña {!editingUser && '*'}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required={!editingUser}
                />
                {editingUser && (
                  <p className="text-xs text-gray-500 mt-1">
                    Dejar en blanco para mantener la contraseña actual
                  </p>
                )}
              </div>

              {/* Confirmar contraseña */}
              {formData.password && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirmar contraseña *
                  </label>
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              )}

              {/* Roles */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Roles *
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-md p-3">
                  {rolesDefinidos.map((rol) => (
                    <div key={rol.id} className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id={`role-${rol.id}`}
                          type="checkbox"
                          checked={formData.roles.includes(rol.id)}
                          onChange={(e) => handleRoleChange(rol.id, e.target.checked)}
                          className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                        />
                      </div>
                      <div className="ml-3">
                        <label htmlFor={`role-${rol.id}`} className="text-sm font-medium text-gray-700">
                          {rol.nombre}
                        </label>
                        <p className="text-xs text-gray-500">{rol.descripcion}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Institución */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Institución
                </label>
                <select
                  value={formData.institucion_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, institucion_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccionar institución...</option>
                  {instituciones.map((inst) => (
                    <option key={inst.id} value={inst.id}>
                      {inst.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Estado */}
              <div className="flex items-center">
                <input
                  id="estado"
                  type="checkbox"
                  checked={formData.estado}
                  onChange={(e) => setFormData(prev => ({ ...prev, estado: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="estado" className="ml-2 text-sm text-gray-700">
                  Usuario activo
                </label>
              </div>
            </div>

            {/* Botones */}
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowUserForm(false);
                  setEditingUser(null);
                  resetForm();
                }}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={editingUser ? editarUsuario : crearUsuario}
                disabled={!formData.nombre || !formData.email || formData.roles.length === 0}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
              >
                {editingUser ? 'Actualizar' : 'Crear'} Usuario
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
