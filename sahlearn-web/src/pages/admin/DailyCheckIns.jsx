import { useEffect, useState, useCallback, useRef } from 'react';
import { Trash2, Download, Search, CheckSquare, Square, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getAdminCheckIns,
  deleteCheckIn,
  deleteCheckIns,
  deleteAllCheckIns,
  exportCheckIns,
} from '../../services/dailyCheckIn.service';

function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={20} className="text-red-500" />
          </div>
          <p className="font-semibold text-ink-900">Confirm Delete</p>
        </div>
        <p className="text-sm text-ink-600 mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-ink-700 border border-ink-200 rounded-lg hover:bg-surface-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

const PAGE_SIZE = 20;

export default function DailyCheckIns() {
  const [records, setRecords] = useState([]);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1, page: 1 });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(new Set());
  const [confirm, setConfirm] = useState(null);
  const [exporting, setExporting] = useState(false);
  const searchTimeout = useRef(null);

  const load = useCallback(async (p = 1, q = search) => {
    setLoading(true);
    try {
      const { data, meta: m } = await getAdminCheckIns({ page: p, limit: PAGE_SIZE, search: q });
      setRecords(data);
      setMeta(m);
      setPage(p);
      setSelected(new Set());
    } catch {
      toast.error('Failed to load attendance records');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { load(1, ''); }, []);

  const handleSearch = (val) => {
    setSearch(val);
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => load(1, val), 400);
  };

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === records.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(records.map((r) => r._id)));
    }
  };

  const handleDeleteOne = (id) => {
    setConfirm({
      message: 'Delete this attendance record?',
      onConfirm: async () => {
        setConfirm(null);
        try {
          await deleteCheckIn(id);
          toast.success('Record deleted');
          load(page);
        } catch {
          toast.error('Failed to delete record');
        }
      },
    });
  };

  const handleDeleteSelected = () => {
    const ids = [...selected];
    setConfirm({
      message: `Delete ${ids.length} selected record${ids.length !== 1 ? 's' : ''}?`,
      onConfirm: async () => {
        setConfirm(null);
        try {
          await deleteCheckIns(ids);
          toast.success('Records deleted');
          load(page);
        } catch {
          toast.error('Failed to delete records');
        }
      },
    });
  };

  const handleDeleteAll = () => {
    setConfirm({
      message: `Delete ALL ${meta.total} attendance records? This cannot be undone.`,
      onConfirm: async () => {
        setConfirm(null);
        try {
          await deleteAllCheckIns();
          toast.success('All records deleted');
          load(1);
        } catch {
          toast.error('Failed to delete all records');
        }
      },
    });
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportCheckIns();
      toast.success('CSV downloaded');
    } catch {
      toast.error('Export failed');
    } finally {
      setExporting(false);
    }
  };

  const allSelected = records.length > 0 && selected.size === records.length;

  return (
    <div className="space-y-5">
      {confirm && (
        <ConfirmModal
          message={confirm.message}
          onConfirm={confirm.onConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}

      <div>
        <h1 className="text-2xl font-display text-ink-900">Daily Check-ins</h1>
        <p className="text-xs text-ink-400 mt-0.5">Student attendance records</p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search by name or Reg No."
            className="w-full pl-9 pr-4 py-2 text-sm border border-ink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {selected.size > 0 && (
            <button
              onClick={handleDeleteSelected}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
            >
              <Trash2 size={14} /> Delete Selected ({selected.size})
            </button>
          )}
          <button
            onClick={handleDeleteAll}
            disabled={meta.total === 0}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-40 transition-colors"
          >
            <Trash2 size={14} /> Delete All
          </button>
          <button
            onClick={handleExport}
            disabled={exporting || meta.total === 0}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-ink-700 border border-ink-200 rounded-lg hover:bg-surface-50 disabled:opacity-40 transition-colors"
          >
            <Download size={14} /> {exporting ? 'Exporting…' : 'Export CSV'}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-surface-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : records.length === 0 ? (
          <div className="py-16 text-center text-sm text-ink-400">
            {search ? 'No records match your search.' : 'No attendance records yet.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-50 text-left text-xs text-ink-500 uppercase tracking-wider border-b border-surface-100">
                  <th className="px-4 py-3 w-10">
                    <button onClick={toggleAll} className="text-ink-400 hover:text-ink-700">
                      {allSelected ? <CheckSquare size={16} className="text-brand-primary" /> : <Square size={16} />}
                    </button>
                  </th>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Reg No.</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Time</th>
                  <th className="px-4 py-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {records.map((r) => (
                  <tr key={r._id} className={`hover:bg-surface-50 transition-colors ${selected.has(r._id) ? 'bg-brand-primary/5' : ''}`}>
                    <td className="px-4 py-3">
                      <button onClick={() => toggleSelect(r._id)} className="text-ink-400 hover:text-ink-700">
                        {selected.has(r._id) ? <CheckSquare size={16} className="text-brand-primary" /> : <Square size={16} />}
                      </button>
                    </td>
                    <td className="px-4 py-3 font-medium text-ink-900">{r.name}</td>
                    <td className="px-4 py-3 text-ink-600">{r.regNo}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-green-50 text-green-700">
                        Present
                      </span>
                    </td>
                    <td className="px-4 py-3 text-ink-600">{r.date}</td>
                    <td className="px-4 py-3 text-ink-600">{r.time}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDeleteOne(r._id)}
                        className="p-1.5 text-ink-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {meta.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-surface-100 flex items-center justify-between text-sm text-ink-500">
            <span>{meta.total} total records</span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => load(page - 1)}
                className="px-3 py-1.5 border border-ink-200 rounded-lg disabled:opacity-40 hover:bg-surface-50 transition-colors"
              >
                Prev
              </button>
              <span className="px-2">Page {page} of {meta.totalPages}</span>
              <button
                disabled={page >= meta.totalPages}
                onClick={() => load(page + 1)}
                className="px-3 py-1.5 border border-ink-200 rounded-lg disabled:opacity-40 hover:bg-surface-50 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
