import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { logger } from '../../services/logger';
import { 
  DynamicProgram, 
  DynamicDepartment, 
  AdminPermission, 
  College 
} from '../../types';
import { ADMIN_PERMISSION_LABELS } from '../../data/mockData';
import { 
  Building2, 
  Plus, 
  Layers, 
  ShieldCheck, 
  Sparkles, 
  AlertCircle, 
  X, 
  Search, 
  Upload, 
  Download, 
  Trash2, 
  Edit2, 
  Eye, 
  FileSpreadsheet, 
  Lock, 
  Mic, 
  Clock, 
  ArrowLeft, 
  Award, 
  TrendingUp, 
  UserCheck, 
  Check, 
  CheckCircle2, 
  UserPlus,
  Users
} from 'lucide-react';
import { StudentHistoryModal } from '../common/StudentHistoryModal';
import { AssignSessionModal } from '../common/AssignSessionModal';
import { AutoDismissAlert } from '../common/AutoDismissAlert';
import { useBackHandler } from '../../hooks/useBackHandler';

export const SuperAdminPortal: React.FC = () => {
  const { currentUser, assignments } = useApp();

  // Tab navigation: exactly 3 active tabs
  const [activeTab, setActiveTab] = useState<'PROGRAMS' | 'DEPARTMENTS' | 'STUDENTS'>('PROGRAMS');
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [collegeDetails, setCollegeDetails] = useState<College | null>(null);
  const [programs, setPrograms] = useState<DynamicProgram[]>([]);
  const [departments, setDepartments] = useState<DynamicDepartment[]>([]);
  const [students, setStudents] = useState<any[]>([]);

  // Search & Filter in Student Intake
  const [studentSearch, setStudentSearch] = useState('');
  const [filterDept, setFilterDept] = useState('ALL');
  const [filterProgram, setFilterProgram] = useState('ALL');

  // Program Profile Drilldown View (replaces card view with dedicated profile page)
  const [selectedProgramProfile, setSelectedProgramProfile] = useState<{ program: DynamicProgram; subProgramName?: string } | null>(null);

  // Department Progress Modal (with black blurred background)
  const [selectedDeptForProgress, setSelectedDeptForProgress] = useState<DynamicDepartment | null>(null);

  // Modals
  const [createProgramModal, setCreateProgramModal] = useState(false);
  const [editProgramModal, setEditProgramModal] = useState(false);
  const [selectedProgramToEdit, setSelectedProgramToEdit] = useState<DynamicProgram | null>(null);
  const [safeguardDeleteModal, setSafeguardDeleteModal] = useState<{ isOpen: boolean; program: DynamicProgram | null }>({ isOpen: false, program: null });
  const [safeguardInput, setSafeguardInput] = useState('');

  const [createDeptModal, setCreateDeptModal] = useState(false);
  const [singleStudentModal, setSingleStudentModal] = useState(false);
  const [bulkIntakeModal, setBulkIntakeModal] = useState(false);
  const [bulkScrutinyModal, setBulkScrutinyModal] = useState(false);
  const [inspectStudentId, setInspectStudentId] = useState<string | null>(null);

  // Session Assignment Modal state
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignTargetScope, setAssignTargetScope] = useState<'ALL_STUDENTS' | 'PROGRAM' | 'DEPARTMENT'>('PROGRAM');
  const [assignProgramName, setAssignProgramName] = useState('');
  const [assignDepartment, setAssignDepartment] = useState('');

  // Create Program Form state
  const [progName, setProgName] = useState('');
  const [progCode, setProgCode] = useState('');
  const [progDesc, setProgDesc] = useState('');
  const [progHasSub, setProgHasSub] = useState(true);
  const [progSubInput, setProgSubInput] = useState('');
  const [progSubList, setProgSubList] = useState<string[]>(['Elite Track', 'Non-Elite Core Track']);
  const [progAdminFirstName, setProgAdminFirstName] = useState('');
  const [progAdminLastName, setProgAdminLastName] = useState('');
  const [progAdminEmail, setProgAdminEmail] = useState('');
  const [progPermissions, setProgPermissions] = useState<AdminPermission[]>([
    'CAN_VIEW_STUDENT_PROGRESS',
    'CAN_ASSIGN_INTERVIEWS',
    'CAN_ASSIGN_LISTENING',
    'CAN_ASSIGN_TRAINERS',
    'CAN_MANAGE_STUDENTS'
  ]);

  // Edit Program Form state
  const [editProgName, setEditProgName] = useState('');
  const [editProgCode, setEditProgCode] = useState('');
  const [editProgDesc, setEditProgDesc] = useState('');
  const [editProgAdminName, setEditProgAdminName] = useState('');
  const [editProgAdminEmail, setEditProgAdminEmail] = useState('');
  const [editProgPermissions, setEditProgPermissions] = useState<AdminPermission[]>([]);
  const [editProgSubList, setEditProgSubList] = useState<string[]>([]);
  const [editProgSubInput, setEditProgSubInput] = useState('');
  const [editSafeguardCode, setEditSafeguardCode] = useState('');

  // Department Form state
  const [deptName, setDeptName] = useState('');
  const [deptCode, setDeptCode] = useState('');
  const [deptAdminName, setDeptAdminName] = useState('');
  const [deptAdminEmail, setDeptAdminEmail] = useState('');

  // Single Student Intake state
  const [singleStuName, setSingleStuName] = useState('');
  const [singleStuRoll, setSingleStuRoll] = useState('');
  const [singleStuEmail, setSingleStuEmail] = useState('');
  const [singleStuPassword, setSingleStuPassword] = useState('welcome@2026');
  const [singleStuDept, setSingleStuDept] = useState('');
  const [singleStuBatch, setSingleStuBatch] = useState(2026);
  const [singleStuProg, setSingleStuProg] = useState('');
  const [singleStuSubProg, setSingleStuSubProg] = useState('');

  // CSV text states
  const [csvIntakeText, setCsvIntakeText] = useState('');
  const [csvScrutinyText, setCsvScrutinyText] = useState('');

  const collegeId = currentUser?.collegeId || 'col-1';

  // Back gesture handlers for modals and sub-views
  useBackHandler(Boolean(selectedProgramProfile), () => setSelectedProgramProfile(null));
  useBackHandler(Boolean(selectedDeptForProgress), () => setSelectedDeptForProgress(null));
  useBackHandler(createProgramModal, () => setCreateProgramModal(false));
  useBackHandler(editProgramModal, () => setEditProgramModal(false));
  useBackHandler(safeguardDeleteModal.isOpen, () => setSafeguardDeleteModal({ isOpen: false, program: null }));
  useBackHandler(createDeptModal, () => setCreateDeptModal(false));
  useBackHandler(singleStudentModal, () => setSingleStudentModal(false));
  useBackHandler(bulkIntakeModal, () => setBulkIntakeModal(false));
  useBackHandler(bulkScrutinyModal, () => setBulkScrutinyModal(false));

  const loadData = async () => {
    try {
      setLoading(true);
      const [col, progs, depts, stu] = await Promise.all([
        api.college.getDetails(collegeId),
        api.college.getPrograms(collegeId),
        api.college.getDepartments(collegeId),
        api.admin.getStudents()
      ]);
      setCollegeDetails(col);
      setPrograms(progs);
      setDepartments(depts);
      setStudents(stu);
      if (depts.length > 0 && !singleStuDept) {
        setSingleStuDept(depts[0].name);
      }
    } catch (err: any) {
      console.error('Error loading Super Admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [collegeId]);

  // Handle Create Program
  const handleCreateProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!progName.trim() || !progCode.trim()) {
      setFeedback({ type: 'error', message: 'Program name and code are required.' });
      return;
    }
    try {
      const newProg = await api.college.createProgram(collegeId, {
        collegeId,
        name: progName.trim(),
        code: progCode.trim().toUpperCase(),
        description: progDesc.trim(),
        hasSubPrograms: progHasSub,
        subPrograms: progHasSub ? progSubList : [],
        assignedAdminEmail: progAdminEmail.trim() || undefined,
        assignedAdminName: progAdminFirstName.trim() ? `${progAdminFirstName} ${progAdminLastName}`.trim() : undefined,
        adminPermissions: progPermissions,
        canAssignAdminsToPrograms: [],
        isCommonTrainerAllowed: true
      });

      logger.info('PROGRAM', `Program created: ${newProg.name} (${newProg.code})`);
      setFeedback({ type: 'success', message: `Training Program "${newProg.name}" created successfully!` });
      setCreateProgramModal(false);
      resetProgramForm();
      await loadData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to create program.' });
    }
  };

  const resetProgramForm = () => {
    setProgName('');
    setProgCode('');
    setProgDesc('');
    setProgHasSub(true);
    setProgSubList(['Elite Track', 'Non-Elite Core Track']);
    setProgAdminFirstName('');
    setProgAdminLastName('');
    setProgAdminEmail('');
    setProgPermissions(['CAN_VIEW_STUDENT_PROGRESS', 'CAN_ASSIGN_INTERVIEWS', 'CAN_MANAGE_STUDENTS']);
  };

  // Open Edit Program Modal with pre-filled values
  const openEditModal = (prog: DynamicProgram) => {
    setSelectedProgramToEdit(prog);
    setEditProgName(prog.name);
    setEditProgCode(prog.code);
    setEditProgDesc(prog.description || '');
    setEditProgAdminName(prog.assignedAdminName || '');
    setEditProgAdminEmail(prog.assignedAdminEmail || '');
    setEditProgPermissions(prog.adminPermissions || ['CAN_VIEW_STUDENT_PROGRESS', 'CAN_ASSIGN_INTERVIEWS']);
    setEditProgSubList(prog.subPrograms || []);
    setEditProgSubInput('');
    setEditSafeguardCode(prog.code);
    setEditProgramModal(true);
  };

  // Handle Save Edit Program
  const handleSaveProgramEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProgramToEdit) return;

    if (!editProgName.trim() || !editProgCode.trim()) {
      setFeedback({ type: 'error', message: 'Program name and code cannot be empty.' });
      return;
    }

    try {
      await api.college.updateProgram(
        collegeId,
        selectedProgramToEdit.id,
        {
          name: editProgName.trim(),
          code: editProgCode.trim().toUpperCase(),
          description: editProgDesc.trim(),
          assignedAdminName: editProgAdminName.trim() || undefined,
          assignedAdminEmail: editProgAdminEmail.trim() || undefined,
          adminPermissions: editProgPermissions,
          hasSubPrograms: editProgSubList.length > 0,
          subPrograms: editProgSubList
        },
        editSafeguardCode || selectedProgramToEdit.code
      );

      logger.info('PROGRAM', `Program modified: ${editProgName.trim()} (${editProgCode.trim()})`);
      setFeedback({ type: 'success', message: `Program "${editProgName.trim()}" updated successfully!` });
      setEditProgramModal(false);
      setSelectedProgramToEdit(null);
      await loadData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to update program.' });
    }
  };

  // Execute Safeguard Delete
  const executeSafeguardDelete = async () => {
    if (!safeguardDeleteModal.program) return;
    const prog = safeguardDeleteModal.program;
    try {
      await api.college.deleteProgram(collegeId, prog.id, safeguardInput);
      logger.info('PROGRAM', `Program deleted: ${prog.name} (${prog.code})`);
      setFeedback({ type: 'success', message: `Program "${prog.name}" has been permanently removed.` });
      setSafeguardDeleteModal({ isOpen: false, program: null });
      setSafeguardInput('');
      await loadData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Safeguard verification failed.' });
    }
  };

  // Department Creation
  const handleCreateDept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptName.trim() || !deptCode.trim() || !deptAdminName.trim() || !deptAdminEmail.trim()) {
      setFeedback({ type: 'error', message: 'Department name, code, admin name, and admin email are all required.' });
      return;
    }
    try {
      const d = await api.college.createDepartment(collegeId, {
        name: deptName.trim(),
        code: deptCode.trim().toUpperCase(),
        assignedAdminEmail: deptAdminEmail.trim(),
        assignedAdminName: deptAdminName.trim(),
        adminPermissions: ['CAN_VIEW_STUDENT_PROGRESS', 'CAN_MANAGE_STUDENTS']
      });

      logger.info('DEPT', `Department created: ${d.name} (${d.code}) with counselor ${deptAdminName}`);
      setFeedback({ type: 'success', message: `Department "${d.name}" and administrator configured successfully!` });
      setCreateDeptModal(false);
      setDeptName('');
      setDeptCode('');
      setDeptAdminName('');
      setDeptAdminEmail('');
      await loadData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to create department.' });
    }
  };

  // Single Student Intake
  const handleSingleStudentIntake = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleStuName.trim() || !singleStuRoll.trim() || !singleStuEmail.trim() || !singleStuDept) {
      setFeedback({ type: 'error', message: 'Candidate name, roll number, email, and department are required.' });
      return;
    }

    try {
      const enrolled = await api.studentBatch.enrollSingle(collegeId, {
        name: singleStuName.trim(),
        rollNumber: singleStuRoll.trim(),
        email: singleStuEmail.trim(),
        password: singleStuPassword.trim(),
        department: singleStuDept,
        batchYear: singleStuBatch,
        programName: singleStuProg || undefined,
        subProgramName: singleStuSubProg || undefined
      });

      logger.info('STUDENT', `Single intake: ${enrolled.name} (${enrolled.rollNumber}) in ${enrolled.department}`);
      setFeedback({ type: 'success', message: `Student "${enrolled.name}" (${enrolled.rollNumber}) successfully enrolled!` });
      setSingleStudentModal(false);
      setSingleStuName('');
      setSingleStuRoll('');
      setSingleStuEmail('');
      setSingleStuProg('');
      setSingleStuSubProg('');
      await loadData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to enroll student.' });
    }
  };

  // Bulk Student Intake
  const handleBulkIntake = async () => {
    if (!csvIntakeText.trim()) return;
    try {
      const res = await api.studentBatch.bulkEnroll(collegeId, csvIntakeText);
      logger.info('STUDENT', `Bulk intake completed: ${res.count} candidates`);
      setFeedback({ 
        type: 'success', 
        message: `Successfully enrolled ${res.count} students with initial credentials!` 
      });
      setBulkIntakeModal(false);
      setCsvIntakeText('');
      await loadData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Bulk student intake failed.' });
    }
  };

  // Bulk Program Allocation Scrutiny
  const handleBulkScrutiny = async () => {
    if (!csvScrutinyText.trim()) return;
    try {
      const res = await api.studentBatch.bulkAssignPrograms(collegeId, csvScrutinyText);
      logger.info('SCRUTINY', `Allocated programs for ${res.count} candidates`);
      setFeedback({ 
        type: 'success', 
        message: `Successfully allocated training programs for ${res.count} students!` 
      });
      setBulkScrutinyModal(false);
      setCsvScrutinyText('');
      await loadData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Program allocation failed.' });
    }
  };

  const downloadSampleIntakeCSV = () => {
    const content = "Full Name,Roll Number,College Email,Initial Password,Department,Batch Year\n" +
      "Aravind Kumar,22CS1084,aravind.k@college.edu,welcome@2026,Computer Science & Engineering,2026\n" +
      "Priyadharshini M,22IT1042,priya.m@college.edu,welcome@2026,Information Technology,2026\n" +
      "Karthik Raja,22EC1015,karthik.r@college.edu,welcome@2026,Electronics & Communication,2026\n" +
      "Divya Bharathi,22AI1028,divya.b@college.edu,welcome@2026,AI & Data Science,2026";
    const blob = new Blob([content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_student_intake.csv';
    a.click();
  };

  const downloadSampleScrutinyCSV = () => {
    const content = "Roll Number Or Email,Program Name,Sub Program Or Track\n" +
      "22CS1084,Advanced Technical Readiness,Elite Track\n" +
      "priya.m@college.edu,Advanced Technical Readiness,Non-Elite Core Track\n" +
      "22EC1015,Cloud Systems Track,Cloud Architecture & DevOps\n" +
      "22AI1028,AI & Data Track,Machine Learning Engineering";
    const blob = new Blob([content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_program_allocation.csv';
    a.click();
  };

  // Filtered Students
  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(studentSearch.toLowerCase()) || 
      (s.rollNumber && s.rollNumber.toLowerCase().includes(studentSearch.toLowerCase())) ||
      (s.email && s.email.toLowerCase().includes(studentSearch.toLowerCase()));
    const matchesDept = filterDept === 'ALL' || s.department === filterDept;
    const matchesProg = filterProgram === 'ALL' || s.track === filterProgram || s.programName?.includes(filterProgram);
    return matchesSearch && matchesDept && matchesProg;
  });

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 py-8 space-y-8 animate-in fade-in duration-200">
      
      {/* College Super Admin Header */}
      <div className="bg-white border border-neutral-200/80 rounded-2xl p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-200">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
            <span>Institutional Super Administrator</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
            {collegeDetails?.name || "College Management Portal"}
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 max-w-2xl">
            Configure dynamic training programs, academic departments, and delegate granular permissions. Manage candidate intakes and allocate programs post-scrutiny.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => {
              if (programs && programs.length > 0) {
                setAssignTargetScope('PROGRAM');
                setAssignProgramName(programs[0].name);
                setAssignDepartment('');
              } else {
                setAssignTargetScope('DEPARTMENT');
                setAssignProgramName('');
                setAssignDepartment(departments[0]?.name || 'Computer Science & Engineering');
              }
              setAssignModalOpen(true);
            }}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-all shadow-xs flex items-center space-x-2 cursor-pointer"
          >
            <Mic className="w-4 h-4" />
            <span>Assign Assessment</span>
          </button>
          <button
            type="button"
            onClick={() => setCreateProgramModal(true)}
            className="px-4 py-2.5 bg-neutral-900 hover:bg-black text-white rounded-xl text-xs font-medium transition-all shadow-xs flex items-center space-x-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Training Program</span>
          </button>
          <button
            type="button"
            onClick={() => setCreateDeptModal(true)}
            className="px-4 py-2.5 bg-white hover:bg-neutral-50 text-neutral-800 border border-neutral-200 rounded-xl text-xs font-medium transition-all shadow-xs flex items-center space-x-2 cursor-pointer"
          >
            <Building2 className="w-4 h-4" />
            <span>Add Department</span>
          </button>
        </div>
      </div>

      {/* Auto-Dismissing Alert with Reverse Countdown Bar */}
      {feedback && (
        <AutoDismissAlert
          type={feedback.type}
          message={feedback.message}
          durationMs={5000}
          onClose={() => setFeedback(null)}
        />
      )}

      {/* Dispatched Institutional Assessments Bar */}
      {assignments && assignments.length > 0 && (
        <div className="bg-white border border-neutral-200/90 rounded-2xl p-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-neutral-900 text-white flex items-center justify-center shrink-0">
                <Mic className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-neutral-900">
                  Dispatched Assessments &amp; Practice Drills ({assignments.length})
                </h3>
                <p className="text-[10px] text-neutral-500">
                  Institutional rounds, voice mock timers, and listening labs
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                if (programs && programs.length > 0) {
                  setAssignTargetScope('PROGRAM');
                  setAssignProgramName(programs[0].name);
                  setAssignDepartment('');
                } else {
                  setAssignTargetScope('DEPARTMENT');
                  setAssignProgramName('');
                  setAssignDepartment(departments[0]?.name || 'Computer Science & Engineering');
                }
                setAssignModalOpen(true);
              }}
              className="self-start sm:self-auto px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Dispatch Another Drill</span>
            </button>
          </div>

          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {assignments.slice(0, 6).map((asg) => {
              const compCount = asg.submissions?.length || 0;
              return (
                <div key={asg.id} className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-neutral-200 text-neutral-800">
                      {asg.sessionType === 'MOCK_INTERVIEW' ? 'VOICE AI' : asg.sessionType === 'LISTENING_COMPREHENSION' ? 'AUDIO LAB' : 'COMBINED'}
                    </span>
                    <span className="text-[10px] text-neutral-500 font-mono">
                      Due: {asg.dueDate}
                    </span>
                  </div>
                  <h4 className="font-bold text-neutral-900 truncate">{asg.title}</h4>
                  <div className="flex items-center justify-between text-[10px] text-neutral-500">
                    <span className="truncate max-w-[130px]">{asg.targetProgramName || asg.targetDepartment || asg.targetDomainOrTrack || 'All Batches'}</span>
                    <span className="font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                      {compCount} submitted
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3 Active Navigation Tabs */}
      <div className="flex border-b border-neutral-200/80 space-x-8 text-xs font-medium">
        <button
          onClick={() => {
            setActiveTab('PROGRAMS');
            setSelectedProgramProfile(null);
          }}
          className={`pb-3.5 border-b-2 flex items-center space-x-2 transition-colors cursor-pointer ${
            activeTab === 'PROGRAMS' 
              ? 'border-neutral-900 text-neutral-900 font-bold' 
              : 'border-transparent text-neutral-500 hover:text-neutral-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Dynamic Programs &amp; Sub-programs ({programs.length})</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('DEPARTMENTS');
            setSelectedProgramProfile(null);
          }}
          className={`pb-3.5 border-b-2 flex items-center space-x-2 transition-colors cursor-pointer ${
            activeTab === 'DEPARTMENTS' 
              ? 'border-neutral-900 text-neutral-900 font-bold' 
              : 'border-transparent text-neutral-500 hover:text-neutral-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Departments &amp; Admins ({departments.length})</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('STUDENTS');
            setSelectedProgramProfile(null);
          }}
          className={`pb-3.5 border-b-2 flex items-center space-x-2 transition-colors cursor-pointer ${
            activeTab === 'STUDENTS' 
              ? 'border-neutral-900 text-neutral-900 font-bold' 
              : 'border-transparent text-neutral-500 hover:text-neutral-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Student Intake &amp; Scrutiny ({students.length})</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: DYNAMIC PROGRAMS & SUB-PROGRAMS */}
      {/* ========================================================================= */}
      {activeTab === 'PROGRAMS' && (
        <div className="space-y-6">
          
          {/* If viewing a specific Program Profile */}
          {selectedProgramProfile ? (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              {/* Back Navigation Bar */}
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setSelectedProgramProfile(null)}
                  className="inline-flex items-center space-x-2 text-xs font-semibold text-neutral-700 hover:text-neutral-950 bg-white hover:bg-neutral-50 px-3.5 py-2 rounded-xl border border-neutral-200 transition-colors shadow-2xs cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Programs Directory</span>
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAssignTargetScope('PROGRAM');
                      setAssignProgramName(selectedProgramProfile.program.name);
                      setAssignDepartment('');
                      setAssignModalOpen(true);
                    }}
                    className="inline-flex items-center space-x-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 rounded-xl transition-colors cursor-pointer shadow-xs"
                  >
                    <Mic className="w-3.5 h-3.5" />
                    <span>Assign Assessment to this Program</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => openEditModal(selectedProgramProfile.program)}
                    className="inline-flex items-center space-x-1.5 text-xs font-medium text-neutral-700 bg-white hover:bg-neutral-50 px-3 py-1.5 rounded-xl border border-neutral-200 transition-colors cursor-pointer shadow-2xs"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit Program</span>
                  </button>
                </div>
              </div>

              {/* Program Profile Header Banner */}
              <div className="bg-white border border-neutral-200/80 rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-neutral-100 text-neutral-800 border border-neutral-200">
                        {selectedProgramProfile.program.code}
                      </span>
                      {selectedProgramProfile.subProgramName && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                          {selectedProgramProfile.subProgramName}
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center space-x-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span>Active Dynamic Track</span>
                      </span>
                    </div>
                    <h2 className="text-xl font-bold tracking-tight text-neutral-900">
                      {selectedProgramProfile.program.name}
                      {selectedProgramProfile.subProgramName ? ` — ${selectedProgramProfile.subProgramName}` : ''}
                    </h2>
                    <p className="text-xs text-neutral-500 max-w-2xl">
                      {selectedProgramProfile.program.description || 'Custom institutional curriculum track evaluating student technical readiness and communication proficiency.'}
                    </p>
                  </div>

                  <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 text-xs space-y-1 sm:text-right">
                    <span className="text-[10px] text-neutral-400 block uppercase font-mono">Assigned Lead Admin</span>
                    <div className="font-semibold text-neutral-900">{selectedProgramProfile.program.assignedAdminName || 'Lead Mentor'}</div>
                    <div className="text-[11px] font-mono text-neutral-500">{selectedProgramProfile.program.assignedAdminEmail || 'Not assigned'}</div>
                  </div>
                </div>

                {/* 4 Program Telemetry KPI Boxes */}
                {(() => {
                  const enrolledInProg = students.filter(s => {
                    const matchesP = s.programName === selectedProgramProfile.program.name || s.track?.includes(selectedProgramProfile.program.name);
                    if (selectedProgramProfile.subProgramName) {
                      return matchesP && (s.subProgramName === selectedProgramProfile.subProgramName || s.track?.includes(selectedProgramProfile.subProgramName));
                    }
                    return matchesP;
                  });
                  const highPerformers = enrolledInProg.filter(s => (s.score || 70) >= 75);
                  const avgScore = enrolledInProg.length > 0 
                    ? Math.round(enrolledInProg.reduce((acc, s) => acc + (s.score || 70), 0) / enrolledInProg.length)
                    : 74;

                  return (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-neutral-100">
                      <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200/80">
                        <span className="text-[11px] font-medium text-neutral-500 block">Enrolled Students</span>
                        <div className="text-2xl font-bold text-neutral-900 mt-1">{enrolledInProg.length}</div>
                        <span className="text-[10px] text-neutral-400">Total active candidates</span>
                      </div>

                      <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200/80">
                        <span className="text-[11px] font-medium text-neutral-500 block">Assessments Assigned</span>
                        <div className="text-2xl font-bold text-blue-600 mt-1">6</div>
                        <span className="text-[10px] text-neutral-400">Voice &amp; Audio Drills</span>
                      </div>

                      <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200/80">
                        <span className="text-[11px] font-medium text-neutral-500 block">Top Performers (&gt;75%)</span>
                        <div className="text-2xl font-bold text-emerald-600 mt-1">
                          {highPerformers.length}
                          <span className="text-xs font-normal text-emerald-700 ml-1">
                            ({enrolledInProg.length > 0 ? Math.round((highPerformers.length / enrolledInProg.length) * 100) : 0}%)
                          </span>
                        </div>
                        <span className="text-[10px] text-emerald-600 font-medium">Placement Ready</span>
                      </div>

                      <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200/80">
                        <span className="text-[11px] font-medium text-neutral-500 block">Average Readiness</span>
                        <div className="text-2xl font-bold text-neutral-900 mt-1">{avgScore}%</div>
                        <span className="text-[10px] text-neutral-400">Cohort average score</span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Program Activity Logs */}
              <div className="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-xs space-y-3">
                <div className="flex items-center space-x-2 text-xs font-bold text-neutral-900 uppercase tracking-wider">
                  <Clock className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Program Activity Logs &amp; Milestones</span>
                </div>
                <div className="space-y-2 font-mono text-[11px] bg-neutral-950 text-neutral-300 p-4 rounded-xl border border-neutral-800">
                  <div className="flex items-center space-x-2">
                    <span className="text-neutral-500">[2026-09-29 09:15:20]</span>
                    <span className="text-emerald-400">[ASSIGN]</span>
                    <span>Distributed Systems &amp; Concurrency Mock Drill assigned to cohort</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-neutral-500">[2026-09-28 14:10:05]</span>
                    <span className="text-blue-400">[SCRUTINY]</span>
                    <span>Allocated 42 candidates into program based on coding benchmark</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-neutral-500">[2026-09-27 11:30:44]</span>
                    <span className="text-purple-400">[MENTOR]</span>
                    <span>Lead mentor {selectedProgramProfile.program.assignedAdminName || 'Admin'} active with 5 delegated rule sets</span>
                  </div>
                </div>
              </div>

              {/* Enrolled Students in this Program */}
              <div className="bg-white border border-neutral-200/80 rounded-2xl shadow-xs overflow-hidden space-y-3 p-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-neutral-900">Enrolled Candidates</h3>
                  <span className="text-xs text-neutral-500 font-mono">
                    {students.filter(s => s.programName === selectedProgramProfile.program.name || s.track?.includes(selectedProgramProfile.program.name)).length} students active
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-neutral-50/70 border-b border-neutral-200/80 text-neutral-500 font-medium">
                        <th className="py-3 px-4">Candidate</th>
                        <th className="py-3 px-4">Roll Number</th>
                        <th className="py-3 px-4">Department</th>
                        <th className="py-3 px-4">Sub-Track</th>
                        <th className="py-3 px-4">Readiness Score</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200/60">
                      {students
                        .filter(s => s.programName === selectedProgramProfile.program.name || s.track?.includes(selectedProgramProfile.program.name))
                        .map(s => (
                          <tr key={s.id} className="hover:bg-neutral-50/50">
                            <td className="py-3 px-4 font-semibold text-neutral-900">
                              <button
                                type="button"
                                onClick={() => setInspectStudentId(s.id)}
                                className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                              >
                                {s.name}
                              </button>
                            </td>
                            <td className="py-3 px-4 font-mono text-neutral-500">{s.rollNumber || '—'}</td>
                            <td className="py-3 px-4 text-neutral-700">{s.department}</td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 bg-neutral-100 rounded text-[10px] font-mono">
                                {s.subProgramName || 'General Track'}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`font-bold ${s.score >= 75 ? 'text-emerald-600' : 'text-amber-600'}`}>
                                {s.score || 70}%
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                type="button"
                                onClick={() => setInspectStudentId(s.id)}
                                className="px-2.5 py-1 text-xs bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-lg cursor-pointer"
                              >
                                Inspect Profile
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          ) : (
            /* Program Directory List View */
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-semibold text-neutral-900">Custom Institutional Training Programs</h2>
                  <p className="text-xs text-neutral-500">
                    Programs and sub-programs tailored dynamically for your institution. Click any program to inspect its profile, telemetry, and enrolled cohort.
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setCreateProgramModal(true)}
                    className="px-4 py-2 bg-neutral-900 text-white text-xs font-semibold rounded-xl hover:bg-black flex items-center space-x-1.5 shadow-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Define New Program</span>
                  </button>
                </div>
              </div>

              {programs.length === 0 ? (
                <div className="bg-white border border-dashed border-neutral-300 rounded-2xl p-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-neutral-100 text-neutral-400 mx-auto flex items-center justify-center">
                    <Layers className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-neutral-900">No Institutional Programs Configured</h3>
                    <p className="text-xs text-neutral-500 max-w-md mx-auto mt-1">
                      Your college does not have any active programs yet. Click &quot;Define New Program&quot; to configure custom tracks.
                    </p>
                  </div>
                  <button
                    onClick={() => setCreateProgramModal(true)}
                    className="mt-2 inline-flex items-center space-x-1.5 px-4 py-2 bg-neutral-900 text-white text-xs font-medium rounded-xl hover:bg-black shadow-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Define First Program</span>
                  </button>
                </div>
              ) : (
                /* Elegant List/Table Layout for Programs */
                <div className="bg-white border border-neutral-200/80 rounded-2xl shadow-xs overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-neutral-50/70 border-b border-neutral-200/80 text-neutral-500 font-medium">
                        <th className="py-3.5 px-5">Program Name &amp; Code</th>
                        <th className="py-3.5 px-5">Sub-Programs / Tracks</th>
                        <th className="py-3.5 px-5">Lead Admin / Mentor</th>
                        <th className="py-3.5 px-5">Delegated Rule Sets</th>
                        <th className="py-3.5 px-5">Enrolled</th>
                        <th className="py-3.5 px-5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200/60">
                      {programs.map((prog) => {
                        const enrolledCount = students.filter(s => s.programName === prog.name || s.track?.includes(prog.name)).length;
                        return (
                          <tr 
                            key={prog.id} 
                            className="hover:bg-neutral-50/60 transition-colors group"
                          >
                            <td 
                              className="py-4 px-5 cursor-pointer"
                              onClick={() => setSelectedProgramProfile({ program: prog })}
                            >
                              <div className="flex items-center space-x-2">
                                <span className="font-semibold text-neutral-900 text-sm group-hover:text-blue-600 transition-colors">
                                  {prog.name}
                                </span>
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-neutral-100 text-neutral-700 border border-neutral-200">
                                  {prog.code}
                                </span>
                              </div>
                              {prog.description && (
                                <p className="text-[11px] text-neutral-500 line-clamp-1 mt-0.5">{prog.description}</p>
                              )}
                            </td>

                            <td className="py-4 px-5">
                              {prog.hasSubPrograms && prog.subPrograms && prog.subPrograms.length > 0 ? (
                                <div className="flex flex-wrap gap-1.5">
                                  {prog.subPrograms.map((sub, idx) => (
                                    <button
                                      key={idx}
                                      type="button"
                                      onClick={() => setSelectedProgramProfile({ program: prog, subProgramName: sub })}
                                      className="px-2 py-0.5 rounded-md bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-[10px] font-medium transition-colors cursor-pointer"
                                      title={`View ${sub} Profile`}
                                    >
                                      {sub}
                                    </button>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-[11px] text-neutral-400 italic">Single Unified Track</span>
                              )}
                            </td>

                            <td className="py-4 px-5">
                              {prog.assignedAdminEmail ? (
                                <div>
                                  <div className="font-semibold text-neutral-800">{prog.assignedAdminName || 'Lead Admin'}</div>
                                  <div className="text-[10px] font-mono text-neutral-400">{prog.assignedAdminEmail}</div>
                                </div>
                              ) : (
                                <span className="text-neutral-400 italic">No admin assigned</span>
                              )}
                            </td>

                            <td className="py-4 px-5">
                              <div className="flex flex-wrap gap-1">
                                {(prog.adminPermissions || []).slice(0, 3).map(p => (
                                  <span key={p} className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[9px] font-medium">
                                    {p.replace('CAN_', '').replace(/_/g, ' ')}
                                  </span>
                                ))}
                                {(prog.adminPermissions?.length || 0) > 3 && (
                                  <span className="text-[10px] text-neutral-400">+{prog.adminPermissions!.length - 3}</span>
                                )}
                              </div>
                            </td>

                            <td className="py-4 px-5">
                              <span className="font-bold text-neutral-900">{enrolledCount}</span>
                              <span className="text-[10px] text-neutral-400 ml-1">students</span>
                            </td>

                            <td className="py-4 px-5 text-right">
                              <div className="inline-flex items-center space-x-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setAssignTargetScope('PROGRAM');
                                    setAssignProgramName(prog.name);
                                    setAssignDepartment('');
                                    setAssignModalOpen(true);
                                  }}
                                  className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg transition-colors cursor-pointer mr-1"
                                  title={`Assign Assessment to ${prog.name}`}
                                >
                                  <Mic className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Assign</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setSelectedProgramProfile({ program: prog })}
                                  className="p-1.5 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                  title="View Program Profile & Telemetry"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openEditModal(prog)}
                                  className="p-1.5 text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
                                  title="Edit Program"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSafeguardDeleteModal({ isOpen: true, program: prog });
                                    setSafeguardInput('');
                                  }}
                                  className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                  title="Delete Program"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: DEPARTMENTS & ADMINS */}
      {/* ========================================================================= */}
      {activeTab === 'DEPARTMENTS' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-neutral-900">Academic Departments &amp; Admins</h2>
              <p className="text-xs text-neutral-500">
                Departments must be defined before adding students. Click any department to view its detailed progress and student performance in a modal.
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setCreateDeptModal(true)}
                className="px-4 py-2 bg-neutral-900 text-white text-xs font-semibold rounded-xl hover:bg-black flex items-center space-x-1.5 shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Department</span>
              </button>
            </div>
          </div>

          <div className="bg-white border border-neutral-200/80 rounded-2xl shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-neutral-50/70 border-b border-neutral-200/80 text-neutral-500 font-medium">
                  <th className="py-3.5 px-5">Department Name &amp; Code</th>
                  <th className="py-3.5 px-5">Department Admin (Counselor)</th>
                  <th className="py-3.5 px-5">Admin Email (User ID)</th>
                  <th className="py-3.5 px-5">Enrolled Cohort</th>
                  <th className="py-3.5 px-5">Avg Readiness</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200/60">
                {departments.map((dept) => {
                  const deptStudents = students.filter(s => s.department === dept.name);
                  const avgScore = deptStudents.length > 0 
                    ? Math.round(deptStudents.reduce((acc, s) => acc + (s.score || 70), 0) / deptStudents.length)
                    : 72;

                  return (
                    <tr 
                      key={dept.id} 
                      onClick={() => setSelectedDeptForProgress(dept)}
                      className="hover:bg-neutral-50/60 transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 px-5">
                        <div className="font-semibold text-neutral-900 text-sm group-hover:text-blue-600 transition-colors">
                          {dept.name}
                        </div>
                        <span className="text-[10px] font-mono text-neutral-400">{dept.code}</span>
                      </td>
                      <td className="py-3.5 px-5 text-neutral-800 font-medium">
                        {dept.assignedAdminName || 'Head of Department'}
                      </td>
                      <td className="py-3.5 px-5 font-mono text-neutral-500">
                        {dept.assignedAdminEmail || 'admin.' + dept.code.toLowerCase() + '@college.edu'}
                      </td>
                      <td className="py-3.5 px-5">
                        <span className="font-bold text-neutral-900">{deptStudents.length}</span>
                        <span className="text-[10px] text-neutral-400 ml-1">students</span>
                      </td>
                      <td className="py-3.5 px-5">
                        <span className={`font-bold ${avgScore >= 75 ? 'text-emerald-600' : 'text-neutral-900'}`}>
                          {avgScore}%
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <div className="inline-flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setAssignTargetScope('DEPARTMENT');
                              setAssignDepartment(dept.name);
                              setAssignProgramName('');
                              setAssignModalOpen(true);
                            }}
                            className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-semibold rounded-lg text-xs transition-colors cursor-pointer inline-flex items-center space-x-1"
                            title={`Assign Assessment to ${dept.name}`}
                          >
                            <Mic className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Assign Drill</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDeptForProgress(dept);
                            }}
                            className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-semibold rounded-lg text-xs transition-colors cursor-pointer"
                          >
                            View Progress
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: STUDENT INTAKE & SCRUTINY ALLOCATION */}
      {/* ========================================================================= */}
      {activeTab === 'STUDENTS' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-neutral-900">Student Intake &amp; Program Scrutiny</h2>
              <p className="text-xs text-neutral-500">
                Enroll candidates individually or via batch CSV. Allocate training tracks post-scrutiny. Click any candidate name to open their complete profile dossier.
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setSingleStudentModal(true)}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-xs cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ Intake Single Student</span>
              </button>
              <button
                type="button"
                onClick={() => setBulkIntakeModal(true)}
                className="px-3.5 py-2 bg-neutral-900 hover:bg-black text-white rounded-xl text-xs font-medium flex items-center space-x-1.5 shadow-xs cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>1. Bulk Student Intake (CSV)</span>
              </button>
              <button
                type="button"
                onClick={() => setBulkScrutinyModal(true)}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-medium flex items-center space-x-1.5 shadow-xs cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>2. Allocate Programs (Scrutiny CSV)</span>
              </button>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="bg-white border border-neutral-200/80 rounded-2xl p-4 shadow-xs flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-neutral-400" />
              <input
                type="text"
                placeholder="Search by student name, roll number, or email..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs focus:outline-none focus:border-neutral-900"
              />
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs text-neutral-500">Dept:</span>
              <select
                value={filterDept}
                onChange={(e) => setFilterDept(e.target.value)}
                className="bg-neutral-50 border border-neutral-200 rounded-xl px-2.5 py-1.5 text-xs text-neutral-700 focus:outline-none"
              >
                <option value="ALL">All Departments</option>
                {departments.map(d => (
                  <option key={d.id} value={d.name}>{d.code}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs text-neutral-500">Program:</span>
              <select
                value={filterProgram}
                onChange={(e) => setFilterProgram(e.target.value)}
                className="bg-neutral-50 border border-neutral-200 rounded-xl px-2.5 py-1.5 text-xs text-neutral-700 focus:outline-none"
              >
                <option value="ALL">All Programs</option>
                {programs.map(p => (
                  <option key={p.id} value={p.name}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Students Roster Table */}
          <div className="bg-white border border-neutral-200/80 rounded-2xl shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-neutral-50/70 border-b border-neutral-200/80 text-neutral-500 font-medium">
                  <th className="py-3.5 px-5">Candidate Name &amp; Roll No</th>
                  <th className="py-3.5 px-5">College Email</th>
                  <th className="py-3.5 px-5">Department</th>
                  <th className="py-3.5 px-5">Assigned Program &amp; Sub-Track</th>
                  <th className="py-3.5 px-5">Readiness Score</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200/60">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-neutral-400">
                      No candidates match your search filters.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((s) => (
                    <tr key={s.id} className="hover:bg-neutral-50/50">
                      <td className="py-3.5 px-5">
                        <button
                          type="button"
                          onClick={() => setInspectStudentId(s.id)}
                          className="font-semibold text-neutral-900 hover:text-blue-600 hover:underline cursor-pointer text-left block"
                        >
                          {s.name}
                        </button>
                        <div className="text-[11px] font-mono text-neutral-400">{s.rollNumber || 'No Roll No'}</div>
                      </td>
                      <td className="py-3.5 px-5 font-mono text-neutral-600">
                        {s.email}
                      </td>
                      <td className="py-3.5 px-5 text-neutral-700">
                        {s.department}
                      </td>
                      <td className="py-3.5 px-5">
                        <div className="flex items-center space-x-1.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                            s.track?.includes('Elite') || s.subProgramName?.includes('Elite')
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : s.programName
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-neutral-100 text-neutral-700 border-neutral-200'
                          }`}>
                            {s.programName || s.track || 'General Department'}
                          </span>
                          {s.subProgramName && (
                            <span className="text-[10px] text-neutral-500 font-mono">
                              ({s.subProgramName})
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-5">
                        <div className="flex items-center space-x-2">
                          <div className="w-16 bg-neutral-100 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${s.score >= 75 ? 'bg-emerald-500' : s.score >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                              style={{ width: `${s.score || 65}%` }}
                            />
                          </div>
                          <span className="font-bold text-neutral-900">{s.score || 65}%</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <div className="inline-flex items-center space-x-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setAssignTargetScope('DEPARTMENT');
                              setAssignDepartment(s.department || 'Computer Science & Engineering');
                              setAssignProgramName('');
                              setAssignModalOpen(true);
                            }}
                            className="px-2.5 py-1 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer inline-flex items-center space-x-1"
                            title={`Assign Assessment to ${s.name}'s cohort`}
                          >
                            <Mic className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Assign</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setInspectStudentId(s.id)}
                            className="px-2.5 py-1 text-xs font-medium text-neutral-700 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors cursor-pointer"
                          >
                            View Profile
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDIT PROGRAM (WORKING & COMPLETE) */}
      {/* ========================================================================= */}
      {editProgramModal && selectedProgramToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-neutral-200 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-neutral-200 flex items-center justify-between bg-neutral-50/70 shrink-0">
              <div className="flex items-center space-x-2">
                <Edit2 className="w-4 h-4 text-neutral-900" />
                <h3 className="text-sm font-semibold text-neutral-900">Edit Training Program: {selectedProgramToEdit.name}</h3>
              </div>
              <button onClick={() => setEditProgramModal(false)} className="text-neutral-400 hover:text-neutral-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProgramEdit} className="p-6 space-y-4 text-xs overflow-y-auto">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block font-medium text-neutral-700 mb-1">Program Name *</label>
                  <input
                    type="text"
                    required
                    value={editProgName}
                    onChange={(e) => setEditProgName(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-neutral-900"
                  />
                </div>
                <div>
                  <label className="block font-medium text-neutral-700 mb-1">Code *</label>
                  <input
                    type="text"
                    required
                    value={editProgCode}
                    onChange={(e) => setEditProgCode(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl font-mono uppercase focus:outline-none focus:border-neutral-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-neutral-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editProgDesc}
                  onChange={(e) => setEditProgDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-neutral-900"
                />
              </div>

              {/* Sub-Programs Management: Add & Remove */}
              <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-neutral-900">Sub-Programs / Specialized Tracks</span>
                  <span className="text-[11px] text-neutral-500">{editProgSubList.length} Tracks Configured</span>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="Add new subprogram track name..."
                    value={editProgSubInput}
                    onChange={(e) => setEditProgSubInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (editProgSubInput.trim() && !editProgSubList.includes(editProgSubInput.trim())) {
                          setEditProgSubList([...editProgSubList, editProgSubInput.trim()]);
                          setEditProgSubInput('');
                        }
                      }
                    }}
                    className="flex-1 px-3 py-1.5 bg-white border border-neutral-200 rounded-lg text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (editProgSubInput.trim() && !editProgSubList.includes(editProgSubInput.trim())) {
                        setEditProgSubList([...editProgSubList, editProgSubInput.trim()]);
                        setEditProgSubInput('');
                      }
                    }}
                    className="px-3 py-1.5 bg-neutral-900 text-white rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    Add
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {editProgSubList.map((sub) => (
                    <span key={sub} className="inline-flex items-center px-2.5 py-1 bg-white border border-neutral-200 rounded-lg text-xs font-medium text-neutral-800">
                      <span>{sub}</span>
                      <button
                        type="button"
                        onClick={() => setEditProgSubList(editProgSubList.filter(s => s !== sub))}
                        className="ml-1.5 text-neutral-400 hover:text-red-600 cursor-pointer"
                        title="Remove track"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Reassign Mentor / Lead Admin */}
              <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-200/80 space-y-3">
                <span className="font-semibold text-blue-950 block">Reassign Program Administrator / Mentor</span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-neutral-600 mb-1">Admin / Mentor Name</label>
                    <input
                      type="text"
                      value={editProgAdminName}
                      onChange={(e) => setEditProgAdminName(e.target.value)}
                      placeholder="e.g. Dr. K. Swaminathan"
                      className="w-full px-3 py-2 bg-white border border-blue-200 rounded-xl focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-neutral-600 mb-1">Admin Email (User ID)</label>
                    <input
                      type="email"
                      value={editProgAdminEmail}
                      onChange={(e) => setEditProgAdminEmail(e.target.value)}
                      placeholder="admin@college.edu"
                      className="w-full px-3 py-2 bg-white border border-blue-200 rounded-xl font-mono focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Delegated Rule Sets Checklist */}
              <div className="space-y-2">
                <span className="font-semibold text-neutral-900 block">Delegated Rule Sets &amp; Permissions:</span>
                <div className="space-y-1.5 border border-neutral-200 rounded-xl p-3 bg-neutral-50/50">
                  {Object.entries(ADMIN_PERMISSION_LABELS).map(([permKey, meta]) => {
                    const checked = editProgPermissions.includes(permKey as AdminPermission);
                    return (
                      <div
                        key={permKey}
                        onClick={() => {
                          if (checked) {
                            setEditProgPermissions(editProgPermissions.filter(p => p !== permKey));
                          } else {
                            setEditProgPermissions([...editProgPermissions, permKey as AdminPermission]);
                          }
                        }}
                        className={`p-2 rounded-lg border flex items-center justify-between cursor-pointer transition-colors ${
                          checked ? 'bg-white border-neutral-300 shadow-2xs' : 'border-transparent hover:bg-neutral-100'
                        }`}
                      >
                        <div>
                          <div className="font-semibold text-neutral-900">{meta.label}</div>
                          <div className="text-[10px] text-neutral-500">{meta.desc}</div>
                        </div>
                        <div className={`w-4 h-4 rounded flex items-center justify-center border ${
                          checked ? 'bg-neutral-900 border-neutral-900 text-white' : 'border-neutral-300 bg-white'
                        }`}>
                          {checked && <Check className="w-3 h-3" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Safeguard Verification Code */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 space-y-1.5">
                <div className="flex items-center space-x-1.5 font-bold text-[11px]">
                  <Lock className="w-3.5 h-3.5 text-amber-600" />
                  <span>Safeguard Verification</span>
                </div>
                <p className="text-[10px] text-amber-800">
                  Type program code <strong className="font-mono">{selectedProgramToEdit.code}</strong> or <strong className="font-mono">CONFIRM_MODIFY</strong> to authorize modifications:
                </p>
                <input
                  type="text"
                  required
                  placeholder={selectedProgramToEdit.code}
                  value={editSafeguardCode}
                  onChange={(e) => setEditSafeguardCode(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-lg font-mono text-xs focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setEditProgramModal(false)}
                  className="px-4 py-2 border border-neutral-200 text-neutral-600 rounded-xl hover:bg-neutral-50 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-neutral-900 text-white rounded-xl hover:bg-black font-semibold shadow-xs cursor-pointer"
                >
                  Save Modifications
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: DEPARTMENT PROGRESS MODAL (BLACK BLURRED BACKGROUND) */}
      {/* ========================================================================= */}
      {selectedDeptForProgress && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-neutral-200 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[88vh]">
            <div className="p-6 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/70">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-neutral-900 text-white flex items-center justify-center shadow-xs">
                  <Building2 className="w-5 h-5 text-neutral-100" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-neutral-900">{selectedDeptForProgress.name}</h2>
                  <p className="text-xs text-neutral-500 font-mono">
                    Code: {selectedDeptForProgress.code} · Counselor: {selectedDeptForProgress.assignedAdminName || 'HOD'} ({selectedDeptForProgress.assignedAdminEmail || 'Active'})
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    const deptName = selectedDeptForProgress.name;
                    setSelectedDeptForProgress(null);
                    setAssignTargetScope('DEPARTMENT');
                    setAssignDepartment(deptName);
                    setAssignProgramName('');
                    setAssignModalOpen(true);
                  }}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer shadow-xs"
                >
                  <Mic className="w-3.5 h-3.5" />
                  <span>Assign Drill to {selectedDeptForProgress.code}</span>
                </button>
                <button 
                  type="button"
                  onClick={() => setSelectedDeptForProgress(null)}
                  className="p-2 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-full transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto text-xs">
              {(() => {
                const deptStudents = students.filter(s => s.department === selectedDeptForProgress.name);
                const avgScore = deptStudents.length > 0
                  ? Math.round(deptStudents.reduce((acc, s) => acc + (s.score || 70), 0) / deptStudents.length)
                  : 72;
                const topCount = deptStudents.filter(s => (s.score || 70) >= 75).length;
                const midCount = deptStudents.filter(s => (s.score || 70) >= 60 && (s.score || 70) < 75).length;
                const needCount = deptStudents.filter(s => (s.score || 70) < 60).length;

                return (
                  <>
                    {/* Performance Summary Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-200">
                        <span className="text-[11px] text-neutral-500 block">Total Enrolled</span>
                        <div className="text-xl font-bold text-neutral-900 mt-0.5">{deptStudents.length}</div>
                        <span className="text-[10px] text-neutral-400">Candidates in Dept</span>
                      </div>

                      <div className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-200">
                        <span className="text-[11px] text-neutral-500 block">Avg Readiness</span>
                        <div className="text-xl font-bold text-neutral-900 mt-0.5">{avgScore}%</div>
                        <span className="text-[10px] text-neutral-400">Placement benchmark</span>
                      </div>

                      <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200">
                        <span className="text-[11px] text-emerald-800 block">Placement Ready</span>
                        <div className="text-xl font-bold text-emerald-700 mt-0.5">{topCount}</div>
                        <span className="text-[10px] text-emerald-600 font-medium">Score &gt;= 75%</span>
                      </div>

                      <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200">
                        <span className="text-[11px] text-amber-800 block">Needs Practice</span>
                        <div className="text-xl font-bold text-amber-700 mt-0.5">{needCount}</div>
                        <span className="text-[10px] text-amber-600 font-medium">Score &lt; 60%</span>
                      </div>
                    </div>

                    {/* Progress Roster */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-neutral-900 text-xs uppercase tracking-wider">Department Student Roster</span>
                        <span className="text-[11px] text-neutral-500">{deptStudents.length} Students Listed</span>
                      </div>

                      <div className="border border-neutral-200 rounded-2xl overflow-hidden">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-medium">
                              <th className="py-2.5 px-4">Candidate</th>
                              <th className="py-2.5 px-4">Roll Number</th>
                              <th className="py-2.5 px-4">Assigned Program</th>
                              <th className="py-2.5 px-4">Readiness</th>
                              <th className="py-2.5 px-4 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-neutral-100">
                            {deptStudents.length === 0 ? (
                              <tr>
                                <td colSpan={5} className="py-6 text-center text-neutral-400">
                                  No candidates currently enrolled in {selectedDeptForProgress.name}.
                                </td>
                              </tr>
                            ) : (
                              deptStudents.map(s => (
                                <tr key={s.id} className="hover:bg-neutral-50/50">
                                  <td className="py-2.5 px-4 font-semibold text-neutral-900">{s.name}</td>
                                  <td className="py-2.5 px-4 font-mono text-neutral-500">{s.rollNumber || '—'}</td>
                                  <td className="py-2.5 px-4">
                                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-neutral-100">
                                      {s.programName || s.track || 'General Stream'}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-4">
                                    <span className={`font-bold ${s.score >= 75 ? 'text-emerald-600' : 'text-neutral-900'}`}>
                                      {s.score || 70}%
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-4 text-right">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedDeptForProgress(null);
                                        setInspectStudentId(s.id);
                                      }}
                                      className="text-xs text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                                    >
                                      Inspect
                                    </button>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: SINGLE STUDENT INTAKE (BLACK BLURRED BACKGROUND) */}
      {/* ========================================================================= */}
      {singleStudentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-neutral-200 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-neutral-200 flex items-center justify-between bg-neutral-50/70 shrink-0">
              <div className="flex items-center space-x-2">
                <UserPlus className="w-4 h-4 text-neutral-900" />
                <h3 className="text-sm font-semibold text-neutral-900">Intake Single Candidate</h3>
              </div>
              <button onClick={() => setSingleStudentModal(false)} className="text-neutral-400 hover:text-neutral-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSingleStudentIntake} className="p-6 space-y-4 text-xs overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-neutral-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sudharshan R"
                    value={singleStuName}
                    onChange={(e) => setSingleStuName(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-neutral-900"
                  />
                </div>
                <div>
                  <label className="block font-medium text-neutral-700 mb-1">Roll Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 22CS1099"
                    value={singleStuRoll}
                    onChange={(e) => setSingleStuRoll(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl font-mono uppercase focus:outline-none focus:border-neutral-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-neutral-700 mb-1">College Email (User ID) *</label>
                  <input
                    type="email"
                    required
                    placeholder="student@college.edu"
                    value={singleStuEmail}
                    onChange={(e) => setSingleStuEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl font-mono focus:outline-none focus:border-neutral-900"
                  />
                </div>
                <div>
                  <label className="block font-medium text-neutral-700 mb-1">Initial Password *</label>
                  <input
                    type="text"
                    required
                    value={singleStuPassword}
                    onChange={(e) => setSingleStuPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl font-mono focus:outline-none focus:border-neutral-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-neutral-700 mb-1">Academic Department *</label>
                  <select
                    required
                    value={singleStuDept}
                    onChange={(e) => setSingleStuDept(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none"
                  >
                    {departments.map(d => (
                      <option key={d.id} value={d.name}>{d.name} ({d.code})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-neutral-700 mb-1">Batch Year</label>
                  <input
                    type="number"
                    value={singleStuBatch}
                    onChange={(e) => setSingleStuBatch(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 space-y-2">
                <span className="font-semibold text-neutral-900 block">Initial Program Assignment (Optional)</span>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={singleStuProg}
                    onChange={(e) => {
                      setSingleStuProg(e.target.value);
                      setSingleStuSubProg('');
                    }}
                    className="w-full px-2.5 py-1.5 bg-white border border-neutral-200 rounded-lg text-xs"
                  >
                    <option value="">-- No Specialized Program --</option>
                    {programs.map(p => (
                      <option key={p.id} value={p.name}>{p.name}</option>
                    ))}
                  </select>

                  {singleStuProg && (() => {
                    const matchedProg = programs.find(p => p.name === singleStuProg);
                    if (!matchedProg?.hasSubPrograms || !matchedProg.subPrograms?.length) return null;
                    return (
                      <select
                        value={singleStuSubProg}
                        onChange={(e) => setSingleStuSubProg(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-neutral-200 rounded-lg text-xs"
                      >
                        <option value="">-- All Sub-Tiers --</option>
                        {matchedProg.subPrograms.map(sub => (
                          <option key={sub} value={sub}>{sub}</option>
                        ))}
                      </select>
                    );
                  })()}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setSingleStudentModal(false)}
                  className="px-4 py-2 border border-neutral-200 text-neutral-600 rounded-xl hover:bg-neutral-50 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-neutral-900 text-white rounded-xl hover:bg-black font-semibold shadow-xs cursor-pointer"
                >
                  Enroll Candidate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREATE TRAINING PROGRAM */}
      {/* ========================================================================= */}
      {createProgramModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-neutral-200 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-neutral-200 flex items-center justify-between bg-neutral-50/70 shrink-0">
              <div className="flex items-center space-x-2">
                <Layers className="w-4 h-4 text-neutral-900" />
                <h3 className="text-sm font-semibold text-neutral-900">Define Custom Training Program</h3>
              </div>
              <button onClick={() => setCreateProgramModal(false)} className="text-neutral-400 hover:text-neutral-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateProgram} className="p-6 space-y-4 text-xs overflow-y-auto">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block font-medium text-neutral-700 mb-1">Program Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Advanced Technical Readiness Track"
                    value={progName}
                    onChange={(e) => setProgName(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-neutral-900"
                  />
                </div>
                <div>
                  <label className="block font-medium text-neutral-700 mb-1">Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="ATRT"
                    value={progCode}
                    onChange={(e) => setProgCode(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl font-mono uppercase focus:outline-none focus:border-neutral-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-neutral-700 mb-1">Program Description</label>
                <textarea
                  rows={2}
                  placeholder="Goals, target student cohort, or recruitment focus..."
                  value={progDesc}
                  onChange={(e) => setProgDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-neutral-900"
                />
              </div>

              {/* Sub-programs Toggle */}
              <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-neutral-900">Sub-Programs / Specialized Tracks</span>
                    <p className="text-[11px] text-neutral-500">Divide this program into sub-tiers (e.g. Elite vs Non-Elite, or specialized technology tracks)</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setProgHasSub(!progHasSub)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${
                      progHasSub ? 'bg-neutral-900' : 'bg-neutral-300'
                    }`}
                  >
                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                      progHasSub ? 'translate-x-4.5' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                {progHasSub && (
                  <div className="space-y-2 pt-2 border-t border-neutral-200/60">
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        placeholder="Add track name (e.g. Elite Track, Non-Elite)..."
                        value={progSubInput}
                        onChange={(e) => setProgSubInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (progSubInput.trim() && !progSubList.includes(progSubInput.trim())) {
                              setProgSubList([...progSubList, progSubInput.trim()]);
                              setProgSubInput('');
                            }
                          }
                        }}
                        className="flex-1 px-3 py-1.5 bg-white border border-neutral-200 rounded-lg text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (progSubInput.trim() && !progSubList.includes(progSubInput.trim())) {
                            setProgSubList([...progSubList, progSubInput.trim()]);
                            setProgSubInput('');
                          }
                        }}
                        className="px-3 py-1.5 bg-neutral-900 text-white rounded-lg text-xs font-semibold cursor-pointer"
                      >
                        Add
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {progSubList.map((sub) => (
                        <span key={sub} className="inline-flex items-center px-2.5 py-1 bg-white border border-neutral-200 rounded-lg text-xs font-medium text-neutral-800">
                          <span>{sub}</span>
                          <button
                            type="button"
                            onClick={() => setProgSubList(progSubList.filter(s => s !== sub))}
                            className="ml-1.5 text-neutral-400 hover:text-red-600"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Assign Program Admin Section */}
              <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-200/80 space-y-3">
                <div>
                  <span className="font-semibold text-blue-950">Assign Program Administrator</span>
                  <p className="text-[11px] text-blue-800/80">User ID will strictly be their email.</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="First Name (e.g. Swaminathan)"
                    value={progAdminFirstName}
                    onChange={(e) => setProgAdminFirstName(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-blue-200 rounded-xl focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Last Name (e.g. K)"
                    value={progAdminLastName}
                    onChange={(e) => setProgAdminLastName(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-blue-200 rounded-xl focus:outline-none"
                  />
                </div>

                <input
                  type="email"
                  placeholder="admin.email@college.edu (User ID)"
                  value={progAdminEmail}
                  onChange={(e) => setProgAdminEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-blue-200 rounded-xl font-mono focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setCreateProgramModal(false)}
                  className="px-4 py-2 border border-neutral-200 text-neutral-600 rounded-xl hover:bg-neutral-50 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-neutral-900 text-white rounded-xl hover:bg-black font-semibold shadow-xs cursor-pointer"
                >
                  Save &amp; Create Program
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: SAFEGUARD DELETE PROGRAM */}
      {/* ========================================================================= */}
      {safeguardDeleteModal.isOpen && safeguardDeleteModal.program && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-red-200 rounded-3xl w-full max-w-md shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150 text-xs">
            <div className="flex items-center space-x-2 text-red-600 font-bold">
              <Lock className="w-4 h-4" />
              <span>Institutional Safeguard Verification</span>
            </div>

            <p className="text-neutral-700 leading-relaxed">
              Deleting <strong>&quot;{safeguardDeleteModal.program.name}&quot;</strong> will permanently remove this track and affect its enrolled cohort.
            </p>

            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-900 text-[11px]">
              To verify deletion, type <span className="font-mono font-bold select-all">{safeguardDeleteModal.program.name}</span> or <span className="font-mono font-bold select-all">CONFIRM_MODIFY</span> below:
            </div>

            <input
              type="text"
              placeholder="Type confirmation here..."
              value={safeguardInput}
              onChange={(e) => setSafeguardInput(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl font-mono focus:outline-none focus:border-red-600"
            />

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setSafeguardDeleteModal({ isOpen: false, program: null })}
                className="px-4 py-2 border border-neutral-200 text-neutral-600 rounded-xl hover:bg-neutral-50 font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeSafeguardDelete}
                disabled={!safeguardInput.trim()}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium shadow-xs disabled:opacity-50 cursor-pointer"
              >
                Verify &amp; Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD DEPARTMENT */}
      {/* ========================================================================= */}
      {createDeptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-neutral-200 rounded-3xl w-full max-w-md shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150 text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center space-x-2">
                <Building2 className="w-4 h-4 text-neutral-900" />
                <h3 className="font-semibold text-neutral-900 text-sm">Add Academic Department</h3>
              </div>
              <button onClick={() => setCreateDeptModal(false)} className="text-neutral-400 hover:text-neutral-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateDept} className="space-y-3.5">
              <div>
                <label className="block font-medium text-neutral-700 mb-1">Department Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Information Technology"
                  value={deptName}
                  onChange={(e) => setDeptName(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-neutral-900"
                />
              </div>

              <div>
                <label className="block font-medium text-neutral-700 mb-1">Department Code *</label>
                <input
                  type="text"
                  required
                  placeholder="IT"
                  value={deptCode}
                  onChange={(e) => setDeptCode(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl font-mono uppercase focus:outline-none focus:border-neutral-900"
                />
              </div>

              <div>
                <label className="block font-medium text-neutral-700 mb-1">Department Admin Name (Counselor) *</label>
                <input
                  type="text"
                  required
                  placeholder="Dr. S. Meenakshi"
                  value={deptAdminName}
                  onChange={(e) => setDeptAdminName(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-neutral-900"
                />
              </div>

              <div>
                <label className="block font-medium text-neutral-700 mb-1">Admin Email (User ID) *</label>
                <input
                  type="email"
                  required
                  placeholder="admin.it@college.edu"
                  value={deptAdminEmail}
                  onChange={(e) => setDeptAdminEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl font-mono focus:outline-none focus:border-neutral-900"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateDeptModal(false)}
                  className="px-4 py-2 border border-neutral-200 text-neutral-600 rounded-xl hover:bg-neutral-50 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-neutral-900 text-white rounded-xl hover:bg-black font-semibold shadow-xs cursor-pointer"
                >
                  Save Department
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: BULK INTAKE STUDENTS CSV */}
      {/* ========================================================================= */}
      {bulkIntakeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-neutral-200 rounded-3xl w-full max-w-xl shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150 text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center space-x-2">
                <FileSpreadsheet className="w-4 h-4 text-neutral-900" />
                <h3 className="font-semibold text-neutral-900 text-sm">Bulk Student Intake (New Academic Batch CSV)</h3>
              </div>
              <button onClick={() => setBulkIntakeModal(false)} className="text-neutral-400 hover:text-neutral-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-between bg-neutral-50 p-2.5 rounded-xl border border-neutral-200">
              <span className="font-mono text-[11px] text-neutral-500">Format: Name, RollNumber, CollegeEmail, Password, Department, BatchYear</span>
              <button
                type="button"
                onClick={downloadSampleIntakeCSV}
                className="px-2.5 py-1 text-xs bg-white border border-neutral-200 rounded-lg hover:bg-neutral-100 flex items-center space-x-1 cursor-pointer"
              >
                <Download className="w-3 h-3" />
                <span>Sample CSV</span>
              </button>
            </div>

            <textarea
              rows={6}
              value={csvIntakeText}
              onChange={(e) => setCsvIntakeText(e.target.value)}
              placeholder="Full Name,Roll Number,College Email,Initial Password,Department,Batch Year&#10;Aravind Kumar,22CS1084,aravind.k@college.edu,pass123,Computer Science & Engineering,2026"
              className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl font-mono text-[11px] focus:outline-none focus:border-neutral-900"
            />

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setBulkIntakeModal(false)}
                className="px-4 py-2 border border-neutral-200 text-neutral-600 rounded-xl hover:bg-neutral-50 font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBulkIntake}
                disabled={!csvIntakeText.trim()}
                className="px-5 py-2 bg-neutral-900 hover:bg-black text-white rounded-xl font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
              >
                Ingest Candidates
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: BULK SCRUTINY PROGRAM ALLOCATION CSV */}
      {/* ========================================================================= */}
      {bulkScrutinyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-neutral-200 rounded-3xl w-full max-w-xl shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150 text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center space-x-2">
                <Layers className="w-4 h-4 text-blue-600" />
                <h3 className="font-semibold text-neutral-900 text-sm">Post-Scrutiny Program Allocation (CSV)</h3>
              </div>
              <button onClick={() => setBulkScrutinyModal(false)} className="text-neutral-400 hover:text-neutral-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-between bg-neutral-50 p-2.5 rounded-xl border border-neutral-200">
              <span className="font-mono text-[11px] text-neutral-500">Format: RollNumberOrEmail, ProgramName, SubProgramOrTrack</span>
              <button
                type="button"
                onClick={downloadSampleScrutinyCSV}
                className="px-2.5 py-1 text-xs bg-white border border-neutral-200 rounded-lg hover:bg-neutral-100 flex items-center space-x-1 cursor-pointer"
              >
                <Download className="w-3 h-3" />
                <span>Sample CSV</span>
              </button>
            </div>

            <textarea
              rows={6}
              value={csvScrutinyText}
              onChange={(e) => setCsvScrutinyText(e.target.value)}
              placeholder="Roll Number Or Email,Program Name,Sub Program Or Track&#10;22CS1084,Advanced Technical Readiness,Elite Track&#10;karthik.r@college.edu,Cloud Systems,Cloud Computing & DevOps"
              className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl font-mono text-[11px] focus:outline-none focus:border-neutral-900"
            />

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setBulkScrutinyModal(false)}
                className="px-4 py-2 border border-neutral-200 text-neutral-600 rounded-xl hover:bg-neutral-50 font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBulkScrutiny}
                disabled={!csvScrutinyText.trim()}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
              >
                Allocate Programs
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ASSIGN SESSION MODAL */}
      {/* ========================================================================= */}
      {assignModalOpen && (
        <AssignSessionModal
          isOpen={assignModalOpen}
          onClose={() => setAssignModalOpen(false)}
          onSuccess={(asg) => {
            setAssignModalOpen(false);
            logger.info('ASSIGN', `Assessment assigned: "${asg.title}"`);
            setFeedback({
              type: 'success',
              message: `Successfully dispatched drill "${asg.title}"!`
            });
          }}
          defaultRole="SUPER_ADMIN"
          defaultTargetScope={assignTargetScope}
          defaultProgramName={assignProgramName}
          defaultDepartment={assignDepartment}
          studentsList={students}
        />
      )}

      {/* ========================================================================= */}
      {/* MODAL: STUDENT PROFILE & HISTORY (CLICKING STUDENT NAME) */}
      {/* ========================================================================= */}
      {inspectStudentId && (
        <StudentHistoryModal
          studentId={inspectStudentId}
          onClose={() => setInspectStudentId(null)}
        />
      )}

    </div>
  );
};
