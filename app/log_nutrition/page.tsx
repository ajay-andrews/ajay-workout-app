'use client'
import { supabase } from '@/lib/supabase'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

export default function LogNutrition() {
  const [loading, setLoading] = useState(true)
  const [foods, setFoods] = useState<any[]>([])
  const [dailyLogs, setDailyLogs] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [quickCalories, setQuickCalories] = useState('')
  const [scalingFood, setScalingFood] = useState<any | null>(null)
  
  // Fix for Hydration: Store the formatted date in state
  const [formattedDate, setFormattedDate] = useState('')
  
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const target = 1800
  
  const totalConsumed = dailyLogs.reduce((acc, log) => {
    return acc + (log.calories_snapshot * (log.amount_consumed || 1))
  }, 0)

  useEffect(() => {
    // Set the date only after mounting to the client
    const display = new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric' 
    }).toUpperCase();
    setFormattedDate(display);
    
    fetchData()
  }, [])

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const today = new Date().toLocaleDateString('en-CA') 

    const [foodsRes, logsRes] = await Promise.all([
      supabase.from('foods').select('*').eq('user_id', user.id).order('name'),
      supabase.from('nutrition_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('log_date', today)
    ])

    if (foodsRes.data) setFoods(foodsRes.data)
    if (logsRes.data) setDailyLogs(logsRes.data)
    setLoading(false)
  }

  const logMeal = async (food: any, multiplier = 1) => {
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('nutrition_logs').insert({
      user_id: user?.id,
      food_id: food.id,
      food_name_snapshot: food.name,
      calories_snapshot: food.calories,
      unit_snapshot: food.serving_type,
      amount_consumed: multiplier,
      log_date: new Date().toLocaleDateString('en-CA')
    })
    
    if (error) console.error(error)
    setScalingFood(null)
    fetchData()
  }

  const deleteLog = async (id: string) => {
    await supabase.from('nutrition_logs').delete().eq('id', id)
    fetchData()
  }

  const quickAddCalories = async () => {
    if (!quickCalories) return
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('nutrition_logs').insert({
      user_id: user?.id,
      food_name_snapshot: 'Quick Add',
      calories_snapshot: parseFloat(quickCalories),
      unit_snapshot: 'num',
      amount_consumed: 1,
      log_date: new Date().toLocaleDateString('en-CA')
    })
    setQuickCalories('')
    fetchData()
  }

  const handlePressStart = (food: any) => {
    timerRef.current = setTimeout(() => {
      setScalingFood(food)
      timerRef.current = null
    }, 500)
  }

  const handlePressEnd = (food: any) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
      if (!scalingFood) logMeal(food, 1)
    }
  }

  const commonFoods = foods.filter(f => f.common === true)
  const filteredFoods = foods.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()))

  const FoodItem = ({ food }: { food: any }) => (
    <div className="relative flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl p-3">
      <div className="flex-1 min-w-0">
        <p className="text-[9px] font-black uppercase text-slate-500 truncate mb-0.5">
          {food.serving_amount} {food.serving_type}
        </p>
        <p className="font-bold text-xs uppercase truncate leading-tight">{food.name}</p>
        <p className="text-blue-500 font-black text-[10px] mt-0.5">{food.calories} kcal</p>
      </div>
      <button 
        onMouseDown={() => handlePressStart(food)}
        onMouseUp={() => handlePressEnd(food)}
        onTouchStart={() => handlePressStart(food)}
        onTouchEnd={() => handlePressEnd(food)}
        className="ml-3 w-9 h-9 bg-slate-800 rounded-lg flex items-center justify-center active:bg-blue-600 active:scale-90 transition-all select-none"
      >
        <span className="text-xl font-bold text-slate-200">+</span>
      </button>
    </div>
  )

  if (loading) return <div className="bg-black min-h-screen p-6 text-slate-500 font-black italic uppercase">Loading...</div>

  return (
    <div className="bg-black min-h-screen text-slate-100 p-6 font-sans pb-32">
      <div className="max-w-md mx-auto pt-4">
        
        {/* HEADER SECTION */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <Link href="/" className="text-blue-500 font-black text-[10px] uppercase tracking-widest">← Hub</Link>
            <h1 className="text-xl font-black italic uppercase tracking-tighter">Log Nutrition</h1>
            <div className="w-10" />
          </div>
          <div className="text-center">
            {/* Display the state-based formattedDate */}
            <p className="text-[10px] font-black text-slate-600 tracking-[0.2em] border-y border-slate-900/50 py-2">
              {formattedDate || 'LOADING DATE...'}
            </p>
          </div>
        </div>

        {/* 1. PROGRESS BAR */}
        <div className="mb-10 text-center">
          <h2 className="text-5xl font-black italic uppercase tracking-tighter mb-4">
            {Math.round(totalConsumed)} <span className="text-xl text-slate-600">/ {target}</span>
          </h2>
          <div className="flex gap-1 h-4 w-full px-1">
            {[...Array(10)].map((_, i) => (
              <div 
                key={i} 
                className={`flex-1 rounded-sm transition-colors duration-500 ${
                  totalConsumed >= (i + 1) * (target/10) ? 'bg-blue-600' : 'bg-slate-900'
                }`} 
              />
            ))}
          </div>
          {totalConsumed > target && (
            <p className="text-orange-500 font-black text-[10px] mt-3 italic uppercase tracking-widest animate-pulse">
              Surplus: {Math.round(totalConsumed - target)} kcal
            </p>
          )}
        </div>

        {/* 2. QUICK LOG FAVORITES */}
        <div className="mb-8">
          <label className="text-[10px] font-black uppercase text-slate-500 mb-3 block tracking-widest ml-1">Common Foods</label>
          <div className="grid grid-cols-2 gap-2">
            {commonFoods.map(food => <FoodItem key={food.id} food={food} />)}
          </div>
        </div>

        {/* 3. SEARCH & UNLISTED CALORIES */}
        <div className="mb-10 space-y-2">
          <label className="text-[10px] font-black uppercase text-slate-500 mb-1 block tracking-widest ml-1">Search Library</label>
          <div className="relative">
            <input 
              type="text"
              placeholder="E.G. CHICKEN CURRY..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 font-bold text-xs focus:border-blue-500 outline-none uppercase placeholder:text-slate-700"
            />
            {searchQuery && (
              <div className="absolute w-full mt-2 space-y-2 max-h-64 overflow-y-auto z-40 bg-black/90 backdrop-blur-md p-2 rounded-xl border border-slate-800 shadow-2xl">
                {filteredFoods.map(food => <FoodItem key={food.id} food={food} />)}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <input 
              type="number"
              placeholder="UNLISTED CALORIES..."
              value={quickCalories}
              onChange={(e) => setQuickCalories(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 font-bold text-xs outline-none placeholder:text-slate-700"
            />
            <button 
              onClick={quickAddCalories} 
              className="bg-white text-black w-12 rounded-xl font-black text-xl hover:bg-blue-500 hover:text-white transition-colors"
            >
              +
            </button>
          </div>
        </div>

        {/* 4. TODAY'S RUNNING LIST */}
        <div className="border-t border-slate-900 pt-6">
          <label className="text-[10px] font-black uppercase text-slate-600 mb-4 block tracking-widest">Today's Intake</label>
          <div className="space-y-2">
            {dailyLogs.length === 0 ? (
              <p className="text-[10px] text-slate-700 uppercase italic font-bold text-center py-4">No entries yet</p>
            ) : (
              dailyLogs.map(log => (
                <div key={log.id} className="flex items-center justify-between bg-slate-900/30 p-3 rounded-xl border border-slate-900/50 group">
                  <div className="min-w-0">
                    <p className="font-bold text-[11px] uppercase truncate text-slate-300">{log.food_name_snapshot}</p>
                    <p className="text-[9px] text-slate-500 font-black uppercase">
                      {log.amount_consumed}x • {Math.round(log.calories_snapshot * log.amount_consumed)} kcal
                    </p>
                  </div>
                  <button 
                    onClick={() => deleteLog(log.id)} 
                    className="text-slate-700 hover:text-red-500 font-black px-2 text-xl transition-colors"
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* LONG PRESS SCALING MODAL */}
      {scalingFood && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-xs rounded-[2.5rem] p-8 text-center shadow-2xl">
            <h3 className="font-black italic uppercase text-2xl mb-1 tracking-tighter">{scalingFood.name}</h3>
            <p className="text-slate-500 text-[10px] uppercase font-black tracking-[0.2em] mb-8">Select Multiplier</p>
            
            <div className="grid grid-cols-2 gap-3">
              {[0.5, 1, 1.5, 2].map(multiplier => (
                <button 
                  key={multiplier}
                  onClick={() => logMeal(scalingFood, multiplier)}
                  className="bg-black border border-slate-800 py-5 rounded-2xl font-black text-blue-500 text-lg hover:border-blue-500 active:scale-95 transition-all"
                >
                  {multiplier}x
                </button>
              ))}
            </div>
            
            <button 
              onClick={() => setScalingFood(null)} 
              className="mt-8 text-slate-600 text-[10px] font-black uppercase tracking-[0.3em] hover:text-white"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}