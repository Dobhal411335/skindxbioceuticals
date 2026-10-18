import { vendorApplicationCreateBodySchema } from '../vendors.validation';

describe('vendorApplicationCreateBodySchema', () => {
  const base = {
    businessName: 'Acme',
    businessType: 'Distributor',
    industryCategory: 'Skincare',
    yearOfEstablishment: '2018',
    legalStructure: 'Pvt Ltd',
    isGstRegistered: false,
    panNumber: 'AAAAA0000A',
    panCard: { url: 'https://cdn.example/pan.pdf', publicId: 'pan' },
    cancelledCheque: { url: 'https://cdn.example/cheque.pdf', publicId: 'cheque' },
    productCatalog: { url: 'https://cdn.example/catalog.pdf', publicId: 'catalog' },
    authorizedPersonPhoto: { url: 'https://cdn.example/photo.jpg', publicId: 'photo' },
    contactPerson: 'Riya',
    designation: 'Owner',
    mobile: '9876543210',
    email: 'riya@example.com',
    address: '12 Street',
    city: 'Mumbai',
    state: 'MH',
    pincode: '400001',
    country: 'India',
    deliveryCapability: 'Pan India',
    bankName: 'HDFC',
    accountHolderName: 'Riya',
    accountNumber: '1234567890',
    ifscCode: 'HDFC0001234',
    branch: 'Andheri',
    returnPolicy: '7 days',
  };

  it('accepts a valid payload', () => {
    const parsed = vendorApplicationCreateBodySchema.safeParse(base);
    expect(parsed.success).toBe(true);
  });

  it('requires GST when registered', () => {
    const parsed = vendorApplicationCreateBodySchema.safeParse({
      ...base,
      isGstRegistered: true,
      gstNumber: 'bad',
    });
    expect(parsed.success).toBe(false);
  });
});
