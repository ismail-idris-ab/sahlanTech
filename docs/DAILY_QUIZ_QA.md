# Daily Quiz — Manual QA Checklist

Nothing in this list was verified in a browser. The backend has an automated
test suite (12 suites, 96 tests, all passing) but the frontend has no test
framework and the agents that built it had no browser. These are the checks a
human has to run.

Run both dev servers first: `sahlearn-api` and `sahlearn-web`.

## Admin side

1. **Log in to the admin dashboard.** You should land on the dashboard and see
   a **Daily Quiz** entry in the sidebar.
2. **Create today's quiz.** Daily Quizzes → New quiz. The date should pre-fill
   with today's date in Nigerian time. Add a title and **5 to 10** questions,
   each with 2–4 options and one marked correct. Fewer than 5 questions should
   be refused with a clear message.
3. **Delete an option that sits above the correct answer.** Mark option B
   correct, then delete option A. B must stay marked correct. This was a real
   bug found in review — worth confirming the fix.
4. **Publish it** and confirm it shows as published for today in the list.

## Student side

5. **Open `/quiz` in a private window, logged out.** Today's quiz should be
   ready to start — not "No quiz today". There should be a **Daily Quiz** link
   in the main navbar.
6. **Take the quiz by typing a real student ID.** No password is asked for —
   that is by design. Answer the questions, submit. You should get a score,
   the time you took, and the correct answers revealed.
7. **Enter a student ID that does not exist.** You should get a polite error on
   the field, not a crash.
8. **Try the same student ID a second time.** It should take you straight to
   that student's existing result, not let them retake the quiz.
9. **Take it again with a second student ID** and get a different score.
10. **Check the leaderboard on `/quiz`.** Both students listed, higher score
    first. On a tie, the faster time should rank first.
11. **Refresh the page mid-quiz.** The timer must not reset to zero.

## Back to admin

12. **Log in as a student and open `/student/daily-quiz`.** The attempt should
    be there with score, date and time taken, plus the stats row (total taken,
    average, best, streak). The student dashboard should also show a Daily Quiz
    card.
13. **Open the quiz's Results page in admin.** Both students, ranked, with
    their times.
14. **Edit the quiz title and save.** This must succeed even though students
    have already taken it. Same for unticking **Published**.
15. **Edit a question and save.** This must be refused with a conflict message,
    because changing questions would invalidate scores already recorded.
16. **Unpublish today's quiz**, then reload `/quiz` logged out. You should see
    the "no quiz today" state.
17. **Visit `/sitemap.xml`** on the API and confirm `/quiz` is listed.

If any step does not match, that is a real bug — report it rather than working
around it.
