import { getEmailBrand } from '../company/company.config';
import {
  mutedParagraphHtml,
  paragraphHtml,
  rawParagraphHtml,
  renderEmailLayout,
} from '../layouts/email-layout';
import { escapeHtml, stripControlChars, validateSiteCode } from '../email.validation';
import type { DoctorAppointmentConfirmedEmailInput, RenderedEmail } from '../email.types';

function formatScheduledDateTime(date: Date, siteCode: string): string {
  const timeZone = siteCode === 'IN' ? 'Asia/Kolkata' : 'UTC';
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone,
  }).format(date);
}

export function renderDoctorAppointmentConfirmedEmail(
  input: Omit<DoctorAppointmentConfirmedEmailInput, 'to'>,
): RenderedEmail {
  const siteCode = validateSiteCode(input.siteCode);
  const brand = getEmailBrand(siteCode);
  const patientName = stripControlChars(input.patientName);
  const doctorName = stripControlChars(input.doctorName);
  const formattedTime = formatScheduledDateTime(input.scheduledAt, siteCode);

  const confirmationBoxHtml = `
    <div style="background-color:#ecfdf5;border:1px solid #a7f3d0;border-radius:12px;padding:16px 20px;margin:20px 0;">
      <h3 style="margin:0 0 10px;font-size:15px;color:#065f46;font-weight:600;">Confirmed Appointment Details</h3>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size:14px;color:#374151;line-height:1.6;">
        <tr><td style="padding:4px 0;width:140px;color:#6b7280;">Patient:</td><td style="padding:4px 0;font-weight:500;">${escapeHtml(patientName)}</td></tr>
        <tr><td style="padding:4px 0;color:#6b7280;">Doctor:</td><td style="padding:4px 0;font-weight:600;color:#0f766e;">${escapeHtml(doctorName)}</td></tr>
        <tr><td style="padding:4px 0;color:#6b7280;">Confirmed Time:</td><td style="padding:4px 0;font-weight:600;color:#111827;">${escapeHtml(formattedTime)}</td></tr>
      </table>
    </div>
  `;

  const contentHtml = [
    paragraphHtml(`Dear ${patientName},`),
    rawParagraphHtml(
      `Great news! Your doctor booking for <strong>${escapeHtml(doctorName)}</strong> has been <strong>confirmed</strong> by our team.`,
    ),
    confirmationBoxHtml,
    mutedParagraphHtml(
      'Please ensure you are reachable at your registered phone number or email around your appointment time.',
    ),
    paragraphHtml(`If you need to reschedule or have questions, contact us at ${brand.supportEmail}.`),
  ].join('');

  const contentText = [
    `Dear ${patientName},`,
    '',
    `Great news! Your doctor booking for ${doctorName} has been confirmed by our team.`,
    '',
    'Confirmed Appointment Details:',
    `- Patient: ${patientName}`,
    `- Doctor: ${doctorName}`,
    `- Confirmed Time: ${formattedTime}`,
    '',
    'Please ensure you are reachable at your registered phone number or email around your appointment time.',
    `Support Email: ${brand.supportEmail}`,
  ].join('\n');

  const layout = renderEmailLayout({
    brand,
    title: 'Booking Confirmed',
    contentHtml,
    contentText,
    preheader: `Your appointment with ${doctorName} is confirmed`,
  });

  return {
    subject: `Doctor Appointment Confirmed — ${doctorName}`,
    ...layout,
  };
}
