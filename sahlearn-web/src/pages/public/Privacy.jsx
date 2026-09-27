import SEO from '../../components/common/SEO';

const SUPPORT_EMAIL = 'sahlearntechnology@gmail.com';
const UPDATED = '26 September 2026';

const h2 = 'text-lg font-semibold text-ink-900 mt-8 mb-2';
const p = 'text-ink-600 text-sm leading-relaxed';
const ul = 'list-disc pl-5 space-y-1 text-ink-600 text-sm leading-relaxed';

export default function Privacy() {
  return (
    <>
      <SEO
        title="Privacy Policy"
        description="How Sahlearn collects, uses and protects your information, including cookies and third-party advertising."
        url="/privacy"
      />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <h1 className="text-3xl font-display text-ink-900">Privacy Policy</h1>
        <p className="text-xs text-ink-400 mt-1">Last updated {UPDATED}</p>

        <p className={`${p} mt-6`}>
          Sahlearn (&ldquo;we&rdquo;, &ldquo;us&rdquo;) runs this website to teach practical digital
          skills. This policy explains what information we collect, why we collect it, and what you
          can do about it.
        </p>

        <h2 className={h2}>Information you give us</h2>
        <ul className={ul}>
          <li>
            <strong>Contact form:</strong> your name, email address, phone number and message.
          </li>
          <li>
            <strong>Enrolment:</strong> your name, email, phone number, the course you chose and any
            payment reference you send us.
          </li>
          <li>
            <strong>Student account:</strong> your login email, a hashed password, and the
            assignment, exam, attendance and payment records tied to your studies.
          </li>
          <li>
            <strong>Daily quiz:</strong> your name and phone number when you take a quiz as a guest,
            so we can put your score on the leaderboard.
          </li>
        </ul>
        <p className={`${p} mt-3`}>
          We never ask for card details on this site. Passwords are stored hashed, never in plain
          text.
        </p>

        <h2 className={h2}>Information collected automatically</h2>
        <p className={p}>
          Like most websites, our hosting and analytics providers record technical data such as your
          IP address, browser, device type, the pages you open and the time of your visit.
        </p>

        <h2 className={h2}>Cookies and similar technologies</h2>
        <p className={p}>
          We use cookies and browser storage for three purposes: keeping you signed in, measuring how
          the site is used, and showing advertising.
        </p>
        <ul className={`${ul} mt-3`}>
          <li>
            <strong>Essential:</strong> your login session. Without these the student and admin areas
            cannot work.
          </li>
          <li>
            <strong>Analytics:</strong> Google Analytics, to count visits and see which pages are
            useful.
          </li>
          <li>
            <strong>Advertising:</strong> Google AdSense and its partners.
          </li>
        </ul>

        <h2 className={h2}>Third-party advertising</h2>
        <p className={p}>
          Third-party vendors, including Google, use cookies to serve ads based on your prior visits
          to this website or other websites. Google&rsquo;s use of advertising cookies enables it and
          its partners to serve ads to you based on your visit to our site and/or other sites on the
          internet.
        </p>
        <p className={`${p} mt-3`}>
          You may opt out of personalised advertising by visiting{' '}
          <a
            href="https://www.google.com/settings/ads"
            target="_blank"
            rel="noreferrer noopener"
            className="text-brand-primary hover:underline"
          >
            Google Ads Settings
          </a>
          , or opt out of a third-party vendor&rsquo;s use of cookies for personalised advertising at{' '}
          <a
            href="https://www.aboutads.info/choices/"
            target="_blank"
            rel="noreferrer noopener"
            className="text-brand-primary hover:underline"
          >
            aboutads.info/choices
          </a>
          .
        </p>

        <h2 className={h2}>How we use your information</h2>
        <ul className={ul}>
          <li>To answer your enquiries and process your enrolment.</li>
          <li>To run your studies: assignments, exams, attendance, quizzes and receipts.</li>
          <li>To send you course-related notices by email or WhatsApp.</li>
          <li>To understand how the site is used and improve it.</li>
        </ul>
        <p className={`${p} mt-3`}>
          We do not sell your personal information. We share it only with the service providers who
          run this platform on our behalf — our hosting, database, email, image hosting, analytics and
          advertising providers — or where the law requires it.
        </p>

        <h2 className={h2}>How long we keep it</h2>
        <p className={p}>
          Student and payment records are kept for as long as you study with us and afterwards where
          we need them for our own records. Contact messages and enrolment requests are kept until we
          no longer need them. You can ask us to delete your data at any time.
        </p>

        <h2 className={h2}>Your choices</h2>
        <ul className={ul}>
          <li>Ask us for a copy of the information we hold about you.</li>
          <li>Ask us to correct anything that is wrong.</li>
          <li>Ask us to delete your account and its data.</li>
          <li>Block or delete cookies in your browser settings.</li>
        </ul>

        <h2 className={h2}>Children</h2>
        <p className={p}>
          Where a learner is under 18, a parent or guardian should enrol on their behalf and remains
          responsible for the information provided.
        </p>

        <h2 className={h2}>Changes to this policy</h2>
        <p className={p}>
          We may update this policy. The date at the top always shows when it last changed.
        </p>

        <h2 className={h2}>Contact us</h2>
        <p className={p}>
          Questions about this policy, or a request about your data? Email{' '}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="text-brand-primary hover:underline">
            {SUPPORT_EMAIL}
          </a>
          .
        </p>
      </div>
    </>
  );
}
