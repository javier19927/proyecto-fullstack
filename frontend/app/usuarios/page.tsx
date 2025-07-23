'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function UsuariosPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirigir al Modulo 1 con la pestana de usuarios
    router.replace('/configuracion-institucional?tab=usuarios')
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirigiendo al Modulo 1...</p>
        <p className="text-sm text-gray-500">La gestion de usuarios ahora esta en Configuracion Institucional</p>
      </div>
    </div>
  )
}