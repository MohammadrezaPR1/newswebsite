
# راهنمای کامل استقرار پروژه با Supabase و Netlify

این راهنما قدم به قدم شما را برای استقرار پروژه راهنمایی می‌کند. ما بکند (Backend) نود جی‌اس را حذف کرده و مستقیماً از **Supabase** به عنوان پایگاه داده و سیستم احراز هویت (Auth) استفاده می‌کنیم تا پروژه کاملاً Serverless و مدرن شود.

## مرحله ۱: تنظیمات Supabase

1. وارد پنل کاربری خود در [Supabase](https://supabase.com/dashboard) شوید و یک پروژه جدید بسازید.
2. به بخش **SQL Editor** در منوی سمت چپ بروید.
3. روی **New Query** کلیک کنید.
4. محتویات فایل `database_schema.sql` که در روت پروژه (کنار همین فایل) ایجاد شده است را کپی کرده و در ادیتور Supabase پیست کنید، سپس دکمه **Run** را بزنید.
   - این کار جداول مورد نیاز (`users`, `news`, `category`, `video`, `comments`) را می‌سازد.
5. به بخش **Storage** بروید و ۳ باکت (Bucket) **Public** (عمومی) بسازید:
   - `news-images`
   - `videos`
   - `profile-images`
   (مطمئن شوید تیک "Public Bucket" را هنگام ساخت می‌زنید).

## مرحله ۲: دریافت کلیدهای API

1. در پروژه Supabase به مسیر **Project Settings** > **API** بروید.
2. مقادیر `Project URL` و `anon public key` را کپی کنید.

## مرحله ۳: تنظیم متغیرهای محیطی

1. در پوشه `frontend2`، یک فایل به نام `.env` بسازید (اگر وجود دارد ویرایش کنید) و مقادیر زیر را در آن قرار دهید:

```env
VITE_SUPABASE_URL=YOUR_SUPABASE_URL
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

(به جای `YOUR_SUPABASE_URL` و `YOUR_SUPABASE_ANON_KEY` مقادیر کپی شده را قرار دهید).

## مرحله ۴: نصب پکیج‌های مورد نیاز

ترمینال را باز کنید و دستور زیر را در پوشه `frontend2` اجرا کنید:

```bash
cd frontend2
npm install @supabase/supabase-js
```

## مرحله ۵: تغییر کدهای فرانت‌اند (خودکار انجام می‌شود)

من (ربات) کدهای `context` های شما را بازنویسی می‌کنم تا به جای `axios` (که به لوکال‌هاست ۵۰۰۰ وصل بود) از `supabase` استفاده کنند.

## مرحله ۶: استقرار در Netlify

1. پروژه را در گیت‌هاب (GitHub) پوش کنید.
2. وارد [Netlify](https://app.netlify.com/) شوید.
3. روی **Add new site** > **Import an existing project** کلیک کنید.
4. ریپازیتوری خود را انتخاب کنید.
5. در تنظیمات بیلد:
   - **Base directory**: `frontend2`
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
6. دکمه **Deploy** را بزنید.
7. بعد از استقرار، به بخش **Site configuration** > **Environment variables** در نتلیفای بروید و همان متغیرهای `VITE_SUPABASE_URL` و `VITE_SUPABASE_ANON_KEY` را اضافه کنید.

---

همین! وب‌سایت شما اکنون بدون نیاز به سرور جداگانه Node.js و با قدرت Supabase کار می‌کند.
