import { emptyFaqConfigDto, FaqService, toFaqConfigDto } from '../faq.service';
import type { FaqRepository } from '../faq.repository';
import type { FaqSectionRecord } from '../faq.types';

function makeRecords(): FaqSectionRecord[] {
  return [
    {
      id: '11111111-1111-1111-1111-111111111111',
      siteId: '22222222-2222-2222-2222-222222222222',
      title: 'General',
      order: 1,
      active: true,
      items: [
        {
          id: '33333333-3333-3333-3333-333333333333',
          sectionId: '11111111-1111-1111-1111-111111111111',
          question: 'What are your hours?',
          answer: 'Monday to Saturday, 10:00–18:00 IST.',
          showOnLanding: true,
          order: 1,
          active: true,
        },
        {
          id: '44444444-4444-4444-4444-444444444444',
          sectionId: '11111111-1111-1111-1111-111111111111',
          question: 'Hidden question',
          answer: 'Should not appear on landing.',
          showOnLanding: false,
          order: 2,
          active: true,
        },
      ],
    },
    {
      id: '55555555-5555-5555-5555-555555555555',
      siteId: '22222222-2222-2222-2222-222222222222',
      title: 'Inactive section',
      order: 2,
      active: false,
      items: [
        {
          id: '66666666-6666-6666-6666-666666666666',
          sectionId: '55555555-5555-5555-5555-555555555555',
          question: 'Inactive Q',
          answer: 'Inactive A',
          showOnLanding: true,
          order: 1,
          active: true,
        },
      ],
    },
  ];
}

describe('FaqService', () => {
  const listBySiteId = jest.fn();
  const replaceBySiteId = jest.fn();
  const repository = {
    listBySiteId,
    replaceBySiteId,
  } as unknown as FaqRepository;

  const service = new FaqService(repository);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns empty defaults when no sections exist', async () => {
    listBySiteId.mockResolvedValue([]);
    const dto = await service.getForSite('site-1', 'IN');
    expect(dto).toEqual(emptyFaqConfigDto('IN'));
  });

  it('maps all nested items for admin', async () => {
    const records = makeRecords();
    listBySiteId.mockResolvedValue(records);
    const dto = await service.getForSite(records[0]!.siteId, 'IN');
    expect(dto).toEqual(toFaqConfigDto(records, 'IN'));
    expect(dto.sections).toHaveLength(2);
    expect(dto.sections[0]?.items).toHaveLength(2);
  });

  it('filters inactive sections/items for public reads', async () => {
    listBySiteId.mockResolvedValue(makeRecords());
    const dto = await service.getForSite('site-1', 'IN', { activeOnly: true });
    expect(dto.sections).toHaveLength(1);
    expect(dto.sections[0]?.title).toBe('General');
    expect(dto.sections[0]?.items).toHaveLength(2);
  });

  it('filters landing-only items and drops empty sections', async () => {
    listBySiteId.mockResolvedValue(makeRecords());
    const dto = await service.getForSite('site-1', 'IN', {
      activeOnly: true,
      landingOnly: true,
    });
    expect(dto.sections).toHaveLength(1);
    expect(dto.sections[0]?.items).toHaveLength(1);
    expect(dto.sections[0]?.items[0]?.question).toBe('What are your hours?');
  });

  it('upserts using siteId from context', async () => {
    const records = makeRecords().slice(0, 1);
    replaceBySiteId.mockResolvedValue(records);

    const dto = await service.upsertForSite({
      siteId: records[0]!.siteId,
      siteCode: 'COM',
      userId: 'user-1',
      body: {
        sections: [
          {
            title: 'General',
            active: true,
            order: 1,
            items: [
              {
                question: 'What are your hours?',
                answer: 'Monday to Saturday, 10:00–18:00 IST.',
                showOnLanding: true,
                active: true,
                order: 1,
              },
            ],
          },
        ],
      },
    });

    expect(replaceBySiteId).toHaveBeenCalledWith(
      records[0]!.siteId,
      expect.arrayContaining([
        expect.objectContaining({
          title: 'General',
          items: expect.arrayContaining([
            expect.objectContaining({ showOnLanding: true }),
          ]),
        }),
      ]),
    );
    expect(dto.siteCode).toBe('COM');
    expect(dto.sections[0]?.title).toBe('General');
  });
});
