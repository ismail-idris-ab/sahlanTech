import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  listConversations,
  getConversation,
  sendReply,
} from '../../services/adminStudentMessages.service';
import { MessageCircle, Send, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

/* ── Conversation list panel ── */
function ConversationList({ conversations, activeId, onSelect }) {
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-surface-200 flex-shrink-0">
        <p className="text-xs font-semibold uppercase tracking-widest text-ink-400">Conversations</p>
      </div>
      <div className="flex-1 overflow-y-auto divide-y divide-surface-100">
        {conversations.length === 0 ? (
          <div className="py-10 text-center px-4">
            <MessageCircle size={28} className="mx-auto text-ink-300 mb-2" />
            <p className="text-xs text-ink-400">No messages yet.</p>
            <Link to="/admin/students" className="mt-2 block text-xs text-brand-primary hover:underline">
              Go to Students →
            </Link>
          </div>
        ) : (
          conversations.map((c) => {
            const initials = c.studentName?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'ST';
            const isActive = activeId === String(c.studentId);
            return (
              <button
                key={String(c.studentId)}
                onClick={() => onSelect(c)}
                className={`w-full text-left flex items-center gap-3 px-4 py-3 transition ${
                  isActive ? 'bg-brand-primary/8' : 'hover:bg-surface-50'
                }`}
              >
                {c.studentAvatar?.url ? (
                  <img src={c.studentAvatar.url} alt={c.studentName} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {initials}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <p className={`text-sm truncate ${c.unreadCount > 0 ? 'font-semibold text-ink-900' : 'font-medium text-ink-700'}`}>
                      {c.studentName}
                    </p>
                    {c.unreadCount > 0 && (
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-brand-primary text-white text-[10px] font-bold flex items-center justify-center">
                        {c.unreadCount}
                      </span>
                    )}
                  </div>
                  <p className={`text-xs truncate mt-0.5 ${c.unreadCount > 0 ? 'text-ink-600' : 'text-ink-400'}`}>
                    {c.lastMessage?.sender === 'admin' ? 'You: ' : ''}
                    {c.lastMessage?.content || ''}
                  </p>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

/* ── Chat panel ── */
function ChatPanel({ convMeta, onBack }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [student, setStudent] = useState(null);
  const bottomRef = useRef(null);
  const pollingRef = useRef(null);

  const studentId = String(convMeta.studentId);

  const loadMessages = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await getConversation(studentId, { limit: 100 });
      setStudent(res.student);
      setMessages(res.messages);
    } catch {
      if (!silent) toast.error('Failed to load messages');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    setMessages([]);
    setStudent(null);
    setLoading(true);
    loadMessages();
    pollingRef.current = setInterval(() => loadMessages(true), 15000);
    return () => clearInterval(pollingRef.current);
  }, [loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    const text = content.trim();
    if (!text) return;
    setSending(true);
    try {
      const msg = await sendReply(studentId, text);
      setMessages((prev) => [...prev, msg]);
      setContent('');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to send');
    } finally {
      setSending(false);
    }
  };

  const initials = (student?.fullName || convMeta.studentName || '')
    .split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'ST';
  const displayName = student?.fullName || convMeta.studentName || 'Student';
  const displayCode = student?.studentId || convMeta.studentCode || '';
  const avatarUrl = student?.avatar?.url || convMeta.studentAvatar?.url;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-surface-200 flex items-center gap-3 flex-shrink-0 bg-white">
        <button onClick={onBack} className="lg:hidden text-ink-400 hover:text-ink-700 transition">
          <ArrowLeft size={18} />
        </button>
        {avatarUrl ? (
          <img src={avatarUrl} alt={displayName} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
        ) : (
          <div className="w-9 h-9 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center text-sm font-bold flex-shrink-0">
            {initials}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-ink-900 leading-none truncate">{displayName}</p>
          {displayCode && <p className="text-xs text-ink-400 font-mono mt-0.5">{displayCode}</p>}
        </div>
        {student?.id && (
          <Link to={`/admin/students/${student.id}`} className="text-xs text-brand-primary hover:underline flex-shrink-0">
            Profile
          </Link>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-surface-50 min-h-0">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
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
                  <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${isAdmin ? 'bg-ink-900 text-white rounded-tr-sm' : 'bg-white text-ink-800 rounded-tl-sm border border-surface-200'}`}>
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
      <form onSubmit={handleSend} className="p-3 border-t border-surface-200 flex gap-2 flex-shrink-0 bg-white">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={`Reply to ${displayName}...`}
          maxLength={2000}
          className="flex-1 px-4 py-2.5 border border-surface-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary bg-white"
        />
        <button
          type="submit"
          disabled={sending || !content.trim()}
          className="px-4 py-2.5 bg-brand-primary text-white rounded-xl hover:bg-brand-primary/90 transition disabled:opacity-50 flex items-center gap-2"
        >
          <Send size={15} />
          <span className="text-sm font-medium">Send</span>
        </button>
      </form>
    </div>
  );
}

/* ── Empty chat placeholder ── */
function EmptyChat() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-8">
      <MessageCircle size={40} className="text-ink-200 mb-3" />
      <p className="text-sm font-medium text-ink-500">Select a conversation</p>
      <p className="text-xs text-ink-400 mt-1">Click a student on the left to view and reply to their messages.</p>
    </div>
  );
}

/* ── Main component ── */
export default function AdminStudentMessages() {
  const { studentId: paramStudentId } = useParams();
  const [conversations, setConversations] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [activeConv, setActiveConv] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const pollingRef = useRef(null);
  const autoOpenDone = useRef(false);

  const loadConversations = useCallback(async (silent = false) => {
    if (!silent) setLoadingList(true);
    try {
      const data = await listConversations();
      setConversations(data);
      // Auto-open conversation if URL has a studentId param
      if (!autoOpenDone.current && paramStudentId && data.length > 0) {
        const match = data.find((c) => String(c.studentId) === paramStudentId);
        if (match) {
          setActiveConv(match);
          setShowChat(true);
          autoOpenDone.current = true;
        } else {
          // Student exists but no prior messages — open empty chat
          setActiveConv({ studentId: paramStudentId, studentName: '' });
          setShowChat(true);
          autoOpenDone.current = true;
        }
      }
    } catch {
      if (!silent) toast.error('Failed to load conversations');
    } finally {
      if (!silent) setLoadingList(false);
    }
  }, [paramStudentId]);

  useEffect(() => {
    loadConversations();
    pollingRef.current = setInterval(() => loadConversations(true), 10000);
    return () => clearInterval(pollingRef.current);
  }, [loadConversations]);

  const handleSelect = (conv) => {
    setActiveConv(conv);
    setShowChat(true);
  };

  const totalUnread = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display text-ink-900">Student Messages</h1>
          {totalUnread > 0 && (
            <p className="text-sm text-brand-primary mt-0.5">{totalUnread} unread</p>
          )}
        </div>
        <Link
          to="/admin/students"
          className="text-xs font-medium text-brand-primary hover:underline"
        >
          Browse Students →
        </Link>
      </div>

      {/* Split panel */}
      <div className="bg-white rounded-2xl border border-surface-200 overflow-hidden" style={{ height: 'calc(100vh - 13rem)' }}>
        <div className="flex h-full">
          {/* Left: conversation list — hidden on mobile when chat is open */}
          <div className={`${showChat ? 'hidden lg:flex' : 'flex'} flex-col w-full lg:w-72 xl:w-80 border-r border-surface-200 flex-shrink-0`}>
            {loadingList ? (
              <div className="flex justify-center py-12">
                <div className="w-6 h-6 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <ConversationList
                conversations={conversations}
                activeId={activeConv ? String(activeConv.studentId) : null}
                onSelect={handleSelect}
              />
            )}
          </div>

          {/* Right: chat — full width on mobile when selected */}
          <div className={`${showChat ? 'flex' : 'hidden lg:flex'} flex-col flex-1 min-w-0`}>
            {activeConv ? (
              <ChatPanel
                key={String(activeConv.studentId)}
                convMeta={activeConv}
                onBack={() => setShowChat(false)}
              />
            ) : (
              <EmptyChat />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
