"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useNotification } from "@/hooks/useNotification"
import { MapPin, User, Loader2, AlertTriangle } from "lucide-react"
import { requestAPI } from "@/api/ambulanceServiceAPI"
import type { AxiosError } from "axios"

const requestSchema = z.object({
  userName: z.string(),
  patientName: z.string().min(2, "Patient name is required"),
  userContact: z.string().min(10, "Phone number must be at least 10 digits").max(15, "Phone number must be at most 15 digits").regex(/^\+?[0-9]{10,15}$/, "Invalid phone number format"),
  location: z.string().min(5, "Please provide a detailed location"),
  emergencyDescription: z.string().max(255, "Please provide a short description of the emergency"),
  medicalNotes: z.string().optional(),
})

type RequestForm = z.infer<typeof requestSchema>

export default function RequestPage() {
  const [isLoading, setIsLoading] = useState(false)
  const { success, error: notifyError } = useNotification()
  const navigate = useNavigate()

  const form = useForm<RequestForm>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      userName: "",
      patientName: "",
      userContact: "",
      location: "",
      emergencyDescription: "",
      medicalNotes: "",
    },
  })

  const onSubmit = async (data: RequestForm) => {
    setIsLoading(true)
    try {
      const requestData = {
        userName: data.userName,
        patientName: data.patientName,
        userContact: data.userContact,
        location: data.location,
        emergencyDescription: data.emergencyDescription,
        medicalNotes: data.medicalNotes || "",
      }

      const response = await requestAPI.create(requestData)

      success(
         "Request submitted successfully",
        `Request ID: ${response.id}`,
      )

      navigate(`/request/success/${response.id}`)
    } catch (error: unknown) {
      if (error && typeof error === "object" && "response" in error) {
        const errResp = (error as AxiosError<{ error?: string; message?: string }> ).response;
        const backendMsg = errResp?.data?.error || errResp?.data?.message || JSON.stringify(errResp?.data);
        if (backendMsg && backendMsg.toLowerCase().includes("patientName")) {
          form.setError("patientName", { type: "manual", message: "Please enter patient name" });
        } else if (backendMsg && backendMsg.toLowerCase().includes("userContact")) {
          form.setError("userContact", { type: "manual", message: "Please enter a valid contact number" });
        } else {
          notifyError("Registration failed", backendMsg);
        }
      } else {
        notifyError("Failed to submit request", (error as Error)?.message || "Unknown error");
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Emergency Request</h1>
            <p className="text-muted-foreground">Please provide detailed information for the fastest response</p>
          </div>

          <Card className="border-red-200 dark:border-red-800">
            <CardHeader>
              <CardTitle className="flex items-center text-red-600">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Emergency Information
              </CardTitle>
              <CardDescription>
                Fill out all required fields accurately to ensure proper medical response
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center">
                      <MapPin className="h-5 w-5 mr-2" />
                      Location Details
                    </h3>

                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Emergency Location *</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter full address with landmarks" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="emergencyDescription"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Emergency Description</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Describe the emergency situation"
                              className="min-h-[100px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center">
                      <User className="h-5 w-5 mr-2" />
                      Patient Information
                    </h3>

                    <FormField
                      control={form.control}
                      name="userName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Your Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your full name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="patientName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Patient Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Full name of the patient" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="userContact"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact Number *</FormLabel>
                          <FormControl>
                            <Input type="tel" placeholder="Phone number for contact" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="medicalNotes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Medical Notes <span className="text-muted-foreground">(If Any.)</span></FormLabel>
                        <FormControl>
                          <Textarea placeholder="Any relevant medical information or notes" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-4 pt-6">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 bg-transparent"
                      onClick={() => navigate("/")}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" className="flex-1 bg-red-600 hover:bg-red-700" disabled={isLoading}>
                      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Submit Emergency Request
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
