import sqlite3
db = sqlite3.connect('flightbooking.db')
flights = db.execute('SELECT COUNT(*) FROM ChuyenBays').fetchone()[0]
seats = db.execute('SELECT COUNT(*) FROM GheChuyenBays').fetchone()[0]
bookings = db.execute('SELECT COUNT(*) FROM PhieuDatChos').fetchone()[0]
tickets = db.execute('SELECT COUNT(*) FROM Ves').fetchone()[0]
sold_seats = db.execute('SELECT COUNT(*) FROM GheChuyenBays WHERE TrangThaiGhe = "Sold"').fetchone()[0]
available_seats = db.execute('SELECT COUNT(*) FROM GheChuyenBays WHERE TrangThaiGhe = "Available"').fetchone()[0]

print(f"Tổng số Chuyến bay: {flights}")
print(f"Tổng số Ghế chuyến bay: {seats} (Đã bán: {sold_seats}, Còn trống: {available_seats})")
print(f"Tổng số Phiếu đặt chỗ: {bookings}")
print(f"Tổng số Vé máy bay: {tickets}")

cursor = db.execute('''
SELECT m.DongMayBay, c.SoHieuChuyenBay, c.GiaCoBan, 
       (SELECT COUNT(*) FROM Ves WHERE MaChuyenBay = c.MaChuyenBay) as Sold,
       (SELECT COUNT(*) FROM GheChuyenBays WHERE MaChuyenBay = c.MaChuyenBay) as Total
FROM ChuyenBays c 
JOIN MayBays m ON c.MaMayBay = m.MaMayBay
LIMIT 5
''')
print("\n--- 5 chuyến bay mẫu ---")
for row in cursor:
    print(f"Chuyến {row[1]} ({row[0]}) - Giá cơ bản: {row[2]} VND - Tình trạng: Đã xuất {row[3]} vé / {row[4]} ghế")
