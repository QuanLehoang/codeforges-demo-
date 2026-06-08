import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Gift,
  Lock,
  Mail,
  ShieldCheck,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandLogo } from "@/components/BrandLogo";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const emailSchema = z.string().trim().email("Email không hợp lệ").max(255);
const passwordSchema = z.string().min(6, "Mật khẩu tối thiểu 6 ký tự").max(72);
const usernameSchema = z.string().trim().min(1, "Vui lòng nhập username").max(80);
const otpSchema = z.string().trim().regex(/^\d{8}$/, "Mã xác thực gồm 8 chữ số");

type Mode = "signin" | "signup" | "forgot" | "verify";

const modeCopy: Record<Mode, { title: string; description: string; submit: string }> = {
  signin: {
    title: "Chào mừng trở lại",
    description: "Đăng nhập bằng email để tiếp tục.",
    submit: "Đăng nhập",
  },
  signup: {
    title: "Tạo tài khoản",
    description: "Đăng ký bằng Gmail và xác thực bằng mã được gửi trong hộp thư.",
    submit: "Tạo tài khoản",
  },
  forgot: {
    title: "Quên mật khẩu",
    description: "Nhập email, chúng tôi sẽ gửi link đặt lại mật khẩu.",
    submit: "Gửi link đặt lại",
  },
  verify: {
    title: "Nhập mã xác thực",
    description: "Nhập mã 8 chữ số đã gửi tới Gmail của bạn.",
    submit: "Xác thực Gmail",
  },
};

const getGmailLocalPart = (value: string) => value.replace(/@gmail\.com$/i, "").replace(/[^a-zA-Z0-9._-]/g, "");

