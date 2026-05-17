import { DataTable } from '../../components/tables/DataTable'
import { PageHeader } from '../../components/ui/PageHeader'
import { StateMessage } from '../../components/ui/StateMessage'
import { useResourceList } from '../../hooks/useResourceList'
import { planoService } from '../../services/planoService'
import { formatCurrency } from '../../utils/formatCurrency'

export function PlanosPage() {
  const { data: planos, errorMessage, isLoading } = useResourceList({
    load: planoService.listar,
  })

  return (
    <>
      <PageHeader
        eyebrow="Planos"
        title="Planos da academia"
        description="Tabela inicial para acompanhar planos ativos e inativos vindos de /planos."
        action={<button className="primary-button compact" type="button">Novo plano</button>}
      />

      <section className="content-panel">
        {isLoading && <StateMessage title="Carregando planos..." />}
        {!isLoading && errorMessage && (
          <StateMessage title="Nao foi possivel carregar os planos" description={errorMessage} />
        )}
        {!isLoading && !errorMessage && planos.length === 0 && (
          <StateMessage title="Nenhum plano encontrado" description="Cadastre planos na API para visualiza-los aqui." />
        )}
        {!isLoading && !errorMessage && planos.length > 0 && (
          <DataTable headers={['ID', 'Nome', 'Valor', 'Duracao', 'Status']}>
            {planos.map((plano) => (
              <tr key={plano.id}>
                <td>{plano.id}</td>
                <td>{plano.nome}</td>
                <td>{formatCurrency(plano.valor)}</td>
                <td>{plano.duracaoDias ? `${plano.duracaoDias} dias` : '-'}</td>
                <td><span className="status-badge">{plano.status}</span></td>
              </tr>
            ))}
          </DataTable>
        )}
      </section>
    </>
  )
}
