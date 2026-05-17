import { Link } from 'react-router-dom';
import { Clock, Eye } from 'lucide-react';

export default function BlogCard({ post }) {
  const date = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
    : null;

  return (
    <Link to={`/blog/${post.slug}`} className="group block bg-white rounded-xl border border-ink-300/40 overflow-hidden hover:shadow-md transition-shadow">
      {post.coverImage?.url ? (
        <img
          src={post.coverImage.url}
          alt={post.title}
          className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
      ) : (
        <div className="w-full h-44 bg-surface-100 flex items-center justify-center">
          <span className="text-ink-400 text-sm">No image</span>
        </div>
      )}

      <div className="p-5">
        {post.category && (
          <span className="text-xs font-medium text-brand-primary bg-brand-primary/10 px-2 py-0.5 rounded-full">
            {post.category}
          </span>
        )}

        <h2 className="text-base font-bold text-ink-900 mt-2 mb-1 line-clamp-2 group-hover:text-brand-primary transition-colors">
          {post.title}
        </h2>

        <p className="text-ink-500 text-sm line-clamp-2">{post.excerpt}</p>

        <div className="flex items-center gap-3 mt-3 text-xs text-ink-400">
          {date && <span>{date}</span>}
          {post.readTimeMinutes && (
            <span className="flex items-center gap-1">
              <Clock size={12} /> {post.readTimeMinutes} min
            </span>
          )}
          {post.views > 0 && (
            <span className="flex items-center gap-1">
              <Eye size={12} /> {post.views}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
