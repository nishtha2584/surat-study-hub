import { Navigate } from "react-router-dom";
import useAuthStore from "../stores/useAuthStore";

export default function PrivateRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
}
