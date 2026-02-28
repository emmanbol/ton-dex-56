'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Navbar() {
  const pathname = usePathname();

  const linkClass = (path: string) =>
    `px-4 py-2 rounded-lg ${
      pathname === path
        ? 'bg-blue-500 text-white'
        : 'text-gray-600 hover:bg-gray-100'
    }`;

  return (
    <nav className="flex gap-3">
      <Link href="/swap" className={linkClass('/swap')}>Swap</Link>
      <Link href="/stake" className={linkClass('/stake')}>Stake</Link>
      <Link href="/pools" className={linkClass('/pools')}>Pools</Link>
    </nav>
  );
}