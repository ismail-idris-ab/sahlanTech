import { useState, useEffect, useRef, useCallback } from 'react';
import { useStudentAuth } from '../../context/StudentAuthContext';
import { getMessages, sendMessage } from '../../services/studentMessages.service';
import { Send, Paperclip, FileText, Download, X } from 'lucide-react';
import toast from 'react-hot-toast';

const FileAttachment = ({ file, dark }) => {
  if (!file?.url) return null;
  if (file.mimeType?.startsWith('image/')) {
    return (
      <a href={file.url} target="_blank" rel="noopener noreferrer" className="block mt-1.5">
        <img src={file.url} alt={file.originalName} className="max-w-[200px] rounded-lg" />
      </a>
    );
  }
  return (
    <a
      href={file.url} target="_blank" rel="noopener noreferrer"
      className={`mt-1.5 inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition ${dark ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-white hover:bg-surface-100 text-ink-700 border border-surface-200'}`}
    >
      {file.mimeType?.includes('pdf') ? <FileText size={13} /> : <Paperclip size={13} />}
      <span className="truncate max-w-[160px]">{file.originalName || 'Attachment'}</span>
      <Download size={11} className="opacity-60 flex-shrink-0" />
    </a>
  );
};

export default function StudentMessages() {
  const { student } = useStudentAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [file, setFile] = useState(null);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const pollingRef = useRef(null);
  const fileRef = useRef(null);

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
    if (!text && !file) return;
    setSending(true);
    try {
      const msg = await sendMessage(text, file);
      setMessages((prev) => [...prev, msg]);
      setContent('');
      setFile(null);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const initials = student?.fullName?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'ST';

  return (
    <div className="space-y-4 max-w-2xl">
      <div>
        <h1 className="text-2xl font-display text-ink-900">Messages</h1>
        <p className="text-xs text-ink-400 mt-0.5">Your conversation with your instructor.</p>
      </div>

      <div className="flex flex-col h-[calc(100vh-8rem)]">


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
                    <FileAttachment file={msg.file} dark={isStudent} />
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

      {/* File preview */}
      {file && (
        <div className="mt-2 flex items-center gap-2 px-3 py-1.5 bg-surface-100 rounded-xl flex-shrink-0">
          <Paperclip size={13} className="text-ink-400" />
          <span className="text-xs text-ink-600 truncate flex-1">{file.name}</span>
          <button onClick={() => setFile(null)} className="text-ink-400 hover:text-red-500 transition"><X size={13} /></button>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSend} className="mt-3 flex gap-2 flex-shrink-0">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="p-3 border border-surface-300 rounded-xl text-ink-400 hover:text-brand-primary hover:border-brand-primary transition flex-shrink-0"
          title="Attach file"
        >
          <Paperclip size={16} />
        </button>
        <input ref={fileRef} type="file" className="hidden"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.zip,.jpg,.jpeg,.png,.webp"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
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
          disabled={sending || (!content.trim() && !file)}
          className="px-4 py-3 bg-brand-primary text-white rounded-xl hover:bg-brand-primary/90 transition disabled:opacity-50 flex items-center gap-2"
        >
          <Send size={16} />
        </button>
      </form>
      </div>
    </div>
  );
}
