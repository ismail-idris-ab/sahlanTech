require('express-async-errors');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');

const authRoutes = require('./routes/auth.routes');
const coursesRoutes = require('./routes/courses.routes');
const postsRoutes = require('./routes/posts.routes');
const contactRoutes = require('./routes/contact.routes');
const enrollmentsRoutes = require('./routes/enrollments.routes');
const uploadRoutes = require('./routes/upload.routes');
const adminRoutes = require('./routes/admin.routes');
const studentAuthRoutes = require('./routes/student.auth.routes');
const studentRoutes = require('./routes/student.routes');
const adminStudentsRoutes = require('./routes/admin.students.routes');

const app = express();

const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
  : ['http://localhost:5173'];

app.use(helmet());
app.use(cors({ origin: corsOrigins, credentials: true }));
app.use(compression());

// Paystack webhook needs raw body for signature verification — mount before json()
const { paystackWebhook } = require('./controllers/enrollments.controller');
app.post('/api/enrollments/webhook/paystack', express.raw({ type: 'application/json' }), paystackWebhook);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Health
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Sitemap
app.get('/sitemap.xml', async (_req, res) => {
  const Course = require('./models/Course');
  const Post = require('./models/Post');
  const base = process.env.CORS_ORIGIN?.split(',')[0]?.trim().replace(/\/$/, '') || 'https://sahlearn.com';

  const [courses, posts] = await Promise.all([
    Course.find({ isPublished: true }).select('slug updatedAt').lean(),
    Post.find({ status: 'published' }).select('slug updatedAt').lean(),
  ]);

  const staticUrls = ['', '/about', '/courses', '/blog', '/contact'].map((path) => `
  <url>
    <loc>${base}${path}</loc>
    <changefreq>weekly</changefreq>
    <priority>${path === '' ? '1.0' : '0.8'}</priority>
  </url>`).join('');

  const courseUrls = courses.map((c) => `
  <url>
    <loc>${base}/courses/${c.slug}</loc>
    <lastmod>${new Date(c.updatedAt).toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`).join('');

  const postUrls = posts.map((p) => `
  <url>
    <loc>${base}/blog/${p.slug}</loc>
    <lastmod>${new Date(p.updatedAt).toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`).join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticUrls}${courseUrls}${postUrls}
</urlset>`;

  res.header('Content-Type', 'application/xml').send(xml);
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', coursesRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/enrollments', enrollmentsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/student/auth', studentAuthRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/admin/students', adminStudentsRoutes);

// 404
app.use((_req, res) => {
  res.status(404).json({ status: 'error', message: 'Route not found' });
});

// Central error handler (must be last)
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  // Handle multer file size error
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ status: 'error', message: 'File too large. Maximum size is 5MB.' });
  }

  const status = err.statusCode || err.status || 500;
  const message =
    process.env.NODE_ENV === 'production' && status === 500
      ? 'Internal server error'
      : err.message || 'Internal server error';

  if (status === 500) {
    console.error(err);
  }

  res.status(status).json({ status: 'error', message });
});

module.exports = app;
