import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminGetPosts, deletePost } from '../../services/posts.service';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import EmptyState from '../../components/common/EmptyState';

const STATUS_TABS = ['all', 'published', 'draft', 'archived'];

const STATUS_BADGE = {
  published: 'bg-green-100 text-green-700',
  draft: 'bg-yellow-100 text-yellow-700',
  archived: 'bg-ink-100 text-ink-500',
};

export default function AdminPosts() {
  const [posts, setPosts] = useState([]);
  const [meta, setMeta] = useState({ total: 0 });
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = activeTab !== 'all' ? { status: activeTab } : {};
      const res = await adminGetPosts(params);
      setPosts(res.data);
      setMeta(res.meta);
    } catch {
      toast.error('Failed to load posts.');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => { load(); }, [load]);

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
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs font-semibold text-brand-primary uppercase tracking-wider mb-1">Content</p>
          <div className="flex items-baseline gap-3">
            <span className="font-display text-3xl text-ink-900">{meta.total}</span>
            <span className="text-ink-500 text-sm">total posts</span>
          </div>
        </div>
        <Link to="/admin/posts/new">
          <Button icon={<Plus size={15} />}>New Post</Button>
        </Link>
      </div>

      {/* Pill tabs */}
      <div className="flex gap-1.5 mb-5 p-1 bg-white rounded-xl border border-ink-300/20 w-fit shadow-card">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
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
        <div className="space-y-2.5">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-white rounded-xl animate-pulse border border-ink-300/20" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <EmptyState title="No posts yet" description="Create your first post." action={
          <Link to="/admin/posts/new"><Button>New post</Button></Link>
        } />
      ) : (
        <div className="bg-white rounded-2xl border border-ink-300/20 shadow-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-ink-300/20">
              <tr>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-ink-500 uppercase tracking-wide">Title</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-ink-500 uppercase tracking-wide hidden md:table-cell">Category</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-ink-500 uppercase tracking-wide hidden sm:table-cell">Status</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-ink-500 uppercase tracking-wide hidden lg:table-cell">Views</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-ink-500 uppercase tracking-wide hidden lg:table-cell">Read</th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-ink-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-300/15">
              {posts.map((post) => (
                <tr key={post.id} className="hover:bg-surface-100/60 transition-colors">
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-ink-900 line-clamp-1">{post.title}</p>
                    <p className="text-ink-400 text-xs mt-0.5 line-clamp-1">{post.excerpt}</p>
                  </td>
                  <td className="px-5 py-3.5 text-ink-600 hidden md:table-cell">{post.category || '—'}</td>
                  <td className="px-5 py-3.5 hidden sm:table-cell">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${STATUS_BADGE[post.status]}`}>
                      {post.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-ink-600 hidden lg:table-cell">{post.views ?? 0}</td>
                  <td className="px-5 py-3.5 text-ink-600 hidden lg:table-cell">
                    {post.readTimeMinutes ? `${post.readTimeMinutes} min` : '—'}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        to={`/admin/posts/${post.id}/edit`}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-400 hover:text-brand-primary hover:bg-brand-primary/8 transition-all"
                      >
                        <Pencil size={14} />
                      </Link>
                      <button
                        onClick={() => setDeleteTarget({ id: post.id, title: post.title })}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-400 hover:text-brand-danger hover:bg-red-50 transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
