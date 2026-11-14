const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
});

/**
 * Send OTP email to user.
 * @param {string} to - Recipient email
 * @param {string} code - 6-digit OTP
 */
async function sendOtpEmail(to, code) {
  if (
    !process.env.EMAIL_APP_PASSWORD ||
    process.env.EMAIL_APP_PASSWORD === "your_app_password" ||
    !process.env.EMAIL_USER ||
    process.env.EMAIL_USER === "your_email@gmail.com"
  ) {
    console.warn("Email credentials not configured; OTP email not sent.");
    console.log(`[DEV] OTP for ${to}: ${code}`);
    return;
  }
  await transporter.sendMail({
    from: process.env.EMAIL_USER || "no-reply@aurapos.io",
    to,
    subject: "Your AuraPOS login code",
    text: `Your one-time login code is: ${code}. It expires in 5 minutes.`,
    html: `<p>Your one-time login code is: <strong>${code}</strong>.</p><p>It expires in 5 minutes.</p>`,
  });
}

/**
 * Send welcome/invite email (e.g. after creating staff).
 * @param {string} to - Recipient email
 * @param {string} name - Recipient name
 * @param {string} role - Role assigned
 */
async function sendInviteEmail(to, name, role) {
  if (
    !process.env.EMAIL_APP_PASSWORD ||
    process.env.EMAIL_APP_PASSWORD === "your_app_password" ||
    !process.env.EMAIL_USER ||
    process.env.EMAIL_USER === "your_email@gmail.com"
  ) {
    console.warn("Email credentials not configured; invite email not sent.");
    return;
  }
  await transporter.sendMail({
    from: process.env.EMAIL_USER || "no-reply@aurapos.io",
    to,
    subject: "You've been added to AuraPOS",
    text: `Hi ${name}, you've been added as ${role}. Use your email to log in with a one-time code.`,
    html: `<p>Hi ${name},</p><p>You've been added as <strong>${role}</strong>. Use your email to log in with a one-time code.</p>`,
  });
}

async function sendReminderEmail({
  guestName,
  guestEmail,
  reservationDate,
  reservationTime,
  partySize,
}) {
  if (!process.env.EMAIL_APP_PASSWORD || !process.env.EMAIL_USER) {
    console.warn("Email credentials not configured; reminder email not sent.");
    return;
  }
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: guestEmail,
    subject: "⏰ Your reservation is in 1 hour!",
    html: `
      <p>Hi <strong>${guestName}</strong>,</p>
      <p>This is a reminder that your reservation at <strong>AuraPOS Bistro</strong> is coming up in <strong>1 hour</strong>.</p>
      <p><strong>Date:</strong> ${reservationDate}</p>
      <p><strong>Time:</strong> ${reservationTime}</p>
      <p><strong>Party size:</strong> ${partySize}</p>
      <p>We look forward to seeing you!</p>
    `,
  });
}

module.exports = {
  sendOtpEmail,
  sendInviteEmail,
  sendReminderEmail,
};
