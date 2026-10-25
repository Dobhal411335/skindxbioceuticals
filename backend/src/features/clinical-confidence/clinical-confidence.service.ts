import { deleteStoredCloudinaryAssetBestEffort } from '@/lib/cloudinary';
import type { SiteCode } from '@/types/common';
import { clinicalConfidenceRepository } from './clinical-confidence.repository';
import type { ClinicalConfidenceConfigBody } from './clinical-confidence.validation';
import type {
  ClinicalConfidenceConfigDto,
  ClinicalConfidenceConfigRecord,
} from './clinical-confidence.types';

const https = (url: string) =>
  url.startsWith('http://res.cloudinary.com/') ? `https://${url.slice(7)}` : url;

function toDto(
  record: ClinicalConfidenceConfigRecord,
  siteCode: SiteCode,
): ClinicalConfidenceConfigDto {
  return {
    id: record.id,
    siteCode,
    badgeText: record.badgeText,
    heading: record.heading,
    description: record.description,
    button1Label: record.button1Label,
    button1Url: record.button1Url,
    button2Label: record.button2Label,
    button2Url: record.button2Url,
    backgroundImageUrl: https(record.backgroundImageUrl),
    backgroundImagePublicId: record.backgroundImagePublicId,
    cards: record.cards.map((card) => ({ ...card, imageUrl: https(card.imageUrl) })),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export class ClinicalConfidenceService {
  async getForSite(siteId: string, siteCode: SiteCode): Promise<ClinicalConfidenceConfigDto> {
    const record = await clinicalConfidenceRepository.findBySiteId(siteId);
    if (!record)
      return {
        id: null,
        siteCode,
        badgeText: '',
        heading: '',
        description: '',
        button1Label: '',
        button1Url: '',
        button2Label: '',
        button2Url: '',
        backgroundImageUrl: '',
        backgroundImagePublicId: '',
        cards: [],
        updatedAt: null,
      };
    return toDto(record, siteCode);
  }

  async upsertForSite(input: {
    siteId: string;
    siteCode: SiteCode;
    body: ClinicalConfidenceConfigBody;
  }): Promise<ClinicalConfidenceConfigDto> {
    const previous = await clinicalConfidenceRepository.findBySiteId(input.siteId);
    const next = await clinicalConfidenceRepository.upsertBySiteId(input.siteId, input.body);
    const retained = new Set(
      [
        input.body.backgroundImagePublicId,
        ...input.body.cards.map((card) => card.imagePublicId),
      ].filter(Boolean),
    );
    const previousIds = previous
      ? [previous.backgroundImagePublicId, ...previous.cards.map((card) => card.imagePublicId)]
      : [];
    await Promise.all(
      previousIds
        .filter((id) => id && !retained.has(id))
        .map((id) => deleteStoredCloudinaryAssetBestEffort(id)),
    );
    return toDto(next, input.siteCode);
  }
}

export const clinicalConfidenceService = new ClinicalConfidenceService();
