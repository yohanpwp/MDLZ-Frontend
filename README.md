# Invoice Validation System

ระบบตรวจสอบและยืนยันความถูกต้องของใบแจ้งหนี้ (Invoice Validation System) เป็นเว็บแอปพลิเคชันที่พัฒนาด้วย React และ TailwindCSS สำหรับการจัดการและตรวจสอบใบแจ้งหนี้ทางการเงิน

## 🚀 คุณสมบัติหลัก

- **Dashboard**: หน้าแสดงภาพรวมและสถิติการตรวจสอบ
- **Master Data Management**: จัดการข้อมูลหลัก (นำเข้า/ส่งออกข้อมูล)
- **Component Management**: จัดการลูกค้า, สินค้า, ใบแจ้งหนี้, และใบลดหนี้
- **User Management**: จัดการผู้ใช้และสิทธิ์การเข้าถึง
- **Reports**: สร้างและจัดการรายงาน
- **Responsive Design**: รองรับการใช้งานบนหน้าจอขนาดต่างๆ
- **Dark Header**: ส่วนหัวสีน้ำเงินเข้มที่ดูเป็นมืออาชีพ
- **Collapsible Sidebar**: แถบด้านข้างที่สามารถย่อ/ขยายได้

## 🛠️ เทคโนโลยีที่ใช้

- **Frontend Framework**: React 18.2.0
- **Build Tool**: Vite 5.2.0
- **Styling**: TailwindCSS 4.1.12
- **UI Components**: Shadcn UI pattern
- **Icons**: Lucide React
- **Routing**: React Router DOM 7.8.2
- **State Management**: Redux Toolkit 2.8.2
- **Utilities**: 
  - Class Variance Authority (CVA)
  - Tailwind Merge
  - clsx

## 📁 โครงสร้างโปรเจค

```
invoice-validation-system/
├── public/                     # ไฟล์สาธารณะ
├── src/
│   ├── assets/                 # รูปภาพและไฟล์สื่อ
│   ├── components/             # คอมโพเนนต์ React
│   │   ├── layout/            # คอมโพเนนต์เลย์เอาต์
│   │   │   ├── Header.jsx     # ส่วนหัวของเว็บไซต์
│   │   │   ├── Sidebar.jsx    # แถบด้านข้าง
│   │   │   ├── Layout.jsx     # เลย์เอาต์หลัก
│   │   │   └── index.js       # ไฟล์ export
│   │   └── ui/                # คอมโพเนนต์ UI พื้นฐาน
│   │       ├── Button.jsx     # ปุ่ม
│   │       ├── Tooltip.jsx    # คำแนะนำเครื่องมือ
│   │       └── index.js       # ไฟล์ export
│   ├── pages/                  # หน้าเว็บต่างๆ
│   │   ├── Dashboard.jsx       # หน้าแดชบอร์ด
│   │   ├── MasterData/        # หน้าจัดการข้อมูลหลัก
│   │   │   ├── ImportData.jsx
│   │   │   └── ExportData.jsx
│   │   ├── Components/        # หน้าจัดการคอมโพเนนต์
│   │   │   ├── Customers.jsx
│   │   │   ├── Products.jsx
│   │   │   ├── Invoices.jsx
│   │   │   ├── CreditNotes.jsx
│   │   │   └── Reports.jsx
│   │   ├── Roles/             # หน้าจัดการบทบาท
│   │   │   └── UserManagement.jsx
│   │   ├── Settings/          # หน้าการตั้งค่า
│   │   │   └── TermsConditions.jsx
│   │   └── index.js           # ไฟล์ export
│   ├── redux/                  # Redux store และ slices
│   │   ├── store.js           # การตั้งค่า Redux store
│   │   └── hooks.js           # Redux hooks
│   ├── router/                 # การตั้งค่า routing
│   │   └── AppRouter.jsx      # เส้นทางหลัก
│   ├── services/              # API services
│   ├── types/                 # ประเภทข้อมูล
│   │   └── propTypes.js       # PropTypes definitions
│   ├── utils/                 # ฟังก์ชันช่วยเหลือ
│   │   └── cn.js              # Utility สำหรับ className
│   ├── App.jsx                # คอมโพเนนต์หลัก
│   ├── main.jsx               # จุดเริ่มต้นแอปพลิเคชัน
│   └── index.css              # สไตล์หลัก
├── .kiro/                     # การตั้งค่า Kiro IDE
│   └── specs/                 # เอกสารข้อกำหนด
├── package.json               # การตั้งค่า npm
├── postcss.config.js          # การตั้งค่า PostCSS
├── vite.config.js             # การตั้งค่า Vite
└── README.md                  # เอกสารนี้
```

