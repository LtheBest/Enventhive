import { LoginForm } from "@/components/LoginForm";

export default function AdminLogin() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <LoginForm userType="admin" />
    </div>
  );
}
