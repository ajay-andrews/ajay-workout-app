'use client'
import { supabase } from '@/lib/supabase'
import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function InspirationPage() {
  const [quote, setQuote] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Load the quote immediately when the component mounts
  useEffect(() => {
    fetchQuote()
  }, [])

  const fetchQuote = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('quotes')
      .select('text')
    
    if (data && data.length > 0) {
      const random = data[Math.floor(Math.random() * data.length)]
      setQuote(random.text)
    }
    setLoading(false)
  }

  return (
    <main className="p-6 bg-black min-h-screen text-slate-100 max-w-md mx-auto flex flex-col">
      <Link href="/" className="text-blue-500 font-bold text-xs mb-12 block uppercase tracking-tighter">
        ← Back to Hub
      </Link>

      <h1 className="text-3xl font-black italic mb-10 border-b border-slate-800 pb-2 uppercase tracking-tighter">
        Inspiration
      </h1>

      <div className="flex-grow flex flex-col justify-center">
        {loading ? (
          <p className="text-slate-500 font-mono text-xs animate-pulse uppercase tracking-widest text-center">
            Retrieving Intel...
          </p>
        ) : (
          <div className="bg-slate-900 border-l-4 border-blue-600 p-8 rounded-r-2xl shadow-2xl">
            <p className="text-xl md:text-2xl font-bold italic leading-tight text-slate-100">
              "{quote}"
            </p>
          </div>
        )}
      </div>

      <div className="mt-12">
        <button 
          onClick={fetchQuote}
          className="w-full bg-slate-900 border border-slate-800 text-slate-400 py-4 rounded-xl font-black uppercase text-xs tracking-widest hover:border-blue-600 hover:text-blue-500 transition-all"
        >
          New Directive
        </button>
      </div>
    </main>
  )
}