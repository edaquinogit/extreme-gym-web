import { DataTable } from '../../components/tables/DataTable'
import { PageHeader } from '../../components/ui/PageHeader'
import { StateMessage } from '../../components/ui/StateMessage'
import { useResourceList } from '../../hooks/useResourceList'
import { pagamentoService } from '../../services/pagamentoService'
import { formatCurrency } from '../../utils/formatCurrency'
import { formatDate } from '../../utils/formatDate'

export function PagamentosPage() {
  const { data: pagamentos, errorMessage, isLoading } = useResourceList({
    load: pagamentoService.listar,
  })

  return (
    <>
      <PageHeader
        eyebrow="Pagamentos"
        title="Controle financeiro"
        description="Tabela preparada para status, valor, vencimento e relacionamento com aluno ou matricula."
      />

      <section className="content-panel">
        {isLoading && <StateMessage title="Carregando pagamentos..." />}
        {!isLoading && errorMessage && (
          <StateMessage title="Nao foi possivel carregar os pagamentos" description={errorMessage} />
        )}
        {!isLoading && !errorMessage && pagamentos.length === 0 && (
          <StateMessage title="Nenhum pagamento encontrado" description="Os pagamentos da API aparecerao aqui." />
        )}
        {!isLoading && !errorMessage && pagamentos.length > 0 && (
          <DataTable headers={['ID', 'Aluno', 'Matricula', 'Valor', 'Status', 'Vencimento', 'Pagamento']}>
            {pagamentos.map((pagamento) => (
              <tr key={pagamento.id}>
                <td>{pagamento.id}</td>
                <td>{pagamento.alunoNome ?? '-'}</td>
                <td>{pagamento.matriculaId ?? '-'}</td>
                <td>{formatCurrency(pagamento.valor)}</td>
                <td><span className="status-badge">{pagamento.status}</span></td>
                <td>{formatDate(pagamento.dataVencimento)}</td>
                <td>{formatDate(pagamento.dataPagamento)}</td>
              </tr>
            ))}
          </DataTable>
        )}
      </section>
    </>
  )
}
