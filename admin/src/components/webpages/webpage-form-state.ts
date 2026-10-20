import type {
  WebpageDesign9Card,
  WebpageDto,
  WebpageEditFormValues,
  WebpageGridCard,
  WebpageImageAsset,
  WebpageParagraphSection,
  WebpageTeamCard,
  WebpageTemplateType,
} from "@/types/webpages";

export const emptyImage = (): WebpageImageAsset => ({ url: "", key: "" });

export const createEmptyParagraphSection = (): WebpageParagraphSection => ({
  title: "",
  description: "",
  firstImage: emptyImage(),
  secondImage: emptyImage(),
  bulletPoints: [""],
});

export const createEmptyGridCard = (): WebpageGridCard => ({
  image: emptyImage(),
  chipName: "",
  title: "",
  link: "",
  galleryDate: "",
  postedBy: "",
  galleryDescription: "",
  gallerySlug: "",
  bentoImages: [],
  youtubeShorts: [],
  youtubeVideos: [],
});

export const createEmptyTeamCard = (): WebpageTeamCard => ({
  image: emptyImage(),
  name: "",
  designation: "",
  qualification: "",
  specialization: "",
  phone: "",
  facebook: "",
  instagram: "",
  youtube: "",
});

export const createEmptyDesign9Card = (): WebpageDesign9Card => ({
  heading: "",
  description: "",
  images: [],
});

function asImage(value: unknown): WebpageImageAsset {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const img = value as Record<string, unknown>;
    return {
      url: typeof img.url === "string" ? img.url : "",
      key:
        typeof img.key === "string"
          ? img.key
          : typeof img.publicId === "string"
            ? img.publicId
            : "",
    };
  }
  if (typeof value === "string" && value.trim()) {
    return { url: value, key: "" };
  }
  return emptyImage();
}

function asStringArray(value: unknown, fallback: string[] = [""]): string[] {
  if (!Array.isArray(value) || value.length === 0) return [...fallback];
  const next = value.map((item) => (typeof item === "string" ? item : ""));
  return next.length > 0 ? next : [...fallback];
}

function normalizeParagraphSections(value: unknown): WebpageParagraphSection[] {
  if (!Array.isArray(value) || value.length === 0) {
    return [createEmptyParagraphSection()];
  }
  return value.map((section) => {
    const row = (section ?? {}) as Record<string, unknown>;
    const bullets = Array.isArray(row.bulletPoints)
      ? row.bulletPoints.map((b) => (typeof b === "string" ? b : ""))
      : [""];
    return {
      title: typeof row.title === "string" ? row.title : "",
      description: typeof row.description === "string" ? row.description : "",
      firstImage: asImage(row.firstImage),
      secondImage: asImage(row.secondImage),
      bulletPoints: bullets.length > 0 ? bullets : [""],
    };
  });
}

function normalizeGridCards(value: unknown): WebpageGridCard[] {
  if (!Array.isArray(value) || value.length === 0) return [createEmptyGridCard()];
  return value.map((card) => {
    const row = (card ?? {}) as Record<string, unknown>;
    return {
      image: asImage(row.image),
      chipName: typeof row.chipName === "string" ? row.chipName : "",
      title: typeof row.title === "string" ? row.title : "",
      link: typeof row.link === "string" ? row.link : "",
      galleryDate: typeof row.galleryDate === "string" ? row.galleryDate : "",
      postedBy: typeof row.postedBy === "string" ? row.postedBy : "",
      galleryDescription:
        typeof row.galleryDescription === "string" ? row.galleryDescription : "",
      gallerySlug: typeof row.gallerySlug === "string" ? row.gallerySlug : "",
      bentoImages: Array.isArray(row.bentoImages)
        ? row.bentoImages.map(asImage)
        : [],
      youtubeShorts: Array.isArray(row.youtubeShorts)
        ? row.youtubeShorts.map((s) => {
            if (typeof s === "string") return s;
            if (s && typeof s === "object" && "url" in s) {
              return typeof (s as { url?: unknown }).url === "string"
                ? (s as { url: string }).url
                : "";
            }
            return "";
          })
        : [],
      youtubeVideos: Array.isArray(row.youtubeVideos)
        ? row.youtubeVideos.map((s) => {
            if (typeof s === "string") return s;
            if (s && typeof s === "object" && "url" in s) {
              return typeof (s as { url?: unknown }).url === "string"
                ? (s as { url: string }).url
                : "";
            }
            return "";
          })
        : [],
    };
  });
}

