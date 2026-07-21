import { useEffect } from "react";
import { Link, Navigate, useLocation, useParams } from "react-router-dom";
import {
  TRAVEL_GROUPS, TRAVEL_OVERVIEW, findTravelGroup, findTravelItem,
} from "../../features/travel-information/travelInformationData";
import {
  Breadcrumb, TravelArticleCard, TravelCategoryCard, TravelHero, TravelIcon, TravelQuickActions,
} from "../../features/travel-information/components/TravelVisuals";
import {
  TravelArticleActions, TravelFaq, TravelInfoCallout, TravelQuickFacts, TravelRelatedGrid,
  TravelSectionRenderer, TravelTableOfContents,
} from "../../features/travel-information/components/TravelArticleContent";
import "../../styles/pages/travel-information.css";

const QUICK_ACTIONS = [
  { icon: "person_check", title: "Làm thủ tục trực tuyến", description: "Xem quy trình và những gì cần chuẩn bị", to: "/travel-information/check-in/online-check-in" },
  { icon: "luggage", title: "Tra cứu hành lý", description: "Chọn đúng hướng dẫn cho loại hành lý", to: "/travel-information/baggage/baggage-information" },
  { icon: "domain", title: "Xem thông tin sân bay", description: "Chuẩn bị nhà ga và luồng di chuyển", to: "/travel-information/airports/airport-information" },
  { icon: "accessible", title: "Yêu cầu hỗ trợ đặc biệt", description: "Biết thông tin cần trao đổi với hỗ trợ", to: "/travel-information/special-services/reduced-mobility" },
];

const JOURNEY_STAGES = [
  { icon: "event_note", title: "Chuẩn bị", text: "Giấy tờ, hành lý và kế hoạch di chuyển.", to: "/travel-information/travel-advice/smooth-journey-guide" },
  { icon: "domain", title: "Tại sân bay", text: "Tìm đúng nhà ga, quầy và luồng kiểm tra.", to: "/travel-information/airports/airport-information" },
  { icon: "flight_takeoff", title: "Lên máy bay", text: "Giữ vật dụng cần thiết trong tầm tay.", to: "/travel-information/baggage/carry-on-baggage" },
  { icon: "location_on", title: "Đến nơi", text: "Nhận hành lý và tiếp tục chặng kế tiếp.", to: "/travel-information/airports/connecting-services" },
];

function assertUniqueCategoryImages(group) {
  if (!import.meta.env.DEV) return;
  const usedImageKeys = new Set();
  for (const entry of group.items) {
    if (usedImageKeys.has(entry.imageKey)) throw new Error(`Duplicate category card image key: ${entry.imageKey}`);
    usedImageKeys.add(entry.imageKey);
  }
}

function useRouteTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  }, [pathname]);
}

export function TravelInformationOverviewPage() {
  useRouteTop();
  const featuredGuides = [
    findTravelItem("baggage", "carry-on-baggage"),
    findTravelItem("check-in", "online-check-in"),
    findTravelItem("travel-advice", "smooth-journey-guide"),
  ].filter(Boolean);

  const scrollToCategories = () => document.getElementById("travel-categories")?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });

  return <main className="travel-page">
    <Breadcrumb />
    <TravelHero {...TRAVEL_OVERVIEW}>
      <button className="travel-button primary" type="button" onClick={scrollToCategories}>Khám phá thông tin<TravelIcon name="south" /></button>
      <Link className="travel-button secondary" to="/flight-selection">Tìm chuyến bay<TravelIcon name="arrow_forward" /></Link>
    </TravelHero>
    <TravelQuickActions actions={QUICK_ACTIONS} />
    <section id="travel-categories" className="travel-section travel-category-showcase">
      <div className="travel-section-heading"><div><span className="travel-eyebrow">Theo chủ đề</span><h2>Mỗi chặng, một cách chuẩn bị</h2></div><p>Bắt đầu từ điều bạn quan tâm nhất. Mỗi nhóm có cấu trúc, checklist và hướng dẫn riêng.</p></div>
      <div className="travel-category-editorial">{TRAVEL_GROUPS.map((group, index) => <TravelCategoryCard key={group.slug} group={group} featured={index === 0} />)}</div>
    </section>
    <section className="travel-section travel-journey">
      <div className="travel-section-heading"><div><span className="travel-eyebrow">Theo hành trình</span><h2>Từ chuẩn bị đến nơi</h2></div></div>
      <ol>{JOURNEY_STAGES.map((stage, index) => <li key={stage.title}><span>{index + 1}</span><TravelIcon name={stage.icon} /><h3>{stage.title}</h3><p>{stage.text}</p><Link to={stage.to} aria-label={`Xem hướng dẫn: ${stage.title}`}>Xem hướng dẫn <TravelIcon name="arrow_forward" /></Link></li>)}</ol>
    </section>
    <section className="travel-section travel-featured-guides">
      <div className="travel-section-heading"><div><span className="travel-eyebrow">Được đọc nhiều</span><h2>Ba cẩm nang nên lưu</h2></div></div>
      <div>{featuredGuides.map(({ group, entry }) => <TravelArticleCard key={entry.slug} group={group} entry={entry} />)}</div>
    </section>
  </main>;
}

