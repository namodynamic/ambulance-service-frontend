"use client";

import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Ambulance, Navigation, Locate, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AmbulanceData, EmergencyRequest } from "@/types";
import { geocodeAddress } from "@/utils/geocoding";
import { useAuth } from "@/hooks/useAuth";

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const createCustomIcon = (color: string, iconType: "ambulance" | "request") => {
  const ambulanceIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M10 10H6"/>
      <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/>
      <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/>
      <circle cx="17" cy="18" r="2"/>
      <circle cx="7" cy="18" r="2"/>
    </svg>
  `;

  const requestIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  `;

  const svgIcon = iconType === "ambulance" ? ambulanceIcon : requestIcon;
  const size = iconType === "ambulance" ? 32 : 28;

  return L.divIcon({
    html: `
      <div style="
        background-color: ${color};
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        border: 3px solid white;
      ">
        ${svgIcon}
      </div>
    `,
    className: "custom-marker",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

function CenterMapOnLoad() {
  const map = useMap();

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          map.setView([latitude, longitude], 13);
        },
        (error) => {
          console.error("Error getting user location on load:", error);
        }
      );
    } else {
      console.log("Geolocation is not supported by this browser.");
    }
  }, [map]); // Runs once on map initialization

  return null;
}

// Map controls component
function MapControls({
  onLocate,
  onReset,
}: {
  onLocate: () => void;
  onReset: () => void;
}) {
  const map = useMap();

  const handleLocate = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          map.setView([latitude, longitude], 15);
          onLocate();
        },
        (error) => {
          console.error("Error getting location:", error);
          // Fallback to default location (Lagos)
          map.setView([6.5244, 3.3792], 12);
        }
      );
    } else {
      // Fallback to default location
      map.setView([6.5244, 3.3792], 12);
    }
  };

  const handleReset = () => {
    map.setView([6.5244, 3.3792], 12);
    if (onReset) {
      onReset();
    }
  };

  return (
    <div className="leaflet-top leaflet-right">
      <div className="leaflet-control leaflet-bar">
        <Button
          size="sm"
          variant="secondary"
          onClick={handleLocate}
          className="mb-1 h-8 w-8 p-0"
          title="Find my location"
        >
          <Locate className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={handleReset}
          className="h-8 w-8 p-0"
          title="Reset view"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

interface MapViewProps {
  ambulances?: AmbulanceData[];
  requests?: EmergencyRequest[];
  selectedRequest?: EmergencyRequest | null;
  onAmbulanceClick?: (ambulance: AmbulanceData) => void;
  onRequestClick?: (request: EmergencyRequest) => void;
  className?: string;
  connected?: boolean;
  onRefresh?: () => void;
  lastUpdated?: Date;
}

interface MapMarker {
  id: string;
  type: "ambulance" | "request";
  position: { lat: number; lng: number };
  data: AmbulanceData | EmergencyRequest;
}

export function MapView({
  ambulances = [],
  requests = [],
  onAmbulanceClick,
  onRequestClick,
  className = "",
}: MapViewProps) {
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const { isAdmin } = useAuth();

  useEffect(() => {
    const fetchMarkers = async () => {
      const markerPromises = [
        ...ambulances.map(async (ambulance) => {
          if (!ambulance.currentLocation) return null;
          // Using mock geocoding to avoid CORS and rate-limiting issues with Nominatim.
          const position = await geocodeAddress(ambulance.currentLocation);
          return position
            ? {
                id: `ambulance-${ambulance.id}`,
                type: "ambulance" as const,
                position,
                data: ambulance,
              }
            : null;
        }),
        ...requests.map(async (request) => {
          if (!request.location) return null;
          // Using mock geocoding to avoid CORS and rate-limiting issues with Nominatim.
          const position = await geocodeAddress(request.location);
          return position
            ? {
                id: `request-${request.id}`,
                type: "request" as const,
                position,
                data: request,
              }
            : null;
        }),
      ];

      const resolvedMarkers = await Promise.all(markerPromises);
      const filteredMarkers = (resolvedMarkers as MapMarker[]).filter(
        (marker) => marker !== null
      );
      setMarkers(filteredMarkers);
    };

    fetchMarkers();
  }, [ambulances, requests]);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "available":
        return "bg-green-500";
      case "on_duty":
      case "dispatched":
        return "bg-blue-500";
      case "maintenance":
        return "bg-yellow-500";
      case "pending":
        return "bg-orange-500";
      case "completed":
        return "bg-gray-500";
      case "cancelled":
        return "bg-red-500";
      default:
        return "bg-gray-400";
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Navigation className="h-5 w-5 mr-2" />
          Live Map View
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative rounded-lg h-96 overflow-hidden">
          <MapContainer
            center={[6.5244, 3.3792]} // Default to Lagos, Nigeria
            zoom={12}
            className="h-full w-full rounded-lg"
            zoomControl={false}
          >
            <CenterMapOnLoad />

            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Ambulance Markers */}
            {markers
              .filter((marker) => marker.type === "ambulance")
              .map((marker) => {
                const ambulance = marker.data as AmbulanceData;
                const color = getStatusColor(ambulance.status || "")
                  .replace("bg-", "")
                  .replace("-500", "");
                const iconColor =
                  color === "green"
                    ? "#10b981"
                    : color === "blue"
                    ? "#3b82f6"
                    : color === "yellow"
                    ? "#f59e0b"
                    : color === "orange"
                    ? "#f97316"
                    : color === "red"
                    ? "#ef4444"
                    : "#6b7280";

                return (
                  <Marker
                    key={marker.id}
                    position={[marker.position.lat, marker.position.lng]}
                    icon={createCustomIcon(iconColor, "ambulance")}
                    eventHandlers={{
                      click: () => onAmbulanceClick?.(ambulance),
                    }}
                  >
                    <Popup>
                      <div className="p-2 min-w-48">
                        <div className="flex items-center gap-2 mb-2">
                          <Ambulance className="h-4 w-4" />
                          <span className="font-semibold">
                            {ambulance.licensePlate}
                          </span>
                        </div>
                        <div className="text-sm space-y-1">
                          <div>
                            <strong>Status:</strong>{" "}
                            <span
                              className={`px-2 py-1 rounded text-xs text-white ${getStatusColor(
                                ambulance.status || ""
                              )}`}
                            >
                              {ambulance.status}
                            </span>
                          </div>
                          <div>
                            <strong>Driver:</strong> {ambulance.driverName}
                          </div>
                          <div>
                            <strong>Location:</strong>{" "}
                            {ambulance.currentLocation}
                          </div>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}

            {/* Request Markers */}
            {markers
              .filter((marker) => marker.type === "request")
              .map((marker) => {
                const request = marker.data as EmergencyRequest;
                const iconColor = "#9c27b0";

                return (
                  <Marker
                    key={marker.id}
                    position={[marker.position.lat, marker.position.lng]}
                    icon={createCustomIcon(iconColor, "request")}
                    eventHandlers={{
                      click: () => onRequestClick?.(request),
                    }}
                  >
                    <Popup>
                      <div className="p-2 min-w-48">
                        <div className="flex items-center gap-2 mb-2">
                          <MapPin className="h-4 w-4" />
                          <span className="font-semibold">
                            REQ-{String(request.id).padStart(4, "0")}
                          </span>
                        </div>
                        <div className="text-sm space-y-1">
                          <div>
                            <strong>Status:</strong>{" "}
                            <span
                              className={`px-1 py-1 rounded text-xs text-white ${getStatusColor(
                                request.status
                              )}`}
                            >
                              {request.status}
                            </span>
                          </div>
                          <div>
                            <strong>Patient:</strong> {request.userName}
                          </div>
                          <div>
                            <strong>Location:</strong> {request.location}
                          </div>
                          {request.emergencyDescription && (
                            <div>
                              <strong>Details:</strong> {request.medicalNotes}
                            </div>
                          )}
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}

            {/* Map Controls */}
            <MapControls
              onLocate={() => console.log("Location found")}
              onReset={() => console.log("Map reset")}
            />
          </MapContainer>

          {/* Map Legend */}
          <div className="absolute bottom-4 left-4 bg-white/20 dark:bg-gray-800/50 p-3 backdrop-blur-3xl rounded-lg shadow-lg z-[1000]">
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Available Ambulance</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span>On Duty Ambulance</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span>Maintenance</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span>Ongoing Request</span>
              </div>
            </div>
          </div>

          <div className="absolute top-12 right-2 bg-white dark:bg-gray-800 max-md:hidden p-2 rounded-lg shadow-lg z-[1000]">
            <div className="text-xs text-muted-foreground flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
              Live View
            </div>
          </div>
        </div>

        {/* Map stats */}
        {isAdmin && (
          <div className="grid grid-cols-4 gap-4 mt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-600">
                {ambulances.filter((a) => a.status === "DISPATCHED").length}
              </div>
              <div className="text-sm text-muted-foreground">Dispatched</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {ambulances.filter((a) => a.status === "AVAILABLE").length}
              </div>
              <div className="text-sm text-muted-foreground">Available</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {ambulances.filter((a) => a.status === "ON_DUTY").length}
              </div>
              <div className="text-sm text-muted-foreground">On Duty</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {requests.filter((r) => r.status === "PENDING").length}
              </div>
              <div className="text-sm text-muted-foreground">Pending</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
