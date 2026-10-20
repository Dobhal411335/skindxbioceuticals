import { getEmailBrand } from '../company/company.config';
import {
  mutedParagraphHtml,
  paragraphHtml,
  rawParagraphHtml,
  renderEmailLayout,
} from '../layouts/email-layout';
import { escapeHtml, stripControlChars, validateSiteCode } from '../email.validation';
import type { DoctorAppointmentRequestedEmailInput, RenderedEmail } from '../email.types';

function formatScheduledDateTime(date: Date, siteCode: string): string {
  const timeZone = siteCode === 'IN' ? 'Asia/Kolkata' : 'UTC';
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone,
  }).format(date);
}

export function renderDoctorAppointmentRequestedEmail(
  input: Omit<DoctorAppointmentRequestedEmailInput, 'to'>,
): RenderedEmail {
  const siteCode = validateSiteCode(input.siteCode);
  const brand = getEmailBrand(siteCode);
  const patientName = stripControlChars(input.patientName);
  const doctorName = stripControlChars(input.doctorName);
  const phone = stripControlChars(input.phone);
  const email = stripControlChars(input.email);
  const problem = stripControlChars(input.problem);
  const formattedTime = formatScheduledDateTime(input.scheduledAt, siteCode);

  const detailsTableHtml = `
    <div style="background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:16px 20px;margin:20px 0;">
      <h3 style="margin:0 0 12px;font-size:15px;color:#111827;font-weight:600;">Booking Request Details</h3>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size:14px;color:#374151;line-height:1.6;">
        <tr><td style="padding:4px 0;width:140px;color:#6b7280;">Patient Name:</td><td style="padding:4px 0;font-weight:500;">${escapeHtml(patientName)}</td></tr>
        <tr><td style="padding:4px 0;color:#6b7280;">Phone Number:</td><td style="padding:4px 0;font-weight:500;">${escapeHtml(phone)}</td></tr>
        <tr><td style="padding:4px 0;color:#6b7280;">Email Address:</td><td style="padding:4px 0;font-weight:500;">${escapeHtml(email)}</td></tr>
        <tr><td style="padding:4px 0;color:#6b7280;">Doctor:</td><td style="padding:4px 0;font-weight:600;color:#0f766e;">${escapeHtml(doctorName)}</td></tr>
        <tr><td style="padding:4px 0;color:#6b7280;">Requested Time:</td><td style="padding:4px 0;font-weight:500;">${escapeHtml(formattedTime)}</td></tr>
        ${problem ? `<tr><td style="padding:4px 0;color:#6b7280;vertical-align:top;">Problem / Notes:</td><td style="padding:4px 0;">${escapeHtml(problem)}</td></tr>` : ''}
      </table>
    </div>
  `;

  const contentHtml = [
    paragraphHtml(`Dear ${patientName},`),
    rawParagraphHtml(
      `Your doctor booking request for <strong>${escapeHtml(doctorName)}</strong> has been received by our team. You will shortly receive an update via email regarding whether your booking is confirmed or not.`,
    ),
    detailsTableHtml,
    mutedParagraphHtml(
      'Our team is reviewing your requested time slot with the clinician and will follow up with you shortly.',
    ),
    paragraphHtml(`If you have any urgent queries, feel free to contact us at ${brand.supportEmail}.`),
  ].join('');

  const contentText = [
    `Dear ${patientName},`,
    '',
    `Your doctor booking request for ${doctorName} has been received by our team. You will shortly receive an update via email regarding whether your booking is confirmed or not.`,
    '',
    'Booking Request Details:',
    `- Patient Name: ${patientName}`,
    `- Phone: ${phone}`,
    `- Email: ${email}`,
    `- Doctor: ${doctorName}`,
    `- Requested Time: ${formattedTime}`,
    ...(problem ? [`- Problem / Notes: ${problem}`] : []),
    '',
    'Our team is reviewing your requested time slot with the clinician and will follow up with you shortly.',
    `Support Email: ${brand.supportEmail}`,
  ].join('\n');

  const layout = renderEmailLayout({
    brand,
    title: 'Appointment Request Received',
    contentHtml,
    contentText,
    preheader: `Booking request received for ${doctorName}`,
  });

  return {
    subject: `Doctor Appointment Request Received — ${doctorName}`,
    ...layout,
  };
}
