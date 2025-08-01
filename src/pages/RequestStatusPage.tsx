"use client";

import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNotification } from "@/hooks/useNotification";
import { useAuth } from "@/hooks/useAuth";
import {
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Navigation,
  History,
  Ambulance,
  Phone,
  User,
  FileText,
  Settings,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { requestAPI, serviceHistoryAPI } from "@/api/ambulanceServiceAPI";
import { BackButton } from "@/components/BackButton";
import type { EmergencyRequest, RequestStatus } from "@/types";
import StatusTimeline from "@/components/StatusTimeline";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function RequestStatusPage() {
  const { id } = useParams<{ id: string }>();
  const { success, error: notifyError } = useNotification();
  const { isAuthenticated, isAdmin } = useAuth();
  const [request, setRequest] = useState<EmergencyRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  useEffect(() => {
    const fetchRequest = async () => {
      if (!id) return;

      try {
        const data = await requestAPI.getById(Number(id));
        setRequest(data);
      } catch (error: unknown) {
        let message = "Failed to load request";
        if (error instanceof Error) {
          message = error.message || message;
        }
        notifyError("Failed to load request", message || "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchRequest();
    const interval = setInterval(fetchRequest, 30000);
    return () => clearInterval(interval);
  }, [id, notifyError]);

  const handleUpdateServiceStatus = async (
    id: number,
    status: string,
    notes?: string
  ) => {
    try {
      await serviceHistoryAPI.updateStatus(id, status, notes);
      success("Service status updated", "Service history has been updated");
    } catch (error: unknown) {
      let message = "Failed to update service status";
      if (error instanceof Error) {
        message = error.message || message;
      }
      notifyError("Failed to update service", message);
    }
  };

  const getStatusColor = (status: RequestStatus) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "DISPATCHED":
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
      case "ARRIVED":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "COMPLETED":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
      case "CANCELLED":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getStatusIcon = (status: RequestStatus) => {
    switch (status) {
      case "PENDING":
        return <Clock className="h-5 w-5" />;
      case "DISPATCHED":
      case "IN_PROGRESS":
        return <Navigation className="h-5 w-5" />;
      case "ARRIVED":
        return <MapPin className="h-5 w-5" />;
      case "COMPLETED":
        return <CheckCircle className="h-5 w-5" />;
      case "CANCELLED":
        return <AlertCircle className="h-5 w-5" />;
      default:
        return <Clock className="h-5 w-5" />;
    }
  };

  const getStatusMessage = (status: string) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "Your request has been received and is being processed.";
      case "dispatched":
        return "An ambulance has been dispatched to your location.";
      case "in_progress":
        return "The ambulance is on its way to your location.";
      case "arrived":
        return "The ambulance has arrived at your location.";
      case "completed":
        return "The emergency service has been completed.";
      case "cancelled":
        return "This request has been cancelled.";
      default:
        return "Status unknown.";
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

  if (!request) {
    return (
      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="py-8 text-center">
              <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Request not found</p>
              <Button className="mt-4" asChild>
                <Link to="/dashboard">Return to Dashboard</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <BackButton isAuthenticated={isAuthenticated} />
          {isAuthenticated && (
            <div>
              <Card className="mb-6 border-l-4 border-l-blue-500">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg md:text-2xl flex items-center gap-2">
                        <FileText className="h-6 w-6" />
                        Request #{String(request.id).padStart(4, "0")}
                      </CardTitle>
                      <CardDescription>
                        Submitted on{" "}
                        {request.requestTime &&
                          new Date(request.requestTime).toLocaleString()}
                      </CardDescription>
                    </div>
                    <div className="flex items-center flex-col justify-between gap-4">
                      <Badge
                        className={`${getStatusColor(
                          request.status
                        )} text-sm  px-4 py-2`}
                      >
                        {getStatusIcon(request.status)}
                        <span className="ml-1 capitalize">
                          {request.status?.replace("_", " ")}
                        </span>
                      </Badge>

                      {isAdmin && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Settings className="h-4 w-4" />
                              Update Status
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Update Service Status</DialogTitle>
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
                                  onChange={(e) => setNotes(e.target.value)}
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
                                      request.id!,
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
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
                    <p className="text-lg font-medium text-blue-900 dark:text-blue-100">
                      {getStatusMessage(request.status)}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <div className="grid lg:grid-cols-2 gap-6 mb-6 items-start">
                <Card className="h-auto">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <MapPin className="h-5 w-5 mr-2" />
                      Emergency Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-1">Location</h4>
                      <p className="text-muted-foreground">
                        {request.location}
                      </p>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="font-semibold mb-1">Description</h4>
                      <p className="text-muted-foreground">
                        {request.emergencyDescription}
                      </p>
                    </div>

                    {request.medicalNotes && (
                      <>
                        <Separator />
                        <div>
                          <h4 className="font-semibold mb-1">Medical Notes</h4>
                          <p className="text-muted-foreground bg-yellow-50 dark:bg-yellow-950/20 p-3 rounded">
                            {request.medicalNotes}
                          </p>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                <Card className="h-auto">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <User className="h-5 w-5 mr-2" />
                      Contact Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-1">Caller</h4>
                      <p className="text-muted-foreground">
                        {request.userName}
                      </p>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="font-semibold mb-1">Patient</h4>
                      <p className="text-muted-foreground">
                        {request.patientName}
                      </p>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="font-semibold mb-1 flex items-center">
                        <Phone className="h-4 w-4 mr-1" />
                        Contact Number
                      </h4>
                      <p className="text-muted-foreground">
                        {request.userContact}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {request.ambulance && (
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Ambulance className="h-5 w-5 mr-2" />
                      Assigned Ambulance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <h4 className="font-semibold mb-1">Vehicle Number</h4>
                        <p className="text-muted-foreground">
                          AMB-
                          {request.ambulance.licensePlate ||
                            request.ambulance.id}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1">Driver</h4>
                        <p className="text-muted-foreground">
                          {request.ambulance.driverName || "N/A"}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1">Current Location</h4>
                        <p className="text-muted-foreground">
                          {request.ambulance.currentLocation || "Unknown"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {request.statusHistory && request.statusHistory.length > 0 && (
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <History className="h-5 w-5 mr-2" />
                      Status Timeline
                    </CardTitle>
                    <CardDescription>
                      Track the progress of your emergency request
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <StatusTimeline
                      statusHistory={request.statusHistory}
                      currentStatus={request.status}
                    />
                  </CardContent>
                </Card>
              )}

              {(request.status === "DISPATCHED" ||
                request.status === "IN_PROGRESS") && (
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>Live Tracking</CardTitle>
                    <CardDescription>
                      Track your ambulance in real-time
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-muted rounded-lg p-8 text-center">
                      <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">
                        Real-time map tracking would be displayed here
                      </p>
                      <p className="text-sm text-muted-foreground mt-2">
                        (Integration with mapping service)
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {!isAuthenticated && (
            <Card className="border-blue-200 dark:border-blue-800">
              <CardHeader>
                <CardTitle>Want to track all your requests?</CardTitle>
                <CardDescription>
                  Create an account to view your request history and get
                  notifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <Button asChild>
                    <Link to="/register">Create Account</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link to="/login">Login</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
