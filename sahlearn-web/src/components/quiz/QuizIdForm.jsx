import { useState } from 'react';
import { startQuiz } from '../../services/dailyQuiz.service';
import Button from '../common/Button';

export default function QuizIdForm({ onStarted, onAlreadySubmitted }) {
  const [studentId, setStudentId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!studentId.trim() || loading) return;
    setLoading(true);
    setError('');
    try {
      const data = await startQuiz(studentId.trim());
      onStarted(data);
    } catch (err) {
      const status = err.response?.status;
      const body = err.response?.data;
      // 409: already submitted today — lift the earlier result to the parent
      // instead of showing an error.
      if (status === 409 && body?.data) {
        onAlreadySubmitted(body.data);
        return;
      }
      if (status === 429) {
        setError(body?.message || 'Too many attempts. Please try again in a little while.');
      } else if (status === 404) {
        setError(body?.message || 'We could not find that student ID.');
      } else {
        setError(body?.message || 'Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-sm space-y-3">
      <div>
        <label htmlFor="quiz-student-id" className="block text-sm font-medium text-ink-700 mb-1">
          Student ID
        </label>
        <input
          id="quiz-student-id"
          type="text"
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          placeholder="e.g. SAH-2024-001"
          autoComplete="off"
          className="w-full border border-ink-300 rounded-lg px-4 py-2.5 text-ink-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
        />
        {error && (
          <p role="alert" className="mt-2 text-sm text-red-600">
            {error}
          </p>
        )}
      </div>
      <Button type="submit" loading={loading} disabled={loading} className="w-full sm:w-auto">
        Start Quiz
      </Button>
    </form>
  );
}
