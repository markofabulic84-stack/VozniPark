import Link from "next/link";
import ResetForm from "./ResetForm";

export default async function ResetLozinkePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return (
    <main className="flex-1 flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="mono text-sm" style={{ color: "var(--blue)" }}>
            &lt;/&gt; VozniPark
          </Link>
          <h1 className="display text-2xl mt-4">Nova lozinka</h1>
        </div>
        <ResetForm token={token} />
      </div>
    </main>
  );
}
