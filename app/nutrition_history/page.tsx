'use client'
import { supabase } from '@/lib/supabase'
import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function NutritionHistory() {
  const [history, setHistory] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const target = 1800

  useEffect(() => {
    fetchHistory()
  }, [])

  const fetchHistory = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Get date for 30 days ago in local time
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const startDate = thirtyDaysAgo.toLocaleDateString('en-CA') 

    const { data, error } = await supabase
      .from('nutrition_logs')
      .select('log_date, calories_snapshot, amount_consumed')
      .eq('user_id', user.id)
      .gte('log_date', startDate)

    if (data) {
      // Calculate totals including the multiplier for each log entry
      const totals = data.reduce((acc: any, log: any) => {
        const consumed = log.calories_snapshot * (log.amount_consumed || 1)
        acc[log.log_date] = (acc[log.log_date] || 0) + consumed
        return acc
      }, {})
      setHistory(totals)
    }
    setLoading(false)
  }

  // Generate last 30 days
  const days = [...Array(30)].map((_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - i)
    return d.toLocaleDateString('en-CA')
  }).reverse()

  if (loading) return <div className="bg-black min-h-screen p-6 text-slate-500 font-black italic uppercase tracking-tighter">Loading History...</div>

  return (
    <div className="bg-black min-h-screen text-slate-100 p-6 font-sans">
      <div className="max-w-md mx-auto pt-4">
        
        {/* HEADER SECTION */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <Link href="/" className="text-blue-500 font-black text-[10px] uppercase tracking-widest">
              ← Hub
            </Link>
            <h1 className="text-xl font-black italic uppercase tracking-tighter">
              Nutrition History
            </h1>
            <div className="w-10" /> {/* Spacer for symmetry */}
          </div>
          
          <div className="text-center">
            <p className="text-[10px] font-black text-slate-600 tracking-[0.2em] border-y border-slate-900/50 py-2 uppercase">
              30-Day Consistency Grid
            </p>
          </div>
        </div>

        {/* 30-Day Grid */}
        <div className="grid grid-cols-7 gap-2 mb-10">
          {days.map(date => {
            const calories = history[date]
            const dayNum = new Date(date + 'T12:00:00').getDate() 
            
            let bgColor = 'bg-slate-900' 
            if (calories > 0) {
              bgColor = calories <= target ? 'bg-blue-600' : 'bg-orange-600'
            }

            return (
              <div 
                key={date}
                className={`${bgColor} aspect-square rounded-lg flex flex-col items-center justify-center border border-white/5 shadow-lg active:scale-95 transition-transform`}
              >
                <span className="text-[10px] font-black opacity-40">{dayNum}</span>
                {calories > 0 && (
                  <span className="text-[8px] font-bold">{Math.round(calories)}</span>
                )}
              </div>
            )}
          )}
        </div>

        {/* Legend */}
        <div className="bg-slate-900/40 p-6 rounded-[2rem] border border-slate-800 space-y-4">
          <label className="text-[10px] font-black uppercase text-slate-500 block tracking-widest text-center mb-2">Efficiency Legend</label>
          
          <div className="flex items-center gap-4">
            <div className="w-5 h-5 bg-blue-600 rounded-md shadow-lg shadow-blue-900/20" />
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">On Target</span>
              <p className="text-[9px] text-slate-500 font-bold uppercase">Within {target} kcal limit</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-5 h-5 bg-orange-600 rounded-md shadow-lg shadow-orange-900/20" />
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Over Limit</span>
              <p className="text-[9px] text-slate-500 font-bold uppercase">Caloric surplus detected</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-5 h-5 bg-slate-900 rounded-md" />
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">No Data</span>
              <p className="text-[9px] text-slate-500 font-bold uppercase">No logs for this date</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}