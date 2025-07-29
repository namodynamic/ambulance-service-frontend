"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin, Ambulance, Navigation, Clock } from "lucide-react"
import type { AmbulanceData, EmergencyRequest } from "@/types"
// import type { AmbulanceData, EmergencyRequest } from "@/api/ambulanceServiceAPI"

interface MapViewProps {
  ambulances?: AmbulanceData[]
  requests?: EmergencyRequest[]
  selectedRequest?: EmergencyRequest | null
  onAmbulanceClick?: (ambulance: AmbulanceData) => void
  onRequestClick?: (request: EmergencyRequest) => void
  className?: string
}

interface MapMarker {
  id: string
  type: "ambulance" | "request"
  position: { lat: number; lng: number }
  data: AmbulanceData | EmergencyRequest
}

export function MapView({
  ambulances = [],
  requests = [],
  selectedRequest,
  onAmbulanceClick,
  onRequestClick,
  className = "",
}: MapViewProps) {
  const [markers, setMarkers] = useState<MapMarker[]>([])

  // Mock coordinates for demonstration - in real app, you'd geocode addresses
  const getCoordinatesFromLocation = (location: string): { lat: number; lng: number } => {
    // Simple hash function to generate consistent coordinates from location string
    let hash = 0
    for (let i = 0; i < location.length; i++) {
      const char = location.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32bit integer
    }

    // Generate coordinates within a reasonable range (e.g., around a city center)
    const lat = 40.7128 + (hash % 1000) / 10000 // Around NYC
    const lng = -74.006 + ((hash >> 10) % 1000) / 10000

    return { lat, lng }
  }

  useEffect(() => {
    const newMarkers: MapMarker[] = []

    // Add ambulance markers
    ambulances.forEach((ambulance) => {
      if (ambulance.location) {
        newMarkers.push({
          id: `ambulance-${ambulance.id}`,
          type: "ambulance",
          position: getCoordinatesFromLocation(ambulance.location),
          data: ambulance,
        })
      }
    })

    // Add request markers
    requests.forEach((request) => {
      if (request.location) {
        newMarkers.push({
          id: `request-${request.id}`,
          type: "request",
          position: getCoordinatesFromLocation(request.location),
          data: request,
        })
      }
    })

    setMarkers(newMarkers)
  }, [ambulances, requests])

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "available":
        return "bg-green-500"
      case "on_duty":
      case "dispatched":
        return "bg-blue-500"
      case "maintenance":
        return "bg-yellow-500"
      case "pending":
        return "bg-orange-500"
      case "completed":
        return "bg-gray-500"
      case "cancelled":
        return "bg-red-500"
      default:
        return "bg-gray-400"
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Navigation className="h-5 w-5 mr-2" />
          Live Map View
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Map Container - In a real app, this would be a Leaflet or Mapbox map */}
        <div className="relative bg-gray-100 dark:bg-gray-800 rounded-lg h-96 overflow-hidden">
          {/* Grid background to simulate map */}
          <div className="absolute inset-0 opacity-20">
            <div className="grid grid-cols-8 grid-rows-6 h-full">
              {Array.from({ length: 48 }).map((_, i) => (
                <div key={i} className="border border-gray-300 dark:border-gray-600" />
              ))}
            </div>
          </div>

          {/* Map Markers */}
          {markers.map((marker) => (
            <div
              key={marker.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer hover:scale-110 transition-transform"
              style={{
                left: `${((marker.position.lng + 74.006) / 0.1) * 100}%`,
                top: `${((40.7128 - marker.position.lat) / 0.1) * 100}%`,
              }}
              onClick={() => {
                if (marker.type === "ambulance" && onAmbulanceClick) {
                  onAmbulanceClick(marker.data as AmbulanceData)
                } else if (marker.type === "request" && onRequestClick) {
                  onRequestClick(marker.data as EmergencyRequest)
                }
              }}
            >
              {marker.type === "ambulance" ? (
                <div className="relative">
                  <div
                    className={`w-8 h-8 rounded-full ${getStatusColor(
                      (marker.data as AmbulanceData).status || "",
                    )} flex items-center justify-center shadow-lg`}
                  >
                    <Ambulance className="h-4 w-4 text-white" />
                  </div>
                  <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 px-2 py-1 rounded text-xs shadow-md whitespace-nowrap">
                    {(marker.data as AmbulanceData).licensePlate}
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <div
                    className={`w-6 h-6 rounded-full ${getStatusColor(
                      (marker.data as EmergencyRequest).status,
                    )} flex items-center justify-center shadow-lg ${
                      selectedRequest?.id === marker.data.id ? "ring-4 ring-blue-400" : ""
                    }`}
                  >
                    <MapPin className="h-3 w-3 text-white" />
                  </div>
                  <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 px-2 py-1 rounded text-xs shadow-md whitespace-nowrap">
                    REQ-{marker.data.id}
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Map Legend */}
          <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg">
            <h4 className="font-semibold text-sm mb-2">Legend</h4>
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
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <span>Pending Request</span>
              </div>
            </div>
          </div>

          {/* Map Controls */}
          <div className="absolute top-4 right-4 bg-white dark:bg-gray-800 p-2 rounded-lg shadow-lg">
            <div className="text-xs text-muted-foreground">
              <Clock className="h-3 w-3 inline mr-1" />
              Live View
            </div>
          </div>
        </div>

        {/* Map Statistics */}
        <div className="grid grid-cols-3 gap-4 mt-4">
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
      </CardContent>
    </Card>
  )
}
