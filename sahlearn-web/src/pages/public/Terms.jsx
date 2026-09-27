import { Link } from 'react-router-dom';
import SEO from '../../components/common/SEO';

const SUPPORT_EMAIL = 'sahlearntechnology@gmail.com';
const UPDATED = '26 September 2026';

const h2 = 'text-lg font-semibold text-ink-900 mt-8 mb-2';
const p = 'text-ink-600 text-sm leading-relaxed';
const ul = 'list-disc pl-5 space-y-1 text-ink-600 text-sm leading-relaxed';

export default function Terms() {
  return (
    <>
      <SEO
        title="Terms of Service"
        description="The terms that apply when you use the Sahlearn website, enrol in a course or take a quiz."
        url="/terms"
      />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <h1 className="text-3xl font-display text-ink-900">Terms of Service</h1>
        <p className="text-xs text-ink-400 mt-1">Last updated {UPDATED}</p>

        <p className={`${p} mt-6`}>
          By using this website, enrolling in a course or taking a quiz, you agree to these terms.
        </p>

        <h2 className={h2}>Enrolment and payment</h2>
        <ul className={ul}>
          <li>An enrolment request is a request — your place is confirmed once we accept it.</li>
          <li>Course fees are quoted in Nigerian naira and are payable as stated at enrolment.</li>
          <li>
            Every payment we record issues a receipt with its own receipt number. Keep the link we
            send you.
          </li>
          <li>
            Where a payment is cancelled, the receipt is marked void and the original link stops being
            valid.
          </li>
        </ul>

        <h2 className={h2}>Student accounts</h2>
        <ul className={ul}>
          <li>Your login belongs to you alone. Do not share it.</li>
          <li>Tell us at once if you think someone else has your password.</li>
          <li>
            We may suspend an account used to disrupt a class, cheat in an exam or abuse other
            learners.
          </li>
        </ul>

        <h2 className={h2}>Course materials</h2>
        <p className={p}>
          Course materials, lesson notes, quizzes and exam questions belong to Sahlearn. You may use
          them for your own study. You may not resell, republish or redistribute them without our
          written permission.
        </p>

        <h2 className={h2}>Quizzes and leaderboards</h2>
        <p className={p}>
          The daily quiz is open to anyone. Taking it as a guest means the name you give appears on a
          public leaderboard for that day. Pick a name you are comfortable showing publicly.
        </p>

        <h2 className={h2}>Acceptable use</h2>
        <ul className={ul}>
          <li>Do not attempt to break into, overload or probe this site or its API.</li>
          <li>Do not upload anything unlawful, offensive or infringing.</li>
          <li>Do not submit another person&rsquo;s details as your own.</li>
        </ul>

        <h2 className={h2}>Advertising and third-party links</h2>
        <p className={p}>
          This site shows third-party advertising and may link to other websites. We do not control
          those advertisers or sites and are not responsible for their content or their practices. See
          our{' '}
          <Link to="/privacy" className="text-brand-primary hover:underline">
            Privacy Policy
          </Link>{' '}
          for how advertising cookies are used.
        </p>

        <h2 className={h2}>Availability</h2>
        <p className={p}>
          We aim to keep the site available but do not guarantee uninterrupted service. Features may
          change or be withdrawn.
        </p>

        <h2 className={h2}>Liability</h2>
        <p className={p}>
          We provide our courses and this website in good faith. To the extent the law allows, we are
          not liable for indirect or consequential loss arising from your use of the site.
        </p>

        <h2 className={h2}>Changes</h2>
        <p className={p}>
          We may update these terms. The date at the top shows when they last changed. Continuing to
          use the site means you accept the current version.
        </p>

        <h2 className={h2}>Contact</h2>
        <p className={p}>
          Questions about these terms? Email{' '}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="text-brand-primary hover:underline">
            {SUPPORT_EMAIL}
          </a>
          .
        </p>
      </div>
    </>
  );
}
