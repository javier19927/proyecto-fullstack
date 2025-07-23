'use client';

import { useState } from 'react';

export default function ConnectionTest() {
  const [result, setResult] = useState<string>('');

  const testConnection = async () => {
    setResult('Probando conexión...');
    
    try {
      console.log('🧪 Iniciando test de conexión...');
      
      const response = await fetch('http://localhost:5002/api/health', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📡 Respuesta recibida:', response);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📋 Datos:', data);
        setResult(`✅ Conexión exitosa: ${JSON.stringify(data)}`);
      } else {
        setResult(`❌ Error HTTP: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('❌ Error de conexión:', error);
      setResult(`❌ Error: ${error}`);
    }
  };

  return (
    <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg m-4">
      <h3 className="font-bold text-blue-800 mb-2">Test de Conexión Backend</h3>
      <button 
        onClick={testConnection}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mb-2"
      >
        Probar Conexión
      </button>
      <div className="text-sm mt-2">
        <strong>Resultado:</strong>
        <pre className="bg-white p-2 rounded mt-1 overflow-auto">
          {result || 'Presiona el botón para probar la conexión'}
        </pre>
      </div>
    </div>
  );
}
