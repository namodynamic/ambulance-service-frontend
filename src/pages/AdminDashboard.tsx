"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
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
  Eye,
  ExternalLink,
  Search,
  UserCheck,
  Settings,
} from "lucide-react";
import { PaginationControls } from "@/components/PaginationControls";
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
import { Link } from "react-router-dom";
import { Textarea } from "@/components/ui/textarea";

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

  const [allRequests, setAllRequests] = useState<EmergencyRequest[]>([]);
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
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [serviceHistory, setServiceHistory] = useState<ServiceHistory[]>([]);

  // Filter states
  const [requestFilter, setRequestFilter] = useState("all");
  const [requestSearch, setRequestSearch] = useState("");
  const [serviceFilter, setServiceFilter] = useState("all");
  const [userSearch, setUserSearch] = useState("");
  const [patientSearch, setPatientSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const [currentPage, setCurrentPage] = useState(1);
  const [pendingCurrentPage, setPendingCurrentPage] = useState(1);
  const [usersCurrentPage, setUsersCurrentPage] = useState(1);
  const [patientsCurrentPage, setPatientsCurrentPage] = useState(1);
  const [serviceHistoryCurrentPage, setServiceHistoryCurrentPage] = useState(1);
  const itemsPerPage = 9;

  useEffect(() => {
    setUsersCurrentPage(1);
  }, [userSearch]);

  useEffect(() => {
    setServiceHistoryCurrentPage(1);
  }, [serviceFilter]);

  useEffect(() => {
    setPatientsCurrentPage(1);
  }, [patientSearch]);

  useEffect(() => {
    setCurrentPage(1);
  }, [requestFilter, requestSearch]);

  const fetchDashboardData = useCallback(async () => {
    try {
      const [
        requestsData,
        ambulancesData,
        usersData,
        patientsData,
        historyData,
      ] = await Promise.all([
        requestAPI
          .getAll(0, 100)
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
      const activeReqsCount = requests.filter(
        (r: EmergencyRequest) => !["COMPLETED", "CANCELLED"].includes(r.status)
      ).length;

      setStats({
        totalRequests: requestsData.totalElements || requests.length,
        activeRequests: activeReqsCount,
        availableAmbulances: ambulancesData.filter(
          (a: AmbulanceData) =>
            a.availability === ("AVAILABLE" as AmbulanceData["status"])
        ).length,
        totalAmbulances: ambulancesData.length,
        totalUsers: usersData.length,
        totalPatients: patientsData.length,
      });

      setPendingRequests(pendingReqs);
      setAllRequests(requests);
      setAmbulances(ambulancesData);
      setUsers(usersData);
      setPatients(patientsData);
      setServiceHistory(historyData);
    } catch (error: unknown) {
      let message = "Error loading dashboard";
      if (error instanceof Error) {
        message = error.message || message;
      }
      notifyError("Error loading dashboard", message);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  const mappedAmbulances = ambulances.map((a) => ({
    id: a.id,
    licensePlate: a.licensePlate || `AMB-${a.id}`,
    driverName: a.driverName || "",
    currentLocation: a.currentLocation || "",
    status: a.availability,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
  }));

  const activeRequests = useMemo(
    () =>
      allRequests.filter(
        (req) => !["COMPLETED", "CANCELLED"].includes(req.status)
      ),
    [allRequests]
  );

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
        currentLocation: newAmbulance.location,
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
        availability: editingAmbulance.status,
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

  const handleMarkAvailable = async (id: number) => {
    try {
      await ambulanceAPI.markAvailable(id);
      success(
        "Ambulance marked as available",
        "Ambulance is now ready for dispatch"
      );
      fetchDashboardData();
    } catch (error: unknown) {
      let message = "Failed to update status";
      if (error instanceof Error) {
        message = error.message || message;
      }
      notifyError("Failed to update status", message);
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

  const handleUpdatePatient = async () => {
    if (!editingPatient?.id) return;

    try {
      await patientAPI.update(editingPatient.id, editingPatient);
      success("Patient updated", "Patient information has been updated");
      setEditingPatient(null);
      fetchDashboardData();
    } catch (error: unknown) {
      let message = "Failed to update patient";
      if (error instanceof Error) {
        message = error.message || message;
      }
      notifyError("Failed to update patient", message);
    }
  };

  const handleSoftDeletePatient = async (id: number) => {
    try {
      await patientAPI.softDelete(id);
      success("Patient archived", "Patient has been archived");
      fetchDashboardData();
    } catch (error: unknown) {
      let message = "Failed to archive patient";
      if (error instanceof Error) {
        message = error.message || message;
      }
      notifyError("Failed to archive patient", message);
    }
  };

  const handleHardDeletePatient = async (id: number) => {
    try {
      await patientAPI.hardDelete(id);
      success("Patient deleted", "Patient has been permanently deleted");
      fetchDashboardData();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      let message = "Failed to delete patient";
      if (error?.response?.status === 409 && error?.response?.data) {
        message = error.response.data;
      } else if (error instanceof Error) {
        message = error.message || message;
      }
      notifyError("Failed to delete patient", message);
    }
  };

  const handleUpdateServiceStatus = async (
    id: number,
    status: string,
    notes?: string
  ) => {
    try {
      await serviceHistoryAPI.updateStatus(id, status, notes);
      success("Service status updated", "Service history has been updated");
      fetchDashboardData();
    } catch (error: unknown) {
      let message = "Failed to update service status";
      if (error instanceof Error) {
        message = error.message || message;
      }
      notifyError("Failed to update service", message);
    }
  };

  const handleMarkServiceCompleted = async (id: number, notes?: string) => {
    try {
      await serviceHistoryAPI.markCompleted(id, notes);
      success(
        "Service completed",
        "Service history has been marked as completed"
      );
      fetchDashboardData();
    } catch (error: unknown) {
      let message = "Failed to mark service as completed";
      if (error instanceof Error) {
        message = error.message || message;
      }
      notifyError("Failed to mark service as completed", message);
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
      case "in_progress":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
      case "arrived":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  const filteredRequests = useMemo(
    () =>
      allRequests.filter((request) => {
        const matchesFilter =
          requestFilter === "all" ||
          request.status.toLowerCase() === requestFilter.toLowerCase();
        const matchesSearch =
          requestSearch === "" ||
          String(request.id).includes(requestSearch) ||
          (request.location || "")
            .toLowerCase()
            .includes(requestSearch.toLowerCase()) ||
          (request.userName || "")
            .toLowerCase()
            .includes(requestSearch.toLowerCase()) ||
          (request.patientName || "")
            .toLowerCase()
            .includes(requestSearch.toLowerCase());
        return matchesFilter && matchesSearch;
      }),
    [allRequests, requestFilter, requestSearch]
  );

  const filteredServiceHistory = useMemo(
    () =>
      serviceHistory.filter((service) => {
        return (
          serviceFilter === "all" ||
          service.status.toLowerCase() === serviceFilter.toLowerCase()
        );
      }),
    [serviceHistory, serviceFilter]
  );

  const totalPages = useMemo(
    () => Math.ceil(filteredRequests.length / itemsPerPage),
    [filteredRequests.length, itemsPerPage]
  );

  const paginatedRequests = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredRequests.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredRequests, currentPage, itemsPerPage]);

  const pendingTotalPages = useMemo(
    () => Math.ceil(pendingRequests.length / itemsPerPage),
    [pendingRequests.length, itemsPerPage]
  );

  const paginatedPendingRequests = useMemo(() => {
    const startIndex = (pendingCurrentPage - 1) * itemsPerPage;
    return pendingRequests.slice(startIndex, startIndex + itemsPerPage);
  }, [pendingRequests, pendingCurrentPage, itemsPerPage]);

  const filteredUsers = useMemo(() => {
    if (!userSearch) return users;
    const lowercasedSearch = userSearch.toLowerCase();
    return users.filter(
      (user) =>
        (user.firstName || "").toLowerCase().includes(lowercasedSearch) ||
        (user.lastName || "").toLowerCase().includes(lowercasedSearch) ||
        (user.username || "").toLowerCase().includes(lowercasedSearch) ||
        (user.email || "").toLowerCase().includes(lowercasedSearch)
    );
  }, [users, userSearch]);

  const usersTotalPages = useMemo(
    () => Math.ceil(filteredUsers.length / itemsPerPage),
    [filteredUsers.length, itemsPerPage]
  );

  const paginatedUsers = useMemo(() => {
    const startIndex = (usersCurrentPage - 1) * itemsPerPage;
    return filteredUsers.slice(startIndex, startIndex + itemsPerPage);
  }, [usersCurrentPage, itemsPerPage, filteredUsers]);

  const filteredPatients = useMemo(() => {
    if (!patientSearch) return patients;
    const lowercasedSearch = patientSearch.toLowerCase();
    return patients.filter(
      (patient) =>
        (patient.name || "").toLowerCase().includes(lowercasedSearch) ||
        (patient.contact || "").toLowerCase().includes(lowercasedSearch)
    );
  }, [patients, patientSearch]);

  const patientsTotalPages = useMemo(
    () => Math.ceil(filteredPatients.length / itemsPerPage),
    [filteredPatients.length, itemsPerPage]
  );

  const paginatedPatients = useMemo(() => {
    const startIndex = (patientsCurrentPage - 1) * itemsPerPage;
    return filteredPatients.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredPatients, patientsCurrentPage, itemsPerPage]);

  const serviceHistoryTotalPages = useMemo(
    () => Math.ceil(filteredServiceHistory.length / itemsPerPage),
    [filteredServiceHistory.length, itemsPerPage]
  );

  const paginatedServiceHistory = useMemo(() => {
    const startIndex = (serviceHistoryCurrentPage - 1) * itemsPerPage;
    return filteredServiceHistory.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredServiceHistory, serviceHistoryCurrentPage, itemsPerPage]);

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

        {/* Stats */}
        <div className="grid md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
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
              <p className="text-xs text-muted-foreground">Ongoing requests</p>
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
            ambulances={mappedAmbulances}
            requests={activeRequests}
            selectedRequest={selectedRequest}
            onRequestClick={setSelectedRequest}
          />
        </div>

        <Tabs defaultValue="pending" className="space-y-8 min-h-screen">
          <TabsList className="w-full justify-start overflow-x-auto gap-2 md:grid md:grid-cols-6 mb-6">
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="requests">All Requests</TabsTrigger>
            <TabsTrigger value="ambulances">Ambulances</TabsTrigger>
            <TabsTrigger value="patients">Patients</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="history">Service History</TabsTrigger>
          </TabsList>

          {/* Pending Requests */}
          <TabsContent value="pending" className="space-y-4">
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
                  <>
                    <div className="text-sm text-muted-foreground mb-4">
                      Showing {paginatedPendingRequests.length} of{" "}
                      {pendingRequests.length} requests
                    </div>
                    <div className="space-y-4">
                      {paginatedPendingRequests.map((request) => (
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
                                    #{String(request.id).padStart(4, "0")}
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
                                          <span className="text-amber-700">
                                            Medical Note:
                                          </span>{" "}
                                          {request.medicalNotes}
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

                              <div className="flex gap-2">
                                <Button variant="outline" size="sm" asChild>
                                  <Link to={`/request/${request.id}`}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    View
                                  </Link>
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    handleDispatchAmbulance(request.id!)
                                  }
                                  className="bg-red-600 text-white hover:bg-red-700"
                                >
                                  Dispatch
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    {pendingTotalPages > 0 && (
                      <PaginationControls
                        currentPage={pendingCurrentPage}
                        totalPages={pendingTotalPages}
                        onPageChange={setPendingCurrentPage}
                      />
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* All Requests */}
          <TabsContent value="requests" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center flex-wrap gap-5 justify-between">
                  <div>
                    <CardTitle>All Emergency Requests</CardTitle>
                    <CardDescription>
                      Manage and track all emergency requests
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search requests..."
                        value={requestSearch}
                        onChange={(e) => setRequestSearch(e.target.value)}
                        className="pl-10 w-64"
                      />
                    </div>
                    <Select
                      value={requestFilter}
                      onValueChange={setRequestFilter}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="dispatched">Dispatched</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="arrived">Arrived</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {filteredRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      No requests match your search or filters.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="text-sm text-muted-foreground">
                      Showing {paginatedRequests.length} of{" "}
                      {filteredRequests.length} requests
                    </div>
                    <div className="space-y-4 mt-4">
                      {paginatedRequests.map((request) => (
                        <Card key={request.id}>
                          <CardContent className="pt-6">
                            <div className="flex items-start flex-wrap gap-2 justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge
                                    className={getStatusColor(request.status)}
                                  >
                                    {request.status}
                                  </Badge>
                                  <span className="text-sm text-muted-foreground">
                                    #{String(request.id).padStart(4, "0")}
                                  </span>
                                  <div className="flex items-center text-sm text-muted-foreground">
                                    <Clock className="h-4 w-4 mr-1" />
                                    {request.requestTime &&
                                      new Date(
                                        request.requestTime
                                      ).toLocaleString()}
                                  </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-4">
                                  <div>
                                    <p className="font-medium">
                                      {request.location}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      {request.emergencyDescription}
                                    </p>
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    <p>Caller: {request.userName}</p>
                                    <p>
                                      Patient:{" "}
                                      {request.patientName || request.userName}
                                    </p>
                                    <p>Contact: {request.userContact}</p>
                                  </div>
                                </div>
                              </div>

                              <Button variant="outline" size="sm" asChild>
                                <Link to={`/request/${request.id}`}>
                                  <ExternalLink className="h-4 w-4 mr-1" />
                                  View Details
                                </Link>
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    {totalPages > 0 && (
                      <PaginationControls
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                      />
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Ambulances */}
          <TabsContent value="ambulances" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center flex-wrap gap-5 justify-between">
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
                        <div className="space-y-2">
                          <Label htmlFor="plateNumber">License Plate</Label>
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
                        <div className="space-y-2">
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
                        <div className="space-y-2">
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
                              <SelectItem value="ON_DUTY">On Duty</SelectItem>
                              <SelectItem value="MAINTENANCE">
                                Maintenance
                              </SelectItem>
                              <SelectItem value="OUT_OF_SERVICE">
                                Out of Service
                              </SelectItem>
                              <SelectItem value="UNAVAILABLE">
                                Unavailable
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
                              {ambulance.licensePlate}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              Location: {ambulance.currentLocation}
                            </p>
                            {ambulance.driverName && (
                              <p className="text-sm text-muted-foreground">
                                Driver: {ambulance.driverName}
                              </p>
                            )}
                          </div>
                          <Badge
                            className={getStatusColor(ambulance.status || "")}
                          >
                            {ambulance.status}
                          </Badge>
                        </div>

                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEditingAmbulance(ambulance)}
                                title="Edit Ambulance"
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
                                  <div className="space-y-2">
                                    <Label htmlFor="editPlateNumber">
                                      License Plate
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
                                  <div className="space-y-2">
                                    <Label htmlFor="editDriverName">
                                      Driver Name
                                    </Label>
                                    <Input
                                      id="editDriverName"
                                      value={editingAmbulance.driverName || ""}
                                      onChange={(e) =>
                                        setEditingAmbulance({
                                          ...editingAmbulance,
                                          driverName: e.target.value,
                                        })
                                      }
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="editLocation">
                                      Location
                                    </Label>
                                    <Input
                                      id="editLocation"
                                      value={editingAmbulance.currentLocation}
                                      onChange={(e) =>
                                        setEditingAmbulance({
                                          ...editingAmbulance,
                                          currentLocation: e.target.value,
                                        })
                                      }
                                    />
                                  </div>
                                  <div className="space-y-2">
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
                                        <SelectItem value="MAINTENANCE">
                                          Maintenance
                                        </SelectItem>
                                        <SelectItem value="OUT_OF_SERVICE">
                                          Out of Service
                                        </SelectItem>
                                        <SelectItem value="UNAVAILABLE">
                                          Unavailable
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

                          {ambulance.status !== "AVAILABLE" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleMarkAvailable(ambulance.id!)}
                              className="text-green-600 hover:text-green-700"
                              title="Mark Available"
                            >
                              <UserCheck className="h-4 w-4" />
                            </Button>
                          )}

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteAmbulance(ambulance.id!)}
                            className="text-red-600 hover:text-red-700"
                            title="Delete Ambulance"
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

          {/* Patients */}
          <TabsContent value="patients" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center flex-wrap gap-5 justify-between">
                  <div>
                    <CardTitle>Patient Management</CardTitle>
                    <CardDescription>
                      Manage patient records and medical information
                    </CardDescription>
                  </div>
                  <div className="flex items-center flex-wrap gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by name or contact..."
                        value={patientSearch}
                        onChange={(e) => setPatientSearch(e.target.value)}
                        className="pl-10 w-64"
                      />
                    </div>
                    <Button asChild>
                      <Link to="/admin/patients">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View All Patients
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {filteredPatients.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      {patients.length === 0
                        ? "No patients found."
                        : "No patients match your search."}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="text-sm text-muted-foreground mb-4">
                      Showing {paginatedPatients.length} of{" "}
                      {filteredPatients.length} patients
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {paginatedPatients.map((patient) => (
                        <Card key={patient.id}>
                          <CardContent className="pt-6">
                            <div className="space-y-3">
                              <div>
                                <h3 className="font-semibold text-lg">
                                  {patient.name}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  {patient.contact}
                                </p>
                              </div>

                              {patient.medicalNotes && (
                                <div>
                                  <p className="text-sm text-muted-foreground bg-muted p-2 rounded line-clamp-2">
                                    {patient.medicalNotes}
                                  </p>
                                </div>
                              )}

                              <div className="flex gap-2 pt-2">
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setEditingPatient(patient)}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Edit Patient</DialogTitle>
                                      <DialogDescription>
                                        Update patient information
                                      </DialogDescription>
                                    </DialogHeader>
                                    {editingPatient && (
                                      <div className="space-y-4">
                                        <div className="space-y-2">
                                          <Label htmlFor="editPatientName">
                                            Patient Name
                                          </Label>
                                          <Input
                                            id="editPatientName"
                                            value={editingPatient.name}
                                            onChange={(e) =>
                                              setEditingPatient({
                                                ...editingPatient,
                                                name: e.target.value,
                                              })
                                            }
                                          />
                                        </div>
                                        <div className="space-y-2">
                                          <Label htmlFor="editPatientContact">
                                            Contact
                                          </Label>
                                          <Input
                                            id="editPatientContact"
                                            value={editingPatient.contact}
                                            onChange={(e) =>
                                              setEditingPatient({
                                                ...editingPatient,
                                                contact: e.target.value,
                                              })
                                            }
                                          />
                                        </div>
                                        <div className="space-y-2">
                                          <Label htmlFor="editPatientNotes">
                                            Medical Notes
                                          </Label>
                                          <Textarea
                                            id="editPatientNotes"
                                            value={editingPatient.medicalNotes}
                                            onChange={(e) =>
                                              setEditingPatient({
                                                ...editingPatient,
                                                medicalNotes: e.target.value,
                                              })
                                            }
                                            className="min-h-[100px]"
                                          />
                                        </div>
                                        <Button
                                          onClick={handleUpdatePatient}
                                          className="w-full"
                                        >
                                          Update Patient
                                        </Button>
                                      </div>
                                    )}
                                  </DialogContent>
                                </Dialog>

                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    //Todo View patient requests
                                    success(
                                      "Patient Requests",
                                      "This would show all requests for this patient"
                                    );
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>

                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleSoftDeletePatient(patient.id!)
                                  }
                                  className="text-yellow-600 hover:text-yellow-700"
                                >
                                  Archive
                                </Button>

                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleHardDeletePatient(patient.id!)
                                  }
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    {patientsTotalPages > 0 && (
                      <PaginationControls
                        currentPage={patientsCurrentPage}
                        totalPages={patientsTotalPages}
                        onPageChange={setPatientsCurrentPage}
                      />
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* User Management Tab */}
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center flex-wrap gap-5 justify-between">
                  <div>
                    <CardTitle>User Management</CardTitle>
                    <CardDescription>
                      Manage system users and their roles
                    </CardDescription>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search users..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {filteredUsers.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      {users.length === 0
                        ? "No users found"
                        : "No users match the search query"}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="text-sm text-muted-foreground mb-4">
                      Showing {paginatedUsers.length} of {filteredUsers.length}{" "}
                      users
                    </div>
                    <div className="space-y-4">
                      {paginatedUsers.map((user) => (
                        <Card key={user.id}>
                          <CardContent className="pt-6">
                            <div className="flex items-center flex-wrap justify-between">
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
                              <div className="flex flex-col items-end gap-2">
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
                                <Button variant="outline" size="sm" asChild>
                                  <Link to={`/user/${user.id}`}>
                                    <ExternalLink className="h-4 w-4 mr-1" />
                                    View Details
                                  </Link>
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    {usersTotalPages > 0 && (
                      <PaginationControls
                        currentPage={usersCurrentPage}
                        totalPages={usersTotalPages}
                        onPageChange={setUsersCurrentPage}
                      />
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Service History Tab */}
          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center flex-wrap gap-5 justify-between">
                  <div>
                    <CardTitle className="flex items-center">
                      <FileText className="h-5 w-5 mr-2" />
                      Service History
                    </CardTitle>
                    <CardDescription>
                      Track and manage service history records
                    </CardDescription>
                  </div>
                  <Select
                    value={serviceFilter}
                    onValueChange={setServiceFilter}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="arrived">Arrived</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {filteredServiceHistory.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      No service history records found
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="text-sm text-muted-foreground mb-4">
                      Showing {paginatedServiceHistory.length} of{" "}
                      {filteredServiceHistory.length} records
                    </div>
                    <div className="space-y-4">
                      {paginatedServiceHistory.map((service) => (
                        <Card key={service.id}>
                          <CardContent className="pt-6">
                            <div className="flex items-start flex-wrap gap-4 justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge
                                    className={getStatusColor(service.status)}
                                  >
                                    {service.status}
                                  </Badge>
                                  <span className="text-sm text-muted-foreground">
                                    Service #{service.id}
                                  </span>
                                </div>

                                <div className="grid md:grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <p className="font-medium">
                                      Request ID: {service.requestId}
                                    </p>
                                    <p className="text-muted-foreground">
                                      Ambulance ID: {service.ambulanceId}
                                    </p>
                                    <p className="text-muted-foreground">
                                      Patient ID: {service.patientId}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="font-medium">Timeline:</p>
                                    <p className="text-muted-foreground">
                                      Arrival:{" "}
                                      {service.arrivalTime
                                        ? new Date(
                                            service.arrivalTime
                                          ).toLocaleString()
                                        : "N/A"}
                                    </p>
                                    <p className="text-muted-foreground">
                                      Completion:{" "}
                                      {service.completionTime
                                        ? new Date(
                                            service.completionTime
                                          ).toLocaleString()
                                        : "N/A"}
                                    </p>
                                  </div>
                                </div>

                                {service.notes && (
                                  <div className="mt-3 p-3 bg-muted rounded">
                                    <p className="text-sm font-medium mb-1">
                                      Notes:
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      {service.notes}
                                    </p>
                                  </div>
                                )}
                              </div>

                              <div className="flex gap-2">
                                {service.status !== "COMPLETED" && (
                                  <Button
                                    size="sm"
                                    onClick={() =>
                                      handleMarkServiceCompleted(
                                        service.id!,
                                        "Service completed by admin"
                                      )
                                    }
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    Mark Complete
                                  </Button>
                                )}

                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button variant="outline" size="sm">
                                      <Settings className="h-4 w-4" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>
                                        Update Service Status
                                      </DialogTitle>
                                      <DialogDescription>
                                        Change the status of this service record
                                      </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                      <div>
                                        <Label className="mb-2">Status</Label>
                                        <Select
                                          onValueChange={(value) =>
                                            setSelectedStatus(value)
                                          }
                                        >
                                          <SelectTrigger>
                                            <SelectValue placeholder="Select new status" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="PENDING">
                                              Pending
                                            </SelectItem>
                                            <SelectItem value="IN_PROGRESS">
                                              In Progress
                                            </SelectItem>
                                            <SelectItem value="ARRIVED">
                                              Arrived
                                            </SelectItem>
                                            <SelectItem value="COMPLETED">
                                              Completed
                                            </SelectItem>
                                            <SelectItem value="CANCELLED">
                                              Cancelled
                                            </SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <div>
                                        <Label htmlFor="notes" className="mb-2">
                                          Notes (Optional)
                                        </Label>
                                        <Textarea
                                          id="notes"
                                          placeholder="Add any notes about this status update..."
                                          value={notes}
                                          onChange={(e) =>
                                            setNotes(e.target.value)
                                          }
                                          className="min-h-[100px]"
                                        />
                                      </div>
                                      <div className="flex justify-end gap-2 pt-2">
                                        <Button
                                          variant="outline"
                                          onClick={() => {
                                            setNotes("");
                                            setSelectedStatus("");
                                          }}
                                        >
                                          Cancel
                                        </Button>
                                        <Button
                                          onClick={() => {
                                            handleUpdateServiceStatus(
                                              service.id!,
                                              selectedStatus,
                                              notes
                                            );
                                            setNotes("");
                                            setSelectedStatus("");
                                          }}
                                          disabled={!selectedStatus}
                                        >
                                          Update Status
                                        </Button>
                                      </div>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    {serviceHistoryTotalPages > 0 && (
                      <PaginationControls
                        currentPage={serviceHistoryCurrentPage}
                        totalPages={serviceHistoryTotalPages}
                        onPageChange={setServiceHistoryCurrentPage}
                      />
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