## 🔧 การติดตั้งและเริ่มต้นใช้งาน

### ข้อกำหนดระบบ

- Node.js 16.0.0 หรือสูงกว่า
- npm 7.0.0 หรือสูงกว่า

### ขั้นตอนการติดตั้ง

1. **Clone โปรเจค**
   ```bash
   git clone <repository-url>
   cd invoice-validation-system
   ```

2. **ติดตั้ง dependencies**
   ```bash
   npm install
   ```

3. **เริ่มต้น development server**
   ```bash
   npm run dev
   ```
   เว็บไซต์จะเปิดที่ `http://localhost:5173`

4. **Build สำหรับ production**
   ```bash
   npm run build
   ```

5. **Preview production build**
   ```bash
   npm run preview
   ```

### คำสั่ง npm ที่มีให้ใช้

- `npm run dev` - เริ่ม development server
- `npm run build` - สร้าง production build
- `npm run preview` - ดูตัวอย่าง production build
- `npm run lint` - ตรวจสอบ code style

## 🎨 การออกแบบ UI/UX

### ระบบสี (Color System)

โปรเจคใช้ระบบสีที่กำหนดไว้ใน TailwindCSS v4:

- **Primary**: สีน้ำเงิน (`hsl(221.2 83.2% 53.3%)`)
- **Background**: สีขาว/เทาเข้ม
- **Header**: สีน้ำเงินเข้ม (`bg-slate-800`)
- **Sidebar**: สีขาวพร้อมเงา

### คุณสมบัติ Responsive

- **Mobile First**: ออกแบบสำหรับมือถือก่อน
- **Breakpoints**: 
  - `sm`: 640px+
  - `md`: 768px+
  - `lg`: 1024px+ (จุดที่ sidebar แสดงแบบ desktop)
  - `xl`: 1280px+

### การใช้งาน Sidebar

- **Mobile**: แสดงแบบ overlay เมื่อกดปุ่มเมนู
- **Desktop**: 
  - แสดงถาวรด้านซ้าย
  - สามารถย่อ/ขยายได้ด้วยปุ่มใน header
  - เมื่อย่อจะแสดงเฉพาะไอคอนพร้อม tooltip

## 🔧 การพัฒนาต่อ

### การเพิ่มหน้าใหม่

1. สร้างไฟล์ component ใน `src/pages/`
2. เพิ่ม route ใน `src/router/AppRouter.jsx`
3. เพิ่มลิงก์ใน navigation ที่ `src/components/layout/Sidebar.jsx`

### การเพิ่ม UI Component

1. สร้างไฟล์ใน `src/components/ui/`
2. ใช้ pattern ของ Shadcn UI
3. เพิ่ม PropTypes สำหรับ type checking
4. Export ใน `src/components/ui/index.js`

### การจัดการ State

โปรเจคใช้ Redux Toolkit:
- Store configuration: `src/redux/store.js`
- Hooks: `src/redux/hooks.js`
- Slices: สร้างใน `src/redux/slices/` (ยังไม่ได้สร้าง)

## 📝 การใช้งานคุณสมบัติหลัก

### Dashboard
- แสดงสถิติการตรวจสอบใบแจ้งหนี้
- กิจกรรมล่าสุด
- ปุ่มด่วนสำหรับงานที่ใช้บ่อย

### Master Data
- **Import Data**: นำเข้าข้อมูลลูกค้า, สินค้า, และข้อมูลอ้างอิง
- **Export Data**: ส่งออกข้อมูลสำหรับสำรองหรือวิเคราะห์

### Components
- **Customers**: จัดการข้อมูลลูกค้า
- **Products**: จัดการแคตตาล็อกสินค้า
- **Invoices**: ตรวจสอบและยืนยันใบแจ้งหนี้
- **Credit Notes**: จัดการใบลดหนี้
- **Reports**: สร้างและจัดการรายงาน

## 🤝 การมีส่วนร่วม

1. Fork โปรเจค
2. สร้าง feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit การเปลี่ยนแปลง (`git commit -m 'Add some AmazingFeature'`)
4. Push ไปยัง branch (`git push origin feature/AmazingFeature`)
5. เปิด Pull Request

## 📄 License

โปรเจคนี้อยู่ภายใต้ MIT License

## 📞 ติดต่อ

สำหรับคำถามหรือการสนับสนุน กรุณาติดต่อทีมพัฒนา

---

**หมายเหตุ**: โปรเจคนี้อยู่ในระหว่างการพัฒนา คุณสมบัติบางอย่างอาจยังไม่สมบูรณ์