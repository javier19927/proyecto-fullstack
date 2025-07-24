import type { Metadata, Viewport } from 'next'
import AuthWrapper from './components/AuthWrapper'
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
      <body className="h-full">
        <AuthWrapper>
          {children}
        </AuthWrapper>
      </body>
    </html>
  )
}
