import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./aircraft-seat-map.css";
import { buildCabinLayout, cabinWeight, seatColumn } from "./cabin-layout";

const AIRCRAFT_LAYOUT = {
  asset: "/assets/aircraft-seatmap-frame.png",
  width: 1024,
  height: 1536,
  // Only the cabin overlay changes. The PNG aircraft frame remains untouched.
  cabinBounds: { top: 0.072, left: 0.369, width: 0.262, height: 0.7 },
  topUtilityRatio: 0.048,
  bottomUtilityRatio: 0.065,
  sectionGap: 9,
  sectionHeaderHeight: 18,
  columnLabelHeight: 13,
};

const CABIN = {
  top: AIRCRAFT_LAYOUT.height * AIRCRAFT_LAYOUT.cabinBounds.top,
  left: AIRCRAFT_LAYOUT.width * AIRCRAFT_LAYOUT.cabinBounds.left,
  width: AIRCRAFT_LAYOUT.width * AIRCRAFT_LAYOUT.cabinBounds.width,
  height: AIRCRAFT_LAYOUT.height * AIRCRAFT_LAYOUT.cabinBounds.height,
};
const TOP_UTILITY_HEIGHT = CABIN.height * AIRCRAFT_LAYOUT.topUtilityRatio;
const BOTTOM_UTILITY_HEIGHT = CABIN.height * AIRCRAFT_LAYOUT.bottomUtilityRatio;
const USABLE_SEAT_TOP = CABIN.top + TOP_UTILITY_HEIGHT;
const USABLE_SEAT_HEIGHT = CABIN.height - TOP_UTILITY_HEIGHT - BOTTOM_UTILITY_HEIGHT;
const USABLE_SEAT_BOTTOM = USABLE_SEAT_TOP + USABLE_SEAT_HEIGHT;
const SECTION_CHROME_HEIGHT = AIRCRAFT_LAYOUT.sectionHeaderHeight + AIRCRAFT_LAYOUT.columnLabelHeight;

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function Icon({ children }) {
  return <span className="material-symbols-outlined" aria-hidden="true">{children}</span>;
}

function trackStyle(layout) {
  return {
    "--seat-width": `${layout.seatWidth}px`,
    "--seat-height": `${layout.seatHeight}px`,
    "--seat-gap": `${layout.columnGap}px`,
    "--aisle-width": `${layout.aisleWidth}px`,
    "--row-step": `${layout.rowStep}px`,
    "--row-offset": `${layout.rowOffset}px`,
    "--content-width": `${layout.contentWidth}px`,
    "--block-gap": `${layout.blockGap}px`,
    gridTemplateColumns: layout.gridTemplateColumns,
  };
}

