import { forwardRef, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { TRAVEL_GROUPS, travelGroupPath, travelItemPath } from "./travelInformationData";
import { TravelIcon } from "./components/TravelVisuals";
import "../../styles/pages/travel-information.css";

function TravelMenuLink({ to, children, onNavigate }) {
  const location = useLocation();
  const active = location.pathname === to;
  return <Link to={to} onClick={onNavigate} aria-current={active ? "page" : undefined}>{children}</Link>;
}

function TravelMenuGroup({ group, onNavigate }) {
  const location = useLocation();
  const groupPath = travelGroupPath(group);
  const active = location.pathname === groupPath;
  return <section className="travel-menu-group">
    <Link className="travel-menu-group-title" to={groupPath} onClick={onNavigate} aria-current={active ? "page" : undefined}>
      <TravelIcon name={group.icon} /><span>{group.title}</span><TravelIcon name="arrow_forward" />
    </Link>
    <div className="travel-menu-links">{group.items.map((entry) => <TravelMenuLink key={entry.slug} to={travelItemPath(group, entry)} onNavigate={onNavigate}>{entry.title}</TravelMenuLink>)}</div>
  </section>;
}

const TravelInformationMenu = forwardRef(function TravelInformationMenu({ open, onClose, triggerRef }, ref) {
  const closeRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const previousFocus = document.activeElement;
    const returnFocus = triggerRef?.current || previousFocus;
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
      if (event.key === "Tab" && ref?.current) {
        const focusable = [...ref.current.querySelectorAll("a[href], button:not([disabled])")];
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", onKeyDown);
    closeRef.current?.focus();
    return () => { document.removeEventListener("keydown", onKeyDown); returnFocus?.focus?.(); };
  }, [open, onClose, ref, triggerRef]);

  if (!open) return null;
  return <>
    <button className="travel-menu-backdrop" type="button" aria-label="Đóng menu Hành trình" onClick={onClose} />
    <aside ref={ref} id="travel-information-menu" className="travel-information-menu" aria-label="Thông tin hành trình">
      <header><div><span>Chuẩn bị chuyến đi</span><h2>Hành trình</h2></div><button ref={closeRef} type="button" onClick={onClose} aria-label="Đóng menu Hành trình"><TravelIcon name="close" /></button></header>
      <Link className="travel-menu-overview" to="/travel-information" onClick={onClose}>Xem tổng quan thông tin hành trình <TravelIcon name="arrow_forward" /></Link>
      <div className="travel-menu-scroll">{TRAVEL_GROUPS.map((group) => <TravelMenuGroup key={group.slug} group={group} onNavigate={onClose} />)}</div>
    </aside>
  </>;
});

export default TravelInformationMenu;
