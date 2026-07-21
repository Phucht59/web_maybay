import { Link, Navigate, useParams } from "react-router-dom";
import { TRAVEL_GROUPS, findTravelGroup, findTravelItem, travelGroupPath, travelItemPath } from "../../features/travel-information/travelInformationData";
import "../../styles/pages/travel-information.css";

const Icon = ({ name }) => <span className="material-symbols-outlined" aria-hidden="true">{name}</span>;

function Breadcrumb({ group, entry }) {
  return <nav className="travel-breadcrumb" aria-label="Đường dẫn"><Link to="/">Khám phá</Link><Icon name="chevron_right" /><Link to="/travel-information">Thông tin hành trình</Link>{group && <><Icon name="chevron_right" /><Link to={travelGroupPath(group)}>{group.title}</Link></>}{entry && <><Icon name="chevron_right" /><span aria-current="page">{entry.title}</span></>}</nav>;
}

function TravelCard({ group }) {
  return <Link className="travel-info-card" to={travelGroupPath(group)}><div className="travel-info-card-icon"><Icon name={group.icon} /></div><span>{group.items.length} chủ đề</span><h2>{group.title}</h2><p>{group.description}</p><strong>Khám phá <Icon name="arrow_forward" /></strong></Link>;
}

function TravelHero({ eyebrow, title, description, icon }) {
  return <header className="travel-page-hero"><div className="travel-page-hero-copy"><span>{eyebrow}</span><h1>{title}</h1><p>{description}</p></div>{icon && <div className="travel-page-hero-icon"><Icon name={icon} /></div>}</header>;
}

export function TravelInformationOverviewPage() {
  return <main className="travel-page"><Breadcrumb /><TravelHero eyebrow="Travel guide" title="Thông tin hành trình" description="Mọi thông tin cần thiết để bạn chuẩn bị, làm thủ tục và tận hưởng chuyến bay một cách chủ động." icon="map" /><section className="travel-overview-intro"><strong>Trước khi cất cánh</strong><p>Chọn một chủ đề bên dưới để xem hướng dẫn. Nội dung mang tính tham khảo chung; quy định thực tế có thể khác theo hãng bay, hành trình và thời điểm.</p></section><section className="travel-card-grid">{TRAVEL_GROUPS.map((group) => <TravelCard key={group.slug} group={group} />)}</section></main>;
}

export function TravelCategoryPage() {
  const { categorySlug } = useParams();
  const group = findTravelGroup(categorySlug);
  if (!group) return <Navigate to="/travel-information" replace />;
  return <main className="travel-page"><Breadcrumb group={group} /><TravelHero eyebrow="Thông tin hành trình" title={group.title} description={group.description} icon={group.icon} /><section className="travel-category-grid">{group.items.map((entry, index) => <Link key={entry.slug} className="travel-category-item" to={travelItemPath(group, entry)}><span>{String(index + 1).padStart(2, "0")}</span><div><h2>{entry.title}</h2><p>{entry.summary}</p></div><Icon name="arrow_forward" /></Link>)}</section></main>;
}

export function TravelArticlePage() {
  const { categorySlug, articleSlug } = useParams();
  const result = findTravelItem(categorySlug, articleSlug);
  if (!result) return <Navigate to="/travel-information" replace />;
  const { group, entry } = result;
  const related = group.items.filter((candidate) => candidate.slug !== entry.slug).slice(0, 3);
  return <main className="travel-page"><Breadcrumb group={group} entry={entry} /><TravelHero eyebrow={group.title} title={entry.title} description={entry.summary} icon={group.icon} /><div className="travel-article-layout"><article className="travel-article"><div className="travel-guidance-note"><Icon name="info" /><p><strong>Thông tin hướng dẫn chung.</strong> Hãy kiểm tra lại điều kiện áp dụng trên vé, thông báo của hãng khai thác và cơ quan chức năng trước ngày khởi hành.</p></div><section><h2>Chuẩn bị trước hành trình</h2><p>Kiểm tra thông tin đặt chỗ, giấy tờ tùy thân và yêu cầu áp dụng cho từng chặng bay. Chủ động liên hệ bộ phận hỗ trợ nếu hành trình có nhu cầu đặc biệt hoặc nhiều chặng nối tiếp.</p><ul><li>Xác nhận ngày, giờ và sân bay khởi hành.</li><li>Đọc điều kiện vé và dịch vụ đã bao gồm.</li><li>Lưu giấy tờ cần thiết ở nơi dễ lấy nhưng an toàn.</li></ul></section><section><h2>Những điều nên lưu ý</h2><p>{entry.summary} Mỗi hãng khai thác có thể áp dụng tiêu chuẩn và thời hạn yêu cầu khác nhau. Việc chuẩn bị sớm giúp có thêm thời gian điều chỉnh nếu phát sinh thay đổi.</p><div className="travel-article-highlight"><Icon name="lightbulb" /><div><strong>Mẹo cho hành trình thuận lợi</strong><p>Chụp lại giấy tờ quan trọng, bật thông báo chuyến bay và có mặt tại sân bay sớm hơn trong các dịp cao điểm.</p></div></div></section><section><h2>Tại sân bay</h2><p>Theo dõi bảng thông tin chuyến bay và hướng dẫn của nhân viên. Không rời hành lý không có người trông coi và luôn dành thời gian cho các bước kiểm tra an ninh, xuất nhập cảnh nếu có.</p></section></article><aside className="travel-related"><h2>Cùng chủ đề</h2>{related.map((candidate) => <Link key={candidate.slug} to={travelItemPath(group, candidate)}>{candidate.title}<Icon name="chevron_right" /></Link>)}<Link className="travel-related-all" to={travelGroupPath(group)}>Xem tất cả {group.title}</Link></aside></div></main>;
}
