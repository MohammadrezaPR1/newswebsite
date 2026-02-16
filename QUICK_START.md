# ⚡ راهنمای شروع سریع (Quick Start)

این راهنما برای راه‌اندازی فوری پروژه است. برای جزئیات بیشتر به `SUPABASE_DEPLOYMENT_GUIDE.md` مراجعه کنید.

---

## 📋 پیش‌نیاز (5 دقیقه)

1. ✅ حساب رایگان [Supabase](https://supabase.com)
2. ✅ حساب رایگان [Netlify](https://netlify.com)
3. ✅ Node.js نصب شده باشد

---

## 🚀 مرحله 1: تنظیم Supabase (10 دقیقه)

### 1.1 ساخت پروژه
```
1. به supabase.com بروید و Login کنید
2. "New Project" بزنید
3. نام پروژه و رمز دیتابیس را وارد کنید
4. Region را انتخاب کنید (Frankfurt توصیه می‌شود)
5. "Create Project" بزنید و 2 دقیقه صبر کنید
```

### 1.2 اجرای SQL Scripts
```
1. در پنل Supabase، به "SQL Editor" بروید
2. محتوای فایل database_schema.sql را کپی و اجرا کنید
3. محتوای فایل storage_policies.sql را کپی و اجرا کنید
4. اگر موفق بود، پیام "Success" نمایش می‌یابد
```

### 1.3 دریافت Keys
```
1. به Settings > API بروید
2. این دو مورد را کپی کنید:
   - Project URL: https://xxxxx.supabase.co
   - anon public: eyJhbGc...
```

---

## 🌐 مرحله 2: تنظیم Frontend (5 دقیقه)

### 2.1 نصب Dependencies
```powershell
cd frontend2
npm install
```

### 2.2 تنظیم Environment Variables
**فایل `.env` را ویرایش کنید:**
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

### 2.3 تست محلی
```powershell
npm run dev
```

سایت روی `http://localhost:5173` باز می‌شود.

---

## ✅ مرحله 3: تست عملکرد (5 دقیقه)

### 3.1 اجرای Test Script
```powershell
# در پوشه frontend2
node test-supabase.js
```

اگر همه تست‌ها passed شدند، ادامه دهید.

### 3.2 تست دستی ساده
```
1. به پنل ادمین بروید: http://localhost:5173/admin-login
2. اکانت ادمین بسازید:
   Email: admin@test.com
   Password: Test123456!
3. Login کنید
4. یک category بسازید: "تست"
5. یک خبر با عکس بسازید
6. اگر موفق شد، همه چیز OK است!
```

---

## 🚀 مرحله 4: Deploy روی Netlify (10 دقیقه)

### 4.1 Build پروژه
```powershell
npm run build
```

پوشه `dist` ایجاد می‌شود.

### 4.2 Netlify Deploy

#### روش 1: Drag & Drop (ساده‌تر)
```
1. به netlify.com بروید
2. پوشه dist را به صفحه بکشید
3. تمام!
```

#### روش 2: Git (حرفه‌ای‌تر)
```
1. کد را push کنید در GitHub
2. در Netlify "Import from Git" بزنید
3. مخزن را انتخاب کنید
4. تنظیمات:
   - Base directory: frontend2
   - Build command: npm run build
   - Publish directory: frontend2/dist
5. Environment Variables را اضافه کنید:
   VITE_SUPABASE_URL = ...
   VITE_SUPABASE_ANON_KEY = ...
6. Deploy بزنید
```

### 4.3 تنظیم نهایی Supabase
```
1. URL سایت Netlify را کپی کنید (مثلاً: https://mysite.netlify.app)
2. به Supabase > Settings > API بروید
3. در "Site URL" آن را paste کنید
4. در "Redirect URLs" اضافه کنید:
   https://mysite.netlify.app/**
```

---

## ✅ مرحله 5: تست Production (5 دقیقه)

از `VERIFICATION_CHECKLIST.md` استفاده کنید:

```
[ ] سایت باز می‌شود
[ ] Login کار می‌کند
[ ] ثبت‌نام کار می‌کند
[ ] ایجاد category کار می‌کند
[ ] آپلود عکس کار می‌کند
[ ] ایجاد خبر کار می‌کند
[ ] نمایش در صفحه اصلی OK است
```

---

## 🐛 مشکل دارید؟

### خطای "عکس آپلود نمی‌شود"
```sql
-- در SQL Editor Supabase اجرا کنید:
SELECT * FROM storage.buckets;

-- اگر خالی بود، storage_policies.sql را دوباره اجرا کنید
```

### خطای 401 Unauthorized
```
- مطمئن شوید که logged in هستید
- Session را clear کنید و دوباره login کنید
```

### سایت کند است
```javascript
// در ViewNews.jsx بررسی کنید که pagination فعال باشد:
const { handleNews, newsPage, newsTotalPages } = useContext(AdminContext);

useEffect(() => {
  handleNews(1, 10); // 10 items per page
}, []);
```

### جزئیات بیشتر
- `SUPABASE_DEPLOYMENT_GUIDE.md` - راهنمای کامل
- `VERIFICATION_CHECKLIST.md` - چک‌لیست تست کامل
- `REFACTORING_REPORT.md` - گزارش تغییرات

---

## 📊 وضعیت فعلی پروژه

### ✅ کارهای انجام شده:
- [x] بهینه‌سازی Context با pagination
- [x] اضافه شدن helper functions
- [x] رفع مشکل آپلود عکس
- [x] اضافه شدن retry mechanism
- [x] بهبود error handling
- [x] اضافه شدن loading states
- [x] ایجاد storage policies
- [x] مستندسازی کامل

### ✅ آماده Production:
- [x] Database schema
- [x] Storage setup
- [x] Authentication
- [x] CRUD operations
- [x] File uploads
- [x] Security (RLS)
- [x] Performance optimization

---

## 🎯 چک‌لیست نهایی

قبل از Production بررسی کنید:

```
[ ] database_schema.sql اجرا شد
[ ] storage_policies.sql اجرا شد
[ ] Storage buckets و public هستند (news-images, videos, profile-images)
[ ] Environment variables صحیح است
[ ] Test script passed شد
[ ] Build محلی بدون خطا
[ ] Deploy روی Netlify موفق
[ ] تست دستی کامل شد
[ ] همه چیز درست کار می‌کند
```

---

## 🎉 تمام!

حالا پروژه شما Live است و آماده استفاده!

### لینک‌های مفید:
- 📚 [راhhنمای کامل](./SUPABASE_DEPLOYMENT_GUIDE.md)
- ✅ [چک‌لیست تست](./VERIFICATION_CHECKLIST.md)
- 📊 [گزارش تغییرات](./REFACTORING_REPORT.md)
- 🗄️ [Database Schema](./database_schema.sql)
- 📦 [Storage Policies](./storage_policies.sql)

**موفق باشید! 🚀**

---

## 💡 نکات مهم

1. **Backup**: هر هفته از Supabase backup بگیرید
2. **Monitoring**: لاگ‌ها را در Supabase و Netlify چک کنید
3. **Updates**: پکیج‌ها را به‌روز نگه دارید
4. **Security**: هرگز Service Role Key را commit نکنید
5. **Performance**: از pagination برای لیست‌های بزرگ استفاده کنید

---

## 📞 پشتیبانی

سوال دارید؟
1. ابتدا `SUPABASE_DEPLOYMENT_GUIDE.md` را بخوانید
2. `VERIFICATION_CHECKLIST.md` را کامل کنید
3. Console و Network errors را بررسی کنید
4. Supabase Logs را چک کنید
