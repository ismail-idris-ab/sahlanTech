import { useState, useEffect, useCallback } from 'react';
import { BookOpen } from 'lucide-react';
import { getPosts } from '../../services/posts.service';
import BlogCard from '../../components/blog/BlogCard';
import EmptyState from '../../components/common/EmptyState';
import SEO from '../../components/common/SEO';

export default function Blog() {
  const [posts, setPosts] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getPosts({ page, limit: 9 });
      setPosts(res.data);
      setMeta(res.meta);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <SEO title="Blog" description="Tips, tutorials, and updates from Sahlearn — digital skills for Nigerian learners." url="/blog" />
      <h1 className="text-3xl md:text-4xl font-bold text-ink-900 font-display mb-2">Blog</h1>
      <p className="text-ink-500 mb-10">Tips, tutorials, and updates from Sahlearn.</p>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl h-80 animate-pulse border border-ink-300/40" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <EmptyState icon={BookOpen} title="No posts yet" description="Check back soon." />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => <BlogCard key={post.id} post={post} />)}
          </div>

          {meta.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-10">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 text-sm border border-ink-300 rounded-lg text-ink-700 hover:bg-surface-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-sm text-ink-500">
                {page} / {meta.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                disabled={page === meta.totalPages}
                className="px-4 py-2 text-sm border border-ink-300 rounded-lg text-ink-700 hover:bg-surface-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
