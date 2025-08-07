import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-black text-white">
      {/* Header */}
      <header className="mx-auto max-w-6xl px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image src="/next.svg" alt="Logo" width={28} height={28} className="dark:invert opacity-80" />
          <span className="text-lg font-semibold tracking-tight">GPT-5 Playground</span>
        </div>
        <Link
          href="/chat"
          className="rounded-md bg-blue-600 hover:bg-blue-500 transition-colors px-4 py-2 text-sm font-medium"
        >
          Open Chat
        </Link>
      </header>

      {/* Hero */}
      <main className="mx-auto max-w-6xl px-6 pt-10 pb-24">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight">
              Build, test, and iterate with
              <span className="block bg-gradient-to-r from-blue-400 via-sky-300 to-cyan-300 bg-clip-text text-transparent"> GPT‑5, 4o, and more</span>
            </h1>
            <p className="mt-6 text-base sm:text-lg text-gray-300 max-w-prose">
              Streaming UI, cost meter, model selector, and memory. Everything you need to explore
              the latest OpenAI models with a delightful developer experience.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/chat"
                className="inline-flex items-center gap-2 rounded-md bg-blue-600 hover:bg-blue-500 transition-colors px-5 py-3 text-base font-semibold"
              >
                Get started →
              </Link>
              <a
                href="https://github.com/cajcodes/gpt5-playground"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-md border border-white/15 hover:border-white/25 transition-colors px-5 py-3 text-base font-semibold text-white/80"
              >
                View repo
              </a>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 bg-blue-500/20 blur-3xl rounded-full" />
            <div className="relative rounded-xl border border-white/10 bg-white/5 backdrop-blur p-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                  <p className="text-white/70">Live Streaming</p>
                  <p className="mt-1 font-semibold">Token-by-token output</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                  <p className="text-white/70">Cost Meter</p>
                  <p className="mt-1 font-semibold">Usage & pricing at a glance</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                  <p className="text-white/70">Model Selector</p>
                  <p className="mt-1 font-semibold">Switch GPT‑5 / 4o / mini</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                  <p className="text-white/70">Memory</p>
                  <p className="mt-1 font-semibold">Per‑thread summaries</p>
                </div>
              </div>
              <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4 text-xs text-white/60">
                <span>FastAPI + Next.js</span>
                <span>WS Streaming</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mx-auto max-w-6xl px-6 pb-10 text-sm text-white/60">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} GPT‑5 Playground</p>
          <div className="flex items-center gap-4">
            <a href="/chat" className="hover:underline underline-offset-4">Chat</a>
            <a href="https://openai.com" target="_blank" rel="noopener noreferrer" className="hover:underline underline-offset-4">OpenAI</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
