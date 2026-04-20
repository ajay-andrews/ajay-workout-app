'use client'
import { supabase } from '@/lib/supabase'
import { useState } from 'react'
import Link from 'next/link'

export default function InspirationPage() {
  const [quote, setQuote] = useState('')

  const fetchQuote = async () => {
    // Querying the column name 'text' as per your schema
    const { data } = await supabase.from('quotes').select('text')
    if (data && data.length > 0) {
      const random = data[Math.floor(Math.random() * data.length)]
      setQuote(random.text) // Changed from .content to .text
    }
  }

  return (
    <main className="p-6 bg-black min-h-screen text-slate-100 max-w-md mx-auto">
      <Link href="/" className="text-blue-500 font-bold text-xs mb-8 block uppercase tracking-tighter">← Back to Hub</Link>
      <h1 className="text-3xl font-black italic mb-10 border-b border-slate-800 pb-2">INSPIRATION</h1>
      
      <button 
        onClick={fetchQuote}
        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-lg transition mb-8 uppercase"
      >
        Get After It
      </button>

      {quote && (
        <div className="p-8 bg-slate-900 rounded-xl border-l-4 border-blue-600 shadow-2xl">
          <p className="text-xl italic font-medium leading-relaxed text-slate-200">"{quote}"</p>
        </div>
      )}
    </main>
  )
}