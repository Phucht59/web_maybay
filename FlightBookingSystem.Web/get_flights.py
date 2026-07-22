import sqlite3
db = sqlite3.connect('flightbooking.db')
cursor = db.execute('''
SELECT cb.SoHieuChuyenBay, m.DongMayBay, s_di.ThanhPho, s_den.ThanhPho, cb.GioKhoiHanh, cb.GiaCoBan
FROM ChuyenBays cb
JOIN LoTrinhs lt ON cb.MaLoTrinh = lt.MaLoTrinh
JOIN SanBays s_di ON lt.MaSanBayDi = s_di.MaSanBay
JOIN SanBays s_den ON lt.MaSanBayDen = s_den.MaSanBay
JOIN MayBays m ON cb.MaMayBay = m.MaMayBay
ORDER BY cb.GioKhoiHanh ASC
LIMIT 10
''')

print("Danh sách 10 chuyến bay sắp tới:")
for row in cursor:
    print(f"- Chuyến {row[0]} ({row[1]}): {row[2]} -> {row[3]} | Khởi hành: {row[4]} | Giá: {row[5]} VND")
