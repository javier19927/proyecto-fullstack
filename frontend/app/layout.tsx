import type { Metadata, Viewport } from 'next'
import LogoutButton from './components/LogoutButton'
import Navigation from './components/Navigation'
import './globals.css'

export const metadata: Metadata = {
  title: 'Sistema de Planificacion Estrategica | Gestion Institucional',
  description: 'Plataforma integral para la gestion de objetivos estrategicos, proyectos de inversion y planificacion institucional',
  keywords: 'planificacion, objetivos estrategicos, proyectos, gestion institucional',
  authors: [{ name: 'Sistema de Planificacion' }],
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className="h-full">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="theme-color" content="#4f46e5" />
      </head>
      <body className="h-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="min-h-full">
          <Navigation />
          <main className="relative">
            <div className="animate-fadeIn">
              {children}
            </div>
          </main>
          <LogoutButton />
        </div>
        
        {/* Background decoration */}
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-32 w-96 h-96 bg-gradient-to-br from-purple-200 to-pink-200 rounded-full opacity-30 blur-3xl"></div>
          <div className="absolute -bottom-40 -left-32 w-96 h-96 bg-gradient-to-tr from-blue-200 to-cyan-200 rounded-full opacity-30 blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-indigo-200 to-purple-200 rounded-full opacity-20 blur-3xl"></div>
        </div>
      </body>
    </html>
  )
}