const Auth = () => {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [gmailName, setGmailName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [username, setUsername] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [otp, setOtp] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formMessage, setFormMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "/account";
  const copy = modeCopy[mode];

  const signupEmail = useMemo(() => {
    const localPart = getGmailLocalPart(gmailName.trim());
    return localPart ? `${localPart}@gmail.com` : "";
  }, [gmailName]);

  const activeEmail = mode === "signup" ? signupEmail : mode === "verify" ? pendingEmail || email : email;

  const switchMode = (nextMode: Mode) => {
    setMode(nextMode);
    setFormMessage("");
    setOtp("");
    if (nextMode !== "signup") {
      setConfirmPassword("");
      setReferralCode("");
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const nextOtp = otp.padEnd(8, " ").split("");
    nextOtp[index] = digit || " ";
    setOtp(nextOtp.join("").replace(/\s/g, ""));

    if (digit && index < 7) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 8);
    setOtp(pasted);
    const nextIndex = Math.min(pasted.length, 7);
    document.getElementById(`otp-${nextIndex}`)?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormMessage("");
    setLoading(true);

    try {
      const emailParsed = emailSchema.safeParse(activeEmail);
      if (!emailParsed.success) throw new Error(emailParsed.error.issues[0].message);

      const passParsed = mode === "forgot" || mode === "verify" ? null : passwordSchema.safeParse(password);
      if (passParsed && !passParsed.success) throw new Error(passParsed.error.issues[0].message);

      if (mode === "verify") {
        const codeParsed = otpSchema.safeParse(otp);
        if (!codeParsed.success) throw new Error(codeParsed.error.issues[0].message);

        const { error } = await supabase.auth.verifyOtp({
          email: emailParsed.data,
          token: codeParsed.data,
          type: "signup",
        });
        if (error) throw error;

        await supabase.auth.signOut();
        toast.success("Xác thực Gmail thành công", {
          description: "Bạn có thể đăng nhập ngay bằng tài khoản vừa xác thực.",
          duration: 6000,
        });
        setEmail(emailParsed.data);
        setPassword("");
        switchMode("signin");
        return;
      }

      if (mode === "signup") {
        const usernameParsed = usernameSchema.safeParse(username);
        if (!usernameParsed.success) throw new Error(usernameParsed.error.issues[0].message);
        if (password !== confirmPassword) throw new Error("Mật khẩu xác nhận không khớp");

        const { data, error } = await supabase.auth.signUp({
          email: emailParsed.data,
          password: passParsed!.data,
          options: {
            emailRedirectTo: `${window.location.origin}/auth`,
            data: {
              display_name: usernameParsed.data,
              username: usernameParsed.data,
              referral_code: referralCode.trim() || null,
            },
          },
        });
        if (error) throw error;
        if (data.user?.identities && data.user.identities.length === 0) {
          throw new Error("Email này đã được đăng ký");
        }

        await supabase.auth.signOut();
        setEmail(emailParsed.data);
        setPendingEmail(emailParsed.data);
        switchMode("verify");
        toast.success("Đã gửi mã xác thực", {
          description: "Hãy mở Gmail và nhập mã 8 chữ số để xác thực tài khoản.",
          duration: 6000,
        });
        return;
      }

      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(emailParsed.data, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;

        toast.success("Đã gửi email khôi phục", {
          description: "Kiểm tra hộp thư để đặt lại mật khẩu.",
          duration: 6000,
        });
        switchMode("signin");
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailParsed.data,
        password: passParsed!.data,
      });
      if (error) throw error;

      if (data.user && !data.user.email_confirmed_at) {
        await supabase.auth.signOut();
        setPendingEmail(emailParsed.data);
        switchMode("verify");
        toast.error("Gmail chưa được xác thực", {
          description: "Hãy nhập mã 8 chữ số đã gửi tới Gmail của bạn.",
          duration: 6000,
        });
        return;
      }

      toast.success("Chào mừng trở lại!");
      navigate(from, { replace: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Có lỗi xảy ra";
      const friendly = msg.includes("Invalid login credentials")
        ? "Email hoặc mật khẩu không đúng"
        : msg.includes("Failed to fetch")
          ? "Không kết nối được tới Supabase. Hãy kiểm tra mạng, URL dự án hoặc restart lại dev server."
        : msg.includes("already registered")
          ? "Email này đã được đăng ký"
          : msg.includes("Email not confirmed")
            ? "Gmail chưa được xác thực. Hãy nhập mã 8 chữ số trong email."
            : msg;
      setFormMessage(friendly);
      toast.error(friendly);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] grid lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden border-r border-border lg:flex flex-col justify-between p-10">
        <div className="absolute inset-0 bg-grid opacity-[0.06]" />
        <div className="absolute left-0 top-0 h-[500px] w-[600px] rounded-full bg-gradient-aurora opacity-40 blur-3xl" />

        <Link to="/" className="relative group w-fit">
          <BrandLogo iconClassName="h-10 w-10" textClassName="text-xl" />
        </Link>

        <div className="relative max-w-md space-y-6">
          <div className="font-mono text-xs uppercase tracking-widest text-primary">Chủ sở hữu · Lê Hoàng Quân</div>
          <h1 className="font-display text-4xl font-bold leading-tight xl:text-5xl">
            Build nhanh hơn với <span className="text-gradient">component cao cấp</span>
          </h1>
          <p className="text-muted-foreground">
            Đăng nhập để truy cập thư viện component, license keys và lịch sử mua hàng của bạn.
          </p>
          <div className="flex items-center gap-3 pt-2">
            <div className="flex -space-x-2">
              {["from-primary to-accent", "from-secondary to-primary", "from-accent to-secondary"].map((gradient, index) => (
                <div key={index} className={`h-8 w-8 rounded-full border-2 border-background bg-gradient-to-br ${gradient}`} />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">Xác thực Gmail bằng mã 8 chữ số</span>
          </div>
        </div>

        <div className="relative font-mono text-xs text-muted-foreground">
          © {new Date().getFullYear()} CodeForges · Lê Hoàng Quân
        </div>
      </aside>

      <main className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <Link to="/" className="mb-8 block lg:hidden">
            <BrandLogo iconClassName="h-9 w-9" />
          </Link>

          <h2 className="font-display text-3xl font-bold tracking-tight">{copy.title}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{copy.description}</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            {mode === "signup" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Username
                  </Label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Nhập username..."
                      className="h-12 rounded-xl pl-11"
                      autoComplete="username"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gmailName" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Email
                  </Label>
                  <div className="relative flex h-12 overflow-hidden rounded-xl border border-input bg-background focus-within:ring-2 focus-within:ring-primary">
                    <div className="relative flex min-w-0 flex-1 items-center">
                      <Mail className="absolute left-4 h-4 w-4 text-muted-foreground" />
                      <input
                        id="gmailName"
                        value={gmailName}
                        onChange={(e) => setGmailName(getGmailLocalPart(e.target.value))}
                        placeholder="yourname"
                        className="h-full w-full bg-transparent pl-11 pr-3 text-sm outline-none placeholder:text-muted-foreground"
                        autoComplete="email"
                        required
                      />
                    </div>
                    <div className="flex items-center border-l border-border bg-muted/60 px-4 text-sm font-semibold text-foreground">
                      @gmail.com
                    </div>
                  </div>
                </div>
              </>
            )}

            {mode !== "signup" && (
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={activeEmail}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (mode === "verify") setPendingEmail(e.target.value);
                    }}
                    placeholder="you@gmail.com"
                    className="h-12 rounded-xl pl-11"
                    autoComplete="email"
                    required
                  />
                </div>
              </div>
            )}

            {mode === "verify" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="otp" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Mã xác thực
                  </Label>
                  <span className="text-xs text-muted-foreground">8 chữ số</span>
                </div>
                <input
                  className="sr-only"
                  value={otp}
                  onChange={() => undefined}
                  pattern="[0-9]{8}"
                  required
                  tabIndex={-1}
                  aria-hidden="true"
                />
                <div className="grid grid-cols-8 gap-2">
                  {Array.from({ length: 8 }).map((_, index) => (
                    <Input
                      key={index}
                      id={`otp-${index}`}
                      type="text"
                      inputMode="numeric"
                      value={otp[index] ?? ""}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      onPaste={handleOtpPaste}
                      autoComplete={index === 0 ? "one-time-code" : "off"}
                      maxLength={1}
                      aria-label={`Mã xác thực số ${index + 1}`}
                      className="h-12 rounded-md border-border/80 bg-muted/70 p-0 text-center font-mono text-lg font-semibold shadow-sm transition-all focus-visible:ring-2 focus-visible:ring-primary"
                    />
                  ))}
                </div>
              </div>
            )}

            {mode !== "forgot" && mode !== "verify" && (
              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Mật khẩu
                </Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Tối thiểu 6 ký tự"
                    className="h-12 rounded-xl pl-11 pr-11"
                    autoComplete={mode === "signin" ? "current-password" : "new-password"}
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                    aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {mode === "signin" && (
                  <div className="text-right">
                    <button type="button" onClick={() => switchMode("forgot")} className="text-xs text-primary hover:underline">
                      Quên mật khẩu?
                    </button>
                  </div>
                )}
              </div>
            )}

            {mode === "signup" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Xác nhận mật khẩu
                  </Label>
                  <div className="relative">
                    <ShieldCheck className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Nhập lại mật khẩu"
                      className="h-12 rounded-xl pl-11 pr-11"
                      autoComplete="new-password"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((value) => !value)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                      aria-label={showConfirmPassword ? "Ẩn mật khẩu xác nhận" : "Hiện mật khẩu xác nhận"}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="referralCode" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Mã giới thiệu <span className="normal-case tracking-normal">(không bắt buộc)</span>
                  </Label>
                  <div className="relative">
                    <Gift className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="referralCode"
                      value={referralCode}
                      onChange={(e) => setReferralCode(e.target.value)}
                      placeholder="Nhập mã giới thiệu nếu có..."
                      className="h-12 rounded-xl pl-11 uppercase placeholder:normal-case"
                      autoComplete="off"
                    />
                  </div>
                </div>
              </>
            )}

            {formMessage && (
              <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
                {formMessage}
              </p>
            )}

            <Button
              type="submit"
              size="lg"
              disabled={loading}
              className="w-full bg-gradient-primary transition-shadow duration-base hover:shadow-glow"
            >
              {loading ? (
                <span className="h-4 w-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
              ) : (
                <>
                  {copy.submit}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "forgot" || mode === "verify" ? (
              <button onClick={() => switchMode("signin")} className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
                <ArrowLeft className="h-3.5 w-3.5" />
                Quay lại đăng nhập
              </button>
            ) : mode === "signin" ? (
              <>
                Chưa có tài khoản?{" "}
                <button onClick={() => switchMode("signup")} className="font-medium text-primary hover:underline">
                  Đăng ký
                </button>
              </>
            ) : (
              <>
                Đã có tài khoản?{" "}
                <button onClick={() => switchMode("signin")} className="font-medium text-primary hover:underline">
                  Đăng nhập
                </button>
              </>
            )}
          </div>

          <p className="mt-8 text-center text-[11px] text-muted-foreground">
            Bằng việc tiếp tục, bạn đồng ý với điều khoản dịch vụ của CodeForges.
          </p>
        </div>
      </main>
    </div>
  );
};

export default Auth;
