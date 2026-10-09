import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { CatalogProduct } from "@/data/catalog";

type ProductInfoTabsProps = {
  product: CatalogProduct;
};

export function ProductInfoTabs({ product }: ProductInfoTabsProps) {
  return (
    <section className="container-page section-space border-t border-border">
      <Tabs defaultValue="details">
        <TabsList variant="line" className="h-auto w-full flex-wrap justify-start gap-2">
          <TabsTrigger value="details">Product details</TabsTrigger>
          <TabsTrigger value="additional">Additional information</TabsTrigger>
          <TabsTrigger value="shipping">Shipping &amp; return</TabsTrigger>
          <TabsTrigger value="care">Usage notes</TabsTrigger>
        </TabsList>
        <TabsContent value="details" className="mt-6 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          {product.description}
        </TabsContent>
        <TabsContent value="additional" className="mt-6 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          {product.additionalInfo}
        </TabsContent>
        <TabsContent value="shipping" className="mt-6 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          {product.shippingReturn}
        </TabsContent>
        <TabsContent value="care" className="mt-6 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          Follow the pack insert for usage. This storefront does not provide
          medical diagnosis or treatment recommendations.
        </TabsContent>
      </Tabs>
    </section>
  );
}
