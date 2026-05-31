import { Link } from 'react-router-dom';
import { Clock, BarChart2 } from 'lucide-react';

const LEVEL_COLOR = {
  Beginner: 'bg-green-100 text-green-700',
  Intermediate: 'bg-yellow-100 text-yellow-700',
  Advanced: 'bg-red-100 text-red-700',
};

export default function CourseCard({ course }) {
  return (
    <Link to={`/courses/${course.slug}`} className="group block bg-white rounded-xl shadow-sm border border-ink-300/40 overflow-hidden hover:shadow-md transition-shadow">
      <div className="relative h-48 bg-surface-100">
        {course.coverImage?.url ? (
          <img
            src={course.coverImage.url}
            alt={course.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-ink-300 text-4xl font-bold">
            {course.title[0]}
          </div>
        )}
        <span className="absolute top-3 left-3 bg-white/90 text-xs font-medium text-ink-700 px-2 py-1 rounded-full">
          {course.category}
        </span>
        {course.isFree ? (
          <span className="absolute top-3 right-3 text-xs font-bold px-2.5 py-1 rounded-full bg-green-500 text-white">
            Free
          </span>
        ) : (
          <span className={`absolute top-3 right-3 text-xs font-medium px-2 py-1 rounded-full ${LEVEL_COLOR[course.level]}`}>
            {course.level}
          </span>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-ink-900 group-hover:text-brand-primary transition-colors line-clamp-2">
          {course.title}
        </h3>
        <p className="text-ink-500 text-sm mt-1 line-clamp-2">{course.shortDescription}</p>

        <div className="flex items-center justify-between mt-4 pt-3 border-t border-ink-300/40">
          <div className="flex items-center gap-1 text-ink-500 text-xs">
            <Clock size={13} />
            <span>{course.duration}</span>
          </div>
          {course.isFree ? (
            <span className="font-bold text-green-600 text-sm bg-green-50 px-2 py-0.5 rounded-full border border-green-200">Free</span>
          ) : (
            <span className="font-semibold text-brand-primary text-sm">{course.price}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
