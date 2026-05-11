import { useState } from 'react'
import { HomePage } from './pages/HomePage'
import { AlunosPage } from './pages/AlunosPage'

type AppPage = 'home' | 'alunos'

function App() {
  const [currentPage, setCurrentPage] = useState<AppPage>('home')

  if (currentPage === 'alunos') {
    return <AlunosPage onBack={() => setCurrentPage('home')} />
  }

  return <HomePage onOpenAlunos={() => setCurrentPage('alunos')} />
}

export default App
