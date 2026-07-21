import overviewImage from "../../../assets/travel-information/travel-overview.webp";
import baggageCategoryImage from "../../../assets/travel-information/baggage.webp";
import checkInCategoryImage from "../../../assets/travel-information/check-in.webp";
import airportsCategoryImage from "../../../assets/travel-information/airports.webp";
import specialServicesCategoryImage from "../../../assets/travel-information/special-services.webp";
import travelAdviceCategoryImage from "../../../assets/travel-information/travel-advice.webp";
import baggageInformationImage from "../../../assets/travel-information/articles/baggage/baggage-information.webp";
import carryOnImage from "../../../assets/travel-information/articles/baggage/carry-on-baggage.svg";
import checkedBaggageImage from "../../../assets/travel-information/articles/baggage/checked-baggage.webp";
import extraBaggageImage from "../../../assets/travel-information/articles/baggage/extra-baggage.svg";
import specialBaggageImage from "../../../assets/travel-information/articles/baggage/special-baggage.svg";
import restrictedBaggageImage from "../../../assets/travel-information/articles/baggage/restricted-baggage.svg";
import baggageIssuesImage from "../../../assets/travel-information/articles/baggage/baggage-issues.webp";
import onlineCheckInImage from "../../../assets/travel-information/articles/check-in/online-check-in.webp";
import kioskCheckInImage from "../../../assets/travel-information/articles/check-in/kiosk-check-in.svg";
import airportCheckInImage from "../../../assets/travel-information/articles/check-in/airport-check-in.webp";
import businessLoungesImage from "../../../assets/travel-information/articles/airports/business-lounges.webp";
import airportPriorityImage from "../../../assets/travel-information/articles/airports/airport-priority-services.svg";
import airportInformationImage from "../../../assets/travel-information/articles/airports/airport-information.svg";
import connectingServicesImage from "../../../assets/travel-information/articles/airports/connecting-services.svg";
import airportMapsImage from "../../../assets/travel-information/articles/airports/airport-maps.svg";
import petTransportImage from "../../../assets/travel-information/articles/special-services/pet-transport.webp";
import specialMealsImage from "../../../assets/travel-information/articles/special-services/special-meals.svg";
import servicesForChildrenImage from "../../../assets/travel-information/articles/special-services/services-for-children.webp";
import unaccompaniedMinorsImage from "../../../assets/travel-information/articles/special-services/unaccompanied-minors.svg";
import infantSeparateSeatImage from "../../../assets/travel-information/articles/special-services/infant-separate-seat.svg";
import reducedMobilityImage from "../../../assets/travel-information/articles/special-services/reduced-mobility.webp";
import pregnantPassengersImage from "../../../assets/travel-information/articles/special-services/pregnant-passengers.webp";
import extraSeatImage from "../../../assets/travel-information/articles/special-services/extra-seat.svg";
import medicalClearanceImage from "../../../assets/travel-information/articles/special-services/medical-clearance.svg";
import specialServiceFeesImage from "../../../assets/travel-information/articles/special-services/special-service-fees.svg";
import domesticFlightsImage from "../../../assets/travel-information/articles/travel-advice/vietnam-domestic-flights.webp";
import flightsToVietnamImage from "../../../assets/travel-information/articles/travel-advice/flights-to-vietnam.webp";
import internationalFlightsImage from "../../../assets/travel-information/articles/travel-advice/international-flights-from-vietnam.svg";
import smoothJourneyImage from "../../../assets/travel-information/articles/travel-advice/smooth-journey-guide.svg";

const image = (src, alt, usage, type, focalPoint = "50% 50%") => Object.freeze({ src, alt, usage, type, focalPoint });

