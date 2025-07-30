import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, MapPin, Phone, Shield, Users, CheckCircle, Siren } from "lucide-react"
import Footer from "@/components/Footer"

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <section className="relative py-20 lg:py-32 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex justify-center mb-6">
              <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-full">
                <img src="/amb.svg" alt="ambulance" className="h-12 w-12" />
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              Emergency Medical Services
              <span className="text-red-600 block">When Every Second Counts</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
              Fast, reliable ambulance services with real-time tracking and professional medical care. Request emergency
              assistance with just a few clicks.
            </p>
            <div className="mb-8 flex justify-center">
              <Button
                size="lg"
                className="bg-red-600 hover:bg-red-700 text-white px-6 md:px-12 py-6 text-base md:text-xl font-bold rounded-2xl shadow-2xl transform hover:scale-105 transition-all duration-200  h-18"
                asChild
              >
                <Link to="/request/new" className="flex items-center justify-center">
                  <div className="bg-white rounded-lg p-2 mr-2">
                    <Siren className="h-8 w-8 text-red-600" />
                  </div>
                  EMERGENCY AMBULANCE
                </Link>
              </Button>
            </div>

            <p className="text-lg text-gray-500 dark:text-gray-400">Available 24/7 - Login required for tracking</p>
          </div>
        </div>
      </section>

      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose RapidCare?</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Professional emergency medical services with cutting-edge technology
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mb-4">
                  <Clock className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle>24/7 Availability</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Round-the-clock emergency services with rapid response times and professional medical staff.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center mb-4">
                  <MapPin className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle>Real-time Tracking</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Track your ambulance in real-time with live updates on location and estimated arrival time.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle>Certified Professionals</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Highly trained paramedics and EMTs with state-of-the-art medical equipment.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center mb-4">
                  <Phone className="h-6 w-6 text-orange-600" />
                </div>
                <CardTitle>Easy Booking</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Simple online booking system with instant confirmation and status updates.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-red-600" />
                </div>
                <CardTitle>Patient Care</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Comprehensive patient care from pickup to hospital delivery with detailed medical records.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-teal-100 dark:bg-teal-900/20 rounded-lg flex items-center justify-center mb-4">
                  <CheckCircle className="h-6 w-6 text-teal-600" />
                </div>
                <CardTitle>Insurance Accepted</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  We work with most major insurance providers to ensure affordable emergency care.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="relative py-20 lg:py-32 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Create your account today and have peace of mind knowing professional emergency services are just a click
            away.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link to="/register">Create Account</Link>
            </Button>
            <Button
              size="lg"
              className="bg-red-600 hover:bg-red-700 text-white"
              asChild
            >
              <Link to="/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </section>

     <Footer />
    </div>
  )
}
