import Footer from "@/components/layout/Footer";
import RegistrationWizard from "@/components/auth/RegistrationWizard";

export default function RegisterPage() {
  return (
    <>
      <main className="min-h-screen bg-aviation-light py-8 sm:py-16">
        <RegistrationWizard />
      </main>

      <Footer />
    </>
  );
}