import { useEffect } from "react";
import type { AmbulanceData, EmergencyRequest } from "@/types";

interface WebSocketConfig {
  onAmbulancesUpdate: (data: AmbulanceData[]) => void;
  onRequestsUpdate: (data: EmergencyRequest[]) => void;
}

export function useWebSocket({
  onAmbulancesUpdate,
  onRequestsUpdate,
}: WebSocketConfig) {
  useEffect(() => {
    //TODO Handle WebSocket connection
    const ws = new WebSocket("ws://localhost:8080/ws/updates");

    ws.onopen = () => {
      console.log("Connected to WebSocket");
    };

    ws.onclose = () => {
      console.log("WebSocket connection closed");
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.ambulances) {
        onAmbulancesUpdate(data.ambulances);
      }
      if (data.requests) {
        onRequestsUpdate(data.requests);
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    return () => ws.close();
  }, [onAmbulancesUpdate, onRequestsUpdate]);
}
