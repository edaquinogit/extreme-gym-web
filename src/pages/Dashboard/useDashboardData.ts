import { useEffect, useState } from 'react'
import { alunosService } from '../../services/alunosService'
import { matriculaService } from '../../services/matriculaService'
import { pagamentoService } from '../../services/pagamentoService'
import { checkinService } from '../../services/checkinService'
import { formatCurrency } from '../../utils/formatCurrency'

type DashboardState = {
  loading: boolean
  error?: string | null
  alunosAtivos?: number
  matriculasAtivas?: number
  pagamentosPendentes?: number
  checkinsHoje?: number
  receitaMensal?: string
  pagamentosPendentesLista?: DashboardPaymentItem[]
  pagamentosPorStatus?: Array<{ name: string; value: number }>
  checkinsPorDia?: Array<{ day: string; count: number }>
  receitaPorMes?: Array<{ month: string; value: number }>
  matriculasPorStatus?: Array<{ name: string; value: number }>
}

export type DashboardPaymentItem = {
  id: number
  alunoNome?: string
  matriculaId?: number
  status: string
  valor: number
}

function isToday(dateStr?: string) {
  if (!dateStr) return false
  const d = new Date(dateStr)
  const now = new Date()
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  )
}

export function useDashboardData() {
  const [state, setState] = useState<DashboardState>({ loading: true })

  useEffect(() => {
    let mounted = true

    async function load() {
      setState({ loading: true })

      try {
        const [alunosRes, matriculasRes, pagamentosRes, checkinsRes] = await Promise.all([
          alunosService.listar(),
          matriculaService.listar(),
          pagamentoService.listar(),
          checkinService.listar(),
        ])

        if (!mounted) return

        const alunos = Array.isArray(alunosRes) ? alunosRes : []
        const matriculas = Array.isArray(matriculasRes) ? matriculasRes : []
        const pagamentos = Array.isArray(pagamentosRes) ? pagamentosRes : []
        const checkins = Array.isArray(checkinsRes) ? checkinsRes : []

        const alunosAtivos = alunos.filter((a) => a.status === 'ATIVO').length
        const matriculasAtivas = matriculas.filter((m) => m.status === 'ATIVA').length
        const pagamentosPendentes = pagamentos.filter((p) => p.status === 'PENDENTE').length
        const checkinsHoje = checkins.filter((c) => isToday(c.dataHora)).length

        const pagamentosPorStatus = Object.entries(
          pagamentos.reduce<Record<string, number>>((acc, p) => {
            const s = p.status ?? 'OUTROS'
            acc[s] = (acc[s] || 0) + 1
            return acc
          }, {}),
        ).map(([name, value]) => ({ name, value }))

        const months: Array<{ key: string; label: string }> = []
        const now = new Date()
        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
          const key = `${d.getFullYear()}-${d.getMonth() + 1}`
          const label = d.toLocaleString('pt-BR', { month: 'short', year: '2-digit' })
          months.push({ key, label })
        }

        const receitaPorMes = months.map((m) => {
          const [y, mo] = m.key.split('-').map(Number)
          const total = pagamentos
            .filter((p) => p.status === 'PAGO' && p.dataPagamento)
            .filter((p) => {
              const d = new Date(p.dataPagamento!)
              return d.getFullYear() === y && d.getMonth() + 1 === mo
            })
            .reduce((s, p) => s + (p.valor ?? 0), 0)
          return { month: m.label, value: total }
        })

        const daysKeys: Array<{ key: string; day: string }> = []
        for (let i = 6; i >= 0; i--) {
          const d = new Date()
          d.setDate(d.getDate() - i)
          const key = d.toISOString().slice(0, 10)
          daysKeys.push({ key, day: d.toLocaleDateString('pt-BR', { weekday: 'short' }) })
        }
        const checkinsMap = daysKeys.reduce<Record<string, { day: string; count: number }>>((acc, cur) => {
          acc[cur.key] = { day: cur.day, count: 0 }
          return acc
        }, {})
        checkins.forEach((c) => {
          const key = c.dataHora ? new Date(c.dataHora).toISOString().slice(0, 10) : null
          if (key && checkinsMap[key]) {
            checkinsMap[key].count += 1
          }
        })
        const checkinsPorDia = Object.values(checkinsMap).map((v) => ({ day: v.day, count: v.count }))

        const matriculasPorStatus = Object.entries(
          matriculas.reduce<Record<string, number>>((acc, m) => {
            const s = m.status ?? 'OUTROS'
            acc[s] = (acc[s] || 0) + 1
            return acc
          }, {}),
        ).map(([name, value]) => ({ name, value }))

        const pagamentosPendentesLista = pagamentos
          .filter((p) => p.status === 'PENDENTE')
          .sort((a, b) => compareDates(a.dataCadastro, b.dataCadastro))
          .slice(0, 5)
          .map(toPaymentItem)

        setState({
          loading: false,
          alunosAtivos,
          matriculasAtivas,
          pagamentosPendentes,
          checkinsHoje,
          receitaMensal: formatCurrency(
            receitaPorMes.reduce((s, m) => s + (m.value ?? 0), 0),
          ),
          pagamentosPendentesLista,
          pagamentosPorStatus,
          receitaPorMes,
          checkinsPorDia,
          matriculasPorStatus,
        })
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err)
        setState({ loading: false, error: message ?? 'Erro ao carregar dados' })
      }
    }

    load()

    return () => {
      mounted = false
    }
  }, [])

  return state
}

export default useDashboardData

function toPaymentItem(payment: {
  id: number
  alunoNome?: string
  matriculaId?: number
  status: string
  valor: number
}): DashboardPaymentItem {
  return {
    id: payment.id,
    alunoNome: payment.alunoNome,
    matriculaId: payment.matriculaId,
    status: payment.status,
    valor: payment.valor,
  }
}

function compareDates(first?: string, second?: string) {
  return getDateTime(first) - getDateTime(second)
}

function getDateTime(value?: string) {
  return value ? new Date(value).getTime() : Number.MAX_SAFE_INTEGER
}
