import Link from 'next/link'

export default function AspirationPage() {
  return (
    <main className="p-6 bg-black min-h-screen text-slate-100 flex flex-col items-center justify-center">
      <h1 className="text-2xl font-black italic mb-4 uppercase">Aspiration</h1>
      <p className="text-slate-500 mb-8 text-sm">System calibrating. Logic engine offline.</p>
      <Link href="/" className="text-blue-500 font-bold text-xs uppercase tracking-tighter">← Back to Hub</Link>
    </main>
  )
}