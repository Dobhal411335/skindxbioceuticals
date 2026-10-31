import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import type {
  WebpageContentWrite,
  WebpageCreateWrite,
  WebpageMetaPatchWrite,
  WebpageRecord,
} from './webpage.types';

function mapWebpage(row: {
  id: string;
  siteId: string;
  title: string;
  slug: string;
  active: boolean;
  templateType: string;
  titleLine: string;
  keywords: string[];
  firstTitle: string;
  secondTitle: string;
  imageFirst: Prisma.JsonValue | null;
  imageFirstMobile: Prisma.JsonValue | null;
  bannerImage: Prisma.JsonValue | null;
  bannerImageMobile: Prisma.JsonValue | null;
  paragraphFirstImage: Prisma.JsonValue | null;
  paragraphSecondImage: Prisma.JsonValue | null;
  advertisementImage: Prisma.JsonValue | null;
  sideThumbImage: Prisma.JsonValue | null;
  mainProfileImage: Prisma.JsonValue | null;
  createTags: Prisma.JsonValue;
  postedBy: Prisma.JsonValue;
  highlights: Prisma.JsonValue;
  paragraphSections: Prisma.JsonValue;
  tableTitle: string;
  tableRows: Prisma.JsonValue;
  blockquoteMainTitle: string;
  blockquoteLeftTitle: string;
  blockquoteDescription: string;
  blockquoteTags: Prisma.JsonValue;
  accordionTags: Prisma.JsonValue;
  advertisements: Prisma.JsonValue;
  advertisementUrl: string;
  sideThumbName: string;
  sideThumbDesignation: string;
  sideThumbDescription: string;
  facebookUrl: string;
  youtubeUrl: string;
  instaUrl: string;
  googleUrl: string;
  imageGallery: Prisma.JsonValue;
  notices: Prisma.JsonValue;
  searchLocations: Prisma.JsonValue;
  design5Chip: string;
  design5MainHeading: string;
  gridCards: Prisma.JsonValue;
  design6Chip: string;
  design6ExploreLink: string;
  design6MainHeading: string;
  design6SubHeading: string;
  design6Author: string;
  design6MidHeading: string;
  design6MidLink: string;
  teamCards: Prisma.JsonValue;
  design7Chip: string;
  design7ExploreLink: string;
  design7MainHeading: string;
  design9MiniHeading: string;
  design9MainHeading: string;
  design9Description: string;
  design9Cards: Prisma.JsonValue;
  design10HeroMiniHeading: string;
  design10HeroMainHeading: string;
  design10HeroDescription: string;
  design10HeroImage: Prisma.JsonValue | null;
  design10StoryMiniHeading: string;
  design10StoryDescription: string;
  design10StoryParagraph: string;
  design10StorySmallParagraph: string;
  design10DefineMiniHeading: string;
  design10DefineCards: Prisma.JsonValue;
  design10JourneyMiniHeading: string;
  design10JourneyMainHeading: string;
  design10JourneyImage: Prisma.JsonValue | null;
  design10JourneyTimeline: Prisma.JsonValue;
  design10LeadershipMiniHeading: string;
  design10LeadershipMainHeading: string;
  design10LeadershipCards: Prisma.JsonValue;
  design10GlobalMiniHeading: string;
  design10GlobalMainHeading: string;
  design10GlobalDescription: string;
  design10GlobalCards: Prisma.JsonValue;
  design10GlobalImage: Prisma.JsonValue | null;
  design10ExploreMiniHeading: string;
  design10ExploreMainHeading: string;
  design10ExploreCards: Prisma.JsonValue;
  design11HeroMiniHeading: string;
  design11HeroMainHeading: string;
  design11HeroDescription: string;
  design11HeroImage: Prisma.JsonValue | null;
  design11CapabilitiesMiniHeading: string;
  design11CapabilitiesMainHeading: string;
  design11CapabilitiesDescription: string;
  design11CapabilitiesCards: Prisma.JsonValue;
  design11ProcessMiniHeading: string;
  design11ProcessMainHeading: string;
  design11ProcessDescription: string;
  design11ProcessCards: Prisma.JsonValue;
  design11EngagementMiniHeading: string;
  design11EngagementMainHeading: string;
  design11EngagementCards: Prisma.JsonValue;
  design11FaqMiniHeading: string;
  design11FaqMainHeading: string;
  design11FaqDescription: string;
  design11FaqItems: Prisma.JsonValue;
  design11ExploreMiniHeading: string;
  design11ExploreMainHeading: string;
  design11ExploreCards: Prisma.JsonValue;
  design12HeroMiniHeading: string;
  design12HeroMainHeading: string;
  design12HeroDescription: string;
  design12HeroImage: Prisma.JsonValue | null;
  design12ChallengeMiniHeading: string;
  design12ChallengeMainHeading: string;
  design12ChallengeDescription: string;
  design12ChallengeCard: Prisma.JsonValue;
  design12HelpMiniHeading: string;
  design12HelpMainHeading: string;
  design12HelpCards: Prisma.JsonValue;
  design12MethodologyMiniHeading: string;
  design12MethodologyMainHeading: string;
  design12MethodologyDescription: string;
  design12MethodologyCards: Prisma.JsonValue;
  design12OutcomesMiniHeading: string;
  design12OutcomesMainHeading: string;
  design12OutcomeCards: Prisma.JsonValue;
  design12RelatedMiniHeading: string;
  design12RelatedMainHeading: string;
  design12RelatedCards: Prisma.JsonValue;
  design12ExploreMiniHeading: string;
  design12ExploreMainHeading: string;
  design12ExploreCards: Prisma.JsonValue;
  design13HeroMiniHeading: string;
  design13HeroMainHeading: string;
  design13HeroDescription: string;
  design13HeroImage: Prisma.JsonValue | null;
  design13ProcessMiniHeading: string;
  design13ProcessMainHeading: string;
  design13ProcessTimeline: Prisma.JsonValue;
  design13FaqMiniHeading: string;
  design13FaqMainHeading: string;
  design13FaqItems: Prisma.JsonValue;
  design13ExploreMiniHeading: string;
  design13ExploreMainHeading: string;
  design13ExploreCards: Prisma.JsonValue;
  design14HeroMiniHeading: string; design14HeroMainHeading: string; design14HeroDescription: string; design14HeroImage: Prisma.JsonValue | null;
  design14SectorsMiniHeading: string; design14SectorsMainHeading: string; design14SectorsDescription: string; design14SectorCards: Prisma.JsonValue;
  design14PerspectiveMiniHeading: string; design14PerspectiveMainHeading: string; design14PerspectiveDescription: string; design14PerspectiveCards: Prisma.JsonValue;
  design14QuestionsMiniHeading: string; design14QuestionsMainHeading: string; design14QuestionsDescription: string; design14QuestionCards: Prisma.JsonValue;
  design14Quote: string; design14QuoteDesignation: string;
  design14ExploreMiniHeading: string; design14ExploreMainHeading: string; design14ExploreCards: Prisma.JsonValue;
  design15HeroMiniHeading: string; design15HeroMainHeading: string; design15HeroDescription: string;
  design15NoticeMiniHeading: string; design15NoticeMainHeading: string; design15NoticeDescription: string; design15FaqItems: Prisma.JsonValue;
  design15ExploreCards: Prisma.JsonValue;
  createdAt: Date;
  updatedAt: Date;
}): WebpageRecord {
  return { ...row };
}

