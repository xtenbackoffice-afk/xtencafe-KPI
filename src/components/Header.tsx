import React from 'react';
import { Lock, Unlock, SlidersHorizontal } from 'lucide-react';

export type ActiveTab = 'branch_select' | 'employee_workspace' | 'manager_dashboard';

interface HeaderProps {
  activeTab: ActiveTab;
  selectedBranchName: string | null;
  isManagerAuthenticated: boolean;
  onSelectTab: (tab: ActiveTab) => void;
  onOpenManagerLogin: () => void;
  onLogoutManager: () => void;
  onOpenCustomizer: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  isManagerAuthenticated,
  onSelectTab,
  onOpenManagerLogin,
  onLogoutManager,
  onOpenCustomizer,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Single text element wordmark */}
        <button
          type="button"
          onClick={() => onSelectTab('branch_select')}
          className="text-lg font-bold tracking-tight text-slate-900 hover:text-slate-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer text-left"
        >
          KPI
        </button>

        {/* Zone 2: Clean text navigation links */}
        <nav className="flex items-center gap-5 sm:gap-7 text-sm font-medium text-slate-600 overflow-x-auto py-1">
          <button
            type="button"
            onClick={() => onSelectTab('branch_select')}
            className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer pb-0.5 ${
              activeTab === 'branch_select'
                ? 'text-slate-900 font-semibold border-b-2 border-slate-900'
                : 'hover:text-slate-900'
            }`}
          >
            เลือกสาขา
          </button>

          <button
            type="button"
            onClick={onOpenCustomizer}
            className="hidden sm:inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>สร้าง / แก้ไขคำถาม</span>
          </button>

          {isManagerAuthenticated && (
            <button
              type="button"
              onClick={() => onSelectTab('manager_dashboard')}
              className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer pb-0.5 ${
                activeTab === 'manager_dashboard'
                  ? 'text-slate-900 font-semibold border-b-2 border-slate-900'
                  : 'hover:text-slate-900'
              }`}
            >
              หน้าสำหรับผู้จัดการ
            </button>
          )}
        </nav>

        {/* Zone 3: 1-2 primary actions */}
        <div className="flex items-center gap-2.5 shrink-0">
          {isManagerAuthenticated ? (
            <div className="flex items-center gap-2">
              {activeTab !== 'manager_dashboard' && (
                <button
                  type="button"
                  onClick={() => onSelectTab('manager_dashboard')}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                >
                  หน้าสำหรับผู้จัดการ
                </button>
              )}
              <button
                type="button"
                onClick={onLogoutManager}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
              >
                <Unlock className="w-3.5 h-3.5" />
                <span>ล็อกหน้าผู้จัดการ</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenManagerLogin}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>หน้าสำหรับผู้ตรวจสอบ</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
