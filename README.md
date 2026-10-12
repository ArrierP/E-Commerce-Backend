<div align="center">
  <h1>🚀 E-Commerce Full-Stack Enterprise System</h1>
  <p><b>A modern, high-performance E-Commerce platform built with Node.js, TypeScript, MongoDB, and React.</b></p>

  <p>
    <img src="https://img.shields.io/badge/Node.js-18%2B-green?style=for-the-badge&logo=node.js" alt="Node.js">
    <img src="https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript" alt="TypeScript">
    <img src="https://img.shields.io/badge/Express-4.x-lightgrey?style=for-the-badge&logo=express" alt="Express">
    <img src="https://img.shields.io/badge/MongoDB-Mongoose-brightgreen?style=for-the-badge&logo=mongodb" alt="MongoDB">
    <img src="https://img.shields.io/badge/Redis-Caching-red?style=for-the-badge&logo=redis" alt="Redis">
    <img src="https://img.shields.io/badge/Docker-Containerization-blue?style=for-the-badge&logo=docker" alt="Docker">
  </p>
</div>

---

## 📖 Giới thiệu Dự án
Hệ thống Thương mại Điện tử toàn diện được thiết kế theo kiến trúc **Modular Monolith** kết hợp **Event-driven Background Processing**. Dự án tập trung giải quyết các bài toán thực tế của doanh nghiệp như xử lý đồng thời dữ liệu (Concurrency Control), tối ưu hiệu năng bằng Caching, bảo mật xác thực phân quyền chặt chẽ và cung cấp hệ thống báo cáo thống kê kinh doanh (Analytics Dashboard).

---

## 🛠️ Tech Stack & Công nghệ sử dụng

### **Backend:**
*   **Language & Runtime:** Node.js, **TypeScript**
*   **Framework:** Express.js
*   **Database:** **MongoDB** (Mongoose ODM, Transactions, Aggregation Pipelines)
*   **Caching & Rate Limiting:** **Redis**
*   **Background Jobs:** **BullMQ** (Xử lý hàng đợi gửi email/tác vụ nền)
*   **Validation:** **Zod** (Type-safe request validation)
*   **Authentication:** JWT (Dual Token: Access Token + Refresh Token flow), Bcrypt

### **DevOps & Tools:**
*   **Containerization:** **Docker & Docker Compose** (Chạy đa container: Node app, MongoDB, Redis)
*   **API Testing:** Postman

---

## ✨ Các tính năng cốt lõi (Core Features)

### 1. 🔐 Authentication & Authorization Module
*   Đăng ký và Đăng nhập bảo mật với mật khẩu được hash qua `bcrypt`.
*   Cơ chế **Dual Token (Access Token sống ngắn + Refresh Token sống dài)** giúp bảo mật tối đa.
*   Phân quyền chi tiết (RBAC Middleware) phân định rõ quyền hạn giữa `Customer` và `Admin`.

### 2. 🛍️ Product & Redis Caching Module
*   CRUD sản phẩm đầy đủ phân trang, tìm kiếm theo tên và lọc theo khoảng giá/danh mục.
*   **Redis Caching:** Tích hợp cache cho các truy vấn sản phẩm phổ biến nhằm giảm tải trực tiếp cho MongoDB và tăng tốc độ phản hồi API (**Cache Aside Pattern**).

### 3. 🛒 Order & Concurrency Control (MongoDB Transactions)
*   Quản lý giỏ hàng và quy trình đặt hàng (Checkout).
*   **Xử lý Flash Sale / Quá tải kho:** Sử dụng `Mongoose Sessions & Transactions` để đảm bảo khi tạo đơn hàng, hệ thống thực hiện đồng thời việc kiểm tra, trừ tồn kho và ghi nhận đơn hàng một cách nguyên tử (Atomicity), ngăn chặn tuyệt đối tình trạng bán âm kho.

### 4. ⚙️ Background Jobs với BullMQ
*   Đẩy các tác vụ nặng (như gửi email xác nhận đơn hàng) vào **BullMQ Queue** chạy trên Redis, giúp API trả về phản hồi cho khách hàng ngay lập tức mà không phải chờ đợi.

### 5. 📊 Business Analytics & Dashboards
*   Hệ thống thống kê doanh thu theo thời gian thực sử dụng **MongoDB Aggregation Pipelines**.
*   Báo cáo top sản phẩm bán chạy và trạng thái đơn hàng phục vụ cho Admin Dashboard.

---

## 📂 Cấu trúc Thư mục (Modular Monolith Structure)

```text
src/
├── modules/
│   ├── auth/            # Quản lý tài khoản, đăng nhập, JWT
│   ├── product/         # Quản lý sản phẩm, danh mục
│   ├── cart/            # Giỏ hàng tạm thời
│   ├── order/           # Đặt hàng, transaction kho
│   └── analytics/       # Thống kê doanh thu, báo cáo
│   └── inventory/       # Kiểm tra kho để trừ, và hoàn lại sản phẩm
├── shared/              # Tiện ích dùng chung toàn app
│   ├── config/          # Cấu hình DB, biến môi trường
│   ├── database/        # Kết nối Mongoose
│   ├── middlewares/     # Auth guard, Zod validator, Error handler
│   └── queues/          # Cấu hình BullMQ Workers
├── server.ts            # Điểm khởi chạy ứng dụng
└── app.ts               # Cấu hình Express middleware
```

## 🚀 Hướng dẫn Cài đặt & Chạy Dự án (Local Installation)
*  Cách 1: Chạy bằng Docker Compose

### 1. Clone repository về máy:
```text 
    git clone [https://github.com/username/your-repo-name.git](https://github.com/username/your-repo-name.git)
    cd your-repo-name
```

### 2. Tạo file .env dựa trên file mẫu .env.example và điền thông tin cấu hình.

### 3. Khởi chạy toàn bộ hệ thống (App, MongoDB, Redis):

```text
    docker-compose up --build
 ```

* Cách 2: Chạy thủ công (Manual Setup)

### 1. Cài đặt các dependencies cho Backend:
```text
    npm install
```

### 2. Tạo file .env dựa trên file mẫu .env.example và điền thông tin cấu hình.

### 3. Chạy môi trường phát triển (Development mode):

```text 
    npm run dev
```

## 👤 Tác giả

* Tuấn Huy - Developer - https://github.com/ArrierP