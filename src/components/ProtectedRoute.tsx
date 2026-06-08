import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export const ProtectedRoute = ({ children, requireAdmin = false }: { children: JSX.Element; requireAdmin?: boolean }) => {
  const { user, isAdmin, isBanned, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[60vh] grid place-items-center">
        <div className="h-8 w-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location.pathname }} replace />;
  }

  if (isBanned) {
    return (
      <div className="container py-24 text-center max-w-md">
        <div className="text-xs font-mono text-destructive uppercase tracking-widest mb-2">403 · Banned</div>
        <h1 className="font-display text-3xl font-bold mb-2">Tài khoản đã bị khóa</h1>
        <p className="text-muted-foreground">
          Tài khoản này đã bị ban khỏi CodeForge. Vui lòng liên hệ hỗ trợ nếu bạn cho rằng đây là nhầm lẫn.
        </p>
      </div>
    );
  }

  if (requireAdmin && !isAdmin) {
    return (
      <div className="container py-24 text-center max-w-md">
        <div className="text-xs font-mono text-destructive uppercase tracking-widest mb-2">403 · Forbidden</div>
        <h1 className="font-display text-3xl font-bold mb-2">Không có quyền truy cập</h1>
        <p className="text-muted-foreground">Khu vực quản trị chỉ dành cho tài khoản admin.</p>
      </div>
    );
  }

  return children;
};
