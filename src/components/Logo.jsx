import { ShieldCheck } from 'lucide-react'
export default function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 grid place-items-center shadow-lg shadow-blue-600/30">
        <ShieldCheck className="h-5 w-5 text-white" />
      </div>
      <span className="font-bold tracking-tight text-lg">Smart Verify</span>
    </div>
  )
}
