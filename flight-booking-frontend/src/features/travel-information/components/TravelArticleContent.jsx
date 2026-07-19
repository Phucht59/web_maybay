import { useId, useState } from "react";
import { Link } from "react-router-dom";
import { TRAVEL_ARTICLES, findTravelArticleBySlug, travelItemPath } from "../travelInformationData";
import { TravelArticleCard, TravelIcon } from "./TravelVisuals";

export function TravelQuickFacts({ facts }) {
  if (!facts?.length) return null;
  return <section className="travel-facts" aria-label="Thông tin nhanh">{facts.map((fact) => <div key={`${fact.label}-${fact.value}`}><TravelIcon name={fact.icon} /><span><small>{fact.label}</small><strong>{fact.value}</strong></span></div>)}</section>;
}

export function TravelStepTimeline({ steps }) {
  if (!steps?.length) return null;
  return <ol className="travel-steps">{steps.map((item, index) => <li key={item.title}><span>{index + 1}</span><div><TravelIcon name={item.icon} /><h3>{item.title}</h3><p>{item.description}</p></div></li>)}</ol>;
}

export function TravelChecklist({ groups }) {
  if (!groups?.length) return null;
  return <div className="travel-checklists">{groups.map((group) => <section key={group.title}><h3><TravelIcon name="check_circle" />{group.title}</h3><ul>{group.items.map((item) => <li key={item}>{item}</li>)}</ul></section>)}</div>;
}

export function TravelComparisonCards({ cards }) {
  if (!cards?.length) return null;
  return <div className="travel-comparisons">{cards.map((card) => <section key={card.title}><TravelIcon name={card.icon} /><h3>{card.title}</h3><ul>{card.items.map((item) => <li key={item}>{item}</li>)}</ul></section>)}</div>;
}

export function TravelInfoCallout({ callout }) {
  if (!callout) return null;
  return <aside className={`travel-callout tone-${callout.tone || "info"}`}><TravelIcon name={callout.icon || (callout.tone === "warning" ? "health_and_safety" : "info")} /><div><h3>{callout.title}</h3><p>{callout.text}</p></div></aside>;
}

function TravelFaqItem({ item }) {
  const panelId = useId();
  const [open, setOpen] = useState(false);
  return <div className="travel-faq-item"><h3><button type="button" aria-expanded={open} aria-controls={panelId} onClick={() => setOpen((value) => !value)}><span>{item.question}</span><TravelIcon name={open ? "remove" : "add"} /></button></h3><div id={panelId} hidden={!open}><p>{item.answer}</p></div></div>;
}

export function TravelFaq({ items }) {
  if (!items?.length) return null;
  return <section className="travel-faq" aria-labelledby="travel-faq-title"><span className="travel-eyebrow">Câu hỏi thường gặp</span><h2 id="travel-faq-title">Bạn có thể đang thắc mắc</h2>{items.map((item) => <TravelFaqItem key={item.question} item={item} />)}</section>;
}

export function TravelTableOfContents({ sections }) {
  if (!sections?.length) return null;
  return <nav className="travel-toc" aria-label="Mục lục bài viết"><strong>Trong bài viết</strong>{sections.map((section) => <a key={section.id} href={`#${section.id}`}>{section.title}</a>)}</nav>;
}

export function TravelRelatedGrid({ slugs, currentSlug, currentImageKey, currentGroupSlug, excludedImageKeys = [] }) {
  const usedImageKeys = new Set([currentImageKey, ...excludedImageKeys]);
  const related = [];
  const requested = (slugs || []).map(findTravelArticleBySlug).filter(Boolean);
  const eligibleRegistry = TRAVEL_ARTICLES
    .filter(({ entry }) => entry.slug !== currentSlug)
    .sort((a, b) => Number(b.group.slug === currentGroupSlug) - Number(a.group.slug === currentGroupSlug));
  for (const candidate of [...requested, ...eligibleRegistry]) {
    if (candidate.entry.slug === currentSlug || usedImageKeys.has(candidate.entry.imageKey)) continue;
    usedImageKeys.add(candidate.entry.imageKey);
    related.push(candidate);
    if (related.length === 3) break;
  }
  if (!related.length) return null;
  return <section className="travel-related-grid"><span className="travel-eyebrow">Đọc tiếp</span><h2>Hướng dẫn liên quan</h2><div>{related.map(({ group, entry }) => <TravelArticleCard key={entry.slug} group={group} entry={entry} />)}</div></section>;
}

