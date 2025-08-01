"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { patientAPI, requestAPI } from "@/api/ambulanceServiceAPI";
import type { EmergencyRequest, Patient } from "@/types";
import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useNotification } from "@/hooks/useNotification";
import {
  ShieldUser,
  Plus,
  Edit,
  FileText,
  Phone,
  Calendar,
  Loader2,
  ArrowLeft,
  Eye,
  Archive,
  Trash2,
  Search,
} from "lucide-react";
import { PaginationControls } from "@/components/PaginationControls";

export default function PatientManagementPage() {
  const { success, error: notifyError } = useNotification();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientRequests, setPatientRequests] = useState<EmergencyRequest[]>(
    []
  );
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [newPatient, setNewPatient] = useState({
    name: "",
    contact: "",
    medicalNotes: "",
  });

  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const filteredPatients = useMemo(() => {
    if (!searchTerm) return patients;
    const lowercasedTerm = searchTerm.toLowerCase();
    return patients.filter(
      (patient) =>
        (patient.name || "").toLowerCase().includes(lowercasedTerm) ||
        (patient.contact || "").toLowerCase().includes(lowercasedTerm)
    );
  }, [patients, searchTerm]);

  const totalPages = useMemo(
    () => Math.ceil(filteredPatients.length / itemsPerPage),
    [filteredPatients.length, itemsPerPage]
  );
  const paginatedPatients = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredPatients.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredPatients, currentPage, itemsPerPage]);

  const fetchPatients = async () => {
    try {
      const data = await patientAPI.getAll();
      setPatients(data);
    } catch (error: unknown) {
      let message = "Error loading patients";
      if (error instanceof Error) {
        message = error.message || message;
      }
      notifyError("Error loading patients", message);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatientRequests = async (patientId: number) => {
    setLoadingRequests(true);
    try {
      const data = await requestAPI.getByPatientId(patientId);
      setPatientRequests(data);
    } catch (error: unknown) {
      let message = "Error loading patient requests";
      if (error instanceof Error) {
        message = error.message || message;
      }
      notifyError("Error loading patient requests", message);
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleCreatePatient = async () => {
    try {
      await patientAPI.create(newPatient);
      success("Patient created", "New patient record has been added");
      setNewPatient({ name: "", contact: "", medicalNotes: "" });
      fetchPatients();
    } catch (error: unknown) {
      let message = "Failed to create patient";
      if (error instanceof Error) {
        message = error.message || message;
      }
      notifyError("Failed to create patient", message);
    }
  };

  const handleUpdatePatient = async () => {
    if (!editingPatient?.id) return;

    try {
      await patientAPI.update(editingPatient.id, editingPatient);
      success("Patient updated", "Patient information has been updated");
      setEditingPatient(null);
      fetchPatients();
    } catch (error: unknown) {
      let message = "Failed to update patient";
      if (error instanceof Error) {
        message = error.message || message;
      }
      notifyError("Failed to update patient", message);
    }
  };

  const handleSoftDelete = async (id: number) => {
    try {
      await patientAPI.softDelete(id);
      success("Patient archived", "Patient has been archived");
      fetchPatients();
    } catch (error: unknown) {
      let message = "Failed to archive patient";
      if (error instanceof Error) {
        message = error.message || message;
      }
      notifyError("Failed to archive patient", message);
    }
  };

  const handleHardDelete = async (id: number) => {
    try {
      await patientAPI.hardDelete(id);
      success("Patient deleted", "Patient has been permanently deleted");
      fetchPatients();
    } catch (error: unknown) {
      let message = "Failed to delete patient";
      if (error instanceof Error) {
        message = error.message || message;
      }
      notifyError("Failed to delete patient", message);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "dispatched":
      case "in_progress":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
      case "arrived":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "completed":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
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

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Patient Management</h1>
          <p className="text-muted-foreground">
            Manage patient records and medical information
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center flex-wrap gap-2 justify-between">
              <div>
                <CardTitle className="flex items-center">
                  <ShieldUser className="h-5 w-5 mr-2" />
                  Patient Records
                </CardTitle>
                <CardDescription>
                  View and manage patient information
                </CardDescription>
              </div>
              <div className="flex items-center flex-wrap gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or contact..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
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
                      <DialogDescription>
                        Create a new patient record
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="patientName">Patient Name</Label>
                        <Input
                          id="patientName"
                          value={newPatient.name}
                          onChange={(e) =>
                            setNewPatient({
                              ...newPatient,
                              name: e.target.value,
                            })
                          }
                          placeholder="Enter patient's full name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="patientContact">
                          Contact Information
                        </Label>
                        <Input
                          id="patientContact"
                          value={newPatient.contact}
                          onChange={(e) =>
                            setNewPatient({
                              ...newPatient,
                              contact: e.target.value,
                            })
                          }
                          placeholder="Phone number or email"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="medicalNotes">Medical Notes</Label>
                        <Textarea
                          id="medicalNotes"
                          value={newPatient.medicalNotes}
                          onChange={(e) =>
                            setNewPatient({
                              ...newPatient,
                              medicalNotes: e.target.value,
                            })
                          }
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
            </div>
          </CardHeader>
          <CardContent>
            {filteredPatients.length === 0 ? (
              <div className="text-center py-8">
                <ShieldUser className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {patients.length === 0
                    ? "No patient records found."
                    : "No matching patient records found."}
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
                    <Card
                      key={patient.id}
                      className="hover:shadow-md transition-shadow"
                    >
                      <CardContent className="pt-6">
                        <div className="space-y-3">
                          <div>
                            <h3 className="font-semibold text-lg">
                              {patient.name}
                            </h3>
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
                              <p className="text-sm text-muted-foreground bg-muted p-2 rounded line-clamp-3">
                                {patient.medicalNotes}
                              </p>
                            </div>
                          )}

                          <div className="flex items-center text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3 mr-1" />
                            Created:{" "}
                            {patient.createdAt &&
                              new Date(patient.createdAt).toLocaleDateString()}
                          </div>

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
                                    <div>
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
                                    <div>
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
                                    <div>
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

                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedPatient(patient);
                                    fetchPatientRequests(patient.id!);
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl">
                                <DialogHeader>
                                  <DialogTitle>
                                    Patient Requests - {selectedPatient?.name}
                                  </DialogTitle>
                                  <DialogDescription>
                                    All emergency requests for this patient
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="max-h-96 overflow-y-auto">
                                  {loadingRequests ? (
                                    <div className="flex items-center justify-center py-8">
                                      <Loader2 className="h-6 w-6 animate-spin" />
                                    </div>
                                  ) : patientRequests.length === 0 ? (
                                    <div className="text-center py-8">
                                      <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                      <p className="text-muted-foreground">
                                        No requests found for this patient
                                      </p>
                                    </div>
                                  ) : (
                                    <div className="space-y-4">
                                      {patientRequests.map((request) => (
                                        <Card key={request.id}>
                                          <CardContent className="pt-4">
                                            <div className="flex items-start justify-between">
                                              <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                  <Badge
                                                    className={getStatusColor(
                                                      request.status
                                                    )}
                                                  >
                                                    {request.status}
                                                  </Badge>
                                                  <span className="text-sm text-muted-foreground">
                                                    REQ-
                                                    {String(
                                                      request.id
                                                    ).padStart(4, "0")}
                                                  </span>
                                                </div>
                                                <p className="font-medium">
                                                  {request.location}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                  {request.emergencyDescription}
                                                </p>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                  {request.requestTime &&
                                                    new Date(
                                                      request.requestTime
                                                    ).toLocaleString()}
                                                </p>
                                              </div>
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                asChild
                                              >
                                                <Link
                                                  to={`/request/${request.id}`}
                                                >
                                                  View Details
                                                </Link>
                                              </Button>
                                            </div>
                                          </CardContent>
                                        </Card>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </DialogContent>
                            </Dialog>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSoftDelete(patient.id!)}
                              className="text-yellow-600 hover:text-yellow-700"
                            >
                              <Archive className="h-4 w-4" />
                            </Button>

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700 bg-transparent"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Are you absolutely sure?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This action cannot be undone. This will
                                    permanently delete the patient record and
                                    remove all associated data from our servers.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() =>
                                      handleHardDelete(patient.id!)
                                    }
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Delete Permanently
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
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
      </div>
    </div>
  );
}
