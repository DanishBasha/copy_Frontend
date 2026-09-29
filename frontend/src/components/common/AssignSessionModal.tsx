import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { LISTENING_PASSAGES } from '../../data/mockData';
import { InterviewAssignment, DynamicProgram } from '../../types';
import { 
  Mic, 
  Headphones, 
  X, 
  Calendar, 
  Clock, 
  AlertCircle,
  FileText,
  Sparkles,
  Layers,
  Building2,
  Globe,
  Check
} from 'lucide-react';
import { useBackHandler } from '../../hooks/useBackHandler';

export interface AssignSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (asg: InterviewAssignment) => void;
  defaultRole?: 'SUPER_ADMIN' | 'PLACEMENT_COORDINATOR' | 'PROGRAM_ADMIN' | 'FACULTY_MENTOR' | 'TRAINER';
  defaultTargetScope?: 'ALL_STUDENTS' | 'PROGRAM' | 'DEPARTMENT' | 'MY_MENTEES' | 'SPECIFIC_STUDENT';
  defaultProgramName?: string;
  defaultDepartment?: string;
  defaultDomain?: string;
  menteesList?: any[];
  studentsList?: any[];
}

export const AssignSessionModal: React.FC<AssignSessionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultRole,
  defaultTargetScope,
  defaultProgramName,
  defaultDepartment,
  defaultDomain,
}) => {
  useBackHandler(isOpen, onClose);

  const { currentUser, createAssignment } = useApp();
  const activeRole = defaultRole || (currentUser?.role as any) || 'SUPER_ADMIN';

  // 1. Session Type: Technical, Listening, or Both
  const [sessionType, setSessionType] = useState<'MOCK_INTERVIEW' | 'LISTENING_COMPREHENSION' | 'BOTH'>('MOCK_INTERVIEW');
  
  // 2. Title (No suggestions)
  const [title, setTitle] = useState('');

  // 3. Target Scope (Multi-select in Programs and Departments; Single Candidate removed)
  const initialScope = (defaultTargetScope === 'DEPARTMENT' || defaultDepartment) 
    ? 'DEPARTMENT' 
    : (defaultTargetScope === 'ALL_STUDENTS') 
    ? 'ALL_STUDENTS' 
    : 'PROGRAM';

  const [targetScope, setTargetScope] = useState<'ALL_STUDENTS' | 'PROGRAM' | 'DEPARTMENT'>(initialScope);

  const [programs, setPrograms] = useState<DynamicProgram[]>([]);
  const [selectedProgNames, setSelectedProgNames] = useState<string[]>([]);
  const [selectedSubProgram, setSelectedSubProgram] = useState('');

  const [selectedDepartments, setSelectedDepartments] = useState<string[]>(
    defaultDepartment ? [defaultDepartment] : ['Computer Science & Engineering']
  );

  // 4. Session Configuration
  // Mode: Custom Domain Topic VS Personal Resume-based
  const [interviewMode, setInterviewMode] = useState<'TOPIC' | 'RESUME_BASED'>('TOPIC');
  const [domainOrTopic, setDomainOrTopic] = useState(defaultDomain || 'Full Stack & Web Systems');
  const [difficulty, setDifficulty] = useState<'EASY' | 'MEDIUM' | 'ADVANCED' | 'FAANG'>('MEDIUM');
  const [listeningPassageId, setListeningPassageId] = useState(LISTENING_PASSAGES[0]?.id || 'pass-finpay');

  // 5. Schedule & Strict Timer Window
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  });
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('18:00');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ALL_DEPARTMENTS = [
    'Computer Science & Engineering',
    'Information Technology',
    'AI & Data Science',
    'Electronics & Communication',
    'Electrical & Electronics',
    'Mechanical Engineering'
  ];

  useEffect(() => {
    if (isOpen) {
      setError(null);
      if (defaultTargetScope === 'DEPARTMENT' || defaultTargetScope === 'ALL_STUDENTS' || defaultTargetScope === 'PROGRAM') {
        setTargetScope(defaultTargetScope);
      } else if (defaultDepartment) {
        setTargetScope('DEPARTMENT');
      } else if (defaultProgramName) {
        setTargetScope('PROGRAM');
      }

      if (defaultDepartment) {
        setSelectedDepartments([defaultDepartment]);
      }

      api.college.getPrograms(currentUser?.collegeId || 'col-1').then(progs => {
        if (progs && progs.length > 0) {
          setPrograms(progs);
          if (defaultProgramName) {
            setSelectedProgNames([defaultProgramName]);
          } else if (selectedProgNames.length === 0) {
            setSelectedProgNames([progs[0].name]);
          }
        }
      }).catch(() => {});
    }
  }, [isOpen, defaultTargetScope, defaultProgramName, defaultDepartment, currentUser?.collegeId]);

  if (!isOpen) return null;

  // Toggle Program multi-selection
  const toggleProgram = (progName: string) => {
    if (selectedProgNames.includes(progName)) {
      if (selectedProgNames.length > 1) {
        setSelectedProgNames(selectedProgNames.filter(p => p !== progName));
      }
    } else {
      setSelectedProgNames([...selectedProgNames, progName]);
    }
  };

  const selectAllPrograms = () => {
    if (selectedProgNames.length === programs.length) {
      setSelectedProgNames([programs[0]?.name || '']);
    } else {
      setSelectedProgNames(programs.map(p => p.name));
    }
  };

  // Toggle Department multi-selection
  const toggleDepartment = (dept: string) => {
    if (selectedDepartments.includes(dept)) {
      if (selectedDepartments.length > 1) {
        setSelectedDepartments(selectedDepartments.filter(d => d !== dept));
      }
    } else {
      setSelectedDepartments([...selectedDepartments, dept]);
    }
  };

  const selectAllDepartments = () => {
    if (selectedDepartments.length === ALL_DEPARTMENTS.length) {
      setSelectedDepartments([ALL_DEPARTMENTS[0]]);
    } else {
      setSelectedDepartments([...ALL_DEPARTMENTS]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please enter the assessment title.');
      return;
    }

    if (targetScope === 'PROGRAM' && selectedProgNames.length === 0) {
      setError('Please select at least one program.');
      return;
    }

    if (targetScope === 'DEPARTMENT' && selectedDepartments.length === 0) {
      setError('Please select at least one department.');
      return;
    }

    setSubmitting(true);
    setError(null);

    let targetDomainOrTrack = 'All Batches (2026)';
    if (targetScope === 'PROGRAM') {
      targetDomainOrTrack = selectedProgNames.length === 1 
        ? `${selectedProgNames[0]}${selectedSubProgram ? ` (${selectedSubProgram})` : ''}`
        : `${selectedProgNames.length} Programs Selected (${selectedProgNames.join(', ')})`;
    } else if (targetScope === 'DEPARTMENT') {
      targetDomainOrTrack = selectedDepartments.length === 1 
        ? selectedDepartments[0]
        : `${selectedDepartments.length} Depts (${selectedDepartments.join(', ')})`;
    }

    try {
      const created = await createAssignment({
        title: title.trim(),
        sessionType,
        assignedByRole: activeRole,
        assignedByName: currentUser?.name || 'Placement Cell Officer',
        assignedByEmail: currentUser?.email,
        assignedById: currentUser?.id,
        collegeId: currentUser?.collegeId || 'col-1',
        targetScope,
        targetDomainOrTrack,
        targetProgramName: targetScope === 'PROGRAM' ? selectedProgNames[0] : undefined,
        targetProgramNames: targetScope === 'PROGRAM' ? selectedProgNames : undefined,
        targetSubProgram: targetScope === 'PROGRAM' && selectedSubProgram ? selectedSubProgram : undefined,
        targetDepartment: targetScope === 'DEPARTMENT' ? selectedDepartments[0] : undefined,
        targetDepartments: targetScope === 'DEPARTMENT' ? selectedDepartments : undefined,
        interviewMode,
        domainOrTopic: interviewMode === 'RESUME_BASED' ? 'Personal Resume & Project Scrutiny' : domainOrTopic,
        difficulty,
        listeningPassageId: (sessionType === 'LISTENING_COMPREHENSION' || sessionType === 'BOTH') ? listeningPassageId : undefined,
        dueDate,
        startTime,
        endTime,
        hasTimeWindow: Boolean(startTime && endTime),
        isMandatory: true
      });

      if (onSuccess) {
        onSuccess(created);
      }
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to dispatch assessment.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white border border-neutral-200 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150 my-6">
        
        {/* Header */}
        <div className="p-6 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/70">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-neutral-900 text-white flex items-center justify-center shadow-xs">
              {sessionType === 'MOCK_INTERVIEW' ? (
                <Mic className="w-5 h-5 text-emerald-400" />
              ) : sessionType === 'LISTENING_COMPREHENSION' ? (
                <Headphones className="w-5 h-5 text-purple-400" />
              ) : (
                <Sparkles className="w-5 h-5 text-amber-400" />
              )}
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900">Assign Assessment / Practice Session</h2>
              <p className="text-xs text-neutral-500">
                Configure drill format, audience multi-select, resume or domain rubric, and active timer window
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="p-2 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs max-h-[78vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. Session Type Selection: Technical, Listening, or Both */}
          <div className="space-y-1.5">
            <label className="block font-semibold text-neutral-800 uppercase tracking-wider text-[10px]">
              1. Select Session Format *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              
              {/* Option 1: Technical Mock Interview */}
              <button
                type="button"
                onClick={() => setSessionType('MOCK_INTERVIEW')}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                  sessionType === 'MOCK_INTERVIEW'
                    ? 'border-neutral-900 bg-neutral-900 text-white shadow-xs'
                    : 'border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-900'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className={`w-7 h-7 rounded-xl flex items-center justify-center ${
                    sessionType === 'MOCK_INTERVIEW' ? 'bg-neutral-800 text-emerald-400' : 'bg-neutral-100 text-neutral-700'
                  }`}>
                    <Mic className="w-4 h-4" />
                  </div>
                  <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded-full ${
                    sessionType === 'MOCK_INTERVIEW' ? 'bg-neutral-800 text-emerald-300' : 'bg-neutral-100 text-neutral-600'
                  }`}>
                    VOICE AI
                  </span>
                </div>
                <div>
                  <h4 className="font-bold text-xs">Technical Mock Interview</h4>
                  <p className={`text-[10px] mt-0.5 leading-snug ${
                    sessionType === 'MOCK_INTERVIEW' ? 'text-neutral-300' : 'text-neutral-500'
                  }`}>
                    Verbal technical turns evaluating architecture and logic.
                  </p>
                </div>
              </button>

              {/* Option 2: Listening Comprehension */}
              <button
                type="button"
                onClick={() => setSessionType('LISTENING_COMPREHENSION')}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                  sessionType === 'LISTENING_COMPREHENSION'
                    ? 'border-purple-900 bg-purple-950 text-white shadow-xs'
                    : 'border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-900'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className={`w-7 h-7 rounded-xl flex items-center justify-center ${
                    sessionType === 'LISTENING_COMPREHENSION' ? 'bg-purple-900 text-purple-300' : 'bg-neutral-100 text-neutral-700'
                  }`}>
                    <Headphones className="w-4 h-4" />
                  </div>
                  <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded-full ${
                    sessionType === 'LISTENING_COMPREHENSION' ? 'bg-purple-900 text-purple-300' : 'bg-neutral-100 text-neutral-600'
                  }`}>
                    AUDIO ONLY
                  </span>
                </div>
                <div>
                  <h4 className="font-bold text-xs">Listening Comprehension</h4>
                  <p className={`text-[10px] mt-0.5 leading-snug ${
                    sessionType === 'LISTENING_COMPREHENSION' ? 'text-purple-200' : 'text-neutral-500'
                  }`}>
                    Auditory requirements retention without visual text.
                  </p>
                </div>
              </button>

              {/* Option 3: Both Sessions */}
              <button
                type="button"
                onClick={() => setSessionType('BOTH')}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                  sessionType === 'BOTH'
                    ? 'border-amber-900 bg-amber-950 text-white shadow-xs ring-1 ring-amber-400/50'
                    : 'border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-900'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className={`w-7 h-7 rounded-xl flex items-center justify-center ${
                    sessionType === 'BOTH' ? 'bg-amber-900 text-amber-300' : 'bg-neutral-100 text-neutral-700'
                  }`}>
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded-full ${
                    sessionType === 'BOTH' ? 'bg-amber-900 text-amber-200' : 'bg-amber-50 text-amber-800'
                  }`}>
                    BOTH DRILLS
                  </span>
                </div>
                <div>
                  <h4 className="font-bold text-xs">Both (Combined)</h4>
                  <p className={`text-[10px] mt-0.5 leading-snug ${
                    sessionType === 'BOTH' ? 'text-amber-200' : 'text-neutral-500'
                  }`}>
                    Both Technical Mock Interview and Listening Comprehension.
                  </p>
                </div>
              </button>

            </div>
          </div>

          {/* 2. Assessment Title (No suggestions) */}
          <div className="space-y-1.5">
            <label className="block font-semibold text-neutral-800 uppercase tracking-wider text-[10px]">
              2. Assessment Title *
            </label>
            <input
              type="text"
              required
              placeholder="Enter assessment title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3.5 py-2.5 text-neutral-900 text-xs focus:outline-none focus:border-neutral-900"
            />
          </div>

          {/* 3. Target Audience / Cohort (Multi-select enabled, single candidate removed) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block font-semibold text-neutral-800 uppercase tracking-wider text-[10px]">
                3. Target Audience / Cohort *
              </label>
              <span className="text-[10px] text-neutral-500">Multi-selection supported</span>
            </div>

            {/* Scope Selection Tabs */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setTargetScope('PROGRAM')}
                className={`p-2.5 rounded-xl border text-center font-medium transition-all cursor-pointer flex flex-col items-center justify-center space-y-1 ${
                  targetScope === 'PROGRAM' ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs' : 'bg-neutral-50 hover:bg-neutral-100 border-neutral-200 text-neutral-700'
                }`}
              >
                <div className="flex items-center space-x-1.5">
                  <Layers className="w-3.5 h-3.5" />
                  <span className="text-xs font-semibold">Program Students</span>
                </div>
                <span className={`text-[10px] ${targetScope === 'PROGRAM' ? 'text-neutral-300' : 'text-neutral-400'}`}>
                  Multi-program select
                </span>
              </button>

              <button
                type="button"
                onClick={() => setTargetScope('DEPARTMENT')}
                className={`p-2.5 rounded-xl border text-center font-medium transition-all cursor-pointer flex flex-col items-center justify-center space-y-1 ${
                  targetScope === 'DEPARTMENT' ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs' : 'bg-neutral-50 hover:bg-neutral-100 border-neutral-200 text-neutral-700'
                }`}
              >
                <div className="flex items-center space-x-1.5">
                  <Building2 className="w-3.5 h-3.5" />
                  <span className="text-xs font-semibold">Department-Wise</span>
                </div>
                <span className={`text-[10px] ${targetScope === 'DEPARTMENT' ? 'text-neutral-300' : 'text-neutral-400'}`}>
                  Multi-department select
                </span>
              </button>

              <button
                type="button"
                onClick={() => setTargetScope('ALL_STUDENTS')}
                className={`p-2.5 rounded-xl border text-center font-medium transition-all cursor-pointer flex flex-col items-center justify-center space-y-1 ${
                  targetScope === 'ALL_STUDENTS' ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs' : 'bg-neutral-50 hover:bg-neutral-100 border-neutral-200 text-neutral-700'
                }`}
              >
                <div className="flex items-center space-x-1.5">
                  <Globe className="w-3.5 h-3.5" />
                  <span className="text-xs font-semibold">College-Wide</span>
                </div>
                <span className={`text-[10px] ${targetScope === 'ALL_STUDENTS' ? 'text-neutral-300' : 'text-neutral-400'}`}>
                  All enrolled batches
                </span>
              </button>
            </div>

            {/* Multi-Select Programs */}
            {targetScope === 'PROGRAM' && (
              <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200/90 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-neutral-800">
                    Select Target Programs ({selectedProgNames.length} selected)
                  </label>
                  {programs.length > 1 && (
                    <button
                      type="button"
                      onClick={selectAllPrograms}
                      className="text-[11px] text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
                    >
                      {selectedProgNames.length === programs.length ? 'Deselect Extra' : 'Select All Programs'}
                    </button>
                  )}
                </div>

                {programs.length === 0 ? (
                  <p className="text-amber-800 text-xs bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                    No programs configured yet. Define programs in the Super Admin portal first.
                  </p>
                ) : (
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {programs.map(p => {
                        const isSelected = selectedProgNames.includes(p.name);
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => toggleProgram(p.name)}
                            className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border text-left flex items-center space-x-2 ${
                              isSelected
                                ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
                                : 'bg-white border-neutral-200 hover:border-neutral-300 text-neutral-700'
                            }`}
                          >
                            <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-emerald-400' : 'bg-neutral-300'}`}></span>
                            <span>{p.name}</span>
                            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                              isSelected ? 'bg-neutral-800 text-neutral-300' : 'bg-neutral-100 text-neutral-500'
                            }`}>
                              {p.code}
                            </span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400 ml-1" />}
                          </button>
                        );
                      })}
                    </div>

                    {/* Sub-program filter if single program chosen with sub-programs */}
                    {selectedProgNames.length === 1 && (() => {
                      const singleProg = programs.find(p => p.name === selectedProgNames[0]);
                      if (!singleProg?.hasSubPrograms || !singleProg.subPrograms?.length) return null;
                      return (
                        <div className="pt-2 border-t border-neutral-200/70 space-y-1.5">
                          <label className="block text-[11px] font-medium text-neutral-600">
                            Target Sub-Tier in {singleProg.name}:
                          </label>
                          <div className="flex flex-wrap gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSelectedSubProgram('')}
                              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer border ${
                                selectedSubProgram === ''
                                  ? 'bg-emerald-700 text-white border-emerald-700'
                                  : 'bg-white border-neutral-200 hover:bg-neutral-100 text-neutral-600'
                              }`}
                            >
                              ✓ All Tiers
                            </button>
                            {singleProg.subPrograms.map(sub => (
                              <button
                                key={sub}
                                type="button"
                                onClick={() => setSelectedSubProgram(sub)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer border ${
                                  selectedSubProgram === sub
                                    ? 'bg-emerald-700 text-white border-emerald-700'
                                    : 'bg-white border-neutral-200 hover:bg-neutral-100 text-neutral-600'
                                }`}
                              >
                                {sub}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}

            {/* Multi-Select Departments */}
            {targetScope === 'DEPARTMENT' && (
              <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200/90 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-neutral-800">
                    Select Target Departments ({selectedDepartments.length} selected)
                  </label>
                  <button
                    type="button"
                    onClick={selectAllDepartments}
                    className="text-[11px] text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
                  >
                    {selectedDepartments.length === ALL_DEPARTMENTS.length ? 'Deselect Extra' : 'Select All Departments'}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {ALL_DEPARTMENTS.map((dept) => {
                    const isSelected = selectedDepartments.includes(dept);
                    return (
                      <button
                        key={dept}
                        type="button"
                        onClick={() => toggleDepartment(dept)}
                        className={`p-2.5 rounded-xl border text-left text-xs font-semibold transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
                            : 'bg-white border-neutral-200 hover:border-neutral-300 text-neutral-700'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-emerald-400' : 'bg-neutral-300'}`}></span>
                          <span>{dept}</span>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 4. Session Configuration (Domain VS Resume-based interview option) */}
          <div className="space-y-4 p-4 bg-neutral-50/80 rounded-2xl border border-neutral-200/80">
            <span className="block font-semibold text-neutral-800 uppercase tracking-wider text-[10px]">
              4. Session Configuration &amp; Interview Rubric
            </span>

            {/* For Mock Interview or Both: Choose between Custom Topic OR Resume-based */}
            {(sessionType === 'MOCK_INTERVIEW' || sessionType === 'BOTH') && (
              <div className="space-y-3">
                <label className="block text-[11px] font-semibold text-neutral-800">
                  Technical Interview Generation Source:
                </label>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setInterviewMode('TOPIC')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start space-x-2.5 ${
                      interviewMode === 'TOPIC'
                        ? 'border-neutral-900 bg-white ring-2 ring-neutral-900 shadow-xs'
                        : 'border-neutral-200 bg-white/70 hover:bg-white text-neutral-700'
                    }`}
                  >
                    <div className={`p-1.5 rounded-lg mt-0.5 ${interviewMode === 'TOPIC' ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-500'}`}>
                      <Mic className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-neutral-900">Custom Domain / Topic</div>
                      <div className="text-[10px] text-neutral-500 mt-0.5">Focus questions on specific technical stack (e.g. Full Stack, Java, Systems)</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setInterviewMode('RESUME_BASED')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start space-x-2.5 ${
                      interviewMode === 'RESUME_BASED'
                        ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-600 shadow-xs'
                        : 'border-neutral-200 bg-white/70 hover:bg-white text-neutral-700'
                    }`}
                  >
                    <div className={`p-1.5 rounded-lg mt-0.5 ${interviewMode === 'RESUME_BASED' ? 'bg-emerald-600 text-white' : 'bg-neutral-100 text-neutral-500'}`}>
                      <FileText className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-emerald-950">Personal Resume-Based</div>
                      <div className="text-[10px] text-emerald-800/80 mt-0.5">Questions dynamically generated strictly from each candidate&apos;s uploaded resume &amp; projects</div>
                    </div>
                  </button>
                </div>

                {interviewMode === 'TOPIC' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-[11px] font-medium text-neutral-700 mb-1">Focus Technical Domain *</label>
                      <input
                        type="text"
                        value={domainOrTopic}
                        onChange={(e) => setDomainOrTopic(e.target.value)}
                        placeholder="e.g. Full Stack & Web Systems, DevOps, Data Engineering"
                        className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-neutral-700 mb-1">Difficulty Bar</label>
                      <select
                        value={difficulty}
                        onChange={(e) => setDifficulty(e.target.value as any)}
                        className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-900"
                      >
                        <option value="EASY">Entry / Foundation</option>
                        <option value="MEDIUM">Intermediate (Practical Architecture)</option>
                        <option value="ADVANCED">Advanced (Concurrency &amp; Edge Cases)</option>
                        <option value="FAANG">Product Tier / FAANG Bar</option>
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center space-x-2 text-emerald-900 text-xs">
                    <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      Each candidate will be interviewed specifically on their parsed resume projects, tech stack, and experience.
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* For Listening Comprehension or Both: Select Passage */}
            {(sessionType === 'LISTENING_COMPREHENSION' || sessionType === 'BOTH') && (
              <div className="space-y-1.5 pt-2 border-t border-neutral-200/60">
                <label className="block text-[11px] font-semibold text-neutral-800 mb-1">
                  Spoken Briefing Audio Passage *
                </label>
                <select
                  value={listeningPassageId}
                  onChange={(e) => setListeningPassageId(e.target.value)}
                  className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-900 font-medium"
                >
                  {LISTENING_PASSAGES.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} ({p.domain} · {p.durationSeconds}s)
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-neutral-500">
                  Audio passage spoken aloud by the voice engine without subtitles, testing candidate oral comprehension recall.
                </p>
              </div>
            )}
          </div>

          {/* 5. Schedule & Active Timer Window */}
          <div className="space-y-3 p-4 bg-amber-50/50 rounded-2xl border border-amber-200/80">
            <div className="flex items-center space-x-2 text-amber-900 font-semibold text-xs">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>5. Schedule &amp; Active Timer Window</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-medium text-neutral-700 mb-1">Assessment Date *</label>
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900"
                />
              </div>

              <div>
                <label className="block font-medium text-neutral-700 mb-1">Active From (Time) *</label>
                <input
                  type="time"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900"
                />
              </div>

              <div>
                <label className="block font-medium text-neutral-700 mb-1">Active Until (Time) *</label>
                <input
                  type="time"
                  required
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900"
                />
              </div>
            </div>

            <div className="p-2.5 bg-amber-100/70 border border-amber-300 rounded-xl text-amber-900 text-[11px] flex items-start space-x-2">
              <Clock className="w-3.5 h-3.5 text-amber-700 mt-0.5 shrink-0" />
              <span>
                <strong>Strict Timer Active:</strong> This assessment will be accessible only between <strong>{startTime}</strong> and <strong>{endTime}</strong> on {dueDate}. If a candidate does not complete it within this window, their score will be recorded as <strong>0</strong>.
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-neutral-100 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-neutral-200 rounded-xl text-neutral-700 hover:bg-neutral-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-neutral-900 hover:bg-black text-white font-semibold rounded-xl transition-all shadow-xs disabled:opacity-50 cursor-pointer flex items-center space-x-1.5"
            >
              {sessionType === 'MOCK_INTERVIEW' ? (
                <Mic className="w-3.5 h-3.5 text-emerald-400" />
              ) : sessionType === 'LISTENING_COMPREHENSION' ? (
                <Headphones className="w-3.5 h-3.5 text-purple-400" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              )}
              <span>
                {submitting ? 'Assigning Assessment...' : `Dispatch ${
                  sessionType === 'MOCK_INTERVIEW' ? 'Mock Interview' : sessionType === 'LISTENING_COMPREHENSION' ? 'Listening Assessment' : 'Both Assessments'
                }`}
              </span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
