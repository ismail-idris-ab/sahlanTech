import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import ProtectedRoute from '../components/layout/ProtectedRoute';
import AdminLayout from '../components/layout/AdminLayout';
import PublicLayout from '../components/layout/PublicLayout';

// Admin pages
import Login from '../pages/admin/Login';
import Dashboard from '../pages/admin/Dashboard';
import AdminCourses from '../pages/admin/Courses';
import CourseForm from '../pages/admin/CourseForm';
import AdminPosts from '../pages/admin/Posts';
import PostEditor from '../pages/admin/PostEditor';
import Messages from '../pages/admin/Messages';
import Enrollments from '../pages/admin/Enrollments';
import TeamMembers from '../pages/admin/TeamMembers';

// Public pages
import Home from '../pages/public/Home';
import About from '../pages/public/About';
import CoursesPage from '../pages/public/Courses';
import CourseDetail from '../pages/public/CourseDetail';
import Blog from '../pages/public/Blog';
import BlogDetail from '../pages/public/BlogDetail';
import Contact from '../pages/public/Contact';
import Enroll from '../pages/public/Enroll';

const NotFound = () => (
  <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
    <h1 className="text-6xl font-bold text-ink-900 font-display">404</h1>
    <p className="text-ink-500 mt-3 text-lg">Page not found.</p>
    <a href="/" className="mt-6 text-brand-primary hover:underline font-medium">Go home →</a>
  </div>
);

export default function AppRouter() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public pages — wrapped in Navbar + Footer + WhatsAppFAB */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/courses" element={<CoursesPage />} />
            <Route path="/courses/:slug" element={<CourseDetail />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogDetail />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/enroll" element={<Enroll />} />
            <Route path="/enroll/:courseSlug" element={<Enroll />} />
            <Route path="*" element={<NotFound />} />
          </Route>

          {/* Admin auth — no public layout */}
          <Route path="/admin/login" element={<Login />} />

          {/* Admin protected */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="courses" element={<AdminCourses />} />
            <Route path="courses/new" element={<CourseForm />} />
            <Route path="courses/:id/edit" element={<CourseForm />} />
            <Route path="posts" element={<AdminPosts />} />
            <Route path="posts/new" element={<PostEditor />} />
            <Route path="posts/:id/edit" element={<PostEditor />} />
            <Route path="messages" element={<Messages />} />
            <Route path="enrollments" element={<Enrollments />} />
            <Route path="team" element={<TeamMembers />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
