import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Pencil, Trash2, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminGetCourses, deleteCourse, updateCourse } from '../../services/courses.service';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import EmptyState from '../../components/common/EmptyState';

const STATUS_BADGE = {
  true: 'bg-green-100 text-green-700',
  false: 'bg-yellow-100 text-yellow-700',
};

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
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs font-semibold text-brand-primary uppercase tracking-wider mb-1">Learning</p>
          <h1 className="font-display text-3xl text-ink-900">Courses</h1>
        </div>
        <Link to="/admin/courses/new">
          <Button icon={<Plus size={15} />}>New Course</Button>
        </Link>
      </div>

      {/* Filter */}
      <div className="flex gap-1.5 mb-5 p-1 bg-white rounded-xl border border-ink-300/20 w-fit shadow-card">
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
          <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : courses.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No courses yet"
          description="Add your first course to get started."
          action={<Link to="/admin/courses/new"><Button>+ New Course</Button></Link>}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-ink-300/20 shadow-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-ink-300/20">
              <tr>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-ink-500 uppercase tracking-wide">Title</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-ink-500 uppercase tracking-wide hidden md:table-cell">Category</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-ink-500 uppercase tracking-wide hidden lg:table-cell">Level</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-ink-500 uppercase tracking-wide">Status</th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-ink-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-300/15">
              {courses.map((course) => (
                <tr key={course.id} className="hover:bg-surface-100/60 transition-colors">
                  <td className="px-5 py-3.5 font-medium text-ink-900 max-w-xs truncate">{course.title}</td>
                  <td className="px-5 py-3.5 text-ink-600 hidden md:table-cell">{course.category}</td>
                  <td className="px-5 py-3.5 text-ink-600 hidden lg:table-cell capitalize">{course.level}</td>
                  <td className="px-5 py-3.5">
                    <button
                      onClick={() => handleTogglePublish(course)}
                      className={`px-2.5 py-0.5 rounded-full text-xs font-semibold cursor-pointer transition-all ${STATUS_BADGE[course.isPublished]}`}
                    >
                      {course.isPublished ? 'Published' : 'Draft'}
                    </button>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1">
                      <Link to={`/admin/courses/${course.id}/edit`}>
                        <button className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-400 hover:text-brand-primary hover:bg-brand-primary/8 transition-all">
                          <Pencil size={14} />
                        </button>
                      </Link>
                      <button
                        onClick={() => setDeleteTarget(course)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-400 hover:text-brand-danger hover:bg-red-50 transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
