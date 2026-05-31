// sahlearn-web/src/pages/student/Announcements.jsx
import { useEffect, useState } from 'react';
import { getMyAnnouncements } from '../../services/studentAnnouncements.service';
import { Megaphone, Paperclip, FileText, Download } from 'lucide-react';
import toast from 'react-hot-toast';

const formatSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function StudentAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyAnnouncements()
      .then(setAnnouncements)
      .catch(() => toast.error('Failed to load announcements'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="text-2xl font-display text-ink-900">Announcements</h1>
        <p className="text-xs text-ink-400 mt-0.5">Messages and documents from your instructor.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : announcements.length === 0 ? (
        <div className="bg-white rounded-2xl border border-surface-200 p-16 text-center">
          <div className="w-12 h-12 rounded-2xl bg-surface-100 flex items-center justify-center mx-auto mb-3">
            <Megaphone size={22} className="text-ink-300" />
          </div>
          <p className="font-semibold text-ink-700">No announcements yet</p>
          <p className="text-sm text-ink-400 mt-1">Check back later.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map((a) => (
            <div key={a.id} className="bg-white rounded-2xl border border-surface-200 p-5 hover:shadow-card transition-shadow">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: 'rgba(6,133,98,0.1)' }}>
                  <Megaphone size={16} className="text-brand-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-ink-900">{a.title}</h3>
                    {a.target === 'course' && a.course?.title && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: 'rgba(6,133,98,0.1)', color: '#068562' }}>
                        {a.course.title}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-ink-400 mt-0.5">
                    {new Date(a.createdAt).toLocaleDateString('en-NG', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                  <p className="text-sm text-ink-700 mt-2 whitespace-pre-wrap leading-relaxed">{a.body}</p>

                  {a.file?.url && (
                    <a
                      href={a.file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-2 px-3 py-2 bg-surface-100 hover:bg-surface-200 rounded-xl text-sm text-ink-700 transition"
                    >
                      {a.file.mimeType?.includes('pdf') ? <FileText size={15} className="text-red-500" /> : <Paperclip size={15} className="text-ink-500" />}
                      <span className="truncate max-w-[200px]">{a.file.originalName || 'Download attachment'}</span>
                      {a.file.size && <span className="text-xs text-ink-400">{formatSize(a.file.size)}</span>}
                      <Download size={13} className="text-ink-400 flex-shrink-0" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
