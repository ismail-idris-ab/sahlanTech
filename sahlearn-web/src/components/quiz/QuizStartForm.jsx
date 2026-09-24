import { useState } from 'react';
import { startQuiz } from '../../services/dailyQuiz.service';
import Button from '../common/Button';

// Mirrors utils/phone.js on the API. Kept deliberately loose here — the server
// is the authority, this only catches the obvious typo before a round trip.
const NIGERIAN_PHONE = /^(\+234|234|0)[789][01]\d{8}$/;

export default function QuizStartForm({ onStarted, onAlreadySubmitted }) {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [studentId, setStudentId] = useState('');
  const [showStudentId, setShowStudentId] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const validate = () => {
    const errors = {};
    if (fullName.trim().length < 2) errors.fullName = 'Enter your full name';
    if (!NIGERIAN_PHONE.test(phone.replace(/[\s()-]/g, ''))) {
      errors.phone = 'Enter a valid Nigerian phone number, e.g. 08012345678';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError('');
    if (!validate()) return;

    setLoading(true);
    try {
      const data = await startQuiz({
        fullName: fullName.trim(),
        phone: phone.trim(),
        // Only sent when they actually filled it in — an empty string would be
        // read as a wrong ID and refused.
        studentId: studentId.trim() || undefined,
      });
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
      if (status === 422 && Array.isArray(body?.errors)) {
        setFieldErrors(
          body.errors.reduce((acc, e2) => ({ ...acc, [e2.field]: e2.message }), {})
        );
      } else if (status === 429) {
        setError(body?.message || 'Too many attempts. Please try again in a little while.');
      } else if (status === 404) {
        // Either no quiz today, or a student ID that does not exist.
        setError(body?.message || 'We could not start the quiz.');
      } else {
        setError(body?.message || 'Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (field) =>
    `w-full border rounded-lg px-4 py-2.5 text-ink-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary ${
      fieldErrors[field] ? 'border-red-400' : 'border-ink-300'
    }`;

  return (
    <form onSubmit={handleSubmit} className="max-w-sm space-y-4" noValidate>
      <div>
        <label htmlFor="quiz-full-name" className="block text-sm font-medium text-ink-700 mb-1">
          Your name
        </label>
        <input
          id="quiz-full-name"
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="e.g. Musa Ibrahim"
          autoComplete="name"
          className={inputClass('fullName')}
        />
        {fieldErrors.fullName && (
          <p role="alert" className="mt-1 text-sm text-red-600">{fieldErrors.fullName}</p>
        )}
      </div>

      <div>
        <label htmlFor="quiz-phone" className="block text-sm font-medium text-ink-700 mb-1">
          Phone number
        </label>
        <input
          id="quiz-phone"
          type="tel"
          inputMode="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="e.g. 08012345678"
          autoComplete="tel"
          className={inputClass('phone')}
        />
        {fieldErrors.phone ? (
          <p role="alert" className="mt-1 text-sm text-red-600">{fieldErrors.phone}</p>
        ) : (
          <p className="mt-1 text-xs text-ink-400">
            Used to save your score and stop double entries. Only part of it is ever shown publicly.
          </p>
        )}
      </div>

      {showStudentId ? (
        <div>
          <label htmlFor="quiz-student-id" className="block text-sm font-medium text-ink-700 mb-1">
            Student ID <span className="font-normal text-ink-400">(optional)</span>
          </label>
          <input
            id="quiz-student-id"
            type="text"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            placeholder="e.g. SAH-2024-001"
            autoComplete="off"
            className={inputClass('studentId')}
          />
          <p className="mt-1 text-xs text-ink-400">
            Adds this score to your student dashboard. Leave it blank if you are not a Sahlearn student.
          </p>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowStudentId(true)}
          className="text-sm text-brand-primary hover:underline"
        >
          I am a Sahlearn student — add my student ID
        </button>
      )}

      {error && (
        <p role="alert" className="text-sm text-red-600">{error}</p>
      )}

      <Button type="submit" loading={loading} disabled={loading} className="w-full sm:w-auto">
        Start Quiz
      </Button>
    </form>
  );
}
