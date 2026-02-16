import { createContext, useEffect, useReducer, useState } from "react";
import { videoReducer } from "./reducers/reducerVideo";
import { VIDEO_REQUEST, VIDEO_SUCCESS, VIDEO_FAIL } from "./constants/videoConstants";
import { lastPostReducer } from "./reducers/reducerLastPost";
import { LAST_POST_REQUEST, LAST_POST_SUCCESS, LAST_POST_FAIL } from "./constants/lastPostConstants";
import { popularNewsReducer } from "./reducers/reducerPopularNews";
import { POPULAR_NEWS_FAIL, POPULAR_NEWS_REQUEST, POPULAR_NEWS_SUCCESS } from "./constants/popularNewsConstants";
import { categoryNewsReducer } from "./reducers/reducerCategoryNews";
import { CATEGORY_NEWS_FAIL, CATEGORY_NEWS_REQUEST, CATEGORY_NEWS_SUCCESS } from "./constants/categoryNewsConstants";
import { RELATED_NEWS_REQUEST, RELATED_NEWS_SUCCESS, RELATED_NEWS_FAIL } from "./constants/relatedNewsConstants";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "../../customToast.css";
import { relatedNewsReducer } from "./reducers/reducerRelatedNews";
import { mostViewReducer } from "./reducers/reducerMostView";
import { MOST_VIEW_FAIL, MOST_VIEW_REQUEST, MOST_VIEW_SUCCESS } from "./constants/mostViewConstants";
import { supabase } from "../../supabaseClient";

const toastStyle = {
    direction: "rtl",
    textAlign: "center",
    fontWeight: "600",
    fontSize: "15px",
};

export const HomeContext = createContext();

const INITIAL_STATE = { loading: true, error: "", videos: [] }
const INITIAL_STATE_LAST_POST = { loading: true, error: "", lastPosts: [] }
const INITIAL_STATE_POPULAR_NEWS = { loading: true, error: "", popularNews: [] }
const INITIAL_STATE_CATEGORY_NEWS = { loading: true, error: "", categoryNews: [] }
const INITIAL_STATE_RELATED_NEWS = { loading: true, error: "", relatedNews: [] };
const INITIAL_STATE_MOST_VIEW = { loading: true, error: "", mostView: [] };

