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
} from "lucide-react";
import { requestAPI } from "@/api/ambulanceServiceAPI";
import { BackButton } from "@/components/BackButton";
import type { EmergencyRequest, RequestStatus } from "@/types";

export default function RequestStatusPage() {
  const { id } = useParams<{ id: string }>();
  const { error: notifyError } = useNotification();
  const { isAuthenticated } = useAuth();

  const [request, setRequest] = useState<EmergencyRequest | null>(null);
  const [loading, setLoading] = useState(true);

  console.log("request", request);

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
    <div className="min-h-screen bg-background py-10 px-4 container mx-auto">
      <div className="max-w-3xl mx-auto space-y-6">
        <BackButton isAuthenticated={isAuthenticated} />
        {isAuthenticated && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl flex justify-between items-center">
                  Request #{String(request.id).padStart(4, "0")}
                  <Badge
                    className={`${getStatusColor(request.status)} text-sm`}
                  >
                    {getStatusIcon(request.status)}
                    <span className="ml-1 capitalize">
                      {request.status.replace("_", " ")}
                    </span>
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Submitted on{" "}
                  {new Date(request.requestTime ?? "").toLocaleString()}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold">Requester</h4>
                  <p className="text-muted-foreground">
                    {request.userName} ({request.userContact})
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold">Location</h4>
                  <p className="text-muted-foreground">{request.location}</p>
                </div>

                <div>
                  <h4 className="font-semibold">Emergency Description</h4>
                  <p className="text-muted-foreground">
                    {request.emergencyDescription}
                  </p>
                </div>

                {request.medicalNotes && (
                  <div>
                    <h4 className="font-semibold">Medical Notes</h4>
                    <p className="text-muted-foreground">
                      {request.medicalNotes}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Status History */}
            {request.statusHistory?.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <History className="w-5 h-5 mr-2" />
                    Status History
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {request.statusHistory.map((entry) => (
                    <div key={entry.id} className="border-l-2 pl-4">
                      <p className="font-medium">
                        {entry.oldStatus
                          ? `${entry.oldStatus} → ${entry.newStatus}`
                          : `${entry.newStatus}`}
                      </p>
                      <p className="text-muted-foreground text-sm">
                        {entry.notes}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        By {entry.changedBy} on{" "}
                        {new Date(entry.createdAt).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Live Tracking */}
            {(request.status === "DISPATCHED" ||
              request.status === "IN_PROGRESS") && (
              <Card className="mt-6">
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
                      Map integration would be displayed here
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      (Leaflet/Mapbox integration placeholder)
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {!isAuthenticated && (
          <Card className="mt-6 border-blue-200 dark:border-blue-800">
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
  );
}
