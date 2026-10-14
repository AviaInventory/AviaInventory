import LoginForm from "@/components/auth/LoginForm";

type Props = { searchParams: Promise<{ next?: string; message?: string }> };

export default async function LoginPage({ searchParams }: Props) {
  const { next, message } = await searchParams;

  return (
    <main className="min-h-screen bg-aviation-light py-8 sm:py-16">
      <div className="mx-auto max-w-lg px-4 sm:px-6">
        <LoginForm next={next} notice={message} />
      </div>
    </main>
  );
}
