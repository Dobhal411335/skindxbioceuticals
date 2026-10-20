import { getEmailBrand } from '../company/company.config';
import {
  mutedParagraphHtml,
  paragraphHtml,
  rawParagraphHtml,
  renderEmailLayout,
} from '../layouts/email-layout';
import { escapeHtml, stripControlChars, validateSiteCode } from '../email.validation';
import type { DoctorAppointmentCancelledEmailInput, RenderedEmail } from '../email.types';

function formatScheduledDateTime(date: Date, siteCode: string): string {
  const timeZone = siteCode === 'IN' ? 'Asia/Kolkata' : 'UTC';
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone,
  }).format(date);
}

export function renderDoctorAppointmentCancelledEmail(
  input: Omit<DoctorAppointmentCancelledEmailInput, 'to'>,
): RenderedEmail {
  const siteCode = validateSiteCode(input.siteCode);
  const brand = getEmailBrand(siteCode);
  const patientName = stripControlChars(input.patientName);
  const doctorName = stripControlChars(input.doctorName);
  const formattedTime = input.scheduledAt
    ? formatScheduledDateTime(input.scheduledAt, siteCode)
    : undefined;

  const contentHtml = [
    paragraphHtml(`Dear ${patientName},`),
    rawParagraphHtml(
      `Your doctor appointment booking with <strong>${escapeHtml(doctorName)}</strong>${formattedTime ? ` originally scheduled for <strong>${escapeHtml(formattedTime)}</strong>` : ''} has been <strong>cancelled</strong>.`,
    ),
    mutedParagraphHtml(
      'If you would like to reschedule or book another consultation slot, please visit our website or get in touch with our team.',
    ),
    paragraphHtml(`If you have any questions or require assistance, please contact us at ${brand.supportEmail}.`),
  ].join('');

  const contentText = [
    `Dear ${patientName},`,
    '',
    `Your doctor appointment booking with ${doctorName}${formattedTime ? ` originally scheduled for ${formattedTime}` : ''} has been cancelled.`,
    '',
    'If you would like to reschedule or book another consultation slot, please visit our website or get in touch with our team.',
    `Support Email: ${brand.supportEmail}`,
  ].join('\n');

  const layout = renderEmailLayout({
    brand,
    title: 'Booking Cancelled',
    contentHtml,
    contentText,
    preheader: `Your appointment with ${doctorName} has been cancelled`,
  });

  return {
    subject: `Doctor Appointment Cancelled — ${doctorName}`,
    ...layout,
  };
}
