import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { InterviewAssignment, ImprovementChecklistItem } from '../../types';
import { 
  Mic, 
  Headphones, 
  FileText, 
  CheckCircle2, 
  Clock, 
  Code2, 
  Sparkles, 
  ArrowRight, 
  TrendingUp, 
  Award, 
  Edit3, 
  X, 
  AlertTriangle, 
  Layers, 
  Check, 
  ExternalLink, 
  ArrowLeft,
  Calendar,
  Globe,
  Plus
} from 'lucide-react';
import { ResumeUploadModal } from './ResumeUploadModal';
import { useBackHandler } from '../../hooks/useBackHandler';

export const StudentDashboard: React.FC = () => {
  const { 
    student, 
    currentUser,
    startInterview, 
    latestReport, 
    setActiveView,
    updateCodingHandles,
    assignments,
    startAssignedSession
  } = useApp();

  const isIndependent = student.isIndependent || currentUser?.isIndependent;

  // Sub-views & Modals
  const [viewingResumePage, setViewingResumePage] = useState(false);
  const [viewingAllAssignments, setViewingAllAssignments] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [handlesModalOpen, setHandlesModalOpen] = useState(false);

  useBackHandler(viewingResumePage, () => setViewingResumePage(false));
  useBackHandler(viewingAllAssignments, () => setViewingAllAssignments(false));
  useBackHandler(handlesModalOpen, () => setHandlesModalOpen(false));

  // Coding Handles state
  const [lcUsername, setLcUsername] = useState(student.codingHandles?.leetcode || '');
  const [lcSolvedCount, setLcSolvedCount] = useState<number>(student.codingHandles?.leetcodeSolved ?? 0);
  const [ghUsername, setGhUsername] = useState(student.codingHandles?.github || '');
  const [ghReposCount, setGhReposCount] = useState<number>(student.codingHandles?.githubRepos ?? 0);

  // Other Coding Platforms
  const [otherPlatformName, setOtherPlatformName] = useState('Codeforces');
  const [otherPlatformHandle, setOtherPlatformHandle] = useState('');
  const [otherProfiles, setOtherProfiles] = useState<{ platform: string; username: string; profileUrl: string; solvedOrRating?: string }[]>(
    student.codingHandles?.otherProfiles || []
  );
  const [verifyingPlatform, setVerifyingPlatform] = useState(false);
  const [platformVerifyError, setPlatformVerifyError] = useState<string | null>(null);
  const [savingHandles, setSavingHandles] = useState(false);

  // Post-Interview Actionable Improvement Checklist State
  // Initialized from saved storage, or generated if reports exist, otherwise empty
  const [checklist, setChecklist] = useState<ImprovementChecklistItem[]>(() => {
    try {
      const saved = localStorage.getItem(`student_improvement_checklist_${student.id}`);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {}

    // If student has reports or previous interviews, populate initial post-interview improvement milestones
    const hasHistory = (student.recentReports && student.recentReports.length > 0) || Boolean(latestReport);
    if (hasHistory) {
      return [
        {
          id: 'chk_w1',
          week: 'Week 1',
          title: 'Speech Pacing & Filler Word Reduction',
          description: 'Keep verbal pace between 115-130 WPM and reduce filler words ("um", "uh", "like") to under 3 per question turn.',
          category: 'COMMUNICATION',
          isCompleted: true,
          completedAt: '2026-09-27'
        },
        {
          id: 'chk_w2',
          week: 'Week 2',
          title: 'Core Architecture Trade-Offs & Edge Cases',
          description: 'Vocalize algorithmic trade-offs (e.g. time-space complexity, hashing collisions, thread safety) before writing code.',
          category: 'TECHNICAL',
          isCompleted: false
        },
        {
          id: 'chk_w3',
          week: 'Week 3',
          title: 'Resume Project Deep-Dive & Microservices',
          description: 'Prepare structured STAR-format justification of database indexing, caching strategies, and concurrency bottlenecks.',
          category: 'SYSTEM_DESIGN',
          isCompleted: false
        },
        {
          id: 'chk_w4',
          week: 'Week 4',
          title: 'Final Full-Length Proctored Mock Run',
          description: 'Achieve at least 80% on a full 3-turn voice-to-voice proctored technical interview under strict camera focus.',
          category: 'CODING',
          isCompleted: false
        }
      ];
    }

    return [];
  });

  // Calculate Overall Readiness %: Strictly depends ONLY on the Post-Interview Checklist
  const totalChecklistCount = checklist.length;
  const completedChecklistCount = checklist.filter(c => c.isCompleted).length;
  const overallReadinessScore = totalChecklistCount === 0 
    ? 0 
    : Math.round((completedChecklistCount / totalChecklistCount) * 100);

  // Toggle checklist item
  const handleToggleChecklistItem = (itemId: string) => {
    const updated = checklist.map(item => 
      item.id === itemId ? { ...item, isCompleted: !item.isCompleted, completedAt: !item.isCompleted ? new Date().toISOString() : undefined } : item
    );
    setChecklist(updated);
    try {
      localStorage.setItem(`student_improvement_checklist_${student.id}`, JSON.stringify(updated));
    } catch {}
  };

  // Filter relevant assignments
  const relevantAssignments = (assignments || []).filter((asg: InterviewAssignment) => {
    if (asg.collegeId && student.collegeId && asg.collegeId !== student.collegeId) {
      return false;
    }
    if (asg.targetScope === 'ALL_STUDENTS') return true;
    if (asg.targetScope === 'SPECIFIC_STUDENT') {
      return asg.targetStudentId === student.id || 
             asg.targetStudentId === student.rollNumber ||
             asg.targetStudentId?.toLowerCase() === student.email?.toLowerCase();
    }
    if (asg.targetScope === 'MY_MENTEES') {
      return student.mentorEmail === asg.assignedByEmail || student.mentorName === asg.assignedByName || true;
    }
    if (asg.targetScope === 'PROGRAM') {
      // 1. Multi-program array matching
      if (asg.targetProgramNames && asg.targetProgramNames.length > 0) {
        const matchesAny = asg.targetProgramNames.some(p => 
          (student.programName && (student.programName.toLowerCase().includes(p.toLowerCase()) || p.toLowerCase().includes(student.programName.toLowerCase()))) ||
          (student.track && (student.track.toLowerCase().includes(p.toLowerCase()) || p.toLowerCase().includes(student.track.toLowerCase())))
        );
        if (matchesAny) {
          if (asg.targetSubProgram) {
            return (student.subProgramName && student.subProgramName.toLowerCase() === asg.targetSubProgram.toLowerCase()) ||
                   (student.track && student.track.toLowerCase().includes(asg.targetSubProgram.toLowerCase()));
          }
          return true;
        }
      }
      const progTarget = asg.targetProgramName || asg.targetDomainOrTrack;
      if (!progTarget) return true;
      const progMatches = (student.programName && (student.programName.toLowerCase().includes(progTarget.toLowerCase()) || progTarget.toLowerCase().includes(student.programName.toLowerCase()))) ||
        (student.track && (student.track.toLowerCase().includes(progTarget.toLowerCase()) || progTarget.toLowerCase().includes(student.track.toLowerCase())));
      
      // If student is not explicitly locked to a program yet, don't hide practice assignments
      if (!progMatches && !student.programName && (!student.track || student.track === 'General Track')) {
        return true;
      }
      if (!progMatches) return false;
      if (asg.targetSubProgram) {
        return (student.subProgramName && student.subProgramName.toLowerCase() === asg.targetSubProgram.toLowerCase()) ||
               (student.track && student.track.toLowerCase().includes(asg.targetSubProgram.toLowerCase()));
      }
      return true;
    }
    if (asg.targetScope === 'DEPARTMENT') {
      // 1. Multi-department array matching
      if (asg.targetDepartments && asg.targetDepartments.length > 0) {
        const matchesAnyDept = asg.targetDepartments.some(d => 
          (student.department && (student.department.toLowerCase().includes(d.toLowerCase()) || d.toLowerCase().includes(student.department.toLowerCase())))
        );
        if (matchesAnyDept) return true;
      }
      const deptTarget = asg.targetDepartment || asg.targetDomainOrTrack;
      if (!deptTarget) return true;
      return (student.department && (student.department.toLowerCase().includes(deptTarget.toLowerCase()) || deptTarget.toLowerCase().includes(student.department.toLowerCase())));
    }
    return true;
  });

  const getStudentSubmission = (asg: InterviewAssignment) => {
    return asg.submissions?.find(
      s => s.studentId === student.id ||
           s.studentRollNumber === student.rollNumber ||
           s.studentRollNumber?.toLowerCase() === student.rollNumber?.toLowerCase()
    );
  };

  const pendingAssignmentsCount = relevantAssignments.filter(a => !getStudentSubmission(a)).length;
  const completedAssignmentsCount = relevantAssignments.filter(a => !!getStudentSubmission(a)).length;

  // Platform URL generator
  const getPlatformUrl = (platform: string, username: string): string => {
    const cleanUser = username.trim();
    const plat = platform.toLowerCase();
    if (plat.includes('leetcode')) return `https://leetcode.com/u/${cleanUser}`;
    if (plat.includes('github')) return `https://github.com/${cleanUser}`;
    if (plat.includes('codeforces')) return `https://codeforces.com/profile/${cleanUser}`;
    if (plat.includes('hackerrank')) return `https://www.hackerrank.com/profile/${cleanUser}`;
    if (plat.includes('codechef')) return `https://www.codechef.com/users/${cleanUser}`;
    if (plat.includes('geeks')) return `https://auth.geeksforgeeks.org/user/${cleanUser}`;
    if (cleanUser.startsWith('http')) return cleanUser;
    return `https://${plat}.com/${cleanUser}`;
  };

  // Add Other Coding Platform with verification check
  const handleAddOtherPlatform = () => {
    setPlatformVerifyError(null);
    if (!otherPlatformHandle.trim()) {
      setPlatformVerifyError(`Please enter your ${otherPlatformName} username.`);
      return;
    }

    setVerifyingPlatform(true);

    // Verification check simulation
    setTimeout(() => {
      const handle = otherPlatformHandle.trim();
      // If handle contains illegal URL characters or spaces
      if (handle.includes(' ') || handle.length < 2) {
        setPlatformVerifyError(`Unable to fetch details from ${otherPlatformName}. Please check your handle and public profile settings.`);
        setVerifyingPlatform(false);
        return;
      }

      const newProfile = {
        platform: otherPlatformName,
        username: handle,
        profileUrl: getPlatformUrl(otherPlatformName, handle),
        solvedOrRating: 'Verified Active'
      };

      const updated = [...otherProfiles.filter(p => p.platform !== otherPlatformName), newProfile];
      setOtherProfiles(updated);
      setOtherPlatformHandle('');
      setVerifyingPlatform(false);
    }, 600);
  };

  const handleSaveHandles = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingHandles(true);
    try {
      await updateCodingHandles({
        leetcode: lcUsername.trim() || undefined,
        leetcodeSolved: Number(lcSolvedCount) || 0,
        github: ghUsername.trim() || undefined,
        githubRepos: Number(ghReposCount) || 0,
        otherProfiles
      });
      setHandlesModalOpen(false);
    } catch (err) {
      console.warn('Error saving handles:', err);
    } finally {
      setSavingHandles(false);
    }
  };

  // =========================================================================
  // SUB-VIEW: DEDICATED FULL RESUME PAGE
  // =========================================================================
  if (viewingResumePage) {
    return (
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 py-8 space-y-6 animate-in fade-in duration-200">
        
        {/* Top Back Navigation */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setViewingResumePage(false)}
            className="inline-flex items-center space-x-2 text-xs font-semibold text-neutral-700 hover:text-neutral-950 bg-white hover:bg-neutral-50 px-3.5 py-2 rounded-xl border border-neutral-200 transition-colors shadow-2xs cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Student Dashboard</span>
          </button>

          <button
            type="button"
            onClick={() => setUploadModalOpen(true)}
            className="px-4 py-2 bg-neutral-900 hover:bg-black text-white rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all shadow-xs cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Update / Re-Upload Resume</span>
          </button>
        </div>

        {/* Resume Dossier Card */}
        {!student.resume ? (
          <div className="bg-white border border-neutral-200 rounded-3xl p-12 text-center space-y-4 shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 mx-auto flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900">No Resume Uploaded Yet</h2>
              <p className="text-xs text-neutral-500 max-w-md mx-auto mt-1">
                Upload your resume (PDF or pasted text) to extract your verified tech stack, languages, and project experience for AI-grounded interview sessions.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setUploadModalOpen(true)}
              className="inline-flex items-center space-x-2 px-5 py-2.5 bg-neutral-900 hover:bg-black text-white text-xs font-semibold rounded-xl transition-all shadow-xs cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Upload Resume Now</span>
            </button>
          </div>
        ) : (
          <div className="bg-white border border-neutral-200/90 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
            
            {/* Resume Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-neutral-100">
              <div className="flex items-center space-x-3.5">
                <div className="w-12 h-12 rounded-2xl bg-neutral-900 text-white flex items-center justify-center font-bold text-base shadow-xs">
                  {student.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h1 className="text-xl font-bold tracking-tight text-neutral-900">{student.name}</h1>
                    <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-100 text-emerald-800 rounded-full font-mono uppercase">
                      Parsed &amp; Grounded
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    {student.email} · {student.department} · File: <strong className="text-neutral-700">{student.resume.fileName}</strong> (Uploaded on {student.resume.parsedAt || 'Recent'})
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setUploadModalOpen(true)}
                  className="px-3.5 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  Replace Resume
                </button>
              </div>
            </div>

            {/* Resume Summary */}
            {student.resume.summary && (
              <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200/80 space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 font-semibold">Executive Summary</span>
                <p className="text-xs text-neutral-700 leading-relaxed italic">
                  &quot;{student.resume.summary}&quot;
                </p>
              </div>
            )}

            {/* Extracted Technical Skills Grid */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                Extracted Technical Stack &amp; Competencies
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200/80 space-y-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 font-semibold">Languages</span>
                  <div className="flex flex-wrap gap-1.5">
                    {student.resume.skills?.languages?.length ? (
                      student.resume.skills.languages.map((l: string, i: number) => (
                        <span key={i} className="px-2 py-1 bg-white border border-neutral-200 rounded-lg text-xs font-semibold text-neutral-800">
                          {l}
                        </span>
                      ))
                    ) : <span className="text-neutral-400 italic">None detected</span>}
                  </div>
                </div>

                <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200/80 space-y-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 font-semibold">Frameworks</span>
                  <div className="flex flex-wrap gap-1.5">
                    {student.resume.skills?.frameworks?.length ? (
                      student.resume.skills.frameworks.map((f: string, i: number) => (
                        <span key={i} className="px-2 py-1 bg-white border border-neutral-200 rounded-lg text-xs font-semibold text-neutral-800">
                          {f}
                        </span>
                      ))
                    ) : <span className="text-neutral-400 italic">None detected</span>}
                  </div>
                </div>

                <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200/80 space-y-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 font-semibold">Databases</span>
                  <div className="flex flex-wrap gap-1.5">
                    {student.resume.skills?.databases?.length ? (
                      student.resume.skills.databases.map((d: string, i: number) => (
                        <span key={i} className="px-2 py-1 bg-white border border-neutral-200 rounded-lg text-xs font-semibold text-neutral-800">
                          {d}
                        </span>
                      ))
                    ) : <span className="text-neutral-400 italic">None detected</span>}
                  </div>
                </div>

                <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200/80 space-y-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 font-semibold">Tools &amp; Cloud</span>
                  <div className="flex flex-wrap gap-1.5">
                    {student.resume.skills?.tools?.length ? (
                      student.resume.skills.tools.map((t: string, i: number) => (
                        <span key={i} className="px-2 py-1 bg-white border border-neutral-200 rounded-lg text-xs font-semibold text-neutral-800">
                          {t}
                        </span>
                      ))
                    ) : <span className="text-neutral-400 italic">None detected</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* Extracted Projects Dossier */}
            {student.resume.projects && student.resume.projects.length > 0 && (
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                  Verified Academic &amp; Personal Projects
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {student.resume.projects.map((proj: any, idx: number) => (
                    <div key={idx} className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200/80 text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-neutral-900 text-sm truncate">{proj.title}</h4>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-200 text-neutral-700 font-mono font-semibold">
                          Project #{idx + 1}
                        </span>
                      </div>
                      {proj.techStack && (
                        <p className="text-[11px] text-blue-700 font-mono font-medium">
                          Tech Stack: {Array.isArray(proj.techStack) ? proj.techStack.join(', ') : proj.techStack}
                        </p>
                      )}
                      {proj.description && (
                        <p className="text-xs text-neutral-600 leading-relaxed">{proj.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

        {uploadModalOpen && (
          <ResumeUploadModal onClose={() => setUploadModalOpen(false)} />
        )}
      </div>
    );
  }

  // =========================================================================
  // SUB-VIEW: ALL ASSIGNED ASSESSMENTS DIRECTORY
  // =========================================================================
  if (viewingAllAssignments) {
    return (
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 py-8 space-y-6 animate-in fade-in duration-200">
        
        {/* Back Navigation Bar */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setViewingAllAssignments(false)}
            className="inline-flex items-center space-x-2 text-xs font-semibold text-neutral-700 hover:text-neutral-950 bg-white hover:bg-neutral-50 px-3.5 py-2 rounded-xl border border-neutral-200 transition-colors shadow-2xs cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Student Dashboard</span>
          </button>

          <span className="text-xs font-mono text-neutral-500">
            {pendingAssignmentsCount} Pending · {completedAssignmentsCount} Completed
          </span>
        </div>

        {/* Directory Header Banner */}
        <div className="bg-white border border-neutral-200/90 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-neutral-900">
              Assigned Assessments &amp; Practice Drills
            </h1>
            <p className="text-xs text-neutral-500 mt-1 max-w-2xl">
              Complete interactive verbal mock interviews and auditory listening comprehension drills assigned specifically to your program or academic department.
            </p>
          </div>
        </div>

        {/* Assignments Cards Grid */}
        {relevantAssignments.length === 0 ? (
          <div className="bg-white border border-neutral-200 rounded-3xl p-12 text-center text-neutral-400 text-xs space-y-2">
            <Layers className="w-8 h-8 mx-auto text-neutral-300 mb-2" />
            <p className="font-semibold text-neutral-700">No assessments currently assigned to your cohort.</p>
            <p className="text-neutral-500">When your mentor or college admin assigns a drill, it will appear here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {relevantAssignments.map((asg) => {
              const submission = getStudentSubmission(asg);
              const isCompleted = !!submission;
              const isInterview = asg.sessionType === 'MOCK_INTERVIEW';
              const isBoth = asg.sessionType === 'BOTH';

              return (
                <div 
                  key={asg.id}
                  className={`rounded-2xl border p-5 flex flex-col justify-between transition-all ${
                    isCompleted 
                      ? 'bg-neutral-50/60 border-neutral-200' 
                      : 'bg-white border-neutral-300 shadow-2xs hover:shadow-xs hover:border-neutral-900'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                        isBoth
                          ? 'bg-amber-950 text-amber-200 border border-amber-800'
                          : isInterview 
                          ? 'bg-neutral-900 text-white' 
                          : 'bg-purple-950 text-purple-200'
                      }`}>
                        {isBoth ? <Sparkles className="w-3 h-3 text-amber-400" /> : isInterview ? <Mic className="w-3 h-3 text-emerald-400" /> : <Headphones className="w-3 h-3 text-purple-300" />}
                        <span>{isBoth ? 'Combined (Voice Mock + Listening)' : isInterview ? 'Technical Mock Interview' : 'Listening Comprehension'}</span>
                      </span>

                      <div className="flex items-center space-x-1.5">
                        {isCompleted ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800 rounded-full font-mono">
                            <Check className="w-3 h-3" />
                            <span>Score: {submission.score}/100</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 text-[10px] font-medium bg-amber-50 text-amber-900 border border-amber-200 rounded font-mono">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>Due {asg.dueDate}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-neutral-900">{asg.title}</h3>
                      <p className="text-[11px] text-neutral-500 mt-0.5">
                        Assigned by <span className="font-semibold text-neutral-700">{asg.assignedByName}</span> ({asg.assignedByRole.replace(/_/g, ' ')})
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] bg-neutral-50 p-2.5 rounded-xl border border-neutral-200/60 font-mono">
                      <div>
                        <span className="text-neutral-400 block text-[10px] uppercase">Target Scope</span>
                        <span className="font-medium text-neutral-800 truncate block">
                          {asg.targetProgramName || asg.targetDomainOrTrack || asg.targetDepartment || 'Cohort Wide'}
                        </span>
                      </div>
                      <div>
                        <span className="text-neutral-400 block text-[10px] uppercase">
                          {isInterview ? 'Rubric / Mode' : 'Passage'}
                        </span>
                        <span className="font-medium text-neutral-800 truncate block">
                          {isInterview 
                            ? (asg.interviewMode === 'RESUME_BASED' ? 'Resume-Based' : `${asg.difficulty || 'Medium'} · ${asg.domainOrTopic || 'General'}`)
                            : (asg.listeningPassageId || 'FinPay Gateway')}
                        </span>
                      </div>
                    </div>

                    {asg.startTime && asg.endTime && (
                      <div className="p-2 bg-amber-50/80 rounded-lg border border-amber-200 text-amber-900 text-[11px] flex items-center space-x-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                        <span>Active Window: {asg.startTime} to {asg.endTime}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 mt-4 border-t border-neutral-100 flex items-center justify-between">
                    <span className="text-[11px] text-neutral-400 font-mono">
                      {isCompleted ? `Submitted on ${submission.submittedAt ? submission.submittedAt.split('T')[0] : 'Today'}` : 'Not yet attempted'}
                    </span>
                    <button
                      type="button"
                      onClick={() => startAssignedSession(asg)}
                      className={`inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        isCompleted
                          ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-800'
                          : isBoth
                          ? 'bg-amber-950 hover:bg-black text-white shadow-xs'
                          : isInterview
                          ? 'bg-neutral-900 hover:bg-black text-white shadow-xs'
                          : 'bg-purple-950 hover:bg-black text-white shadow-xs'
                      }`}
                    >
                      {isBoth ? <Sparkles className="w-3.5 h-3.5 text-amber-400" /> : isInterview ? <Mic className="w-3.5 h-3.5" /> : <Headphones className="w-3.5 h-3.5" />}
                      <span>{isCompleted ? 'Retake Assessment' : isBoth ? 'Start Combined Drill' : (isInterview ? 'Start Mock Assessment' : 'Start Listening Assessment')}</span>
                      <ArrowRight className="w-3 h-3 ml-0.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    );
  }

  // =========================================================================
  // MAIN STUDENT DASHBOARD VIEW
  // =========================================================================
  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 py-8 space-y-8 animate-in fade-in duration-200">
      
      {/* Student Welcome Header Banner */}
      <div className="bg-white border border-neutral-200/90 rounded-2xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900">
                {student.name}
              </h1>
              {isIndependent ? (
                <span className="px-2.5 py-1 text-xs font-semibold bg-emerald-950 text-emerald-300 rounded-full border border-emerald-800 flex items-center space-x-1">
                  <span>★ Independent Candidate</span>
                </span>
              ) : (
                <span className="px-2.5 py-1 text-xs font-semibold bg-neutral-900 text-white rounded-full">
                  ★ {student.track}
                </span>
              )}
              <span className="px-2.5 py-1 text-xs font-medium bg-neutral-100 text-neutral-600 rounded-full border border-neutral-200 font-mono">
                {student.rollNumber}
              </span>
            </div>

            <p className="text-sm text-neutral-500 max-w-2xl">
              {student.department} · {isIndependent ? 'Self-Paced Track' : `Batch of ${student.batchYear}`} · Primary Track: {student.subProgramName || student.programName || student.track || 'General'}
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => setViewingResumePage(true)}
              className="flex items-center space-x-2 bg-white hover:bg-neutral-50 border border-neutral-200 hover:border-neutral-300 text-neutral-800 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all shadow-2xs cursor-pointer"
            >
              <FileText className="w-4 h-4 text-neutral-500" />
              <span>{student.resume ? 'View Resume Dossier' : 'Upload Resume'}</span>
            </button>

            {latestReport && (
              <button
                type="button"
                onClick={() => setActiveView('REPORT_VIEW')}
                className="flex items-center space-x-2 bg-neutral-900 hover:bg-black text-white px-4 py-2.5 rounded-xl text-xs font-semibold transition-all shadow-xs cursor-pointer"
              >
                <TrendingUp className="w-4 h-4" />
                <span>View Latest Scorecard ({latestReport.overallScore}/100)</span>
              </button>
            )}
          </div>

        </div>

        {/* 4 Top Telemetry KPI Cards */}
        <div className="mt-6 pt-6 border-t border-neutral-100 grid grid-cols-2 sm:grid-cols-4 gap-4">
          
          {/* Card 1: LeetCode Profile */}
          <div 
            onClick={() => {
              if (student.codingHandles?.leetcode) {
                window.open(getPlatformUrl('leetcode', student.codingHandles.leetcode), '_blank');
              } else {
                setHandlesModalOpen(true);
              }
            }}
            className="p-3.5 bg-neutral-50/80 hover:bg-neutral-100/80 rounded-2xl border border-neutral-200/80 transition-all cursor-pointer group relative"
          >
            <div className="flex items-center justify-between text-neutral-500 text-xs font-medium mb-1">
              <span className="font-semibold text-neutral-700">LeetCode</span>
              <div className="flex items-center space-x-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setHandlesModalOpen(true);
                  }}
                  className="p-1 rounded text-neutral-400 hover:text-neutral-900 hover:bg-neutral-200 transition-colors"
                  title="Configure handles"
                >
                  <Edit3 className="w-3 h-3" />
                </button>
                <ExternalLink className="w-3 h-3 text-neutral-400 group-hover:text-blue-600 transition-colors" />
              </div>
            </div>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-xl font-bold text-neutral-900">{student.codingHandles?.leetcodeSolved ?? 0}</span>
              <span className="text-[11px] text-neutral-500 font-medium">/ 300 Target</span>
            </div>
            <p className="text-[10px] text-neutral-500 mt-1 font-mono truncate group-hover:text-blue-600">
              {student.codingHandles?.leetcode ? `@${student.codingHandles.leetcode} ↗` : 'Click to link profile'}
            </p>
          </div>

          {/* Card 2: GitHub Profile */}
          <div 
            onClick={() => {
              if (student.codingHandles?.github) {
                window.open(getPlatformUrl('github', student.codingHandles.github), '_blank');
              } else {
                setHandlesModalOpen(true);
              }
            }}
            className="p-3.5 bg-neutral-50/80 hover:bg-neutral-100/80 rounded-2xl border border-neutral-200/80 transition-all cursor-pointer group relative"
          >
            <div className="flex items-center justify-between text-neutral-500 text-xs font-medium mb-1">
              <span className="font-semibold text-neutral-700">GitHub Repos</span>
              <div className="flex items-center space-x-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setHandlesModalOpen(true);
                  }}
                  className="p-1 rounded text-neutral-400 hover:text-neutral-900 hover:bg-neutral-200 transition-colors"
                  title="Configure handles"
                >
                  <Edit3 className="w-3 h-3" />
                </button>
                <ExternalLink className="w-3 h-3 text-neutral-400 group-hover:text-blue-600 transition-colors" />
              </div>
            </div>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-xl font-bold text-neutral-900">{student.codingHandles?.githubRepos ?? 0}</span>
              <span className="text-[11px] text-neutral-500 font-medium">Public</span>
            </div>
            <p className="text-[10px] text-neutral-500 mt-1 font-mono truncate group-hover:text-blue-600">
              {student.codingHandles?.github ? `@${student.codingHandles.github} ↗` : 'Click to link profile'}
            </p>
          </div>

          {/* Card 3: View Resume */}
          <div 
            onClick={() => setViewingResumePage(true)}
            className="p-3.5 bg-neutral-50/80 hover:bg-neutral-100/80 rounded-2xl border border-neutral-200/80 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-neutral-500 text-xs font-medium mb-1">
              <span className="font-semibold text-neutral-700">View Resume</span>
              <FileText className="w-3.5 h-3.5 text-neutral-500 group-hover:text-neutral-900 transition-colors" />
            </div>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-xl font-bold text-neutral-900">
                {student.resume ? 'Active' : 'Pending'}
              </span>
              <span className="text-[11px] text-emerald-600 font-medium">
                {student.resume ? 'Grounded' : 'Upload'}
              </span>
            </div>
            <p className="text-[10px] text-neutral-500 mt-1 truncate group-hover:text-neutral-900">
              {student.resume ? `${student.resume.fileName} ↗` : 'Click to upload resume'}
            </p>
          </div>

          {/* Card 4: Overall Readiness (Strictly dependent on the Post-Interview Checklist) */}
          <div className="p-3.5 bg-neutral-50/80 rounded-2xl border border-neutral-200/80">
            <div className="flex items-center justify-between text-neutral-500 text-xs font-medium mb-1">
              <span className="font-semibold text-neutral-700">Overall Readiness</span>
              <Award className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <div className="flex items-baseline space-x-1.5">
              <span className={`text-xl font-bold ${overallReadinessScore >= 75 ? 'text-emerald-600' : 'text-neutral-900'}`}>
                {overallReadinessScore}%
              </span>
              <span className="text-[11px] text-neutral-500 font-medium font-mono">
                {completedChecklistCount}/{totalChecklistCount || 0} Met
              </span>
            </div>
            <div className="w-full bg-neutral-200 h-1.5 rounded-full mt-2 overflow-hidden">
              <div 
                className={`h-full transition-all duration-300 ${
                  overallReadinessScore >= 75 ? 'bg-emerald-500' : overallReadinessScore >= 40 ? 'bg-amber-500' : 'bg-neutral-900'
                }`} 
                style={{ width: `${overallReadinessScore}%` }} 
              />
            </div>
          </div>

        </div>

        {/* Additional Linked Coding Platforms (Codeforces, HackerRank, etc.) */}
        {otherProfiles.length > 0 && (
          <div className="mt-4 pt-4 border-t border-neutral-100 flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-medium text-neutral-400">Other Profiles:</span>
            {otherProfiles.map((p, idx) => (
              <a
                key={idx}
                href={p.profileUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center space-x-1 px-2.5 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-lg text-xs font-mono transition-colors"
              >
                <span>{p.platform}:</span>
                <strong className="text-neutral-900">@{p.username}</strong>
                <ExternalLink className="w-2.5 h-2.5 text-neutral-500" />
              </a>
            ))}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* RECTANGULAR BAR: ASSIGNED ASSESSMENTS & PRACTICE SESSIONS */}
      {/* ========================================================================= */}
      <div 
        onClick={() => setViewingAllAssignments(true)}
        className="w-full bg-gradient-to-r from-neutral-900 via-neutral-900 to-neutral-800 hover:from-black hover:to-neutral-900 text-white rounded-2xl p-5 shadow-xs border border-neutral-800 cursor-pointer transition-all hover:scale-[1.003] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 group"
      >
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 border border-white/10 group-hover:bg-white/20 transition-colors">
            <Layers className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <h3 className="text-base font-bold text-white tracking-tight">
                Assigned Assessments &amp; Practice Sessions
              </h3>
              {pendingAssignmentsCount > 0 ? (
                <span className="px-2.5 py-0.5 text-[10px] font-bold bg-amber-400 text-neutral-950 rounded-full font-mono uppercase">
                  {pendingAssignmentsCount} Pending
                </span>
              ) : (
                <span className="px-2.5 py-0.5 text-[10px] font-bold bg-emerald-400 text-neutral-950 rounded-full font-mono uppercase">
                  All Caught Up
                </span>
              )}
            </div>
            <p className="text-xs text-neutral-300 mt-0.5">
              You have <strong className="text-white">{relevantAssignments.length} total assigned drills</strong> ({pendingAssignmentsCount} pending, {completedAssignmentsCount} completed). Click here to open and begin your mock interviews.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0 self-end sm:self-auto">
          <span className="text-xs font-semibold text-emerald-400 group-hover:text-emerald-300 transition-colors">
            Open All Assignments
          </span>
          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white group-hover:bg-white/20 transition-colors">
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Free Practice Launcher Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Practice Mock Interview */}
        <div className="relative overflow-hidden bg-neutral-950 text-white rounded-2xl p-7 border border-neutral-800 shadow-sm flex flex-col justify-between group">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-medium bg-neutral-800/80 text-neutral-200 border border-neutral-700">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                <span>Resume-Grounded Proctored Interview</span>
              </span>
              <span className="text-[11px] text-neutral-400 font-mono">PROCTORED</span>
            </div>

            <div>
              <h2 className="text-xl font-semibold tracking-tight text-white">
                Launch Mock Interview
              </h2>
              <p className="text-xs text-neutral-400 mt-1.5 leading-relaxed">
                Engage in an adaptive verbal technical interview grounded in your uploaded resume projects, concurrency concepts, and algorithmic problem solving.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2">
              <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-2.5 text-center">
                <p className="text-[10px] text-neutral-400 uppercase tracking-wider font-mono">Mode</p>
                <p className="text-xs font-medium text-neutral-200 mt-0.5">Voice-to-Voice</p>
              </div>
              <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-2.5 text-center">
                <p className="text-[10px] text-neutral-400 uppercase tracking-wider font-mono">Turns</p>
                <p className="text-xs font-medium text-neutral-200 mt-0.5">3 Adaptive Turns</p>
              </div>
              <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-2.5 text-center">
                <p className="text-[10px] text-neutral-400 uppercase tracking-wider font-mono">Proctoring</p>
                <p className="text-xs font-medium text-emerald-400 mt-0.5">Active Focus</p>
              </div>
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-neutral-800 flex items-center justify-between">
            <span className="text-xs text-neutral-400">Includes WPM Pace &amp; Filler Diagnostics</span>
            <button
              type="button"
              onClick={() => startInterview('MOCK_INTERVIEW')}
              className="inline-flex items-center space-x-2 bg-white hover:bg-neutral-100 text-neutral-950 font-semibold px-5 py-2.5 rounded-xl text-xs transition-all shadow-sm cursor-pointer"
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Launch Mock Interview</span>
              <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
            </button>
          </div>
        </div>

        {/* Practice Listening Comprehension */}
        <div className="relative overflow-hidden bg-white text-neutral-900 rounded-2xl p-7 border border-neutral-200/90 shadow-xs flex flex-col justify-between group hover:border-neutral-300 transition-all">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-medium bg-neutral-100 text-neutral-700 border border-neutral-200">
                <Headphones className="w-3 h-3 text-neutral-600" />
                <span>Auditory Retention &amp; Briefing</span>
              </span>
              <span className="text-[11px] text-neutral-400 font-mono">AUDIO ONLY</span>
            </div>

            <div>
              <h2 className="text-xl font-semibold tracking-tight text-neutral-900">
                Listening Comprehension
              </h2>
              <p className="text-xs text-neutral-500 mt-1.5 leading-relaxed">
                Listen to a client architecture requirement passage without text cues, followed by 2 targeted verbal questions testing precision listening.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2">
              <div className="bg-neutral-50 border border-neutral-200/80 rounded-xl p-2.5 text-center">
                <p className="text-[10px] text-neutral-500 uppercase tracking-wider font-mono">Audio Pass</p>
                <p className="text-xs font-medium text-neutral-800 mt-0.5">FinPay Gateway</p>
              </div>
              <div className="bg-neutral-50 border border-neutral-200/80 rounded-xl p-2.5 text-center">
                <p className="text-[10px] text-neutral-500 uppercase tracking-wider font-mono">Format</p>
                <p className="text-xs font-medium text-neutral-800 mt-0.5">Voice Retention</p>
              </div>
              <div className="bg-neutral-50 border border-neutral-200/80 rounded-xl p-2.5 text-center">
                <p className="text-[10px] text-neutral-500 uppercase tracking-wider font-mono">Feedback</p>
                <p className="text-xs font-medium text-neutral-800 mt-0.5">Instant Score</p>
              </div>
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-neutral-100 flex items-center justify-between">
            <span className="text-xs text-neutral-500">Tests auditory retention &amp; verbal recall</span>
            <button
              type="button"
              onClick={() => startInterview('LISTENING_COMPREHENSION')}
              className="inline-flex items-center space-x-2 bg-neutral-900 hover:bg-black text-white font-semibold px-5 py-2.5 rounded-xl text-xs transition-all shadow-xs cursor-pointer"
            >
              <Headphones className="w-3.5 h-3.5" />
              <span>Start Listening</span>
              <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
            </button>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* POST-INTERVIEW ACTIONABLE IMPROVEMENT CHECKLIST */}
      {/* (Replaces old College Placement Criteria; Controls Overall Readiness %) */}
      {/* ========================================================================= */}
      <div className="bg-white border border-neutral-200/90 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-6 border-b border-neutral-200/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-neutral-50/50">
          <div>
            <div className="flex items-center space-x-2.5">
              <h3 className="text-base font-bold tracking-tight text-neutral-900">
                Post-Interview Actionable Improvement Checklist
              </h3>
              {totalChecklistCount > 0 && (
                <span className="px-2.5 py-0.5 text-[11px] font-bold bg-neutral-900 text-white rounded-full font-mono">
                  {completedChecklistCount} of {totalChecklistCount} Targets Met
                </span>
              )}
            </div>
            <p className="text-xs text-neutral-500 mt-1 max-w-2xl">
              Targeted weekly improvement milestones derived from your AI diagnostic evaluations. Completing all items achieves 100% placement readiness.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <span className="text-xs font-semibold text-neutral-600">Readiness Score:</span>
            <span className={`px-3 py-1 rounded-xl text-xs font-bold border ${
              overallReadinessScore >= 75 
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                : overallReadinessScore > 0 
                ? 'bg-amber-50 text-amber-800 border-amber-300' 
                : 'bg-neutral-100 text-neutral-700 border-neutral-300'
            }`}>
              {overallReadinessScore}% {overallReadinessScore === 100 ? '🎉 Placement Ready' : ''}
            </span>
          </div>
        </div>

        {checklist.length === 0 ? (
          <div className="p-10 text-center text-neutral-400 space-y-2">
            <Sparkles className="w-8 h-8 text-neutral-300 mx-auto" />
            <h4 className="text-sm font-semibold text-neutral-800">No Post-Interview Checklist Generated Yet</h4>
            <p className="text-xs text-neutral-500 max-w-md mx-auto">
              Your overall readiness is currently <strong>0%</strong>. Once you attend a mock interview or assigned practice drill, your personalized weekly improvement checklist will appear here.
            </p>
            <button
              type="button"
              onClick={() => startInterview('MOCK_INTERVIEW')}
              className="mt-2 inline-flex items-center space-x-2 px-4 py-2 bg-neutral-900 hover:bg-black text-white rounded-xl text-xs font-semibold transition-all shadow-xs cursor-pointer"
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Attend Interview to Generate Action Plan</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {checklist.map((item) => (
              <div 
                key={item.id}
                onClick={() => handleToggleChecklistItem(item.id)}
                className={`p-4 sm:px-6 flex items-center justify-between hover:bg-neutral-50/70 transition-colors cursor-pointer ${
                  item.isCompleted ? 'bg-neutral-50/40' : ''
                }`}
              >
                <div className="flex items-start space-x-3.5 min-w-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleChecklistItem(item.id);
                    }}
                    className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center transition-all flex-shrink-0 cursor-pointer ${
                      item.isCompleted 
                        ? 'bg-emerald-600 text-white border border-emerald-600' 
                        : 'border border-neutral-300 hover:border-neutral-400 bg-white'
                    }`}
                  >
                    {item.isCompleted && <Check className="w-3.5 h-3.5" />}
                  </button>

                  <div className="min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-neutral-100 text-neutral-800 font-mono">
                        {item.week}
                      </span>
                      <p className={`text-xs font-semibold ${item.isCompleted ? 'line-through text-neutral-400' : 'text-neutral-900'}`}>
                        {item.title}
                      </p>
                    </div>
                    <p className={`text-[11px] mt-0.5 leading-relaxed ${item.isCompleted ? 'line-through text-neutral-400' : 'text-neutral-500'}`}>
                      {item.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 ml-4 flex-shrink-0">
                  {item.isCompleted ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 mr-1" /> Completed
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                      <Clock className="w-3 h-3 mr-1" /> Action Required
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL: LINK CODING HANDLES & OTHER PLATFORMS */}
      {/* ========================================================================= */}
      {handlesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-neutral-200 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-neutral-200 flex items-center justify-between bg-neutral-50/70 shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-neutral-900 text-white flex items-center justify-center">
                  <Code2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-neutral-900">Link Coding &amp; Development Profiles</h3>
                  <p className="text-xs text-neutral-500">Connect LeetCode, GitHub, and additional competitive programming handles</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setHandlesModalOpen(false)}
                className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveHandles} className="p-6 space-y-4 text-xs overflow-y-auto">
              
              {/* LeetCode Section */}
              <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-neutral-900">LeetCode Profile</span>
                  <span className="text-[10px] font-mono text-neutral-400">leetcode.com/u/username</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-neutral-600 mb-1">Username</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-neutral-400 font-mono">@</span>
                      <input
                        type="text"
                        value={lcUsername}
                        onChange={(e) => setLcUsername(e.target.value)}
                        placeholder="e.g. coder_dev"
                        className="w-full pl-7 pr-3 py-2 bg-white border border-neutral-200 rounded-xl font-mono focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-neutral-600 mb-1">Problems Solved</label>
                    <input
                      type="number"
                      min="0"
                      value={lcSolvedCount}
                      onChange={(e) => setLcSolvedCount(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-xl font-mono focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* GitHub Section */}
              <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-neutral-900">GitHub Profile</span>
                  <span className="text-[10px] font-mono text-neutral-400">github.com/username</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-neutral-600 mb-1">Username</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-neutral-400 font-mono">@</span>
                      <input
                        type="text"
                        value={ghUsername}
                        onChange={(e) => setGhUsername(e.target.value)}
                        placeholder="e.g. dev_repo"
                        className="w-full pl-7 pr-3 py-2 bg-white border border-neutral-200 rounded-xl font-mono focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-neutral-600 mb-1">Public Repositories</label>
                    <input
                      type="number"
                      min="0"
                      value={ghReposCount}
                      onChange={(e) => setGhReposCount(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-xl font-mono focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Other Platforms Section (Codeforces, HackerRank, etc.) */}
              <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-950">Add Other Coding Platforms</span>
                  <span className="text-[10px] text-blue-700">Codeforces, CodeChef, HackerRank...</span>
                </div>

                {platformVerifyError && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-[11px] flex items-center space-x-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    <span>{platformVerifyError}</span>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2">
                  <select
                    value={otherPlatformName}
                    onChange={(e) => setOtherPlatformName(e.target.value)}
                    className="px-2.5 py-2 bg-white border border-blue-200 rounded-xl text-xs focus:outline-none"
                  >
                    <option value="Codeforces">Codeforces</option>
                    <option value="HackerRank">HackerRank</option>
                    <option value="CodeChef">CodeChef</option>
                    <option value="GeeksforGeeks">GeeksforGeeks</option>
                    <option value="AtCoder">AtCoder</option>
                  </select>

                  <input
                    type="text"
                    placeholder="Username / Handle"
                    value={otherPlatformHandle}
                    onChange={(e) => setOtherPlatformHandle(e.target.value)}
                    className="col-span-2 px-3 py-2 bg-white border border-blue-200 rounded-xl font-mono text-xs focus:outline-none"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleAddOtherPlatform}
                    disabled={verifyingPlatform}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    <span>{verifyingPlatform ? 'Verifying...' : '+ Verify & Link Profile'}</span>
                  </button>
                </div>

                {/* List of currently added other platforms */}
                {otherProfiles.length > 0 && (
                  <div className="space-y-1.5 pt-2 border-t border-blue-200/60">
                    <span className="text-[10px] text-blue-900/80 font-semibold block">Linked Platforms:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {otherProfiles.map((p, idx) => (
                        <span key={idx} className="inline-flex items-center px-2.5 py-1 bg-white border border-blue-200 rounded-lg text-xs font-mono text-blue-950">
                          <span>{p.platform}: @{p.username}</span>
                          <button
                            type="button"
                            onClick={() => setOtherProfiles(otherProfiles.filter((_, i) => i !== idx))}
                            className="ml-1.5 text-neutral-400 hover:text-red-600 cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setHandlesModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-neutral-600 hover:bg-neutral-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingHandles}
                  className="bg-neutral-900 hover:bg-black text-white px-5 py-2 rounded-xl text-xs font-semibold transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {savingHandles ? 'Saving...' : 'Save Profiles'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {uploadModalOpen && (
        <ResumeUploadModal onClose={() => setUploadModalOpen(false)} />
      )}

    </div>
  );
};
