file_path = "/Users/thienpham/Documents/english_learning_app/apps/web/app/(app)/read-aloud/_data/sample-passages.ts"

with open(file_path, "r", encoding="utf-8") as f:
    code = f.read()

replacements = [
    # Topics
    ('label: "Văn phòng"', 'label: "Office"'),
    ('label: "Nhân sự"', 'label: "Human Resources"'),
    ('label: "Tài chính"', 'label: "Finance"'),
    ('label: "Du lịch"', 'label: "Travel"'),
    ('label: "Ẩm thực"', 'label: "Dining"'),
    ('label: "Sức khỏe"', 'label: "Health"'),
    ('label: "Công nghệ"', 'label: "Technology"'),
    ('label: "Sản xuất"', 'label: "Manufacturing"'),
    ('label: "Bất động sản"', 'label: "Real Estate"'),
    
    # Office
    ('title: "Họp ngắn buổi sáng"', 'title: "Morning Briefing"'),
    ('title: "Thông báo bảo trì văn phòng"', 'title: "Office Maintenance Notice"'),
    ('title: "Chính sách làm việc từ xa"', 'title: "Remote Work Policy"'),
    
    # HR
    ('title: "Thông báo tuyển dụng"', 'title: "Hiring Announcement"'),
    ('title: "Chương trình đào tạo nhân viên"', 'title: "Employee Training Program"'),
    ('title: "Đánh giá hiệu suất hàng năm"', 'title: "Annual Performance Review"'),
    
    # Finance
    ('title: "Báo cáo quý"', 'title: "Quarterly Report"'),
    ('title: "Thay đổi chính sách hoàn tiền"', 'title: "Refund Policy Update"'),
    ('title: "Kế hoạch ngân sách năm mới"', 'title: "New Year Budget Plan"'),
    
    # Marketing
    ('title: "Ra mắt chiến dịch mới"', 'title: "New Campaign Launch"'),
    ('title: "Phân tích thị trường mục tiêu"', 'title: "Target Market Analysis"'),
    ('title: "Kế hoạch tái định vị thương hiệu"', 'title: "Rebranding Plan"'),
    
    # Travel
    ('title: "Thông báo chuyến bay"', 'title: "Flight Delay Announcement"'),
    ('title: "Hướng dẫn đặt phòng khách sạn"', 'title: "Hotel Booking Instructions"'),
    ('title: "Chính sách công tác nước ngoài"', 'title: "Business Travel Policy"'),
    
    # Dining
    ('title: "Đặt bàn nhà hàng"', 'title: "Restaurant Reservation"'),
    ('title: "Thực đơn mới theo mùa"', 'title: "New Seasonal Menu"'),
    ('title: "Dịch vụ catering công ty"', 'title: "Corporate Catering Service"'),
    
    # Health
    ('title: "Thông báo kiểm tra sức khỏe"', 'title: "Health Screening Reminder"'),
    ('title: "Chương trình sức khỏe nhân viên"', 'title: "Employee Wellness Program"'),
    ('title: "Hướng dẫn an toàn lao động"', 'title: "Workplace Safety Guidelines"'),
    
    # Tech
    ('title: "Cập nhật hệ thống"', 'title: "System Upgrade Scheduled"'),
    ('title: "Chính sách bảo mật dữ liệu"', 'title: "Data Security Protocols"'),
    ('title: "Triển khai phần mềm quản lý mới"', 'title: "New ERP Software Rollout"'),
    
    # Manufacturing
    ('title: "Báo cáo sản xuất"', 'title: "Production Report"'),
    ('title: "Quy trình kiểm soát chất lượng"', 'title: "Quality Control Inspection"'),
    ('title: "Mở rộng nhà máy sản xuất"', 'title: "Manufacturing Plant Expansion"'),
    
    # Real Estate
    ('title: "Thông báo cho thuê"', 'title: "Apartment for Lease"'),
    ('title: "Hướng dẫn mua nhà"', 'title: "Homebuyer\'s Guide"'),
    ('title: "Dự án phát triển khu đô thị mới"', 'title: "Waterfront Urban Development"')
]

for target, repl in replacements:
    if target in code:
        code = code.replace(target, repl)
        print(f"Replaced: {target} -> {repl}")
    else:
        print(f"NOT found: {target}")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(code)

print("sample-passages translation completed!")
