"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useNotification } from "@/hooks/useNotification";
import { Users, Ambulance, AlertTriangle, CheckCircle, Clock, MapPin, Phone, Loader2, Activity } from "lucide-react"
import { ambulanceAPI, requestAPI, userAPI } from "@/api/ambulanceServiceAPI"

interface DashboardStats {
  totalRequests: number
  activeRequests: number
  availableAmbulances: number
  totalAmbulances: number
}

interface Request {
  id: string
  incidentLocation: string
  description: string
  status: string
  requestTime: string
  urgencyLevel: string
  patient: {
    name: string
    contactNumber: string
  }
}

interface AmbulanceInfo {
  id: string
  vehicleNumber: string
  driverName: string
  status: string
  currentLocation?: string
}

export default function AdminDashboard() {
  const { success, error: notifyError } = useNotification();
  const [stats, setStats] = useState<DashboardStats>({
    totalRequests: 0,
    activeRequests: 0,
    availableAmbulances: 0,
    totalAmbulances: 0,
  })
  const [pendingRequests, setPendingRequests] = useState<Request[]>([])
  const [ambulances, setAmbulances] = useState<AmbulanceInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [patients, setPatients] = useState([])
  const [serviceHistory, setServiceHistory] = useState([])

  // Add ambulance management section
  const handleCreateAmbulance = async (ambulanceData: any) => {
    try {
      await ambulanceAPI.create(ambulanceData)
      success("Ambulance created","New ambulance has been added to the fleet")
    } catch (error: unknown) {
      notifyError("Failed to create ambulance", error.message || "Unknown error",
      )
    }
  }

  const handleUpdateAmbulanceStatus = async (id: string, status: string) => {
    try {
      await ambulanceAPI.updateStatus(id, status)
      success("Ambulance status updated", "Ambulance status has been updated")
    } catch (error: any) {
      notifyError("Failed to update ambulance status", error.message)
    }
  }

  // Add patient management
  const handleGetAllPatients = async () => {
    try {
      const patients = await userAPI.getAll()
      setPatients(patients)
    } catch (error: any) {
      notifyError( "Failed to fetch patients",error.message)
    }
  }

  // Add service history tracking
  const handleGetServiceHistory = async () => {
    try {
      const history = await ambulanceAPI.getServiceHistory()
      setServiceHistory(history)
    } catch (error: any) {
      notifyError( "Failed to fetch service history", error.message)
    }
  }

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [requests, ambulances, users] = await Promise.all([
          requestAPI.getAll(),
          ambulanceAPI.getAll(),
          userAPI.getAll(),
        ]);

        setStats({
          totalRequests: requests.length,
          activeRequests: requests.filter(r => r.status === "PENDING" || r.status === "IN_PROGRESS").length,
          availableAmbulances: ambulances.filter(a => a.status === "AVAILABLE").length,
          totalAmbulances: ambulances.length,
        });

        setPendingRequests(requests.filter(r => r.status === "PENDING"));
        setAmbulances(ambulances);
        setPatients(users);
      } catch (error: any) {
        notifyError("Error loading dashboard", error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleDispatchAmbulance = async (requestId: string) => {
    try {
      await ambulanceAPI.dispatchAmbulance(requestId)
      success( "Ambulance dispatched", "Ambulance has been assigned to the request")

      // Refresh data
      const pending = await requestAPI.getAll()
      setPendingRequests(pending.filter(r => r.status === "PENDING"));
    } catch (error: any) {
      notifyError( "Dispatch failed", error.message)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "available":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
      case "busy":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
      case "maintenance":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
    }
  }

  const getUrgencyColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case "critical":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
      case "high":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400"
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
      case "low":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Monitor and manage emergency services operations</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalRequests}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Requests</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.activeRequests}</div>
              <p className="text-xs text-muted-foreground">Pending dispatch</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available Ambulances</CardTitle>
              <Ambulance className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.availableAmbulances}</div>
              <p className="text-xs text-muted-foreground">Ready for dispatch</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Fleet</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalAmbulances}</div>
              <p className="text-xs text-muted-foreground">All ambulances</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="requests" className="space-y-6">
          <TabsList>
            <TabsTrigger value="requests">Pending Requests</TabsTrigger>
            <TabsTrigger value="ambulances">Ambulance Fleet</TabsTrigger>
          </TabsList>

          <TabsContent value="requests" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Pending Emergency Requests</CardTitle>
                <CardDescription>Requests awaiting ambulance dispatch</CardDescription>
              </CardHeader>
              <CardContent>
                {pendingRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 mx-auto text-green-600 mb-4" />
                    <p className="text-muted-foreground">No pending requests</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingRequests.map((request) => (
                      <Card key={request.id} className="border-l-4 border-l-orange-500">
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge className={getUrgencyColor(request.urgencyLevel)}>{request.urgencyLevel}</Badge>
                                <span className="text-sm text-muted-foreground">#{request.id.slice(-8)}</span>
                                <div className="flex items-center text-sm text-muted-foreground">
                                  <Clock className="h-4 w-4 mr-1" />
                                  {new Date(request.requestTime).toLocaleString()}
                                </div>
                              </div>

                              <div className="space-y-2">
                                <div className="flex items-start gap-2">
                                  <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                                  <div>
                                    <p className="font-medium">{request.incidentLocation}</p>
                                    <p className="text-sm text-muted-foreground">{request.description}</p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Phone className="h-4 w-4" />
                                  <span>Patient: {request.patient.name}</span>
                                  <span>•</span>
                                  <span>{request.patient.contactNumber}</span>
                                </div>
                              </div>
                            </div>

                            <Button
                              onClick={() => handleDispatchAmbulance(request.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Dispatch Ambulance
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ambulances" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Ambulance Fleet Status</CardTitle>
                <CardDescription>Current status of all ambulances</CardDescription>
              </CardHeader>
              <CardContent>
                {ambulances.length === 0 ? (
                  <div className="text-center py-8">
                    <Ambulance className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No ambulances registered</p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {ambulances.map((ambulance) => (
                      <Card key={ambulance.id}>
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h3 className="font-semibold">{ambulance.vehicleNumber}</h3>
                              <p className="text-sm text-muted-foreground">Driver: {ambulance.driverName}</p>
                            </div>
                            <Badge className={getStatusColor(ambulance.status)}>{ambulance.status}</Badge>
                          </div>

                          {ambulance.currentLocation && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <MapPin className="h-4 w-4" />
                              <span>{ambulance.currentLocation}</span>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
