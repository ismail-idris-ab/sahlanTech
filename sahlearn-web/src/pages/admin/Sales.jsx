import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Receipt as ReceiptIcon, Plus, Download, Trash2 } from 'lucide-react';
import { listSales, exportSalesCsv, bulkDeleteSales } from '../../services/adminSales.service';
import { formatNaira } from '../../services/receipts.service';
import Pagination from '../../components/common/Pagination';
import EmptyState from '../../components/common/EmptyState';
import Modal from '../../components/common/Modal';

const PAGE_SIZE = 20;

const STATUS_STYLES = {
  unpaid: 'bg-red-50 text-red-700',
  part_paid: 'bg-amber-50 text-amber-700',
  paid: 'bg-green-50 text-green-700',
  void: 'bg-surface-100 text-ink-500',
};
const STATUS_LABEL = { unpaid: 'Unpaid', part_paid: 'Part paid', paid: 'Paid', void: 'Void' };

export default function Sales() {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ page: 1, total: 0, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [selected, setSelected] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listSales({ page, limit: PAGE_SIZE, status, q });
      setRows(res.data);
      setMeta(res.meta);
      // A selection is only meaningful for rows still on screen.
      setSelected([]);
    } catch {
      toast.error('Failed to load sales');
    } finally {
      setLoading(false);
    }
  }, [page, status, q]);

  useEffect(() => {
    load();
  }, [load]);

  const handleExport = async () => {
    setExporting(true);
    try {
      // Exports what is on screen, filter and search included.
      await exportSalesCsv({ status, q });
    } catch {
      toast.error('Export failed');
    } finally {
      setExporting(false);
    }
  };

  const allSelected = rows.length > 0 && selected.length === rows.length;

  const toggleRow = (id) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const toggleAll = () => setSelected(allSelected ? [] : rows.map((r) => r.id));

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await bulkDeleteSales(selected);
      toast.success(`${res.deleted} sale${res.deleted === 1 ? '' : 's'} deleted`);
      setConfirmDelete(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display text-ink-900">Sales &amp; Receipts</h1>
          <p className="text-xs text-ink-400 mt-0.5">
            {meta.total} sale{meta.total === 1 ? '' : 's'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            disabled={exporting || rows.length === 0}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-surface-300 text-ink-700 text-sm font-semibold rounded-xl hover:bg-surface-100 transition disabled:opacity-50"
          >
            <Download size={15} /> {exporting ? 'Exporting...' : 'Export'}
          </button>
          <Link
            to="/admin/sales/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-primary text-white text-sm font-semibold rounded-xl hover:bg-brand-primary/90 transition"
          >
            <Plus size={15} /> New sale
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <input
          value={q}
          onChange={(e) => {
            setPage(1);
            setQ(e.target.value);
          }}
          placeholder="Search name, phone or sale number"
          className="flex-1 min-w-[12rem] px-3 py-2 border border-surface-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
        />
        <select
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value);
          }}
          className="px-3 py-2 border border-surface-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
        >
          <option value="">All statuses</option>
          <option value="unpaid">Unpaid</option>
          <option value="part_paid">Part paid</option>
          <option value="paid">Paid</option>
          <option value="void">Void</option>
        </select>
      </div>

      {selected.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-xl bg-brand-primary/5 border border-brand-primary/20">
          <p className="text-sm text-ink-700">
            <span className="font-semibold">{selected.length}</span> selected
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelected([])}
              className="text-xs font-medium text-ink-500 hover:text-ink-900 px-2 py-1.5"
            >
              Clear
            </button>
            <button
              onClick={() => setConfirmDelete(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition"
            >
              <Trash2 size={13} /> Delete selected
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-ink-300/20 overflow-hidden shadow-card">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-7 h-7 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={ReceiptIcon}
            title="No sales yet"
            description="Record your first sale to issue a receipt."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-200 bg-surface-50 text-left">
                  <th className="pl-5 pr-2 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleAll}
                      aria-label="Select every sale on this page"
                      className="w-4 h-4 rounded border-surface-300 text-brand-primary focus:ring-brand-primary/30"
                    />
                  </th>
                  <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-ink-400">Sale</th>
                  <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-ink-400">Customer</th>
                  <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-ink-400">Total</th>
                  <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-ink-400">Balance</th>
                  <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-ink-400">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {rows.map((s) => (
                  <tr
                    key={s.id}
                    className={`transition-colors ${
                      selected.includes(s.id) ? 'bg-brand-primary/5' : 'hover:bg-surface-50'
                    }`}
                  >
                    <td className="pl-5 pr-2 py-3.5">
                      <input
                        type="checkbox"
                        checked={selected.includes(s.id)}
                        onChange={() => toggleRow(s.id)}
                        aria-label={`Select ${s.saleNo}`}
                        className="w-4 h-4 rounded border-surface-300 text-brand-primary focus:ring-brand-primary/30"
                      />
                    </td>
                    <td className="px-5 py-3.5">
                      <Link
                        to={`/admin/sales/${s.id}`}
                        className="font-mono text-xs text-brand-primary hover:underline"
                      >
                        {s.saleNo}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 text-ink-700">{s.customer?.fullName}</td>
                    <td className="px-5 py-3.5 text-ink-900 font-semibold">{formatNaira(s.total)}</td>
                    <td className="px-5 py-3.5 text-ink-700">{formatNaira(s.balance)}</td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ${STATUS_STYLES[s.status]}`}
                      >
                        {STATUS_LABEL[s.status]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination
          page={page}
          totalPages={meta.totalPages}
          total={meta.total}
          pageSize={PAGE_SIZE}
          onPage={setPage}
        />
      </div>

      <Modal
        isOpen={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title={`Delete ${selected.length} sale${selected.length === 1 ? '' : 's'}`}
      >
        <p className="text-sm text-ink-600">
          This removes {selected.length === 1 ? 'the sale' : 'these sales'} from your records for
          good, along with any receipt issued against{' '}
          {selected.length === 1 ? 'it' : 'them'} — a receipt link already sent to a customer will
          stop opening. Void a sale instead if you only want to cancel it.
        </p>
        <div className="flex gap-3 mt-5">
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 transition disabled:opacity-60"
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
          <button
            onClick={() => setConfirmDelete(false)}
            className="px-4 py-2 border border-surface-300 text-ink-700 font-medium rounded-xl hover:bg-surface-100 transition"
          >
            Cancel
          </button>
        </div>
      </Modal>
    </div>
  );
}
