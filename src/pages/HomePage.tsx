import { ApiStatus } from '../components/ApiStatus'

type HomePageProps = {
  onOpenAlunos: () => void
}

export function HomePage({ onOpenAlunos }: HomePageProps) {
  return (
    <main className="home-page">
      <section className="home-hero">
        <p className="eyebrow">Extreme Gym Web</p>
        <h1>Frontend preparado para consumir a Extreme Gym API</h1>
        <p className="hero-description">
          Esta aplicacao React, TypeScript e Vite esta organizada para integrar
          com o backend Spring Boot local.
        </p>
        <ApiStatus />
        <button className="primary-button" type="button" onClick={onOpenAlunos}>
          Ver alunos
        </button>
      </section>
    </main>
  )
}
