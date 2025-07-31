import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

interface BackButtonProps {
  isAuthenticated: boolean;
}

export function BackButton({ isAuthenticated }: BackButtonProps) {
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate(-1);
  };

  if (isAuthenticated) {
    return (
      <button onClick={handleGoBack} className="flex items-center text-sm hover:underline">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Dashboard
      </button>
    );
  }

  return (
    <button onClick={handleGoBack} className="flex items-center text-sm hover:underline">
      <ArrowLeft className="h-4 w-4 mr-2" />
      Back
    </button>
  );
}
