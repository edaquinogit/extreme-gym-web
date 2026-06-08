type TablePaginationProps = {
  page: number
  pageSize: number
  totalItems: number
  onPageChange: (page: number) => void
}

export function TablePagination({
  page,
  pageSize,
  totalItems,
  onPageChange,
}: TablePaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const startItem = totalItems === 0 ? 0 : (page - 1) * pageSize + 1
  const endItem = Math.min(totalItems, page * pageSize)

  return (
    <div className="table-pagination">
      <span>
        {startItem}-{endItem} de {totalItems}
      </span>
      <div className="table-pagination-actions">
        <button
          type="button"
          className="ghost-button btn-sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Anterior
        </button>
        <strong>
          {page}/{totalPages}
        </strong>
        <button
          type="button"
          className="ghost-button btn-sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Proxima
        </button>
      </div>
    </div>
  )
}
