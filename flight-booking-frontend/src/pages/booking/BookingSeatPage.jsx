import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { bookingService } from "../../services/bookingService";
import AircraftSeatMap from "../../components/seat-map/AircraftSeatMap";
import aircraftTop from "../../assets/booking/aircraft-seatmap-v3.png";
import "../../styles/pages/booking-seat.css";

const HOLD_SECONDS = 10 * 60;
const BAGGAGE_OPTIONS = [
  { kg: 0, price: 0, label: "Không thêm hành lý" },
  { kg: 20, price: 350000, label: "20kg" },
  { kg: 25, price: 440000, label: "25kg" },
  { kg: 30, price: 520000, label: "30kg" },
  { kg: 40, price: 720000, label: "40kg" },
];
const PROTECTION_OPTIONS = [
  { id: "none", name: "Không thêm", price: 0, description: "Không áp dụng bảo vệ bổ sung." },
  { id: "protect", name: "Bảo vệ chuyến đi", price: 120000, description: "Hỗ trợ khi chuyến bay bị gián đoạn và bảo vệ chi phí phát sinh đủ điều kiện." },
  { id: "flex", name: "Bảo vệ linh hoạt", price: 250000, description: "Bao gồm bảo vệ chuyến đi và quyền đổi lịch/hoàn vé theo điều kiện áp dụng." },
];