function normalizeTeamCards(value: unknown): WebpageTeamCard[] {
  if (!Array.isArray(value) || value.length === 0) return [createEmptyTeamCard()];
  return value.map((card) => {
    const row = (card ?? {}) as Record<string, unknown>;
    return {
      image: asImage(row.image),
      name: typeof row.name === "string" ? row.name : "",
      designation: typeof row.designation === "string" ? row.designation : "",
      qualification:
        typeof row.qualification === "string" ? row.qualification : "",
      specialization:
        typeof row.specialization === "string" ? row.specialization : "",
      phone: typeof row.phone === "string" ? row.phone : "",
      facebook: typeof row.facebook === "string" ? row.facebook : "",
      instagram: typeof row.instagram === "string" ? row.instagram : "",
      youtube: typeof row.youtube === "string" ? row.youtube : "",
    };
  });
}

function normalizeDesign9Cards(value: unknown): WebpageDesign9Card[] {
  if (!Array.isArray(value) || value.length === 0) {
    return [createEmptyDesign9Card()];
  }
  return value.map((card) => {
    const row = (card ?? {}) as Record<string, unknown>;
    return {
      heading: typeof row.heading === "string" ? row.heading : "",
      description: typeof row.description === "string" ? row.description : "",
      images: Array.isArray(row.images) ? row.images.map(asImage) : [],
    };
  });
}

export function createEmptyEditValues(
  templateType: WebpageTemplateType = "design1",
): WebpageEditFormValues {
  return {
    title: "",
    slug: "",
    active: true,
    templateType,
    titleLine: "",
    keywords: [""],
    firstTitle: "",
    secondTitle: "",
    imageFirst: emptyImage(),
    imageFirstMobile: emptyImage(),
    bannerImage: emptyImage(),
    bannerImageMobile: emptyImage(),
    paragraphFirstImage: emptyImage(),
    paragraphSecondImage: emptyImage(),
    advertisementImage: emptyImage(),
    sideThumbImage: emptyImage(),
    mainProfileImage: emptyImage(),
    createTags: [""],
    postedBy: { admin: false, user: false },
    highlights: [{ title: "", point: "" }],
    paragraphSections: [createEmptyParagraphSection()],
    tableTitle: "",
    tableRows: [{ column1: "", column2: "" }],
    blockquoteMainTitle: "",
    blockquoteLeftTitle: "",
    blockquoteDescription: "",
    blockquoteTags: [""],
    accordionTags: [{ left: "", right: "" }],
    advertisements: [{ image: emptyImage(), url: "" }],
    advertisementUrl: "",
    sideThumbName: "",
    sideThumbDesignation: "",
    sideThumbDescription: "",
    facebookUrl: "",
    youtubeUrl: "",
    instaUrl: "",
    googleUrl: "",
    imageGallery: [],
    notices: [{ title: "", description: "", type: "warning" }],
    searchLocations: [{ locationName: "", count: "", url: "" }],
    design5Chip: "",
    design5MainHeading: "",
    gridCards: [createEmptyGridCard()],
    design6Chip: "",
    design6ExploreLink: "",
    design6MainHeading: "",
    design6SubHeading: "",
    design6Author: "",
    design6MidHeading: "",
    design6MidLink: "",
    teamCards: [createEmptyTeamCard()],
    design7Chip: "",
    design7ExploreLink: "",
    design7MainHeading: "",
    design9MiniHeading: "",
    design9MainHeading: "",
    design9Description: "",
    design9Cards: [createEmptyDesign9Card()],
  };
}