export const travelImageRegistry = Object.freeze({
  "travel-overview": image(overviewImage, "Hành khách chuẩn bị cho hành trình trong nhà ga hiện đại", "overview-hero", "photo", "50% 45%"),
  "category-baggage": image(baggageCategoryImage, "Khu vực cân và gửi nhiều loại hành lý tại sân bay", "category-primary", "photo"),
  "category-check-in": image(checkInCategoryImage, "Khu làm thủ tục sân bay với hành khách và màn hình chuyến bay", "category-primary", "photo"),
  "category-airports": image(airportsCategoryImage, "Toàn cảnh sảnh khởi hành của nhà ga hiện đại", "category-primary", "photo"),
  "category-special-services": image(specialServicesCategoryImage, "Nhân viên sân bay hỗ trợ nhiều nhóm hành khách", "category-primary", "photo"),
  "category-travel-advice": image(travelAdviceCategoryImage, "Hộ chiếu, hành lý và lịch trình được chuẩn bị tại nhà", "category-primary", "photo"),
  "baggage-information": image(baggageInformationImage, "Hành khách kiểm tra thông tin hành lý trên điện thoại cạnh khu cân", "article-primary", "photo"),
  "baggage-carry-on": image(carryOnImage, "Vali cabin nhỏ được chuẩn bị cạnh khu vực chờ lên máy bay", "article-primary", "illustration"),
  "baggage-checked": image(checkedBaggageImage, "Vali lớn được xử lý trên băng chuyền hành lý ký gửi", "article-primary", "photo"),
  "baggage-extra": image(extraBaggageImage, "Hành khách bổ sung hành lý cho đặt chỗ trên laptop", "article-primary", "illustration"),
  "baggage-special": image(specialBaggageImage, "Nhạc cụ và dụng cụ thể thao được bảo vệ để vận chuyển", "article-primary", "illustration"),
  "baggage-restricted": image(restrictedBaggageImage, "Khay an ninh với các vật dụng cần xác nhận trước chuyến bay", "article-primary", "diagram"),
  "baggage-issues": image(baggageIssuesImage, "Hành khách trao đổi bình tĩnh tại quầy hỗ trợ hành lý", "article-primary", "photo"),
  "check-in-online": image(onlineCheckInImage, "Điện thoại hiển thị quy trình làm thủ tục trực tuyến trừu tượng", "article-primary", "photo"),
  "check-in-kiosk": image(kioskCheckInImage, "Kiosk tự phục vụ là chủ thể chính trong nhà ga", "article-primary", "illustration"),
  "check-in-airport": image(airportCheckInImage, "Nhân viên quầy làm thủ tục hỗ trợ hành khách tại sân bay", "article-primary", "photo"),
  "airport-lounge": image(businessLoungesImage, "Không gian phòng khách sân bay yên tĩnh với ghế nghỉ", "article-primary", "photo"),
  "airport-priority": image(airportPriorityImage, "Làn ưu tiên và nhân viên hướng dẫn trong nhà ga", "article-primary", "illustration"),
  "airport-information": image(airportInformationImage, "Bảng thông tin chuyến bay và chỉ dẫn trong nhà ga", "article-primary", "diagram"),
  "airport-connecting": image(connectingServicesImage, "Luồng nối chuyến từ điểm đến đến cửa khởi hành kế tiếp", "article-primary", "illustration"),
  "airport-map": image(airportMapsImage, "Sơ đồ định hướng các khu vực chính của nhà ga", "article-primary", "diagram"),
  "special-pet": image(petTransportImage, "Thú cưng nghỉ an toàn trong lồng vận chuyển phù hợp", "article-primary", "photo"),
  "special-meals": image(specialMealsImage, "Khay suất ăn hàng không với các nhóm nhu cầu khác nhau", "article-primary", "illustration"),
  "special-children": image(servicesForChildrenImage, "Gia đình có trẻ nhỏ chuẩn bị đồ dùng cho chuyến bay", "article-primary", "photo"),
  "special-unaccompanied-minor": image(unaccompaniedMinorsImage, "Trẻ em được bàn giao an toàn giữa người giám hộ và nhân viên hỗ trợ", "article-primary", "illustration"),
  "special-infant-seat": image(infantSeparateSeatImage, "Ghế trẻ em được chuẩn bị trên ghế máy bay cạnh người chăm sóc", "article-primary", "illustration"),
  "special-mobility": image(reducedMobilityImage, "Nhân viên hỗ trợ hành khách sử dụng xe lăn với sự tôn trọng", "article-primary", "photo"),
  "special-pregnancy": image(pregnantPassengersImage, "Hành khách mang thai thoải mái xem giấy tờ gần cửa sổ sân bay", "article-primary", "photo"),
  "special-extra-seat": image(extraSeatImage, "Hai ghế máy bay liền nhau dành cho nhu cầu thêm chỗ", "article-primary", "illustration"),
  "special-medical": image(medicalClearanceImage, "Hồ sơ sức khỏe được chuẩn bị cho cuộc trao đổi hỗ trợ", "article-primary", "illustration"),
  "special-fees": image(specialServiceFeesImage, "Hành khách xác nhận lựa chọn dịch vụ trên máy tính bảng", "article-primary", "illustration"),
  "advice-domestic-vietnam": image(domesticFlightsImage, "Hành khách chuẩn bị trong nhà ga nội địa hiện đại tại Việt Nam", "article-primary", "photo"),
  "advice-to-vietnam": image(flightsToVietnamImage, "Hành khách quốc tế đến sảnh arrivals tại Việt Nam", "article-primary", "photo"),
  "advice-international-from-vietnam": image(internationalFlightsImage, "Hộ chiếu và bảng khởi hành cho chuyến bay quốc tế từ Việt Nam", "article-primary", "illustration"),
  "advice-smooth-journey": image(smoothJourneyImage, "Bộ vật dụng và lịch trình được sắp xếp cho hành trình thuận lợi", "article-primary", "illustration"),
});

export function getTravelImage(imageKey) {
  const entry = travelImageRegistry[imageKey];
  if (!entry) throw new Error(`Unknown travel image key: ${imageKey}`);
  return entry;
}