function Icon({ children }) { return <span className="material-symbols-outlined" aria-hidden="true">{children}</span>; }
function money(value) { return `${new Intl.NumberFormat("vi-VN").format(Number(value || 0))} VND`; }
function time(value) { return value ? new Date(value).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : "--"; }
function date(value) { return value ? new Date(value).toLocaleDateString("vi-VN", { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" }) : "--"; }
function rowNumber(value) { return Number(String(value).match(/^\d+/)?.[0] || 0); }
function normalizeFare(value) {
  const text = String(value || "").toLowerCase();
  if (text.includes("business") || text.includes("thương")) return "business";
  if (text.includes("first")) return "first";
  return "economy";
}
function fareLabel(value) { return value === "business" ? "Business" : value === "first" ? "First class" : "Economy"; }
function createAssignments(count) { return Array.from({ length: count }, () => null); }
function getSession(flightId) {
  const params = new URLSearchParams(window.location.search);
  const existing = params.get("seatSession");
  if (existing) return existing;
  const created = crypto.randomUUID();
  params.set("seatSession", created);
  window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
  return created;
}
function secondsUntil(holdUntil, serverTime) {
  const end = Date.parse(holdUntil || "");
  const now = Date.parse(serverTime || "");
  return Number.isFinite(end) && Number.isFinite(now) ? Math.max(0, Math.floor((end - now) / 1000)) : HOLD_SECONDS;
}

export default function BookingSeatPage() {
  const { id: flightId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = useMemo(() => getSession(flightId), [flightId]);
  const initialPassengerCount = Math.min(9, Math.max(1, Number(searchParams.get("passengers") || 1)));
  const [passengerCount, setPassengerCount] = useState(initialPassengerCount);
  const [activePassenger, setActivePassenger] = useState(0);
  const [assignments, setAssignments] = useState(() => createAssignments(initialPassengerCount));
  const [servicesByPassenger, setServicesByPassenger] = useState(() => createServiceState(initialPassengerCount));
  const [selectedFare, setSelectedFare] = useState(() => normalizeFare(searchParams.get("fare")));
  const [mapFocusRequest, setMapFocusRequest] = useState(0);
  const [data, setData] = useState(null);
  const [paymentStarted, setPaymentStarted] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(null);
  const [modal, setModal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const requestInFlight = useRef(false);
  const seatMutationInFlight = useRef(new Set());
  const assignmentsRef = useRef(assignments);

  useEffect(() => {
    assignmentsRef.current = assignments;
  }, [assignments]);

  const loadSeatMap = useCallback(async (silent = false) => {
    if (requestInFlight.current) return;
    requestInFlight.current = true;
    if (!silent) setLoading(true);
    try {
      const result = await bookingService.getSeatMap(flightId, sessionId);
      // Only restore a payment hold that belongs to this exact seat session.
      // A same-account hold from another tab/session must remain unavailable,
      // but must not lock this page's entire seat map.
      const ownHeld = result.seats.filter((seat) => seat.trangThai === "Held" && seat.laGheCuaToi);
      setData(result);
      setError("");
      if (ownHeld.length) {
        const heldIds = ownHeld.map((seat) => seat.maGheChuyenBay);
        const previousIds = assignmentsRef.current.filter((seatId) => heldIds.includes(seatId));
        const nextAssignments = normalizeAssignments([...previousIds, ...heldIds.filter((seatId) => !previousIds.includes(seatId))], passengerCount);
        assignmentsRef.current = nextAssignments;
        setAssignments(nextAssignments);
        const paymentHold = ownHeld.find((seat) => seat.dangThanhToan);
        if (paymentHold) {
          setPaymentStarted(true);
          setSecondsLeft(secondsUntil(paymentHold.giuDenLuc, result.serverTime));
        }
      } else if (paymentStarted) {
        setPaymentStarted(false);
        setSecondsLeft(null);
      }
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Không thể tải sơ đồ ghế.");
    } finally {
      requestInFlight.current = false;
      setLoading(false);
    }
  }, [flightId, passengerCount, paymentStarted, sessionId]);

  useEffect(() => {
    loadSeatMap();
    const poll = window.setInterval(() => loadSeatMap(true), 3000);
    return () => window.clearInterval(poll);
  }, [loadSeatMap]);

  useEffect(() => {
    if (!paymentStarted || secondsLeft === null) return undefined;
    if (secondsLeft <= 0) {
      setPaymentStarted(false);
      const nextAssignments = createAssignments(passengerCount);
      assignmentsRef.current = nextAssignments;
      setAssignments(nextAssignments);
      loadSeatMap(true);
      return undefined;
    }
    const timer = window.setInterval(() => setSecondsLeft((current) => Math.max(0, (current || 0) - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [loadSeatMap, passengerCount, paymentStarted, secondsLeft]);

  const seatById = useMemo(() => new Map((data?.seats || []).map((seat) => [seat.maGheChuyenBay, seat])), [data]);
  const cabins = useMemo(() => ["first", "business", "economy"].map((fare) => {
    const grouped = new Map();
    (data?.seats || []).filter((seat) => normalizeFare(seat.tenHangGhe) === fare).forEach((seat) => {
      const row = rowNumber(seat.soGhe);
      if (!grouped.has(row)) grouped.set(row, []);
      grouped.get(row).push(seat);
    });
    return { fare, rows: [...grouped.entries()].sort(([a], [b]) => a - b).map(([row, seats]) => ({
      row,
      seats: seats.sort((a, b) => String(a.soGhe).localeCompare(String(b.soGhe), "en", { numeric: true })),
    })) };
  }), [data]);
  const selectedIds = assignments.filter(Boolean);
  const selectedSeats = assignments.map((seatId) => seatById.get(seatId) || null);
  const seatTotal = selectedSeats.reduce((sum, seat) => sum + Number(seat?.giaGhe || 0), 0);
  const serviceTotal = servicesByPassenger.reduce((sum, service) => sum + service.baggage.price + protection(service.protection).price, 0);
  const total = seatTotal + serviceTotal;

  const setSeatStatus = (seatId, update) => {
    setData((current) => current ? { ...current, seats: current.seats.map((item) => item.maGheChuyenBay === seatId ? { ...item, ...update } : item) } : current);
  };

  const chooseSeat = async (seat) => {
    const seatId = seat.maGheChuyenBay;
    const status = String(seat.trangThai).toLowerCase();
    const heldByThisSession = status === "held" && seat.laGheCuaToi;
    if (paymentStarted || seatMutationInFlight.current.has(seatId) || (status !== "available" && !heldByThisSession)) return;
    setError("");
    const next = [...assignmentsRef.current];
    const owner = next.indexOf(seatId);
    const isDeselecting = owner === activePassenger;
    seatMutationInFlight.current.add(seatId);
    try {
      if (isDeselecting) {
        await bookingService.releaseSeat(flightId, seatId, sessionId);
        next[activePassenger] = null;
        setSeatStatus(seatId, { trangThai: "Available", laGheCuaToi: false, dangThanhToan: false, giuDenLuc: null });
      } else if (heldByThisSession) {
        if (owner >= 0) next[owner] = null;
        next[activePassenger] = seatId;
      } else {
        const previousSeatId = next[activePassenger];
        if (previousSeatId) {
          await bookingService.releaseSeat(flightId, previousSeatId, sessionId);
          setSeatStatus(previousSeatId, { trangThai: "Available", laGheCuaToi: false, dangThanhToan: false, giuDenLuc: null });
        }
        try {
          await bookingService.holdSeat(flightId, seatId, sessionId, seat.maHangGhe, passengerCount);
        } catch (holdError) {
          if (previousSeatId) {
            const previousSeat = seatById.get(previousSeatId);
            if (previousSeat) await bookingService.holdSeat(flightId, previousSeatId, sessionId, previousSeat.maHangGhe, passengerCount).catch(() => {});
          }
          throw holdError;
        }
        if (owner >= 0) next[owner] = null;
        next[activePassenger] = seatId;
        setSeatStatus(seatId, { trangThai: "Held", laGheCuaToi: true, dangThanhToan: false });
      }
      assignmentsRef.current = next;
      setAssignments(next);
      if (!isDeselecting) {
        const nextPassenger = next.findIndex((assignedSeatId, index) => index > activePassenger && !assignedSeatId);
        if (nextPassenger >= 0) setActivePassenger(nextPassenger);
      }
      await loadSeatMap(true);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Không thể giữ ghế này. Vui lòng chọn ghế khác.");
      await loadSeatMap(true);
    } finally {
      seatMutationInFlight.current.delete(seatId);
    }
  };

  const changePassengerCount = (nextCount) => {
    if (paymentStarted) return;
    const count = Math.min(9, Math.max(1, nextCount));
    if (count < passengerCount && assignments.slice(count).some(Boolean)) {
      setError("Hãy bỏ ghế của hành khách cuối trước khi giảm số người.");
      return;
    }
    setPassengerCount(count);
    const nextAssignments = normalizeAssignments(assignmentsRef.current, count);
    assignmentsRef.current = nextAssignments;
    setAssignments(nextAssignments);
    setServicesByPassenger((current) => normalizeServices(current, count));
    // When a passenger is added, the next seat selected belongs to that new passenger.
    setActivePassenger((current) => count > passengerCount ? count - 1 : Math.min(current, count - 1));
    setError("");
  };

  const focusCabin = (fare) => {
    setSelectedFare(fare);
    setMapFocusRequest((current) => current + 1);
  };

  const updateService = (passengerIndex, update) => {
    setServicesByPassenger((current) => current.map((item, index) => index === passengerIndex ? { ...item, ...update } : item));
    setModal(null);
  };

  const startPayment = async () => {
    if (selectedIds.length !== passengerCount || new Set(selectedIds).size !== passengerCount) {
      setError(`Vui lòng chọn đủ ${passengerCount} ghế cho ${passengerCount} hành khách.`);
      return;
    }
    try {
      const result = await bookingService.startPaymentHold(flightId, sessionId, passengerCount, selectedIds);
      setPaymentStarted(true);
      setSecondsLeft(secondsUntil(result.holdUntil, result.serverTime));
      setError("");
      await loadSeatMap(true);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Một hoặc nhiều ghế vừa không còn trống. Vui lòng chọn lại.");
    }
  };

  const cancelPayment = async () => {
    try {
      await bookingService.cancelPaymentHold(flightId, sessionId);
      setPaymentStarted(false);
      setSecondsLeft(null);
      const nextAssignments = createAssignments(passengerCount);
      assignmentsRef.current = nextAssignments;
      setAssignments(nextAssignments);
      setActivePassenger(0);
      await loadSeatMap(true);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Không thể hủy giữ chỗ.");
    }
  };

  if (loading && !data) return <main className="booking-loading"><Icon>airline_seat_recline_normal</Icon><p>Đang tải sơ đồ ghế...</p></main>;
  if (!data) return <main className="booking-loading booking-loading-error"><Icon>error</Icon><p>{error}</p><button onClick={() => navigate(-1)}>Quay lại</button></main>;

  const minutes = String(Math.floor((secondsLeft || 0) / 60)).padStart(2, "0");
  const seconds = String((secondsLeft || 0) % 60).padStart(2, "0");

  return <main className="booking-seat-page">
    <section className="booking-topline">
      <button className="booking-back" onClick={() => navigate(-1)}><Icon>arrow_back</Icon>Đổi chuyến bay</button>
      <div className="booking-route"><strong>{data.flight.maSanBayDi}</strong><Icon>flight_takeoff</Icon><strong>{data.flight.maSanBayDen}</strong></div>
      <div className="booking-flight-meta"><span>{data.flight.soHieuChuyenBay}</span><span>{date(data.flight.gioKhoiHanh)}</span><span>{time(data.flight.gioKhoiHanh)} - {time(data.flight.gioHaCanh)}</span></div>
    </section>
    {error && <div className="booking-alert"><Icon>warning</Icon>{error}</div>}

    <section className="booking-workspace">
      <div className="booking-map-card">
        <div className="booking-map-toolbar">
          <div><p>SƠ ĐỒ GHẾ</p><h1>Chọn chỗ ngồi</h1></div>
          <div className="booking-cabin-switcher" aria-label="Chọn khoang ghế">{["first", "business", "economy"].map((fare) => { const available = cabins.some((cabin) => cabin.fare === fare && cabin.rows.length); return <button key={fare} disabled={!available} className={fare === selectedFare ? "active" : ""} onClick={() => available && focusCabin(fare)}>{fare === "first" ? "First" : fareLabel(fare)}</button>; })}</div>
        </div>
        <div className="booking-map-content">
          <aside className="booking-legend"><span><i className="available" />Trống</span><span><i className="selected" />Đang chọn</span><span><i className="paying" />Đang thanh toán</span><span><i className="sold" />Đã bán</span></aside>
          <AircraftSeatMap cabins={cabins} activeCabin={selectedFare} focusRequest={mapFocusRequest} onCabinChange={setSelectedFare} renderSeat={(seat) => <Seat key={seat.maGheChuyenBay} seat={seat} selected={selectedIds.includes(seat.maGheChuyenBay)} paymentStarted={paymentStarted} onChoose={chooseSeat} />} />
        </div>
        <p className="booking-map-note"><Icon>info</Icon>Chọn ghế cho từng hành khách. Ghế chỉ được giữ trong 10 phút sau khi bạn tiếp tục thanh toán.</p>
      </div>

      <aside className="booking-summary">
        <div className="booking-summary-head"><div><p>ĐẶT CHỖ</p><h2>Hành khách & dịch vụ</h2></div>{paymentStarted ? <div className="booking-timer"><Icon>timer</Icon><strong>{minutes}:{seconds}</strong></div> : <div className="booking-timer waiting"><Icon>timer_off</Icon><strong>Chưa giữ chỗ</strong></div>}</div>
        <div className="booking-passenger-count"><span>Số hành khách</span><div><button disabled={paymentStarted || passengerCount <= 1} onClick={() => changePassengerCount(passengerCount - 1)} aria-label="Giảm số hành khách"><Icon>remove</Icon></button><b>{passengerCount}</b><button disabled={paymentStarted || passengerCount >= 9} onClick={() => changePassengerCount(passengerCount + 1)} aria-label="Tăng số hành khách"><Icon>add</Icon></button></div></div>
        <div className="booking-passenger-list">{assignments.map((seatId, index) => {
          const seat = seatById.get(seatId);
          const service = servicesByPassenger[index];
          return <article className={`booking-passenger ${index === activePassenger && !paymentStarted ? "active" : ""}`} key={index} onClick={() => !paymentStarted && setActivePassenger(index)}><div className="booking-passenger-title"><span><Icon>person</Icon>Hành khách {index + 1}</span><b>{seat?.soGhe || "Chưa chọn"}</b></div><div className="booking-passenger-actions"><button disabled={paymentStarted} onClick={(event) => { event.stopPropagation(); setModal({ type: "baggage", passenger: index }); }}><Icon>luggage</Icon><span>{service.baggage.kg ? `${service.baggage.kg}kg` : "Hành lý"}</span></button><button disabled={paymentStarted} onClick={(event) => { event.stopPropagation(); setModal({ type: "protection", passenger: index }); }}><Icon>shield</Icon><span>{protection(service.protection).id === "none" ? "Bảo vệ" : protection(service.protection).name}</span></button></div></article>;
        })}</div>
        <div className="booking-cost"><div><span>Ghế đã chọn</span><b>{money(seatTotal)}</b></div><div><span>Dịch vụ hành khách</span><b>{money(serviceTotal)}</b></div></div>
        <div className="booking-total"><span>Tổng tiền</span><strong>{money(total)}</strong></div>
        {paymentStarted ? <><button className="booking-cancel" onClick={cancelPayment}>Hủy giữ chỗ</button><button className="booking-pay">Thanh toán ngay <Icon>credit_card</Icon></button></> : <button className="booking-pay" disabled={selectedIds.length !== passengerCount} onClick={startPayment}>Tiếp tục thanh toán <Icon>arrow_forward</Icon></button>}
      </aside>
    </section>
    {modal && <ServiceModal modal={modal} service={servicesByPassenger[modal.passenger]} onClose={() => setModal(null)} onChoose={updateService} />}
  </main>;
}

function SeatMapCanvas({ cabins, selectedIds, paymentStarted, onChoose, activeCabin, focusRequest, onCabinChange }) {
  const viewportRef = useRef(null);
  const cabinRefs = useRef({});
  const dragRef = useRef(null);
  const autoFocusRef = useRef(false);
  const activeCabinRef = useRef(activeCabin);
  const [view, setView] = useState({ x: 0, y: 0, scale: 0.62 });
  const [dragging, setDragging] = useState(false);
  const first = cabins.find((cabin) => cabin.fare === "first") || { rows: [] };
  const business = cabins.find((cabin) => cabin.fare === "business") || { rows: [] };
  const economy = cabins.find((cabin) => cabin.fare === "economy") || { rows: [] };
  const maxColumns = Math.max(2, ...cabins.flatMap((cabin) => cabin.rows.map((row) => row.seats.length)));
  const fuselageWidth = Math.min(450, Math.max(320, 100 + maxColumns * 46));
  const firstHeight = Math.max(118, first.rows.length * 26 + 50);
  const businessTop = 154 + firstHeight + 30;
  const businessHeight = Math.max(156, business.rows.length * 25 + 50);
  const economyTop = businessTop + businessHeight + 34;
  const economyHeight = Math.max(190, economy.rows.length * 34 + 52);
  const sceneHeight = Math.max(960, economyTop + economyHeight + 130);

  useEffect(() => { activeCabinRef.current = activeCabin; }, [activeCabin]);

  const syncCabin = useCallback((nextView) => {
    if (autoFocusRef.current) return;
    const viewport = viewportRef.current;
    if (!viewport) return;
    const centerY = (viewport.clientHeight / 2 - nextView.y) / nextView.scale;
    const candidates = ["first", "business", "economy"].map((fare) => {
      const element = cabinRefs.current[fare];
      const center = element ? element.offsetTop + element.offsetHeight / 2 : 0;
      return { fare, distance: Math.abs(centerY - center) };
    });
    const nearest = candidates.sort((a, b) => a.distance - b.distance)[0];
    if (nearest && nearest.fare !== activeCabinRef.current) onCabinChange(nearest.fare);
  }, [onCabinChange]);

  const fitMap = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const scale = Math.min((viewport.clientWidth - 28) / 1024, (viewport.clientHeight - 28) / sceneHeight);
    const nextView = { scale, x: (viewport.clientWidth - 1024 * scale) / 2, y: (viewport.clientHeight - sceneHeight * scale) / 2 };
    setView(nextView);
    syncCabin(nextView);
  }, [sceneHeight, syncCabin]);

  const focusCabin = useCallback((fare) => {
    const viewport = viewportRef.current;
    const cabin = cabinRefs.current[fare];
    if (!viewport || !cabin) return;
    autoFocusRef.current = true;
    const scale = Math.min(1.05, Math.max(0.54, (viewport.clientHeight - 112) / cabin.offsetHeight));
    const nextView = {
      scale,
      x: (viewport.clientWidth - 1024 * scale) / 2,
      y: viewport.clientHeight / 2 - (cabin.offsetTop + cabin.offsetHeight / 2) * scale,
    };
    setView(nextView);
    window.setTimeout(() => { autoFocusRef.current = false; }, 460);
  }, []);

  useEffect(() => { fitMap(); }, [fitMap]);
  useEffect(() => { if (focusRequest) focusCabin(activeCabinRef.current); }, [focusCabin, focusRequest]);
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport || !window.ResizeObserver) return undefined;
    const observer = new ResizeObserver(() => fitMap());
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [fitMap]);

  const zoomAt = (multiplier, clientX, clientY) => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const rect = viewport.getBoundingClientRect();
    const pointX = clientX ?? rect.left + rect.width / 2;
    const pointY = clientY ?? rect.top + rect.height / 2;
    const scale = Math.min(1.28, Math.max(0.3, view.scale * multiplier));
    const sceneX = (pointX - rect.left - view.x) / view.scale;
    const sceneY = (pointY - rect.top - view.y) / view.scale;
    const nextView = { scale, x: pointX - rect.left - sceneX * scale, y: pointY - rect.top - sceneY * scale };
    setView(nextView);
    syncCabin(nextView);
  };

  const onPointerDown = (event) => {
    if (event.button !== 0 || event.target.closest(".booking-seat")) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { x: event.clientX, y: event.clientY, view, moved: false };
  };
  const onPointerMove = (event) => {
    if (!dragRef.current) return;
    const start = dragRef.current;
    if (!start.moved && Math.abs(event.clientX - start.x) + Math.abs(event.clientY - start.y) > 4) { start.moved = true; setDragging(true); }
    if (!start.moved) return;
    const nextView = { ...start.view, x: start.view.x + event.clientX - start.x, y: start.view.y + event.clientY - start.y };
    setView(nextView);
    syncCabin(nextView);
  };
  const stopDragging = () => { dragRef.current = null; setDragging(false); };

  return <div className="seat-map-stage">
    <div className="seat-map-viewport" ref={viewportRef} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={stopDragging} onPointerCancel={stopDragging} onWheel={(event) => { event.preventDefault(); zoomAt(event.deltaY < 0 ? 1.12 : 0.89, event.clientX, event.clientY); }}>
      <div className={`seat-map-scene ${dragging ? "dragging" : ""}`} style={{ "--fuselage-width": `${fuselageWidth}px`, width: 1024, height: sceneHeight, transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})` }}>
        <img src={aircraftTop} alt="Máy bay nhìn từ trên xuống" className="seat-map-aircraft" draggable="false" />
        {[{ ...first, fare: "first", top: 154, height: firstHeight }, { ...business, fare: "business", top: businessTop, height: businessHeight }, { ...economy, fare: "economy", top: economyTop, height: economyHeight }].map((cabin) => <section key={cabin.fare} ref={(element) => { cabinRefs.current[cabin.fare] = element; }} className={`seat-map-cabin ${cabin.fare}`} style={{ top: cabin.top, minHeight: cabin.height, width: fuselageWidth - 52 }}>
          <header><span>{cabin.fare === "first" ? "FIRST" : cabin.fare.toUpperCase()}</span></header>
          {cabin.rows.length ? cabin.rows.map(({ row, seats }) => <SeatRow key={row} row={row} seats={seats} selectedIds={selectedIds} paymentStarted={paymentStarted} onChoose={onChoose} />) : <p className="seat-map-empty">Chưa có ghế</p>}
        </section>)}
      </div>
    </div>
    <div className="seat-map-hint"><Icon>pan_tool</Icon><span>Kéo để di chuyển</span><span>Cuộn để phóng to/thu nhỏ</span></div>
    <div className="seat-map-controls" aria-label="Điều khiển sơ đồ ghế"><button onClick={() => zoomAt(1.15)} aria-label="Phóng to"><Icon>add</Icon></button><button onClick={() => zoomAt(0.87)} aria-label="Thu nhỏ"><Icon>remove</Icon></button><button onClick={fitMap} aria-label="Hiển thị toàn bộ máy bay"><Icon>fit_screen</Icon></button></div>
  </div>;
}

function SeatRow({ row, seats, selectedIds, paymentStarted, onChoose }) {
  const split = Math.ceil(seats.length / 2);
  return <div className="booking-seat-row"><div className="booking-seat-block">{seats.slice(0, split).map((seat) => <Seat key={seat.maGheChuyenBay} seat={seat} selected={selectedIds.includes(seat.maGheChuyenBay)} paymentStarted={paymentStarted} onChoose={onChoose} />)}</div><b>{row}</b><div className="booking-seat-block">{seats.slice(split).map((seat) => <Seat key={seat.maGheChuyenBay} seat={seat} selected={selectedIds.includes(seat.maGheChuyenBay)} paymentStarted={paymentStarted} onChoose={onChoose} />)}</div></div>;
}

function EconomySeatIcon() {
  return (
    <svg className="aircraft-seat-icon aircraft-seat-icon--economy" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <rect className="aircraft-seat-icon__back" x="7" y="3.5" width="10" height="8.5" rx="2.7" />
      <rect className="aircraft-seat-icon__cushion" x="6" y="11" width="12" height="6.6" rx="2.5" />
      <path className="aircraft-seat-icon__arm" d="M6.2 11.8H5.3c-1 0-1.8.8-1.8 1.8v2.8c0 1 .8 1.8 1.8 1.8h1.2" />
      <path className="aircraft-seat-icon__arm" d="M17.8 11.8h.9c1 0 1.8.8 1.8 1.8v2.8c0 1-.8 1.8-1.8 1.8h-1.2" />
      <path className="aircraft-seat-icon__base" d="M8 20h8" />
    </svg>
  );
}

function BusinessSeatIcon() {
  return (
    <svg className="aircraft-seat-icon aircraft-seat-icon--business" viewBox="0 0 28 28" aria-hidden="true" focusable="false">
      <path className="premium-seat__shell" d="M5.2 8.2C5.2 5.3 7.5 3 10.4 3h7.2c2.9 0 5.2 2.3 5.2 5.2v10.9c0 2.7-2.2 4.9-4.9 4.9H10.1a4.9 4.9 0 0 1-4.9-4.9V8.2Z" />
      <path className="premium-seat__wing" d="M7.3 8.1 5 6.9M20.7 8.1 23 6.9" />
      <rect className="premium-seat__headrest" x="9" y="5.2" width="10" height="5.8" rx="2.8" />
      <rect className="premium-seat__back" x="8.2" y="9.5" width="11.6" height="8.1" rx="3.3" />
      <rect className="premium-seat__cushion" x="7.4" y="16.1" width="13.2" height="5.2" rx="2.6" />
      <path className="premium-seat__arm" d="M7.7 13.1H6.4c-1 0-1.8.8-1.8 1.8v5M20.3 13.1h1.3c1 0 1.8.8 1.8 1.8v5" />
      <path className="premium-seat__footrest" d="M10.1 23.1h7.8" />
    </svg>
  );
}

function FirstSeatIcon() {
  return (
    <svg className="aircraft-seat-icon aircraft-seat-icon--first" viewBox="0 0 30 30" aria-hidden="true" focusable="false">
      <path className="first-seat__pod" d="M4.2 7.9C4.2 4.7 6.8 2.2 10 2.2h10c3.2 0 5.8 2.5 5.8 5.7v14.2c0 3.2-2.6 5.7-5.8 5.7H10c-3.2 0-5.8-2.5-5.8-5.7V7.9Z" />
      <path className="first-seat__console" d="M5.1 10.1H2.8v10.1h2.3M24.9 10.1h2.3v10.1h-2.3" />
      <path className="first-seat__accent" d="M8 5.5h14" />
      <rect className="first-seat__headrest" x="9.5" y="5.7" width="11" height="5.8" rx="2.9" />
      <rect className="first-seat__back" x="8.6" y="10" width="12.8" height="8.5" rx="3.8" />
      <rect className="first-seat__cushion" x="7.8" y="17" width="14.4" height="5.5" rx="2.8" />
      <path className="first-seat__arm" d="M8.1 14H6.7v7.2M21.9 14h1.4v7.2" />
      <rect className="first-seat__ottoman" x="10.4" y="24" width="9.2" height="2.4" rx="1.2" />
    </svg>
  );
}

function SeatIcon({ fare }) {
  if (fare === "first") return <FirstSeatIcon />;
  if (fare === "business") return <BusinessSeatIcon />;
  return <EconomySeatIcon />;
}

function Seat({ seat, selected, paymentStarted, onChoose }) {
  const seatStatus = String(seat.trangThai).toLowerCase();
  const sold = seatStatus === "sold" || seatStatus === "booked" || seatStatus === "reserved";
  const heldByThisSession = seatStatus === "held" && seat.laGheCuaToi;
  const paying = (seatStatus === "held" && !heldByThisSession) || (paymentStarted && selected);
  const status = sold ? "sold" : paying ? "paying" : selected ? "selected" : "available";
  const fare = normalizeFare(seat.tenHangGhe);

  return (
    <button
      type="button"
      className={`booking-seat aircraft-seat-button fare-${fare} ${status}`}
      disabled={paymentStarted || sold || paying}
      onPointerDown={(event) => event.stopPropagation()}
      onClick={() => onChoose(seat)}
      aria-label={`Ghế ${seat.soGhe}, ${status}`}
      title={`Ghế ${seat.soGhe}`}
    >
      <SeatIcon fare={fare} />
      <small>{seat.soGhe}</small>
    </button>
  );
}

function ServiceModal({ modal, service, onClose, onChoose }) {
  const passengerLabel = `Hành khách ${modal.passenger + 1}`;
  const isBaggage = modal.type === "baggage";
  const options = isBaggage ? BAGGAGE_OPTIONS : PROTECTION_OPTIONS;
  return <div className="booking-modal-backdrop" role="presentation" onMouseDown={onClose}><section className="booking-modal" role="dialog" aria-modal="true" aria-label={isBaggage ? "Chọn hành lý ký gửi" : "Chọn gói bảo vệ chuyến đi"} onMouseDown={(event) => event.stopPropagation()}><button className="booking-modal-close" onClick={onClose} aria-label="Đóng"><Icon>close</Icon></button><div className="booking-modal-icon"><Icon>{isBaggage ? "luggage" : "shield"}</Icon></div><p>{passengerLabel.toUpperCase()}</p><h2>{isBaggage ? "Hành lý ký gửi" : "Bảo vệ chuyến đi"}</h2><div className="booking-modal-rules">{isBaggage ? <><strong>Quy định hành lý</strong><span>Hành lý xách tay: tối đa 7kg. Mỗi kiện ký gửi tối đa 32kg, tổng kích thước không vượt 158cm.</span></> : <><strong>Điều khoản gói bảo vệ</strong><span>Quyền lợi và điều kiện đổi/hoàn được hiển thị trước khi thanh toán. Phí áp dụng theo từng hành khách.</span></>}</div><div className="booking-option-list">{options.map((option) => {
    const active = isBaggage ? service.baggage.kg === option.kg : service.protection === option.id;
    return <button className={active ? "active" : ""} key={isBaggage ? option.kg : option.id} onClick={() => onChoose(modal.passenger, isBaggage ? { baggage: { kg: option.kg, price: option.price } } : { protection: option.id })}><span><strong>{isBaggage ? option.label : option.name}</strong><small>{isBaggage ? option.kg ? "Áp dụng cho toàn hành trình" : "Chỉ gồm hành lý xách tay" : option.description}</small></span><b>{money(option.price)}</b><Icon>{active ? "check_circle" : "radio_button_unchecked"}</Icon></button>;
  })}</div></section></div>;
}

function createServiceState(count) { return Array.from({ length: count }, () => ({ baggage: { kg: 0, price: 0 }, protection: "none" })); }
function normalizeAssignments(assignments, count) { return Array.from({ length: count }, (_, index) => assignments[index] || null); }
function normalizeServices(services, count) { return Array.from({ length: count }, (_, index) => services[index] || { baggage: { kg: 0, price: 0 }, protection: "none" }); }
function protection(id) { return PROTECTION_OPTIONS.find((option) => option.id === id) || PROTECTION_OPTIONS[0]; }
