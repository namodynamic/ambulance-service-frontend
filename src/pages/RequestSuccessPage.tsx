"use client";

import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useNotification } from "@/hooks/useNotification";
import { CheckCircle, Phone, Plus, Loader2, User, LogIn } from "lucide-react";
import { requestAPI } from "@/api/ambulanceServiceAPI";
import type { EmergencyRequest } from "@/types";

export default function RequestSuccessPage() {
  const { id } = useParams<{ id: string }>();
  const { success, error: notifyError } = useNotification();
  const [request, setRequest] = useState<EmergencyRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(75);

  useEffect(() => {
    const fetchRequest = async () => {
      if (!id) return;

      try {
        const data = await requestAPI.getById(Number.parseInt(id));
        setRequest(data);
      } catch (error: unknown) {
        let message = "Error loading request";
        if (error instanceof Error) {
          message = error.message || message;
        }
        notifyError("Error loading request", message);
      } finally {
        setLoading(false);
      }
    };

    fetchRequest();

    // Simulate progress animation
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return 90;
        return prev + 1;
      });
    }, 2000);

    return () => clearInterval(progressInterval);
  }, [id, notifyError]);

  const getEstimatedMinutes = () => {
    // Mock estimation
    return "10";
  };

  const handleContactDispatch = () => {
    success("Contacting Dispatch", "Connecting you to emergency dispatch...");
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
              <p className="text-muted-foreground">Request not found</p>
              <Button className="mt-4" asChild>
                <Link to="/">Return Home</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <div className="w-24 h-24 bg-green-500 rounded-2xl flex items-center justify-center shadow-lg">
                <CheckCircle className="h-12 w-12 text-white" />
              </div>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-green-600 mb-6">
              Request Submitted Successfully!
            </h1>
          </div>

          <Card className="mb-8 border-0 shadow-lg">
            <CardContent className="pt-8 pb-8 text-center">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-8">
                Your Request ID: REQ-{request.id?.toString().padStart(4, "0")}
              </h2>

              {/* Status and Progress */}
              <div className="mb-8">
                <p className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">
                  Ambulance arriving at location
                </p>

                <div className="mb-6">
                  <Progress value={progress} className="h-3" />
                </div>

                <div className="text-center">
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
                    Estimated Time of Arrival
                  </h3>
                  <div className="text-6xl font-bold text-red-600 mb-4">
                    {getEstimatedMinutes()} minute
                    {getEstimatedMinutes() !== "1" ? "s" : ""}
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                <Button
                  onClick={handleContactDispatch}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg font-semibold rounded-xl"
                >
                  <Phone className="h-5 w-5 mr-2" />
                  Contact Dispatch
                </Button>

                <Button
                  variant="outline"
                  className="border-2 border-gray-300 hover:bg-gray-50 px-8 py-3 text-lg font-semibold rounded-xl bg-transparent"
                  asChild
                >
                  <Link to="/request/new">
                    <Plus className="h-5 w-5 mr-2" />
                    Submit Another Request
                  </Link>
                </Button>
              </div>

              <div className="border-t pt-6">
                <p className="text-gray-600 dark:text-gray-400 mb-4 text-lg">
                  Want to track your request or view history?
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button variant="outline" asChild>
                    <Link to="/login">
                      <LogIn className="h-4 w-4 mr-2" />
                      Login
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link to="/register">
                      <User className="h-4 w-4 mr-2" />
                      Create Account
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Information */}
          <Card className="border-0 shadow-lg">
            <CardContent className="pt-6">
              <div className="text-center text-gray-600 dark:text-gray-400">
                <p className="mb-2">
                  <strong>Location:</strong> {request.location}
                </p>
                <p className="mb-2">
                  <strong>Patient:</strong> {request.userName}
                </p>
                <p className="mb-2">
                  <strong>Contact:</strong> {request.userContact}
                </p>
                <p>
                  <strong>Request Time:</strong>{" "}
                  {request.createdAt &&
                    new Date(request.createdAt).toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
