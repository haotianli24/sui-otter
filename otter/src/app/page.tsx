import HomeClient from "@/components/ui/HomeClient";

export default function Page() {
  return (
    <main className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold">Otter</h1>
      <p className="text-gray-600 mt-2">
        Next.js + Tailwind + shadcn + Supabase + Sui dApp Kit + Enoki
      </p>
      <HomeClient />
    </main>
  );
}
