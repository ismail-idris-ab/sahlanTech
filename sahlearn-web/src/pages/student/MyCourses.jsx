import { useEffect, useState } from 'react';
import { useStudentAuth } from '../../context/StudentAuthContext';
import { getMe } from '../../services/student.service';
import { Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';

export default function MyCourses() {
  const { student, setStudent } = useStudentAuth();
  const [loading, setLoading] = useState(!student?.enrolledCourses);

  useEffect(() => {
    if (!student?.enrolledCourses) {
      getMe().then((data) => { setStudent(data); setLoading(false); }).catch(() => setLoading(false));
    }
  }, []);

  if (loading) {
    return <div className="flex justify-center py-24"><div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  const courses = student?.enrolledCourses || [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display text-ink-900">My Courses</h1>

      {courses.length === 0 ? (
        <div className="bg-white rounded-2xl border border-surface-200 p-12 text-center">
          <BookOpen size={40} className="mx-auto text-ink-300 mb-3" />
          <p className="text-ink-500">No courses yet. Enroll to get started.</p>
          <Link to="/courses" className="mt-3 inline-block text-sm text-brand-primary hover:underline">Browse courses</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((ec) => (
            <div key={ec.enrollmentId || ec.course?._id} className="bg-white rounded-2xl border border-surface-200 overflow-hidden">
              {ec.course?.coverImage?.url ? (
                <img src={ec.course.coverImage.url} alt={ec.course.title} className="w-full h-36 object-cover" />
              ) : (
                <div className="w-full h-36 bg-surface-200" />
              )}
              <div className="p-4">
                <span className="text-xs font-medium text-brand-primary bg-brand-primary/10 px-2 py-0.5 rounded-full">{ec.course?.category || 'Course'}</span>
                <h3 className="font-semibold text-ink-900 mt-2 leading-snug">{ec.course?.title || 'Untitled Course'}</h3>
                <p className="text-xs text-ink-400 mt-1">Enrolled {new Date(ec.enrolledAt).toLocaleDateString('en-NG', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                {ec.course?.slug && (
                  <Link to={`/courses/${ec.course.slug}`} className="mt-3 block text-xs text-brand-primary hover:underline">View course details →</Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
