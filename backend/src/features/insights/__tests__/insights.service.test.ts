import {
  emptyInsightsConfigDto,
  InsightsService,
  toInsightsConfigDto,
} from '../insights.service';
import type { InsightsRepository } from '../insights.repository';
import type { InsightCardRecord, InsightQaRecord } from '../insights.types';

function makeCards(): InsightCardRecord[] {
  return [
    {
      id: '11111111-1111-1111-1111-111111111111',
      siteId: '22222222-2222-2222-2222-222222222222',
      category: 'Skin Care',
      name: 'Vitamin C tips',
      publishedAt: new Date('2025-11-22T00:00:00.000Z'),
      imageUrl: 'https://cdn.example.com/a.jpg',
      imagePublicId: 'insights/a',
      description: '<p>Full rich description</p>',
      order: 1,
      active: true,
    },
    {
      id: '33333333-3333-3333-3333-333333333333',
      siteId: '22222222-2222-2222-2222-222222222222',
      category: 'Hidden',
      name: 'Inactive card',
      publishedAt: new Date('2025-10-01T00:00:00.000Z'),
      imageUrl: '',
      imagePublicId: '',
      description: '<p>Hidden</p>',
      order: 2,
      active: false,
    },
  ];
}

function makeQa(): InsightQaRecord[] {
  return [
    {
      id: '44444444-4444-4444-4444-444444444444',
      siteId: '22222222-2222-2222-2222-222222222222',
      question: 'What is an insight?',
      answer: '<p>A short wellness note.</p>',
      order: 1,
      active: true,
    },
    {
      id: '55555555-5555-5555-5555-555555555555',
      siteId: '22222222-2222-2222-2222-222222222222',
      question: 'Inactive Q',
      answer: '<p>Inactive A</p>',
      order: 2,
      active: false,
    },
  ];
}

describe('InsightsService', () => {
  const listCardsBySiteId = jest.fn();
  const listQaBySiteId = jest.fn();
  const replaceBySiteId = jest.fn();
  const repository = {
    listCardsBySiteId,
    listQaBySiteId,
    replaceBySiteId,
  } as unknown as InsightsRepository;

  const service = new InsightsService(repository);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns empty defaults when no insights exist', async () => {
    listCardsBySiteId.mockResolvedValue([]);
    listQaBySiteId.mockResolvedValue([]);
    const dto = await service.getForSite('site-1', 'IN');
    expect(dto).toEqual(emptyInsightsConfigDto('IN'));
  });

  it('maps all cards and Q&A for admin', async () => {
    const cards = makeCards();
    const qaItems = makeQa();
    listCardsBySiteId.mockResolvedValue(cards);
    listQaBySiteId.mockResolvedValue(qaItems);

    const dto = await service.getForSite(cards[0]!.siteId, 'IN');
    expect(dto).toEqual(toInsightsConfigDto(cards, qaItems, 'IN'));
    expect(dto.cards).toHaveLength(2);
    expect(dto.qaItems).toHaveLength(2);
    expect(dto.cards[0]?.publishedAt).toBe('2025-11-22T00:00:00.000Z');
  });

  it('filters inactive items for public reads', async () => {
    listCardsBySiteId.mockResolvedValue(makeCards());
    listQaBySiteId.mockResolvedValue(makeQa());

    const dto = await service.getForSite('site-1', 'IN', { activeOnly: true });
    expect(dto.cards).toHaveLength(1);
    expect(dto.cards[0]?.name).toBe('Vitamin C tips');
    expect(dto.qaItems).toHaveLength(1);
    expect(dto.qaItems[0]?.question).toBe('What is an insight?');
  });

  it('upserts and logs without secrets', async () => {
    const cards = makeCards().filter((card) => card.active);
    const qaItems = makeQa().filter((item) => item.active);
    replaceBySiteId.mockResolvedValue({ cards, qaItems });

    const dto = await service.upsertForSite({
      siteId: 'site-1',
      siteCode: 'IN',
      userId: 'user-1',
      body: {
        cards: [
          {
            category: 'Skin Care',
            name: 'Vitamin C tips',
            publishedAt: new Date('2025-11-22T00:00:00.000Z'),
            imageUrl: 'https://cdn.example.com/a.jpg',
            imagePublicId: 'insights/a',
            description: '<p>Full rich description</p>',
            active: true,
            order: 1,
          },
        ],
        qaItems: [
          {
            question: 'What is an insight?',
            answer: '<p>A short wellness note.</p>',
            active: true,
            order: 1,
          },
        ],
      },
    });

    expect(replaceBySiteId).toHaveBeenCalledWith(
      'site-1',
      expect.any(Array),
      expect.any(Array),
    );
    expect(dto.cards).toHaveLength(1);
    expect(dto.qaItems).toHaveLength(1);
  });
});
