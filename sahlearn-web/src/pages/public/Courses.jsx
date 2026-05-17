import { useState, useEffect, useCallback } from 'react';
import { BookOpen } from 'lucide-react';
import { getCourses } from '../../services/courses.service';
import CourseCard from '../../components/courses/CourseCard';
import CourseFilters from '../../components/courses/CourseFilters';
import EmptyState from '../../components/common/EmptyState';
import SEO from '../../components/common/SEO';

export default function CoursesPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', category: '', level: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.search) params.search = filters.search;
      if (filters.category) params.category = filters.category;
      const res = await getCourses(params);
      let data = res.data;
      if (filters.level) data = data.filter((c) => c.level === filters.level);
      setCourses(data);
    } catch {
      setCourses([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <SEO title="Courses" description="Browse practical digital skills courses in Design, Office, AI, and Marketing." url="/courses" />
      <h1 className="text-3xl md:text-4xl font-bold text-ink-900 font-display mb-2">Courses</h1>
      <p className="text-ink-500 mb-8">Practical digital skills, taught simply.</p>

      <CourseFilters filters={filters} onChange={setFilters} />

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl h-72 animate-pulse border border-ink-300/40" />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="mt-12">
          <EmptyState
            icon={BookOpen}
            title="No courses found"
            description="Try adjusting your filters."
            action={
              <button onClick={() => setFilters({ search: '', category: '', level: '' })} className="text-brand-primary hover:underline text-sm">
                Clear filters
              </button>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {courses.map((course) => <CourseCard key={course.id} course={course} />)}
        </div>
      )}
    </div>
  );
}
