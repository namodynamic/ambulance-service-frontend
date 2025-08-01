"use client";

import { useState, useEffect, useMemo } from "react";
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
import {
  User,
  Mail,
  Phone,
  ArrowLeft,
  Loader2,
  AlertCircle,
  History,
  MapPin,
  Clock,
  Eye,
} from "lucide-react";
import { userAPI, requestAPI } from "@/api/ambulanceServiceAPI";
import type { User as UserType, RequestStatus, EmergencyRequest } from "@/types";
import { PaginationControls } from "@/components/PaginationControls";

export default function UserDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { error: notifyError } = useNotification();
  const [user, setUser] = useState<UserType | null>(null);
  const [requests, setRequests] = useState<EmergencyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    const fetchData = async () => {
      if (!id) {
        setLoading(false);
        return;
      }
      try {
        const userId = Number(id);
        const [userData, requestsData] = await Promise.all([
          userAPI.getById(userId),
          requestAPI.getByUserId(userId),
        ]);
        setUser(userData);
        setRequests(requestsData);
      } catch (error: unknown) {
        let message = "Failed to load user details";
        if (error instanceof Error) {
          message = error.message || message;
        }
        notifyError("Error", message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, notifyError]);

  const totalPages = useMemo(
    () => Math.ceil(requests.length / itemsPerPage),
    [requests.length, itemsPerPage]
  );

  const paginatedRequests = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return requests.slice(startIndex, startIndex + itemsPerPage);
  }, [requests, currentPage, itemsPerPage]);

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="py-8 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">User not found</p>
            <Button className="mt-4" asChild>
              <Link to="/admin/dashboard">Back to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button variant="ghost" asChild>
            <Link to="/admin/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-6 w-6 mr-3" />
                  User Details
                </CardTitle>
                <CardDescription>
                  Information for <span className="font-semibold text-black dark:text-white">{user.firstName} {user.lastName}</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-3 text-muted-foreground" />
                  <span>{user.email}</span>
                </div>
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-3 text-muted-foreground" />
                  <span>{user.phoneNumber}</span>
                </div>
                <Badge variant={user.role === "ADMIN" ? "destructive" : "secondary"}>
                  {user.role}
                </Badge>
                <Badge variant={user.enabled ? "default" : "outline"} className="ml-2">
                  {user.enabled ? "Active" : "Disabled"}
                </Badge>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <History className="h-6 w-6 mr-3" />
                  Request History
                </CardTitle>
                <CardDescription>All requests submitted by this user.</CardDescription>
              </CardHeader>
              <CardContent>
                {requests.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">This user has not made any requests.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {paginatedRequests.map((request) => (
                      <Card key={request.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="pt-6 flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className={getStatusColor(request.status as RequestStatus)}>
                                {request.status?.replace("_", " ")}
                              </Badge>
                              <span className="text-sm text-muted-foreground">REQ-{String(request.id).padStart(4, "0")}</span>
                            </div>
                            <MapPin className="h-4 w-4 mr-1 text-muted-foreground" />
                            <p className="font-medium">{request.location}</p>
                            <p className="text-sm text-muted-foreground items-center inline-flex"> <Clock className="h-4 w-4 mr-1 text-muted-foreground"/>{new Date(request.requestTime ?? "").toLocaleString()}</p>
                          </div>
                          <Button variant="outline" size="sm" asChild>
                            <Link to={`/request/${request.id}`}>
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Link>
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                    {totalPages > 0 && (
                      <PaginationControls currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
