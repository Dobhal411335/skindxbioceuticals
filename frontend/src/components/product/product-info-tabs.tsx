import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { PublicProductDetail } from "@/types/product";

type ProductInfoTabsProps = {
  product: PublicProductDetail;
};

export function ProductInfoTabs({ product }: ProductInfoTabsProps) {
  const sections = product.infoSections ?? [];

  if (sections.length === 0 && !product.description) {
    return null;
  }

  const defaultValue = sections[0]?.id ?? "description";

  return (
    <section className="container-page section-space border-t border-gray-500">
      <Tabs defaultValue={defaultValue}>
        <TabsList variant="line" className="h-auto w-full flex-wrap justify-start gap-2">
          {sections.length === 0 ? (
            <TabsTrigger value="description">Product details</TabsTrigger>
          ) : (
            sections.map((section) => (
              <TabsTrigger key={section.id} value={section.id}>
                {section.title}
              </TabsTrigger>
            ))
          )}
        </TabsList>

        {sections.length === 0 ? (
          <TabsContent value="description" className="mt-6 w-full">
            <div
              className="rich-html text-sm leading-relaxed text-muted-foreground"
              dangerouslySetInnerHTML={{ __html: product.description }}
            />
          </TabsContent>
        ) : (
          sections.map((section) => (
            <TabsContent key={section.id} value={section.id} className="mt-6 w-full">
              <div
                className="rich-html text-sm leading-relaxed text-muted-foreground"
                dangerouslySetInnerHTML={{ __html: section.body }}
              />
            </TabsContent>
          ))
        )}
      </Tabs>
    </section>
  );
}
