import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-aviation-light py-8 sm:py-16">
      <div className="mx-auto max-w-lg px-4 sm:px-6">
        <LoginForm />
      </div>
    </main>
  );
}