function SeatGrid({ row, rowIndex, rowCount, seats, renderSeat, layout, fare, viewMode }) {
  const seatByColumn = new Map(seats.map((seat) => [seatColumn(seat), seat]));
  const blockStart = layout.breakEvery > 0 && rowIndex > 0 && rowIndex % layout.breakEvery === 0;
  const showNumber = true;

  return (
    <div
      className={`aircraft-seat-row aircraft-seat-row-${fare} groups-${layout.groupCount}${blockStart ? " block-start" : ""}`}
      style={{ ...trackStyle(layout), marginTop: blockStart ? layout.blockGap : 0 }}
      data-seat-row={row}
    >
      {layout.tracks.map((track) => {
        if (track.type === "aisle") {
          return (
            <span
              className="aircraft-row-marker"
              data-visible={showNumber ? "true" : "false"}
              key={`${row}-${track.key}`}
            >
              {showNumber ? row : ""}
            </span>
          );
        }

        return (
            <div
                className="aircraft-seat-group"
                key={`${row}-${track.key}`}
                style={{
                    gridTemplateColumns:
                        `repeat(${track.group.length}, minmax(0, 1fr))`,
                }}
            >
            {track.group.map((column) => {
              const seat = seatByColumn.get(column);

              return (
                <span
                  className="aircraft-seat-slot"
                  key={`${row}-${column}`}
                >
                  {seat
                    ? renderSeat(seat)
                    : <span className="seat-placeholder" aria-hidden="true" />}
                </span>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

function ColumnLabels({ layout }) {
    return (
        <div
            className="aircraft-column-labels"
            style={trackStyle(layout)}
        >
            {layout.tracks.map((track) => {
                if (track.type === "aisle") {
                    return (
                        <div
                            className="aircraft-column-aisle"
                            key={track.key}
                            aria-hidden="true"
                        />
                    );
                }

                return (
                    <div
                        className="aircraft-column-group"
                        key={track.key}
                        style={{
                            gridTemplateColumns:
                                `repeat(${track.group.length}, minmax(0, 1fr))`,
                        }}
                    >
                        {track.group.map((column) => (
                            <div
                                className="aircraft-column-slot"
                                key={column}
                            >
                                <span className="aircraft-column-letter">
                                    {column}
                                </span>
                            </div>
                        ))}
                    </div>
                );
            })}
        </div>
    );
}
function CabinSection({ section, renderSeat, viewMode, onRequestFocus }) {
  const layout = viewMode === "focus" ? section.focusLayout : section.overviewLayout;

  useEffect(() => {
    if (import.meta.env.DEV && !layout.valid) {
      console.warn("Cabin layout invalid", {
        fare: section.fare,
        rows: section.rows.length,
        columns: layout.expectedColumns.length,
        sectionWidth: CABIN.width,
        sectionHeight: section.height,
        seatWidth: layout.seatWidth,
        seatHeight: layout.seatHeight,
        contentWidth: layout.contentWidth,
        contentHeight: layout.contentHeight,
      });
    }
  }, [layout, section]);

  return (
    <section
      className={`aircraft-cabin aircraft-cabin-${section.fare}`}
      style={{
        top: section.top,
        height: section.height,
        "--section-header-height": `${AIRCRAFT_LAYOUT.sectionHeaderHeight}px`,
        "--column-label-height": `${AIRCRAFT_LAYOUT.columnLabelHeight}px`,
      }}
      data-cabin={section.fare}
      data-view-mode={viewMode}
      onClick={() => viewMode === "overview" && onRequestFocus(section.fare)}
    >
      <header><i /><span>{section.fare.toUpperCase()}</span><i /></header>
      <ColumnLabels layout={layout} />
      <div className="aircraft-cabin-rows">
        {section.rows.map(({ row, seats }, rowIndex) => (
          <SeatGrid
            key={row}
            row={row}
            rowIndex={rowIndex}
            rowCount={section.rows.length}
            seats={seats}
            renderSeat={renderSeat}
            layout={layout}
            fare={section.fare}
            viewMode={viewMode}
          />
        ))}
      </div>
    </section>
  );
}

function PanZoomControls({ onZoom, onFit }) {
  return (
    <div className="seat-map-controls" aria-label="Điều khiển sơ đồ ghế">
      <button type="button" onClick={() => onZoom(1.16)} aria-label="Phóng to"><Icon>add</Icon></button>
      <button type="button" onClick={() => onZoom(0.86)} aria-label="Thu nhỏ"><Icon>remove</Icon></button>
      <button type="button" onClick={onFit} aria-label="Hiển thị toàn bộ máy bay"><Icon>fit_screen</Icon></button>
    </div>
  );
}

function SeatMapScrollRail({ viewport, view, onScrollTo }) {
  if (!viewport || AIRCRAFT_LAYOUT.height * view.scale <= viewport.height + 2) return null;

  const worldHeight = AIRCRAFT_LAYOUT.height * view.scale;
  const thumbHeight = clamp((viewport.height / worldHeight) * 100, 12, 68);
  const minY = viewport.height - worldHeight - 24;
  const maxY = 24;
  const travel = Math.max(1, maxY - minY);
  const progress = clamp((maxY - view.y) / travel, 0, 1);
  const thumbTop = progress * (100 - thumbHeight);

  const moveThumb = (event) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const next = clamp((event.clientY - bounds.top) / bounds.height, 0, 1);
    onScrollTo(next);
  };

  const startRailDrag = (event) => {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    moveThumb(event);
  };

  return (
    <div
      className="seat-map-scrollbar"
      aria-label="Cuộn dọc sơ đồ ghế"
      onPointerDown={startRailDrag}
      onPointerMove={(event) => event.currentTarget.hasPointerCapture(event.pointerId) && moveThumb(event)}
      onPointerUp={(event) => event.currentTarget.releasePointerCapture?.(event.pointerId)}
      onPointerCancel={(event) => event.currentTarget.releasePointerCapture?.(event.pointerId)}
    >
      <span className="seat-map-scrollbar-thumb" style={{ height: `${thumbHeight}%`, top: `${thumbTop}%` }} />
    </div>
  );
}

export default function AircraftSeatMap({ cabins, activeCabin, focusRequest, onCabinChange, renderSeat }) {
  const viewportRef = useRef(null);
  const dragRef = useRef(null);
  const programmaticRef = useRef(false);
  const activeRef = useRef(activeCabin);
  const focusRef = useRef(null);
  const viewModeRef = useRef("overview");
  const lastFocusRequestRef = useRef(0);
  const fitScaleRef = useRef(0.42);
  const [dragging, setDragging] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [viewMode, setViewMode] = useState("overview");
  const [view, setView] = useState({ x: 0, y: 0, scale: 0.42 });

  const sections = useMemo(() => {
    const visible = ["first", "business", "economy"]
      .map((fare) => cabins.find((cabin) => cabin.fare === fare) || { fare, rows: [] })
      .filter((cabin) => cabin.rows.length > 0);
    const totalWeightedRows = visible.reduce(
      (sum, cabin) => sum + cabin.rows.length * cabinWeight(cabin.fare),
      0,
    ) || 1;
    const gapsHeight = AIRCRAFT_LAYOUT.sectionGap * Math.max(0, visible.length - 1);
    const fixedChromeHeight = SECTION_CHROME_HEIGHT * visible.length;
    const availableRowsHeight = Math.max(1, USABLE_SEAT_HEIGHT - gapsHeight - fixedChromeHeight);
    let cursor = 0;

    return visible.map((cabin, index) => {
      const isLast = index === visible.length - 1;
      const weightedRowHeight = availableRowsHeight
        * cabin.rows.length
        * cabinWeight(cabin.fare)
        / totalWeightedRows;
      const proposedHeight = SECTION_CHROME_HEIGHT + weightedRowHeight;
      const remainingHeight = USABLE_SEAT_HEIGHT - cursor;
      const height = isLast ? remainingHeight : Math.min(proposedHeight, remainingHeight);
      const seatAreaHeight = Math.max(1, height - SECTION_CHROME_HEIGHT);
      const base = {
        rows: cabin.rows,
        usableWidth: CABIN.width,
        usableHeight: seatAreaHeight,
        fare: cabin.fare,
      };
      const section = {
        ...cabin,
        top: cursor,
        height,
        overviewLayout: buildCabinLayout({ ...base, viewMode: "overview" }),
        focusLayout: buildCabinLayout({ ...base, viewMode: "focus" }),
      };
      cursor += height + AIRCRAFT_LAYOUT.sectionGap;
      return section;
    });
  }, [cabins]);

  useEffect(() => { activeRef.current = activeCabin; }, [activeCabin]);
  useEffect(() => { viewModeRef.current = viewMode; }, [viewMode]);

  const getFitScale = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return fitScaleRef.current;
    return Math.min(
      (viewport.clientWidth - 48) / AIRCRAFT_LAYOUT.width,
      (viewport.clientHeight - 48) / AIRCRAFT_LAYOUT.height,
    );
  }, []);

  const clampView = useCallback((next) => {
    const viewport = viewportRef.current;
    if (!viewport) return next;
    const scaledWidth = AIRCRAFT_LAYOUT.width * next.scale;
    const scaledHeight = AIRCRAFT_LAYOUT.height * next.scale;
    return {
      ...next,
      x: scaledWidth <= viewport.clientWidth
        ? (viewport.clientWidth - scaledWidth) / 2
        : Math.min(24, Math.max(viewport.clientWidth - scaledWidth - 24, next.x)),
      y: scaledHeight <= viewport.clientHeight
        ? (viewport.clientHeight - scaledHeight) / 2
        : Math.min(24, Math.max(viewport.clientHeight - scaledHeight - 24, next.y)),
    };
  }, []);

  const fit = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const scale = getFitScale();
    fitScaleRef.current = scale;
    setAnimating(true);
    setViewMode("overview");
    setView({
      scale,
      x: (viewport.clientWidth - AIRCRAFT_LAYOUT.width * scale) / 2,
      y: (viewport.clientHeight - AIRCRAFT_LAYOUT.height * scale) / 2,
    });
    window.setTimeout(() => setAnimating(false), 430);
  }, [getFitScale]);

  const focus = useCallback((fare) => {
    const viewport = viewportRef.current;
    const section = sections.find((item) => item.fare === fare);
    if (!viewport || !section) return;

    const desiredSeatScreenWidth = fare === "economy" ? 31 : fare === "business" ? 34 : 36;
    const scaleBySeat = desiredSeatScreenWidth / Math.max(section.focusLayout.seatWidth, 1);
    const scaleByCabinWidth = (viewport.clientWidth * 0.56) / CABIN.width;
    const minimumScale = Math.max(getFitScale() * 1.55, 0.9);
    const scale = clamp(Math.max(scaleBySeat, scaleByCabinWidth, minimumScale), minimumScale, 4.2);
    const visibleWorldHeight = viewport.clientHeight / scale;
    const sectionWorldTop = USABLE_SEAT_TOP + section.top;
    const sectionCenter = sectionWorldTop + section.height / 2;
    const targetWorldY = section.height <= visibleWorldHeight * 0.82
      ? sectionCenter
      : sectionWorldTop + visibleWorldHeight * 0.43;
    const cabinCenterX = CABIN.left + CABIN.width / 2;

    programmaticRef.current = true;
    activeRef.current = fare;
    onCabinChange(fare);
    setAnimating(true);
    setViewMode("focus");
    setView(clampView({
      scale,
      x: viewport.clientWidth / 2 - cabinCenterX * scale,
      y: viewport.clientHeight / 2 - targetWorldY * scale,
    }));
    window.setTimeout(() => {
      programmaticRef.current = false;
      setAnimating(false);
    }, 430);
  }, [clampView, getFitScale, onCabinChange, sections]);

  useEffect(() => { focusRef.current = focus; }, [focus]);

  const detectSection = useCallback((next) => {
    const viewport = viewportRef.current;
    if (programmaticRef.current || !viewport) return;
    const centerY = (viewport.clientHeight / 2 - next.y) / next.scale;
    const distances = sections
      .map((section) => ({
        fare: section.fare,
        distance: Math.abs(centerY - (USABLE_SEAT_TOP + section.top + section.height / 2)),
      }))
      .sort((a, b) => a.distance - b.distance);
    const current = distances.find((item) => item.fare === activeRef.current);
    if (distances[0]
      && distances[0].fare !== activeRef.current
      && distances[0].distance + 45 < (current?.distance ?? Infinity)) {
      activeRef.current = distances[0].fare;
      onCabinChange(distances[0].fare);
    }
  }, [onCabinChange, sections]);

  const scrollToProgress = useCallback((progress) => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const scaledHeight = AIRCRAFT_LAYOUT.height * view.scale;
    const minY = viewport.clientHeight - scaledHeight - 24;
    const maxY = 24;
    const next = clampView({
      ...view,
      y: maxY - clamp(progress, 0, 1) * Math.max(0, maxY - minY),
    });
    setAnimating(false);
    setView(next);
    detectSection(next);
  }, [clampView, detectSection, view]);

  useEffect(() => { fit(); }, [fit]);
  useEffect(() => {
    if (!focusRequest || focusRequest === lastFocusRequestRef.current) return;
    lastFocusRequestRef.current = focusRequest;
    focus(activeCabin);
  }, [activeCabin, focus, focusRequest]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return undefined;
    let frameId = 0;
    const syncLayout = () => {
      window.cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(() => {
        if (viewModeRef.current === "overview") fit();
        else focusRef.current?.(activeRef.current);
      });
    };
    const observer = window.ResizeObserver ? new ResizeObserver(syncLayout) : null;
    observer?.observe(viewport);
    window.addEventListener("resize", syncLayout);
    return () => {
      window.cancelAnimationFrame(frameId);
      observer?.disconnect();
      window.removeEventListener("resize", syncLayout);
    };
  }, [fit]);

  const zoom = (multiplier, clientX, clientY) => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const rect = viewport.getBoundingClientRect();
    const pointX = clientX ?? rect.left + rect.width / 2;
    const pointY = clientY ?? rect.top + rect.height / 2;
    const fitScale = getFitScale();
    fitScaleRef.current = fitScale;
    setAnimating(false);
    const scale = Math.min(4.4, Math.max(fitScale, view.scale * multiplier));
    const sourceX = (pointX - rect.left - view.x) / view.scale;
    const sourceY = (pointY - rect.top - view.y) / view.scale;
    const next = clampView({
      scale,
      x: pointX - rect.left - sourceX * scale,
      y: pointY - rect.top - sourceY * scale,
    });
    if (scale <= fitScale * 1.08) setViewMode("overview");
    else if (scale >= fitScale * 1.35) setViewMode("focus");
    setView(next);
    detectSection(next);
  };

  const startDrag = (event) => {
    // Decorative aircraft layers must never be able to consume the pan gesture.
    // Only a real seat button opts out so its click remains a seat-selection action.
    if (event.button !== 0 || event.target.closest?.(".booking-seat, .seat-map-scrollbar")) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    setAnimating(false);
    const focused = view.scale >= getFitScale() * 1.35;
    dragRef.current = {
      x: event.clientX,
      y: event.clientY,
      view,
      moved: false,
      // The tall Economy cabin needs more movement per gesture in focus mode.
      multiplier: focused ? 1.8 : 1,
    };
  };
  const drag = (event) => {
    const start = dragRef.current;
    if (!start) return;
    if (!start.moved && Math.abs(event.clientX - start.x) + Math.abs(event.clientY - start.y) > 4) {
      start.moved = true;
      setDragging(true);
    }
    if (!start.moved) return;
    const next = clampView({
      ...start.view,
      x: start.view.x + (event.clientX - start.x) * start.multiplier,
      y: start.view.y + (event.clientY - start.y) * start.multiplier,
    });
    setView(next);
    detectSection(next);
  };
  const stopDrag = () => {
    dragRef.current = null;
    setDragging(false);
  };

  return (
    <div className="seat-map-stage aircraft-map-stage">
      <div
        className="seat-map-viewport"
        ref={viewportRef}
        onPointerDownCapture={startDrag}
        onPointerMoveCapture={drag}
        onPointerUpCapture={stopDrag}
        onPointerCancelCapture={stopDrag}
        onWheel={(event) => {
          event.preventDefault();
          zoom(event.deltaY < 0 ? 1.12 : 0.89, event.clientX, event.clientY);
        }}
      >
        <div
          className={`aircraft-map-canvas${dragging ? " dragging" : ""}${animating ? " animating" : ""}`}
          data-view-mode={viewMode}
          style={{
            width: AIRCRAFT_LAYOUT.width,
            height: AIRCRAFT_LAYOUT.height,
            transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`,
          }}
        >
          <img
            src={AIRCRAFT_LAYOUT.asset}
            alt=""
            aria-hidden="true"
            className="aircraft-shell"
            draggable="false"
            style={{ pointerEvents: "none" }}
          />
          <div
            className="cabin-overlay"
            style={{ top: CABIN.top, left: CABIN.left, width: CABIN.width, height: CABIN.height }}
          >
            <div className="aircraft-utility top-utility-area" style={{ height: TOP_UTILITY_HEIGHT }}>
              <Icon>wc</Icon><Icon>door_front</Icon>
            </div>
          </div>
          <div
            className="usable-seat-area"
            style={{ top: USABLE_SEAT_TOP, left: CABIN.left, width: CABIN.width, height: USABLE_SEAT_HEIGHT }}
          >
            {sections.map((section) => (
              <CabinSection
                key={section.fare}
                section={section}
                renderSeat={renderSeat}
                viewMode={viewMode}
                onRequestFocus={focus}
              />
            ))}
          </div>
          <div
            className="aircraft-utility bottom-utility-area"
            style={{ top: USABLE_SEAT_BOTTOM, left: CABIN.left, width: CABIN.width, height: BOTTOM_UTILITY_HEIGHT }}
          >
            <Icon>wc</Icon><Icon>local_cafe</Icon><Icon>wc</Icon>
          </div>
        </div>
        <SeatMapScrollRail
          viewport={viewportRef.current && { width: viewportRef.current.clientWidth, height: viewportRef.current.clientHeight }}
          view={view}
          onScrollTo={scrollToProgress}
        />
      </div>
      <div className="seat-map-hint"><Icon>pan_tool</Icon><span>Kéo để di chuyển</span><span>Cuộn để phóng to/thu nhỏ</span></div>
      <PanZoomControls onZoom={zoom} onFit={fit} />
    </div>
  );
}
