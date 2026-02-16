import { createContext, useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { createClient } from "@supabase/supabase-js";
import "../../customToast.css";
import { supabase } from "../../supabaseClient";
import { 
    uploadFile, 
    uploadMultipleFiles, 
    deleteFile, 
    getPaginatedData,
    retryOperation 
} from "../../utils/supabaseHelpers";

const toastStyle = {
    direction: "rtl",
    textAlign: "center",
    fontWeight: "600",
    fontSize: "15px",
};

export const AdminContext = createContext();

export const AdminContextProvider = ({ children }) => {
    const navigate = useNavigate();

    // State definitions
    const [error, setError] = useState("");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [userId, setUserId] = useState("");
    const [isAdmin, setIsAdmin] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const [categoryList, setCategoryList] = useState([]);
    const [newsList, setNewsList] = useState([]);
    const [newsById, setNewsById] = useState([]);
    const [videosList, setVideosList] = useState([]);
    const [errorVideo, setErrorVideo] = useState("");
    const [userList, setUsersList] = useState([]);
    const [profileImage, setProfileImage] = useState("");
    const [profileName, setProfileName] = useState("");
    const [commentsList, setCommentsList] = useState([]);
    
    // Pagination states
    const [newsPage, setNewsPage] = useState(1);
    const [newsTotalPages, setNewsTotalPages] = useState(1);
    const [newsLoading, setNewsLoading] = useState(false);

    // Check auth state on load
    useEffect(() => {
        checkUser();

        const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (session) {
                const user = session.user;
                setUserId(user.id);
                setEmail(user.email);
                // Fetch additional profile info
                const { data: profile } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (profile) {
                    setName(profile.name);
                    setIsAdmin(profile.isAdmin);
                    setProfileImage(profile.image);
                    setProfileName(profile.name);
                }
            } else {
                setUserId("");
                setName("");
                setEmail("");
                setIsAdmin(false);
            }
            setIsLoading(false);
        });

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, []);

    const checkUser = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            const user = session.user;
            setUserId(user.id);
            setEmail(user.email);
            const { data: profile } = await supabase
                .from('users')
                .select('*')
                .eq('id', user.id)
                .single();
            if (profile) {
                setName(profile.name);
                setIsAdmin(profile.isAdmin);
                setProfileImage(profile.image);
                setProfileName(profile.name);
            }
        }
        setIsLoading(false);
    };

    // --- User Extensions ---

    const login = async (input) => {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: input.email,
                password: input.password,
            });

            if (error) {
                toast.error("ایمیل یا رمز عبور اشتباه است", {
                    position: "bottom-center",
                    autoClose: 4000,
                    icon: "🚫",
                    className: "custom-toast custom-toast-error",
                    style: toastStyle,
                });
            } else {
                // Check if profile exists, if not create handling is done via Trigger in SQL
                navigate("/admin-dashboard");
                toast.success("خوش آمدید", {
                    position: "bottom-center",
                    autoClose: 3500,
                    icon: "✅",
                    className: "custom-toast custom-toast-success",
                    style: toastStyle,
                });
            }
        } catch (error) {
            console.log(error);
        }
    };

    const logout = async () => {
        await supabase.auth.signOut();
        navigate("/");
        toast.info("خارج شدید", { position: "bottom-center", style: toastStyle });
    };

    const register = async (data) => {
        try {
            // Backend Logic Replication:
            // 1. Check password match (already done in UI usually, but good to have)
            if (data.password !== data.confPassword) {
                toast.error("پسورد و تکرار آن همخوانی ندارند", { position: "bottom-center", style: toastStyle });
                return;
            }

            // 2. Create User using a secondary client to AVOID logging out the current admin
            // This replicates "Admin creates user" without session switch.
            // We use the same URL and Key, but with persistSession: false
            const tempSupabase = createClient(
                import.meta.env.VITE_SUPABASE_URL,
                import.meta.env.VITE_SUPABASE_ANON_KEY,
                {
                    auth: {
                        persistSession: false, // This is crucial!
                        autoRefreshToken: false,
                    }
                }
            );

            // 3. Register the user
            const { data: authData, error } = await tempSupabase.auth.signUp({
                email: data.email,
                password: data.password,
                options: {
                    data: {
                        name: data.name,
                        // We store isAdmin in metadata initially, so triggers can use it, 
                        // or we manually update public.users below.
                        isAdmin: data.isAdmin
                    }
                }
            });

            if (error) {
                // Handle Rate Limit specifically
                if (error.message.includes("rate limit")) {
                    toast.error("تعداد درخواست‌ها بیش از حد مجاز است. لطفاً چند لحظه صبر کنید یا ایمیل‌ها را تایید نکنید.", { position: "bottom-center", style: toastStyle });
                } else {
                    toast.error(error.message, { position: "bottom-center", style: toastStyle });
                }
            } else {
                // 4. Manually ensure public.users is updated/synced if needed
                // If we have a trigger, it might be enough. 
                // But to be sure (like backend did direct DB insert):
                if (authData.user) {
                    // Convert string "true"/"false" to actual boolean
                    const isAdminValue = data.isAdmin === "true";

                    // Update profile with correct types
                    const { error: profileError } = await supabase
                        .from('users')
                        .update({
                            "isAdmin": isAdminValue,
                            "name": data.name
                        })
                        .eq('id', authData.user.id);

                    if (profileError) console.log("Profile update error", profileError);
                }

                toast.success("کاربر با موفقیت ساخته شد", { position: "bottom-center", style: toastStyle });
                getAllUsers();
                navigate("/admin-view-users");
            }
        } catch (error) {
            console.log(error);
            toast.error("خطای سیستمی", { position: "bottom-center", style: toastStyle });
        }
    };

    const getAllUsers = async () => {
        try {
            const { data, error } = await supabase.from('users').select('*');
            if (!error) setUsersList(data);
        } catch (error) {
            console.log(error);
        }
    };

    const deleteUser = async (id) => {
        try {
            // Delete from public.users (will cascade if configured, but auth.users deletion needs admin API usually. 
            // Standard supabase client can't delete other users from auth.users easily. 
            // For now we just delete the profile or call an Edge Function. 
            // We will delete from public.users and let the user handle auth cleanup manually or via logic

            const { error } = await supabase.from('users').delete().eq('id', id);

            if (error) {
                toast.error("خطا در حذف کاربر", { position: "bottom-center", style: toastStyle });
            } else {
                toast.success("کاربر حذف شد", { position: "bottom-center", style: toastStyle });
                getAllUsers();
            }
        } catch (error) {
            console.log(error);
        }
    };

    const editUser = async (data) => {
        try {
            const { error } = await supabase
                .from('users')
                .update({ name: data.name, email: data.email, isAdmin: data.isAdmin }) // Add fields as needed
                .eq('id', data.id);

            if (error) {
                toast.error("خطا در ویرایش", { position: "bottom-center", style: toastStyle });
            } else {
                toast.success("ویرایش موفقیت آمیز بود", { position: "bottom-center", style: toastStyle });
                getAllUsers();
                navigate("/admin-view-users");
            }
        } catch (error) {
            console.log(error);
        }
    };

    // Simplification: updateProfile calling editUser logic or specific logic
    const updateProfile = async (data) => {
        // Upload image if exists
        let imageUrl = data.image; // Keep existing
        if (data.file instanceof File) {
            const fileName = `${Date.now()}_${data.file.name}`;
            const { error: uploadError } = await supabase.storage
                .from('profile-images')
                .upload(fileName, data.file);

            if (!uploadError) {
                const { data: publicUrlData } = supabase.storage
                    .from('profile-images')
                    .getPublicUrl(fileName);
                imageUrl = publicUrlData.publicUrl;
            }
        }

        const updates = {
            name: data.name,
            // Password update requires auth.updateUser
        };
        if (imageUrl) updates.image = imageUrl;

        try {
            const { error } = await supabase.from('users').update(updates).eq('id', data.id);

            if (data.password) {
                await supabase.auth.updateUser({ password: data.password });
            }

            if (error) {
                toast.error("خطا در آپدیت پروفایل", { position: "bottom-center", style: toastStyle });
            } else {
                toast.success("پروفایل آپدیت شد", { position: "bottom-center", style: toastStyle });
                getAllUsers();
                navigate("/admin-view-users");
            }
        } catch (e) { console.log(e); }
    };

    const userInfo = async () => {
        // Fetched in useEffect
    };

    // --- Category Extensions ---

    const getAllCategories = async () => {
        const { data, error } = await supabase.from('category').select('*');
        if (!error) setCategoryList(data);
    };

    const createCategory = async (name) => {
        const { error } = await supabase.from('category').insert({ name: name.name }); // check input structure
        if (error) {
            toast.error("خطا در ساخت دسته بندی", { position: "bottom-center", style: toastStyle });
        } else {
            toast.success("دسته بندی ساخته شد", { position: "bottom-center", style: toastStyle });
            getAllCategories();
            navigate("/admin-view-categories");
        }
    };

    const deleteCategory = async (id) => {
        const { error } = await supabase.from('category').delete().eq('id', id);
        if (!error) {
            toast.success("دسته بندی حذف شد", { position: "bottom-center", style: toastStyle });
            getAllCategories();
        }
    };

    const editCategory = async (data) => {
        const { error } = await supabase.from('category').update({ name: data.name }).eq('id', data.id);
        if (!error) {
            toast.success("دسته بندی ویرایش شد", { position: "bottom-center", style: toastStyle });
            getAllCategories();
            navigate("/admin-view-categories");
        }
    };const loadingToast = toast.loading("در حال آپلود خبر...", {
            position: "bottom-center",
            style: toastStyle
        });

        try {
            // Validate required fields
            if (!data.file) {
                toast.dismiss(loadingToast);
                toast.error("لطفاً عکس اصلی را انتخاب کنید", { 
                    position: "bottom-center", 
                    style: toastStyle 
                });
                return;
            }

            let imageUrl = "";
            let videoUrl = "";
            let imagesUrls = [];

            // Upload main image with retry
            const mainImageResult = await retryOperation(
                () => uploadFile(data.file, 'news-images')
            );
            
            if (mainImageResult) {
                imageUrl = mainImageResult.url;
            } else {
                throw new Error("خطا در آپلود تصویر اصلی");
            }

            // Upload video if exists
            if (data.video) {
                const videoResult = await uploadFile(data.video, 'videos');
                if (videoResult) {
                    videoUrl = videoResult.url;
                }
            }

            // Upload multiple images
            if (data.images && data.images.length > 0) {
                const imagesResults = await uploadMultipleFiles(data.images, 'news-images');
                imagesUrls = imagesResults.map(r => r.url);
            }

            // Prepare news data
            const newsData = {
                title: data.title,
                description: data.description,
                subTitle1: data.subTitle1 || null,
                subDescription1: data.subDescription1 || null,
                subTitle2: data.subTitle2 || null,
                subDescription2: data.subDescription2 || null,
                subTitle3: data.subTitle3 || null,
                subDescription3: data.subDescription3 || null,
                subTitle4: data.subTitle4 || null,
                subDescription4: data.subDescription4 || null,
                catId: parseInt(data.catId),
                userId: userId,
                image: imageUrl,
                url: imageUrl, // برای compatibility
                video: videoUrl,
                videoUrl: videoUrl,
                images: imagesUrls,
                imagesUrl: imagesUrls,
                numViews: 0,
                numLike: 0
            };

            // Insert news
            const { error } = await supabase.from('news').insert(newsData);
            
            if (error) {
                console.error("Insert error:", error);
                throw error;
            }

            toast.dismiss(loadingToast);
            toast.success("خبر با موفقیت ایجاد شد", { 
                position: "bottom-center", 
                style: toastStyle,
                icon: "✅"
            });
            
            navigate("/admin-view-news");
            handleNews();
            
        } catch (err) {
            console.error("Error in createNews:", err);
            toast.dismiss(loadingToast);
            toast.error(err.message || "خطا در ایجاد خبر", { 
                position: "bottom-center", 
                style: toastStyle,
                icon: "❌"
           
                handleNews();
            }
        } catch (err) {
            console.error("Error in createNews:", err);
            toast.error("خطای سیستمی در ایجاد خبر", { position: "bottom-center", style: toastStyle });
        }
    };

    const handleNews = useCallback(async (page = 1, pageSize = 10) => {
        setNewsLoading(true);
        
        try {
            const { data, count, totalPages } = await getPaginatedData(
                'news',
                page,
                pageSize,
                {
                    relations: ['users', 'category'],
                    orderBy: { column: 'created_at', ascending: false }
                }
            );

            // Map data for compatibility with existing components
            const mapped = (data || []).map(item => ({
                ...item,
                url: item.image,
                createdAt: item.created_at,
                user: item.users,
                category: item.category
            }));

            setNewsList(mapped);
            setNewsPage(page);
            setNewsTotalPages(totalPages);
        } catch (err) {
            console.error('Error fetching news:', err);
            toast.error("خطا در دریافت اخبار", { 
                position: "bottom-center", 
                style: toastStyle 
            });
        } finally {
            setNewsLoading(false);
        }
    }, []);

    const deleteNews = async (id) => {
        const confirmed = window.confirm("آیا مطمئن هستید که می‌خواهید این خبر را حذف کنید؟");
        if (!confirmed) return;

        const loadingToast = toast.loading("در حال حذف...", {
            position: "bottom-center",
            style: toastStyle
        });

        try {
            // Get news details to delete associated files
            const { data: newsData } = await supabase
                .from('news')
                .select('image, video, images')
                .eq('id', id)
                .single();

            // Delete from database
            const { error } = await supabase.from('news').delete().eq('id', id);
            
            if (error) throw error;

            // Delete associated files from storage (optional - can be done via background job)
            // Note: Extract filename from URL and delete
            
            toast.dismiss(loadingToast);
            toast.success("خبر با موفقیت حذف شد", { 
                position: "bottom-center", 
                style: toastStyle,
                icon: "✅"
            });
            
            handleNews(newsPage);
        } catch (err) {
            console.error('Error deleting news:', err);
            toast.dismiss(loadingToast);
            toast.error("خطا در حذف خبر", { 
                position: "bottom-center", 
                style: toastStyle,
                icon: "❌"
            });
        }
    };

    const getNewsById = async (id) => {
        try {
            const { data, error } = await supabase.from('news').select('*').eq('id', id).single();
            if (error) throw error;
            const mapped = {
                ...data,
                url: data.image,
                createdAt: data.created_at
            };
            setNewsById(mapped);
            return mapped;
        } catch (err) {
            console.error(err);
            return null;
        }
    };

    const updateNews = async (data) => {
        const loadingToast = toast.loading("در حال بروزرسانی خبر...", {
            position: "bottom-center",
            style: toastStyle
        });

        try {
            let imageUrl = data.image;
            let videoUrl = data.video;
            let imagesUrls = data.images || [];

            // Upload new main image if provided
            if (data.file instanceof File) {
                const result = await retryOperation(
                    () => uploadFile(data.file, 'news-images')
                );
                if (result) imageUrl = result.url;
            }

            // Upload new video if provided
            if (data.videoFile instanceof File) {
                const result = await uploadFile(data.videoFile, 'videos');
                if (result) videoUrl = result.url;
            }

            // Upload new images if provided
            if (data.newImages && data.newImages.length > 0) {
                const results = await uploadMultipleFiles(data.newImages, 'news-images');
                imagesUrls = [...imagesUrls, ...results.map(r => r.url)];
            }

            const updates = {
                title: data.title,
                description: data.description,
                subTitle1: data.subTitle1 || null,
                subDescription1: data.subDescription1 || null,
                subTitle2: data.subTitle2 || null,
                subDescription2: data.subDescription2 || null,
                subTitle3: data.subTitle3 || null,
                subDescription3: data.subDescription3 || null,
                subTitle4: data.subTitle4 || null,
                subDescription4: data.subDescription4 || null,
                catId: parseInt(data.catId),
                image: imageUrl,
                url: imageUrl,
                video: videoUrl,
                videoUrl: videoUrl,
                images: imagesUrls,
                imagesUrl: imagesUrls,
                updated_at: new Date().toISOString()
            };

            const { error } = await supabase.from('news').update(updates).eq('id', data.id);

            if (error) throw error;

            toast.dismiss(loadingToast);
            toast.success("خبر با موفقیت ویرایش شد", { 
                position: "bottom-center", 
                style: toastStyle,
                icon: "✅"
            });
            
            handleNews(newsPage);
            navigate('/admin-view-news');
        } catch (err) {
            console.error('Error updating news:', err);
            toast.dismiss(loadingToast);
            toast.error("خطا در ویرایش خبر", { 
                position: "bottom-center", 
                style: toastStyle,
                icon: "❌"
            });
        }
    };

    // --- Video Extensions ---

    const getAllVideos = async () => {
        const { data } = await supabase.from('video').select('*');
        setVideosList(data || []);
    };

    const addVideo = async (data) => {
        try {
            let vidUrl = "";
            if (data.file) {
                const fileName = `${Date.now()}_${data.file.name}`;
                const { error: upErr } = await supabase.storage.from('videos').upload(fileName, data.file);
                if (!upErr) {
                    const { data: urlData } = supabase.storage.from('videos').getPublicUrl(fileName);
                    vidUrl = urlData.publicUrl;
                }
            }

            const { error } = await supabase.from('video').insert({
                title: data.title,
                description: data.description,
                video: vidUrl,
                url: vidUrl
            });

            if (!error) {
                toast.success("ویدیو با موفقیت اضافه شد", { position: "bottom-center", style: toastStyle });
                getAllVideos();
                navigate('/admin-view-videos');
            } else {
                toast.error("خطا در اضافه کردن ویدیو", { position: "bottom-center", style: toastStyle });
            }
        } catch (err) {
            console.error(err);
        }
    };

    const deleteVideo = async (id) => {
        await supabase.from('video').delete().eq('id', id);
        toast.success("ویدیو حذف شد", { position: "bottom-center", style: toastStyle });
        getAllVideos();
    };

    const editVideo = async (data) => {
        try {
            let vidUrl = data.video;

            if (data.file instanceof File) {
                const fileName = `${Date.now()}_${data.file.name}`;
                const { error: upErr } = await supabase.storage.from('videos').upload(fileName, data.file);
                if (!upErr) {
                    const { data: urlData } = supabase.storage.from('videos').getPublicUrl(fileName);
                    vidUrl = urlData.publicUrl;
                }
            }

            const { error } = await supabase.from('video').update({
                title: data.title,
                description: data.description,
                video: vidUrl,
                url: vidUrl
            }).eq('id', data.id);

            if (!error) {
                toast.success("ویدیو ویرایش شد", { position: "bottom-center", style: toastStyle });
                getAllVideos();
                navigate('/admin-view-videos');
            }
        } catch (err) {
            console.error(err);
        }
    };

    // --- Comments Extensions ---

    const getAllComments = async () => {
        const { data } = await supabase.from('comments').select(`
            *,
            news (title)
        `);
        setCommentsList(data || []);
    };

    const deleteComment = async (id) => {
        await supabase.from('comments').delete().eq('id', id);
        toast.success("کامنت حذف شد", { position: "bottom-center", style: toastStyle });
        getAllComments();
    };

    const activeComment = async (id) => {
        await supabase.from('comments').update({ isActive: true }).eq('id', id);
        toast.success("کامنت فعال شد", { position: "bottom-center", style: toastStyle });
        getAllComments();
    };

    const unActiveComment = async (id) => {
        await supabase.from('comments').update({ isActive: false }).eq('id', id);
        toast.success("کامنت غیرفعال شد", { position: "bottom-center", style: toastStyle });
        getAllComments();
    };

    return (
        <AdminContext.Provider value={{
            login,
            name,
            isAdmin,
            userId,
            userInfo,
            profileName,
            profileImage,
            error,
            getAllUsers,
            userList,
            editUser,
            updateProfile,
            deleteUser,
            register,
            logout,

            getAllCategories,
            categoryList,
            createCategory,
            editCategory,
            deleteCategory,

            createNews,
            deleteNews,
            handleNews,
            newsList,
            getNewsById,
            updateNews,
            newsPage,
            newsTotalPages,
            newsLoading,
            setNewsPage,

            getAllVideos,
            videosList,
            addVideo,
            errorVideo,
            deleteVideo,
            editVideo,

            getAllComments,
            commentsList,
            deleteComment,
            activeComment,
            unActiveComment,

            isLoading,
        }} >
            {children}
        </AdminContext.Provider>
    );
};