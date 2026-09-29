import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  ArrowLeft, 
  User, 
  Mail, 
  ShieldCheck, 
  Key, 
  Building2, 
  Calendar, 
  CheckCircle2, 
  LogOut, 
  Lock,
  Layers,
  Sparkles
} from 'lucide-react';

export const UserProfilePage: React.FC = () => {
  const { currentUser, student, activeRole, setActiveView, requestSignOut } = useApp();

  const displayName = currentUser?.name || student?.name || 'Platform Administrator';
  const displayEmail = currentUser?.email || student?.email || 'owner@readiness.edu';
  const initials = displayName.split(' ').map((n: string) => n[0]).slice(0, 2).join('');

  const isPlatformOwner = activeRole === 'PLATFORM_OWNER';

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 py-8 space-y-8 animate-in fade-in duration-200">
      
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setActiveView('DASHBOARD')}
          className="flex items-center space-x-2 text-xs font-semibold text-neutral-600 hover:text-neutral-900 transition-colors bg-white hover:bg-neutral-50 px-3.5 py-2 rounded-xl border border-neutral-200/90 shadow-2xs group cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-neutral-500 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to {isPlatformOwner ? 'Control Plane' : 'Dashboard'}</span>
        </button>

        <span className="px-3 py-1 text-xs font-mono font-medium bg-neutral-100 text-neutral-600 rounded-lg border border-neutral-200">
          PROFILE · {activeRole}
        </span>
      </div>

      {/* Main Profile Card */}
      <div className="bg-white border border-neutral-200/90 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-neutral-100">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-2xl bg-neutral-950 text-white flex items-center justify-center text-xl font-bold shadow-md relative overflow-hidden group">
              <span className="relative z-10">{initials}</span>
              {isPlatformOwner && (
                <div className="absolute inset-0 bg-gradient-to-tr from-amber-600/30 to-red-600/30" />
              )}
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">
                  {displayName}
                </h1>
                {isPlatformOwner ? (
                  <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-neutral-900 text-amber-300 border border-neutral-800 shadow-xs">
                    <span className="text-base leading-none">🐉🔥</span>
                    <span>Platform Owner</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-neutral-100 text-neutral-800 border border-neutral-200">
                    {activeRole.replace(/_/g, ' ')}
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-500 font-mono">
                {displayEmail}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={requestSignOut}
              className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold transition-colors flex items-center space-x-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Detailed Profile Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          
          <div className="bg-neutral-50/70 border border-neutral-200/80 rounded-xl p-4.5 space-y-2">
            <div className="flex items-center space-x-2 text-neutral-500 text-xs font-medium">
              <User className="w-4 h-4 text-neutral-400" />
              <span>Account Identity</span>
            </div>
            <p className="text-sm font-semibold text-neutral-900">{displayName}</p>
            <p className="text-[11px] text-neutral-500 font-mono">ID: {currentUser?.id || 'usr-master-001'}</p>
          </div>

          <div className="bg-neutral-50/70 border border-neutral-200/80 rounded-xl p-4.5 space-y-2">
            <div className="flex items-center space-x-2 text-neutral-500 text-xs font-medium">
              <Mail className="w-4 h-4 text-neutral-400" />
              <span>Primary Email</span>
            </div>
            <p className="text-sm font-semibold text-neutral-900 font-mono truncate">{displayEmail}</p>
            <span className="inline-flex items-center text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-medium">
              <CheckCircle2 className="w-3 h-3 mr-1" /> Verified Contact
            </span>
          </div>

          <div className="bg-neutral-50/70 border border-neutral-200/80 rounded-xl p-4.5 space-y-2">
            <div className="flex items-center space-x-2 text-neutral-500 text-xs font-medium">
              <Building2 className="w-4 h-4 text-neutral-400" />
              <span>Institutional Jurisdiction</span>
            </div>
            <p className="text-sm font-semibold text-neutral-900">
              {isPlatformOwner ? 'Global Multi-Tenant SaaS' : (currentUser?.collegeName || 'Autonomous Campus')}
            </p>
            <p className="text-[11px] text-neutral-500">
              {isPlatformOwner ? 'All registered colleges & cloud tenants' : 'Campus Placement Cell'}
            </p>
          </div>

          <div className="bg-neutral-50/70 border border-neutral-200/80 rounded-xl p-4.5 space-y-2">
            <div className="flex items-center space-x-2 text-neutral-500 text-xs font-medium">
              <ShieldCheck className="w-4 h-4 text-neutral-400" />
              <span>Platform Role &amp; Tier</span>
            </div>
            <p className="text-sm font-semibold text-neutral-900">
              {isPlatformOwner ? '🐉 Master Platform Owner' : activeRole.replace(/_/g, ' ')}
            </p>
            <p className="text-[11px] text-neutral-500">Tier: Enterprise Multi-Tenant Master</p>
          </div>

          <div className="bg-neutral-50/70 border border-neutral-200/80 rounded-xl p-4.5 space-y-2">
            <div className="flex items-center space-x-2 text-neutral-500 text-xs font-medium">
              <Lock className="w-4 h-4 text-neutral-400" />
              <span>Security &amp; Auth State</span>
            </div>
            <p className="text-sm font-semibold text-emerald-700 flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Secure Session Active</span>
            </p>
            <p className="text-[11px] text-neutral-500 font-mono">TLS 1.3 · Token Verified</p>
          </div>

          <div className="bg-neutral-50/70 border border-neutral-200/80 rounded-xl p-4.5 space-y-2">
            <div className="flex items-center space-x-2 text-neutral-500 text-xs font-medium">
              <Calendar className="w-4 h-4 text-neutral-400" />
              <span>Account Status</span>
            </div>
            <p className="text-sm font-semibold text-neutral-900">Permanent System Administrator</p>
            <p className="text-[11px] text-neutral-500 font-mono">Active</p>
          </div>

        </div>

        {/* Master Privileges & Governance Section */}
        <div className="pt-4 border-t border-neutral-100 space-y-3">
          <div className="flex items-center space-x-2 text-xs font-semibold text-neutral-900 uppercase tracking-wider font-mono">
            <Key className="w-4 h-4 text-neutral-500" />
            <span>Authorized System Privileges</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {(isPlatformOwner ? [
              'Onboard & Provision Institutional Colleges',
              'Dispatch Super Admin Activation Invites',
              'Delete & De-provision Colleges with Password Verification',
              'Monitor Multi-Tenant Student Enrolment',
              'Audit LLM & Token Telemetry Usage Across Tenants',
              'Master Platform Security Governance'
            ] : [
              'Access Assigned Readiness Assessment Workspace',
              'View Departmental Diagnostic Reports',
              'Track Practice Drills & Readiness Progression'
            ]).map((perm, idx) => (
              <div key={idx} className="p-3 bg-neutral-50 rounded-xl border border-neutral-200/60 text-xs flex items-center space-x-2.5 text-neutral-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-medium">{perm}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
