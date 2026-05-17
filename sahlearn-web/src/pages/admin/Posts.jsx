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
    <div className="p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Posts</h1>
          <p className="text-ink-500 text-sm mt-0.5">{meta.total} total</p>
        </div>
        <Link to="/admin/posts/new">
          <Button>
            <Plus size={16} className="mr-1.5" /> New Post
          </Button>
        </Link>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 mb-6 border-b border-ink-300/40">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 -mb-px transition-colors ${
              activeTab === tab
                ? 'border-brand-primary text-brand-primary'
                : 'border-transparent text-ink-500 hover:text-ink-900'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-white rounded-lg animate-pulse border border-ink-300/40" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <EmptyState title="No posts yet" description="Create your first post." action={
          <Link to="/admin/posts/new" className="text-brand-primary hover:underline text-sm">New post</Link>
        } />
      ) : (
        <div className="bg-white rounded-xl border border-ink-300/40 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface-100 border-b border-ink-300/40">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-ink-700">Title</th>
                <th className="text-left px-4 py-3 font-medium text-ink-700 hidden md:table-cell">Category</th>
                <th className="text-left px-4 py-3 font-medium text-ink-700 hidden sm:table-cell">Status</th>
                <th className="text-left px-4 py-3 font-medium text-ink-700 hidden lg:table-cell">Views</th>
                <th className="text-left px-4 py-3 font-medium text-ink-700 hidden lg:table-cell">Read time</th>
                <th className="text-right px-4 py-3 font-medium text-ink-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-300/40">
              {posts.map((post) => (
                <tr key={post.id} className="hover:bg-surface-100/50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink-900 line-clamp-1">{post.title}</p>
                    <p className="text-ink-500 text-xs mt-0.5 line-clamp-1">{post.excerpt}</p>
                  </td>
                  <td className="px-4 py-3 text-ink-700 hidden md:table-cell">{post.category || '—'}</td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_BADGE[post.status]}`}>
                      {post.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-ink-700 hidden lg:table-cell">{post.views ?? 0}</td>
                  <td className="px-4 py-3 text-ink-700 hidden lg:table-cell">
                    {post.readTimeMinutes ? `${post.readTimeMinutes} min` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        to={`/admin/posts/${post.id}/edit`}
                        className="p-1.5 text-ink-500 hover:text-brand-primary transition-colors"
                      >
                        <Pencil size={15} />
                      </Link>
                      <button
                        onClick={() => setDeleteTarget({ id: post.id, title: post.title })}
                        className="p-1.5 text-ink-500 hover:text-brand-danger transition-colors"
                      >
                        <Trash2 size={15} />
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
