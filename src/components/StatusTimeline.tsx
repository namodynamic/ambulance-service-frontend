"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Clock, Navigation, MapPin, AlertCircle, User } from "lucide-react"
import type { RequestStatusHistory, RequestStatus } from "@/types"

interface StatusTimelineProps {
  statusHistory: RequestStatusHistory[]
  currentStatus: RequestStatus
}

const StatusTimeline = ({ statusHistory, currentStatus }: StatusTimelineProps) => {
  const getStatusIcon = (status: RequestStatus) => {
    switch (status) {
      case "PENDING":
        return <Clock className="h-4 w-4" />
      case "DISPATCHED":
      case "IN_PROGRESS":
        return <Navigation className="h-4 w-4" />
      case "ARRIVED":
        return <MapPin className="h-4 w-4" />
      case "COMPLETED":
        return <CheckCircle className="h-4 w-4" />
      case "CANCELLED":
        return <AlertCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: RequestStatus) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-500"
      case "DISPATCHED":
      case "IN_PROGRESS":
        return "bg-blue-500"
      case "ARRIVED":
        return "bg-green-500"
      case "COMPLETED":
        return "bg-gray-500"
      case "CANCELLED":
        return "bg-red-500"
      default:
        return "bg-gray-400"
    }
  }

  const getBadgeColor = (status: RequestStatus) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
      case "DISPATCHED":
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
      case "ARRIVED":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
      case "COMPLETED":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
      case "CANCELLED":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
    }
  }

  const sortedHistory = [...statusHistory].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  )

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-6">
          {sortedHistory.map((entry, index) => {
            const isLast = index === sortedHistory.length - 1
            const isCompleted = entry.newStatus === "COMPLETED" || entry.newStatus === "CANCELLED"

            return (
              <div key={entry.id} className="relative flex items-start space-x-4">
                {!isLast && !isCompleted && (
                  <div className="absolute left-4 top-8 w-0.5 h-16 bg-gray-200 dark:bg-gray-700" />
                )}

                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-full ${getStatusColor(entry.newStatus)} flex items-center justify-center text-white shadow-lg`}
                >
                  {getStatusIcon(entry.newStatus)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={getBadgeColor(entry.newStatus)}>{entry.newStatus.replace("_", " ")}</Badge>
                    <span className="text-sm text-muted-foreground">{new Date(entry.createdAt).toLocaleString()}</span>
                  </div>

                  {entry.notes && <p className="text-sm text-muted-foreground mb-2">{entry.notes}</p>}

                  <div className="flex items-center text-xs text-muted-foreground">
                    <User className="h-3 w-3 mr-1" />
                    <span>Updated by {entry.changedBy}</span>
                  </div>
                </div>
              </div>
            )
          })}

          {/* Current status indicator if no history */}
          {sortedHistory.length === 0 && (
            <div className="flex items-start space-x-4">
              <div
                className={`flex-shrink-0 w-8 h-8 rounded-full ${getStatusColor(currentStatus)} flex items-center justify-center text-white shadow-lg`}
              >
                {getStatusIcon(currentStatus)}
              </div>
              <div className="flex-1">
                <Badge className={getBadgeColor(currentStatus)}>{currentStatus.replace("_", " ")}</Badge>
                <p className="text-sm text-muted-foreground mt-1">Current status</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default StatusTimeline