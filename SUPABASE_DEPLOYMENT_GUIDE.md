# 🚀 راهنمای جامع دیپلوی و رفع مشکلات Supabase + Netlify

## 📋 فهرست مطالب
1. [پیش‌نیازها](#پیش-نیازها)
2. [تنظیمات Supabase](#تنظیمات-supabase)
3. [تنظیمات Netlify](#تنظیمات-netlify)
4. [رفع مشکلات رایج](#رفع-مشکلات-رایج)
5. [بهینه‌سازی‌ها](#بهینه-سازی-ها)
6. [چک‌لیست نهایی](#چک-لیست-نهایی)

---

## 🔧 پیش‌نیازها

### نرم‌افزارهای موردنیاز:
- Node.js (نسخه 18 یا بالاتر)
- npm یا yarn
- Git
- حساب کاربری Supabase (رایگان)
- حساب کاربری Netlify (رایگان)

---

## 🗄️ تنظیمات Supabase

### مرحله 1: ایجاد پروژه Supabase
1. به [supabase.com](https://supabase.com) بروید و وارد شوید
2. روی "New Project" کلیک کنید
3. اطلاعات پروژه را پر کنید:
   - **Name**: نام پروژه (مثلاً: news-website)
   - **Database Password**: یک رمز قوی انتخاب کنید (حتماً یادداشت کنید!)
   - **Region**: نزدیک‌ترین منطقه به ایران (مثلاً: Frankfurt یا Mumbai)
4. منتظر بمانید تا پروژه ایجاد شود (حدود 2 دقیقه)

### مرحله 2: اجرای Database Schema
1. در پنل Supabase، به **SQL Editor** بروید
2. فایل `database_schema.sql` را باز کنید
3. تمام محتوای آن را کپی کرده و در SQL Editor paste کنید
4. روی **Run** کلیک کنید
5. مطمئن شوید که پیام "Success" نمایش داده شود

### مرحله 3: تنظیم Storage Buckets
1. فایل `storage_policies.sql` را باز کنید
2. محتوای آن را در SQL Editor کپی و اجرا کنید
3. به بخش **Storage** در منوی سمت چپ بروید
4. بررسی کنید که این سه bucket ایجاد شده باشند:
   - ✅ `news-images` (Public)
   - ✅ `videos` (Public)
   - ✅ `profile-images` (Public)

### مرحله 4: دریافت API Keys
1. به **Settings** > **API** بروید
2. اطلاعات زیر را کپی کنید:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon (public) key**: کلید عمومی که با `eyJ...` شروع می‌شود

> ⚠️ **هشدار امنیتی**: هرگز `service_role` key را در frontend استفاده نکنید!

### مرحله 5: تنظیم Authentication
1. به **Authentication** > **Settings** بروید
2. تنظیمات زیر را اعمال کنید:

#### Email Settings:
- **Confirm email**: غیرفعال کنید (برای تست سریع‌تر)
- یا SMTP سفارشی خود را پیکربندی کنید

#### URL Configuration:
```
Site URL: https://your-app.netlify.app
Redirect URLs: 
  - https://your-app.netlify.app/**
  - http://localhost:5173/**  (برای توسعه محلی)
```

### مرحله 6: تنظیم Row Level Security (RLS)
بررسی کنید که Policies زیر ایجاد شده باشند:

#### برای جدول `users`:
- ✅ Public profiles are viewable by everyone
- ✅ Users can insert their own profile
- ✅ Users can update own profile

#### برای جدول `news`:
- ✅ News are viewable by everyone
- ✅ Authenticated users can manage news

#### برای جدول `category`:
- ✅ Categories are viewable by everyone
- ✅ Authenticated users can create/update/delete

#### برای جدول `comments`:
- ✅ Comments viewable by everyone
- ✅ Anyone can insert comments
- ✅ Authenticated users can manage comments

---

## 🌐 تنظیمات Netlify

### مرحله 1: آماده‌سازی پروژه
در ترمینال، در پوشه `frontend2` دستورات زیر را اجرا کنید:

```bash
cd frontend2

# نصب dependencies
npm install

# ایجاد فایل .env.production
echo "VITE_SUPABASE_URL=https://your-project.supabase.co" > .env.production
echo "VITE_SUPABASE_ANON_KEY=your-anon-key" >> .env.production

# تست بیلد محلی
npm run build
```

### مرحله 2: دیپلوی روی Netlify

#### روش 1: از طریق Git (توصیه می‌شود)
1. کد را در GitHub/GitLab قرار دهید
2. به [netlify.com](https://netlify.com) بروید
3. روی "Add new site" > "Import an existing project" کلیک کنید
4. مخزن Git خود را انتخاب کنید
5. تنظیمات Build را وارد کنید:

```yaml
Base directory: frontend2
Build command: npm run build
Publish directory: frontend2/dist
```

6. **Environment Variables** را اضافه کنید:
```
VITE_SUPABASE_URL = https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY = eyJhbGciOiJ...
```

7. روی "Deploy site" کلیک کنید

#### روش 2: Drag & Drop
1. در پوشه `frontend2` دستور `npm run build` را اجرا کنید
2. پوشه `dist` ایجاد می‌شود
3. آن را به Netlify Drop Zone بکشید

### مرحله 3: تنظیم Redirects
فایل `frontend2/public/_redirects` باید شامل این خط باشد:

```
/*    /index.html   200
```

این کار باعث می‌شود React Router به درستی کار کند.

### مرحله 4: تنظیم Custom Domain (اختیاری)
1. در Netlify، به **Domain settings** بروید
2. روی "Add custom domain" کلیک کنید
3. دامنه خود را وارد کنید
4. DNS records را مطابق راهنما تنظیم کنید

---

## 🐛 رفع مشکلات رایج

### مشکل 1: عکس‌ها آپلود نمی‌شوند
**علت‌های احتمالی:**
- ❌ Storage buckets ایجاد نشده‌اند
- ❌ Policies درست تنظیم نشده‌اند
- ❌ فرمت فایل مجاز نیست
- ❌ حجم فایل بیش از حد مجاز است

**راه‌حل:**
```sql
-- بررسی وجود buckets
SELECT * FROM storage.buckets;

-- بررسی policies
SELECT * FROM pg_policies WHERE tablename = 'objects';

-- اگر bucket وجود ندارد، دوباره storage_policies.sql را اجرا کنید
```

### مشکل 2: ارور 401 Unauthorized
**علت‌های احتمالی:**
- ❌ کاربر لاگین نیست
- ❌ Session منقضی شده
- ❌ RLS Policy اجازه دسترسی نمی‌دهد

**راه‌حل:**
```javascript
// در Console مرورگر بررسی کنید:
const { data: { session } } = await supabase.auth.getSession();
console.log('Current session:', session);

// اگر null بود، دوباره لاگین کنید
```

### مشکل 3: ارور 400 Bad Request در ایجاد خبر
**علت‌های احتمالی:**
- ❌ فیلد `userId` با UUID مطابقت ندارد
- ❌ فیلد `catId` عدد نیست
- ❌ فیلدهای الزامی خالی هستند

**راه‌حل:**
```javascript
// در context.jsx بررسی کنید که:
const newsData = {
  userId: userId, // باید UUID باشد
  catId: parseInt(data.catId), // باید number باشد
  title: data.title, // نباید خالی باشد
  description: data.description, // نباید خالی باشد
  // ...
};
```

### مشکل 4: سایت بعد از دیپلوی خیلی کند است
**علت‌های احتمالی:**
- ❌ همه اخبار یکجا لود می‌شوند
- ❌ تصاویر optimize نشده‌اند
- ❌ Pagination فعال نیست

**راه‌حل:**
✅ از context بهینه شده استفاده کنید که pagination دارد
✅ تصاویر را قبل از آپلود فشرده کنید
✅ از lazy loading برای تصاویر استفاده کنید

### مشکل 5: ارور CORS
**علت:**
Domain شما در Supabase تایید نشده

**راه‌حل:**
1. به Supabase > **Settings** > **API** بروید
2. در بخش "URL Configuration" دامنه Netlify خود را اضافه کنید:
```
https://your-app.netlify.app
```

### مشکل 6: تغییرات بعد از دیپلوی اعمال نمی‌شوند
**راه‌حل:**
```bash
# در Netlify Dashboard:
1. به "Deploys" بروید
2. روی "Trigger deploy" > "Clear cache and deploy" کلیک کنید
```

---

## ⚡ بهینه‌سازی‌ها

### 1. بهینه‌سازی تصاویر
```javascript
// قبل از آپلود، تصاویر را resize کنید
import imageCompression from 'browser-image-compression';

const options = {
  maxSizeMB: 1,
  maxWidthOrHeight: 1920,
  useWebWorker: true
};

const compressedFile = await imageCompression(file, options);
```

### 2. Lazy Loading برای اخبار
```jsx
// در ViewNews.jsx
import { useEffect, useState, useCallback } from 'react';

const ViewNews = () => {
  const { handleNews, newsList, newsLoading, newsPage, setNewsPage, newsTotalPages } = useContext(AdminContext);
  
  useEffect(() => {
    handleNews(1); // صفحه اول
  }, []);
  
  const loadMore = () => {
    if (newsPage < newsTotalPages && !newsLoading) {
      setNewsPage(newsPage + 1);
      handleNews(newsPage + 1);
    }
  };
  
  return (
    // ...
    <button onClick={loadMore} disabled={newsLoading}>
      {newsLoading ? 'در حال بارگذاری...' : 'نمایش بیشتر'}
    </button>
  );
};
```

### 3. Caching برای بهبود سرعت
```javascript
// در supabaseHelpers.js قبلاً اضافه شده:
import { getCachedItem } from '../utils/supabaseHelpers';

// استفاده:
const news = await getCachedItem('news', newsId, 5 * 60 * 1000); // cache for 5 min
```

### 4. Optimistic Updates
```javascript
// در deleteNews:
const deleteNews = async (id) => {
  // ابتدا از لیست حذف کنید (optimistic)
  setNewsList(prev => prev.filter(n => n.id !== id));
  
  // سپس از سرور حذف کنید
  const { error } = await supabase.from('news').delete().eq('id', id);
  
  if (error) {
    // اگر خطا، دوباره لیست را لود کنید
    handleNews();
  }
};
```

---

## ✅ چک‌لیست نهایی

### قبل از دیپلوی:
- [ ] `database_schema.sql` در Supabase اجرا شده
- [ ] `storage_policies.sql` در Supabase اجرا شده
- [ ] Storage buckets ایجاد شده و Public هستند
- [ ] RLS Policies فعال هستند
- [ ] Authentication Settings درست تنظیم شده
- [ ] Environment Variables تنظیم شده‌اند
- [ ] Build محلی بدون خطا انجام می‌شود
- [ ] فایل `_redirects` در پوشه `public` وجود دارد

### بعد از دیپلوی:
- [ ] سایت باز می‌شود
- [ ] لاگین کار می‌کند
- [ ] ثبت‌نام کار می‌کند
- [ ] ایجاد دسته‌بندی کار می‌کند
- [ ] آپلود (عکس کار می‌کند
- [ ] ایجاد خبر با عکس کار می‌کند
- [ ] ویرایش خبر کار می‌کند
- [ ] حذف خبر کار می‌کند
- [ ] نمایش اخبار در صفحه اصلی کار می‌کند
- [ ] کامنت‌ها کار می‌کنند

---

## 📊 مانیتورینگ و دیباگ

### بررسی لاگ‌ها در Netlify
```
Netlify Dashboard > Deploys > [Your Deploy] > Deploy log
```

### بررسی خطاها در Supabase
```
Supabase Dashboard > Logs > [Select type]
```

### دیباگ در مرورگر
```javascript
// در Console:
localStorage.debug = 'supabase:*'
// سپس صفحه را رفرش کنید
```

---

## 🆘 دریافت کمک

اگر مشکلی برطرف نشد:

1. **خطا را کپی کنید**: از Console مرورگر یا Network Tab
2. **Screenshots بگیرید**: از قسمت‌های مربوطه در Supabase/Netlify
3. **لاگ‌ها را بررسی کنید**: در Netlify Deploy Log
4. **مستندات را بخوانید**:
   - [Supabase Docs](https://supabase.com/docs)
   - [Netlify Docs](https://docs.netlify.com)

---

## 📝 نکات مهم

1. **هرگز** Service Role Key را در frontend استفاده نکنید
2. **همیشه** از HTTPS استفاده کنید
3. تصاویر را قبل از آپلود **فشرده** کنید
4. از **Pagination** برای لیست‌های بزرگ استفاده کنید
5. **RLS Policies** را با دقت تنظیم کنید - امنیت مهم است!
6. Environment Variables را در Netlify **دوباره بررسی** کنید
7. **Backup** منظم از دیتابیس بگیرید

---

## 🎉 موفق باشید!

حالا پروژه شما آماده استفاده در Production است!

برای سوالات بیشتر، به مستندات رسمی مراجعه کنید یا در جامعه‌های آنلاین کمک بخواهید.
