import AuthForm from "@/components/AuthForm";
import { cookies } from "next/headers";

export default async function LoginPage() {
  const searchParams = (await cookies()).get("next-url")?.value;
  const message = searchParams?.includes("message")
    ? decodeURIComponent(searchParams.split("message=")[1])
    : null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      {message && (
        <div className="mb-4 p-4 bg-green-100 text-green-700 rounded-md">
          {message}
        </div>
      )}
      <AuthForm />
    </div>
  );
}
