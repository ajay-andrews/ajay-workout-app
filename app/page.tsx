import { createClient } from '@supabase/supabase-js'

export default async function WorkoutDashboard() {
  // Use these exact names - Vercel sets these automatically
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // This check will tell us exactly what is missing in the browser
  if (!supabaseUrl || !supabaseAnonKey) {
    return (
      <div className="p-20">
        <h1 className="text-red-500 font-bold">Configuration Error</h1>
        <p>Your keys are missing. Try running <b>vercel env pull .env.local</b> again.</p>
      </div>
    )
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  const { data: exercises } = await supabase.from('exercises').select('*')

  return (
    <main className="p-10 font-sans">
      <h1 className="text-2xl font-bold mb-6">Master Exercise List</h1>
      <div className="space-y-2">
        {exercises?.map((ex) => (
          <div key={ex.id} className="p-3 border rounded">
            {ex.name} <span className="text-gray-400">— {ex.category}</span>
          </div>
        ))}
      </div>
    </main>
  )
}