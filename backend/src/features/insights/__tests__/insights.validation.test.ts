import {
  insightsConfigBodySchema,
  normalizeInsightsConfigInput,
} from '../insights.validation';

describe('insights validation', () => {
  it('normalizes aliases and fills order', () => {
    const normalized = normalizeInsightsConfigInput({
      cards: [
        {
          category: 'Skin Care',
          title: 'Aloe tips',
          date: '2025-11-22',
          image_url: 'https://cdn.example.com/a.jpg',
          description: '<p>Hello</p>',
        },
      ],
      qa: [
        {
          name: 'What is aloe?',
          description: '<p>A plant extract note.</p>',
        },
      ],
    });

    const parsed = insightsConfigBodySchema.parse(normalized);
    expect(parsed.cards).toHaveLength(1);
    expect(parsed.cards[0]?.name).toBe('Aloe tips');
    expect(parsed.cards[0]?.buttonLabel).toBe('');
    expect(parsed.cards[0]?.buttonUrl).toBe('');
    expect(parsed.cards[0]?.order).toBe(1);
    expect(parsed.qaItems).toHaveLength(1);
    expect(parsed.qaItems[0]?.question).toBe('What is aloe?');
  });

  it('rejects empty category/name after normalize drops blanks', () => {
    const normalized = normalizeInsightsConfigInput({
      cards: [{ category: '', name: '' }],
      qaItems: [],
    });
    const parsed = insightsConfigBodySchema.parse(normalized);
    expect(parsed.cards).toEqual([]);
  });

  it('rejects non-http image URLs', () => {
    const result = insightsConfigBodySchema.safeParse({
      cards: [
        {
          category: 'Skin Care',
          name: 'Test',
          publishedAt: '2025-11-22',
          imageUrl: 'javascript:alert(1)',
          description: '<p>x</p>',
        },
      ],
      qaItems: [],
    });
    expect(result.success).toBe(false);
  });

  it('accepts button label and relative button URL', () => {
    const parsed = insightsConfigBodySchema.parse({
      cards: [
        {
          category: 'Skin Care',
          name: 'Test',
          publishedAt: '2025-11-22',
          imageUrl: '',
          description: '<p>x</p>',
          buttonLabel: 'Learn more',
          buttonUrl: '/blog/test',
        },
      ],
      qaItems: [],
    });
    expect(parsed.cards[0]?.buttonLabel).toBe('Learn more');
    expect(parsed.cards[0]?.buttonUrl).toBe('/blog/test');
  });
});
