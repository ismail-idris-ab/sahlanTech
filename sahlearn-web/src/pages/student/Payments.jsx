import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Receipt as ReceiptIcon } from 'lucide-react';
import { getMyReceipts, formatNaira } from '../../services/receipts.service';
import Pagination from '../../components/common/Pagination';
import EmptyState from '../../components/common/EmptyState';

const PAGE_SIZE = 20;

export default function Payments() {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ page: 1, total: 0, totalPages: 1 });
  const [summary, setSummary] = useState({ totalPaid: 0, outstanding: 0 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getMyReceipts({ page, limit: PAGE_SIZE });
      setRows(res.data);
      setMeta(res.meta);
      setSummary(res.summary || { totalPaid: 0, outstanding: 0 });
    } catch {
      toast.error('Failed to load your payments');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-display text-ink-900">Payments</h1>
        <p className="text-xs text-ink-400 mt-0.5">Your receipts and outstanding balance</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-surface-200 p-5">
          <p className="text-xs font-medium text-ink-500">Total paid</p>
          <p className="text-2xl font-semibold text-ink-900 mt-1">{formatNaira(summary.totalPaid)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-surface-200 p-5">
          <p className="text-xs font-medium text-ink-500">Outstanding</p>
          <p className="text-2xl font-semibold text-ink-900 mt-1">{formatNaira(summary.outstanding)}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-surface-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-7 h-7 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={ReceiptIcon}
            title="No payments yet"
            description="Receipts for anything you pay for will appear here."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-50 text-left text-xs text-ink-500 uppercase tracking-wider">
                  <th className="px-6 py-3 font-medium">Date</th>
                  <th className="px-6 py-3 font-medium">For</th>
                  <th className="px-6 py-3 font-medium">Paid</th>
                  <th className="px-6 py-3 font-medium">Balance</th>
                  <th className="px-6 py-3 font-medium text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-surface-50 transition-colors">
                    <td className="px-6 py-3 text-ink-600">
                      {new Date(r.paidAt).toLocaleDateString('en-NG', { timeZone: 'Africa/Lagos' })}
                    </td>
                    <td className="px-6 py-3 text-ink-900 font-medium">{r.description}</td>
                    <td className="px-6 py-3 text-ink-900 font-semibold">{formatNaira(r.amount)}</td>
                    <td className="px-6 py-3 text-ink-600">{formatNaira(r.balance)}</td>
                    <td className="px-6 py-3 text-right">
                      <Link
                        to={`/receipt/${r.token}`}
                        className="text-xs font-medium text-brand-primary hover:underline"
                      >
                        View
                      </Link>
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
