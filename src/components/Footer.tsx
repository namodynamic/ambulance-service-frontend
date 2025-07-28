import { Ambulance } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Ambulance className="h-8 w-8 text-red-600" />
              <span className="font-bold text-xl">RapidCare</span>
            </div>
            <p className="text-gray-400">
              Professional emergency medical services when you need them most.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Services</h3>
            <ul className="space-y-2 text-gray-400">
              <li>Emergency Transport</li>
              <li>Medical Care</li>
              <li>24/7 Support</li>
              <li>Insurance Billing</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Support</h3>
            <ul className="space-y-2 text-gray-400">
              <li>Help Center</li>
              <li>Privacy Policy</li>
              <li>Terms of Service</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Contact Us</h3>
            <p className="text-gray-400 mb-2">
              For life-threatening emergencies:
            </p>
            <p className="text-gray-400 mb-2">📞 0 800 2255 372 (Emergency)</p>
            <p className="text-gray-400 mb-2">📧 support@rapidcare.com</p>
            <p className="text-gray-400 mb-2">🏥 Available 24/7</p>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>
            &copy; {new Date().getFullYear()} RapidCare. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
export default Footer;
