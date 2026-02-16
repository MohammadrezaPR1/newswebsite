
-- تابع کمکی برای تشخیص ادمین (Admin)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- بررسی می‌کند که آیا کاربر جاری در جدول کاربران مقدار isAdmin=true دارد یا خیر
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND "isAdmin" = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 1. جدول دسته‌بندی‌ها (Category)
-- ==========================================
ALTER TABLE "public"."category" ENABLE ROW LEVEL SECURITY;
-- حذف سیاست‌های قبلی
DROP POLICY IF EXISTS "Public Read Category" ON "public"."category";
DROP POLICY IF EXISTS "Admins Write Category" ON "public"."category";
DROP POLICY IF EXISTS "Admin Insert Category" ON "public"."category";
DROP POLICY IF EXISTS "Admin Update Category" ON "public"."category";
DROP POLICY IF EXISTS "Admin Delete Category" ON "public"."category";

-- مشاهده برای همه آزاد
CREATE POLICY "Public Read Category" ON "public"."category" FOR SELECT USING (true);
-- تغییرات فقط برای ادمین
CREATE POLICY "Admin Insert Category" ON "public"."category" FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admin Update Category" ON "public"."category" FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admin Delete Category" ON "public"."category" FOR DELETE USING (public.is_admin());


-- ==========================================
-- 2. جدول اخبار (News)
-- ==========================================
ALTER TABLE "public"."news" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read News" ON "public"."news";
DROP POLICY IF EXISTS "Admin Insert News" ON "public"."news";
DROP POLICY IF EXISTS "Admin Update News" ON "public"."news";
DROP POLICY IF EXISTS "Admin Delete News" ON "public"."news";

CREATE POLICY "Public Read News" ON "public"."news" FOR SELECT USING (true);
CREATE POLICY "Authenticated Manage News" ON "public"."news" FOR ALL USING (auth.role() = 'authenticated');


-- ==========================================
-- 3. جدول ویدیوها (Video)
-- ==========================================
ALTER TABLE "public"."video" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read Video" ON "public"."video";
DROP POLICY IF EXISTS "Admin Insert Video" ON "public"."video";
DROP POLICY IF EXISTS "Admin Update Video" ON "public"."video";
DROP POLICY IF EXISTS "Admin Delete Video" ON "public"."video";

CREATE POLICY "Public Read Video" ON "public"."video" FOR SELECT USING (true);
CREATE POLICY "Authenticated Manage Video" ON "public"."video" FOR ALL USING (auth.role() = 'authenticated');


-- ==========================================
-- 4. جدول کاربران (Users)
-- ==========================================
ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users Read Own Profile" ON "public"."users";
DROP POLICY IF EXISTS "Admins Read All Profiles" ON "public"."users";
DROP POLICY IF EXISTS "Users Update Own Profile" ON "public"."users";
DROP POLICY IF EXISTS "Admins Update All Profiles" ON "public"."users";
DROP POLICY IF EXISTS "Admins Delete Profiles" ON "public"."users";
DROP POLICY IF EXISTS "Insert Profile" ON "public"."users";

-- مشاهده: هر کس پروفایل خود را ببیند، ادمین همه را
CREATE POLICY "Users Read Own Profile" ON "public"."users" FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins Read All Profiles" ON "public"."users" FOR SELECT USING (public.is_admin());

-- ویرایش: هر کس پروفایل خود را، ادمین همه را
CREATE POLICY "Users Update Own Profile" ON "public"."users" FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins Update All Profiles" ON "public"."users" FOR UPDATE USING (public.is_admin());

-- حذف: فقط ادمین
CREATE POLICY "Admins Delete Profiles" ON "public"."users" FOR DELETE USING (public.is_admin());

-- ساخت پروفایل: خود کاربر (هنگام ثبت نام) یا ادمین
CREATE POLICY "Insert Profile" ON "public"."users" FOR INSERT WITH CHECK (auth.uid() = id OR public.is_admin());


-- ==========================================
-- 5. جدول نظرات (Comments)
-- ==========================================
ALTER TABLE "public"."comments" ENABLE ROW LEVEL SECURITY;
-- (Add standard policies if needed, simplifying for now)
CREATE POLICY "Public Read Comments" ON "public"."comments" FOR SELECT USING (true);
CREATE POLICY "Authenticated Insert Comment" ON "public"."comments" FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Admins Modify Comments" ON "public"."comments" FOR ALL USING (public.is_admin());
