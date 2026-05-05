'use client'
import { supabase } from '@/lib/supabase'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, ReferenceLine 
} from 'recharts'

export default function WeightPage() {
  const [loading, setLoading] = useState(true)
  const [logs, setLogs] = useState<any[]>([])
  const [unit, setUnit] = useState<'kg' | 'lb'>('kg')
  const [range, setRange] = useState<'7D' | '30D' | '6M'>('7D')
  const [inputWeight, setInputWeight] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    fetchWeightLogs()
  }, [range])

  const fetchWeightLogs = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    let dateLimit = new Date()
    if (range === '7D') dateLimit.setDate(dateLimit.getDate() - 7)
    else if (range === '30D') dateLimit.setDate(dateLimit.getDate() - 30)
    else if (range === '6M') dateLimit.setMonth(dateLimit.getMonth() - 6)

    const { data, error } = await supabase
      .from('weight_logs')
      .select('*')
      .eq('user_id', user.id)
      .gte('log_date', dateLimit.toISOString().split('T')[0])
      .order('log_date', { ascending: true })

    if (!error && data) setLogs(data)
    setLoading(false)
  }

  const saveWeight = async () => {
    if (!inputWeight) return
    setIsSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const weightVal = parseFloat(inputWeight)
    const today = new Date().toISOString().split('T')[0]

    // UPSERT handles the "overwrite" logic automatically based on the unique constraint
    const { error } = await supabase
      .from('weight_logs')
      .upsert({
        user_id: user.id,
        weight: weightVal,
        unit: unit,
        log_date: today
      }, { onConflict: 'user_id, log_date' })

    if (!error) {
      setInputWeight('')
      fetchWeightLogs()
    }
    setIsSaving(false)
  }

  // Convert data for the chart based on selected unit
  const chartData = logs.map(log => {
    let displayWeight = log.weight
    if (unit === 'lb' && log.unit === 'kg') displayWeight = log.weight * 2.20462
    if (unit === 'kg' && log.unit === 'lb') displayWeight = log.weight / 2.20462
    
    return {
      date: new Date(log.log_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: parseFloat(displayWeight.toFixed(1))
    }
  })

  return (
    <div className="bg-black min-h-screen w-full flex justify-center p-4 sm:p-6 font-sans text-slate-100">
      <div className="w-full max-w-md flex flex-col pt-4">
        
        {/* Nav */}
        <div className="mb-8">
          <Link href="/" className="text-blue-500 font-black text-[10px] uppercase tracking-widest hover:text-blue-400 inline-block">
            ← Back to Hub
          </Link>
        </div>

        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-3xl font-black italic uppercase tracking-tighter">Weight</h1>
          </div>
          
          {/* Unit Toggle */}
          <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-800">
            {(['kg', 'lb'] as const).map((u) => (
              <button
                key={u}
                onClick={() => setUnit(u)}
                className={`px-3 py-1 rounded text-[10px] font-black uppercase transition-all ${unit === u ? 'bg-blue-600 text-white' : 'text-slate-500'}`}
              >
                {u}
              </button>
            ))}
          </div>
        </div>

        {/* Chart Zone */}
        <div className="bg-slate-900/30 border border-slate-800 p-4 rounded-[2rem] mb-6 h-64 shadow-2xl relative">
          <div className="absolute top-4 right-6 flex gap-2 z-10">
            {(['7D', '30D', '6M'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`text-[8px] font-black px-2 py-1 rounded border ${range === r ? 'border-blue-500 text-blue-500' : 'border-slate-800 text-slate-600'}`}
              >
                {r}
              </button>
            ))}
          </div>
          
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis 
                dataKey="date" 
                stroke="#475569" 
                fontSize={8} 
                tickLine={false} 
                axisLine={false}
                minTickGap={20}
              />
              <YAxis 
                hide 
                domain={['dataMin - 2', 'dataMax + 2']} 
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', fontSize: '10px', fontWeight: '900' }}
                itemStyle={{ color: '#3b82f6' }}
              />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#3b82f6" 
                strokeWidth={4} 
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }} 
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Entry Zone */}
        <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-[2.5rem] space-y-6">
          <div className="text-center">
            <label className="text-[10px] font-black uppercase text-slate-600 mb-2 block tracking-widest">Log Today's Weight ({unit})</label>
            <div className="relative inline-block w-full">
              <input 
                type="number" 
                step="0.1"
                value={inputWeight}
                onChange={(e) => setInputWeight(e.target.value)}
                placeholder="00.0"
                className="bg-transparent text-7xl font-black text-center outline-none text-blue-500 w-full placeholder:opacity-10"
              />
            </div>
          </div>

          <button 
            onClick={saveWeight}
            disabled={isSaving || !inputWeight}
            className="w-full bg-white text-black font-black py-6 rounded-[2rem] uppercase italic text-2xl tracking-tighter shadow-2xl active:scale-95 transition-all disabled:opacity-30"
          >
            {isSaving ? 'Updating...' : 'Confirm Weight'}
          </button>
        </div>

      </div>
    </div>
  )
}