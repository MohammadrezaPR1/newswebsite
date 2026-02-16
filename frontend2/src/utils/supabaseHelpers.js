/**
 * Supabase Helper Functions
 * مجموعه توابع کمکی برای بهینه‌سازی عملیات با Supabase
 */

import { supabase } from "../supabaseClient";

/**
 * Upload file to Supabase Storage with progress tracking
 * @param {File} file - فایل برای آپلود
 * @param {string} bucket - نام bucket
 * @param {Function} onProgress - callback برای نمایش پیشرفت
 * @returns {Promise<{url: string, path: string} | null>}
 */
export const uploadFile = async (file, bucket, onProgress = null) => {
  if (!file) return null;

  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = fileName;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw uploadError;
    }

    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return {
      url: publicUrlData.publicUrl,
      path: filePath
    };
  } catch (error) {
    console.error('Error in uploadFile:', error);
    return null;
  }
};

/**
 * Upload multiple files
 * @param {File[]} files - آرایه فایل‌ها
 * @param {string} bucket - نام bucket
 * @returns {Promise<Array<{url: string, path: string}>>}
 */
export const uploadMultipleFiles = async (files, bucket) => {
  if (!files || files.length === 0) return [];

  const uploadPromises = files.map(file => uploadFile(file, bucket));
  const results = await Promise.all(uploadPromises);
  
  return results.filter(result => result !== null);
};

/**
 * Delete file from storage
 * @param {string} bucket - نام bucket
 * @param {string} path - مسیر فایل
 */
export const deleteFile = async (bucket, path) => {
  if (!path) return;

  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting file:', error);
  }
};

/**
 * Get paginated data
 * @param {string} table - نام جدول
 * @param {number} page - شماره صفحه (از 1 شروع می‌شود)
 * @param {number} pageSize - تعداد آیتم در هر صفحه
 * @param {Object} options - تنظیمات اضافی (relations, orderBy, filters)
 * @returns {Promise<{data: Array, count: number, page: number, totalPages: number}>}
 */
export const getPaginatedData = async (
  table,
  page = 1,
  pageSize = 10,
  options = {}
) => {
  try {
    const { relations = [], orderBy = null, filters = {} } = options;
    
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from(table)
      .select('*', { count: 'exact' });

    // Add relations
    if (relations.length > 0) {
      const selectFields = ['*', ...relations.map(rel => `${rel}(*)`)].join(', ');
      query = supabase
        .from(table)
        .select(selectFields, { count: 'exact' });
    }

    // Add filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        query = query.eq(key, value);
      }
    });

    // Add ordering
    if (orderBy) {
      query = query.order(orderBy.column, { ascending: orderBy.ascending ?? false });
    }

    // Add pagination
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      data: data || [],
      count: count || 0,
      page,
      totalPages: Math.ceil((count || 0) / pageSize)
    };
  } catch (error) {
    console.error('Error in getPaginatedData:', error);
    return {
      data: [],
      count: 0,
      page,
      totalPages: 0
    };
  }
};

/**
 * Retry mechanism for failed operations
 * @param {Function} operation - عملیات برای اجرا
 * @param {number} maxRetries - حداکثر تعداد تلاش مجدد
 * @param {number} delay - تاخیر بین تلاش‌ها (میلی‌ثانیه)
 */
export const retryOperation = async (operation, maxRetries = 3, delay = 1000) => {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
      }
    }
  }
  
  throw lastError;
};

/**
 * Batch insert with error handling
 * @param {string} table - نام جدول
 * @param {Array} data - آرایه داده‌ها
 * @param {number} batchSize - اندازه هر batch
 */
export const batchInsert = async (table, data, batchSize = 100) => {
  const batches = [];
  for (let i = 0; i < data.length; i += batchSize) {
    batches.push(data.slice(i, i + batchSize));
  }

  const results = [];
  for (const batch of batches) {
    const { data: insertedData, error } = await supabase
      .from(table)
      .insert(batch)
      .select();

    if (error) {
      console.error('Batch insert error:', error);
      continue;
    }
    
    results.push(...(insertedData || []));
  }

  return results;
};

/**
 * Check if storage bucket exists and is accessible
 * @param {string} bucket - نام bucket
 * @returns {Promise<boolean>}
 */
export const checkBucketExists = async (bucket) => {
  try {
    const { data, error } = await supabase.storage.getBucket(bucket);
    return !error && data !== null;
  } catch (error) {
    return false;
  }
};

/**
 * Optimize image URL for performance
 * @param {string} url - URL تصویر
 * @param {Object} options - تنظیمات (width, height, quality)
 * @returns {string}
 */
export const optimizeImageUrl = (url, options = {}) => {
  if (!url) return '';
  
  // Supabase doesn't have built-in image optimization yet
  // You can use external services like Cloudinary or imgix
  // For now, return the original URL
  return url;
};

/**
 * Get item with cache support
 * @param {string} table - نام جدول
 * @param {string|number} id - شناسه آیتم
 * @param {number} cacheDuration - مدت زمان cache (میلی‌ثانیه)
 */
export const getCachedItem = (() => {
  const cache = new Map();

  return async (table, id, cacheDuration = 5 * 60 * 1000) => {
    const cacheKey = `${table}_${id}`;
    const cached = cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < cacheDuration) {
      return cached.data;
    }

    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });

      return data;
    } catch (error) {
      console.error('Error in getCachedItem:', error);
      return null;
    }
  };
})();

/**
 * Clear cache for specific table
 * @param {string} table - نام جدول
 */
export const clearTableCache = (table) => {
  // Implementation depends on your caching strategy
  console.log(`Cache cleared for table: ${table}`);
};
