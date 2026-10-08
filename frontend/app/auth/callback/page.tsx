"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { sessionActive } from "../../../lib/auth";

function CallbackHandler() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    // server sudah menyimpan sesi di cookie HttpOnly lalu redirect bersih
    // (tanpa token di URL); pastikan sesi benar-benar aktif
    if (params.get("error")) {
      router.replace(`/login?error=${encodeURIComponent(params.get("error") ?? "oauth_failed")}`);
      return;
    }
    sessionActive().then((ok) => {
      router.replace(ok ? "/dashboard" : "/login?error=oauth_failed");
    });
  }, [params, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-50">
      <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
      <p className="text-sm text-slate-600">Finishing Google login...</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
        </div>
      }
    >
      <CallbackHandler />
    </Suspense>
  );
}
