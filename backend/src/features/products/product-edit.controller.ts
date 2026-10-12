import type { Request, Response } from 'express';
import { sendSuccess } from '@/utils/apiResponse';
import { UnauthorizedError } from '@/utils/AppError';
import { productEditService } from './product-edit.service';
import type {
  CatalogColorBody,
  CatalogTagBody,
  ProductColorsSectionBody,
  ProductCouponSectionBody,
  ProductDescriptionSectionBody,
  ProductEditorialReviewBody,
  ProductGallerySectionBody,
  ProductHighlightsSectionBody,
  ProductInfoSectionBody,
  ProductSizesSectionBody,
  ProductTagsSectionBody,
  ProductTaxSectionBody,
  ProductVariantsSectionBody,
  ProductVideosSectionBody,
} from './product-edit.validation';

export class ProductEditController {
  constructor(private readonly service = productEditService) {}

  getEditPayload = async (req: Request, res: Response): Promise<void> => {
    if (!req.user || !req.site) throw new UnauthorizedError();
    const data = await this.service.getEditPayload({
      siteId: req.site.id,
      siteCode: req.site.code,
      productId: String(req.params.productId),
    });
    sendSuccess(res, data, 'Product edit payload');
  };

  createCatalogColor = async (req: Request, res: Response): Promise<void> => {
    if (!req.user || !req.site) throw new UnauthorizedError();
    const data = await this.service.createCatalogColor({
      siteId: req.site.id,
      siteCode: req.site.code,
      userId: req.user.id,
      body: req.body as CatalogColorBody,
    });
    sendSuccess(res, data, 'Color created', 201);
  };

  createCatalogTag = async (req: Request, res: Response): Promise<void> => {
    if (!req.user || !req.site) throw new UnauthorizedError();
    const data = await this.service.createCatalogTag({
      siteId: req.site.id,
      siteCode: req.site.code,
      userId: req.user.id,
      body: req.body as CatalogTagBody,
    });
    sendSuccess(res, data, 'Tag created', 201);
  };

  updateSizes = async (req: Request, res: Response): Promise<void> => {
    if (!req.user || !req.site) throw new UnauthorizedError();
    const data = await this.service.updateSizes({
      siteId: req.site.id,
      siteCode: req.site.code,
      userId: req.user.id,
      productId: String(req.params.productId),
      body: req.body as ProductSizesSectionBody,
    });
    sendSuccess(res, data, 'Sizes updated');
  };

  updateColors = async (req: Request, res: Response): Promise<void> => {
    if (!req.user || !req.site) throw new UnauthorizedError();
    const data = await this.service.updateColors({
      siteId: req.site.id,
      siteCode: req.site.code,
      userId: req.user.id,
      productId: String(req.params.productId),
      body: req.body as ProductColorsSectionBody,
    });
    sendSuccess(res, data, 'Colors updated');
  };

  updateVariants = async (req: Request, res: Response): Promise<void> => {
    if (!req.user || !req.site) throw new UnauthorizedError();
    const data = await this.service.updateVariants({
      siteId: req.site.id,
      siteCode: req.site.code,
      userId: req.user.id,
      productId: String(req.params.productId),
      body: req.body as ProductVariantsSectionBody,
    });
    sendSuccess(res, data, 'Price / quantity updated');
  };

  updateCoupon = async (req: Request, res: Response): Promise<void> => {
    if (!req.user || !req.site) throw new UnauthorizedError();
    const data = await this.service.updateCoupon({
      siteId: req.site.id,
      siteCode: req.site.code,
      userId: req.user.id,
      productId: String(req.params.productId),
      body: req.body as ProductCouponSectionBody,
    });
    sendSuccess(res, data, 'Coupon updated');
  };

  updateTax = async (req: Request, res: Response): Promise<void> => {
    if (!req.user || !req.site) throw new UnauthorizedError();
    const data = await this.service.updateTax({
      siteId: req.site.id,
      siteCode: req.site.code,
      userId: req.user.id,
      productId: String(req.params.productId),
      body: req.body as ProductTaxSectionBody,
    });
    sendSuccess(res, data, 'Tax updated');
  };

