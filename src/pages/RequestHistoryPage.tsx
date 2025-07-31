"use client"

import { useState, useEffect, useMemo } from "react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useNotification } from "@/hooks/useNotification"
import { Search, Filter, Calendar, MapPin, Clock, Eye, Loader2, ArrowLeft } from "lucide-react"
import { PaginationControls } from "@/components/PaginationControls"
import { getUserRequestHistory } from "@/api/ambulanceServiceAPI"
import type { RequestStatus, UserRequestHistory } from "@/types"



export default function RequestHistoryPage() {
  const { error: notifyError } = useNotification()
  const [allRequests, setAllRequests] = useState<UserRequestHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true)
      try {
        const data = await getUserRequestHistory()
        setAllRequests(data)
      } catch (error: unknown) {
        let message = "Error loading history"
        if (error instanceof Error) {
          message = error.message || message
        }
        notifyError( "Error loading history", message)
      } finally {
        setLoading(false)
      }
    }

    fetchHistory()
  }, [notifyError])

  const filteredRequests = useMemo(() => {
    let filtered = allRequests

    // Filter by search term
    if (searchTerm) {
      const lowercasedTerm = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (request) =>
          (request.location || "").toLowerCase().includes(lowercasedTerm) ||
          (request.emergencyDescription || "").toLowerCase().includes(lowercasedTerm) ||
          (request.userName || "").toLowerCase().includes(lowercasedTerm),
      )
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((request) => request.status.toLowerCase() === statusFilter.toLowerCase())
    }

    return filtered
  }, [allRequests, searchTerm, statusFilter])

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage)

  const paginatedRequests = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredRequests.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredRequests, currentPage, itemsPerPage])


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
        <div className="mb-6">
          <Button variant="ghost" asChild>
            <Link to="/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Request History</h1>
          <p className="text-muted-foreground">View and search through all your emergency requests</p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="h-5 w-5 mr-2" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by location, description, or patient name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="w-full md:w-48">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
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
          </CardContent>
        </Card>

        {/* Results */}
        {filteredRequests.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {allRequests.length === 0 ? "No requests found" : "No requests match your filters"}
              </p>
              {allRequests.length === 0 && (
                <Button className="mt-4" asChild>
                  <Link to="/request/new">Create Your First Request</Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground mb-4">
              Showing {paginatedRequests.length} of {filteredRequests.length} requests
            </div>

            {paginatedRequests.map((request) => (
              <Card key={request.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start flex-wrap gap-2 justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <Badge className={getStatusColor(request.status as RequestStatus)}>{request.status?.replace("_", " ")}</Badge>
                        <span className="text-sm text-muted-foreground">#{String(request.id).padStart(4, "0")}</span>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                          <div>
                            <p className="font-medium">{request.location}</p>
                            <p className="text-sm text-muted-foreground line-clamp-2">{request.emergencyDescription}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {new Date(request.requestTime).toLocaleString()}
                          </div>
                          <div>Patient: {request.userName}</div>
                          <div className="capitalize">M/F</div>
                        </div>
                      </div>
                    </div>

                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/request/${request.id}`}>
                        <Eye className="h-4 w-4 mr-1" />
                        View Details
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {totalPages > 0 && (
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