export class WebpageRepository {
  async listBySiteId(siteId: string, options?: { activeOnly?: boolean }): Promise<WebpageRecord[]> {
    const rows = await prisma.webpage.findMany({
      where: {
        siteId,
        ...(options?.activeOnly ? { active: true } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(mapWebpage);
  }

  async findByIdForSite(siteId: string, webpageId: string): Promise<WebpageRecord | null> {
    const row = await prisma.webpage.findFirst({
      where: { id: webpageId, siteId },
    });
    return row ? mapWebpage(row) : null;
  }

  async findBySlugForSite(
    siteId: string,
    slug: string,
    activeOnly = false,
  ): Promise<WebpageRecord | null> {
    const row = await prisma.webpage.findFirst({
      where: {
        siteId,
        slug,
        ...(activeOnly ? { active: true } : {}),
      },
    });
    return row ? mapWebpage(row) : null;
  }

  async slugExists(siteId: string, slug: string, excludeId?: string): Promise<boolean> {
    const row = await prisma.webpage.findFirst({
      where: {
        siteId,
        slug,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { id: true },
    });
    return Boolean(row);
  }

  async create(siteId: string, data: WebpageCreateWrite): Promise<WebpageRecord> {
    const row = await prisma.webpage.create({
      data: {
        siteId,
        title: data.title,
        slug: data.slug,
        active: data.active,
        templateType: data.templateType,
      },
    });
    return mapWebpage(row);
  }

  async patchMeta(
    siteId: string,
    webpageId: string,
    data: WebpageMetaPatchWrite,
  ): Promise<WebpageRecord | null> {
    const existing = await prisma.webpage.findFirst({
      where: { id: webpageId, siteId },
      select: { id: true },
    });
    if (!existing) return null;

    const row = await prisma.webpage.update({
      where: { id: webpageId },
      data: {
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.slug !== undefined ? { slug: data.slug } : {}),
        ...(data.active !== undefined ? { active: data.active } : {}),
        ...(data.templateType !== undefined ? { templateType: data.templateType } : {}),
      },
    });
    return mapWebpage(row);
  }

  async updateContent(
    siteId: string,
    webpageId: string,
    data: WebpageContentWrite,
  ): Promise<WebpageRecord | null> {
    const existing = await prisma.webpage.findFirst({
      where: { id: webpageId, siteId },
      select: { id: true },
    });
    if (!existing) return null;

    const row = await prisma.webpage.update({
      where: { id: webpageId },
      data: data as Prisma.WebpageUpdateInput,
    });
    return mapWebpage(row);
  }

  async delete(siteId: string, webpageId: string): Promise<boolean> {
    const existing = await prisma.webpage.findFirst({
      where: { id: webpageId, siteId },
      select: { id: true },
    });
    if (!existing) return false;
    await prisma.webpage.delete({ where: { id: webpageId } });
    return true;
  }
}

export const webpageRepository = new WebpageRepository();
