import { ConflictError, NotFoundError, ValidationError } from '@/utils/AppError';
import { webpageRepository } from '../webpage.repository';
import { RESERVED_WEBPAGE_SLUGS, WebpageService } from '../webpage.service';

jest.mock('../webpage.repository', () => ({
  webpageRepository: {
    listBySiteId: jest.fn(),
    findByIdForSite: jest.fn(),
    findBySlugForSite: jest.fn(),
    slugExists: jest.fn(),
    create: jest.fn(),
    patchMeta: jest.fn(),
    updateContent: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.mock('@/lib/cloudinary', () => ({
  deleteStoredCloudinaryAssetBestEffort: jest.fn().mockResolvedValue(undefined),
}));

const siteId = '22222222-2222-2222-2222-222222222222';
const webpageId = '11111111-1111-1111-1111-111111111111';

function baseRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: webpageId,
    siteId,
    title: 'Our Story',
    slug: 'our-story',
    active: true,
    templateType: 'design1',
    titleLine: '',
    keywords: [],
    firstTitle: '',
    secondTitle: '',
    imageFirst: null,
    imageFirstMobile: null,
    bannerImage: null,
    bannerImageMobile: null,
    paragraphFirstImage: null,
    paragraphSecondImage: null,
    advertisementImage: null,
    sideThumbImage: null,
    mainProfileImage: null,
    createTags: [],
    postedBy: { admin: false, user: false },
    highlights: [],
    paragraphSections: [],
    tableTitle: '',
    tableRows: [],
    blockquoteMainTitle: '',
    blockquoteLeftTitle: '',
    blockquoteDescription: '',
    blockquoteTags: [],
    accordionTags: [],
    advertisements: [],
    advertisementUrl: '',
    sideThumbName: '',
    sideThumbDesignation: '',
    sideThumbDescription: '',
    facebookUrl: '',
    youtubeUrl: '',
    instaUrl: '',
    googleUrl: '',
    imageGallery: [],
    notices: [],
    searchLocations: [],
    design5Chip: '',
    design5MainHeading: '',
    gridCards: [],
    design6Chip: '',
    design6ExploreLink: '',
    design6MainHeading: '',
    design6SubHeading: '',
    design6Author: '',
    design6MidHeading: '',
    design6MidLink: '',
    teamCards: [],
    design7Chip: '',
    design7ExploreLink: '',
    design7MainHeading: '',
    design9MiniHeading: '',
    design9MainHeading: '',
    design9Description: '',
    design9Cards: [],
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

describe('WebpageService', () => {
  const service = new WebpageService();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('exposes reserved storefront slugs', () => {
    expect(RESERVED_WEBPAGE_SLUGS.has('about')).toBe(true);
    expect(RESERVED_WEBPAGE_SLUGS.has('products')).toBe(true);
  });

  it('creates a webpage with generated slug', async () => {
    (webpageRepository.slugExists as jest.Mock).mockResolvedValue(false);
    (webpageRepository.create as jest.Mock).mockResolvedValue(
      baseRecord({ slug: 'our-story' }),
    );

    const result = await service.createForSite({
      siteId,
      siteCode: 'IN',
      userId: 'user-1',
      body: { title: 'Our Story', active: true, templateType: 'design1' },
    });

    expect(result.slug).toBe('our-story');
    expect(webpageRepository.create).toHaveBeenCalledWith(
      siteId,
      expect.objectContaining({ title: 'Our Story', slug: 'our-story' }),
    );
  });

  it('rejects reserved slug on create', async () => {
    await expect(
      service.createForSite({
        siteId,
        siteCode: 'IN',
        userId: 'user-1',
        body: {
          title: 'About',
          slug: 'about',
          active: true,
          templateType: 'design1',
        },
      }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('rejects duplicate slug', async () => {
    (webpageRepository.slugExists as jest.Mock).mockResolvedValue(true);

    await expect(
      service.createForSite({
        siteId,
        siteCode: 'IN',
        userId: 'user-1',
        body: {
          title: 'Dup',
          slug: 'our-story',
          active: true,
          templateType: 'design1',
        },
      }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it('returns public webpage by slug only when active', async () => {
    (webpageRepository.findBySlugForSite as jest.Mock).mockResolvedValue(baseRecord());

    const result = await service.getPublicBySlug(siteId, 'IN', 'our-story');
    expect(result.slug).toBe('our-story');
    expect(webpageRepository.findBySlugForSite).toHaveBeenCalledWith(
      siteId,
      'our-story',
      true,
    );
  });

  it('throws when public slug missing', async () => {
    (webpageRepository.findBySlugForSite as jest.Mock).mockResolvedValue(null);
    await expect(service.getPublicBySlug(siteId, 'IN', 'missing')).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });
});
