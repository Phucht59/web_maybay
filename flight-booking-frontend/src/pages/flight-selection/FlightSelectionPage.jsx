import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { authService } from "../../services/authService";
import { publicFlightService } from "../../services/publicFlightService";
import "../../styles/pages/flight-selection.css";

const TRIP_TYPES = [
  { key: "oneway", label: "Một chiều" },
  { key: "roundtrip", label: "Khứ hồi" },
];

const FARE_TYPES = [
  { key: "economy", label: "Economy" },
  { key: "business", label: "Business" },
  { key: "first class", label: "First Class" },
];

const FLIGHTS_PER_PAGE = 15;
const DATE_RAIL_DAYS = 21;
const DATE_RAIL_LEADING_DAYS = 5;

function MaterialIcon({ name, fill = false }) {
  return (
    <span
      className="material-symbols-outlined"
      style={{
        fontVariationSettings: `'FILL' ${fill ? 1 : 0}, 'wght' 400, 'GRAD' 0, 'opsz' 24`,
      }}
      aria-hidden="true"
    >
      {name}
    </span>
  );
}

function toIsoDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(value, days) {
  const date = new Date(`${value}T00:00:00`);
  date.setDate(date.getDate() + days);
  return toIsoDate(date);
}

function getTodayIsoDate() {
  return toIsoDate(new Date());
}

function normalizeDepartureDate(value, today) {
  if (!value) return "";
  return value < today ? today : value;
}

function getMinimumReturnDate(departureDate) {
  return departureDate ? addDays(departureDate, 1) : "";
}

function normalizeReturnDate(value, departureDate) {
  const minimum = getMinimumReturnDate(departureDate);
  if (!minimum) return value || "";
  if (!value || value < minimum) return minimum;
  return value;
}

function getRailStartDate(focusDate, today) {
  if (!focusDate || focusDate < today) return today;
  const candidate = addDays(focusDate, -DATE_RAIL_LEADING_DAYS);
  return candidate < today ? today : candidate;
}

function isDateInsideRail(date, railStartDate) {
  if (!date || !railStartDate) return false;
  const railEndDate = addDays(railStartDate, DATE_RAIL_DAYS - 1);
  return date >= railStartDate && date <= railEndDate;
}

function formatHeaderDate(value) {
  if (!value) return "Chọn ngày";
  return new Date(`${value}T00:00:00`).toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatShortDate(value) {
  if (!value) return "";
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
  });
}

