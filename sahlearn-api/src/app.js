require('express-async-errors');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');

const { globalLimiter } = require('./middleware/rateLimit');
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
const studentMessagesRoutes = require('./routes/student.messages.routes');
const adminStudentMessagesRoutes = require('./routes/admin.studentMessages.routes');
const adminAssignmentsRoutes = require('./routes/admin.assignments.routes');
const studentAssignmentsRoutes = require('./routes/student.assignments.routes');
const studentExamsRoutes = require('./routes/student.exams.routes');
const adminExamsRoutes = require('./routes/admin.exams.routes');
const adminAttendanceRoutes = require('./routes/admin.attendance.routes');
const studentAttendanceRoutes = require('./routes/student.attendance.routes');
const exportsRoutes = require('./routes/exports.routes');
const adminAnnouncementsRoutes = require('./routes/admin.announcements.routes');
const studentAnnouncementsRoutes = require('./routes/student.announcements.routes');
const siteContentRoutes = require('./routes/siteContent.routes');
const studentCheckinRoutes = require('./routes/student.checkin.routes');
const adminCheckinRoutes = require('./routes/admin.checkin.routes');

const app = express();

// Render/Vercel/any reverse proxy sits in front — trust the first hop so
// req.ip is the real client IP (rate limiting keys on it).
app.set('trust proxy', 1);

const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
  : ['http://localhost:5173'];

app.use(helmet());
app.use(cors({ origin: corsOrigins, credentials: true }));
app.use(compression());
app.use(globalLimiter);

app.use(express.json({ limit: '50kb' }));
app.use(express.urlencoded({ extended: true, limit: '50kb' }));

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
// Specific sub-routes must be mounted BEFORE the generic /api/admin and /api/student
// routers — otherwise Express hits the generic router first (which runs auth), finds no
// matching route, then hits the specific router (which runs auth again): double DB query.
app.use('/api/student/auth', studentAuthRoutes);
app.use('/api/student/messages', studentMessagesRoutes);
app.use('/api/student/assignments', studentAssignmentsRoutes);
app.use('/api/student/exams', studentExamsRoutes);
app.use('/api/student/attendance', studentAttendanceRoutes);
app.use('/api/student/announcements', studentAnnouncementsRoutes);
app.use('/api/student/checkin', studentCheckinRoutes);
app.use('/api/student', studentRoutes);

app.use('/api/admin/students', adminStudentsRoutes);
app.use('/api/admin/student-messages', adminStudentMessagesRoutes);
app.use('/api/admin/assignments', adminAssignmentsRoutes);
app.use('/api/admin/exams', adminExamsRoutes);
app.use('/api/admin/attendance', adminAttendanceRoutes);
app.use('/api/admin/exports', exportsRoutes);
app.use('/api/admin/announcements', adminAnnouncementsRoutes);
app.use('/api/admin/checkins', adminCheckinRoutes);
app.use('/api/admin', adminRoutes);

app.use('/api/content', siteContentRoutes);

// 404
app.use((_req, res) => {
  res.status(404).json({ status: 'error', message: 'Route not found' });
});

// Central error handler (must be last)
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  // Handle multer file size error
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ status: 'error', message: 'File too large.' });
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
