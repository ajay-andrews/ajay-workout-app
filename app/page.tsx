import Link from 'next/link'

export default function Home() {
  return (
    <main className="p-6 bg-black min-h-screen text-slate-100 flex flex-col items-center justify-center">
      <h1 className="text-4xl font-black italic tracking-tighter text-blue-600 mb-12 text-center uppercase">
        Discipline Equals Freedom
      </h1>
      
      <div className="w-full max-w-xs space-y-4">
        <Link href="/inspiration" className="block w-full bg-slate-900 border border-slate-800 p-6 rounded-xl text-center font-black hover:border-blue-600 transition uppercase tracking-widest">
          Inspiration
        </Link>
        <Link href="/aspiration" className="block w-full bg-slate-900 border border-slate-800 p-6 rounded-xl text-center font-black hover:border-blue-600 transition uppercase tracking-widest">
          Aspiration
        </Link>
        <Link href="/foundation" className="block w-full bg-slate-900 border border-slate-800 p-6 rounded-xl text-center font-black hover:border-blue-600 transition uppercase tracking-widest">
          Foundation
        </Link>
      </div>
    </main>
  )
}