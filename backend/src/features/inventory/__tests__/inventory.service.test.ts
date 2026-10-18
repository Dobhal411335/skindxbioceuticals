import { NotFoundError } from '@/utils/AppError';
import { InventoryService } from '../inventory.service';

const repository = {
  listForStock: jest.fn(),
  countForStock: jest.fn(),
  findVariantForSite: jest.fn(),
  setVariantQuantityOnHand: jest.fn(),
};

describe('InventoryService', () => {
  const service = new InventoryService(repository as never);
  const siteId = '22222222-2222-2222-2222-222222222222';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lists stock rows with simple-offer qty and multi-variant details', async () => {
    repository.listForStock.mockResolvedValue([
      {
        id: 'p1',
        productCode: 'BASE-01',
        name: 'Base Serum',
        status: 'ACTIVE',
        subcategoryId: 'sub-1',
        bannerUrl: null,
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
        subcategory: {
          id: 'sub-1',
          name: 'Serums',
          parentId: 'cat-1',
          parent: { id: 'cat-1', name: 'Skincare' },
        },
        galleryImages: [{ imageUrl: 'http://res.cloudinary.com/demo/a.jpg', isPrimary: true }],
        variants: [
          {
            id: 'v1',
            name: 'Default',
            price: 499,
            vendorPrice: 300,
            currency: 'INR',
            sizeLabel: null,
            colorLabel: null,
            isActive: true,
            profileImageUrl: null,
            inventory: { id: 'inv-1', quantityOnHand: 8, quantityReserved: 0 },
          },
        ],
      },
      {
        id: 'p2',
        productCode: 'VAR-01',
        name: 'Tinted Cream',
        status: 'DRAFT',
        subcategoryId: null,
        bannerUrl: 'https://cdn.example/banner.png',
        updatedAt: new Date('2026-01-02T00:00:00.000Z'),
        subcategory: null,
        galleryImages: [],
        variants: [
          {
            id: 'v2',
            name: 'S / Red',
            price: 200,
            vendorPrice: null,
            currency: 'INR',
            sizeLabel: 'S',
            colorLabel: 'Red',
            isActive: true,
            profileImageUrl: null,
            inventory: { id: 'inv-2', quantityOnHand: 3, quantityReserved: 0 },
          },
          {
            id: 'v3',
            name: 'M / Blue',
            price: 220,
            vendorPrice: null,
            currency: 'INR',
            sizeLabel: 'M',
            colorLabel: 'Blue',
            isActive: true,
            profileImageUrl: null,
            inventory: { id: 'inv-3', quantityOnHand: 12, quantityReserved: 0 },
          },
        ],
      },
    ]);
    repository.countForStock.mockResolvedValue(2);

    const result = await service.listForAdmin({
      siteId,
      siteCode: 'IN',
      query: { status: 'all', page: 1, limit: 10 },
    });

    expect(result.meta).toEqual({ page: 1, limit: 10, total: 2, totalPages: 1 });
    expect(result.items).toHaveLength(2);
    const [simple, multi] = result.items;
    expect(simple?.isSimpleOffer).toBe(true);
    expect(simple?.quantity).toBe(8);
    expect(simple?.imageUrl).toBe('https://res.cloudinary.com/demo/a.jpg');
    expect(simple?.price).toBe(499);
    expect(simple?.vendorPrice).toBe(300);
    expect(simple?.categoryName).toBe('Skincare');

    expect(multi?.isSimpleOffer).toBe(false);
    expect(multi?.quantity).toBe(15);
    expect(multi?.variants).toHaveLength(2);
    expect(multi?.imageUrl).toBe('https://cdn.example/banner.png');
    expect(multi?.status).toBe('DRAFT');
  });

  it('updates absolute variant qty when variant belongs to the site', async () => {
    repository.findVariantForSite.mockResolvedValue({
      id: 'v1',
      productId: 'p1',
      product: { id: 'p1', siteId, name: 'Serum' },
      inventory: { id: 'inv-1', quantityOnHand: 5, quantityReserved: 1 },
    });
    repository.setVariantQuantityOnHand.mockResolvedValue({ quantityOnHand: 11 });

    const result = await service.updateVariantQuantity({
      siteId,
      siteCode: 'IN',
      userId: 'user-1',
      variantId: 'v1',
      quantity: 11,
    });

    expect(result).toEqual({
      productId: 'p1',
      variantId: 'v1',
      quantity: 11,
    });
    expect(repository.setVariantQuantityOnHand).toHaveBeenCalledWith(
      expect.objectContaining({
        variantId: 'v1',
        inventoryItemId: 'inv-1',
        previousQuantity: 5,
        nextQuantity: 11,
      }),
    );
  });

  it('rejects qty update for variant outside the site', async () => {
    repository.findVariantForSite.mockResolvedValue(null);

    await expect(
      service.updateVariantQuantity({
        siteId,
        siteCode: 'IN',
        userId: 'user-1',
        variantId: 'missing',
        quantity: 4,
      }),
    ).rejects.toBeInstanceOf(NotFoundError);

    expect(repository.setVariantQuantityOnHand).not.toHaveBeenCalled();
  });
});
