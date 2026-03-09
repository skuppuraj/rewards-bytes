import React from 'react';
export default function Pagination({ page, totalPages, onPageChange, perPage, onPerPageChange, perPageOptions = [10, 20, 50, 100, 500] }) {
  return (
    <div className="flex items-center justify-between mt-4">
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500">Rows per page:</span>
        <select value={perPage} onChange={e => onPerPageChange(Number(e.target.value))} className="input w-20 py-1">
          {perPageOptions.map(n => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>
      <div className="flex items-center gap-1">
        <button onClick={() => onPageChange(page - 1)} disabled={page <= 1} className="px-3 py-1 rounded-lg border text-sm disabled:opacity-40 hover:bg-gray-50">←</button>
        <span className="px-3 py-1 text-sm text-gray-600">Page {page} of {totalPages}</span>
        <button onClick={() => onPageChange(page + 1)} disabled={page >= totalPages} className="px-3 py-1 rounded-lg border text-sm disabled:opacity-40 hover:bg-gray-50">→</button>
      </div>
    </div>
  );
}
