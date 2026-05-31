import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { StudentAuthProvider } from '../context/StudentAuthContext';
import ProtectedRoute from '../components/layout/ProtectedRoute';
import StudentRoute from '../components/layout/StudentRoute';
import AdminLayout from '../components/layout/AdminLayout';
import StudentLayout from '../components/layout/StudentLayout';
import PublicLayout from '../components/layout/PublicLayout';

// Admin pages — lazy loaded (never on public critical path)
const Login = lazy(() => import('../pages/admin/Login'));
const Dashboard = lazy(() => import('../pages/admin/Dashboard'));
const AdminCourses = lazy(() => import('../pages/admin/Courses'));
const CourseForm = lazy(() => import('../pages/admin/CourseForm'));
const AdminPosts = lazy(() => import('../pages/admin/Posts'));
const PostEditor = lazy(() => import('../pages/admin/PostEditor'));
const Messages = lazy(() => import('../pages/admin/Messages'));
const Enrollments = lazy(() => import('../pages/admin/Enrollments'));
const TeamMembers = lazy(() => import('../pages/admin/TeamMembers'));

// Admin student pages
const AdminStudents = lazy(() => import('../pages/admin/Students'));
const AdminStudentDetail = lazy(() => import('../pages/admin/StudentDetail'));
const AdminStudentMessages = lazy(() => import('../pages/admin/StudentMessages'));
const AdminAssignments = lazy(() => import('../pages/admin/Assignments'));
const AdminAssignmentForm = lazy(() => import('../pages/admin/AssignmentForm'));
const AdminAssignmentDetail = lazy(() => import('../pages/admin/AssignmentDetail'));
const AdminExams = lazy(() => import('../pages/admin/Exams'));
const AdminExamForm = lazy(() => import('../pages/admin/ExamForm'));
const AdminExamDetail = lazy(() => import('../pages/admin/ExamDetail'));

// Student pages — lazy loaded
const StudentLogin = lazy(() => import('../pages/student/Login'));
const StudentForgotPassword = lazy(() => import('../pages/student/ForgotPassword'));
const StudentResetPassword = lazy(() => import('../pages/student/ResetPassword'));
const StudentChangePassword = lazy(() => import('../pages/student/ChangePassword'));
const StudentDashboard = lazy(() => import('../pages/student/Dashboard'));
const StudentProfile = lazy(() => import('../pages/student/Profile'));
const StudentMyCourses = lazy(() => import('../pages/student/MyCourses'));
const StudentMessages = lazy(() => import('../pages/student/Messages'));
const StudentAssignments = lazy(() => import('../pages/student/Assignments'));
const StudentAssignmentDetail = lazy(() => import('../pages/student/AssignmentDetail'));
const StudentExams = lazy(() => import('../pages/student/Exams'));
const StudentExamTake = lazy(() => import('../pages/student/ExamTake'));
const StudentProgress = lazy(() => import('../pages/student/Progress'));
const StudentAttendance = lazy(() => import('../pages/student/Attendance'));
const AdminAttendance = lazy(() => import('../pages/admin/Attendance'));
const AdminAttendanceSession = lazy(() => import('../pages/admin/AttendanceSession'));
const AdminAnnouncements = lazy(() => import('../pages/admin/Announcements'));
const AdminSiteContent = lazy(() => import('../pages/admin/SiteContent'));
const StudentAnnouncements = lazy(() => import('../pages/student/Announcements'));

// Public pages — lazy loaded (each route is a separate chunk)
const Home = lazy(() => import('../pages/public/Home'));
const About = lazy(() => import('../pages/public/About'));
const CoursesPage = lazy(() => import('../pages/public/Courses'));
const CourseDetail = lazy(() => import('../pages/public/CourseDetail'));
const Blog = lazy(() => import('../pages/public/Blog'));
const BlogDetail = lazy(() => import('../pages/public/BlogDetail'));
const Contact = lazy(() => import('../pages/public/Contact'));
const Enroll = lazy(() => import('../pages/public/Enroll'));
const FAQ = lazy(() => import('../pages/public/FAQ'));

const PageSpinner = () => (
  <div className="flex justify-center py-24">
    <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

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
        <StudentAuthProvider>
        <Suspense fallback={<PageSpinner />}>
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
              <Route path="/faq" element={<FAQ />} />
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
              <Route path="students" element={<AdminStudents />} />
              <Route path="students/:id" element={<AdminStudentDetail />} />
              <Route path="student-messages" element={<AdminStudentMessages />} />
              <Route path="student-messages/:studentId" element={<AdminStudentMessages />} />
              <Route path="assignments" element={<AdminAssignments />} />
              <Route path="assignments/new" element={<AdminAssignmentForm />} />
              <Route path="assignments/:id" element={<AdminAssignmentDetail />} />
              <Route path="assignments/:id/edit" element={<AdminAssignmentForm />} />
              <Route path="exams" element={<AdminExams />} />
              <Route path="exams/new" element={<AdminExamForm />} />
              <Route path="exams/:id" element={<AdminExamDetail />} />
              <Route path="exams/:id/edit" element={<AdminExamForm />} />
              <Route path="attendance" element={<AdminAttendance />} />
              <Route path="attendance/:id" element={<AdminAttendanceSession />} />
              <Route path="announcements" element={<AdminAnnouncements />} />
              <Route path="site-content" element={<AdminSiteContent />} />
            </Route>

            {/* Student auth — no layout */}
            <Route path="/student/login" element={<StudentLogin />} />
            <Route path="/student/forgot-password" element={<StudentForgotPassword />} />
            <Route path="/student/reset-password" element={<StudentResetPassword />} />
            <Route path="/student/change-password" element={<StudentChangePassword />} />

            {/* Student portal — protected */}
            <Route
              path="/student"
              element={
                <StudentRoute>
                  <StudentLayout />
                </StudentRoute>
              }
            >
              <Route index element={<Navigate to="/student/dashboard" replace />} />
              <Route path="dashboard" element={<StudentDashboard />} />
              <Route path="profile" element={<StudentProfile />} />
              <Route path="courses" element={<StudentMyCourses />} />
              <Route path="messages" element={<StudentMessages />} />
              <Route path="assignments" element={<StudentAssignments />} />
              <Route path="assignments/:id" element={<StudentAssignmentDetail />} />
              <Route path="exams" element={<StudentExams />} />
              <Route path="exams/:id" element={<StudentExamTake />} />
              <Route path="progress" element={<StudentProgress />} />
              <Route path="attendance" element={<StudentAttendance />} />
              <Route path="announcements" element={<StudentAnnouncements />} />
            </Route>
          </Routes>
        </Suspense>
        </StudentAuthProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