function formatReturnDate(value) {
  if (!value) return "Chọn ngày về";
  return new Date(`${value}T00:00:00`).toLocaleDateString("vi-VN", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatCalendarTitle(value, emptyLabel) {
  if (!value) return emptyLabel;
  return new Date(`${value}T00:00:00`).toLocaleDateString("vi-VN", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function getMonthStart(value) {
  const base = value ? new Date(`${value}T00:00:00`) : new Date();
  return new Date(base.getFullYear(), base.getMonth(), 1);
}

function addMonths(date, amount) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function buildMonthDays(monthDate) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const mondayOffset = (firstDay.getDay() + 6) % 7;
  const days = [];

  for (let i = 0; i < mondayOffset; i += 1) days.push(null);
  for (let day = 1; day <= lastDay.getDate(); day += 1) {
    days.push(toIsoDate(new Date(year, month, day)));
  }
  while (days.length % 7 !== 0) days.push(null);
  return days;
}

function formatTime(value) {
  if (!value) return "";
  return new Date(value).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatFlightDateTime(value) {
  if (!value) return "";
  return new Date(value).toLocaleString("vi-VN", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}


function formatCompactPrice(number) {
  const value = Number(number || 0);
  if (!value) return "--";
  return `${new Intl.NumberFormat("vi-VN").format(Math.round(value / 1000))}k`;
}

function getDuration(start, end) {
  if (!start || !end) return "";
  const diff = new Date(end) - new Date(start);
  if (diff <= 0) return "";
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  return `${hours}h ${minutes}m`;
}

function normalizeSeatLabel(value) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();

  if (["economy", "phổ thông", "pho thong"].includes(normalized)) return "Economy";
  if (["premium", "phổ thông đặc biệt", "pho thong dac biet"].includes(normalized)) return "Premium";
  if (["business", "thương gia", "thuong gia"].includes(normalized)) return "Business";
  if (["first class", "first", "hạng nhất", "hang nhat"].includes(normalized)) return "First Class";
  return value || "Fare";
}

function getSeatClasses(flight) {
  return Array.isArray(flight.hangGhe)
    ? [...flight.hangGhe]
        .sort((a, b) => Number(a.heSo || 0) - Number(b.heSo || 0))
        .map((fare) => {
          const label = normalizeSeatLabel(fare.ten);
          return {
            key: label.toLowerCase(),
            label,
            price: Number(fare.gia || 0),
          };
        })
    : [];
}

function getLowestPrice(flight) {
  const prices = getSeatClasses(flight).map((item) => item.price).filter(Boolean);
  return prices.length ? Math.min(...prices) : Number(flight.giaCoBan || 0);
}

function isFlightPurchasable(flight) {
  const departureTime = new Date(flight?.gioKhoiHanh).getTime();
  const hasAvailableSeats = Number(flight?.gheConTrong || 0) > 0;
  const hasAvailableFare = getSeatClasses(flight).some((item) => item.price > 0);

  return Number.isFinite(departureTime) && departureTime > Date.now() && hasAvailableSeats && hasAvailableFare;
}

function getPurchasableFlights(data) {
  const flights = Array.isArray(data?.flights) ? data.flights : [];
  return flights.filter(isFlightPurchasable);
}

function getAllSeatLabels(flights) {
  return [...new Set(flights.flatMap((flight) => getSeatClasses(flight).map((item) => item.label)))];
}


function matchesSeatClassFilter(flight, selectedSeatClasses) {
  if (!selectedSeatClasses.length) return true;
  const labels = getSeatClasses(flight).map((item) => item.label);
  return selectedSeatClasses.some((label) => labels.includes(label));
}

function EmptyState({ title, subtitle, error = false }) {
  return (
    <div className={`flight-selection-empty-state${error ? " is-error" : ""}`}>
      <div className="flight-selection-empty-state-icon">
        <MaterialIcon name={error ? "warning" : "travel"} fill={!error} />
      </div>
      <strong>{title}</strong>
      {subtitle ? <p>{subtitle}</p> : null}
    </div>
  );
}

function FlightListSection({
  title,
  flights,
  totalCount,
  loading,
  error,
  emptyMessage,
  onSelectFlight,
}) {
  return (
    <section className="flight-selection-section">
      <div className="flight-selection-section-header">
        <h3>{title}</h3>
        <span>{totalCount ?? flights.length} chuyến bay</span>
      </div>

      {loading && (
        <EmptyState title="Đang tìm chuyến bay..." subtitle="Hệ thống đang tải danh sách phù hợp với hành trình bạn chọn." />
      )}

      {!loading && error && (
        <EmptyState title={error} subtitle="Vui lòng thử lại sau hoặc đổi điều kiện tìm kiếm." error />
      )}

      {!loading && !error && flights.length === 0 && (
        <EmptyState
          title="Không có chuyến bay nào phù hợp cho ngày này."
          subtitle={emptyMessage}
        />
      )}

      {!loading &&
        !error &&
        flights.map((flight) => {
          const seatClasses = getSeatClasses(flight);
          const fareSlots = FARE_TYPES.map((fareType) => ({
            ...fareType,
            fare: seatClasses.find((seatClass) => seatClass.key === fareType.key) || null,
          }));
          const soldOut = Number(flight.gheConTrong || 0) <= 0;
          const delayed = String(flight.trangThai || "").toLowerCase().includes("delay");

          return (
            <article key={flight.maChuyenBay} className="flight-selection-card flight-selection-flight-card">
              <div className="flight-selection-flight-main">
                <div className="flight-selection-flight-top">
                  <div className="flight-selection-flight-title">
                    <div className="flight-selection-flight-icon">
                      <MaterialIcon name="flight" />
                    </div>
                    <div>
                      <strong>{flight.soHieuChuyenBay || flight.maChuyenBay}</strong>
                      <span>{flight.dongMayBay || "Aircraft not specified"}</span>
                      <small>{flight.hangBay}</small>
                      <small>{formatFlightDateTime(flight.gioKhoiHanh)}</small>
                    </div>
                  </div>
                  <span
                    className={`flight-selection-status${delayed ? " is-delayed" : ""}${
                      soldOut ? " is-sold-out" : ""
                    }`}
                  >
                    {soldOut ? "Sold Out" : flight.trangThai || "Scheduled"}
                  </span>

                  <div className="flight-selection-flight-meta">
                    <span>Còn {flight.gheConTrong ?? 0} ghế</span>
                  </div>
                </div>

                <div className="flight-selection-route-row">
                  <div className="flight-selection-time-block">
                    <strong>{formatTime(flight.gioKhoiHanh)}</strong>
                    <span>{flight.maSanBayDi}</span>
                    <small>{flight.thanhPhoDi}</small>
                  </div>

                  <div className="flight-selection-route-line">
                    <div className="flight-selection-route-dash" />
                    <div className="flight-selection-route-plane">
                      <MaterialIcon name="flight_takeoff" fill />
                    </div>
                    <div className="flight-selection-route-dash" />
                    <p>{getDuration(flight.gioKhoiHanh, flight.gioHaCanh)} · Non-stop</p>
                  </div>

                  <div className="flight-selection-time-block">
                    <strong>{formatTime(flight.gioHaCanh)}</strong>
                    <span>{flight.maSanBayDen}</span>
                    <small>{flight.thanhPhoDen}</small>
                  </div>
                </div>

              </div>

              <div className="flight-selection-fares cols-3">
                {fareSlots.map(({ key, label, fare }) => {
                  const unavailable = !fare;
                  const disabled = unavailable || soldOut;
                  const featured = key === "business";

                  return (
                    <button
                      key={`${flight.maChuyenBay}-${key}`}
                      type="button"
                      className={`flight-selection-fare-card${featured ? " is-featured" : ""}${
                        disabled ? " is-disabled" : ""
                      }${
                        unavailable ? " is-unavailable" : ""
                      }`}
                      onClick={() => !disabled && onSelectFlight(flight, key)}
                      disabled={disabled}
                      aria-label={unavailable ? `${label}: Không có loại vé này` : undefined}
                    >
                      <span className="flight-selection-fare-label">{label}</span>
                      {unavailable ? (
                        <>
                          <span className="flight-selection-fare-unavailable-icon" aria-hidden="true">×</span>
                          <small>Không có loại vé này</small>
                          <em>Không khả dụng</em>
                        </>
                      ) : (
                        <>
                          <strong>{soldOut ? "Sold Out" : formatCompactPrice(fare.price)}</strong>
                          <small>{soldOut ? "No seats remaining" : "VND / person"}</small>
                          <em>{soldOut ? "N/A" : "Select"}</em>
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
            </article>
          );
        })}
    </section>
  );
}

export default function FlightSelectionPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const fromCode = searchParams.get("from") || "";
  const toCode = searchParams.get("to") || "";
  const dateParam = searchParams.get("date") || "";
  const currentUser = authService.getCurrentUser();
  const today = useMemo(() => getTodayIsoDate(), []);
  const initialSelectedDate = normalizeDepartureDate(dateParam, today);

  const [tripType, setTripType] = useState(searchParams.get("tripType") || "oneway");
  const [selectedDate, setSelectedDate] = useState(initialSelectedDate);
  const [returnDate, setReturnDate] = useState(() => {
    const requestedReturnDate =
      searchParams.get("returnDate") || (initialSelectedDate ? addDays(initialSelectedDate, 3) : "");
    return normalizeReturnDate(requestedReturnDate, initialSelectedDate);
  });

  const [outboundFlights, setOutboundFlights] = useState([]);
  const [returnFlights, setReturnFlights] = useState([]);
  const [outboundLoading, setOutboundLoading] = useState(true);
  const [returnLoading, setReturnLoading] = useState(false);
  const [outboundError, setOutboundError] = useState("");
  const [returnError, setReturnError] = useState("");

  const [calendarFlights, setCalendarFlights] = useState([]);
  const [returnCalendarFlights, setReturnCalendarFlights] = useState([]);
  const [returnCalendarLoading, setReturnCalendarLoading] = useState(false);
  const [departureCalendarMonth, setDepartureCalendarMonth] = useState(() =>
    getMonthStart(initialSelectedDate || today)
  );
  const [returnCalendarMonth, setReturnCalendarMonth] = useState(() =>
    getMonthStart(initialSelectedDate ? addDays(initialSelectedDate, 1) : today)
  );
  const [departureCalendarOpen, setDepartureCalendarOpen] = useState(false);
  const [returnCalendarOpen, setReturnCalendarOpen] = useState(false);
  const [selectedAirlines, setSelectedAirlines] = useState([]);
  const [selectedSeatClasses, setSelectedSeatClasses] = useState([]);
  const [sortOrder, setSortOrder] = useState("default");
  const [currentPage, setCurrentPage] = useState(1);
  const [railStartDate, setRailStartDate] = useState(() =>
    getRailStartDate(initialSelectedDate || today, today)
  );
  const [isRailDragging, setIsRailDragging] = useState(false);

  const dateRailRef = useRef(null);
  const dateChipRefs = useRef(new Map());
  const pendingCenterDateRef = useRef(initialSelectedDate || "");
  const suppressRailClickRef = useRef(false);
  const railDragRef = useRef({
    active: false,
    pointerId: null,
    startX: 0,
    scrollLeft: 0,
    moved: false,
  });
  const hasUserInteractedWithRailRef = useRef(false);
  const initialRailCenteredRef = useRef(false);

  useEffect(() => {
    const nextSelectedDate = normalizeDepartureDate(dateParam, today);
    setSelectedDate(nextSelectedDate);

    if (nextSelectedDate) {
      if (!isDateInsideRail(nextSelectedDate, railStartDate)) {
        setRailStartDate(getRailStartDate(nextSelectedDate, today));
      }
      pendingCenterDateRef.current = nextSelectedDate;
    }
  }, [dateParam, railStartDate, today]);

  useEffect(() => {
    const nextTripType = searchParams.get("tripType") || "oneway";
    const safeDepartureDate = normalizeDepartureDate(dateParam, today);
    const requestedReturnDate =
      searchParams.get("returnDate") || (safeDepartureDate ? addDays(safeDepartureDate, 3) : "");

    setTripType(nextTripType);
    setReturnDate(normalizeReturnDate(requestedReturnDate, safeDepartureDate));
  }, [searchParams, dateParam, today]);

  useEffect(() => {
    setSelectedAirlines([]);
    setSelectedSeatClasses([]);
    setSortOrder("default");
    setCurrentPage(1);
    setRailStartDate(getRailStartDate(selectedDate || today, today));
    initialRailCenteredRef.current = false;
    hasUserInteractedWithRailRef.current = false;
    if (selectedDate) pendingCenterDateRef.current = selectedDate;
  }, [fromCode, toCode]);

  useEffect(() => {
    let active = true;

    publicFlightService
      .searchFlights({
        maSanBayDi: fromCode || undefined,
        maSanBayDen: toCode || undefined,
        ngayDi: undefined,
      })
      .then((data) => {
        if (!active) return;
        setCalendarFlights(getPurchasableFlights(data));
      })
      .catch(() => {
        if (active) setCalendarFlights([]);
      });

    return () => {
      active = false;
    };
  }, [fromCode, toCode]);

  useEffect(() => {
    if (tripType !== "roundtrip" || !fromCode || !toCode) {
      setReturnCalendarFlights([]);
      setReturnCalendarLoading(false);
      return;
    }

    let active = true;
    setReturnCalendarLoading(true);

    publicFlightService
      .searchFlights({
        maSanBayDi: toCode,
        maSanBayDen: fromCode,
        ngayDi: undefined,
      })
      .then((data) => {
        if (!active) return;
        setReturnCalendarFlights(getPurchasableFlights(data));
      })
      .catch(() => {
        if (active) setReturnCalendarFlights([]);
      })
      .finally(() => {
        if (active) setReturnCalendarLoading(false);
      });

    return () => {
      active = false;
    };
  }, [tripType, fromCode, toCode]);

  useEffect(() => {
    let active = true;
    setOutboundLoading(true);
    setOutboundError("");

    publicFlightService
      .searchFlights({
        maSanBayDi: fromCode || undefined,
        maSanBayDen: toCode || undefined,
        ngayDi: selectedDate || undefined,
      })
      .then((data) => {
        if (!active) return;
        const purchasableFlights = getPurchasableFlights(data);
        setOutboundFlights(
          selectedDate
            ? purchasableFlights.filter((flight) => toIsoDate(flight.gioKhoiHanh) === selectedDate)
            : purchasableFlights
        );
      })
      .catch((requestError) => {
        if (!active) return;
        setOutboundFlights([]);
        setOutboundError(requestError?.response?.data?.message || "Không thể tải danh sách chuyến bay.");
      })
      .finally(() => {
        if (active) setOutboundLoading(false);
      });

    return () => {
      active = false;
    };
  }, [fromCode, toCode, selectedDate]);

  useEffect(() => {
    const minimumReturnDate = getMinimumReturnDate(selectedDate);
    const safeReturnDate = normalizeReturnDate(returnDate, selectedDate);

    if (tripType !== "roundtrip" || !fromCode || !toCode || !safeReturnDate || !minimumReturnDate) {
      setReturnFlights([]);
      setReturnError("");
      setReturnLoading(false);
      return;
    }

    let active = true;
    setReturnLoading(true);
    setReturnError("");

    publicFlightService
      .searchFlights({
        maSanBayDi: toCode,
        maSanBayDen: fromCode,
        ngayDi: safeReturnDate,
      })
      .then((data) => {
        if (!active) return;
        setReturnFlights(getPurchasableFlights(data));
      })
      .catch((requestError) => {
        if (!active) return;
        setReturnFlights([]);
        setReturnError(requestError?.response?.data?.message || "Không thể tải danh sách chuyến bay về.");
      })
      .finally(() => {
        if (active) setReturnLoading(false);
      });

    return () => {
      active = false;
    };
  }, [tripType, fromCode, toCode, selectedDate, returnDate]);

  const datePrices = useMemo(() => {
    return calendarFlights.reduce((accumulator, flight) => {
      const dateKey = toIsoDate(flight.gioKhoiHanh);
      if (!dateKey || dateKey < today) return accumulator;

      if (!accumulator[dateKey]) {
        accumulator[dateKey] = { count: 0, minPrice: 0 };
      }

      const lowestPrice = getLowestPrice(flight);
      accumulator[dateKey].count += 1;
      accumulator[dateKey].minPrice =
        accumulator[dateKey].minPrice === 0
          ? lowestPrice
          : Math.min(accumulator[dateKey].minPrice, lowestPrice);

      return accumulator;
    }, {});
  }, [calendarFlights, today]);

  const departureAvailableDates = useMemo(
    () =>
      new Set(
        Object.keys(datePrices)
          .filter((date) => date >= today && Number(datePrices[date]?.count || 0) > 0)
      ),
    [datePrices, today]
  );

  const sortedDepartureAvailableDates = useMemo(
    () => [...departureAvailableDates].sort(),
    [departureAvailableDates]
  );

  const returnAvailableDates = useMemo(() => {
    const minimumReturnDate = getMinimumReturnDate(selectedDate);
    const dates = new Set();

    returnCalendarFlights.forEach((flight) => {
      const date = toIsoDate(flight.gioKhoiHanh);
      if (!date) return;

      if (!minimumReturnDate || date >= minimumReturnDate) {
        dates.add(date);
      }
    });

    return dates;
  }, [returnCalendarFlights, selectedDate]);

  const sortedReturnAvailableDates = useMemo(
    () => [...returnAvailableDates].sort(),
    [returnAvailableDates]
  );

  useEffect(() => {
    if (tripType !== "roundtrip" || selectedDate || sortedDepartureAvailableDates.length === 0) return;

    const firstDepartureDate = sortedDepartureAvailableDates[0];
    setSelectedDate(firstDepartureDate);
    setDepartureCalendarMonth(getMonthStart(firstDepartureDate));
    pendingCenterDateRef.current = firstDepartureDate;

    updateSearchParams({
      date: firstDepartureDate,
      tripType: "roundtrip",
    });
  }, [tripType, selectedDate, sortedDepartureAvailableDates]);

  useEffect(() => {
    if (tripType !== "roundtrip" || !selectedDate || returnCalendarLoading) return;

    const firstAvailableDate = sortedReturnAvailableDates[0] || "";

    if (!firstAvailableDate) {
      if (returnDate) setReturnDate("");
      return;
    }

    if (!returnAvailableDates.has(returnDate)) {
      setReturnDate(firstAvailableDate);
      setReturnCalendarMonth(getMonthStart(firstAvailableDate));
    }
  }, [
    tripType,
    selectedDate,
    returnCalendarLoading,
    sortedReturnAvailableDates,
    returnAvailableDates,
    returnDate,
  ]);


  const allFlights = useMemo(
    () => [...outboundFlights, ...(tripType === "roundtrip" ? returnFlights : [])],
    [outboundFlights, returnFlights, tripType]
  );

  const airlines = useMemo(
    () => [...new Set(allFlights.map((flight) => flight.hangBay).filter(Boolean))],
    [allFlights]
  );
  const seatLabels = useMemo(() => getAllSeatLabels(allFlights), [allFlights]);

  const applyFilters = (flights) =>
    flights.filter((flight) => {
      const airlineMatched = !selectedAirlines.length || selectedAirlines.includes(flight.hangBay);
      const seatMatched = matchesSeatClassFilter(flight, selectedSeatClasses);
      return airlineMatched && seatMatched;
    });

  const sortFlights = (flights) => {
    const sortedFlights = [...flights];

    if (sortOrder === "price-asc") {
      sortedFlights.sort((left, right) => getLowestPrice(left) - getLowestPrice(right));
    } else if (sortOrder === "price-desc") {
      sortedFlights.sort((left, right) => getLowestPrice(right) - getLowestPrice(left));
    }

    return sortedFlights;
  };

  const filteredOutboundFlights = sortFlights(applyFilters(outboundFlights));
  const filteredReturnFlights = sortFlights(applyFilters(returnFlights));
  const totalFlightsFound = filteredOutboundFlights.length + (tripType === "roundtrip" ? filteredReturnFlights.length : 0);
  const totalOutboundPages = Math.max(1, Math.ceil(filteredOutboundFlights.length / FLIGHTS_PER_PAGE));
  const paginatedOutboundFlights = filteredOutboundFlights.slice(
    (currentPage - 1) * FLIGHTS_PER_PAGE,
    currentPage * FLIGHTS_PER_PAGE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [fromCode, toCode, selectedDate, selectedAirlines, selectedSeatClasses, sortOrder]);

  useEffect(() => {
    if (currentPage > totalOutboundPages) setCurrentPage(totalOutboundPages);
  }, [currentPage, totalOutboundPages]);

  const dateOptions = useMemo(
    () =>
      Array.from({ length: DATE_RAIL_DAYS }, (_, index) => {
        const date = addDays(railStartDate, index);
        return {
          date,
          label: formatShortDate(date),
          ...datePrices[date],
        };
      }),
    [railStartDate, datePrices]
  );

  const centerDateInRail = useCallback((date, behavior = "smooth") => {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        const rail = dateRailRef.current;
        const chip = dateChipRefs.current.get(date);
        if (!rail || !chip) return;

        const railRect = rail.getBoundingClientRect();
        const chipRect = chip.getBoundingClientRect();
        const targetLeft =
          rail.scrollLeft +
          (chipRect.left - railRect.left) -
          (rail.clientWidth - chipRect.width) / 2;

        const maximumLeft = Math.max(0, rail.scrollWidth - rail.clientWidth);
        const safeLeft = Math.max(0, Math.min(targetLeft, maximumLeft));

        rail.scrollTo({ left: safeLeft, behavior });
      });
    });
  }, []);

  useEffect(() => {
    const pendingDate = pendingCenterDateRef.current;
    if (!pendingDate || !dateOptions.some((option) => option.date === pendingDate)) return;

    centerDateInRail(pendingDate);
    pendingCenterDateRef.current = "";
  }, [dateOptions, centerDateInRail]);

  useEffect(() => {
    if (
      initialRailCenteredRef.current ||
      hasUserInteractedWithRailRef.current ||
      selectedDate ||
      calendarFlights.length === 0
    ) {
      return;
    }

    const firstAvailableDate = Object.keys(datePrices)
      .filter((date) => date >= today)
      .sort()[0];

    if (!firstAvailableDate) return;

    if (!isDateInsideRail(firstAvailableDate, railStartDate)) {
      setRailStartDate(getRailStartDate(firstAvailableDate, today));
      return;
    }

    const timer = window.setTimeout(() => {
      if (hasUserInteractedWithRailRef.current) return;
      centerDateInRail(firstAvailableDate, "auto");
      initialRailCenteredRef.current = true;
    }, 80);

    return () => window.clearTimeout(timer);
  }, [
    calendarFlights,
    datePrices,
    selectedDate,
    railStartDate,
    today,
    centerDateInRail,
  ]);

  const toggleAirline = (airline) => {
    setSelectedAirlines((current) =>
      current.includes(airline) ? current.filter((item) => item !== airline) : [...current, airline]
    );
  };

  const toggleSeatClass = (label) => {
    setSelectedSeatClasses((current) =>
      current.includes(label) ? current.filter((item) => item !== label) : [...current, label]
    );
  };


  const hasActiveFilters = selectedAirlines.length > 0 || selectedSeatClasses.length > 0;

  const clearFilters = () => {
    setSelectedAirlines([]);
    setSelectedSeatClasses([]);
    setCurrentPage(1);
  };

  const changePage = (page) => {
    const nextPage = Math.min(totalOutboundPages, Math.max(1, page));
    setCurrentPage(nextPage);
    window.requestAnimationFrame(() => {
      document.querySelector(".flight-selection-section")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };

  const updateSearchParams = (nextValues) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(nextValues).forEach(([key, value]) => {
      if (value) params.set(key, value);
      else params.delete(key);
    });
    navigate(`/flight-selection?${params.toString()}`);
  };

  const ensureDateVisibleInRail = (date) => {
    if (!date || isDateInsideRail(date, railStartDate)) return;
    setRailStartDate(getRailStartDate(date, today));
  };

  const handleDepartureDateChange = (value) => {
    if (!value) {
      setSelectedDate("");
      updateSearchParams({ date: "" });
      return;
    }

    const nextDate = normalizeDepartureDate(value, today);
    setDepartureCalendarMonth(getMonthStart(nextDate));
    let nextReturnDate = returnDate;

    if (tripType === "roundtrip") {
      nextReturnDate = normalizeReturnDate(returnDate, nextDate);
      setReturnDate(nextReturnDate);
    }

    const alreadyVisibleInRail = isDateInsideRail(nextDate, railStartDate);
    ensureDateVisibleInRail(nextDate);
    pendingCenterDateRef.current = nextDate;
    setSelectedDate(nextDate);

    if (alreadyVisibleInRail) {
      centerDateInRail(nextDate);
      pendingCenterDateRef.current = "";
    }
    updateSearchParams({
      date: nextDate,
      returnDate: tripType === "roundtrip" ? nextReturnDate : "",
    });
  };

  const handleReturnDateChange = (value) => {
    if (!value || !selectedDate || !returnAvailableDates.has(value)) return;
    setReturnDate(value);
    setReturnCalendarMonth(getMonthStart(value));
    updateSearchParams({ returnDate: value });
  };

  const handleTripTypeChange = (nextTripType) => {
    let nextDepartureDate = selectedDate;
    let nextReturnDate = returnDate;

    if (nextTripType === "roundtrip") {
      if (!nextDepartureDate && sortedDepartureAvailableDates.length > 0) {
        nextDepartureDate = sortedDepartureAvailableDates[0];
        setSelectedDate(nextDepartureDate);
        setDepartureCalendarMonth(getMonthStart(nextDepartureDate));
        pendingCenterDateRef.current = nextDepartureDate;
      }

      const minimumReturnDate = getMinimumReturnDate(nextDepartureDate);
      const validReturnDates = returnCalendarFlights
        .map((flight) => toIsoDate(flight.gioKhoiHanh))
        .filter((date) => date && minimumReturnDate && date >= minimumReturnDate)
        .sort();

      nextReturnDate =
        validReturnDates.includes(returnDate)
          ? returnDate
          : validReturnDates[0] || "";

      setReturnDate(nextReturnDate);
      setReturnCalendarMonth(
        getMonthStart(nextReturnDate || minimumReturnDate || today)
      );
    }

    setTripType(nextTripType);
    updateSearchParams({
      tripType: nextTripType,
      date: nextDepartureDate || "",
      returnDate: nextTripType === "roundtrip" ? nextReturnDate : "",
    });
  };

  const handleSelectDate = (date) => {
    if (suppressRailClickRef.current) return;
    handleDepartureDateChange(date);
  };

  const handleRailPointerDown = (event) => {
    if (event.pointerType !== "mouse" || event.button !== 0) return;

    const rail = dateRailRef.current;
    if (!rail) return;

    railDragRef.current = {
      active: true,
      pointerId: event.pointerId,
      startX: event.clientX,
      scrollLeft: rail.scrollLeft,
      moved: false,
      date: event.target.closest(".flight-selection-date-chip")?.dataset?.date || "",
    };

    setIsRailDragging(true);
    rail.setPointerCapture?.(event.pointerId);
  };

  const handleRailPointerMove = (event) => {
    const rail = dateRailRef.current;
    const drag = railDragRef.current;
    if (!rail || !drag.active || drag.pointerId !== event.pointerId) return;

    const deltaX = event.clientX - drag.startX;
    if (Math.abs(deltaX) > 4) {
      drag.moved = true;
      suppressRailClickRef.current = true;
      hasUserInteractedWithRailRef.current = true;
    }

    rail.scrollLeft = drag.scrollLeft - deltaX;
    if (drag.moved) event.preventDefault();
  };

  const finishRailDrag = (event) => {
    const rail = dateRailRef.current;
    const drag = railDragRef.current;
    if (!drag.active || drag.pointerId !== event.pointerId) return;

    const clickedDate = !drag.moved ? drag.date : "";

    if (rail?.hasPointerCapture?.(event.pointerId)) {
      rail.releasePointerCapture(event.pointerId);
    }

    railDragRef.current = {
      active: false,
      pointerId: null,
      startX: 0,
      scrollLeft: rail?.scrollLeft || 0,
      moved: false,
      date: "",
    };

    setIsRailDragging(false);

    if (clickedDate) {
      suppressRailClickRef.current = true;
      handleDepartureDateChange(clickedDate);
    }

    window.setTimeout(() => {
      suppressRailClickRef.current = false;
    }, 0);
  };

  const handleSelectFlight = (flight, seatClass) => {
    const bookingTarget = `/booking/${flight.maChuyenBay}?${new URLSearchParams({
      fare: seatClass || "economy",
      passengers: "1",
    }).toString()}`;

    if (!currentUser) {
      navigate(`/login?redirect=${encodeURIComponent(bookingTarget)}`);
      return;
    }

    navigate(bookingTarget, {
      state: {
        flight,
        selectedSeatClass: seatClass,
        tripType,
        returnDate: tripType === "roundtrip" ? returnDate : null,
      },
    });
  };

  return (
    <div className="flight-selection-page">


      <div className="flight-selection-shell">


        <section className="flight-selection-hero">
          <div className="flight-selection-hero-copy">
            <a
              href="/"
              style={{
                position: "relative",
                zIndex: 9999,
                pointerEvents: "auto",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                margin: "0 0 1rem",
                padding: "0.25rem 0",
                border: 0,
                background: "transparent",
                color: "rgba(255,255,255,0.88)",
                font: "inherit",
                fontSize: "0.9rem",
                fontWeight: 700,
                cursor: "pointer",
                textDecoration: "none",
              }}
            >
              <MaterialIcon name="arrow_back" />
              Quay về trang chủ
            </a>
            <p className="flight-selection-overline">Flight Selection</p>
            <h1>
              {fromCode || toCode ? (
                <>{fromCode || "Tất cả điểm đi"} <span>→</span> {toCode || "Tất cả điểm đến"}</>
              ) : (
                "Tất cả chuyến bay"
              )}
            </h1>
            <p>
              {formatHeaderDate(selectedDate)} | {totalFlightsFound} chuyến bay | 1 Adult |{" "}
              {selectedSeatClasses[0] || "Economy"}
            </p>
          </div>
        </section>

        <main className="flight-selection-content">
          <div className="flight-selection-layout">
            <section className="flight-selection-filters">
              <div className="flight-selection-card flight-selection-filter-card">
                <div className="flight-selection-card-header">
                  <h2>Filter Results</h2>
                  <button
                    type="button"
                    className="flight-selection-clear-filters"
                    onClick={clearFilters}
                    disabled={!hasActiveFilters}
                  >
                    Xóa bộ lọc
                  </button>
                </div>

                <div className="flight-selection-filter-group">
                  <h3>Trip Type</h3>
                  <div className="flight-selection-chip-grid">
                    {TRIP_TYPES.map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        className={`flight-selection-choice-chip${tripType === item.key ? " is-active" : ""}`}
                        onClick={() => handleTripTypeChange(item.key)}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flight-selection-filter-group flight-selection-travel-dates-group">
                  <h3>Travel Dates</h3>

                  <div className={`flight-selection-date-calendars${tripType === "roundtrip" ? " is-roundtrip" : ""}`}>
                    <div className={`flight-selection-date-calendar${departureCalendarOpen ? " is-open" : ""}`}>
                      <button
                        type="button"
                        className="flight-selection-date-calendar-summary"
                        onClick={() => setDepartureCalendarOpen((current) => !current)}
                        aria-expanded={departureCalendarOpen}
                      >
                        <div className="flight-selection-date-calendar-label">
                          <div>
                            <span>Ngày đi</span>
                            <strong>{formatCalendarTitle(selectedDate, "Chọn ngày đi")}</strong>
                          </div>
                          <MaterialIcon name="flight_takeoff" />
                        </div>

                        <MaterialIcon
                          name={departureCalendarOpen ? "keyboard_arrow_up" : "keyboard_arrow_down"}
                        />
                      </button>

                      <div className="flight-selection-date-calendar-collapse">
                        <div className="flight-selection-date-calendar-body">
                          <div className="flight-selection-date-calendar-header">
                            <button
                              type="button"
                              onClick={() => setDepartureCalendarMonth((current) => addMonths(current, -1))}
                              aria-label="Tháng trước"
                            >
                              <MaterialIcon name="chevron_left" />
                            </button>

                            <strong>
                              {departureCalendarMonth.toLocaleDateString("vi-VN", {
                                month: "long",
                                year: "numeric",
                              })}
                            </strong>

                            <button
                              type="button"
                              onClick={() => setDepartureCalendarMonth((current) => addMonths(current, 1))}
                              aria-label="Tháng sau"
                            >
                              <MaterialIcon name="chevron_right" />
                            </button>
                          </div>

                          <div className="flight-selection-date-calendar-weekdays">
                            {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((label) => (
                              <span key={label}>{label}</span>
                            ))}
                          </div>

                          <div className="flight-selection-date-calendar-days">
                            {buildMonthDays(departureCalendarMonth).map((date, index) => {
                              if (!date) {
                                return <span key={`departure-empty-${index}`} className="is-empty" />;
                              }

                              const available = departureAvailableDates.has(date);
                              const active = date === selectedDate;

                              return (
                                <button
                                  key={date}
                                  type="button"
                                  disabled={!available}
                                  className={`${available ? "is-available" : "is-disabled"}${active ? " is-active" : ""}`}
                                  onClick={() => {
                                    if (!available) return;
                                    handleDepartureDateChange(date);
                                    setDepartureCalendarOpen(false);
                                  }}
                                  title={available ? `${datePrices[date]?.count || 0} chuyến bay` : "Không có chuyến bay"}
                                >
                                  <span>{new Date(`${date}T00:00:00`).getDate()}</span>
                                  {available && <small>{datePrices[date]?.count || 0}</small>}
                                </button>
                              );
                            })}
                          </div>

                          <div className="flight-selection-date-calendar-footer">
                            Ngày có chuyến {fromCode || "điểm đi"} → {toCode || "điểm đến"} mới có thể chọn.
                          </div>
                        </div>
                      </div>
                    </div>

                    {tripType === "roundtrip" && (
                      <div className={`flight-selection-date-calendar${returnCalendarOpen ? " is-open" : ""}`}>
                        <button
                          type="button"
                          className="flight-selection-date-calendar-summary"
                          onClick={() => setReturnCalendarOpen((current) => !current)}
                          aria-expanded={returnCalendarOpen}
                        >
                          <div className="flight-selection-date-calendar-label">
                            <div>
                              <span>Ngày về</span>
                              <strong>
                                {returnCalendarLoading
                                  ? "Đang tải..."
                                  : formatCalendarTitle(returnDate, "Chọn ngày về")}
                              </strong>
                            </div>
                            <MaterialIcon name="flight_land" />
                          </div>

                          <MaterialIcon
                            name={returnCalendarOpen ? "keyboard_arrow_up" : "keyboard_arrow_down"}
                          />
                        </button>

                        <div className="flight-selection-date-calendar-collapse">
                          <div className="flight-selection-date-calendar-body">
                            <div className="flight-selection-date-calendar-header">
                              <button
                                type="button"
                                onClick={() => setReturnCalendarMonth((current) => addMonths(current, -1))}
                                aria-label="Tháng trước"
                              >
                                <MaterialIcon name="chevron_left" />
                              </button>

                              <strong>
                                {returnCalendarMonth.toLocaleDateString("vi-VN", {
                                  month: "long",
                                  year: "numeric",
                                })}
                              </strong>

                              <button
                                type="button"
                                onClick={() => setReturnCalendarMonth((current) => addMonths(current, 1))}
                                aria-label="Tháng sau"
                              >
                                <MaterialIcon name="chevron_right" />
                              </button>
                            </div>

                            <div className="flight-selection-date-calendar-weekdays">
                              {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((label) => (
                                <span key={label}>{label}</span>
                              ))}
                            </div>

                            <div className="flight-selection-date-calendar-days">
                              {buildMonthDays(returnCalendarMonth).map((date, index) => {
                                if (!date) {
                                  return <span key={`return-empty-${index}`} className="is-empty" />;
                                }

                                const available =
                                  Boolean(selectedDate) &&
                                  !returnCalendarLoading &&
                                  returnAvailableDates.has(date);
                                const active = date === returnDate;

                                return (
                                  <button
                                    key={date}
                                    type="button"
                                    disabled={!available}
                                    className={`${available ? "is-available" : "is-disabled"}${active ? " is-active" : ""}`}
                                    onClick={() => {
                                      if (!available) return;
                                      handleReturnDateChange(date);
                                      setReturnCalendarOpen(false);
                                    }}
                                    title={
                                      available
                                        ? `Có chuyến ${toCode} → ${fromCode}`
                                        : selectedDate
                                          ? "Không có chuyến về khả dụng"
                                          : "Chọn ngày đi trước"
                                    }
                                  >
                                    <span>{new Date(`${date}T00:00:00`).getDate()}</span>
                                  </button>
                                );
                              })}
                            </div>

                            <div className="flight-selection-date-calendar-footer">
                              {!selectedDate
                                ? "Chọn ngày đi để mở các ngày về hợp lệ."
                                : sortedReturnAvailableDates.length === 0 && !returnCalendarLoading
                                  ? `Không có chuyến ${toCode} → ${fromCode} sau ngày đi.`
                                  : `Chỉ ngày có chuyến ${toCode} → ${fromCode} sau ngày đi mới có thể chọn.`}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flight-selection-filter-group">
                  <h3>Stops</h3>
                  <label className="flight-selection-checkbox">
                    <input type="checkbox" checked readOnly />
                    <span>Non-stop</span>
                  </label>
                  <label className="flight-selection-checkbox is-disabled">
                    <input type="checkbox" disabled />
                    <span>1 Stop</span>
                  </label>
                </div>


                <div className="flight-selection-filter-group">
                  <h3>Seat Class</h3>
                  <div className="flight-selection-airline-list">
                    {seatLabels.length ? (
                      seatLabels.map((label) => (
                        <button
                          key={label}
                          type="button"
                          className={`flight-selection-airline-chip${
                            selectedSeatClasses.includes(label) ? " is-active" : ""
                          }`}
                          onClick={() => toggleSeatClass(label)}
                        >
                          {label}
                        </button>
                      ))
                    ) : (
                      <span className="flight-selection-filter-note">Sẽ hiển thị khi có dữ liệu chuyến bay.</span>
                    )}
                  </div>
                </div>

                <div className="flight-selection-filter-group">
                  <h3>Sắp xếp theo giá</h3>
                  <select
                    value={sortOrder}
                    onChange={(event) => setSortOrder(event.target.value)}
                    style={{
                      width: "100%",
                      border: "1px solid var(--fs-line)",
                      borderRadius: "0.9rem",
                      padding: "0.9rem 1rem",
                      background: "#fff",
                      color: "var(--fs-text)",
                      font: "inherit",
                      cursor: "pointer",
                    }}
                  >
                    <option value="default">Mặc định</option>
                    <option value="price-asc">Giá thấp đến cao</option>
                    <option value="price-desc">Giá cao đến thấp</option>
                  </select>
                </div>

                <div className="flight-selection-filter-group">
                  <h3>Airlines</h3>
                  <div className="flight-selection-airline-list">
                    {airlines.length ? (
                      airlines.map((airline) => (
                        <button
                          key={airline}
                          type="button"
                          className={`flight-selection-airline-chip${
                            selectedAirlines.includes(airline) ? " is-active" : ""
                          }`}
                          onClick={() => toggleAirline(airline)}
                        >
                          {airline}
                        </button>
                      ))
                    ) : (
                      <span className="flight-selection-filter-note">Chưa có hãng bay khả dụng cho hành trình này.</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flight-selection-card flight-selection-promo-card">
                <div className="flight-selection-promo-overlay" />
                <div className="flight-selection-promo-content">
                  <p>Special Offer</p>
                  <h3>Lotusmiles Double Miles</h3>
                  <span>Book business class this month.</span>
                </div>
              </div>
            </section>

            <section className="flight-selection-results">
              <div
                ref={dateRailRef}
                className="flight-selection-date-rail custom-scrollbar"
                onPointerDown={handleRailPointerDown}
                onPointerMove={handleRailPointerMove}
                onPointerUp={finishRailDrag}
                onPointerCancel={finishRailDrag}
                style={{
                  cursor: isRailDragging ? "grabbing" : "grab",
                  userSelect: isRailDragging ? "none" : "auto",
                  touchAction: "pan-x",
                  scrollBehavior: "auto",
                }}
              >
                {dateOptions.map((option) => {
                  const active = option.date === selectedDate;
                  return (
                    <button
                      key={option.date}
                      ref={(node) => {
                        if (node) dateChipRefs.current.set(option.date, node);
                        else dateChipRefs.current.delete(option.date);
                      }}
                      type="button"
                      data-date={option.date}
                      className={`flight-selection-date-chip${active ? " is-active" : ""}`}
                      onClick={() => handleSelectDate(option.date)}
                    >
                      <span>{option.label}</span>
                      <strong>{option.minPrice ? formatCompactPrice(option.minPrice) : "--"}</strong>
                      <small>{option.count ? `${option.count} flights` : "No flights"}</small>
                    </button>
                  );
                })}
              </div>

              <FlightListSection
                title={
                  fromCode || toCode
                    ? `Chuyến đi: ${fromCode || "Tất cả điểm đi"} → ${toCode || "Tất cả điểm đến"}`
                    : "Danh sách tất cả chuyến bay"
                }
                flights={paginatedOutboundFlights}
                totalCount={filteredOutboundFlights.length}
                loading={outboundLoading}
                error={outboundError}
                emptyMessage="Hãy thử đổi ngày bay, hạng ghế hoặc hãng bay để xem thêm lựa chọn."
                onSelectFlight={handleSelectFlight}
              />

              {!outboundLoading && !outboundError && totalOutboundPages > 1 && (
                <nav className="flight-selection-pagination" aria-label="Phân trang chuyến bay">
                  <button
                    type="button"
                    onClick={() => changePage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <MaterialIcon name="chevron_left" />
                    Trước
                  </button>
                  <div className="flight-selection-pagination-pages">
                    {Array.from({ length: totalOutboundPages }, (_, index) => index + 1).map((page) => (
                      <button
                        key={page}
                        type="button"
                        className={page === currentPage ? "is-active" : ""}
                        aria-current={page === currentPage ? "page" : undefined}
                        onClick={() => changePage(page)}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => changePage(currentPage + 1)}
                    disabled={currentPage === totalOutboundPages}
                  >
                    Sau
                    <MaterialIcon name="chevron_right" />
                  </button>
                </nav>
              )}

              {tripType === "roundtrip" && (
                <FlightListSection
                  title={`Chuyến về: ${toCode || "SGN"} → ${fromCode || "HAN"}`}
                  flights={filteredReturnFlights}
                  loading={returnLoading}
                  error={returnError}
                  emptyMessage="Hiện chưa có chuyến về phù hợp. Bạn có thể thay đổi ngày về hoặc bỏ bớt bộ lọc."
                  onSelectFlight={handleSelectFlight}
                />
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}