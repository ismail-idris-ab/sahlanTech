# Daily Quiz — Manual QA Checklist

Nothing in this list was verified in a browser. The backend has an automated
test suite (16 suites, 164 tests, all passing) but the frontend has no test
framework and was never rendered. These are the checks a human has to run.

Run both dev servers first: `sahlearn-api` and `sahlearn-web`.

**Before any of this, run the index migration against your local database:**

```
cd sahlearn-api
node src/migrations/2026-09-23-open-quiz-indexes.js --dry-run   # look first
node src/migrations/2026-09-23-open-quiz-indexes.js             # then apply
```

Without it, the *second* guest to take a quiz on any given day is rejected as a
duplicate. Step 9 is what catches this if the migration was skipped.

## Admin side

1. **Log in to the admin dashboard.** You should land on the dashboard and see
   a **Daily Quiz** entry in the sidebar.
2. **Create today's quiz.** Daily Quizzes → New quiz. The date should pre-fill
   with today's date in Nigerian time. Add a title and **1 to 10** questions,
   each with 2–4 options and one marked correct. A quiz with no questions should
   be refused with a clear message.
3. **Delete an option that sits above the correct answer.** Mark option B
   correct, then delete option A. B must stay marked correct. This was a real
   bug found in review — worth confirming the fix.
4. **Publish it** and confirm it shows as published for today in the list.

### Essay questions

4a. **Add an essay question.** On the quiz form use **+ Essay** instead of
    **+ Multiple choice**. It should show no options and no answer key, just a
    points box (defaults to 5).
4b. **Confirm the mix saves.** A quiz with both kinds should save, and its
    total points should be the sum of both.

## Student side

5. **Open `/quiz` in a private window, logged out.** Today's quiz should be
   ready to start — not "No quiz today". There should be a **Daily Quiz** link
   in the main navbar.
6. **Take the quiz as a guest.** Type a name and a phone number, leave the
   student ID hidden. No password is asked for — that is by design. Answer the
   questions, submit. You should get a score, the time you took, and the
   correct answers revealed.
6a. **Try a bad phone number** (`0601234567`, `12345`). The field should be
    refused with a clear message before anything is submitted.
7. **Take it again, as a student.** Click "I am a Sahlearn student", enter a
   real student ID with a *different* phone number. It should work.
7a. **Enter a student ID that does not exist.** You should get a polite error
    saying so and suggesting you leave it blank — not a silent guest entry and
    not a crash.
8. **Re-enter the same phone number** used in step 6. It should take you
   straight to that existing result, not let you retake the quiz.
8a. **Re-enter that same number written differently** — if you used
    `08012345678`, try `+2348012345678`. It must be recognised as the same
    person and still refuse a retake. This is the check most likely to catch a
    real bug.
9. **Take it a third time with a third phone number** and get a different score.
10. **Check the leaderboard on `/quiz`.** All three listed, higher score first,
    each with a masked phone like `***678`. On a tie, the faster time
    should rank first. The full number must appear nowhere on the page — view
    source and search for it.
10a. **Use "Check my past scores"** with one of those numbers. You should see
     that number's results and no name. Try a number that never took the quiz:
     it should say there are no results, worded exactly the same way as a
     number that exists but has no attempts.
11. **Refresh the page mid-quiz.** The timer must not reset to zero.
11a. **Take a quiz that has an essay question.** The essay shows a textarea with
     a character counter, not options. On submit you should see the MCQ score
     plus "N written answers still to be marked", and your own essay answer
     played back with an **Awaiting marking** tag.
11b. **Check the leaderboard.** That row's score should carry a `*` and the
     footnote explaining it is not final.

## Back to admin

12. **Log in as the student from step 7 and open `/student/daily-quiz`.** The attempt should
    be there with score, date and time taken, plus the stats row (total taken,
    average, best, streak). The student dashboard should also show a Daily Quiz
    card.
13. **Open the quiz's Results page in admin.** Everyone ranked, with their
    times. Guests should carry a **Guest** tag and show their full phone
    number; the student from step 7 should show their student ID instead.
14. **Edit the quiz title and save.** This must succeed even though students
    have already taken it. Same for unticking **Published**.
15. **Edit a question and save.** This must be refused with a conflict message,
    because changing questions would invalidate scores already recorded.
16. **Unpublish today's quiz**, then reload `/quiz` logged out. You should see
    the "no quiz today" state.

### Marking essays

16a. **Open the results page.** Any student with an unmarked essay shows an
     amber **N to mark** badge and a **Mark** link.
16b. **Mark the answer.** Enter a mark and save. The score should rise by
     exactly that amount, the badge should clear, and the link should turn into
     **View**.
16c. **Try a mark above the question's points.** It should be refused, and
     nothing should be saved.
16d. **Re-mark the same answer with a lower mark.** The score should drop to
     match — it must not add on top of the old mark.
16e. **Reload the leaderboard and the student's own history.** Both should show
     the new total, with the pending markers gone.
17. **Visit `/sitemap.xml`** on the API and confirm `/quiz` is listed.

If any step does not match, that is a real bug — report it rather than working
around it.
