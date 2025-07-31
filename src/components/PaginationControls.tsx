"use client"

import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface PaginationControlsProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
}

export function PaginationControls({
  currentPage,
  totalPages,
  onPageChange,
  className,
}: PaginationControlsProps) {
  const handlePrevious = () => {
    onPageChange(Math.max(currentPage - 1, 1))
  }

  const handleNext = () => {
    onPageChange(Math.min(currentPage + 1, totalPages))
  }

  return (
    <div className={`flex items-center justify-end space-x-2 py-4 ${className || ""}`}>
      <Button variant="outline" size="sm" onClick={handlePrevious} disabled={currentPage === 1}>
        <ChevronLeft className="h-4 w-4 mr-1" />
        Previous
      </Button>
      <span className="text-sm text-muted-foreground">
        Page {currentPage} of {totalPages}
      </span>
      <Button variant="outline" size="sm" onClick={handleNext} disabled={currentPage === totalPages}>
        Next
        <ChevronRight className="h-4 w-4 ml-1" />
      </Button>
    </div>
  )
}
