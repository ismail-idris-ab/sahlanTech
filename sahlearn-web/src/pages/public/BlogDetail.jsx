import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Clock, Eye, Tag, MessageCircle } from 'lucide-react';
import { getPostBySlug } from '../../services/posts.service';
import SEO from '../../components/common/SEO';

const WA_NUM = import.meta.env.VITE_WHATSAPP_NUMBER;

export default function BlogDetail() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    getPostBySlug(slug)
      .then(setPost)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return (
    <div className="flex justify-center py-24">
      <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (notFound) return (
    <div className="max-w-7xl mx-auto px-4 py-24 text-center">
      <h1 className="text-4xl font-bold text-ink-900">Post not found</h1>
      <Link to="/blog" className="text-brand-primary hover:underline mt-4 inline-block">Browse all posts</Link>
    </div>
  );

  const date = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  const shareUrl = `${import.meta.env.VITE_SITE_URL}/blog/${post.slug}`;
  const waMsg = encodeURIComponent(`Check out this post from Sahlearn: ${post.title} — ${shareUrl}`);
  const waLink = `https://wa.me/${WA_NUM}?text=${waMsg}`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    image: post.coverImage?.url,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: { '@type': 'Person', name: post.author || 'Sahlearn' },
    publisher: { '@type': 'Organization', name: 'Sahlearn', url: import.meta.env.VITE_SITE_URL },
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <SEO
        title={post.seoTitle || post.title}
        description={post.seoDescription || post.excerpt}
        image={post.coverImage?.url}
        url={`/blog/${post.slug}`}
        type="article"
        jsonLd={jsonLd}
      />
      {/* Breadcrumb */}
      <nav className="text-sm text-ink-500 mb-6">
        <Link to="/" className="hover:text-brand-primary">Home</Link>
        <span className="mx-2">/</span>
        <Link to="/blog" className="hover:text-brand-primary">Blog</Link>
        <span className="mx-2">/</span>
        <span className="text-ink-900">{post.title}</span>
      </nav>

      {/* Category */}
      {post.category && (
        <span className="text-xs font-medium text-brand-primary bg-brand-primary/10 px-2.5 py-1 rounded-full">
          {post.category}
        </span>
      )}

      <h1 className="text-3xl md:text-4xl font-bold text-ink-900 font-display mt-3 mb-4">{post.title}</h1>

      {/* Meta */}
      <div className="flex flex-wrap items-center gap-4 text-sm text-ink-500 mb-6">
        {post.author && <span>By <strong className="text-ink-700">{post.author}</strong></span>}
        {date && <span>{date}</span>}
        {post.readTimeMinutes && (
          <span className="flex items-center gap-1"><Clock size={14} /> {post.readTimeMinutes} min read</span>
        )}
        <span className="flex items-center gap-1"><Eye size={14} /> {post.views} views</span>
      </div>

      {/* Cover */}
      {post.coverImage?.url && (
        <img
          src={post.coverImage.url}
          alt={post.title}
          className="w-full rounded-xl object-cover max-h-80 mb-8"
        />
      )}

      {/* Content */}
      <div
        className="prose prose-slate max-w-none"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />

      {/* Tags */}
      {post.tags?.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mt-8 pt-6 border-t border-ink-300/40">
          <Tag size={14} className="text-ink-500" />
          {post.tags.map((t) => (
            <span key={t} className="text-xs bg-surface-100 text-ink-700 px-2.5 py-1 rounded-full">{t}</span>
          ))}
        </div>
      )}

      {/* Share */}
      <div className="mt-8 pt-6 border-t border-ink-300/40 flex flex-wrap gap-3">
        <a
          href={waLink}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 px-4 py-2.5 border border-ink-300 rounded-lg text-ink-700 hover:bg-surface-100 transition-colors text-sm font-medium"
        >
          <MessageCircle size={16} className="text-green-500" />
          Share on WhatsApp
        </a>
      </div>
    </div>
  );
}
