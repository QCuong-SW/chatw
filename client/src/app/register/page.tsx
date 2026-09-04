'use client';
/// tương tự với bên page của register, đánh dấu client tương tác

// import function render componnent từ UI auth 
import { AuthCard } from '@/components/auth/AuthCard';

// export func đồng thời return các component từ UI mode signup
export default function RegisterPage() {
  return <AuthCard initialMode="signup" />;
}
