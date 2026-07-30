import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import FlightSelectionPage from "../pages/flight-selection/FlightSelectionPage";
import BookingSeatPage from "../pages/booking/BookingSeatPage";
import BookingTicketPage from "../pages/booking/BookingTicketPage";
import PaymentPage from "../pages/payment/PaymentPage";
import PaymentProcessingPage from "../pages/payment/PaymentProcessingPage";
import PaymentResultPage from "../pages/payment/PaymentResultPage";
import HomePage from "../pages/home/HomePage";
import BlogArticlePage from "../pages/blog/BlogArticlePage";
import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegisterPage";
import DashboardPage from "../pages/admin/dashboard/DashboardPage";
import AirportListPage from "../pages/admin/master-data/airports/AirportListPage";
import AirportFormPage from "../pages/admin/master-data/airports/AirportFormPage";
import AirportDetailPage from "../pages/admin/master-data/airports/AirportDetailPage";
import AirlineListPage from "../pages/admin/master-data/airlines/AirlineListPage";
import AirlineFormPage from "../pages/admin/master-data/airlines/AirlineFormPage";
import AirlineDetailPage from "../pages/admin/master-data/airlines/AirlineDetailPage";
import AircraftListPage from "../pages/admin/master-data/aircrafts/AircraftListPage";
import AircraftFormPage from "../pages/admin/master-data/aircrafts/AircraftFormPage";
import AircraftDetailPage from "../pages/admin/master-data/aircrafts/AircraftDetailPage";
import RouteListPage from "../pages/admin/master-data/routes/RouteListPage";
import RouteFormPage from "../pages/admin/master-data/routes/RouteFormPage";
import RouteDetailPage from "../pages/admin/master-data/routes/RouteDetailPage";
import SeatMapListPage from "../pages/admin/master-data/seat-map/SeatMapListPage";
import SeatMapDetailPage from "../pages/admin/master-data/seat-map/SeatMapDetailPage";
import SeatMapGeneratePage from "../pages/admin/master-data/seat-map/SeatMapGeneratePage";
import SeatEditPage from "../pages/admin/master-data/seat-map/SeatEditPage";
import SeatClassListPage from "../pages/admin/master-data/seat-classes/SeatClassListPage";
import SeatClassFormPage from "../pages/admin/master-data/seat-classes/SeatClassFormPage";
import SeatClassDetailPage from "../pages/admin/master-data/seat-classes/SeatClassDetailPage";
import FlightListPage from "../pages/admin/flights/FlightListPage";
import FlightFormPage from "../pages/admin/flights/FlightFormPage";
import FlightDetailPage from "../pages/admin/flights/FlightDetailPage";
import AdminLayout from "../layouts/AdminLayout";
import MainLayout from "../layouts/MainLayout";
import ProtectedRoute from "./ProtectedRoute";

const TravelInformationOverviewPage = lazy(() => import("../pages/travel-information/TravelInformationPages").then((module) => ({ default: module.TravelInformationOverviewPage })));
const TravelCategoryPage = lazy(() => import("../pages/travel-information/TravelInformationPages").then((module) => ({ default: module.TravelCategoryPage })));
const TravelArticlePage = lazy(() => import("../pages/travel-information/TravelInformationPages").then((module) => ({ default: module.TravelArticlePage })));
const AdditionalServicesPage = lazy(() => import("../pages/experience/ExperiencePages").then((module) => ({ default: module.AdditionalServicesPage })));
const FlightExperiencePage = lazy(() => import("../pages/experience/ExperiencePages").then((module) => ({ default: module.FlightExperiencePage })));
const LotusmilesPage = lazy(() => import("../pages/experience/ExperiencePages").then((module) => ({ default: module.LotusmilesPage })));

const travelPage = (page) => <Suspense fallback={<main className="travel-route-loading">Đang tải thông tin hành trình...</main>}>{page}</Suspense>;

