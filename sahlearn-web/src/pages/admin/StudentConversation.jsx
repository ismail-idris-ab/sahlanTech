import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getConversation, sendReply } from '../../services/adminStudentMessages.service';
import { ArrowLeft, Send } from 'lucide-react';
import toast from 'react-hot-toast';

export default function StudentConversation() {
  const { studentId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const pollingRef = useRef(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await getConversation(studentId, { limit: 100 });
      setData(res);
    } catch {
      if (!silent) toast.error('Failed to load conversation');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    load();
    pollingRef.current = setInterval(() => load(true), 15000);
    return () => clearInterval(pollingRef.current);
  }, [load]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [data?.messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    const text = content.trim();
    if (!text) return;
    setSending(true);
    try {
      const msg = await sendReply(studentId, text);
      setData((prev) => prev ? { ...prev, messages: [...prev.messages, msg] } : prev);
      setContent('');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to send reply');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12 text-ink-500">
        Conversation not found.{' '}
        <Link to="/admin/student-messages" className="text-brand-primary hover:underline">Back</Link>
      </div>
    );
  }

  const { student, messages } = data;
  const initials = student.fullName?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'ST';

  return (
    <div className="max-w-2xl mx-auto flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 flex-shrink-0">
        <Link to="/admin/student-messages" className="flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-900 transition">
          <ArrowLeft size={14} />
        </Link>
        {student.avatar?.url ? (
          <img src={student.avatar.url} alt={student.fullName} className="w-9 h-9 rounded-full object-cover" />
        ) : (
          <div className="w-9 h-9 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center text-sm font-bold">
            {initials}
          </div>
        )}
        <div>
          <p className="font-semibold text-ink-900 leading-none">{student.fullName}</p>
          <p className="text-xs text-ink-400 font-mono">{student.studentId}</p>
        </div>
        <Link to={`/admin/students/${student.id}`} className="ml-auto text-xs text-brand-primary hover:underline">View profile</Link>
      </div>

      {/* Thread */}
      <div className="flex-1 bg-white rounded-2xl border border-surface-200 overflow-y-auto p-4 space-y-3 min-h-0">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-sm text-ink-400">No messages yet. Send the first message below.</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isAdmin = msg.sender === 'admin';
            return (
              <div key={msg._id} className={`flex gap-2.5 ${isAdmin ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 ${isAdmin ? 'bg-ink-900 text-white' : 'bg-brand-primary/10 text-brand-primary'}`}>
                  {isAdmin ? 'AD' : initials}
                </div>
                <div className={`max-w-[75%] flex flex-col gap-0.5 ${isAdmin ? 'items-end' : 'items-start'}`}>
                  <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${isAdmin ? 'bg-ink-900 text-white rounded-tr-sm' : 'bg-surface-100 text-ink-800 rounded-tl-sm'}`}>
                    {msg.content}
                  </div>
                  <span className="text-[10px] text-ink-300 px-1">
                    {new Date(msg.createdAt).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}
                    {' · '}
                    {new Date(msg.createdAt).toLocaleDateString('en-NG', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="mt-3 flex gap-2 flex-shrink-0">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={`Reply to ${student.fullName}...`}
          maxLength={2000}
          className="flex-1 px-4 py-3 border border-surface-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary bg-white"
        />
        <button
          type="submit"
          disabled={sending || !content.trim()}
          className="px-4 py-3 bg-brand-primary text-white rounded-xl hover:bg-brand-primary/90 transition disabled:opacity-50"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
