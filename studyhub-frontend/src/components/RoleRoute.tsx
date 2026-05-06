import { Result, Button } from "antd";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../stores/useAuthStore";
import type { UserRole } from "../stores/useAuthStore";


interface RoleRouteProps {
  roles: UserRole[];
  children: React.ReactNode;
}

export default function RoleRoute({ roles, children }: RoleRouteProps) {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();

  if (!user || !roles.includes(user.role)) {
    return (
      <div style={{ padding: "80px 0" }}>
        <Result
          status="403"
          title="403 Forbidden"
          subTitle="Sorry, you are not authorized to access this page."
          extra={
            <Button type="primary" onClick={() => navigate("/dashboard")}>
              Back to Dashboard
            </Button>
          }
        />
      </div>
    );
  }

  return <>{children}</>;
}

