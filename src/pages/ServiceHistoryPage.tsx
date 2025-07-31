"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useNotification } from "@/hooks/useNotification"
import { Calendar, Clock, FileText, Filter, Loader2 } from "lucide-react"
import { serviceHistoryAPI } from "@/api/ambulanceServiceAPI"
import type { ServiceHistory } from "@/types"

export default function ServiceHistoryPage() {
    const { error: notifyError } = useNotification()
  const [serviceHistory, setServiceHistory] = useState<ServiceHistory[]>([])
  const [filteredHistory, setFilteredHistory] = useState<ServiceHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateRange, setDateRange] = useState({
    start: "",
    end: "",
  })

  useEffect(() => {
    fetchServiceHistory()
  }, [])

  useEffect(() => {
    filterHistory()
  }, [serviceHistory, statusFilter, dateRange])

  const fetchServiceHistory = async () => {
    try {
      const data = await serviceHistoryAPI.getAll()
      setServiceHistory(data)
    } catch (error: unknown) {
        let message = "Error loading service history"
        if (error instanceof Error) {
          message = error.message || message
        }
      notifyError( "Error loading service history", message)
    } finally {
      setLoading(false)
    }
  }

  const filterHistory = () => {
    let filtered = serviceHistory

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((record) => record.status.toLowerCase() === statusFilter.toLowerCase())
    }

    // Filter by date range
    if (dateRange.start && dateRange.end) {
      filtered = filtered.filter((record) => {
        const recordDate = new Date(record.createdAt || "")
        const startDate = new Date(dateRange.start)
        const endDate = new Date(dateRange.end)
        return recordDate >= startDate && recordDate <= endDate
      })
    }

    setFilteredHistory(filtered)
  }

  const handleDateRangeFilter = async () => {
    if (dateRange.start && dateRange.end) {
      try {
        const data = await serviceHistoryAPI.getByDateRange(`${dateRange.start}T00:00:00`, `${dateRange.end}T23:59:59`)
        setServiceHistory(data)
      } catch (error: unknown) {
        let message = "Error filtering by date range"
        if (error instanceof Error) {
          message = error.message || message
        }
        notifyError( "Error filtering by date range", message)
      }
    }
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "in_progress":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
    }
  }

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleString()
  }

  const calculateDuration = (arrivalTime?: string, completionTime?: string) => {
    if (!arrivalTime || !completionTime) return "N/A"
    const arrival = new Date(arrivalTime)
    const completion = new Date(completionTime)
    const diffMinutes = Math.round((completion.getTime() - arrival.getTime()) / (1000 * 60))
    return `${diffMinutes} minutes`
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
          <h1 className="text-3xl font-bold mb-2">Service History</h1>
          <p className="text-muted-foreground">Track completed emergency services and response times</p>
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
            <div className="grid md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Start Date</label>
                <Input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">End Date</label>
                <Input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                />
              </div>
              <div className="flex items-end">
                <Button onClick={handleDateRangeFilter} className="w-full">
                  Apply Date Filter
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Service History Records */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Service Records
            </CardTitle>
            <CardDescription>
              Showing {filteredHistory.length} of {serviceHistory.length} records
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredHistory.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No service history records found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredHistory.map((record) => (
                  <Card key={record.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={getStatusColor(record.status)}>{record.status.replace("_", " ")}</Badge>
                            <span className="text-sm text-muted-foreground">Service #{record.id}</span>
                          </div>

                          <div className="grid md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="font-medium">Request ID: {record.requestId}</p>
                              <p className="text-muted-foreground">Ambulance ID: {record.ambulanceId}</p>
                              <p className="text-muted-foreground">Patient ID: {record.patientId}</p>
                            </div>
                            <div>
                              <p className="font-medium">Timeline:</p>
                              <p className="text-muted-foreground">
                                <Clock className="h-3 w-3 inline mr-1" />
                                Arrival: {formatDateTime(record.arrivalTime)}
                              </p>
                              <p className="text-muted-foreground">
                                <Clock className="h-3 w-3 inline mr-1" />
                                Completion: {formatDateTime(record.completionTime)}
                              </p>
                              <p className="text-muted-foreground">
                                Duration: {calculateDuration(record.arrivalTime, record.completionTime)}
                              </p>
                            </div>
                          </div>

                          {record.notes && (
                            <div className="mt-3 p-3 bg-muted rounded">
                              <p className="text-sm font-medium mb-1">Notes:</p>
                              <p className="text-sm text-muted-foreground">{record.notes}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="text-xs text-muted-foreground">Created: {formatDateTime(record.createdAt)}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
