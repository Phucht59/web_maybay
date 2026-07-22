import urllib.request
import urllib.error
import json
import uuid
import sys
import time

BASE_URL = "http://localhost:5071/api"

def make_request(method, url, data=None, token=None):
    req = urllib.request.Request(f"{BASE_URL}{url}", method=method)
    req.add_header("Content-Type", "application/json")
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    if data is not None:
        req.data = json.dumps(data).encode("utf-8")
    
    try:
        with urllib.request.urlopen(req) as response:
            status = response.status
            body = response.read().decode("utf-8")
            if body:
                return status, json.loads(body)
            return status, None
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8")
        try:
            return e.code, json.loads(body)
        except:
            return e.code, body
    except Exception as e:
        print(f"Lỗi hệ thống khi gọi API: {e}")
        return 0, None

def run_tests():
    print("=== BẮT ĐẦU TEST LUỒNG ĐẶT GHẾ ===")
    
    # 1. Login
    print("\n[Test 1] Login User A (Admin) và User B (Phuc)")
    s1, r1 = make_request("POST", "/Account/Login", {"email": "admin@gmail.com", "matKhau": "123456"})
    if s1 != 200:
        print(f"FAILED: Không thể login Admin. Status: {s1}, Body: {r1}")
        return
    tokenA = r1["token"]
    print("-> User A Login: OK")
    
    s2, r2 = make_request("POST", "/Account/Login", {"email": "phuc@gmail.com", "matKhau": "123456"})
    if s2 != 200:
        print(f"FAILED: Không thể login Phuc. Status: {s2}")
        return
    tokenB = r2["token"]
    print("-> User B Login: OK")
    
    # SessionIDs
    sessionA = str(uuid.uuid4())
    sessionB = str(uuid.uuid4())
    
    # Tìm chuyến bay đầu tiên
    import sqlite3
    db = sqlite3.connect('flightbooking.db')
    flight_id = db.execute("SELECT MaChuyenBay FROM ChuyenBays LIMIT 1").fetchone()[0]
    print(f"\nSử dụng Flight ID: {flight_id}")
    
    # 2. Lấy sơ đồ ghế
    print("\n[Test 2] Lấy sơ đồ ghế")
    s, r = make_request("GET", f"/booking/flights/{flight_id}/seats?sessionId={sessionA}", token=tokenA)
    if s != 200 or "seats" not in r:
        print(f"FAILED: Get Seats trả về lỗi. Status {s}")
        return
    
    available_seats = [seat for seat in r["seats"] if seat["trangThai"] == "Available"]
    if not available_seats:
        print("FAILED: Không tìm thấy ghế trống để test!")
        return
        
    target_seat = available_seats[0]
    seat_id = target_seat["maGheChuyenBay"]
    hang_ghe = target_seat["maHangGhe"]
    print(f"-> Đã lấy sơ đồ ghế. Chọn ghế mục tiêu: ID {seat_id} (Hạng: {hang_ghe})")
    
    # 3. Basic Seat Hold
    print("\n[Test 3] User A giữ ghế (Hold Seat)")
    payload_hold_A = {"sessionId": sessionA, "maHangGhe": hang_ghe, "maxSeats": 2}
    s, r = make_request("POST", f"/booking/flights/{flight_id}/seats/{seat_id}/hold", payload_hold_A, tokenA)
    if s == 200:
        print(f"-> PASSED: User A giữ ghế thành công. Giữ đến: {r.get('giuDenLuc')}")
    else:
        print(f"-> FAILED: User A giữ ghế thất bại. Status {s}, {r}")
        
    # 4. Concurrency Conflict
    print("\n[Test 4] User B giành ghế của User A")
    payload_hold_B = {"sessionId": sessionB, "maHangGhe": hang_ghe, "maxSeats": 2}
    s, r = make_request("POST", f"/booking/flights/{flight_id}/seats/{seat_id}/hold", payload_hold_B, tokenB)
    if s == 409:
        print("-> PASSED: Bắt đúng lỗi 409 Conflict - Ghế đã bị giữ bởi người khác.")
    else:
        print(f"-> FAILED: Không chặn được tranh chấp! Status {s}, {r}")
        
    # 5. Max Seat Limit
    print("\n[Test 5] User A giữ quá MaxSeats (Giả sử lấy thêm 2 ghế nữa trong khi max = 2)")
    # Tìm 2 ghế trống khác
    other_seats = [seat["maGheChuyenBay"] for seat in available_seats if seat["maGheChuyenBay"] != seat_id][:2]
    # Hold ghế 1 
    make_request("POST", f"/booking/flights/{flight_id}/seats/{other_seats[0]}/hold", payload_hold_A, tokenA)
    # Hold ghế 2 -> Cái này sẽ lố MaxSeats=2 vì đã giữ target_seat và other_seats[0]
    s, r = make_request("POST", f"/booking/flights/{flight_id}/seats/{other_seats[1]}/hold", payload_hold_A, tokenA)
    if s == 400:
        print("-> PASSED: Bắt đúng lỗi 400 - Vượt quá số lượng ghế tối đa.")
    else:
        print(f"-> FAILED: User A vẫn giữ được quá số lượng ghế quy định! Status {s}, {r}")
        
    # 6. Cross-Session Release
    print("\n[Test 6] User B nhả ghế của User A đang giữ")
    s, r = make_request("DELETE", f"/booking/flights/{flight_id}/seats/{seat_id}/hold?sessionId={sessionB}", token=tokenB)
    # Check lại trạng thái ghế xem A còn giữ không
    s_chk, r_chk = make_request("GET", f"/booking/flights/{flight_id}/seats?sessionId={sessionA}", token=tokenA)
    current_seat = next(x for x in r_chk["seats"] if x["maGheChuyenBay"] == seat_id)
    if current_seat["trangThai"] == "Held" and current_seat["laGheCuaToi"] == True:
        print("-> PASSED: User B không thể nhả ghế của User A. Bảo mật tốt.")
    else:
        print("-> FAILED: User B đã nhả được ghế của User A!")
        
    # 7. Release Seat (Tự nhả)
    print("\n[Test 7] User A tự nhả ghế")
    # A nhả ghế other_seats[0]
    s, r = make_request("DELETE", f"/booking/flights/{flight_id}/seats/{other_seats[0]}/hold?sessionId={sessionA}", token=tokenA)
    if s == 204:
        print("-> PASSED: User A tự nhả ghế thành công (204 No Content).")
    else:
        print(f"-> FAILED: Nhả ghế thất bại. Status {s}, {r}")
        
    # 8. Payment Hold
    print("\n[Test 8] User A khoá ghế thanh toán (Payment Hold)")
    payload_payment = {
        "sessionId": sessionA,
        "expectedSeats": 1,
        "seatIds": [seat_id]
    }
    s, r = make_request("POST", f"/booking/flights/{flight_id}/payment-hold", payload_payment, tokenA)
    if s == 200:
        print(f"-> PASSED: Khoá ghế thanh toán thành công. Gia hạn đến: {r.get('holdUntil')}")
    else:
        print(f"-> FAILED: Lỗi khoá ghế thanh toán. Status {s}, {r}")
        
    print("\n=== HOÀN TẤT TEST ===")

if __name__ == "__main__":
    run_tests()
