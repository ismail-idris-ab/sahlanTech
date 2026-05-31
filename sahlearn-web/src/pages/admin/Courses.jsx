import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminGetCourses, deleteCourse, updateCourse } from '../../services/courses.service';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import StatusBadge from '../../components/common/StatusBadge';

export default function AdminCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const params = filter !== 'all' ? { status: filter } : {};
      const res = await adminGetCourses(params);
      setCourses(res.data);
    } catch {
      toast.error('Failed to load courses.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filter]);

  const handleTogglePublish = async (course) => {
    const prev = course.isPublished;
    setCourses((cs) => cs.map((c) => c.id === course.id ? { ...c, isPublished: !prev } : c));
    try {
      await updateCourse(course.id, { isPublished: !prev });
      toast.success(prev ? 'Course unpublished.' : 'Course published.');
    } catch {
      setCourses((cs) => cs.map((c) => c.id === course.id ? { ...c, isPublished: prev } : c));
      toast.error('Failed to update status.');
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteCourse(deleteTarget.id);
      setCourses((cs) => cs.filter((c) => c.id !== deleteTarget.id));
      toast.success('Course deleted.');
      setDeleteTarget(null);
    } catch {
      toast.error('Failed to delete course.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display text-ink-900">Courses</h1>
          <p className="text-xs text-ink-400 mt-0.5">{courses.length} course{courses.length !== 1 ? 's' : ''}</p>
        </div>
        <Link
          to="/admin/courses/new"
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl text-white transition hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #068562, #056B4E)' }}
        >
          <Plus size={15} /> New Course
        </Link>
      </div>

      {/* Filter */}
      <div className="flex gap-1.5 p-1 bg-white rounded-xl border border-ink-300/20 w-fit shadow-card">
        {['all', 'published', 'draft'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-all duration-150 ${
              filter === f ? 'bg-brand-primary text-white shadow-sm' : 'text-ink-500 hover:text-ink-900'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-7 h-7 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : courses.length === 0 ? (
        <div className="bg-white rounded-2xl border border-ink-300/20 shadow-card py-16 text-center text-sm text-ink-400">
          No courses yet. <Link to="/admin/courses/new" className="text-brand-primary hover:underline">Create one</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((course) => (
            <div key={course.id || course._id} className="bg-white rounded-2xl border border-ink-300/20 overflow-hidden shadow-card hover:shadow-card-hover transition-shadow group">
              <div className="relative h-36">
                {course.coverImage?.url ? (
                  <img src={course.coverImage.url} alt={course.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full" style={{ background: 'linear-gradient(135deg, #068562, #71B280)' }} />
                )}
                <div className="absolute top-2.5 left-2.5">
                  <StatusBadge status={course.status || (course.isPublished ? 'published' : 'draft')} />
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-ink-900 leading-snug mb-1 truncate">{course.title}</h3>
                <p className="text-xs text-ink-400 mb-3">{course.category} · {course.enrollmentCount ?? 0} students</p>
                <div className="flex items-center gap-2">
                  <Link
                    to={`/admin/courses/${course.id || course._id}/edit`}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                    style={{ background: 'rgba(6,133,98,0.08)', color: '#068562', border: '1px solid rgba(6,133,98,0.15)' }}
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => setDeleteTarget(course)}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors text-red-500 hover:bg-red-50"
                    style={{ border: '1px solid rgba(239,68,68,0.2)' }}
                  >
                    <Trash2 size={13} className="inline -mt-0.5 mr-1" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Course">
        <p className="text-ink-700 mb-6">
          Delete <strong>{deleteTarget?.title}</strong>? This also removes the cover image from Cloudinary. Cannot be undone.
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="danger" loading={deleting} onClick={handleDelete}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
}
