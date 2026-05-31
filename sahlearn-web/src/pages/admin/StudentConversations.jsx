import { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { listConversations } from '../../services/adminStudentMessages.service';
import { MessageCircle, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

export default function StudentConversations() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const pollingRef = useRef(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await listConversations();
      setConversations(data);
    } catch {
      if (!silent) toast.error('Failed to load conversations');
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    pollingRef.current = setInterval(() => load(true), 10000);
    return () => clearInterval(pollingRef.current);
  }, [load]);

  const totalUnread = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display text-ink-900">Student Messages</h1>
          {totalUnread > 0 && (
            <p className="text-sm text-brand-primary mt-0.5">{totalUnread} unread message{totalUnread !== 1 ? 's' : ''}</p>
          )}
        </div>
        <Link
          to="/admin/students"
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-brand-primary text-white rounded-xl hover:bg-brand-primary/90 transition flex-shrink-0"
        >
          <Plus size={13} /> New Conversation
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-surface-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-7 h-7 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="py-12 text-center">
            <MessageCircle size={36} className="mx-auto text-ink-300 mb-2" />
            <p className="text-sm text-ink-400">No student messages yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-surface-100">
            {conversations.map((c) => {
              const initials = c.studentName?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'ST';
              return (
                <Link
                  key={c.studentId}
                  to={`/admin/student-messages/${c.studentId}`}
                  className="flex items-center gap-3 px-4 py-3.5 hover:bg-surface-50 transition"
                >
                  {c.studentAvatar?.url ? (
                    <img src={c.studentAvatar.url} alt={c.studentName} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {initials}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-sm font-medium truncate ${c.unreadCount > 0 ? 'text-ink-900' : 'text-ink-700'}`}>
                        {c.studentName}
                      </p>
                      <span className="text-[11px] text-ink-400 flex-shrink-0">
                        {c.lastMessage?.createdAt
                          ? new Date(c.lastMessage.createdAt).toLocaleDateString('en-NG', { month: 'short', day: 'numeric' })
                          : ''}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <p className={`text-xs truncate ${c.unreadCount > 0 ? 'text-ink-700 font-medium' : 'text-ink-400'}`}>
                        {c.lastMessage?.sender === 'admin' ? 'You: ' : ''}
                        {c.lastMessage?.content || ''}
                      </p>
                      {c.unreadCount > 0 && (
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-brand-primary text-white text-[10px] font-bold flex items-center justify-center">
                          {c.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
