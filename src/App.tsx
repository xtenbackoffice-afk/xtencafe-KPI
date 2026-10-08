import React, { useState, useEffect } from 'react';
import {
  Branch,
  Employee,
  FormQuestionCategory,
  FormQuestion,
  KpiSubmission,
  LineWebhookLog,
} from './types/kpi';
import {
  supabaseMockDb,
  STORAGE_KEYS,
} from './services/supabaseMockService';
import { sendLineNotification } from './services/lineNotificationService';
import { Header, ActiveTab } from './components/Header';
import { BranchSelector } from './components/BranchSelector';
import { EmployeeManagementPanel } from './components/EmployeeManagementPanel';
import { KpiSubmissionForm } from './components/KpiSubmissionForm';
import { KpiTemplateCustomizer } from './components/KpiTemplateCustomizer';
import { ManagerPinModal } from './components/ManagerPinModal';
import { ManagerDashboard } from './components/ManagerDashboard';
import { Building2 } from 'lucide-react';

export default function App() {
  const [branches, setBranches] = useState<Branch[]>(() =>
    supabaseMockDb.getBranches()
  );
  const [employees, setEmployees] = useState<Employee[]>(() =>
    supabaseMockDb.getEmployees()
  );
  const [categories, setCategories] = useState<FormQuestionCategory[]>(() =>
    supabaseMockDb.getQuestionCategories()
  );
  const [questions, setQuestions] = useState<FormQuestion[]>(() =>
    supabaseMockDb.getQuestions()
  );
  const [submissions, setSubmissions] = useState<KpiSubmission[]>(() =>
    supabaseMockDb.getSubmissions()
  );
  const [lineLogs, setLineLogs] = useState<LineWebhookLog[]>(() =>
    supabaseMockDb.getLineLogs()
  );
  const [managerPin] = useState<string>(() => supabaseMockDb.getManagerPin());

  // โหลดสถานะหน้าจอที่เปิดค้างไว้ล่าสุด (ป้องกันหน้าจอกระโดดกลับเมื่อกดรีเฟรชเบราว์เซอร์)
  const initialUiSession = supabaseMockDb.getUiSession();

  const [activeTab, setActiveTab] = useState<ActiveTab>(
    () => initialUiSession?.activeTab || 'branch_select'
  );
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(() => {
    const savedId = initialUiSession?.selectedBranchId;
    if (savedId && branches.some((b) => b.id === savedId)) {
      return savedId;
    }
    return branches[0]?.id || null;
  });
  const [selectedEmployeeIdForForm, setSelectedEmployeeIdForForm] =
    useState<string>(() => initialUiSession?.selectedEmployeeIdForForm || '');

  const [isManagerAuthenticated, setIsManagerAuthenticated] =
    useState<boolean>(() => Boolean(initialUiSession?.isManagerAuthenticated));
  const [pinModalConfig, setPinModalConfig] = useState<{
    isOpen: boolean;
    description: string;
    onVerified: (() => void) | null;
  }>({
    isOpen: false,
    description: '',
    onVerified: null,
  });
  const [isCustomizerOpen, setIsCustomizerOpen] = useState<boolean>(false);

  const requestPinProtectedAction = (
    description: string,
    onVerified: () => void
  ) => {
    setPinModalConfig({
      isOpen: true,
      description,
      onVerified,
    });
  };

  // Hydrate ข้อมูลจาก IndexedDB และ Supabase Cloud เมื่อเปิดแอปพลิเคชัน
  useEffect(() => {
    let isMounted = true;
    supabaseMockDb.hydrateAllCollections().then((hydrated) => {
      if (!isMounted) return;
      if (hydrated.branches && hydrated.branches.length > 0) {
        setBranches(hydrated.branches);
      }
      if (hydrated.employees) {
        setEmployees(hydrated.employees);
      }
      if (hydrated.categories && hydrated.categories.length > 0) {
        setCategories(hydrated.categories);
      }
      if (hydrated.questions && hydrated.questions.length > 0) {
        setQuestions(hydrated.questions);
      }
      if (hydrated.submissions) {
        setSubmissions(hydrated.submissions);
      }
      if (hydrated.lineLogs) {
        setLineLogs(hydrated.lineLogs);
      }
    });

    // ซิงก์ข้อมูลข้ามแท็บเบราว์เซอร์อัตโนมัติ (Cross-Tab Persistence Sync)
    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === STORAGE_KEYS.BRANCHES) {
        setBranches(supabaseMockDb.getBranches());
      } else if (e.key === STORAGE_KEYS.EMPLOYEES) {
        setEmployees(supabaseMockDb.getEmployees());
      } else if (e.key === STORAGE_KEYS.QUESTION_CATEGORIES) {
        setCategories(supabaseMockDb.getQuestionCategories());
      } else if (e.key === STORAGE_KEYS.QUESTIONS) {
        setQuestions(supabaseMockDb.getQuestions());
      } else if (e.key === STORAGE_KEYS.SUBMISSIONS) {
        setSubmissions(supabaseMockDb.getSubmissions());
      } else if (e.key === STORAGE_KEYS.LINE_LOGS) {
        setLineLogs(supabaseMockDb.getLineLogs());
      }
    };

    window.addEventListener('storage', handleStorageEvent);
    return () => {
      isMounted = false;
      window.removeEventListener('storage', handleStorageEvent);
    };
  }, []);

  // บันทึกสถานะข้อมูลทุกส่วนลงพื้นที่จัดเก็บถาวรทันทีที่มีการเปลี่ยนแปลง
  useEffect(() => {
    supabaseMockDb.saveBranches(branches);
  }, [branches]);

  useEffect(() => {
    supabaseMockDb.saveEmployees(employees);
  }, [employees]);

  useEffect(() => {
    supabaseMockDb.saveQuestionCategories(categories);
  }, [categories]);

  useEffect(() => {
    supabaseMockDb.saveQuestions(questions);
  }, [questions]);

  useEffect(() => {
    supabaseMockDb.saveSubmissions(submissions);
  }, [submissions]);

  useEffect(() => {
    supabaseMockDb.saveLineLogs(lineLogs);
  }, [lineLogs]);

  // บันทึกสถานะหน้าจอปัจจุบันเพื่อให้รีเฟรชหน้าเว็บแล้วยังอยู่ที่หน้าเดิม
  useEffect(() => {
    supabaseMockDb.saveUiSession({
      activeTab,
      selectedBranchId,
      selectedEmployeeIdForForm,
      isManagerAuthenticated,
    });
  }, [
    activeTab,
    selectedBranchId,
    selectedEmployeeIdForForm,
    isManagerAuthenticated,
  ]);

  const currentBranch =
    branches.find((b) => b.id === selectedBranchId) || branches[0] || null;

  const currentBranchEmployees = currentBranch
    ? employees.filter((e) => e.branchId === currentBranch.id)
    : [];

  const handleSelectBranch = (branchId: string) => {
    setSelectedBranchId(branchId);
    setSelectedEmployeeIdForForm('');
    setActiveTab('employee_workspace');
  };

  const handleAddBranch = (
    name: string,
    code: string,
    district: string,
    addressSummary: string
  ) => {
    const newBranch: Branch = {
      id: `branch_${Date.now()}`,
      name,
      code,
      district,
      addressSummary,
      createdAt: new Date().toISOString(),
    };
    setBranches((prev) => {
      const next = [...prev, newBranch];
      supabaseMockDb.saveBranches(next);
      return next;
    });
    setSelectedBranchId(newBranch.id);
    setSelectedEmployeeIdForForm('');
  };

  const handleUpdateBranch = (
    branchId: string,
    patch: Partial<Omit<Branch, 'id' | 'createdAt'>>
  ) => {
    setBranches((prev) => {
      const next = prev.map((b) =>
        b.id === branchId ? { ...b, ...patch } : b
      );
      supabaseMockDb.saveBranches(next);
      return next;
    });
    if (patch.name) {
      setSubmissions((prev) => {
        const next = prev.map((s) =>
          s.branchId === branchId ? { ...s, branchName: patch.name! } : s
        );
        supabaseMockDb.saveSubmissions(next);
        return next;
      });
    }
  };

  const handleDeleteBranch = (branchId: string) => {
    setBranches((prev) => {
      if (prev.length <= 1) return prev;
      const remaining = prev.filter((b) => b.id !== branchId);
      supabaseMockDb.saveBranches(remaining);
      if (selectedBranchId === branchId) {
        setSelectedBranchId(remaining[0]?.id || null);
        setSelectedEmployeeIdForForm('');
      }
      return remaining;
    });
    setEmployees((prev) => {
      const next = prev.filter((e) => e.branchId !== branchId);
      supabaseMockDb.saveEmployees(next);
      return next;
    });
  };

  // เพิ่มพนักงานด้วยชื่อเล่นเท่านั้น และบันทึกลง Storage ทันที
  const handleAddEmployee = (branchId: string, nickname: string): Employee => {
    const newEmp: Employee = {
      id: `emp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      branchId,
      name: nickname,
      createdAt: new Date().toISOString(),
    };
    setEmployees((prev) => {
      const next = [...prev, newEmp];
      supabaseMockDb.saveEmployees(next);
      return next;
    });
    return newEmp;
  };

  const handleDeleteEmployee = (employeeId: string) => {
    setEmployees((prev) => {
      const next = prev.filter((emp) => emp.id !== employeeId);
      supabaseMockDb.saveEmployees(next);
      return next;
    });
    if (selectedEmployeeIdForForm === employeeId) {
      setSelectedEmployeeIdForForm('');
    }
  };

  const handleSaveCategories = (updated: FormQuestionCategory[]) => {
    setCategories(updated);
    supabaseMockDb.saveQuestionCategories(updated);
  };

  const handleSaveQuestions = (updated: FormQuestion[]) => {
    setQuestions(updated);
    supabaseMockDb.saveQuestions(updated);
  };

  const handleKpiSubmit = async (
    formData: Omit<KpiSubmission, 'id' | 'createdAt' | 'lineNotificationSent'>
  ) => {
    const newSubmission: KpiSubmission = {
      ...formData,
      id: `sub_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      createdAt: new Date().toISOString(),
      lineNotificationSent: true,
    };

    // บันทึกคำตอบ KPI ลงฐานข้อมูลถาวรทันที (localStorage + IndexedDB + Supabase)
    setSubmissions((prev) => {
      const next = [newSubmission, ...prev];
      supabaseMockDb.saveSubmissions(next);
      return next;
    });

    const webhookLog = await sendLineNotification(newSubmission);

    setLineLogs((prev) => {
      const next = [webhookLog, ...prev];
      supabaseMockDb.saveLineLogs(next);
      return next;
    });
  };

  const handleDeleteSubmission = (submissionId: string) => {
    setSubmissions((prev) => {
      const next = prev.filter((s) => s.id !== submissionId);
      supabaseMockDb.saveSubmissions(next);
      return next;
    });
  };

  const handleResetDemoData = () => {
    supabaseMockDb.resetAllToDefaults();
    const defaultBranches = supabaseMockDb.getBranches();
    setBranches(defaultBranches);
    setEmployees(supabaseMockDb.getEmployees());
    setCategories(supabaseMockDb.getQuestionCategories());
    setQuestions(supabaseMockDb.getQuestions());
    setSubmissions(supabaseMockDb.getSubmissions());
    setLineLogs([]);
    setSelectedBranchId(defaultBranches[0]?.id || null);
    setSelectedEmployeeIdForForm('');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Top Bar Navigation */}
      <Header
        activeTab={activeTab}
        selectedBranchName={currentBranch?.name || null}
        isManagerAuthenticated={isManagerAuthenticated}
        onSelectTab={(tab) => {
          if (tab === 'manager_dashboard' && !isManagerAuthenticated) {
            requestPinProtectedAction(
              'กรุณากรอกรหัส PIN 4 หลักเพื่อเข้าสู่หน้าสำหรับผู้ตรวจสอบ',
              () => {
                setIsManagerAuthenticated(true);
                setActiveTab('manager_dashboard');
              }
            );
            return;
          }
          setActiveTab(tab);
        }}
        onOpenManagerLogin={() =>
          requestPinProtectedAction(
            'กรุณากรอกรหัส PIN 4 หลักเพื่อเข้าสู่หน้าสำหรับผู้ตรวจสอบ',
            () => {
              setIsManagerAuthenticated(true);
              setActiveTab('manager_dashboard');
            }
          )
        }
        onLogoutManager={() => {
          setIsManagerAuthenticated(false);
          if (activeTab === 'manager_dashboard') {
            setActiveTab('branch_select');
          }
        }}
        onOpenCustomizer={() =>
          requestPinProtectedAction(
            'กรุณากรอกรหัส PIN 4 หลักเพื่อสร้าง แก้ไข หรือลบคำถามในแบบฟอร์ม',
            () => setIsCustomizerOpen(true)
          )
        }
      />

      {/* Main Content Viewport */}
      <main className="flex-1">
        {activeTab === 'branch_select' && (
          <BranchSelector
            branches={branches}
            employees={employees}
            selectedBranchId={selectedBranchId}
            onSelectBranch={handleSelectBranch}
            onAddBranch={handleAddBranch}
            onUpdateBranch={handleUpdateBranch}
            onDeleteBranch={handleDeleteBranch}
            onRequestPinProtectedAction={requestPinProtectedAction}
            onOpenManagerLogin={() => {
              if (isManagerAuthenticated) {
                setActiveTab('manager_dashboard');
              } else {
                requestPinProtectedAction(
                  'กรุณากรอกรหัส PIN 4 หลักเพื่อเข้าสู่หน้าสำหรับผู้ตรวจสอบ',
                  () => {
                    setIsManagerAuthenticated(true);
                    setActiveTab('manager_dashboard');
                  }
                );
              }
            }}
          />
        )}

        {activeTab === 'employee_workspace' && currentBranch && (
          <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
            {/* Quick Branch Switcher Bar */}
            <div className="bg-white border border-slate-200 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 px-1">
                <Building2 className="w-4 h-4 text-slate-500" />
                <span>สาขาที่กำลังใช้งาน:</span>
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                {branches.map((b) => {
                  const isCurrent = b.id === currentBranch.id;
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => {
                        setSelectedBranchId(b.id);
                        setSelectedEmployeeIdForForm('');
                      }}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        isCurrent
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                      }`}
                    >
                      {b.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Two-Column Workspace */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-4">
                <EmployeeManagementPanel
                  branch={currentBranch}
                  branchEmployees={currentBranchEmployees}
                  selectedEmployeeId={selectedEmployeeIdForForm}
                  onSelectEmployeeForForm={(empId) =>
                    setSelectedEmployeeIdForForm(empId)
                  }
                  onAddEmployee={handleAddEmployee}
                  onDeleteEmployee={handleDeleteEmployee}
                  onBackToBranches={() => setActiveTab('branch_select')}
                />
              </div>

              <div className="lg:col-span-8">
                <KpiSubmissionForm
                  branch={currentBranch}
                  branchEmployees={currentBranchEmployees}
                  categories={categories}
                  questions={questions}
                  selectedEmployeeId={selectedEmployeeIdForForm}
                  onSelectEmployeeId={setSelectedEmployeeIdForForm}
                  onOpenCustomizer={() =>
                    requestPinProtectedAction(
                      'กรุณากรอกรหัส PIN 4 หลักเพื่อสร้าง แก้ไข หรือลบคำถามในแบบฟอร์ม',
                      () => setIsCustomizerOpen(true)
                    )
                  }
                  onSubmitKpi={handleKpiSubmit}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'manager_dashboard' && isManagerAuthenticated && (
          <ManagerDashboard
            branches={branches}
            employees={employees}
            categories={categories}
            questions={questions}
            submissions={submissions}
            lineLogs={lineLogs}
            onSaveCategories={handleSaveCategories}
            onSaveQuestions={handleSaveQuestions}
            onAddBranch={handleAddBranch}
            onUpdateBranch={handleUpdateBranch}
            onDeleteBranch={handleDeleteBranch}
            onDeleteSubmission={handleDeleteSubmission}
            onResetDemoData={handleResetDemoData}
          />
        )}
      </main>

      {/* 4-Digit PIN Modal for Sensitive Administrative Actions & Manager View */}
      <ManagerPinModal
        isOpen={pinModalConfig.isOpen}
        expectedPin={managerPin}
        actionDescription={pinModalConfig.description}
        onSuccess={() => {
          const callback = pinModalConfig.onVerified;
          setPinModalConfig({
            isOpen: false,
            description: '',
            onVerified: null,
          });
          if (callback) {
            callback();
          }
        }}
        onClose={() =>
          setPinModalConfig({
            isOpen: false,
            description: '',
            onVerified: null,
          })
        }
      />

      {/* Google Forms-style Categorized Question Builder Modal */}
      <KpiTemplateCustomizer
        isOpen={isCustomizerOpen}
        categories={categories}
        questions={questions}
        onSaveCategories={handleSaveCategories}
        onSaveQuestions={handleSaveQuestions}
        onClose={() => setIsCustomizerOpen(false)}
      />
    </div>
  );
}
