import { useEffect, useMemo, useState } from "react";
import { Ban, Loader2, RotateCcw, Search, Shield, Trash2, UserCheck, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type UserStatus = "all" | "active" | "pending" | "banned";
type RoleFilter = "all" | "admin" | "user";

type UserRow = {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  status: string;
  created_at: string;
  is_admin?: boolean;
};

const statusLabel: Record<string, string> = {
  active: "Hoạt động",
  pending: "Chờ duyệt",
  banned: "Đã ban",
};

const statusStyle: Record<string, string> = {
  active: "bg-success/15 text-success border-success/30",
  pending: "bg-warning/15 text-warning border-warning/30",
  banned: "bg-destructive/15 text-destructive border-destructive/30",
};

export const UsersTable = () => {
  const { user } = useAuth();
  const [rows, setRows] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<UserStatus>("all");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");

  const load = async () => {
    setLoading(true);
    const [{ data: profiles, error: profilesError }, { data: roles, error: rolesError }] = await Promise.all([
      supabase.from("profiles").select("user_id, display_name, avatar_url, status, created_at").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id, role").eq("role", "admin"),
    ]);
    setLoading(false);

    if (profilesError || rolesError) {
      toast({
        title: "Lỗi tải người dùng",
        description: profilesError?.message ?? rolesError?.message,
        variant: "destructive",
      });
      return;
    }

    const adminSet = new Set((roles ?? []).map((role) => role.user_id));
    setRows(((profiles ?? []) as UserRow[]).map((profile) => ({ ...profile, is_admin: adminSet.has(profile.user_id) })));
  };

  useEffect(() => {
    load();
  }, []);

  const stats = useMemo(
    () => ({
      total: rows.length,
      admins: rows.filter((row) => row.is_admin).length,
      active: rows.filter((row) => row.status === "active").length,
      banned: rows.filter((row) => row.status === "banned").length,
    }),
    [rows],
  );

  const filteredRows = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (statusFilter !== "all" && row.status !== statusFilter) return false;
      if (roleFilter === "admin" && !row.is_admin) return false;
      if (roleFilter === "user" && row.is_admin) return false;
      if (!keyword) return true;
      return [row.user_id, row.display_name, row.status, row.is_admin ? "admin" : "user"]
        .join(" ")
        .toLowerCase()
        .includes(keyword);
    });
  }, [query, roleFilter, rows, statusFilter]);

  const setUserStatus = async (target: UserRow, status: "active" | "banned") => {
    setBusyUserId(target.user_id);
    const { error } = await supabase.from("profiles").update({ status }).eq("user_id", target.user_id);
    setBusyUserId(null);

    if (error) {
      toast({ title: "Cập nhật người dùng thất bại", description: error.message, variant: "destructive" });
      return;
    }

    toast({
      title: status === "banned" ? "Đã ban người dùng" : "Đã bỏ ban người dùng",
      description: target.display_name ?? target.user_id,
    });
    setRows((prev) => prev.map((row) => (row.user_id === target.user_id ? { ...row, status } : row)));
  };

  const deleteUser = async (target: UserRow) => {
    setBusyUserId(target.user_id);
    const { error } = await (supabase.rpc as unknown as (name: string, args: Record<string, unknown>) => Promise<{ error: Error | null }>)(
      "admin_delete_user",
      { _user_id: target.user_id },
    );
    setBusyUserId(null);

    if (error) {
      toast({ title: "Xóa người dùng thất bại", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Đã xóa người dùng", description: target.display_name ?? target.user_id });
    setRows((prev) => prev.filter((row) => row.user_id !== target.user_id));
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-gradient-card p-12 text-center text-muted-foreground">
        <Loader2 className="mx-auto h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Tổng người dùng", stats.total, Users],
          ["Admin", stats.admins, Shield],
          ["Đang hoạt động", stats.active, UserCheck],
          ["Đã ban", stats.banned, Ban],
        ].map(([label, value, Icon]) => (
          <div key={label as string} className="rounded-xl border border-border bg-gradient-card p-4">
            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground">{label as string}</div>
              <Icon className="h-4 w-4 text-primary" />
            </div>
            <div className="mt-1 font-display text-xl font-bold">{value as number}</div>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-gradient-card">
        <div className="border-b border-border px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-sm font-bold uppercase tracking-widest text-secondary">
                Quản lý người dùng ({filteredRows.length})
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">Tìm kiếm, lọc quyền, ban hoặc xóa tài khoản khỏi hệ thống.</p>
            </div>
            <Button size="sm" variant="ghost" onClick={load}>
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Làm mới
            </Button>
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto_auto]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Tìm theo tên, id, quyền, trạng thái..."
                className="pl-9"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value as RoleFilter)}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="all">Tất cả quyền</option>
              <option value="admin">Admin</option>
              <option value="user">User</option>
            </select>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as UserStatus)}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Hoạt động</option>
              <option value="pending">Chờ duyệt</option>
              <option value="banned">Đã ban</option>
            </select>
          </div>
        </div>

        {filteredRows.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground">Không có người dùng phù hợp.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="p-4 text-left font-mono">Người dùng</th>
                  <th className="p-4 text-left font-mono">Quyền</th>
                  <th className="p-4 text-left font-mono">Trạng thái</th>
                  <th className="p-4 text-left font-mono">Đăng ký</th>
                  <th className="p-4 text-right font-mono">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => {
                  const initial = (row.display_name ?? "?").trim().charAt(0).toUpperCase();
                  const isSelf = row.user_id === user?.id;
                  const isBusy = busyUserId === row.user_id;
                  const actionDisabled = isSelf || row.is_admin || isBusy;

                  return (
                    <tr key={row.user_id} className="border-t border-border hover:bg-muted/20">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            {row.avatar_url && <AvatarImage src={row.avatar_url} alt={row.display_name ?? ""} />}
                            <AvatarFallback>{initial}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">
                              {row.display_name || <span className="text-muted-foreground">(Chưa đặt tên)</span>}
                              {isSelf && <span className="ml-2 text-[10px] font-mono uppercase text-primary">Bạn</span>}
                            </div>
                            <div className="max-w-[280px] truncate font-mono text-xs text-muted-foreground">{row.user_id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        {row.is_admin ? (
                          <span className="inline-flex items-center gap-1 rounded border border-primary/30 bg-primary/15 px-2 py-0.5 font-mono text-[10px] uppercase text-primary">
                            <Shield className="h-3 w-3" /> Admin
                          </span>
                        ) : (
                          <span className="font-mono text-xs text-muted-foreground">User</span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex rounded border px-2 py-0.5 font-mono text-[10px] uppercase ${statusStyle[row.status] ?? "bg-muted"}`}>
                          {statusLabel[row.status] ?? row.status}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-xs text-muted-foreground">{new Date(row.created_at).toLocaleString("vi-VN")}</td>
                      <td className="p-4">
                        <div className="flex justify-end gap-2">
                          {row.status === "banned" ? (
                            <Button size="sm" variant="ghost" disabled={actionDisabled} onClick={() => setUserStatus(row, "active")} className="h-8">
                              {isBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><RotateCcw className="mr-1 h-3.5 w-3.5" /> Bỏ ban</>}
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={actionDisabled}
                              onClick={() => setUserStatus(row, "banned")}
                              className="h-8 text-warning hover:text-warning"
                            >
                              {isBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><Ban className="mr-1 h-3.5 w-3.5" /> Ban</>}
                            </Button>
                          )}

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="ghost" disabled={actionDisabled} className="h-8 text-destructive hover:text-destructive">
                                {isBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><Trash2 className="mr-1 h-3.5 w-3.5" /> Xóa</>}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Xóa người dùng?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tài khoản <span className="font-semibold text-foreground">{row.display_name ?? row.user_id}</span> sẽ bị xóa khỏi Auth,
                                  hồ sơ và quyền liên quan. Hành động này không thể hoàn tác.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Hủy</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteUser(row)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                  Xóa người dùng
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                        {(isSelf || row.is_admin) && (
                          <div className="mt-1 text-right text-[10px] text-muted-foreground">
                            {isSelf ? "Không thể thao tác với chính bạn" : "Không thể thao tác với admin"}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