export function dtoToEditValues(data: WebpageDto): WebpageEditFormValues {
  const keywords = Array.isArray(data.keywords)
    ? data.keywords.filter(Boolean)
    : [];
  const advertisements =
    Array.isArray(data.advertisements) && data.advertisements.length > 0
      ? data.advertisements.map((ad) => ({
          image: asImage(ad?.image),
          url: typeof ad?.url === "string" ? ad.url : "",
        }))
      : data.advertisementImage?.url || data.advertisementUrl
        ? [
            {
              image: asImage(data.advertisementImage),
              url: data.advertisementUrl || "",
            },
          ]
        : [{ image: emptyImage(), url: "" }];

  return {
    ...createEmptyEditValues(
      (data.templateType as WebpageTemplateType) || "design1",
    ),
    title: data.title || "",
    slug: data.slug || "",
    active: !!data.active,
    templateType: (data.templateType as WebpageTemplateType) || "design1",
    titleLine: data.titleLine || "",
    keywords: keywords.length > 0 ? keywords : [""],
    firstTitle: data.firstTitle || "",
    secondTitle: data.secondTitle || "",
    imageFirst: asImage(data.imageFirst),
    imageFirstMobile: asImage(data.imageFirstMobile),
    bannerImage: asImage(data.bannerImage),
    bannerImageMobile: asImage(data.bannerImageMobile),
    paragraphFirstImage: asImage(data.paragraphFirstImage),
    paragraphSecondImage: asImage(data.paragraphSecondImage),
    advertisementImage: asImage(data.advertisementImage),
    sideThumbImage: asImage(data.sideThumbImage),
    mainProfileImage: asImage(data.mainProfileImage),
    createTags: asStringArray(data.createTags),
    postedBy: {
      admin: !!(data.postedBy as { admin?: boolean } | null)?.admin,
      user: !!(data.postedBy as { user?: boolean } | null)?.user,
    },
    highlights:
      Array.isArray(data.highlights) && data.highlights.length > 0
        ? data.highlights.map((h) => ({
            title: h?.title || "",
            point: h?.point || "",
          }))
        : [{ title: "", point: "" }],
    paragraphSections: normalizeParagraphSections(data.paragraphSections),
    tableTitle: data.tableTitle || "",
    tableRows:
      Array.isArray(data.tableRows) && data.tableRows.length > 0
        ? data.tableRows.map((r) => ({
            column1: r?.column1 || "",
            column2: r?.column2 || "",
          }))
        : [{ column1: "", column2: "" }],
    blockquoteMainTitle: data.blockquoteMainTitle || "",
    blockquoteLeftTitle: data.blockquoteLeftTitle || "",
    blockquoteDescription: data.blockquoteDescription || "",
    blockquoteTags: asStringArray(data.blockquoteTags),
    accordionTags:
      Array.isArray(data.accordionTags) && data.accordionTags.length > 0
        ? data.accordionTags.map((a) => ({
            left: a?.left || "",
            right: a?.right || "",
          }))
        : [{ left: "", right: "" }],
    advertisements,
    advertisementUrl: data.advertisementUrl || "",
    sideThumbName: data.sideThumbName || "",
    sideThumbDesignation: data.sideThumbDesignation || "",
    sideThumbDescription: data.sideThumbDescription || "",
    facebookUrl: data.facebookUrl || "",
    youtubeUrl: data.youtubeUrl || "",
    instaUrl: data.instaUrl || "",
    googleUrl: data.googleUrl || "",
    imageGallery: Array.isArray(data.imageGallery)
      ? data.imageGallery.map(asImage)
      : [],
    notices:
      Array.isArray(data.notices) && data.notices.length > 0
        ? data.notices.map((n) => ({
            title: n?.title || "",
            description: n?.description || "",
            type: n?.type || "warning",
          }))
        : [{ title: "", description: "", type: "warning" }],
    searchLocations:
      Array.isArray(data.searchLocations) && data.searchLocations.length > 0
        ? data.searchLocations.map((s) => ({
            locationName: s?.locationName || "",
            count: s?.count || "",
            url: s?.url || "",
          }))
        : [{ locationName: "", count: "", url: "" }],
    design5Chip: data.design5Chip || "",
    design5MainHeading: data.design5MainHeading || "",
    gridCards: normalizeGridCards(data.gridCards),
    design6Chip: data.design6Chip || "",
    design6ExploreLink: data.design6ExploreLink || "",
    design6MainHeading: data.design6MainHeading || "",
    design6SubHeading: data.design6SubHeading || "",
    design6Author: data.design6Author || "",
    design6MidHeading: data.design6MidHeading || "",
    design6MidLink: data.design6MidLink || "",
    teamCards: normalizeTeamCards(data.teamCards),
    design7Chip: data.design7Chip || "",
    design7ExploreLink: data.design7ExploreLink || "",
    design7MainHeading: data.design7MainHeading || "",
    design9MiniHeading: data.design9MiniHeading || "",
    design9MainHeading: data.design9MainHeading || "",
    design9Description: data.design9Description || "",
    design9Cards: normalizeDesign9Cards(data.design9Cards),
  };
}

