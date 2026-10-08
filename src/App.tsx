import React, { useState, useEffect } from 'react';
import {
  Branch,
  Employee,
  FormQuestionCategory,
  FormQuestion,
  KpiSubmission,
  LineWebhookLog,
} from './types/kpi';
import { supabaseMockDb } from './services/supabaseMockService';
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

  const [activeTab, setActiveTab] = useState<ActiveTab>('branch_select');
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(
    branches[0]?.id || null
  );
  const [selectedEmployeeIdForForm, setSelectedEmployeeIdForForm] =
    useState<string>('');

  const [isManagerAuthenticated, setIsManagerAuthenticated] =
    useState<boolean>(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState<boolean>(false);
  const [isCustomizerOpen, setIsCustomizerOpen] = useState<boolean>(false);

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
    setBranches((prev) => [...prev, newBranch]);
    setSelectedBranchId(newBranch.id);
    setSelectedEmployeeIdForForm('');
  };

  const handleUpdateBranch = (
    branchId: string,
    patch: Partial<Omit<Branch, 'id' | 'createdAt'>>
  ) => {
    setBranches((prev) =>
      prev.map((b) => (b.id === branchId ? { ...b, ...patch } : b))
    );
    if (patch.name) {
      setSubmissions((prev) =>
        prev.map((s) =>
          s.branchId === branchId ? { ...s, branchName: patch.name! } : s
        )
      );
    }
  };

  const handleDeleteBranch = (branchId: string) => {
    setBranches((prev) => {
      if (prev.length <= 1) return prev;
      const remaining = prev.filter((b) => b.id !== branchId);
      if (selectedBranchId === branchId) {
        setSelectedBranchId(remaining[0]?.id || null);
        setSelectedEmployeeIdForForm('');
      }
      return remaining;
    });
    setEmployees((prev) => prev.filter((e) => e.branchId !== branchId));
  };

  // เพิ่มพนักงานด้วยชื่อเล่นเท่านั้น (ไม่มีตำแหน่งงาน)
  const handleAddEmployee = (branchId: string, nickname: string): Employee => {
    const newEmp: Employee = {
      id: `emp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      branchId,
      name: nickname,
      createdAt: new Date().toISOString(),
    };
    setEmployees((prev) => [...prev, newEmp]);
    return newEmp;
  };

  const handleDeleteEmployee = (employeeId: string) => {
    setEmployees((prev) => prev.filter((emp) => emp.id !== employeeId));
    if (selectedEmployeeIdForForm === employeeId) {
      setSelectedEmployeeIdForForm('');
    }
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

    const webhookLog = await sendLineNotification(newSubmission);

    setSubmissions((prev) => [newSubmission, ...prev]);
    setLineLogs((prev) => [webhookLog, ...prev]);
  };

  const handleDeleteSubmission = (submissionId: string) => {
    setSubmissions((prev) => prev.filter((s) => s.id !== submissionId));
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
            setIsPinModalOpen(true);
            return;
          }
          setActiveTab(tab);
        }}
        onOpenManagerLogin={() => setIsPinModalOpen(true)}
        onLogoutManager={() => {
          setIsManagerAuthenticated(false);
          if (activeTab === 'manager_dashboard') {
            setActiveTab('branch_select');
          }
        }}
        onOpenCustomizer={() => setIsCustomizerOpen(true)}
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
            onOpenManagerLogin={() => {
              if (isManagerAuthenticated) {
                setActiveTab('manager_dashboard');
              } else {
                setIsPinModalOpen(true);
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
                  onOpenCustomizer={() => setIsCustomizerOpen(true)}
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
            onSaveCategories={(updated) => setCategories(updated)}
            onSaveQuestions={(updated) => setQuestions(updated)}
            onAddBranch={handleAddBranch}
            onUpdateBranch={handleUpdateBranch}
            onDeleteBranch={handleDeleteBranch}
            onDeleteSubmission={handleDeleteSubmission}
            onResetDemoData={handleResetDemoData}
          />
        )}
      </main>

      {/* Quiet Minimalist Footer */}
      <footer className="border-t border-slate-200 bg-white mt-12">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <span>
            ระบบบริหารจัดการและแบบฟอร์มประเมิน KPI พนักงานหลายสาขา · เปิดใช้งานโหมดคุ้มครองความลับข้อมูลพนักงาน
          </span>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setIsCustomizerOpen(true)}
              className="hover:text-slate-900 transition-colors cursor-pointer"
            >
              จัดการหมวดหมู่และคำถามแบบฟอร์ม
            </button>
            <span>·</span>
            <button
              type="button"
              onClick={() => {
                if (isManagerAuthenticated) {
                  setActiveTab('manager_dashboard');
                } else {
                  setIsPinModalOpen(true);
                }
              }}
              className="hover:text-slate-900 transition-colors cursor-pointer"
            >
              หน้าสำหรับผู้จัดการ (รหัส PIN: 1234)
            </button>
          </div>
        </div>
      </footer>

      {/* 4-Digit PIN Modal for Manager View */}
      <ManagerPinModal
        isOpen={isPinModalOpen}
        expectedPin={managerPin}
        onSuccess={() => {
          setIsManagerAuthenticated(true);
          setIsPinModalOpen(false);
          setActiveTab('manager_dashboard');
        }}
        onClose={() => setIsPinModalOpen(false)}
      />

      {/* Google Forms-style Categorized Question Builder Modal */}
      <KpiTemplateCustomizer
        isOpen={isCustomizerOpen}
        categories={categories}
        questions={questions}
        onSaveCategories={(updated) => setCategories(updated)}
        onSaveQuestions={(updated) => setQuestions(updated)}
        onClose={() => setIsCustomizerOpen(false)}
      />
    </div>
  );
}
