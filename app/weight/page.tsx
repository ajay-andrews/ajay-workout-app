'use client'
import { supabase } from '@/lib/supabase'
import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer 
} from 'recharts'

function WeightPageContent() {
  const searchParams = useSearchParams()
  const targetDateParam = searchParams.get('date')

  const [loading, setLoading] = useState(true)
  const [logs, setLogs] = useState<any[]>([])
  const [allLogs, setAllLogs] = useState<any[]>([])
  const [unit, setUnit] = useState<'kg' | 'lb'>('kg')
  const [range, setRange] = useState<'7D' | '30D' | '6M'>('7D')
  const [activeTab, setActiveTab] = useState<'chart' | 'stats'>('chart')
  const [inputWeight, setInputWeight] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const TARGET_KG = 69
  const TARGET_LB = 69 * 2.20462

  useEffect(() => {
    fetchWeightLogs()
  }, [])

  const fetchWeightLogs = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('weight_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('log_date', { ascending: true })

    if (!error && data) {
      setAllLogs(data)
      setLogs(data)
    }
    setLoading(false)
  }

  const saveWeight = async () => {
    if (!inputWeight) return
    setIsSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const weightVal = parseFloat(inputWeight)
    const logDateTarget = targetDateParam || new Date().toISOString().split('T')[0]

    const { error } = await supabase
      .from('weight_logs')
      .upsert({
        user_id: user.id,
        weight: weightVal,
        unit: unit,
        log_date: logDateTarget
      }, { onConflict: 'user_id, log_date' })

    if (!error) {
      setInputWeight('')
      fetchWeightLogs()
    }
    setIsSaving(false)
  }

  const convertToDisplay = (weight: number, logUnit: 'kg' | 'lb') => {
    if (unit === 'lb' && logUnit === 'kg') return weight * 2.20462
    if (unit === 'kg' && logUnit === 'lb') return weight / 2.20462
    return weight
  }

  const getFilteredChartLogs = () => {
    let dateLimit = new Date()
    if (range === '7D') dateLimit.setDate(dateLimit.getDate() - 7)
    else if (range === '30D') dateLimit.setDate(dateLimit.getDate() - 30)
    else if (range === '6M') dateLimit.setMonth(dateLimit.getMonth() - 6)

    const limitString = dateLimit.toISOString().split('T')[0]
    return allLogs.filter(log => log.log_date >= limitString)
  }

  const chartLogs = getFilteredChartLogs()
  const convertedAllValues = allLogs.map(l => convertToDisplay(l.weight, l.unit))

  const getStats = () => {
    if (convertedAllValues.length === 0) {
      return { 
        avgWeight: 0, weeklyLoss: 0, net: 0, whatsLeft: 0,
        estM1: 'N/A', estM2: 'N/A', estM3: 'N/A'
      }
    }
    
    const first = convertedAllValues[0]
    const latest = convertedAllValues[convertedAllValues.length - 1]
    const net = latest - first

    // 1. 7-Day Moving Average
    const recentEntries = convertedAllValues.slice(-7)
    const avgWeight = recentEntries.reduce((a, b) => a + b, 0) / recentEntries.length

    // 2. Weekly Weight Loss (Pace calculation based on full timeline)
    let weeklyLoss = 0
    if (allLogs.length > 1) {
      const d1 = new Date(allLogs[0].log_date)
      const d2 = new Date(allLogs[allLogs.length - 1].log_date)
      const weeksDiff = (d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24 * 7)
      weeklyLoss = weeksDiff > 0 ? (net / weeksDiff) : 0
    }

    // 3. What's Left
    const targetMilestone = unit === 'lb' ? TARGET_LB : TARGET_KG
    const whatsLeft = latest - targetMilestone

    // 4. Milestone Projections (74k, 72k, 69k or their lb equivalents)
    const milestones = unit === 'lb' 
      ? [74 * 2.20462, 72 * 2.20462, 69 * 2.20462] 
      : [74, 72, 69]

    const calculateEstDate = (targetValue: number) => {
      if (avgWeight <= targetValue) return 'HIT'
      // If weeklyLoss is positive or zero, it means trend is flat or gaining weight
      if (weeklyLoss >= 0) return '—' 
      
      const remaining = avgWeight - targetValue
      const weeksNeeded = remaining / Math.abs(weeklyLoss)
      const daysNeeded = Math.ceil(weeksNeeded * 7)
      
      const estDate = new Date()
      estDate.setDate(estDate.getDate() + daysNeeded)
      return estDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }

    return {
      avgWeight,
      weeklyLoss,
      net,
      whatsLeft,
      estM1: calculateEstDate(milestones[0]),
      estM2: calculateEstDate(milestones[1]),
      estM3: calculateEstDate(milestones[2])
    }
  }

  const stats = getStats()

  const chartData = chartLogs.map(log => ({
    date: new Date(log.log_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    value: parseFloat(convertToDisplay(log.weight, log.unit).toFixed(1))
  }))

  return (
    <div className="bg-black min-h-screen w-full flex justify-center p-4 sm:p-6 font-sans text-slate-100">
      <div className="w-full max-w-md flex flex-col pt-4">
        
        {/* Navigation */}
        <div className="mb-8">
          <Link href="/workout_history" className="text-blue-500 font-black text-[10px] uppercase tracking-widest hover:text-blue-400 inline-block">
            ← BACK TO HUB
          </Link>
        </div>

        <div className="flex justify-between items-end mb-6">
          <div>
            <h1 className="text-3xl font-black italic uppercase tracking-tighter">WEIGHT</h1>
            {targetDateParam && (
              <span className="text-[10px] font-mono font-black uppercase text-blue-500 tracking-wider block mt-1">
                Targeting: {targetDateParam}
              </span>
            )}
          </div>
          
          {/* Unit Switcher */}
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

        {/* CONTAINER DISPLAY PANEL CARD */}
        <div className="bg-slate-900/10 border border-slate-900 rounded-[2rem] p-6 mb-6 h-80 shadow-2xl relative flex flex-col justify-end">
          
          {/* ACTION CONTROLS ROW */}
          <div className="absolute top-4 left-6 right-6 flex justify-between items-center z-10">
            <div className="flex bg-black/60 rounded-lg p-0.5 border border-slate-900">
              {(['chart', 'stats'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveTab(t)}
                  className={`text-[8px] font-black uppercase tracking-wider px-2 py-1 rounded transition-all ${activeTab === t ? 'bg-blue-600 text-white' : 'text-slate-500'}`}
                >
                  {t}
                </button>
              ))}
            </div>

            {activeTab === 'chart' && (
              <div className="flex gap-1 animate-in fade-in duration-100">
                {(['7D', '30D', '6M'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setRange(r)}
                    className={`text-[8px] font-black px-2 py-1 rounded border ${range === r ? 'border-blue-500 text-blue-500 bg-blue-950/10' : 'border-slate-900 text-slate-600'}`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            )}
          </div>

          {activeTab === 'chart' ? (
            /* CHART VIEW */
            <div className="w-full h-[75%]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="date" stroke="#475569" fontSize={8} tickLine={false} axisLine={false} minTickGap={20} />
                  <YAxis hide domain={['dataMin - 2', 'dataMax + 2']} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', fontSize: '10px', fontWeight: '900' }}
                    itemStyle={{ color: '#3b82f6' }}
                  />
                  <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={4} dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }} activeDot={{ r: 6, strokeWidth: 0 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            /* SINGLE COLUMN STATS VIEW WITH PROJECTIONS COLLAPSED UNDER WHAT'S LEFT */
            <div className="w-full h-[82%] flex flex-col justify-between pt-6 pr-2 overflow-y-auto custom-scrollbar">
              <div className="flex justify-between items-center border-b border-slate-900/40 pb-1.5">
                <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider">7-Day Avg Weight</span>
                <span className="text-sm font-black italic tracking-tight text-slate-200">
                  {stats.avgWeight.toFixed(1)} <span className="text-[9px] uppercase not-italic font-bold text-slate-500">{unit}</span>
                </span>
              </div>
              
              <div className="flex justify-between items-center border-b border-slate-900/40 pb-1.5">
                <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider">Weekly Weight Loss</span>
                <span className={`text-sm font-black italic tracking-tight ${stats.weeklyLoss < 0 ? 'text-emerald-500' : stats.weeklyLoss > 0 ? 'text-blue-500' : 'text-slate-400'}`}>
                  {stats.weeklyLoss < 0 ? `-${Math.abs(stats.weeklyLoss).toFixed(1)}` : stats.weeklyLoss > 0 ? `+${stats.weeklyLoss.toFixed(1)}` : '0.0'}{' '}
                  <span className="text-[9px] uppercase not-italic font-bold text-slate-500">{unit}/wk</span>
                </span>
              </div>

              <div className="flex justify-between items-center border-b border-slate-900/40 pb-1.5">
                <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider">Net Progress</span>
                <span className={`text-sm font-black italic tracking-tight ${stats.net < 0 ? 'text-emerald-500' : stats.net > 0 ? 'text-blue-500' : 'text-slate-400'}`}>
                  {stats.net > 0 ? `+${stats.net.toFixed(1)}` : stats.net.toFixed(1)} <span className="text-[9px] uppercase not-italic font-bold text-slate-500">{unit}</span>
                </span>
              </div>

              <div className="flex justify-between items-start pt-0.5">
                <div className="flex flex-col">
                  <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider">
                    What's Left (Goal {unit === 'lb' ? '152.1lb' : '69kg'})
                  </span>
                  {/* Milestone projection text strings render elegantly right here underneath */}
                  <span className="text-[8px] font-black tracking-tight text-slate-600 block mt-1 leading-none">
                    PROJECTIONS — {unit === 'lb' ? '163lb' : '74kg'}: <span className="text-blue-500 font-mono text-[9px] mr-2">{stats.estM1}</span> 
                    {unit === 'lb' ? '159lb' : '72kg'}: <span className="text-blue-500 font-mono text-[9px] mr-2">{stats.estM2}</span> 
                    {unit === 'lb' ? '152lb' : '69kg'}: <span className="text-blue-500 font-mono text-[9px]">{stats.estM3}</span>
                  </span>
                </div>
                <span className={`text-sm font-black italic tracking-tight ${stats.whatsLeft <= 0 ? 'text-emerald-400' : 'text-blue-500'}`}>
                  {stats.whatsLeft <= 0 ? 'HIT' : `${stats.whatsLeft.toFixed(1)} ${unit}`}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Input Block */}
        <div className="bg-slate-900/40 border border-slate-900 p-8 rounded-[2.5rem] space-y-6">
          <div className="text-center">
            <label className="text-[10px] font-black uppercase text-slate-600 mb-2 block tracking-widest">
              {targetDateParam ? `LOG WEIGHT FOR ${targetDateParam}` : "LOG TODAY'S WEIGHT"} ({unit})
            </label>
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

export default function WeightPage() {
  return (
    <Suspense fallback={
      <div className="bg-black min-h-screen p-6 text-slate-500 font-black italic uppercase flex items-center justify-center">
        Loading Metrics Archive...
      </div>
    }>
      <WeightPageContent />
    </Suspense>
  )
}