import Footer from "@/components/layout/Footer";
import RegistrationWizard from "@/components/auth/RegistrationWizard";

type Props = { searchParams: Promise<{ type?: string }> };

export default async function RegisterPage({ searchParams }: Props) {
  const { type } = await searchParams;
  // "supplier" is the public word for the Buyer & Supplier (hybrid) account.
  const initialAccountType = type === "supplier" || type === "hybrid" ? "hybrid" : type === "buyer" ? "buyer" : undefined;

  return (
    <>
      <div className="min-h-screen bg-aviation-light py-8 sm:py-16">
        <RegistrationWizard initialAccountType={initialAccountType} />
      </div>
      <Footer />
    </>
  );
}
