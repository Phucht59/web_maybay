import { Link } from "react-router-dom";
import { travelGroupPath, travelItemPath } from "../travelInformationData";
import { getTravelImage } from "../data/travelImageRegistry";

export const TravelIcon = ({ name }) => <span className="material-symbols-outlined" aria-hidden="true">{name}</span>;

export function TravelImage({ imageKey, variant = "editorial", loading = "lazy", priority = false, className = "" }) {
  const image = getTravelImage(imageKey);
  return <img className={`${className} travel-image-variant-${variant}`} src={image.src} alt={image.alt} loading={loading} fetchPriority={priority ? "high" : undefined} style={{ objectPosition: image.focalPoint }} />;
}

export function Breadcrumb({ group, entry }) {
  return (
    <nav className="travel-breadcrumb" aria-label="Đường dẫn">
      <Link to="/">Khám phá</Link><TravelIcon name="chevron_right" />
      <Link to="/travel-information">Thông tin hành trình</Link>
      {group && <><TravelIcon name="chevron_right" /><Link to={travelGroupPath(group)} aria-current={!entry ? "page" : undefined}>{group.title}</Link></>}
      {entry && <><TravelIcon name="chevron_right" /><span aria-current="page">{entry.title}</span></>}
    </nav>
  );
}

export function TravelHero({ eyebrow, title, description, imageKey, visualVariant = "wide", children, meta }) {
  return (
    <header className="travel-hero">
      <div className="travel-hero-copy">
        <span className="travel-eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
        {meta && <div className="travel-hero-meta">{meta}</div>}
        {children && <div className="travel-hero-actions">{children}</div>}
      </div>
      <div className="travel-hero-media"><TravelImage imageKey={imageKey} variant={visualVariant} loading="eager" priority className="travel-hero-image" /><span aria-hidden="true" /></div>
    </header>
  );
}

export function TravelCategoryCard({ group, featured = false }) {
  return (
    <Link className={`travel-category-card${featured ? " is-featured" : ""}`} to={travelGroupPath(group)}>
      <div className="travel-card-media"><TravelImage imageKey={group.imageKey} variant={group.visualVariant} className="travel-card-image" /></div>
      <div className="travel-category-card-copy">
        <span>{group.items.length} chủ đề</span><h2>{group.title}</h2><p>{group.description}</p>
        <strong>Khám phá <TravelIcon name="arrow_forward" /></strong>
      </div>
    </Link>
  );
}

export function TravelArticleCard({ group, entry, featured = false }) {
  return (
    <Link className={`travel-article-card${featured ? " is-featured" : ""}`} to={travelItemPath(group, entry)}>
      <div className="travel-card-media"><TravelImage imageKey={entry.imageKey} variant={entry.visualVariant} className="travel-card-image" /></div>
      <div className="travel-article-card-copy">
        <span>{group.title}</span><h2>{entry.title}</h2><p>{entry.summary}</p>
        <div><small><TravelIcon name="schedule" /> {entry.readTime}</small><TravelIcon name="arrow_forward" /></div>
      </div>
    </Link>
  );
}

export function TravelQuickActions({ actions }) {
  return <section className="travel-quick-actions" aria-label="Thao tác nhanh">{actions.map((action) => <Link key={action.title} to={action.to}><TravelIcon name={action.icon} /><span><strong>{action.title}</strong><small>{action.description}</small></span><TravelIcon name="arrow_forward" /></Link>)}</section>;
}
