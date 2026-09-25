import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Receipt as ReceiptIcon, Plus } from 'lucide-react';
import { listSales } from '../../services/adminSales.service';
import { formatNaira } from '../../services/receipts.service';
import Pagination from '../../components/common/Pagination';
import EmptyState from '../../components/common/EmptyState';

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

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listSales({ page, limit: PAGE_SIZE, status, q });
      setRows(res.data);
      setMeta(res.meta);
    } catch {
      toast.error('Failed to load sales');
    } finally {
      setLoading(false);
    }
  }, [page, status, q]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display text-ink-900">Sales &amp; Receipts</h1>
          <p className="text-xs text-ink-400 mt-0.5">
            {meta.total} sale{meta.total === 1 ? '' : 's'}
          </p>
        </div>
        <Link
          to="/admin/sales/new"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-primary text-white text-sm font-semibold rounded-xl hover:bg-brand-primary/90 transition"
        >
          <Plus size={15} /> New sale
        </Link>
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
                  <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-ink-400">Sale</th>
                  <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-ink-400">Customer</th>
                  <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-ink-400">Total</th>
                  <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-ink-400">Balance</th>
                  <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-ink-400">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {rows.map((s) => (
                  <tr key={s.id} className="hover:bg-surface-50 transition-colors">
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
    </div>
  );
}