function AppRoutes() {
    return (
        <Routes>
            <Route element={<MainLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/search" element={<Navigate to="/flight-selection" replace />} />
                <Route path="/flight-selection" element={<FlightSelectionPage />} />
                <Route path="/additional-services" element={travelPage(<AdditionalServicesPage />)} />
                <Route path="/flight-experience" element={travelPage(<FlightExperiencePage />)} />
                <Route path="/lotusmiles" element={travelPage(<LotusmilesPage />)} />
                <Route path="/cam-nang/:slug" element={<BlogArticlePage />} />
                <Route path="/travel-information" element={travelPage(<TravelInformationOverviewPage />)} />
                <Route path="/travel-information/:categorySlug" element={travelPage(<TravelCategoryPage />)} />
                <Route path="/travel-information/:categorySlug/:articleSlug" element={travelPage(<TravelArticlePage />)} />
            </Route>

            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            <Route element={<ProtectedRoute />}>
                <Route element={<MainLayout />}>
                    <Route path="/booking/:id" element={<BookingSeatPage />} />
                    <Route path="/booking/:bookingId/tickets" element={<BookingTicketPage />} />
                    <Route path="/payment/:bookingId" element={<PaymentPage />} />
                    <Route
                        path="/payment/:bookingId/processing/:paymentId"
                        element={<PaymentProcessingPage />}
                    />
                    <Route
                        path="/payment/:bookingId/result/cancelled"
                        element={<PaymentResultPage mode="booking-cancelled" />}
                    />
                    <Route
                        path="/payment/:bookingId/result/:paymentId"
                        element={<PaymentResultPage mode="payment" />}
                    />
                </Route>

                <Route path="/admin" element={<AdminLayout />}>
                    <Route index element={<Navigate to="/admin/dashboard" replace />} />
                    <Route path="dashboard" element={<DashboardPage />} />
                    <Route path="chuyen-bay" element={<FlightListPage />} />
                    <Route path="chuyen-bay/them" element={<FlightFormPage />} />
                    <Route path="chuyen-bay/:id" element={<FlightDetailPage />} />
                    <Route path="chuyen-bay/:id/sua" element={<FlightFormPage />} />
                    <Route path="danh-muc/san-bay" element={<AirportListPage />} />
                    <Route path="danh-muc/san-bay/them" element={<AirportFormPage />} />
                    <Route path="danh-muc/san-bay/:id" element={<AirportDetailPage />} />
                    <Route path="danh-muc/san-bay/:id/sua" element={<AirportFormPage />} />
                    <Route path="danh-muc/hang-bay" element={<AirlineListPage />} />
                    <Route path="danh-muc/hang-bay/them" element={<AirlineFormPage />} />
                    <Route path="danh-muc/hang-bay/:id" element={<AirlineDetailPage />} />
                    <Route path="danh-muc/hang-bay/:id/sua" element={<AirlineFormPage />} />
                    <Route path="danh-muc/hang-ghe" element={<SeatClassListPage />} />
                    <Route path="danh-muc/hang-ghe/them" element={<SeatClassFormPage />} />
                    <Route path="danh-muc/hang-ghe/:id" element={<SeatClassDetailPage />} />
                    <Route path="danh-muc/hang-ghe/:id/sua" element={<SeatClassFormPage />} />
                    <Route path="danh-muc/may-bay" element={<AircraftListPage />} />
                    <Route path="danh-muc/may-bay/them" element={<AircraftFormPage />} />
                    <Route path="danh-muc/may-bay/:id" element={<AircraftDetailPage />} />
                    <Route path="danh-muc/may-bay/:id/sua" element={<AircraftFormPage />} />
                    <Route path="danh-muc/lo-trinh" element={<RouteListPage />} />
                    <Route path="danh-muc/lo-trinh/them" element={<RouteFormPage />} />
                    <Route path="danh-muc/lo-trinh/:id" element={<RouteDetailPage />} />
                    <Route path="danh-muc/lo-trinh/:id/sua" element={<RouteFormPage />} />
                    <Route path="danh-muc/ghe-may-bay" element={<SeatMapListPage />} />
                    <Route path="danh-muc/ghe-may-bay/them" element={<SeatMapGeneratePage />} />
                    <Route path="danh-muc/ghe-may-bay/:id" element={<SeatMapDetailPage />} />
                    <Route path="danh-muc/ghe-may-bay/:id/sua" element={<SeatEditPage />} />
                    
                </Route>
            </Route>
        </Routes>
    );
}

export default AppRoutes;