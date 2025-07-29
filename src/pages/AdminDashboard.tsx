"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useNotification } from "@/hooks/useNotification";
import {
  Users,
  ShieldUser,
  Ambulance,
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin,
  Phone,
  Loader2,
  Activity,
  Plus,
  Edit,
  Trash2,
  FileText,
  Calendar,
} from "lucide-react";
import {
  ambulanceAPI,
  requestAPI,
  userAPI,
  patientAPI,
  serviceHistoryAPI,
  dispatchAPI,
} from "@/api/ambulanceServiceAPI";
import type {
  AmbulanceData,
  EmergencyRequest,
  Patient,
  ServiceHistory,
  User,
} from "@/types";
import { MapView } from "@/components/MapView";

interface DashboardStats {
  totalRequests: number;
  activeRequests: number;
  availableAmbulances: number;
  totalAmbulances: number;
  totalUsers: number;
  totalPatients: number;
}

export default function AdminDashboard() {
  const { success, error: notifyError } = useNotification();
  const [stats, setStats] = useState<DashboardStats>({
    totalRequests: 0,
    activeRequests: 0,
    availableAmbulances: 0,
    totalAmbulances: 0,
    totalUsers: 0,
    totalPatients: 0,
  });
  const [pendingRequests, setPendingRequests] = useState<EmergencyRequest[]>(
    []
  );
  const [ambulances, setAmbulances] = useState<AmbulanceData[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] =
    useState<EmergencyRequest | null>(null);

  // Form states
  const [newAmbulance, setNewAmbulance] = useState({
    licensePlate: "",
    location: "",
    status: "AVAILABLE" as AmbulanceData["status"],
  });

  const [editingAmbulance, setEditingAmbulance] =
    useState<AmbulanceData | null>(null);

  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [serviceHistory, setServiceHistory] = useState<ServiceHistory[]>([]);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [
        requestsData,
        ambulancesData,
        usersData,
        patientsData,
        historyData,
      ] = await Promise.all([
        requestAPI
          .getAll(0, 50)
          .catch(() => ({ content: [], totalElements: 0, totalPages: 1 })),
        ambulanceAPI.getAll().catch(() => []),
        userAPI.getAll().catch(() => []),
        patientAPI.getAll().catch(() => []),
        serviceHistoryAPI.getAll().catch(() => []),
      ]);

      const requests = requestsData.content || [];
      const pendingReqs = requests.filter(
        (r: EmergencyRequest) => r.status === "PENDING"
      );

      setStats({
        totalRequests: requestsData.totalElements || requests.length,
        activeRequests: pendingReqs.length,
        availableAmbulances: ambulancesData.filter(
          (a: AmbulanceData) => a.status === "AVAILABLE"
        ).length,
        totalAmbulances: ambulancesData.length,
        totalUsers: usersData.length,
        totalPatients: patientsData.length,
      });

      setPendingRequests(pendingReqs);
      setAmbulances(ambulancesData);
      setUsers(usersData);
      setPatients(patientsData);
      setServiceHistory(historyData);
      setTotalPages(requestsData.totalPages || 1);
    } catch (error: unknown) {
      let message = "Error loading dashboard";
      if (error instanceof Error) {
        message = error.message || message;
      }
      notifyError("Error loading dashboard", message);
    } finally {
      setLoading(false);
    }
  };

  const mappedAmbulances = ambulances.map((a) => ({
    id: a.id,
    licensePlate: a.licensePlate || `AMB-${a.id}`,
    driverName: a.driverName || "",
    location: a.currentLocation || "",
    status: a.availability,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
  }));

  const handleDispatchAmbulance = async (requestId: number) => {
    try {
      await dispatchAPI.dispatchAmbulance(requestId);
      success(
        "Ambulance dispatched",
        "Ambulance has been assigned to the request"
      );
      fetchDashboardData();
    } catch (error: unknown) {
      let message = "Failed to dispatch ambulance";
      if (error instanceof Error) {
        message = error.message || message;
      }
      notifyError("Dispatch failed", message);
    }
  };

  const handleCreateAmbulance = async () => {
    try {
      await ambulanceAPI.create({
        licensePlate: newAmbulance.licensePlate,
        location: newAmbulance.location,
        status: newAmbulance.status,
      });
      success("Ambulance created", "New ambulance has been added to the fleet");
      setNewAmbulance({
        licensePlate: "",
        location: "",
        status: "AVAILABLE",
      });
      fetchDashboardData();
    } catch (error: unknown) {
      let message = "Failed to create ambulance";
      if (error instanceof Error) {
        message = error.message || message;
      }
      notifyError("Failed to create ambulance", message);
    }
  };

  const handleUpdateAmbulance = async () => {
    if (!editingAmbulance?.id) return;

    try {
      await ambulanceAPI.update(editingAmbulance.id, {
        ...editingAmbulance,
        status: editingAmbulance.status,
      });
      success("Ambulance updated", "Ambulance information has been updated");
      setEditingAmbulance(null);
      fetchDashboardData();
    } catch (error: unknown) {
      let message = "Failed to update ambulance";
      if (error instanceof Error) {
        message = error.message || message;
      }
      notifyError("Failed to update ambulance", message);
    }
  };

  const handleDeleteAmbulance = async (id: number) => {
    try {
      await ambulanceAPI.delete(id);
      success("Ambulance deleted", "Ambulance has been removed from the fleet");
      fetchDashboardData();
    } catch (error: unknown) {
      let message = "Failed to delete ambulance";
      if (error instanceof Error) {
        message = error.message || message;
      }
      notifyError("Failed to delete ambulance", message);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "available":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "on_duty":
      case "dispatched":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
      case "maintenance":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "pending":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400";
      case "completed":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor and manage emergency services operations
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Requests
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalRequests}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Requests
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {stats.activeRequests}
              </div>
              <p className="text-xs text-muted-foreground">Pending dispatch</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Available Ambulances
              </CardTitle>
              <Ambulance className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.availableAmbulances}
              </div>
              <p className="text-xs text-muted-foreground">
                Ready for dispatch
              </p>
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

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {stats.totalUsers}
              </div>
              <p className="text-xs text-muted-foreground">Registered users</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Patients
              </CardTitle>
              <ShieldUser className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {stats.totalPatients}
              </div>
              <p className="text-xs text-muted-foreground">
                Registered patients
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mb-10">
          <MapView
            ambulances={ambulances}
            requests={pendingRequests}
            selectedRequest={selectedRequest}
            onRequestClick={setSelectedRequest}
          />
        </div>

        <Tabs defaultValue="requests" className="space-y-8">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
            <TabsTrigger value="requests">Pending Requests</TabsTrigger>
            <TabsTrigger value="ambulances">Fleet Management</TabsTrigger>
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="history">Service History</TabsTrigger>
          </TabsList>

          {/* Pending Requests Tab */}
          <TabsContent value="requests" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Pending Emergency Requests</CardTitle>
                <CardDescription>
                  Requests awaiting ambulance dispatch
                </CardDescription>
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
                      <Card
                        key={request.id}
                        className="border-l-4 border-l-orange-500"
                      >
                        <CardContent className="pt-6">
                          <div className="flex items-start max-md:flex-col gap-2 justify-between">
                            <div className="flex-1">
                              <div className="flex items-center flex-wrap gap-2 mb-2">
                                <Badge
                                  className={getStatusColor(request.status)}
                                >
                                  {request.status}
                                </Badge>
                                <span className="text-sm text-muted-foreground">
                                  #REQST-0{request.id}
                                </span>
                                <div className="flex items-center text-sm text-muted-foreground">
                                  <Clock className="h-4 w-4 mr-1" />
                                  {request.requestTime &&
                                    new Date(
                                      request.requestTime
                                    ).toLocaleString()}
                                </div>
                              </div>

                              <div className="space-y-2">
                                <div className="flex items-start flex-wrap gap-2">
                                  <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                                  <div>
                                    <p className="font-medium">
                                      {request.location}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      {request.emergencyDescription}
                                    </p>
                                    {request.medicalNotes && (
                                      <p className="text-sm text-muted-foreground italic">
                                        Medical Note: {request.medicalNotes}
                                      </p>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center flex-wrap gap-2 text-sm text-muted-foreground">
                                  <Phone className="h-4 w-4" />
                                  <span>Caller: {request.userName}</span>
                                  <span>•</span>
                                  <span>Patient: {request.patientName}</span>
                                  <span>•</span>
                                  <span>{request.userContact}</span>
                                </div>
                              </div>
                            </div>

                            <Button
                              onClick={() =>
                                handleDispatchAmbulance(request.id!)
                              }
                              className="bg-red-600 hover:bg-red-700 text-white"
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

          {/* Fleet Management Tab */}
          <TabsContent value="ambulances" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Ambulance Fleet Management</CardTitle>
                    <CardDescription>
                      Manage ambulance fleet and assignments
                    </CardDescription>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Ambulance
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Ambulance</DialogTitle>
                        <DialogDescription>
                          Add a new ambulance to the fleet
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="plateNumber">Plate Number</Label>
                          <Input
                            id="plateNumber"
                            value={newAmbulance.licensePlate}
                            onChange={(e) =>
                              setNewAmbulance({
                                ...newAmbulance,
                                licensePlate: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div>
                          <Label htmlFor="location">Location</Label>
                          <Input
                            id="location"
                            value={newAmbulance.location}
                            onChange={(e) =>
                              setNewAmbulance({
                                ...newAmbulance,
                                location: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div>
                          <Label htmlFor="status">Status</Label>
                          <Select
                            value={newAmbulance.status}
                            onValueChange={(value) =>
                              setNewAmbulance({
                                ...newAmbulance,
                                status: value as AmbulanceData["status"],
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="AVAILABLE">
                                Available
                              </SelectItem>
                              <SelectItem value="DISPATCHED">
                                Dispatched
                              </SelectItem>
                              <SelectItem value="ON_DUTY">On Duty</SelectItem>
                              <SelectItem value="UNAVAILABLE">
                                Unavailable
                              </SelectItem>
                              <SelectItem value="MAINTENANCE">
                                Maintenance
                              </SelectItem>
                              <SelectItem value="OUT_OF_SERVICE">
                                Out of Service
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button
                          onClick={handleCreateAmbulance}
                          className="w-full"
                        >
                          Create Ambulance
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {mappedAmbulances.map((ambulance) => (
                    <Card key={ambulance.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="font-semibold">
                              {ambulance.licensePlate || "Unknown"}
                            </h3>
                            <div className="items-center flex-wrap inline-flex">
                              <MapPin className="h-4 w-4 mr-2 text-red-500" />
                            <p className="text-sm text-muted-foreground">
                                {ambulance.location || "Unknown"}
                            </p>
                            </div>
                          </div>
                          <Badge
                            className={getStatusColor(ambulance.status || "")}
                          >
                            {ambulance.status || "Unknown"}
                          </Badge>
                        </div>

                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEditingAmbulance(ambulance)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Edit Ambulance</DialogTitle>
                                <DialogDescription>
                                  Update ambulance information
                                </DialogDescription>
                              </DialogHeader>
                              {editingAmbulance && (
                                <div className="space-y-4">
                                  <div>
                                    <Label htmlFor="editPlateNumber">
                                      Plate Number
                                    </Label>
                                    <Input
                                      id="editPlateNumber"
                                      value={editingAmbulance.licensePlate}
                                      onChange={(e) =>
                                        setEditingAmbulance({
                                          ...editingAmbulance,
                                          licensePlate: e.target.value,
                                        })
                                      }
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="editDriverName">
                                      Driver Name
                                    </Label>
                                    <Input
                                      id="editDriverName"
                                      value={editingAmbulance.driverName}
                                      onChange={(e) =>
                                        setEditingAmbulance({
                                          ...editingAmbulance,
                                          driverName: e.target.value,
                                        })
                                      }
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="editLocation">
                                      Location
                                    </Label>
                                    <Input
                                      id="editLocation"
                                      value={editingAmbulance.location}
                                      onChange={(e) =>
                                        setEditingAmbulance({
                                          ...editingAmbulance,
                                          location: e.target.value,
                                        })
                                      }
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="editStatus">Status</Label>
                                    <Select
                                      value={editingAmbulance.status}
                                      onValueChange={(value) =>
                                        setEditingAmbulance({
                                          ...editingAmbulance,
                                          status:
                                            value as AmbulanceData["status"],
                                        })
                                      }
                                    >
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="AVAILABLE">
                                          Available
                                        </SelectItem>
                                        <SelectItem value="DISPATCHED">
                                          Dispatched
                                        </SelectItem>
                                        <SelectItem value="ON_DUTY">
                                          On Duty
                                        </SelectItem>
                                        <SelectItem value="UNAVAILABLE">
                                          Unavailable
                                        </SelectItem>
                                        <SelectItem value="MAINTENANCE">
                                          Maintenance
                                        </SelectItem>
                                        <SelectItem value="OUT_OF_SERVICE">
                                          Out of Service
                                        </SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <Button
                                    onClick={handleUpdateAmbulance}
                                    className="w-full"
                                  >
                                    Update Ambulance
                                  </Button>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              ambulance.id &&
                              handleDeleteAmbulance(ambulance.id)
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* User Management Tab */}
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                  Manage system users and their roles
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.map((user) => (
                    <Card key={user.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold">
                              {user.firstName} {user.lastName}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              @{user.username}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {user.email}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {user.phoneNumber}
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge
                              variant={
                                user.role === "ADMIN"
                                  ? "destructive"
                                  : "secondary"
                              }
                            >
                              {user.role}
                            </Badge>
                            <p className="text-sm text-muted-foreground mt-1">
                              {user.enabled ? "Active" : "Disabled"}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Service History Tab */}
          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Service History
                </CardTitle>
                <CardDescription>
                  Track completed emergency services and response times
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Service history tracking will be displayed here
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Integration with service history API endpoints
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
