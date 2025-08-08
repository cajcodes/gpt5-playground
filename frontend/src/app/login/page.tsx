"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Invalid password" }));
        setError(data.error || "Invalid password");
        setIsLoading(false);
        return;
      }
      const from = searchParams.get("from") || "/chat";
      router.replace(from);
    } catch (err) {
      setError("Something went wrong. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-gray-800 p-6 rounded-lg border border-gray-700 shadow"
      >
        <h1 className="text-xl font-semibold mb-4">Login</h1>
        <label className="block mb-2 text-sm text-white/80" htmlFor="password">
          Enter password to continue
        </label>
        <input
          id="password"
          type="password"
          className="w-full px-3 py-2 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          autoFocus
        />
        {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
        <button
          type="submit"
          disabled={isLoading || !password}
          className={`mt-4 w-full py-2 rounded ${
            isLoading ? "bg-blue-400 opacity-70 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-500"
          }`}
        >
          {isLoading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}


