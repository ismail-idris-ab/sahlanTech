# Sales & Receipts — Manual QA Checklist

None of this was verified in a browser by the implementer. The backend has
automated tests covering the arithmetic, the locking rules and the public
payload, but no frontend test framework exists and no screen here has ever been
rendered. These are the checks a human has to run.

Run both dev servers first: `sahlearn-api` and `sahlearn-web`.

No database migration is needed — these are new collections.

## Admin: a sale paid in full

1. **Log in to the admin dashboard.** There should be a **Sales** entry in the
   sidebar and in the mobile "More" sheet.
2. **New sale.** Enter a name and a Nigerian phone number. Add one item, e.g.
   `HP EliteBook 840 G5`, quantity 1, price `185000`. Leave the student ID blank.
3. **Enter the full amount in "Payment now"** and save. You should land on the
   sale, status **Paid**, balance ₦0, with one receipt listed.
4. **Try a bad phone number** (`0601234567`) — refused before saving.

## Admin: part payment

5. **New sale** for ₦50,000, this time entering a real **student ID**, and pay
   ₦20,000. Status should read **Part paid**, balance ₦30,000.
6. **Record ₦20,000 more.** Balance ₦10,000, a second receipt appears.
7. **Try to pay ₦20,000 again** — refused, with a message naming the ₦10,000
   balance. Nothing should be recorded.
8. **Pay exactly ₦10,000.** Status **Paid**, balance ₦0, three receipts.
9. **Confirm the three receipts add up** to ₦50,000 and each shows its own
   "paid to date" running total.

## Admin: the rules that protect a receipt

10. **Try to change the items on that sale.** Refused with a conflict message,
    because a payment exists.
11. **Change the customer's name and the notes.** Allowed.
12. **Void the middle receipt**, giving a reason. The balance should go back up
    by exactly that amount, the row should show struck through with the reason,
    and the receipt number must **not** be reused by the next payment.
13. **Void the whole sale.** Status **Void**, all its receipts voided, and no
    further payment can be recorded.

## Sharing a receipt

14. **Press WhatsApp** on a receipt. WhatsApp should open with a ready message
    containing a `/receipt/<token>` link. Send it to yourself and open it.
15. **Open that link in a private window.** The receipt should render with no
    login. Then **view the page source and search for the customer's phone
    number — it must not appear anywhere.** Same for the student ID.
16. **Press PDF.** An A4 PDF downloads, branded, with the items, totals and
    balance. Open it and check the figures match the screen exactly.
17. **Open the same receipt link on a phone.** A **Share** button should appear
    alongside Print and PDF; on desktop it should not. Pressing it should offer
    to send the actual PDF file.
18. **Print the public page** with Ctrl+P. The action buttons should not appear
    in the printout.
19. **Open a voided receipt's link.** It should load and say plainly that it was
    cancelled, with the reason — not a "not found" error, because the customer
    already has that link.
20. **Try a made-up link**, e.g. `/receipt/abc123`. A polite "not found", no crash.

## Student side

21. **Log in as the student from step 5** and open **Payments**. Their receipts
    should be listed with the amounts and balance, plus the two summary cards.
22. **Press View on a receipt** — it opens the same public receipt page.
23. **Confirm a voided sale disappears** from this list and from the totals.

If any step does not match, that is a real bug — report it rather than working
around it.
