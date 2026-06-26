export const pageSizeOptions = [10, 25, 50, 100];

export function getPageCount(totalItems, pageSize) {
  return Math.max(1, Math.ceil(totalItems / pageSize));
}

export function getPaginatedItems(items, page, pageSize) {
  const startIndex = (page - 1) * pageSize;

  return items.slice(startIndex, startIndex + pageSize);
}

export default function PaginationControls({
  page,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
}) {
  const pageCount = getPageCount(totalItems, pageSize);
  const safePage = Math.min(Math.max(page, 1), pageCount);
  const startItem = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endItem = Math.min(totalItems, safePage * pageSize);

  return (
    <div className="admin-pagination">
      <div className="admin-pagination__details">
        <span>
          {startItem}-{endItem} of {totalItems}
        </span>
        <label>
          Rows
          <select
            value={pageSize}
            onChange={(event) => {
              onPageSizeChange(Number(event.target.value));
              onPageChange(1);
            }}
          >
            {pageSizeOptions.map((option) => (
              <option value={option} key={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="admin-pagination__actions" aria-label="Pagination">
        <button
          className="admin-button admin-button--small admin-button--ghost"
          disabled={safePage <= 1}
          type="button"
          onClick={() => onPageChange(1)}
        >
          First
        </button>
        <button
          className="admin-button admin-button--small admin-button--ghost"
          disabled={safePage <= 1}
          type="button"
          onClick={() => onPageChange(safePage - 1)}
        >
          Previous
        </button>
        <span className="admin-pagination__page">
          Page {safePage} of {pageCount}
        </span>
        <button
          className="admin-button admin-button--small admin-button--ghost"
          disabled={safePage >= pageCount}
          type="button"
          onClick={() => onPageChange(safePage + 1)}
        >
          Next
        </button>
        <button
          className="admin-button admin-button--small admin-button--ghost"
          disabled={safePage >= pageCount}
          type="button"
          onClick={() => onPageChange(pageCount)}
        >
          Last
        </button>
      </div>
    </div>
  );
}
