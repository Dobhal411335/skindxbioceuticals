import { youtubeEmbedUrl } from "@/lib/youtube";
import type { StorefrontBlogVideo } from "@/types/blog";

type BlogVideosProps = {
  videos: StorefrontBlogVideo[];
};

function isDirectVideoUrl(url: string): boolean {
  try {
    const pathname = new URL(url).pathname.toLowerCase();
    return /\.(mp4|webm|ogg)(?:$|\?)/.test(pathname);
  } catch {
    return /\.(mp4|webm|ogg)(?:$|\?)/i.test(url);
  }
}

export function BlogVideos({ videos }: BlogVideosProps) {
  if (videos.length === 0) {
    return null;
  }

  return (
    <section className="mt-10 space-y-8" aria-label="Article videos">
      {videos.map((video, index) => {
        const embed = youtubeEmbedUrl(video.url);
        const direct = !embed && isDirectVideoUrl(video.url);

        return (
          <article key={`${video.url}-${index}`} className="space-y-3">
            <div className="overflow-hidden rounded-2xl border border-[#eadfce] bg-[#f7f3eb]">
              {embed ? (
                <div className="aspect-video">
                  <iframe
                    title={video.name || `Video ${index + 1}`}
                    src={embed}
                    className="h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : direct ? (
                <video
                  controls
                  className="aspect-video w-full bg-black"
                  preload="metadata"
                  src={video.url}
                >
                  Your browser does not support the video tag.
                </video>
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
            {video.name ? (
              <h3 className="text-lg font-semibold tracking-tight text-[#1d262b] sm:text-xl">
                {video.name}
              </h3>
            ) : null}
          </article>
        );
      })}
    </section>
  );
}
