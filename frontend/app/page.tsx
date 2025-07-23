import { redirect } from 'next/navigation'

export default function Home() {
  // Redirigir automaticamente a la pagina de login
  redirect('/login')
}
