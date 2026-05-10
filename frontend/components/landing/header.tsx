"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'

export function Header() {
  const pathname = usePathname()
  const isApp = pathname === '/scanner'
  
  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-6 md:px-12 py-4 bg-[#0c0a0f]/80 backdrop-blur-xl border-b border-white/5">
      <Link href="/">
        <div className="flex items-center gap-3 cursor-pointer">
          <Image src="/cypher-logo.svg" alt="Cypher Logo" width={32} height={32} className="w-8 h-8" />
          <span className="text-xl font-extrabold tracking-tighter text-white">CYPHER</span>
        </div>
      </Link>
      <div>
        <Link href={isApp ? '/' : '/scanner'}>
          <button className="btn-primary-custom px-6 py-2 rounded-lg text-sm font-semibold">
            <span>{isApp ? 'Back Home' : 'Launch App'}</span>
          </button>
        </Link>
      </div>
    </header>
  )
}
