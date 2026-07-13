# O'quv Markazi LMS - REST API

To'liq LMS platformasi uchun alohida REST API. Express.js + TypeScript + JWT auth.

## Tez boshlash

### 1. Convex URL ni olish

```bash
# main repo'da (lms-platform):
cat convex.json
# yoki Convex dashboard dan oling
```

### 2. O'rnatish

```bash
cp .env.example .env
# .env faylini ochib CONVEX_URL va boshqa sozlamalarni kiriting
npm install
```

### 3. Ishga tushirish

```bash
npm run dev
# Server http://localhost:3001 da ishlaydi
# Swagger docs: http://localhost:3001/docs
```

## API Endpointlar

### Auth

Barcha API'ga `Authorization: Bearer <convex-auth-token>` header'ini yuboring.

Tokenni frontend login orqali oling:
```javascript
// Frontend da login qiling va tokenni oling
const token = await convexAuthToken();
// Keyin API'ga yuboring
fetch("http://localhost:3001/api/courses", {
  headers: { Authorization: `Bearer ${token}` }
});
```

### Endpointlar ro'yxati

| Method | Endpoint | Tavsif | Auth |
|--------|----------|--------|------|
| GET | `/api/courses` | Published kurslar | - |
| GET | `/api/courses/:slug` | Kurs detali | - |
| POST | `/api/courses` | Yangi kurs yaratish | ✅ |
| PATCH | `/api/courses/:id` | Kursni yangilash | ✅ |
| DELETE | `/api/courses/:id` | Kursni o'chirish | ✅ |
| POST | `/api/courses/:id/publish` | Nashr qilish/olib tashlash | ✅ |
| GET | `/api/courses/mine/teacher` | O'qituvchi kurslari | ✅ |
| GET | `/api/courses/enrolled/mine` | Student yozilgan kurslar | ✅ |
| | | | |
| GET | `/api/modules/course/:courseId` | Modullar ro'yxati | - |
| POST | `/api/modules` | Modul yaratish | ✅ |
| PATCH | `/api/modules/:id` | Modulni yangilash | ✅ |
| DELETE | `/api/modules/:id` | Modulni o'chirish | ✅ |
| POST | `/api/modules/reorder` | Modullarni tartiblash | ✅ |
| | | | |
| POST | `/api/lessons` | Dars yaratish | ✅ |
| PATCH | `/api/lessons/:id` | Darsni yangilash | ✅ |
| DELETE | `/api/lessons/:id` | Darsni o'chirish | ✅ |
| POST | `/api/lessons/:id/complete` | Darsni tugatish | ✅ |
| GET | `/api/lessons/progress/:courseId` | Progress | ✅ |
| | | | |
| POST | `/api/enrollments/:courseId` | Kursga yozilish | ✅ |
| DELETE | `/api/enrollments/:courseId` | Kursdan chiqish | ✅ |
| GET | `/api/enrollments/:courseId/check` | Tekshirish | - |
| GET | `/api/enrollments/:courseId/count` | O'quvchilar soni | - |
| GET | `/api/enrollments/:courseId/students` | O'quvchilar | ✅ |
| | | | |
| GET | `/api/quizzes/lesson/:lessonId` | Dars testi (student) | - |
| POST | `/api/quizzes` | Test yaratish | ✅ |
| POST | `/api/quizzes/:quizId/attempts/start` | Testni boshlash | ✅ |
| POST | `/api/quizzes/attempts/:id/answer` | Javob saqlash | ✅ |
| POST | `/api/quizzes/attempts/:id/submit` | Testni topshirish | ✅ |
| | | | |
| GET | `/api/users/me` | Joriy foydalanuvchi | - |
| | | | |
| GET | `/api/analytics/platform` | Platforma statistikasi | ✅ |
| GET | `/api/analytics/users` | Foydalanuvchilar | ✅ |
| PATCH | `/api/analytics/users/:id/role` | Rolni o'zgartirish | ✅ |
| | | | |
| GET | `/api/certificates` | Mening sertifikatlarim | - |
| POST | `/api/certificates/generate/:courseId` | Sertifikat yaratish | ✅ |
| | | | |
| GET | `/api/notifications` | Bildirishnomalar | - |
| POST | `/api/notifications/:id/read` | O'qilgan deb belgilash | ✅ |
| POST | `/api/notifications/read-all` | Barchasini o'qish | ✅ |

### To'liq hujjat

Swagger UI: http://localhost:3001/docs

## Struktura

```
lms-api/
├── src/
│   ├── index.ts           # Express server
│   ├── config.ts          # Environment config
│   ├── convex.ts          # Convex HTTP client
│   ├── swagger.ts         # Swagger/OpenAPI docs
│   ├── middleware/
│   │   ├── auth.ts        # JWT auth middleware
│   │   └── error.ts       # Error handler
│   └── routes/
│       ├── courses.ts     # Kurslar CRUD
│       ├── modules.ts     # Modullar CRUD
│       ├── lessons.ts     # Darslar CRUD + progress
│       ├── enrollments.ts # Yozilish/chiqish
│       ├── quizzes.ts     # Testlar + attempts
│       ├── assignments.ts # Topshiriqlar
│       ├── submissions.ts # Javoblar + baholash
│       ├── users.ts       # Foydalanuvchilar
│       ├── analytics.ts   # Admin statistikasi
│       ├── certificates.ts# Sertifikatlar
│       ├── notifications.ts# Bildirishnomalar
│       ├── imports.ts     # Import
│       └── materials.ts   # Materiallar
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```

## Deploy

### Vercel
```bash
npm i -g vercel
vercel
```

### Railway / Render
1. Reponi GitHub ga push qiling
2. Railway/Render da "New Project" → GitHub repo
3. Build command: `npm run build`
4. Start command: `npm start`
5. Environment variables qo'shing
