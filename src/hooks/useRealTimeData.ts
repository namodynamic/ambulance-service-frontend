import { useState, useEffect, useCallback, useRef } from 'react';
import { ambulanceAPI, requestAPI } from '@/api/ambulanceServiceAPI';
import type { AmbulanceData, EmergencyRequest } from '@/types';

interface RealTimeDataOptions {
  enableWebSocket?: boolean;
  pollingInterval?: number;
  onError?: (error: string) => void;
}

export function useRealTimeData(options: RealTimeDataOptions = {}) {
  const {
    enableWebSocket = true,
    pollingInterval = 30000, // 30 seconds fallback polling
    onError
  } = options;

  const [ambulances, setAmbulances] = useState<AmbulanceData[]>([]);
  const [requests, setRequests] = useState<EmergencyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const pollingIntervalRef = useRef<number | null>(null);

  // Fetch initial data
  const fetchInitialData = useCallback(async () => {
    try {
      setLoading(true);
      const [ambulancesData, requestsData] = await Promise.all([
        ambulanceAPI.getAll().catch(() => []),
        requestAPI.getAll(0, 100).then(res => res.content).catch(() => [])
      ]);
      
      setAmbulances(ambulancesData);
      setRequests(requestsData);
    } catch (error) {
      console.error('Error fetching initial data:', error);
      onError?.('Failed to fetch initial data');
    } finally {
      setLoading(false);
    }
  }, [onError]);

  // WebSocket connection management
  const connectWebSocket = useCallback(() => {
    if (!enableWebSocket) return;

    try {
      const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8080/ws/live-updates';
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('🔗 WebSocket connected for real-time updates');
        setConnected(true);
        
        // Clear polling interval when WebSocket is connected
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'AMBULANCES_UPDATE' && data.payload) {
            setAmbulances(data.payload);
          }
          
          if (data.type === 'REQUESTS_UPDATE' && data.payload) {
            setRequests(data.payload);
          }
          
          if (data.type === 'AMBULANCE_STATUS_CHANGE' && data.payload) {
            setAmbulances(prev => 
              prev.map(amb => 
                amb.id === data.payload.id ? { ...amb, ...data.payload } : amb
              )
            );
          }
          
          if (data.type === 'REQUEST_STATUS_CHANGE' && data.payload) {
            setRequests(prev => 
              prev.map(req => 
                req.id === data.payload.id ? { ...req, ...data.payload } : req
              )
            );
          }

          if (data.type === 'NEW_EMERGENCY_REQUEST' && data.payload) {
            setRequests(prev => [data.payload, ...prev]);
          }

        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      wsRef.current.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        setConnected(false);
        
        // Start polling as fallback
        startPolling();
        
        // Attempt to reconnect after 5 seconds
        reconnectTimeoutRef.current = window.setTimeout(() => {
          console.log('Attempting WebSocket reconnection...');
          connectWebSocket();
        }, 5000);
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        onError?.('WebSocket connection error');
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      startPolling(); // Fallback to polling
    }
  }, [enableWebSocket, onError]);

  // Polling fallback
  const startPolling = useCallback(() => {
    if (pollingIntervalRef.current) return; // Already polling

    console.log('📡 Starting polling fallback');
    pollingIntervalRef.current = window.setInterval(async () => {
      try {
        const [ambulancesData, requestsData] = await Promise.all([
          ambulanceAPI.getAll(),
          requestAPI.getAll(0, 100).then(res => res.content)
        ]);
        
        setAmbulances(ambulancesData);
        setRequests(requestsData);
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, pollingInterval);
  }, [pollingInterval]);

  // Manual refresh
  const refresh = useCallback(async () => {
    await fetchInitialData();
  }, [fetchInitialData]);

  // Update ambulance status
  const updateAmbulanceStatus = useCallback(async (id: number, status: AmbulanceData['status']) => {
    try {
      await ambulanceAPI.updateStatus(id, status);
      // Optimistic update
      setAmbulances(prev => 
        prev.map(amb => amb.id === id ? { ...amb, status } : amb)
      );
    } catch (error) {
      console.error('Error updating ambulance status:', error);
      onError?.('Failed to update ambulance status');
    }
  }, [onError]);

  // Initialize
  useEffect(() => {
    fetchInitialData();
    
    if (enableWebSocket) {
      connectWebSocket();
    } else {
      startPolling();
    }

    return () => {
      // Cleanup
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  return {
    ambulances,
    requests,
    loading,
    connected,
    refresh,
    updateAmbulanceStatus,
    // Stats computed from current data
    stats: {
      totalAmbulances: ambulances.length,
      availableAmbulances: ambulances.filter(a => a.status === 'AVAILABLE').length,
      dispatchedAmbulances: ambulances.filter(a => a.status === 'DISPATCHED').length,
      onDutyAmbulances: ambulances.filter(a => a.status === 'ON_DUTY').length,
      totalRequests: requests.length,
      pendingRequests: requests.filter(r => r.status === 'PENDING').length,
      activeRequests: requests.filter(r => !['COMPLETED', 'CANCELLED'].includes(r.status)).length,
    }
  };
}