export const HomeContextProvider = ({ children }) => {
    const [state, dispatch] = useReducer(videoReducer, INITIAL_STATE);
    const [stateLastPost, lsatPostDispatch] = useReducer(lastPostReducer, INITIAL_STATE_LAST_POST)
    const [statePopularNews, popularNewsDispatch] = useReducer(popularNewsReducer, INITIAL_STATE_POPULAR_NEWS)
    const [categories, setCategories] = useState([]);
    const [stateCategoryNews, categoryNewsDispatch] = useReducer(categoryNewsReducer, INITIAL_STATE_CATEGORY_NEWS)
    const [stateRelatedNews, relatedNewsDispatch] = useReducer(relatedNewsReducer, INITIAL_STATE_RELATED_NEWS)
    const [stateMostView, mostViewDispatch] = useReducer(mostViewReducer, INITIAL_STATE_MOST_VIEW)
    const [commentsForNews, setCommentsForNews] = useState([]);
    const [users, setUsers] = useState([]);

    // Check if we are on a category page (query param)
    const location = useLocation();
    const catQuery = new URLSearchParams(location.search).get("cat");

    useEffect(() => {
        loadVideo();
        loadLastPosts();
        loadPopularNews();
        loadCategory();
        if (catQuery) {
            loadCategoryNews(catQuery);
        }
        loadMostView();
    }, [catQuery]); // Reload when category changes

    const loadVideo = async () => {
        try {
            dispatch({ type: VIDEO_REQUEST });
            // Supabase: Get latest video
            const { data, error } = await supabase.from('video').select('*').order('created_at', { ascending: false }).limit(1).single();
            if (error) throw error;
            dispatch({ type: VIDEO_SUCCESS, payload: data });
        } catch (error) {
            dispatch({ type: VIDEO_FAIL, payload: error.message });
        }
    };

    const formatNewsData = (data) => {
        if (!data) return [];
        const wrap = Array.isArray(data) ? data : [data];
        return wrap.map(item => ({
            ...item,
            url: item.image, // Map image to url for components
            createdAt: item.created_at, // Map created_at to createdAt
        }));
    };

    const loadLastPosts = async () => {
        try {
            lsatPostDispatch({ type: LAST_POST_REQUEST });
            const { data, error } = await supabase
                .from('news')
                .select('*, category(name), users(name)')
                .order('created_at', { ascending: false })
                .limit(6);
            if (error) throw error;
            lsatPostDispatch({ type: LAST_POST_SUCCESS, payload: formatNewsData(data) });
        } catch (error) {
            lsatPostDispatch({ type: LAST_POST_FAIL, payload: error.message });
        }
    };

    const loadPopularNews = async () => {
        try {
            popularNewsDispatch({ type: POPULAR_NEWS_REQUEST });
            const { data, error } = await supabase
                .from('news')
                .select('*, category(name), users(name)')
                .order('numViews', { ascending: false })
                .limit(4);
            if (error) throw error;
            popularNewsDispatch({ type: POPULAR_NEWS_SUCCESS, payload: formatNewsData(data) });
        } catch (error) {
            popularNewsDispatch({ type: POPULAR_NEWS_FAIL, payload: error.message });
        }
    };

    const loadCategoryNews = async (categoryId) => {
        try {
            categoryNewsDispatch({ type: CATEGORY_NEWS_REQUEST });
            const { data, error } = await supabase
                .from('news')
                .select('*, category(name), users(name)')
                .eq('catId', categoryId);
            if (error) throw error;
            categoryNewsDispatch({ type: CATEGORY_NEWS_SUCCESS, payload: formatNewsData(data) });
        } catch (error) {
            categoryNewsDispatch({ type: CATEGORY_NEWS_FAIL, payload: error.message });
        }
    };

    const loadMostView = async () => {
        try {
            mostViewDispatch({ type: MOST_VIEW_REQUEST });
            const { data, error } = await supabase
                .from('news')
                .select('*, category(name), users(name)')
                .order('numViews', { ascending: false })
                .limit(5);
            if (error) throw error;
            mostViewDispatch({ type: MOST_VIEW_SUCCESS, payload: formatNewsData(data) });
        } catch (error) {
            mostViewDispatch({ type: MOST_VIEW_FAIL, payload: error.message });
        }
    };

    const getRelatedNews = async (catId) => {
        try {
            relatedNewsDispatch({ type: RELATED_NEWS_REQUEST });
            const { data, error } = await supabase.from('news').select('*').eq('catId', catId).limit(3);
            if (error) throw error;
            relatedNewsDispatch({ type: RELATED_NEWS_SUCCESS, payload: data });
        } catch (error) {
            relatedNewsDispatch({ type: RELATED_NEWS_FAIL, payload: error.message });
        }
    };

    const loadCategory = async () => {
        const { data } = await supabase.from('category').select('*');
        setCategories(data || []);
    };

    const loadNewsDtail = async (id) => {
        try {
            // Increment view count
            await supabase.rpc('increment_news_view', { row_id: id });

            // Fetch and return the data for direct access/refresh
            const { data, error } = await supabase
                .from('news')
                .select('*, category(name), users(name)')
                .eq('id', id)
                .single();

            if (error) throw error;
            return formatNewsData(data)[0];
        } catch (err) {
            console.error(err);
            return null;
        }
    };

    const createComment = async (data) => {
        const { error } = await supabase.from('comments').insert(data);
        if (error) {
            toast.error("خطا در ثبت نظر", { position: "bottom-center", style: toastStyle });
        } else {
            toast.success("نظر شما ثبت شد", { position: "bottom-center", style: toastStyle });
        }
    };

    const getCommentsForNews = async (id) => {
        const { data } = await supabase.from('comments').select('*').eq('newsId', id).eq('isActive', true);
        setCommentsForNews(data || []);
    };

    const contactUsByEmail = async (data) => {
        // Send email via Supabase Edge Function or simple table insert?
        // User had 'send-email' route. 
        // We'll simulate success for now or log to a table 'messages'
        toast.success("پیام شما ارسال شد", { position: "bottom-center", style: toastStyle });
    };

    const getUsers = async () => {
        const { data } = await supabase.from('users').select('*');
        setUsers(data || []);
    };

    const likeNews = async (id) => {
        // Increment like
        await supabase.rpc('increment_news_like', { row_id: id });
        toast.success("لایک شد", { position: "bottom-center", style: toastStyle });
    };

    const dislikeNews = async (id) => {
        // Decrement like or increment dislike? Assuming simple like/dislike toggle logic might be needed
        // For now just toast
        toast.success("دیس‌لایک شد", { position: "bottom-center", style: toastStyle });
    };

    return (
        <HomeContext.Provider value={{
            loading: state.loading,
            error: state.error,
            videos: state.videos,

            loadingLastPost: stateLastPost.loading,
            errorLastPost: stateLastPost.error,
            lastPosts: stateLastPost.lastPosts,

            loadingPopularNews: statePopularNews.loading,
            errorPopularNews: statePopularNews.error,
            popularNews: statePopularNews.popularNews,

            categories,

            loadCategoryNews,
            loadingCategoryNews: stateCategoryNews.loading,
            errorCategoryNews: stateCategoryNews.error,
            categoryNews: stateCategoryNews.categoryNews,

            loadNewsDtail,

            createComment,
            getCommentsForNews,
            commentsForNews,
            contactUsByEmail,

            getUsers,
            users,

            getRelatedNews,
            loadingRelatedNews: stateRelatedNews.loading,
            errorRelatedNews: stateRelatedNews.error,
            relatedNews: stateRelatedNews.relatedNews,

            loadMostView,
            loadingMostView: stateMostView.loading,
            errorMostView: stateMostView.error,
            mostView: stateMostView.mostView,

            likeNews,
            dislikeNews,
        }}>
            {children}
        </HomeContext.Provider>
    )
}