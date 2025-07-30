"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useNotification } from "@/hooks/useNotification"
import { User, Plus, Edit, FileText, Phone, Calendar, Loader2 } from "lucide-react"
import { patientAPI } from "@/api/ambulanceServiceAPI"
import type { Patient } from "@/types"

export default function PatientManagementPage() {
  const { success, error: notifyError } = useNotification()
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [newPatient, setNewPatient] = useState({
    name: "",
    contact: "",
    medicalNotes: "",
  })

  useEffect(() => {
    fetchPatients()
  }, [])

  const fetchPatients = async () => {
    try {
      const data = await patientAPI.getAll()
      setPatients(data)
    } catch (error: unknown) {
        let message = "Error loading patients"
        if (error instanceof Error) {
          message = error.message || message
        }
      notifyError("Error loading patients", message)
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePatient = async () => {
    try {
      await patientAPI.create(newPatient)
      success( "Patient created", "New patient record has been added")
      setNewPatient({ name: "", contact: "", medicalNotes: "" })
      fetchPatients()
    } catch (error: unknown) {
        let message = "Failed to create patient"
        if (error instanceof Error) {
          message = error.message || message
        }
      notifyError( "Failed to create patient", message)
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
          <h1 className="text-3xl font-bold mb-2">Patient Management</h1>
          <p className="text-muted-foreground">Manage patient records and medical information</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Patient Records
                </CardTitle>
                <CardDescription>View and manage patient information</CardDescription>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Patient
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Patient</DialogTitle>
                    <DialogDescription>Create a new patient record</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="patientName">Patient Name</Label>
                      <Input
                        id="patientName"
                        value={newPatient.name}
                        onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })}
                        placeholder="Enter patient's full name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="patientContact">Contact Information</Label>
                      <Input
                        id="patientContact"
                        value={newPatient.contact}
                        onChange={(e) => setNewPatient({ ...newPatient, contact: e.target.value })}
                        placeholder="Phone number or email"
                      />
                    </div>
                    <div>
                      <Label htmlFor="medicalNotes">Medical Notes</Label>
                      <Textarea
                        id="medicalNotes"
                        value={newPatient.medicalNotes}
                        onChange={(e) => setNewPatient({ ...newPatient, medicalNotes: e.target.value })}
                        placeholder="Medical history, allergies, conditions, etc."
                        className="min-h-[100px]"
                      />
                    </div>
                    <Button onClick={handleCreatePatient} className="w-full">
                      Create Patient Record
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {patients.length === 0 ? (
              <div className="text-center py-8">
                <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No patient records found</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {patients.map((patient) => (
                  <Card key={patient.id}>
                    <CardContent className="pt-6">
                      <div className="space-y-3">
                        <div>
                          <h3 className="font-semibold text-lg">{patient.name}</h3>
                          <div className="flex items-center text-sm text-muted-foreground mt-1">
                            <Phone className="h-4 w-4 mr-1" />
                            {patient.contact}
                          </div>
                        </div>

                        {patient.medicalNotes && (
                          <div>
                            <div className="flex items-center text-sm font-medium mb-1">
                              <FileText className="h-4 w-4 mr-1" />
                              Medical Notes
                            </div>
                            <p className="text-sm text-muted-foreground bg-muted p-2 rounded">{patient.medicalNotes}</p>
                          </div>
                        )}

                        <div className="flex items-center text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3 mr-1" />
                          Created: {patient.createdAt && new Date(patient.createdAt).toLocaleDateString()}
                        </div>

                        <div className="flex gap-2 pt-2">
                          <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                        </div>
                      </div>
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
