import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { Lock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandLogo } from "@/components/BrandLogo";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const passwordSchema = z.string().min(8, "Mật khẩu tối thiểu 8 ký tự").max(72);

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Supabase auto-exchanges the recovery token from the URL hash into a session.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const parsed = passwordSchema.safeParse(password);
      if (!parsed.success) throw new Error(parsed.error.issues[0].message);
      if (password !== confirm) throw new Error("Mật khẩu xác nhận không khớp");

      const { error } = await supabase.auth.updateUser({ password: parsed.data });
      if (error) throw error;

      toast.success("Đã đổi mật khẩu thành công");
      await supabase.auth.signOut();
      navigate("/auth", { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] grid place-items-center p-6">
      <div className="w-full max-w-sm">
        <Link to="/" className="group mb-8 block w-fit">
          <BrandLogo iconClassName="h-9 w-9" />
        </Link>

        <h1 className="font-display text-3xl font-bold tracking-tight">Đặt lại mật khẩu</h1>
        <p className="text-sm text-muted-foreground mt-2">
          {ready
            ? "Nhập mật khẩu mới cho tài khoản của bạn."
            : "Đang xác thực liên kết khôi phục..."}
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="password">Mật khẩu mới</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Tối thiểu 8 ký tự"
                className="pl-9"
                autoComplete="new-password"
                required
                minLength={8}
                disabled={!ready}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirm">Xác nhận mật khẩu</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="confirm"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Nhập lại mật khẩu"
                className="pl-9"
                autoComplete="new-password"
                required
                minLength={8}
                disabled={!ready}
              />
            </div>
          </div>

          <Button
            type="submit"
            size="lg"
            disabled={loading || !ready}
            className="w-full bg-gradient-primary hover:shadow-glow transition-shadow duration-base"
          >
            {loading ? (
              <span className="h-4 w-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
            ) : (
              <>
                Cập nhật mật khẩu
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          <Link to="/auth" className="text-primary hover:underline font-medium">
            ← Quay lại đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
