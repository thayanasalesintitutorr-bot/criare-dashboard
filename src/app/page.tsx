import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f6f6fb] text-[#191b2a]">
      <div className="relative flex min-h-screen items-center justify-center px-6">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(130,130,160,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(130,130,160,0.08)_1px,transparent_1px)] bg-[size:88px_88px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(124,92,255,0.10),transparent_38%),radial-gradient(circle_at_bottom,rgba(124,92,255,0.08),transparent_32%)]" />

        <section className="relative z-10 mx-auto flex w-full max-w-4xl flex-col items-center text-center">
          <span className="mb-8 rounded-full border border-[#d9d7f8] bg-white/60 px-6 py-2 text-sm font-medium uppercase tracking-[0.22em] text-[#6f63ff] shadow-sm backdrop-blur">
            Dashboard inteligente
          </span>

          <h1 className="bg-gradient-to-r from-[#5b5cf6] to-[#9b6bff] bg-clip-text text-6xl font-black tracking-[-0.06em] text-transparent sm:text-7xl md:text-8xl">
            Criare
          </h1>

          <h2 className="mt-8 max-w-3xl text-3xl font-semibold tracking-[-0.03em] text-[#1f2233] sm:text-4xl">
            Domine sua operação com inteligência real
          </h2>

          <p className="mt-5 max-w-2xl text-lg text-[#6e7487] sm:text-xl">
            Dados, performance e decisão em um único lugar
          </p>

          <Link
            href="/login"
            className="mt-12 rounded-2xl bg-gradient-to-r from-[#5b5cf6] to-[#8e63ff] px-14 py-5 text-lg font-semibold text-white shadow-[0_18px_40px_rgba(107,92,255,0.28)] transition hover:scale-[1.01] hover:shadow-[0_22px_50px_rgba(107,92,255,0.34)]"
          >
            Acessar painel
          </Link>

          <div className="mt-20 flex items-center gap-3">
            <span className="h-2.5 w-2.5 rounded-full bg-[#c7c6f5]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#8a83ff]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#c7c6f5]" />
          </div>
        </section>
      </div>
    </main>
  )
}