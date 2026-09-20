import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/auth";
import { AdminLogin } from "@/components/admin-login";

export default async function AdminLoginPage() {
  if (await getCurrentAdmin()) redirect("/admin/dashboard");
  return <AdminLogin />;
}
