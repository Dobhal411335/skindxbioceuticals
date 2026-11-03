import { youtubeEmbedUrl } from "@/lib/youtube";
import type { PublicProductVideo } from "@/types/product";

type ProductVideosSectionProps = {
  videos: PublicProductVideo[];
};

export function ProductVideosSection({ videos }: ProductVideosSectionProps) {
  const rows = [...videos].sort((a, b) => a.sortOrder - b.sortOrder);
  if (rows.length === 0) {
    return null;
  }

  return (
    <section
      className="w-full bg-white py-14 sm:py-16 lg:py-20"
      aria-labelledby="product-videos-heading"
    >
      <div className="container-page space-y-12 lg:space-y-16">
        <div className="max-w-2xl">
          <p className="text-[11px] font-semibold tracking-[0.18em] text-[#a8735d] uppercase">
            Videos
          </p>
          <h2
            id="product-videos-heading"
            className="mt-2 max-w-xl font-serif text-4xl leading-[0.98] tracking-[-0.04em] text-[#1c2a2e] sm:text-5xl"
          >
            Watch and learn
          </h2>
          <div className="mt-2 h-1 w-20 rounded-full bg-gradient-to-r from-[#ef6a24] to-[#f0d8c9]" />
        </div>

        <div className="space-y-12 lg:space-y-16">
          {rows.map((video, index) => {
            const reverse = index % 2 === 1;
            const embed = youtubeEmbedUrl(video.url);

            return (
              <article
                key={video.id}
                className={`grid items-center gap-8 lg:grid-cols-2 lg:gap-12 ${
                  reverse ? "lg:[&>*:first-child]:order-2" : ""
                }`}
              >
                <div className="space-y-4">
                  <h3 className="text-2xl font-semibold tracking-tight text-[#1c2a2e] sm:text-3xl">
                    {video.name}
                  </h3>
                  {video.description ? (
                    <div
                      className="rich-html max-w-xl text-sm leading-relaxed text-[#6c7a7d] sm:text-base [&_a]:text-[#c97852] [&_p:not(:last-child)]:mb-3"
                      dangerouslySetInnerHTML={{ __html: video.description }}
                    />
                  ) : null}
                </div>

                <div className="overflow-hidden rounded-[24px] border border-[#eadfce] bg-[#f7f3eb] shadow-[0_8px_30px_rgba(40,30,20,0.04)]">
                  {embed ? (
                    <div className="aspect-video">
                      <iframe
                        title={video.name}
                        src={embed}
                        className="h-full w-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  ) : (
                    <a
                      href={video.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex aspect-video items-center justify-center px-6 text-center text-sm font-medium text-[#c97852] underline-offset-4 hover:underline"
                    >
                      Open video
                    </a>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
