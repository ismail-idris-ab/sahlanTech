// sahlearn-web/src/components/common/StatusBadge.jsx
export default function StatusBadge({ status }) {
  const map = {
    active:     'bg-green-50 text-green-700 border border-green-200',
    published:  'bg-green-50 text-green-700 border border-green-200',
    enrolled:   'bg-green-50 text-green-700 border border-green-200',
    replied:    'bg-green-50 text-green-700 border border-green-200',
    paid:       'bg-green-50 text-green-700 border border-green-200',
    graded:     'bg-green-50 text-green-700 border border-green-200',
    present:    'bg-green-50 text-green-700 border border-green-200',
    pending:    'bg-amber-50 text-amber-700 border border-amber-200',
    draft:      'bg-amber-50 text-amber-700 border border-amber-200',
    contacted:  'bg-blue-50 text-blue-700 border border-blue-200',
    new:        'bg-blue-50 text-blue-700 border border-blue-200',
    read:       'bg-surface-100 text-ink-500 border border-surface-300',
    archived:   'bg-surface-100 text-ink-400 border border-surface-300',
    inactive:   'bg-red-50 text-red-700 border border-red-200',
    rejected:   'bg-red-50 text-red-700 border border-red-200',
    failed:     'bg-red-50 text-red-700 border border-red-200',
    absent:     'bg-red-50 text-red-700 border border-red-200',
    overdue:    'bg-red-50 text-red-700 border border-red-200',
    late:       'bg-orange-50 text-orange-700 border border-orange-200',
    excused:    'bg-purple-50 text-purple-700 border border-purple-200',
    submitted:  'bg-blue-50 text-blue-700 border border-blue-200',
    reviewed:   'bg-purple-50 text-purple-700 border border-purple-200',
  };
  const cls = map[status?.toLowerCase()] ?? 'bg-surface-100 text-ink-500 border border-surface-300';
  return (
    <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize ${cls}`}>
      {status}
    </span>
  );
}
