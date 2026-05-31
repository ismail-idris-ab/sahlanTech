// sahlearn-web/src/components/common/Pagination.jsx
export default function Pagination({ page, totalPages, total, pageSize, onPage }) {
  if (totalPages <= 1) return null;

  const shown = Math.min(pageSize, total - (page - 1) * pageSize);

  /* sliding window: up to 5 page buttons centred on current page */
  const start = Math.max(1, Math.min(page - 2, totalPages - 4));
  const end   = Math.min(totalPages, start + 4);
  const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  return (
    <div className="flex items-center justify-between px-5 py-3 bg-surface-50 border-t border-surface-200">
      <p className="text-xs text-ink-400">
        Showing {shown} of {total}
      </p>
      <div className="flex gap-1.5">
        <button
          onClick={() => onPage(page - 1)}
          disabled={page === 1}
          className="px-3 py-1.5 text-xs font-medium border border-surface-300 rounded-lg disabled:opacity-40 hover:bg-surface-100 transition bg-white text-ink-600"
        >
          ← Prev
        </button>
        {pages.map((p) => (
          <button
            key={p}
            onClick={() => onPage(p)}
            className="px-3 py-1.5 text-xs font-medium rounded-lg transition"
            style={page === p
              ? { background: '#068562', color: '#fff' }
              : { background: '#fff', color: '#506860', border: '1px solid rgba(168,196,188,0.4)' }
            }
          >
            {p}
          </button>
        ))}
        <button
          onClick={() => onPage(page + 1)}
          disabled={page === totalPages}
          className="px-3 py-1.5 text-xs font-medium border border-surface-300 rounded-lg disabled:opacity-40 hover:bg-surface-100 transition bg-white text-ink-600"
        >
          Next →
        </button>
      </div>
    </div>
  );
}
