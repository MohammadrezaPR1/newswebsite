/**
 * Supabase Connection Test Script
 * اسکریپت تست اتصال به Supabase
 * 
 * نحوه اجرا:
 * 1. مطمئن شوید که در پوشه frontend2 هستید
 * 2. دستور زیر را اجرا کنید:
 *    node test-supabase.js
 */

import { createClient } from '@supabase/supabase-js';

// Load environment variables
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'YOUR_ANON_KEY';

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, type = 'info') {
  const timestamp = new Date().toLocaleTimeString('fa-IR');
  const prefix = {
    success: `${colors.green}✓${colors.reset}`,
    error: `${colors.red}✗${colors.reset}`,
    info: `${colors.blue}ℹ${colors.reset}`,
    warning: `${colors.yellow}⚠${colors.reset}`,
  }[type] || '';

  console.log(`${prefix} [${timestamp}] ${message}`);
}

async function testDatabaseConnection() {
  log('Testing database connection...', 'info');
  
  try {
    const { data, error } = await supabase.from('users').select('count');
    
    if (error) throw error;
    
    log('Database connection successful!', 'success');
    return true;
  } catch (error) {
    log(`Database connection failed: ${error.message}`, 'error');
    return false;
  }
}

async function testTables() {
  log('\nTesting tables...', 'info');
  
  const tables = ['users', 'category', 'news', 'video', 'comments'];
  const results = {};

  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) throw error;
      
      log(`Table "${table}": ${count || 0} records`, 'success');
      results[table] = { success: true, count: count || 0 };
    } catch (error) {
      log(`Table "${table}": ${error.message}`, 'error');
      results[table] = { success: false, error: error.message };
    }
  }

  return results;
}

async function testStorageBuckets() {
  log('\nTesting storage buckets...', 'info');
  
  const buckets = ['news-images', 'videos', 'profile-images'];
  const results = {};

  try {
    const { data: allBuckets, error } = await supabase.storage.listBuckets();
    
    if (error) throw error;

    for (const bucketName of buckets) {
      const exists = allBuckets.some(b => b.name === bucketName);
      
      if (exists) {
        const bucket = allBuckets.find(b => b.name === bucketName);
        log(`Bucket "${bucketName}": ${bucket.public ? 'Public' : 'Private'}`, 'success');
        results[bucketName] = { success: true, public: bucket.public };
      } else {
        log(`Bucket "${bucketName}": Not found`, 'error');
        results[bucketName] = { success: false };
      }
    }
  } catch (error) {
    log(`Storage test failed: ${error.message}`, 'error');
  }

  return results;
}

async function testRLSPolicies() {
  log('\nTesting RLS policies (read access)...', 'info');
  
  // Test public read access
  try {
    const { data: categories, error } = await supabase
      .from('category')
      .select('*')
      .limit(1);
    
    if (error) throw error;
    
    log('Category read access: OK', 'success');
  } catch (error) {
    log(`Category read access: ${error.message}`, 'error');
  }

  try {
    const { data: news, error } = await supabase
      .from('news')
      .select('*')
      .limit(1);
    
    if (error) throw error;
    
    log('News read access: OK', 'success');
  } catch (error) {
    log(`News read access: ${error.message}`, 'error');
  }
}

async function testAuthentication() {
  log('\nTesting authentication...', 'info');
  
  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (error) throw error;
    
    if (data.session) {
      log('User is authenticated', 'success');
      log(`User ID: ${data.session.user.id}`, 'info');
      log(`Email: ${data.session.user.email}`, 'info');
    } else {
      log('No active session (not logged in)', 'warning');
    }
  } catch (error) {
    log(`Authentication test failed: ${error.message}`, 'error');
  }
}

async function testFileUpload() {
  log('\nTesting file upload capability...', 'info');
  
  try {
    // Create a small test file
    const testContent = 'Test file content';
    const testBlob = new Blob([testContent], { type: 'text/plain' });
    const testFileName = `test_${Date.now()}.txt`;

    const { error: uploadError } = await supabase.storage
      .from('news-images')
      .upload(testFileName, testBlob, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      if (uploadError.message.includes('not found')) {
        log('File upload: Bucket not found', 'error');
      } else if (uploadError.message.includes('not authorized')) {
        log('File upload: Not authorized (need authentication)', 'warning');
      } else {
        throw uploadError;
      }
    } else {
      log('File upload: OK', 'success');
      
      // Clean up: delete test file
      const { error: deleteError } = await supabase.storage
        .from('news-images')
        .remove([testFileName]);
      
      if (!deleteError) {
        log('Test file cleaned up', 'info');
      }
    }
  } catch (error) {
    log(`File upload test failed: ${error.message}`, 'error');
  }
}

async function generateReport(results) {
  log('\n' + '='.repeat(60), 'info');
  log('TEST SUMMARY', 'info');
  log('='.repeat(60), 'info');

  let totalTests = 0;
  let passedTests = 0;

  // Count table tests
  if (results.tables) {
    Object.values(results.tables).forEach(result => {
      totalTests++;
      if (result.success) passedTests++;
    });
  }

  // Count bucket tests
  if (results.buckets) {
    Object.values(results.buckets).forEach(result => {
      totalTests++;
      if (result.success) passedTests++;
    });
  }

  const percentage = totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : 0;

  log(`\nTotal Tests: ${totalTests}`, 'info');
  log(`Passed: ${colors.green}${passedTests}${colors.reset}`, 'info');
  log(`Failed: ${colors.red}${totalTests - passedTests}${colors.reset}`, 'info');
  log(`Success Rate: ${percentage}%\n`, 'info');

  if (passedTests === totalTests) {
    log('🎉 All tests passed! Your Supabase setup is correct.', 'success');
  } else {
    log('⚠️  Some tests failed. Please check the errors above.', 'warning');
    log('\nCommon solutions:', 'info');
    log('1. Make sure you ran database_schema.sql', 'info');
    log('2. Make sure you ran storage_policies.sql', 'info');
    log('3. Check your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY', 'info');
    log('4. Verify RLS policies are enabled', 'info');
  }

  log('\n' + '='.repeat(60) + '\n', 'info');
}

async function main() {
  console.clear();
  
  log('🚀 Supabase Connection Test Starting...', 'info');
  log('='.repeat(60) + '\n', 'info');

  // Check if environment variables are set
  if (SUPABASE_URL === 'YOUR_SUPABASE_URL' || SUPABASE_ANON_KEY === 'YOUR_ANON_KEY') {
    log('❌ Environment variables not set!', 'error');
    log('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY', 'error');
    log('Either in .env file or as environment variables', 'error');
    process.exit(1);
  }

  log(`URL: ${SUPABASE_URL.substring(0, 30)}...`, 'info');
  log(`Key: ${SUPABASE_ANON_KEY.substring(0, 20)}...\n`, 'info');

  const results = {};

  // Run tests
  const connected = await testDatabaseConnection();
  
  if (connected) {
    results.tables = await testTables();
    results.buckets = await testStorageBuckets();
    await testRLSPolicies();
    await testAuthentication();
    await testFileUpload();
  } else {
    log('\n❌ Cannot proceed with other tests due to connection failure', 'error');
  }

  // Generate report
  await generateReport(results);
}

// Run tests
main().catch(error => {
  log(`\n❌ Fatal error: ${error.message}`, 'error');
  console.error(error);
  process.exit(1);
});
