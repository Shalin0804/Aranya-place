import nodemailer from 'nodemailer';

// SMTP is optional: without SMTP_HOST, emails are logged as skipped (never
// reported as sent). Any SMTP provider works (Gmail app password, Brevo,
// SES, Resend SMTP...).
const transporter = process.env.SMTP_HOST
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } : undefined,
    })
  : null;

const FROM = process.env.EMAIL_FROM || 'Aranya Palace Resort & Spa <no-reply@aranyapalace.in>';
const SITE = (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '');

export const emailEnabled = Boolean(transporter);

const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = (n) => `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
const day = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

export function bookingLink(b) {
  return `${SITE}/booking-confirmation/${b.booking_ref}${b.access_token ? `?token=${b.access_token}` : ''}`;
}

/** Branded wrapper; inline styles because email clients ignore <style>. */
function layout(title, bodyHtml) {
  return `<!doctype html><html><body style="margin:0;background:#F7F3EC;font-family:Arial,Helvetica,sans-serif;color:#22201B">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 12px"><tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#FFFEFB;border-radius:12px;overflow:hidden">
<tr><td style="background:#2A332A;padding:28px 32px;color:#FFFEFB">
<div style="font-family:Georgia,serif;font-size:22px">Aranya Palace</div>
<div style="font-size:11px;letter-spacing:3px;color:#C89B62;margin-top:4px">RESORT &amp; SPA</div></td></tr>
<tr><td style="padding:32px">
<h1 style="font-family:Georgia,serif;font-weight:normal;font-size:24px;margin:0 0 16px">${esc(title)}</h1>
${bodyHtml}
</td></tr>
<tr><td style="padding:20px 32px;background:#EFE8D9;font-size:12px;color:#857E70">
Aranya Palace Resort &amp; Spa · Village Bavla Road, near Sanand, Ahmedabad, Gujarat · +91 79 4811 2200</td></tr>
</table></td></tr></table></body></html>`;
}

function detailsTable(b) {
  const rows = [
    ['Booking reference', b.booking_ref],
    ['Room', `${b.room_type_name || ''} × ${b.num_rooms}`],
    ['Check-in', day(b.check_in)],
    ['Check-out', day(b.check_out)],
    ['Nights', b.nights],
    ['Guests', `${b.adults} adult(s)${b.children ? `, ${b.children} child(ren)` : ''}`],
    ['Total', money(b.total_amount)],
    ['Payment', b.payment_status],
  ];
  return `<table role="presentation" width="100%" cellpadding="8" cellspacing="0" style="border-collapse:collapse;font-size:14px;margin:16px 0">
${rows.map(([k, v]) => `<tr><td style="border-bottom:1px solid #EFE8D9;color:#857E70">${esc(k)}</td><td style="border-bottom:1px solid #EFE8D9;text-align:right"><strong>${esc(v)}</strong></td></tr>`).join('')}
</table>`;
}

const button = (href, label) =>
  `<p style="margin:24px 0"><a href="${esc(href)}" style="background:#A97C43;color:#FFFEFB;padding:12px 22px;border-radius:6px;text-decoration:none;font-weight:bold">${esc(label)}</a></p>`;

export const templates = {
  bookingConfirmed: (b) => ({
    to: b.guest_email,
    subject: `Your stay is confirmed — ${b.booking_ref}`,
    html: layout(`We look forward to welcoming you, ${b.guest_name}`,
      `<p>Your booking at Aranya Palace is confirmed.</p>${detailsTable(b)}
${button(bookingLink(b), 'View or manage booking')}
<p style="font-size:13px;color:#857E70">Keep this email: the button above is your private link to view, pay for or cancel this booking. Free cancellation online until the day before check-in.</p>`),
  }),
  bookingCancelled: (b) => ({
    to: b.guest_email,
    subject: `Booking cancelled — ${b.booking_ref}`,
    html: layout('Your booking has been cancelled',
      `<p>Dear ${esc(b.guest_name)}, booking <strong>${esc(b.booking_ref)}</strong> has been cancelled.</p>${detailsTable(b)}
<p>If you paid online, our team will process any refund due under our cancellation policy and confirm by email.</p>`),
  }),
  bookingUpdated: (b) => ({
    to: b.guest_email,
    subject: `Booking update — ${b.booking_ref}`,
    html: layout('Your booking has been updated',
      `<p>Dear ${esc(b.guest_name)}, the status of your booking is now <strong>${esc(b.status)}</strong>.</p>${detailsTable(b)}${button(bookingLink(b), 'View booking')}`),
  }),
  paymentReceived: (b) => ({
    to: b.guest_email,
    subject: `Payment received — ${b.booking_ref}`,
    html: layout('Thank you, your payment is received',
      `<p>We have received your payment of <strong>${money(b.total_amount)}</strong> for booking ${esc(b.booking_ref)}.</p>${detailsTable(b)}${button(bookingLink(b), 'View booking')}`),
  }),
  adminNewBooking: (b) => ({
    to: process.env.ADMIN_NOTIFY_EMAIL,
    subject: `New booking ${b.booking_ref} — ${b.guest_name}`,
    html: layout('New booking received',
      `<p>${esc(b.guest_name)} (${esc(b.guest_email)}, ${esc(b.guest_phone)}${b.guest_country ? `, ${esc(b.guest_country)}` : ''}) just booked.</p>${detailsTable(b)}
${b.special_requests ? `<p><strong>Special requests:</strong> ${esc(b.special_requests)}</p>` : ''}`),
  }),
};

/**
 * Fire-and-forget: a mail outage must never fail or roll back a booking.
 * Returns true only when the SMTP server accepted the message.
 */
export async function sendEmail(name, booking) {
  const msg = templates[name](booking);
  if (!msg.to) return false;
  if (!transporter) {
    console.log(`[EMAIL] skipped "${name}" to ${msg.to}: SMTP not configured`);
    return false;
  }
  try {
    await transporter.sendMail({ from: FROM, ...msg });
    return true;
  } catch (err) {
    console.error(`[EMAIL] failed "${name}" to ${msg.to}:`, err.message);
    return false;
  }
}
