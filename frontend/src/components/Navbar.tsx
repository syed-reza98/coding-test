'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Bell, ShieldAlert } from 'lucide-react';

interface NavbarProps {
  title: string;
  subtitle?: string;
}

export const Navbar = ({ title, subtitle }: NavbarProps) => {
  const { user } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0">
      <div>
        <h2 className="text-xl font-bold text-slate-900 leading-none">{title}</h2>
        {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        {user?.role === 'staff' && (
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
            <span>Staff Permissions (Delete restricted to Admins)</span>
          </div>
        )}

        <div className="text-right">
          <p className="text-xs font-semibold text-slate-800">{user?.email}</p>
          <p className="text-[11px] text-slate-400 capitalize">{user?.role} Account</p>
        </div>
      </div>
    </header>
  );
};