export function hasTopTextSectionContent(
  values: WebpageEditFormValues,
): boolean {
  return Boolean(
    values.firstTitle?.trim() ||
      values.secondTitle?.trim() ||
      values.imageFirst?.url ||
      values.imageFirstMobile?.url ||
      values.createTags.some((t) => t.trim()),
  );
}

export function hasTopBannerContent(values: WebpageEditFormValues): boolean {
  return Boolean(values.bannerImage?.url || values.bannerImageMobile?.url);
}

function normalizeImageForPayload(image: WebpageImageAsset | null | undefined) {
  return {
    url: typeof image?.url === "string" ? image.url.trim() : "",
    key: typeof image?.key === "string" ? image.key.trim() : "",
  };
}

export function buildContentPayload(
  values: WebpageEditFormValues,
): Record<string, unknown> {
  const firstParagraph = values.paragraphSections[0];
  const slug = values.slug.trim().toLowerCase();
  return {
    title: values.title.trim(),
    ...(slug ? { slug } : {}),
    active: values.active,
    templateType: values.templateType,
    titleLine: values.titleLine.trim(),
    keywords: values.keywords.map((k) => k.trim()).filter(Boolean),
    firstTitle: values.firstTitle ?? "",
    secondTitle: values.secondTitle ?? "",
    imageFirst: normalizeImageForPayload(values.imageFirst),
    imageFirstMobile: normalizeImageForPayload(values.imageFirstMobile),
    bannerImage: normalizeImageForPayload(values.bannerImage),
    bannerImageMobile: normalizeImageForPayload(values.bannerImageMobile),
    paragraphFirstImage: normalizeImageForPayload(
      firstParagraph?.firstImage || emptyImage(),
    ),
    paragraphSecondImage: normalizeImageForPayload(
      firstParagraph?.secondImage || emptyImage(),
    ),
    advertisementImage: normalizeImageForPayload(values.advertisementImage),
    sideThumbImage: normalizeImageForPayload(values.sideThumbImage),
    mainProfileImage: normalizeImageForPayload(values.mainProfileImage),
    createTags: values.createTags,
    postedBy: values.postedBy,
    highlights: values.highlights,
    paragraphSections: values.paragraphSections,
    tableTitle: values.tableTitle ?? "",
    tableRows: values.tableRows,
    blockquoteMainTitle: values.blockquoteMainTitle ?? "",
    blockquoteLeftTitle: values.blockquoteLeftTitle ?? "",
    blockquoteDescription: values.blockquoteDescription ?? "",
    blockquoteTags: values.blockquoteTags,
    accordionTags: values.accordionTags,
    advertisements: values.advertisements,
    advertisementUrl: values.advertisementUrl ?? "",
    sideThumbName: values.sideThumbName ?? "",
    sideThumbDesignation: values.sideThumbDesignation ?? "",
    sideThumbDescription: values.sideThumbDescription ?? "",
    facebookUrl: values.facebookUrl ?? "",
    youtubeUrl: values.youtubeUrl ?? "",
    instaUrl: values.instaUrl ?? "",
    googleUrl: values.googleUrl ?? "",
    imageGallery: values.imageGallery,
    notices: values.notices,
    searchLocations: values.searchLocations,
    design5Chip: values.design5Chip ?? "",
    design5MainHeading: values.design5MainHeading ?? "",
    gridCards: values.gridCards,
    design6Chip: values.design6Chip ?? "",
    design6ExploreLink: values.design6ExploreLink ?? "",
    design6MainHeading: values.design6MainHeading ?? "",
    design6SubHeading: values.design6SubHeading ?? "",
    design6Author: values.design6Author ?? "",
    design6MidHeading: values.design6MidHeading ?? "",
    design6MidLink: values.design6MidLink ?? "",
    teamCards: values.teamCards,
    design7Chip: values.design7Chip ?? "",
    design7ExploreLink: values.design7ExploreLink ?? "",
    design7MainHeading: values.design7MainHeading ?? "",
    design9MiniHeading: values.design9MiniHeading ?? "",
    design9MainHeading: values.design9MainHeading ?? "",
    design9Description: values.design9Description ?? "",
    design9Cards: values.design9Cards,
  };
}
