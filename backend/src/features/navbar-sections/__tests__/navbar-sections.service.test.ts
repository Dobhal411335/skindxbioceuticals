import { NavbarSectionsService, toNavbarSectionDto } from '../navbar-sections.service';
import type { NavbarSectionsRepository } from '../navbar-sections.repository';
import type { NavbarSectionRecord } from '../navbar-sections.types';
import { NotFoundError } from '@/utils/AppError';

function makeRecord(overrides: Partial<NavbarSectionRecord> = {}): NavbarSectionRecord {
  return {
    id: '11111111-1111-1111-1111-111111111111',
    siteId: '22222222-2222-2222-2222-222222222222',
    title: 'Shop',
    url: '/shop',
    menuHeading: '',
    menuDescription: '',
    active: true,
    order: 1,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    subSections: [
      {
        id: '33333333-3333-3333-3333-333333333333',
        sectionId: '11111111-1111-1111-1111-111111111111',
        title: 'Serums',
        url: '/shop/serums',
        description: '',
        active: true,
        order: 1,
      },
    ],
    ...overrides,
  };
}

describe('NavbarSectionsService', () => {
  const listBySiteId = jest.fn();
  const listActiveBySiteId = jest.fn();
  const findByIdForSite = jest.fn();
  const nextOrder = jest.fn();
  const create = jest.fn();
  const update = jest.fn();
  const setActive = jest.fn();
  const deleteFn = jest.fn();

  const repository = {
    listBySiteId,
    listActiveBySiteId,
    findByIdForSite,
    nextOrder,
    create,
    update,
    setActive,
    delete: deleteFn,
  } as unknown as NavbarSectionsRepository;

  const service = new NavbarSectionsService(repository);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lists and maps sections for a site', async () => {
    const record = makeRecord();
    listBySiteId.mockResolvedValue([record]);

    const result = await service.listForSite(record.siteId, 'IN');

    expect(listBySiteId).toHaveBeenCalledWith(record.siteId);
    expect(result).toEqual([toNavbarSectionDto(record, 'IN')]);
  });

  it('creates using siteId from context and next order when omitted', async () => {
    const record = makeRecord();
    nextOrder.mockResolvedValue(3);
    create.mockResolvedValue(record);

    const dto = await service.createForSite({
      siteId: record.siteId,
      siteCode: 'IN',
      userId: 'user-1',
      body: {
        title: 'Shop',
        url: '/shop',
        active: true,
        menuHeading: '',
        menuDescription: '',
        subSections: [
          {
            title: 'Serums',
            url: '/shop/serums',
            description: '',
            active: true,
            order: 1,
          },
        ],
      },
    });

    expect(create).toHaveBeenCalledWith(record.siteId, {
      title: 'Shop',
      url: '/shop',
      menuHeading: '',
      menuDescription: '',
      active: true,
      order: 3,
      subSections: [
        {
          title: 'Serums',
          url: '/shop/serums',
          description: '',
          active: true,
          order: 1,
        },
      ],
    });
    expect(dto.id).toBe(record.id);
  });

  it('throws NotFoundError when updating a missing section', async () => {
    findByIdForSite.mockResolvedValue(null);

    await expect(
      service.updateForSite({
        siteId: 'site-1',
        siteCode: 'IN',
        userId: 'user-1',
        sectionId: '11111111-1111-1111-1111-111111111111',
        body: {
          title: 'Shop',
          url: '/shop',
          menuHeading: '',
          menuDescription: '',
          active: true,
          order: 1,
          subSections: [],
        },
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('patches active status for a site-scoped section', async () => {
    const record = makeRecord({ active: false });
    setActive.mockResolvedValue(record);

    const dto = await service.patchActiveForSite({
      siteId: record.siteId,
      siteCode: 'COM',
      userId: 'user-1',
      sectionId: record.id,
      body: { active: false },
    });

    expect(setActive).toHaveBeenCalledWith(record.siteId, record.id, false);
    expect(dto.active).toBe(false);
    expect(dto.siteCode).toBe('COM');
  });

  it('throws NotFoundError when deleting a missing section', async () => {
    deleteFn.mockResolvedValue(false);

    await expect(
      service.deleteForSite({
        siteId: 'site-1',
        siteCode: 'IN',
        userId: 'user-1',
        sectionId: '11111111-1111-1111-1111-111111111111',
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
