import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="text-center">
        <p className="text-7xl font-semibold tracking-tight text-control-accent">404</p>
        <h1 className="mt-4 text-2xl font-semibold text-white">Page not found</h1>
        <p className="mt-2 text-sm text-slate-400">
          This operations view does not exist. Return to the control room.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-control-accent px-4 py-3 text-sm font-semibold text-slate-950 transition-all duration-200 hover:brightness-110"
        >
          Back to dashboard
        </Link>
      </div>
    </main>
  );
}
