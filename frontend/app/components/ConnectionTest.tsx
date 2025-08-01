'use client';

import { useState } from 'react';
import { buildApiUrl, buildHeaders } from '../utils/apiConfig';

export default function ConnectionTest() {
  const [results, setResults] = useState<any>({});
  const [loading, setLoading] = useState(false);

  const testConnection = async () => {
    setLoading(true);
    const testResults: any = {};

    try {
      // Test 1: Health check
      const healthResponse = await fetch(buildApiUrl('/health'));
      testResults.health = {
        status: healthResponse.status,
        ok: healthResponse.ok,
        data: healthResponse.ok ? await healthResponse.json() : null
      };
    } catch (error) {
      testResults.health = { error: error instanceof Error ? error.message : String(error) };
    }

    try {
      // Test 2: Login test
      const loginResponse = await fetch(buildApiUrl('/api/auth/login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'admin@proyecto.com',
          password: 'admin123'
        })
      });
      
      const loginResult = loginResponse.ok ? await loginResponse.json() : await loginResponse.text();
      testResults.login = {
        status: loginResponse.status,
        ok: loginResponse.ok,
        data: loginResult
      };

      // Test 3: Dashboard stats with token
      if (loginResponse.ok && loginResult.data?.token) {
        const token = loginResult.data.token;
        
        try {
          const dashboardResponse = await fetch(buildApiUrl('/api/dashboard/stats'), {
            headers: buildHeaders(token)
          });
          
          testResults.dashboard = {
            status: dashboardResponse.status,
            ok: dashboardResponse.ok,
            data: dashboardResponse.ok ? await dashboardResponse.json() : await dashboardResponse.text()
          };
        } catch (error) {
          testResults.dashboard = { error: error instanceof Error ? error.message : String(error) };
        }

        // Test 4: Role specific stats
        try {
          const roleResponse = await fetch(buildApiUrl('/api/dashboard/role-specific?role=ADMIN'), {
            headers: buildHeaders(token)
          });
          
          testResults.roleSpecific = {
            status: roleResponse.status,
            ok: roleResponse.ok,
            data: roleResponse.ok ? await roleResponse.json() : await roleResponse.text()
          };
        } catch (error) {
          testResults.roleSpecific = { error: error instanceof Error ? error.message : String(error) };
        }
      }
    } catch (error) {
      testResults.login = { error: error instanceof Error ? error.message : String(error) };
    }

    setResults(testResults);
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">
          🔗 Test de Conexión API
        </h3>
        <button
          onClick={testConnection}
          disabled={loading}
          className={`px-4 py-2 rounded-md text-white ${
            loading 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {loading ? 'Probando...' : 'Ejecutar Pruebas'}
        </button>
      </div>

      {Object.keys(results).length > 0 && (
        <div className="space-y-4">
          {Object.entries(results).map(([testName, result]: [string, any]) => (
            <div key={testName} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium capitalize">{testName}</h4>
                <span className={`px-2 py-1 rounded text-sm ${
                  result.ok 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {result.ok ? '✅ OK' : '❌ Error'}
                </span>
              </div>
              
              {result.status && (
                <p className="text-sm text-gray-600 mb-2">
                  Status: {result.status}
                </p>
              )}
              
              <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto max-h-40">
                {JSON.stringify(result.data || result.error || result, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
