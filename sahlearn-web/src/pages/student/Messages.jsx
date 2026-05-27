import { useState, useEffect, useRef, useCallback } from 'react';
import { useStudentAuth } from '../../context/StudentAuthContext';
import { getMessages, sendMessage } from '../../services/studentMessages.service';
import { Send } from 'lucide-react';
import toast from 'react-hot-toast';

export default function StudentMessages() {
  const { student } = useStudentAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const pollingRef = useRef(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await getMessages({ limit: 100 });
      setMessages(res.data);
    } catch {
      if (!silent) toast.error('Failed to load messages');
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    pollingRef.current = setInterval(() => load(true), 15000);
    return () => clearInterval(pollingRef.current);
  }, [load]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    const text = content.trim();
    if (!text) return;
    setSending(true);
    try {
      const msg = await sendMessage(text);
      setMessages((prev) => [...prev, msg]);
      setContent('');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const initials = student?.fullName?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'ST';

  return (
    <div className="max-w-2xl mx-auto flex flex-col h-[calc(100vh-8rem)]">
      <h1 className="text-2xl font-display text-ink-900 mb-4 flex-shrink-0">Messages</h1>

      {/* Thread */}
      <div className="flex-1 bg-white rounded-2xl border border-surface-200 overflow-y-auto p-4 space-y-3 min-h-0">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-7 h-7 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-ink-400 text-sm">No messages yet. Send a message to get started.</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isStudent = msg.sender === 'student';
            return (
              <div key={msg._id} className={`flex gap-2.5 ${isStudent ? 'flex-row-reverse' : 'flex-row'}`}>
                {isStudent ? (
                  student?.avatar?.url ? (
                    <img src={student.avatar.url} alt={student.fullName} className="w-8 h-8 rounded-full object-cover flex-shrink-0 mt-0.5" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                      {initials}
                    </div>
                  )
                ) : (
                  <div className="w-8 h-8 rounded-full bg-ink-100 text-ink-500 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                    AD
                  </div>
                )}
                <div className={`max-w-[75%] ${isStudent ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
                  <div
                    className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      isStudent
                        ? 'bg-brand-primary text-white rounded-tr-sm'
                        : 'bg-surface-100 text-ink-800 rounded-tl-sm'
                    }`}
                  >
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
          placeholder="Type a message..."
          maxLength={2000}
          className="flex-1 px-4 py-3 border border-surface-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary bg-white"
        />
        <button
          type="submit"
          disabled={sending || !content.trim()}
          className="px-4 py-3 bg-brand-primary text-white rounded-xl hover:bg-brand-primary/90 transition disabled:opacity-50 flex items-center gap-2"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
