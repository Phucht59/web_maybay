import { baggageGroup } from "./data/baggageData";
import { checkInGroup } from "./data/checkInData";
import { airportsGroup } from "./data/airportsData";
import { specialServicesGroup } from "./data/specialServicesData";
import { travelAdviceGroup } from "./data/travelAdviceData";
import { getTravelImage } from "./data/travelImageRegistry";

const GROUP_IMAGE_KEYS = Object.freeze({
  baggage: "category-baggage",
  "check-in": "category-check-in",
  airports: "category-airports",
  "special-services": "category-special-services",
  "travel-advice": "category-travel-advice",
});

const ARTICLE_IMAGE_KEYS = Object.freeze({
  "baggage-information": "baggage-information",
  "carry-on-baggage": "baggage-carry-on",
  "checked-baggage": "baggage-checked",
  "extra-baggage": "baggage-extra",
  "special-baggage": "baggage-special",
  "restricted-baggage": "baggage-restricted",
  "baggage-issues": "baggage-issues",
  "online-check-in": "check-in-online",
  "kiosk-check-in": "check-in-kiosk",
  "airport-check-in": "check-in-airport",
  "business-lounges": "airport-lounge",
  "airport-priority-services": "airport-priority",
  "airport-information": "airport-information",
  "connecting-services": "airport-connecting",
  "airport-maps": "airport-map",
  "pet-transport": "special-pet",
  "special-meals": "special-meals",
  "services-for-children": "special-children",
  "unaccompanied-minors": "special-unaccompanied-minor",
  "infant-separate-seat": "special-infant-seat",
  "reduced-mobility": "special-mobility",
  "pregnant-passengers": "special-pregnancy",
  "extra-seat": "special-extra-seat",
  "medical-clearance": "special-medical",
  "special-service-fees": "special-fees",
  "vietnam-domestic-flights": "advice-domestic-vietnam",
  "flights-to-vietnam": "advice-to-vietnam",
  "international-flights-from-vietnam": "advice-international-from-vietnam",
  "smooth-journey-guide": "advice-smooth-journey",
});

const VISUAL_VARIANTS = ["editorial", "object-focus", "process", "illustration", "wide", "diagram", "portrait"];

export const TRAVEL_OVERVIEW = Object.freeze({
  eyebrow: "Cẩm nang hành trình",
  title: "Tự tin hơn từ lúc chuẩn bị đến khi hạ cánh",
  description: "Khám phá hướng dẫn trực quan về hành lý, làm thủ tục, sân bay và những hỗ trợ có thể cần trên đường đi.",
  imageKey: "travel-overview",
  visualVariant: "wide",
});

export const TRAVEL_GROUPS = [baggageGroup, checkInGroup, airportsGroup, specialServicesGroup, travelAdviceGroup]
  .map((group, groupIndex) => ({
    ...group,
    imageKey: group.imageKey || GROUP_IMAGE_KEYS[group.slug],
    visualVariant: "wide",
    items: group.items.map((entry, entryIndex) => ({
      ...entry,
      imageKey: entry.imageKey || ARTICLE_IMAGE_KEYS[entry.slug],
      visualVariant: VISUAL_VARIANTS[(groupIndex + entryIndex) % VISUAL_VARIANTS.length],
      imageAspectRatio: "3 / 2",
    })),
  }));

export const travelGroupPath = (group) => `/travel-information/${group.slug}`;
export const travelItemPath = (group, entry) => `${travelGroupPath(group)}/${entry.slug}`;
export const findTravelGroup = (slug) => TRAVEL_GROUPS.find((group) => group.slug === slug);
export const findTravelItem = (groupSlug, itemSlug) => {
  const group = findTravelGroup(groupSlug);
  const entry = group?.items.find((candidate) => candidate.slug === itemSlug);
  return group && entry ? { group, entry } : null;
};

function validateTravelRegistry(groups) {
  const errors = [];
  const groupSlugs = new Set();
  const articleSlugs = new Set();
  const primaryImageKeys = new Map([[TRAVEL_OVERVIEW.imageKey, "/travel-information"]]);

  for (const group of groups) {
    if (groupSlugs.has(group.slug)) errors.push(`Slug nhóm bị trùng: ${group.slug}`);
    groupSlugs.add(group.slug);
    if (!group.title) errors.push(`Nhóm ${group.slug} thiếu title`);
    if (!group.description) errors.push(`Nhóm ${group.slug} thiếu description`);
    try { getTravelImage(group.imageKey); } catch (error) { errors.push(error.message); }
    if (primaryImageKeys.has(group.imageKey)) errors.push(`Ảnh primary ${group.imageKey} bị dùng lại`);
    primaryImageKeys.set(group.imageKey, travelGroupPath(group));

    for (const entry of group.items) {
      const route = travelItemPath(group, entry);
      if (!route.startsWith("/travel-information/") || route.includes("//")) errors.push(`Route không hợp lệ: ${route}`);
      if (articleSlugs.has(entry.slug)) errors.push(`Slug bài viết bị trùng: ${entry.slug}`);
      articleSlugs.add(entry.slug);
      if (!entry.title) errors.push(`Bài ${entry.slug} thiếu title`);
      if (!entry.summary) errors.push(`Bài ${entry.slug} thiếu summary`);
      try { getTravelImage(entry.imageKey); } catch (error) { errors.push(error.message); }
      if (primaryImageKeys.has(entry.imageKey)) errors.push(`Ảnh primary ${entry.imageKey} bị dùng cho ${primaryImageKeys.get(entry.imageKey)} và ${route}`);
      primaryImageKeys.set(entry.imageKey, route);
    }
  }

  for (const group of groups) {
    for (const entry of group.items) {
      for (const slug of entry.relatedSlugs || []) {
        if (!articleSlugs.has(slug)) errors.push(`${entry.slug} trỏ relatedSlugs không tồn tại: ${slug}`);
      }
      for (const action of [entry.primaryAction, entry.secondaryAction]) {
        if (action?.to && !action.to.startsWith("/")) errors.push(`${entry.slug} có internal route không hợp lệ: ${action.to}`);
      }
    }
  }
  if (errors.length) throw new Error(`Travel information data không hợp lệ:\n${errors.join("\n")}`);
}

if (import.meta.env.DEV) validateTravelRegistry(TRAVEL_GROUPS);

export const TRAVEL_ARTICLES = TRAVEL_GROUPS.flatMap((group) => group.items.map((entry) => ({ group, entry })));
export const findTravelArticleBySlug = (slug) => TRAVEL_ARTICLES.find(({ entry }) => entry.slug === slug);
