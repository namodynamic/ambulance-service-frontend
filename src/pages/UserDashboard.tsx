"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/hooks/useAuth"
import { useNotification } from "@/hooks/useNotification"
import { Plus, Clock, MapPin, Ambulance, History, AlertCircle, CheckCircle, Loader2 } from "lucide-react"
import {  getUserRequestHistory } from "@/api/ambulanceServiceAPI"
import type { UserRequestHistory } from "@/types"


export default function UserDashboard() {
  const { user } = useAuth()
  const {  error: notifyError } = useNotification()
  const [activeRequests, setActiveRequests] = useState<UserRequestHistory[]>([])
  const [recentRequests, setRecentRequests] = useState<UserRequestHistory[]>([])
  const [userRequests, setUserRequests] = useState<UserRequestHistory[]>([])
  const [loading, setLoading] = useState(true)


useEffect(() => {
  const fetchData = async () => {
    try {
      const requests = await getUserRequestHistory();
      setActiveRequests(requests.filter(r => !["COMPLETED", "CANCELLED"].includes(r.status)));
      setRecentRequests(requests.slice(0, 5));
      setUserRequests(requests);
    } catch (error: unknown) {
      let message = "Failed to load dashboard";
      if (error instanceof Error) {
        message = error.message || message;
      }
      notifyError("Error loading dashboard", message);
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, [notifyError]);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
      case "dispatched":
      case "en_route":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
      case "arrived":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
      case "completed":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return <Clock className="h-4 w-4" />
      case "dispatched":
      case "en_route":
        return <Ambulance className="h-4 w-4" />
      case "arrived":
        return <MapPin className="h-4 w-4" />
      case "completed":
        return <CheckCircle className="h-4 w-4" />
      case "cancelled":
        return <AlertCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
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
          <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.username}</h1>
          <p className="text-muted-foreground">Manage your emergency requests and view service history</p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="border-red-200 dark:border-red-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <Plus className="h-5 w-5 mr-2 text-red-600" />
                Emergency Request
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">Request immediate ambulance service</p>
              <Button className="w-full bg-red-600 hover:bg-red-700 text-white" asChild>
                <Link to="/request/new">Request Now</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <History className="h-5 w-5 mr-2" />
                Request History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">View all your past requests</p>
              <Button variant="outline" className="w-full bg-transparent" asChild>
                <Link to="/history">View History</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Active Requests</span>
                  <span className="font-semibold">{activeRequests.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Total Requests</span>
                  <span className="font-semibold">{userRequests.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {activeRequests.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Active Requests</h2>
            <div className="space-y-4">
              {activeRequests.map((request) => (
                <Card key={request.id} className="border-l-4 border-l-red-500">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={getStatusColor(request.status)}>
                            {getStatusIcon(request.status)}
                            <span className="ml-1 capitalize">{request.status?.replace("_", " ")}</span>
                          </Badge>
                          <span className="text-sm text-muted-foreground">REQ-{request.id.toString().padStart(4, "0")}</span>
                        </div>
                        <p className="font-medium mb-1">{request.location}</p>
                        <p className="text-sm text-muted-foreground mb-2">{request.emergencyDescription}</p>
                        <p className="text-xs text-muted-foreground">
                          Requested: {new Date(request.requestTime).toLocaleString()}
                        </p>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/request/${request.id}`}>View Details</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold">Recent Requests</h2>
            <Button variant="outline" asChild>
              <Link to="/history">View All</Link>
            </Button>
          </div>

          {recentRequests.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Ambulance className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No requests yet</p>
                <p className="text-sm text-muted-foreground mt-1">Your emergency requests will appear here</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {recentRequests.map((request) => (
                <Card key={request.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={getStatusColor(request.status)}>
                            {getStatusIcon(request.status)}
                            <span className="ml-1 capitalize">{request.status?.replace("_", " ")}</span>
                          </Badge>
                          <span className="text-sm text-muted-foreground">REQ-{request.id.toString().padStart(4, "0")}</span>
                        </div>
                        <p className="font-medium mb-1">{request.location}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(request.requestTime).toLocaleString()}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/request/${request.id}`}>View</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
