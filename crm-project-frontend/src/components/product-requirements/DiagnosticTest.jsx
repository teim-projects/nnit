import React, { useState } from 'react';
import axios from 'axios';

export default function DiagnosticTest() {
  const [results, setResults] = useState({});
  const [testing, setTesting] = useState(false);
  
  const baseApi = import.meta.env.VITE_BASE_API_URL;
  const getToken = () => 
    localStorage.getItem('access') || 
    localStorage.getItem('access_token') || 
    localStorage.getItem('token') || 
    localStorage.getItem('authToken');

  const runTests = async () => {
    setTesting(true);
    const testResults = {};
    const token = getToken();

    // Test 1: Check token exists
    testResults.tokenExists = !!token;
    testResults.tokenPreview = token ? token.substring(0, 50) + '...' : 'NO TOKEN';

    // Test 2: Test /auth/me/
    try {
      const response = await axios.get(`${baseApi}/auth/me/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      testResults.authMe = { status: response.status, success: true, data: response.data.email };
    } catch (error) {
      testResults.authMe = { status: error.response?.status, success: false, error: error.message };
    }

    // Test 3: Test /parking/categories/
    try {
      const response = await axios.get(`${baseApi}/parking/categories/?is_active=true`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      testResults.parkingCategories = { 
        status: response.status, 
        success: true, 
        count: response.data.results?.length || response.data.length 
      };
    } catch (error) {
      testResults.parkingCategories = { 
        status: error.response?.status, 
        success: false, 
        error: error.response?.data || error.message 
      };
    }

    // Test 4: Test /parking/products/
    try {
      const response = await axios.get(`${baseApi}/parking/products/?is_active=true`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      testResults.parkingProducts = { 
        status: response.status, 
        success: true, 
        count: response.data.results?.length || response.data.length 
      };
    } catch (error) {
      testResults.parkingProducts = { 
        status: error.response?.status, 
        success: false, 
        error: error.response?.data || error.message 
      };
    }

    setResults(testResults);
    setTesting(false);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">API Diagnostic Test</h1>
      <p className="text-gray-600 mb-6">This page tests if the parking endpoints are working</p>

      <button
        onClick={runTests}
        disabled={testing}
        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {testing ? 'Testing...' : 'Run Tests'}
      </button>

      {Object.keys(results).length > 0 && (
        <div className="mt-8 space-y-4">
          <div className="bg-gray-100 p-4 rounded-lg">
            <h3 className="font-bold">Token Exists:</h3>
            <p className={results.tokenExists ? 'text-green-600' : 'text-red-600'}>
              {results.tokenExists ? '✅ YES' : '❌ NO'}
            </p>
            <p className="text-xs text-gray-600 mt-2">{results.tokenPreview}</p>
          </div>

          <div className="bg-gray-100 p-4 rounded-lg">
            <h3 className="font-bold">/auth/me/ Endpoint:</h3>
            <p className={results.authMe.success ? 'text-green-600' : 'text-red-600'}>
              {results.authMe.success ? `✅ SUCCESS (${results.authMe.status})` : `❌ FAILED (${results.authMe.status})`}
            </p>
            {results.authMe.success && <p className="text-sm">User: {results.authMe.data}</p>}
            {!results.authMe.success && <p className="text-sm text-red-600">{results.authMe.error}</p>}
          </div>

          <div className="bg-gray-100 p-4 rounded-lg">
            <h3 className="font-bold">/parking/categories/ Endpoint:</h3>
            <p className={results.parkingCategories.success ? 'text-green-600' : 'text-red-600'}>
              {results.parkingCategories.success 
                ? `✅ SUCCESS (${results.parkingCategories.status}) - ${results.parkingCategories.count} categories` 
                : `❌ FAILED (${results.parkingCategories.status})`}
            </p>
            {!results.parkingCategories.success && (
              <pre className="text-xs text-red-600 mt-2 overflow-auto">
                {JSON.stringify(results.parkingCategories.error, null, 2)}
              </pre>
            )}
          </div>

          <div className="bg-gray-100 p-4 rounded-lg">
            <h3 className="font-bold">/parking/products/ Endpoint:</h3>
            <p className={results.parkingProducts.success ? 'text-green-600' : 'text-red-600'}>
              {results.parkingProducts.success 
                ? `✅ SUCCESS (${results.parkingProducts.status}) - ${results.parkingProducts.count} products` 
                : `❌ FAILED (${results.parkingProducts.status})`}
            </p>
            {!results.parkingProducts.success && (
              <pre className="text-xs text-red-600 mt-2 overflow-auto">
                {JSON.stringify(results.parkingProducts.error, null, 2)}
              </pre>
            )}
          </div>

          <div className="bg-yellow-50 border-2 border-yellow-400 p-4 rounded-lg mt-6">
            <h3 className="font-bold text-yellow-800">What to do:</h3>
            {!results.tokenExists && (
              <p className="text-yellow-800">❌ No token found - Please logout and login again</p>
            )}
            {results.authMe?.success && !results.parkingCategories?.success && (
              <div>
                <p className="text-yellow-800 font-bold">⚠️ Backend server issue detected!</p>
                <p className="text-yellow-800 mt-2">
                  /auth/me/ works but /parking/categories/ fails.
                  <br />
                  This means the parking_products views are not loading JWTAuthentication.
                </p>
                <p className="text-yellow-800 mt-2 font-bold">
                  ACTION REQUIRED:
                </p>
                <ol className="list-decimal ml-6 text-yellow-800">
                  <li>STOP Django server (Ctrl+C)</li>
                  <li>Run: .\FORCE_CLEAR_CACHE.bat</li>
                  <li>CLOSE the terminal window</li>
                  <li>Open NEW terminal</li>
                  <li>Run: python manage.py runserver</li>
                  <li>Come back here and click "Run Tests" again</li>
                </ol>
              </div>
            )}
            {results.authMe?.success && results.parkingCategories?.success && (
              <p className="text-green-800">✅ Everything works! You can use the Product Requirements page.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
