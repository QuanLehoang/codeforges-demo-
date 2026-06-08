
## Gán quyền admin cho tài khoản Lê Hoàng Quân

Cấp role `admin` cho user có email `lehoangquan19082012@gmail.com` để truy cập trang `/admin`.

### Các bước thực hiện

1. **Tra cứu user_id** trong `auth.users` theo email `lehoangquan19082012@gmail.com`.
2. **Kiểm tra** trong `user_roles` xem đã có bản ghi role `user` mặc định chưa (trigger `handle_new_user` đã tạo sẵn).
3. **Insert** một bản ghi mới vào `public.user_roles` với `role = 'admin'` cho `user_id` đó (giữ nguyên role `user` cũ — bảng cho phép nhiều role/user nhờ unique constraint `(user_id, role)`).

### SQL sẽ chạy

```sql
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'lehoangquan19082012@gmail.com'
ON CONFLICT DO NOTHING;
```

### Nghiệm thu

- Đăng nhập lại bằng `lehoangquan19082012@gmail.com` → header hiện link **Admin**.
- Truy cập `/admin` không còn thấy trang 403 Forbidden.
- `useAuth().isAdmin` trả về `true`.

### Lưu ý

Email bạn cung cấp thiếu phần `.com` (`@gmail` thay vì `@gmail.com`). Mình giả định là `lehoangquan19082012@gmail.com` — nếu đăng ký bằng email khác, báo lại để mình sửa.

<lov-actions>
<lov-suggestion message="Đúng email lehoangquan19082012@gmail.com, hãy gán admin và để tôi test truy cập /admin">Xác nhận và gán admin</lov-suggestion>
<lov-suggestion message="Email tôi đăng ký khác, là: [điền email đúng]">Email khác</lov-suggestion>
</lov-actions>
