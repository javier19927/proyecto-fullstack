export interface BackendConnection {
  port: number;
  status: 'online' | 'offline';
  url: string;
  responseTime?: number;
}

export async function checkBackendConnection(): Promise<BackendConnection[]> {
  const ports = [5000]; // Solo verificar el puerto correcto del backend
  const results: BackendConnection[] = [];

  for (const port of ports) {
    const url = `http://localhost:${port}`;
    const startTime = Date.now();
    
    console.log(`🔍 Verificando conexión a ${url}/api/health`);
    
    try {
      const response = await fetch(`${url}/api/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(5000) // 5 seconds timeout
      });

      const responseTime = Date.now() - startTime;
      console.log(`✅ Respuesta recibida en ${responseTime}ms, status: ${response.status}`);

      if (response.ok) {
        const data = await response.json();
        console.log('📋 Datos recibidos:', data);
        results.push({
          port,
          status: 'online',
          url,
          responseTime
        });
      } else {
        console.log(`❌ Respuesta no OK: ${response.status} ${response.statusText}`);
        results.push({
          port,
          status: 'offline',
          url
        });
      }
    } catch (error) {
      console.error(`❌ Error al conectar con ${url}:`, error);
      results.push({
        port,
        status: 'offline',
        url
      });
    }
  }

  return results;
}
