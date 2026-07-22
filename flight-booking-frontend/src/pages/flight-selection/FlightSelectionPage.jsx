import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { authService } from "../../services/authService";
import { publicFlightService } from "../../services/publicFlightService";
import "../../styles/pages/flight-selection.css";

const DEPARTURE_WINDOWS = [
  { key: "morning", label: "Morning", range: "00:00 - 12:00", start: 0, end: 12 },
  { key: "afternoon", label: "Afternoon", range: "12:00 - 24:00", start: 12, end: 24 },
];

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

function formatCurrency(number) {
  return `${new Intl.NumberFormat("vi-VN").format(Math.round(Number(number || 0)))} VND`;
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

function getAllSeatLabels(flights) {
  return [...new Set(flights.flatMap((flight) => getSeatClasses(flight).map((item) => item.label)))];
}

function getPriceBounds(flights) {
  const prices = flights.map(getLowestPrice).filter((price) => price > 0);
  if (!prices.length) return { min: 0, max: 0 };
  return { min: Math.min(...prices), max: Math.max(...prices) };
}

function matchesDepartureFilter(flight, selectedWindows) {
  if (!selectedWindows.length) return true;
  const hour = new Date(flight.gioKhoiHanh).getHours();
  return selectedWindows.some((key) => {
    const windowOption = DEPARTURE_WINDOWS.find((item) => item.key === key);
    return windowOption ? hour >= windowOption.start && hour < windowOption.end : true;
  });
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

  const [tripType, setTripType] = useState(searchParams.get("tripType") || "oneway");
  const [selectedDate, setSelectedDate] = useState(dateParam);
  const [returnDate, setReturnDate] = useState(
    searchParams.get("returnDate") || (dateParam ? addDays(dateParam, 3) : "")
  );

  const [outboundFlights, setOutboundFlights] = useState([]);
  const [returnFlights, setReturnFlights] = useState([]);
  const [outboundLoading, setOutboundLoading] = useState(true);
  const [returnLoading, setReturnLoading] = useState(false);
  const [outboundError, setOutboundError] = useState("");
  const [returnError, setReturnError] = useState("");
  const [datePrices, setDatePrices] = useState({});

  const [selectedAirlines, setSelectedAirlines] = useState([]);
  const [selectedSeatClasses, setSelectedSeatClasses] = useState([]);
  const [departureFilters, setDepartureFilters] = useState([]);
  const [maxAllowedPrice, setMaxAllowedPrice] = useState(0);
  const [selectedMaxPrice, setSelectedMaxPrice] = useState(0);
  const [isPriceFilterActive, setIsPriceFilterActive] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setSelectedDate(dateParam);
  }, [dateParam]);

  useEffect(() => {
    const nextTripType = searchParams.get("tripType") || "oneway";
    const nextReturnDate =
      searchParams.get("returnDate") || (dateParam ? addDays(dateParam, 3) : "");

    setTripType(nextTripType);
    setReturnDate(nextReturnDate);
  }, [searchParams, dateParam]);

  useEffect(() => {
    setSelectedAirlines([]);
    setSelectedSeatClasses([]);
    setDepartureFilters([]);
    setSelectedMaxPrice(0);
    setIsPriceFilterActive(false);
    setCurrentPage(1);
  }, [fromCode, toCode]);

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
        const flights = Array.isArray(data.flights) ? data.flights : [];
        setOutboundFlights(flights);
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
    if (tripType !== "roundtrip" || !fromCode || !toCode || !returnDate) {
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
        ngayDi: returnDate || undefined,
      })
      .then((data) => {
        if (!active) return;
        setReturnFlights(Array.isArray(data.flights) ? data.flights : []);
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
  }, [tripType, fromCode, toCode, returnDate]);

  useEffect(() => {
    let active = true;
    if (!selectedDate) {
      const grouped = outboundFlights.reduce((accumulator, flight) => {
        const dateKey = toIsoDate(flight.gioKhoiHanh);
        if (!dateKey) return accumulator;
        if (!accumulator[dateKey]) {
          accumulator[dateKey] = {
            count: 0,
            minPrice: 0,
          };
        }

        const lowestPrice = getLowestPrice(flight);
        accumulator[dateKey].count += 1;
        accumulator[dateKey].minPrice =
          accumulator[dateKey].minPrice === 0
            ? lowestPrice
            : Math.min(accumulator[dateKey].minPrice, lowestPrice);

        return accumulator;
      }, {});

      setDatePrices(grouped);
      return () => {
        active = false;
      };
    }

    const dates = Array.from({ length: 5 }, (_, index) => addDays(selectedDate, index - 2));

    Promise.all(
      dates.map((date) =>
        publicFlightService
          .searchFlights({
            maSanBayDi: fromCode || undefined,
            maSanBayDen: toCode || undefined,
            ngayDi: date,
          })
          .then((data) => {
            const flights = Array.isArray(data.flights) ? data.flights : [];
            const prices = flights.map(getLowestPrice).filter((price) => price > 0);
            return [
              date,
              {
                count: flights.length,
                minPrice: prices.length ? Math.min(...prices) : 0,
              },
            ];
          })
          .catch(() => [date, { count: 0, minPrice: 0 }])
      )
    ).then((entries) => {
      if (active) setDatePrices(Object.fromEntries(entries));
    });

    return () => {
      active = false;
    };
  }, [fromCode, toCode, selectedDate, outboundFlights]);

  const allFlights = useMemo(
    () => [...outboundFlights, ...(tripType === "roundtrip" ? returnFlights : [])],
    [outboundFlights, returnFlights, tripType]
  );

  const airlines = useMemo(
    () => [...new Set(allFlights.map((flight) => flight.hangBay).filter(Boolean))],
    [allFlights]
  );
  const seatLabels = useMemo(() => getAllSeatLabels(allFlights), [allFlights]);

  useEffect(() => {
    const { max } = getPriceBounds(allFlights);
    setMaxAllowedPrice(max);
    setSelectedMaxPrice((current) =>
      isPriceFilterActive && current && current <= max ? current : max
    );
  }, [allFlights, isPriceFilterActive]);

  const applyFilters = (flights) =>
    flights.filter((flight) => {
      const lowestPrice = getLowestPrice(flight);
      const airlineMatched = !selectedAirlines.length || selectedAirlines.includes(flight.hangBay);
      const departureMatched = matchesDepartureFilter(flight, departureFilters);
      const seatMatched = matchesSeatClassFilter(flight, selectedSeatClasses);
      const priceMatched = !isPriceFilterActive || lowestPrice <= selectedMaxPrice;
      return airlineMatched && departureMatched && seatMatched && priceMatched;
    });

  const filteredOutboundFlights = applyFilters(outboundFlights).sort(
    (left, right) => getLowestPrice(left) - getLowestPrice(right)
  );
  const filteredReturnFlights = applyFilters(returnFlights);
  const totalFlightsFound = filteredOutboundFlights.length + (tripType === "roundtrip" ? filteredReturnFlights.length : 0);
  const totalOutboundPages = Math.max(1, Math.ceil(filteredOutboundFlights.length / FLIGHTS_PER_PAGE));
  const paginatedOutboundFlights = filteredOutboundFlights.slice(
    (currentPage - 1) * FLIGHTS_PER_PAGE,
    currentPage * FLIGHTS_PER_PAGE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [fromCode, toCode, selectedDate, selectedAirlines, selectedSeatClasses, departureFilters, selectedMaxPrice]);

  useEffect(() => {
    if (currentPage > totalOutboundPages) setCurrentPage(totalOutboundPages);
  }, [currentPage, totalOutboundPages]);

  const dateOptions = selectedDate
    ? Array.from({ length: 5 }, (_, index) => {
        const date = addDays(selectedDate, index - 2);
        return {
          date,
          label: formatShortDate(date),
          ...datePrices[date],
        };
      })
    : (() => {
        const datesWithFlights = Object.keys(datePrices);
        if (!datesWithFlights.length) return [];

        const cheapestDate = datesWithFlights.reduce((bestDate, date) => {
          const bestPrice = datePrices[bestDate]?.minPrice || Infinity;
          const currentPrice = datePrices[date]?.minPrice || Infinity;
          return currentPrice < bestPrice || (currentPrice === bestPrice && date < bestDate) ? date : bestDate;
        }, datesWithFlights[0]);

        return Array.from({ length: 6 }, (_, index) => {
          const date = addDays(cheapestDate, index);
          return {
            date,
            label: formatShortDate(date),
            ...datePrices[date],
          };
        });
      })();

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

  const toggleDepartureWindow = (windowKey) => {
    setDepartureFilters((current) =>
      current.includes(windowKey) ? current.filter((item) => item !== windowKey) : [...current, windowKey]
    );
  };

  const hasActiveFilters =
    selectedAirlines.length > 0 ||
    selectedSeatClasses.length > 0 ||
    departureFilters.length > 0 ||
    isPriceFilterActive;

  const clearFilters = () => {
    setSelectedAirlines([]);
    setSelectedSeatClasses([]);
    setDepartureFilters([]);
    setSelectedMaxPrice(maxAllowedPrice);
    setIsPriceFilterActive(false);
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

  const handleSelectDate = (date) => {
    setSelectedDate(date);
    updateSearchParams({ date });
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
          <button type="button" className="flight-selection-hero-button" onClick={() => navigate("/")}>
            Modify Search
          </button>
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
                        onClick={() => {
                          setTripType(item.key);
                          updateSearchParams({
                            tripType: item.key,
                            returnDate: item.key === "roundtrip" ? returnDate : "",
                          });
                        }}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flight-selection-filter-group">
                  <h3>Travel Dates</h3>
                  <div className="flight-selection-date-fields">
                    <label className="flight-selection-input-group">
                      <span>Ngày đi</span>
                      <input
                        type="date"
                        value={selectedDate}
                        onChange={(event) => {
                          setSelectedDate(event.target.value);
                          updateSearchParams({ date: event.target.value });
                        }}
                      />
                    </label>
                    {tripType === "roundtrip" && (
                      <label className="flight-selection-input-group">
                        <span>Ngày về</span>
                        <input
                          type="date"
                          min={selectedDate}
                          value={returnDate}
                          onChange={(event) => {
                            setReturnDate(event.target.value);
                            updateSearchParams({ returnDate: event.target.value });
                          }}
                        />
                      </label>
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
                  <h3>Departure Time</h3>
                  <div className="flight-selection-time-grid">
                    {DEPARTURE_WINDOWS.map((item) => {
                      const active = departureFilters.includes(item.key);
                      return (
                        <button
                          key={item.key}
                          type="button"
                          className={`flight-selection-time-chip${active ? " is-active" : ""}`}
                          onClick={() => toggleDepartureWindow(item.key)}
                        >
                          <span>{item.label}</span>
                          <strong>{item.range}</strong>
                        </button>
                      );
                    })}
                  </div>
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
                  <h3>Price Range</h3>
                  <input
                    type="range"
                    min={0}
                    max={maxAllowedPrice || 1}
                    value={selectedMaxPrice || 0}
                    onChange={(event) => {
                      setSelectedMaxPrice(Number(event.target.value));
                      setIsPriceFilterActive(true);
                    }}
                  />
                  <div className="flight-selection-price-labels">
                    <span>0 VND</span>
                    <span>{formatCurrency(selectedMaxPrice || maxAllowedPrice || 0)}</span>
                  </div>
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
              <div className="flight-selection-date-rail custom-scrollbar">
                {dateOptions.map((option) => {
                  const active = option.date === selectedDate;
                  return (
                    <button
                      key={option.date}
                      type="button"
                      className={`flight-selection-date-chip${active ? " is-active" : ""}`}
                      onClick={() => handleSelectDate(option.date)}
                    >
                      <span>{option.label}</span>
                      <strong>{option.minPrice ? formatCompactPrice(option.minPrice) : "--"}</strong>
                      <small>{option.count ? `${option.count} flights` : "No flights"}</small>
                    </button>
                  );
                })}
                {!!selectedDate && (
                  <button
                    type="button"
                    className="flight-selection-date-chip flight-selection-date-chip-clear"
                    onClick={() => {
                      setSelectedDate("");
                      updateSearchParams({ date: "" });
                    }}
                  >
                    <span>Bỏ lọc</span>
                    <strong>Tất cả</strong>
                    <small>Hiển thị mọi ngày</small>
                  </button>
                )}
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
                emptyMessage="Hãy thử đổi ngày bay, khung giờ hoặc mức giá để xem thêm lựa chọn."
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
