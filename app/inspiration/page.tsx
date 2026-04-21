'use client'
import { supabase } from '@/lib/supabase'
import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function InspirationPage() {
  const [quote, setQuote] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchQuote()
  }, [])

  const fetchQuote = async () => {
    setLoading(true)
    const { data } = await supabase.from('quotes').select('text')
    if (data && data.length > 0) {
      const random = data[Math.floor(Math.random() * data.length)]
      setQuote(random.text)
    }
    setLoading(false)
  }

  return (
    <main className="bg-black min-h-screen w-full text-slate-100 flex justify-center">
      <div className="w-full max-w-md p-6 flex flex-col min-h-screen">
        <Link href="/" className="text-blue-500 font-bold text-xs mb-12 block uppercase tracking-tighter hover:text-blue-400 transition-colors mt-4">
          ← Back to Hub
        </Link>

        <h1 className="text-3xl font-black italic mb-10 border-b border-slate-800 pb-2 uppercase tracking-tighter">
          Inspiration
        </h1>

        <div className="flex-grow flex flex-col justify-center pb-32">
          {loading ? (
            <p className="text-slate-500 font-mono text-xs animate-pulse uppercase tracking-widest text-center">
              Retrieving Intel...
            </p>
          ) : (
            <div className="bg-slate-900 border-l-4 border-blue-600 p-8 rounded-r-2xl shadow-xl">
              <p className="text-xl md:text-2xl font-bold italic leading-tight text-slate-100">
                "{quote}"
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}