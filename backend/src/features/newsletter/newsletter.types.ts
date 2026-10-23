export interface NewsletterSubscriberDto {
  id: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SendPromotionalEmailBody {
  recipients: string[];
  subject: string;
  messageHtml: string;
}

export interface SendPromotionalEmailResultDto {
  sentCount: number;
  failedCount: number;
  totalRecipients: number;
}
