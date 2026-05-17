import { Search } from 'lucide-react';

const CATEGORIES = ['All', 'Design', 'Office', 'AI', 'Marketing', 'General'];
const LEVELS = ['All', 'Beginner', 'Intermediate', 'Advanced'];

export default function CourseFilters({ filters, onChange }) {
  const set = (key, val) => onChange({ ...filters, [key]: val });

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
        <input
          value={filters.search}
          onChange={(e) => set('search', e.target.value)}
          placeholder="Search courses..."
          className="w-full border border-ink-300 rounded-lg pl-9 pr-4 py-2.5 text-sm text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
        />
      </div>

      <select
        value={filters.category}
        onChange={(e) => set('category', e.target.value)}
        className="border border-ink-300 rounded-lg px-3 py-2.5 text-sm text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-primary"
      >
        {CATEGORIES.map((c) => <option key={c} value={c === 'All' ? '' : c}>{c}</option>)}
      </select>

      <select
        value={filters.level}
        onChange={(e) => set('level', e.target.value)}
        className="border border-ink-300 rounded-lg px-3 py-2.5 text-sm text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-primary"
      >
        {LEVELS.map((l) => <option key={l} value={l === 'All' ? '' : l}>{l}</option>)}
      </select>
    </div>
  );
}
