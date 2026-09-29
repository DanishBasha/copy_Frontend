import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  LogOut
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { activeRole, student, setActiveView, currentUser, requestSignOut } = useApp();

  const roleBadgeMap: Record<string, string> = {
    'PLATFORM_OWNER': '🐉🔥 Platform Owner',
    'SUPER_ADMIN': '👑 Super Administrator',
    'PROGRAM_ADMIN': '🏢 Program Administrator',
    'FACULTY_MENTOR': '👨‍🏫 Faculty Mentor',
    'TRAINER': '💼 Domain Trainer',
    'PLACEMENT_COORDINATOR': '📊 Placement Coordinator',
    'STUDENT': '🎓 Student'
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-neutral-200/80 w-full">
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="flex items-center justify-between h-16 gap-3">
          
          <div className="flex items-center space-x-3 shrink-0">
            <div 
              onClick={() => setActiveView('DASHBOARD')}
              className="flex items-center space-x-2.5 cursor-pointer group"
              title="Return to Dashboard"
            >
              <div className="w-9 h-9 flex items-center justify-center shrink-0">
                <img src="/logo.png" alt="PC Logo" className="w-full h-full object-contain" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center space-x-1.5">
                  <span className="text-sm font-bold tracking-tight text-neutral-900">READINESS</span>
                  <span className="px-1.5 py-0.2 text-[10px] font-semibold bg-neutral-100 text-neutral-600 rounded border border-neutral-200 font-mono">
                    {currentUser?.collegeName ? currentUser.collegeName.split(' ')[0] : (activeRole === 'PLATFORM_OWNER' ? 'SAAS' : 'COLLEGE')}
                  </span>
                </div>
                <span className="text-[11px] text-neutral-500 hidden sm:inline">Placement Communication Suite</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3">
            
            {activeRole === 'STUDENT' && (
              <div className="hidden sm:flex items-center space-x-2 bg-neutral-50 border border-neutral-200/80 px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-xs font-medium text-neutral-700">
                  {(currentUser?.isIndependent || student?.isIndependent) ? '🎯 Independent Candidate' : (student?.track || 'General Track')}
                </span>
              </div>
            )}

            <div className="flex items-center space-x-2">
              <span className={`px-2.5 py-1 text-xs font-semibold rounded-lg border flex items-center space-x-1.5 ${
                activeRole === 'PLATFORM_OWNER'
                  ? 'bg-neutral-950 text-amber-300 border-neutral-800 shadow-2xs font-bold'
                  : activeRole === 'SUPER_ADMIN'
                  ? 'bg-amber-50 text-amber-900 border-amber-200'
                  : activeRole === 'PROGRAM_ADMIN'
                  ? 'bg-blue-50 text-blue-900 border-blue-200'
                  : activeRole === 'FACULTY_MENTOR'
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                  : activeRole === 'TRAINER'
                  ? 'bg-purple-50 text-purple-900 border-purple-200'
                  : 'bg-neutral-100 text-neutral-800 border-neutral-200'
              }`}>
                <span>{roleBadgeMap[activeRole] || activeRole}</span>
              </span>
            </div>

            {/* User Profile trigger via avatar and name near logout button */}
            <div className="flex items-center space-x-2 pl-2 border-l border-neutral-200 ml-0.5">
              <button
                type="button"
                onClick={() => setActiveView('PROFILE')}
                className="w-8 h-8 rounded-full bg-neutral-900 hover:bg-black text-white flex items-center justify-center text-xs font-semibold shadow-xs cursor-pointer transition-transform hover:scale-105"
                title="View Profile"
              >
                {(currentUser?.name || student?.name || 'Platform Owner').split(' ').map((n: string) => n[0]).slice(0, 2).join('')}
              </button>
              
              <div 
                onClick={() => setActiveView('PROFILE')} 
                className="hidden xl:block text-left text-xs leading-tight cursor-pointer group"
                title="View Profile"
              >
                <p className="font-semibold text-neutral-900 truncate max-w-[130px] group-hover:text-blue-600 transition-colors">
                  {currentUser?.name || student?.name || 'Platform Owner'}
                </p>
                <p className="text-[10px] text-neutral-500 font-mono truncate max-w-[130px]">
                  {currentUser?.email || activeRole}
                </p>
              </div>

              <button
                type="button"
                onClick={requestSignOut}
                title="Sign Out"
                className="p-2 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

          </div>

        </div>
      </div>
    </header>
  );
};