export function TravelCategoryPage() {
  useRouteTop();
  const { categorySlug } = useParams();
  const group = findTravelGroup(categorySlug);
  if (!group) return <Navigate to="/travel-information" replace />;
  assertUniqueCategoryImages(group);
  const featured = group.items.find((entry) => entry.slug === group.featuredArticleSlug) || group.items[0];
  const others = group.items.filter((entry) => entry.slug !== featured.slug);
  return <main className={`travel-page travel-category-page accent-${group.accent}`}>
    <Breadcrumb group={group} />
    <TravelHero eyebrow="Thông tin hành trình" title={group.title} description={group.description} imageKey={group.imageKey} visualVariant={group.visualVariant} meta={<><TravelIcon name={group.icon} /> {group.items.length} bài hướng dẫn</>} />
    <section className="travel-section travel-category-list">
      <div className="travel-section-heading"><div><span className="travel-eyebrow">Bắt đầu tại đây</span><h2>Hướng dẫn nổi bật</h2></div></div>
      <TravelArticleCard group={group} entry={featured} featured />
      <div className="travel-article-grid">{others.map((entry) => <TravelArticleCard key={entry.slug} group={group} entry={entry} />)}</div>
    </section>
    <TravelInfoCallout callout={group.callout} />
    <Link className="travel-back-link" to="/travel-information"><TravelIcon name="arrow_back" /> Trở về tổng quan hành trình</Link>
  </main>;
}

export function TravelArticlePage() {
  useRouteTop();
  const { categorySlug, articleSlug } = useParams();
  const result = findTravelItem(categorySlug, articleSlug);
  if (!result) return <Navigate to="/travel-information" replace />;
  const { group, entry } = result;
  return <main className={`travel-page travel-article-page template-${entry.template}`}>
    <Breadcrumb group={group} entry={entry} />
    <TravelHero eyebrow={group.title} title={entry.title} description={entry.summary} imageKey={entry.imageKey} visualVariant={entry.visualVariant} meta={<><TravelIcon name="schedule" /> {entry.readTime}<span>•</span><TravelIcon name={group.icon} /> {entry.template}</>} />
    <TravelQuickFacts facts={entry.quickFacts} />
    <div className="travel-article-layout">
      <aside><TravelTableOfContents sections={entry.sections} /></aside>
      <article className="travel-article">
        <TravelInfoCallout callout={{ icon: "verified_user", title: "Hướng dẫn trung tính", text: "Nội dung giúp bạn chuẩn bị. Điều kiện thực tế cần được xác nhận trên vé, với đơn vị khai thác và cơ quan chức năng." }} />
        <TravelSectionRenderer entry={entry} />
        <TravelFaq items={entry.faqs} />
      </article>
    </div>
    <TravelRelatedGrid slugs={entry.relatedSlugs} currentSlug={entry.slug} currentImageKey={entry.imageKey} currentGroupSlug={group.slug} excludedImageKeys={[group.imageKey]} />
    <TravelArticleActions entry={entry} group={group} />
  </main>;
}
