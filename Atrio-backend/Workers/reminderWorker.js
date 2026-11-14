const cron = require("node-cron");
const Reservation = require("../models/Reservation");
const { sendReminderEmail } = require("../utils/email");

// Runs every minute
cron.schedule("* * * * *", async () => {
  try {
    const now = new Date();

    // Find reservations in the 55–65 min window that haven't been reminded yet
    const reservations = await Reservation.find({ reminder_sent: false });

    for (const r of reservations) {
      if (!r.guestEmail) continue;
      const slot = new Date(
        `${String(r.date).trim()}T${String(r.time).trim()}`,
      );
      const minutesUntil = (slot - now) / 60000;

      if (minutesUntil >= 55 && minutesUntil <= 65) {
        await sendReminderEmail({
          guestName: r.guestName,
          guestEmail: r.guestEmail,
          reservationDate: r.date,
          reservationTime: r.time,
          partySize: r.partySize,
        });

        r.reminder_sent = true;
        await r.save();
        console.log(`Reminder sent to ${r.guestEmail} for ${r.date} ${r.time}`);
      }
    }
  } catch (err) {
    console.error("Reminder cron error:", err.message);
  }
});