  clearTax = async (req: Request, res: Response): Promise<void> => {
    if (!req.user || !req.site) throw new UnauthorizedError();
    const data = await this.service.clearTax({
      siteId: req.site.id,
      siteCode: req.site.code,
      userId: req.user.id,
      productId: String(req.params.productId),
    });
    sendSuccess(res, data, 'Tax cleared');
  };

  updateGallery = async (req: Request, res: Response): Promise<void> => {
    if (!req.user || !req.site) throw new UnauthorizedError();
    const data = await this.service.updateGallery({
      siteId: req.site.id,
      siteCode: req.site.code,
      userId: req.user.id,
      productId: String(req.params.productId),
      body: req.body as ProductGallerySectionBody,
    });
    sendSuccess(res, data, 'Gallery updated');
  };

  updateVideos = async (req: Request, res: Response): Promise<void> => {
    if (!req.user || !req.site) throw new UnauthorizedError();
    const data = await this.service.updateVideos({
      siteId: req.site.id,
      siteCode: req.site.code,
      userId: req.user.id,
      productId: String(req.params.productId),
      body: req.body as ProductVideosSectionBody,
    });
    sendSuccess(res, data, 'Videos updated');
  };

  updateDescription = async (req: Request, res: Response): Promise<void> => {
    if (!req.user || !req.site) throw new UnauthorizedError();
    const data = await this.service.updateDescription({
      siteId: req.site.id,
      siteCode: req.site.code,
      userId: req.user.id,
      productId: String(req.params.productId),
      body: req.body as ProductDescriptionSectionBody,
    });
    sendSuccess(res, data, 'Description updated');
  };

  updateInfo = async (req: Request, res: Response): Promise<void> => {
    if (!req.user || !req.site) throw new UnauthorizedError();
    const data = await this.service.updateInfo({
      siteId: req.site.id,
      siteCode: req.site.code,
      userId: req.user.id,
      productId: String(req.params.productId),
      body: req.body as ProductInfoSectionBody,
    });
    sendSuccess(res, data, 'Product information updated');
  };

  createEditorialReview = async (req: Request, res: Response): Promise<void> => {
    if (!req.user || !req.site) throw new UnauthorizedError();
    const data = await this.service.createEditorialReview({
      siteId: req.site.id,
      siteCode: req.site.code,
      userId: req.user.id,
      productId: String(req.params.productId),
      body: req.body as ProductEditorialReviewBody,
    });
    sendSuccess(res, data, 'Review created', 201);
  };

  updateEditorialReview = async (req: Request, res: Response): Promise<void> => {
    if (!req.user || !req.site) throw new UnauthorizedError();
    const data = await this.service.updateEditorialReview({
      siteId: req.site.id,
      siteCode: req.site.code,
      userId: req.user.id,
      productId: String(req.params.productId),
      reviewId: String(req.params.reviewId),
      body: req.body as ProductEditorialReviewBody,
    });
    sendSuccess(res, data, 'Review updated');
  };

  deleteEditorialReview = async (req: Request, res: Response): Promise<void> => {
    if (!req.user || !req.site) throw new UnauthorizedError();
    const data = await this.service.deleteEditorialReview({
      siteId: req.site.id,
      siteCode: req.site.code,
      userId: req.user.id,
      productId: String(req.params.productId),
      reviewId: String(req.params.reviewId),
    });
    sendSuccess(res, data, 'Review deleted');
  };

  updateTags = async (req: Request, res: Response): Promise<void> => {
    if (!req.user || !req.site) throw new UnauthorizedError();
    const data = await this.service.updateTags({
      siteId: req.site.id,
      siteCode: req.site.code,
      userId: req.user.id,
      productId: String(req.params.productId),
      body: req.body as ProductTagsSectionBody,
    });
    sendSuccess(res, data, 'Tags updated');
  };

  updateHighlights = async (req: Request, res: Response): Promise<void> => {
    if (!req.user || !req.site) throw new UnauthorizedError();
    const data = await this.service.updateHighlights({
      siteId: req.site.id,
      siteCode: req.site.code,
      userId: req.user.id,
      productId: String(req.params.productId),
      body: req.body as ProductHighlightsSectionBody,
    });
    sendSuccess(res, data, 'Highlights updated');
  };
}

export const productEditController = new ProductEditController();
