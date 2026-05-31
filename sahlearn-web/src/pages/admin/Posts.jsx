import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminGetPosts, deletePost } from '../../services/posts.service';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import StatusBadge from '../../components/common/StatusBadge';
import Pagination from '../../components/common/Pagination';

const STATUS_TABS = ['all', 'published', 'draft', 'archived'];
const PAGE_SIZE = 12;

export default function AdminPosts() {
  const [posts, setPosts] = useState([]);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const params = { page, limit: PAGE_SIZE, ...(activeTab !== 'all' ? { status: activeTab } : {}) };
        const res = await adminGetPosts(params);
        if (!cancelled) {
          setPosts(res.data);
          setMeta(res.meta ?? { total: res.data.length, totalPages: 1 });
        }
      } catch {
        if (!cancelled) toast.error('Failed to load posts.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [page, activeTab]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deletePost(deleteTarget.id);
      toast.success('Post deleted.');
      setDeleteTarget(null);
      load();
    } catch {
      toast.error('Delete failed.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display text-ink-900">Blog Posts</h1>
          <p className="text-xs text-ink-400 mt-0.5">{meta.total} post{meta.total !== 1 ? 's' : ''}</p>
        </div>
        <Link
          to="/admin/posts/new"
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl text-white transition hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #068562, #056B4E)' }}
        >
          <Plus size={15} /> New Post
        </Link>
      </div>

      {/* Pill tabs */}
      <div className="flex gap-1.5 p-1 bg-white rounded-xl border border-ink-300/20 w-fit shadow-card">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setPage(1); }}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-all duration-150 ${
              activeTab === tab
                ? 'bg-brand-primary text-white shadow-sm'
                : 'text-ink-500 hover:text-ink-900'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-7 h-7 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-ink-300/20 shadow-card py-16 text-center text-sm text-ink-400">
          No posts yet. <Link to="/admin/posts/new" className="text-brand-primary hover:underline">Create one</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {posts.map((post) => (
            <div key={post.id || post._id} className="bg-white rounded-2xl border border-ink-300/20 overflow-hidden shadow-card hover:shadow-card-hover transition-shadow group">
              <div className="relative h-36">
                {post.coverImage?.url ? (
                  <img src={post.coverImage.url} alt={post.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full" style={{ background: 'linear-gradient(135deg, #0d9488, #068562)' }} />
                )}
                <div className="absolute top-2.5 left-2.5">
                  <StatusBadge status={post.status || (post.published ? 'published' : 'draft')} />
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-ink-900 leading-snug mb-1 truncate">{post.title}</h3>
                <p className="text-xs text-ink-400 mb-3">
                  {post.category} · {new Date(post.createdAt).toLocaleDateString('en-NG', { month: 'short', year: 'numeric' })}
                </p>
                <div className="flex items-center gap-2">
                  <Link
                    to={`/admin/posts/${post.id || post._id}/edit`}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                    style={{ background: 'rgba(6,133,98,0.08)', color: '#068562', border: '1px solid rgba(6,133,98,0.15)' }}
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => setDeleteTarget({ id: post.id || post._id, title: post.title })}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors text-red-500 hover:bg-red-50"
                    style={{ border: '1px solid rgba(239,68,68,0.2)' }}
                  >
                    <Trash2 size={13} className="inline -mt-0.5 mr-1" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && meta.totalPages > 1 && (
        <div className="bg-white rounded-2xl border border-ink-300/20 shadow-card overflow-hidden">
          <Pagination
            page={page}
            totalPages={meta.totalPages}
            total={meta.total}
            pageSize={PAGE_SIZE}
            onPage={setPage}
          />
        </div>
      )}

      <Modal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete post?"
      >
        <p className="text-ink-700 text-sm mb-6">
          "{deleteTarget?.title}" will be permanently deleted.
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="danger" loading={deleting} onClick={handleDelete}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
}