export function TravelDemoSelector({ type }) {
  const [value, setValue] = useState("");
  if (type === "baggage-information") return <section className="travel-demo-tool"><span className="travel-eyebrow">Công cụ hướng dẫn demo</span><h2>Bạn đang chuẩn bị loại hành lý nào?</h2><div role="group" aria-label="Chọn loại hành lý">{[["cabin","Xách tay"],["checked","Ký gửi"],["special","Đặc biệt"]].map(([key,label]) => <button type="button" className={value === key ? "is-selected" : ""} key={key} onClick={() => setValue(key)}><TravelIcon name={key === "cabin" ? "luggage" : key === "checked" ? "conveyor_belt" : "package_2"}/>{label}</button>)}</div><p aria-live="polite">{value ? "Hãy tiếp tục với bài hướng dẫn tương ứng bên dưới. Kết quả không phải hạn mức hành lý thực tế." : "Chọn một nhóm để định hướng nội dung cần đọc."}</p></section>;
  if (type === "airport-information") return <section className="travel-demo-tool"><span className="travel-eyebrow">Bộ lọc chuẩn bị local</span><h2>Bạn cần tìm thông tin nào?</h2><label><span className="sr-only">Lọc chủ đề sân bay</span><input value={value} onChange={(event) => setValue(event.target.value)} placeholder="Ví dụ: nhà ga, di chuyển, quầy..." /></label><p aria-live="polite">{value ? `Đang lọc theo “${value}”. Đây là giao diện chuẩn bị, không truy vấn dữ liệu sân bay thời gian thực.` : "Nhập một từ khóa để xác định nhóm thông tin cần kiểm tra."}</p></section>;
  if (type === "airport-maps") return <section className="travel-terminal-map" aria-label="Minh họa định hướng nhà ga"><span>Minh họa định hướng</span><div><b>Lối vào</b><TravelIcon name="arrow_forward"/><b>Thủ tục</b><TravelIcon name="arrow_forward"/><b>An ninh</b><TravelIcon name="arrow_forward"/><b>Cửa khởi hành</b></div><p>Không phải bản đồ tương tác hoặc dữ liệu vị trí thật.</p></section>;
  return null;
}

export function TravelSectionRenderer({ entry }) {
  return <>
    <TravelDemoSelector type={entry.slug} />
    {entry.warnings?.map((warning) => <TravelInfoCallout key={warning.title} callout={warning} />)}
    {entry.steps && <section className="travel-structured-section"><span className="travel-eyebrow">Theo từng bước</span><h2>Lộ trình gợi ý</h2><TravelStepTimeline steps={entry.steps} /></section>}
    {entry.checklist && <section className="travel-structured-section"><span className="travel-eyebrow">Checklist</span><h2>Những việc nên rà soát</h2><TravelChecklist groups={entry.checklist} /></section>}
    {entry.comparisons && <section className="travel-structured-section"><span className="travel-eyebrow">Đặt cạnh nhau</span><h2>Chuẩn bị theo tình huống</h2><TravelComparisonCards cards={entry.comparisons} /></section>}
    {entry.sections?.map((item) => <section className="travel-copy-section" id={item.id} key={item.id}><h2>{item.title}</h2><p>{item.body}</p>{item.bullets?.length > 0 && <ul>{item.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul>}</section>)}
  </>;
}

export function TravelArticleActions({ entry, group }) {
  const secondaryTarget = entry.secondaryAction?.toSlug ? group.items.find((candidate) => candidate.slug === entry.secondaryAction.toSlug) : null;
  return <section className="travel-end-cta"><div><span className="travel-eyebrow">Sẵn sàng cho bước tiếp theo?</span><h2>Giữ hành trình trong tầm kiểm soát</h2><p>Dùng thông tin trên vé và các kênh chính thức để xác nhận điều kiện trước ngày đi.</p></div><div>{entry.primaryAction?.to && <Link className="travel-button primary" to={entry.primaryAction.to}>{entry.primaryAction.label}<TravelIcon name="arrow_forward" /></Link>}{secondaryTarget && <Link className="travel-button secondary" to={travelItemPath(group, secondaryTarget)}>{entry.secondaryAction.label}</Link>}</div></section>;
}
