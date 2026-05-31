// sahlearn-web/src/pages/student/MyCourses.jsx
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
    return (
      <div className="flex justify-center py-24">
        <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const courses = student?.enrolledCourses || [];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-display text-ink-900">My Courses</h1>
        <p className="text-xs text-ink-400 mt-0.5">{courses.length} enrolled course{courses.length !== 1 ? 's' : ''}</p>
      </div>

      {courses.length === 0 ? (
        <div className="bg-white rounded-2xl border border-surface-200 p-16 text-center">
          <div className="w-12 h-12 rounded-2xl bg-surface-100 flex items-center justify-center mx-auto mb-3">
            <BookOpen size={22} className="text-ink-300" />
          </div>
          <p className="font-semibold text-ink-700">No courses yet</p>
          <p className="text-sm text-ink-400 mt-1">Enroll to get started.</p>
          <Link to="/courses" className="mt-4 inline-block text-sm text-brand-primary hover:underline">Browse courses →</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((ec) => (
            <div key={ec.enrollmentId || ec.course?._id} className="bg-white rounded-2xl border border-surface-200 overflow-hidden hover:shadow-card-hover transition-shadow">
              {ec.course?.coverImage?.url ? (
                <img src={ec.course.coverImage.url} alt={ec.course.title} className="w-full h-36 object-cover" />
              ) : (
                <div className="w-full h-36" style={{ background: 'linear-gradient(135deg, #068562, #71B280)' }} />
              )}
              <div className="p-4">
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full" style={{ background: 'rgba(6,133,98,0.1)', color: '#068562' }}>
                  {ec.course?.category || 'Course'}
                </span>
                <h3 className="font-semibold text-ink-900 mt-2 leading-snug">{ec.course?.title || 'Untitled Course'}</h3>
                <p className="text-xs text-ink-400 mt-1">
                  Enrolled {new Date(ec.enrolledAt).toLocaleDateString('en-NG', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-ink-400 mb-1">
                    <span>Progress</span><span>0%</span>
                  </div>
                  <div className="h-1.5 bg-surface-200 rounded-full overflow-hidden">
                    <div className="h-1.5 rounded-full" style={{ width: '0%', background: 'linear-gradient(90deg, #068562, #71B280)' }} />
                  </div>
                </div>
                {ec.course?.slug && (
                  <Link to={`/courses/${ec.course.slug}`} className="mt-3 block text-xs text-brand-primary hover:underline font-medium">
                    View course details →
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
