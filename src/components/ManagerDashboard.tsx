import React, { useState, useMemo } from 'react';
import {
  Search,
  Download,
  Image as ImageIcon,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Database,
  MessageSquareShare,
  Trash2,
  Building2,
  Layers,
  ListFilter,
  RotateCcw,
  FileSpreadsheet,
  MapPin,
  Plus,
  Pencil,
  Check,
  Users,
} from 'lucide-react';
import {
  Branch,
  Employee,
  FormQuestionCategory,
  FormQuestion,
  FormQuestionResponse,
  KpiSubmission,
  LineWebhookLog,
} from '../types/kpi';
import { SUPABASE_SQL_SCHEMA } from '../services/supabaseMockService';
import { KpiTemplateCustomizer } from './KpiTemplateCustomizer';

interface ManagerDashboardProps {
  branches: Branch[];
  employees: Employee[];
  categories: FormQuestionCategory[];
  questions: FormQuestion[];
  submissions: KpiSubmission[];
  lineLogs: LineWebhookLog[];
  onSaveCategories: (updated: FormQuestionCategory[]) => void;
  onSaveQuestions: (updated: FormQuestion[]) => void;
  onAddBranch: (
    name: string,
    code: string,
    district: string,
    addressSummary: string
  ) => void;
  onUpdateBranch: (
    branchId: string,
    patch: Partial<Omit<Branch, 'id' | 'createdAt'>>
  ) => void;
  onDeleteBranch: (branchId: string) => void;
  onDeleteSubmission: (submissionId: string) => void;
  onResetDemoData: () => void;
}

export const ManagerDashboard: React.FC<ManagerDashboardProps> = ({
  branches,
  employees,
  categories,
  questions,
  submissions,
  lineLogs,
  onSaveCategories,
  onSaveQuestions,
  onAddBranch,
  onUpdateBranch,
  onDeleteBranch,
  onDeleteSubmission,
  onResetDemoData,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<
    'responses' | 'form_builder' | 'branch_manager'
  >('responses');
  const [selectedBranchFilter, setSelectedBranchFilter] =
    useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'grouped_by_branch'>(
    'table'
  );
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('');

  const [activeSubmissionModal, setActiveSubmissionModal] =
    useState<KpiSubmission | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);

  const [showWebhookDrawer, setShowWebhookDrawer] = useState<boolean>(false);
  const [showSchemaModal, setShowSchemaModal] = useState<boolean>(false);
  const [copiedSchema, setCopiedSchema] = useState<boolean>(false);

  // State สำหรับจัดการสาขาและสถานที่ตั้งในหน้าผู้จัดการ
  const [newBranchName, setNewBranchName] = useState('');
  const [newBranchCode, setNewBranchCode] = useState('');
  const [newBranchDistrict, setNewBranchDistrict] = useState('');
  const [newBranchAddress, setNewBranchAddress] = useState('');
  const [editingBranchId, setEditingBranchId] = useState<string | null>(null);
  const [editBranchName, setEditBranchName] = useState('');
  const [editBranchCode, setEditBranchCode] = useState('');
  const [editBranchDistrict, setEditBranchDistrict] = useState('');
  const [editBranchAddress, setEditBranchAddress] = useState('');
  const [branchNotice, setBranchNotice] = useState<string | null>(null);
  const [branchError, setBranchError] = useState<string | null>(null);

  const showBranchToast = (msg: string) => {
    setBranchError(null);
    setBranchNotice(msg);
    setTimeout(() => setBranchNotice(null), 3200);
  };

  const handleCreateBranchInManager = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newBranchName.trim();
    if (!cleanName) {
      setBranchError('กรุณาระบุชื่อสาขา');
      return;
    }
    const normalizedName = cleanName.startsWith('สาขา')
      ? cleanName
      : `สาขา${cleanName}`;
    const generatedCode =
      newBranchCode.trim().toUpperCase() ||
      `BKK-${Math.floor(100 + Math.random() * 900)}`;

    onAddBranch(
      normalizedName,
      generatedCode,
      newBranchDistrict.trim() || 'กรุงเทพมหานคร',
      newBranchAddress.trim() || 'จุดให้บริการหน้าร้านมาตรฐาน'
    );
    setNewBranchName('');
    setNewBranchCode('');
    setNewBranchDistrict('');
    setNewBranchAddress('');
    showBranchToast(`เพิ่ม "${normalizedName}" และสถานที่ตั้งเรียบร้อยแล้ว`);
  };

  const startEditBranchRow = (branch: Branch) => {
    setEditingBranchId(branch.id);
    setEditBranchName(branch.name);
    setEditBranchCode(branch.code);
    setEditBranchDistrict(branch.district);
    setEditBranchAddress(branch.addressSummary);
  };

  const handleSaveBranchRow = (branchId: string) => {
    const cleanName = editBranchName.trim();
    if (!cleanName) {
      setBranchError('กรุณาระบุชื่อสาขา');
      return;
    }
    onUpdateBranch(branchId, {
      name: cleanName,
      code: editBranchCode.trim().toUpperCase() || 'BKK-000',
      district: editBranchDistrict.trim() || 'กรุงเทพมหานคร',
      addressSummary: editBranchAddress.trim() || 'จุดให้บริการหน้าร้านมาตรฐาน',
    });
    setEditingBranchId(null);
    showBranchToast(`บันทึกการแก้ไขข้อมูล "${cleanName}" เรียบร้อยแล้ว`);
  };

  const handleRemoveBranchRow = (branch: Branch) => {
    if (branches.length <= 1) {
      setBranchError('ระบบต้องมีสาขาที่เปิดใช้งานอย่างน้อย 1 สาขา');
      return;
    }
    onDeleteBranch(branch.id);
    if (selectedBranchFilter === branch.id) {
      setSelectedBranchFilter('all');
    }
    showBranchToast(`ลบ "${branch.name}" ออกจากระบบเรียบร้อยแล้ว`);
  };

  const filteredSubmissions = useMemo(() => {
    return submissions
      .filter((sub) => {
        if (
          selectedBranchFilter !== 'all' &&
          sub.branchId !== selectedBranchFilter
        ) {
          return false;
        }
        if (dateFilter && sub.submissionDate !== dateFilter) {
          return false;
        }
        if (searchQuery.trim() !== '') {
          const q = searchQuery.toLowerCase();
          const matchEmp = sub.employeeName.toLowerCase().includes(q);
          const matchBranch = sub.branchName.toLowerCase().includes(q);
          const matchAnyAnswer = sub.responses.some(
            (r) =>
              (r.textValue || '').toLowerCase().includes(q) ||
              String(r.numberValue ?? '').includes(q)
          );
          return matchEmp || matchBranch || matchAnyAnswer;
        }
        return true;
      })
      .sort(
        (a, b) =>
          new Date(b.submissionDate).getTime() -
            new Date(a.submissionDate).getTime() ||
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }, [submissions, selectedBranchFilter, dateFilter, searchQuery]);

  const stats = useMemo(() => {
    const count = filteredSubmissions.length;
    const totalPhotos = filteredSubmissions.reduce(
      (acc, s) => acc + s.images.length,
      0
    );
    return {
      count,
      totalPhotos,
      categoryCount: categories.length,
      questionCount: questions.length,
      totalStaff:
        selectedBranchFilter === 'all'
          ? employees.length
          : employees.filter((e) => e.branchId === selectedBranchFilter).length,
    };
  }, [
    filteredSubmissions,
    employees,
    selectedBranchFilter,
    categories.length,
    questions.length,
  ]);

  const handleOpenEvidenceModal = (
    submission: KpiSubmission,
    initialImgIdx = 0
  ) => {
    setActiveSubmissionModal(submission);
    setActiveImageIndex(initialImgIdx);
  };

  const formatAnswerText = (res: FormQuestionResponse | undefined): string => {
    if (!res) return '—';
    if (res.questionType === 'number') {
      if (res.numberValue === undefined) return '—';
      const formattedNum = res.numberValue.toLocaleString('th-TH');
      const maxPart = res.maxScore ? `/${res.maxScore}` : '';
      const unitPart = res.unitLabel ? ` ${res.unitLabel}` : '';
      return `${formattedNum}${maxPart}${unitPart}`;
    }
    if (res.questionType === 'image_upload') {
      const count = res.images?.length ?? 0;
      return count > 0 ? `แนบรูปภาพ ${count} รูป` : 'ไม่มีรูปภาพ';
    }
    return res.textValue?.trim() || '—';
  };

  const handleExportCsv = () => {
    const questionHeaders = questions
      .map((q) => `"${q.title.replace(/"/g, '""')}"`)
      .join(',');
    const headerRow = `รหัสรายการ,วันที่ส่งข้อมูล,เวลาที่บันทึก,สาขา,ชื่อเล่นพนักงาน,${questionHeaders},จำนวนรูปภาพทั้งหมด`;

    const rows = filteredSubmissions.map((sub) => {
      const timeStr = new Date(sub.createdAt).toLocaleTimeString('th-TH', {
        hour: '2-digit',
        minute: '2-digit',
      });
      const qCols = questions
        .map((q) => {
          const found = sub.responses.find(
            (r) => r.questionId === q.id || r.questionTitle === q.title
          );
          const text = formatAnswerText(found).replace(/"/g, '""');
          return `"${text}"`;
        })
        .join(',');

      return `${sub.id},${sub.submissionDate},${timeStr},"${sub.branchName}","${sub.employeeName}",${qCols},${sub.images.length}`;
    });

    const csvContent = '\uFEFF' + [headerRow, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `คำตอบแบบฟอร์ม_KPI_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const nonImageQuestions = questions.filter((q) => q.type !== 'image_upload');

  const renderSubmissionRow = (sub: KpiSubmission) => {
    const timeStr = new Date(sub.createdAt).toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
    });

    return (
      <tr
        key={sub.id}
        className="hover:bg-slate-50/90 transition-colors border-b border-slate-100 last:border-b-0"
      >
        <td className="px-4 py-3.5 text-xs font-mono text-slate-700 whitespace-nowrap tabular-nums">
          <div className="font-semibold text-slate-900">
            {sub.submissionDate}
          </div>
          <div className="text-[11px] text-slate-400">{timeStr} น.</div>
        </td>

        <td className="px-4 py-3.5 text-xs font-semibold text-slate-900 whitespace-nowrap">
          {sub.branchName}
        </td>

        <td className="px-4 py-3.5 text-sm font-bold text-slate-900 whitespace-nowrap">
          {sub.employeeName}
        </td>

        {nonImageQuestions.map((q) => {
          const found = sub.responses.find(
            (r) => r.questionId === q.id || r.questionTitle === q.title
          );
          const isNumeric = q.type === 'number';

          return (
            <td
              key={q.id}
              className={`px-4 py-3.5 text-xs ${
                isNumeric
                  ? 'text-right font-mono font-semibold text-slate-900 whitespace-nowrap tabular-nums'
                  : 'text-slate-700 max-w-[240px]'
              }`}
            >
              <div className={isNumeric ? '' : 'line-clamp-2'}>
                {formatAnswerText(found)}
              </div>
            </td>
          );
        })}

        <td className="px-4 py-3.5 whitespace-nowrap">
          {sub.images.length === 0 ? (
            <span className="text-xs text-slate-400">ไม่มีรูปภาพแนบ</span>
          ) : (
            <div className="flex items-center gap-2">
              <div className="flex items-center -space-x-1.5">
                {sub.images.slice(0, 3).map((img, idx) => (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => handleOpenEvidenceModal(sub, idx)}
                    title={`ดูรูปภาพ ${img.fileName}`}
                    className="w-9 h-9 rounded-lg border-2 border-white overflow-hidden bg-slate-100 hover:scale-105 transition-transform cursor-pointer ring-1 ring-slate-200"
                  >
                    <img
                      src={img.dataUrl}
                      alt={img.fileName}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => handleOpenEvidenceModal(sub, 0)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-slate-800 hover:text-slate-900 hover:underline cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5 text-slate-500" />
                <span className="font-mono tabular-nums">
                  ดูรูปภาพ ({sub.images.length})
                </span>
              </button>
            </div>
          )}
        </td>

        <td className="px-4 py-3.5 text-right whitespace-nowrap">
          <div className="inline-flex items-center gap-1">
            <button
              type="button"
              onClick={() => handleOpenEvidenceModal(sub, 0)}
              className="px-2.5 py-1 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
            >
              เปิดดูคำตอบ
            </button>
            <button
              type="button"
              onClick={() => onDeleteSubmission(sub.id)}
              aria-label="ลบรายการคำตอบ"
              className="p-1.5 text-slate-400 hover:text-red-600 rounded-md transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Manager Header & Mode Tabs */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1.5">
            <span>ยืนยันตัวตนด้วยรหัส PIN เรียบร้อยแล้ว</span>
            <span>·</span>
            <span>ระบบจัดการสาขา หมวดหมู่คำถาม และคำตอบ KPI พนักงาน</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            หน้าสำหรับผู้จัดการ — ระบบแบบฟอร์มและบริหารสาขา
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Primary Sub-Tab Switcher */}
          <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-200/80 rounded-lg">
            <button
              type="button"
              onClick={() => setActiveSubTab('responses')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                activeSubTab === 'responses'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>คำตอบที่ส่งเข้ามา ({submissions.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('form_builder')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                activeSubTab === 'form_builder'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>
                จัดการหมวดหมู่และคำถาม ({categories.length} หมวด · {questions.length} ข้อ)
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('branch_manager')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                activeSubTab === 'branch_manager'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>จัดการสาขาและสถานที่ตั้ง ({branches.length})</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowWebhookDrawer((prev) => !prev)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
          >
            <MessageSquareShare className="w-3.5 h-3.5 text-emerald-600" />
            <span>ประวัติแจ้งเตือน LINE ({lineLogs.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setShowSchemaModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
          >
            <Database className="w-3.5 h-3.5 text-slate-500" />
            <span>คำสั่ง SQL</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>ส่งออกไฟล์ CSV</span>
          </button>
        </div>
      </div>

      {/* Sub-Tab 2: Embedded Google Forms-style Categorized Form Builder */}
      {activeSubTab === 'form_builder' ? (
        <div className="max-w-4xl mx-auto">
          <KpiTemplateCustomizer
            isOpen={true}
            embedded={true}
            categories={categories}
            questions={questions}
            onSaveCategories={onSaveCategories}
            onSaveQuestions={onSaveQuestions}
            onClose={() => setActiveSubTab('responses')}
          />
        </div>
      ) : activeSubTab === 'branch_manager' ? (
        /* Sub-Tab 3: Branch & Location Management */
        <div className="space-y-6">
          {(branchNotice || branchError) && (
            <div
              className={`px-4 py-3 rounded-xl text-xs font-semibold flex items-center justify-between border ${
                branchError
                  ? 'bg-red-50 text-red-700 border-red-200'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
              }`}
            >
              <span>{branchError || branchNotice}</span>
              <button
                type="button"
                onClick={() => {
                  setBranchNotice(null);
                  setBranchError(null);
                }}
                className="underline cursor-pointer"
              >
                ปิดข้อความ
              </button>
            </div>
          )}

          {/* Create New Branch Card */}
          <form
            onSubmit={handleCreateBranchInManager}
            className="bg-white border border-slate-200 rounded-xl p-6 space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  เพิ่มสาขาและสถานที่ตั้งใหม่
                </h2>
                <p className="text-xs text-slate-500">
                  ข้อมูลสาขาที่เพิ่มหรือแก้ไขจะอัปเดตไปยังหน้าเลือกสาขาของพนักงานโดยอัตโนมัติ
                </p>
              </div>
              <span className="text-xs font-mono text-slate-500">
                จำนวนสาขาปัจจุบัน: {branches.length} สาขา
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ชื่อสาขา *
                </label>
                <input
                  type="text"
                  placeholder="เช่น สาขาอารีย์ หรือ สาขาลาดพร้าว"
                  value={newBranchName}
                  onChange={(e) => {
                    setNewBranchName(e.target.value);
                    setBranchError(null);
                  }}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  รหัสสาขา
                </label>
                <input
                  type="text"
                  placeholder="เช่น BKK-LDP"
                  value={newBranchCode}
                  onChange={(e) => setNewBranchCode(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-mono bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  เขต / พื้นที่ตั้ง
                </label>
                <input
                  type="text"
                  placeholder="เช่น เขตจตุจักร กรุงเทพฯ"
                  value={newBranchDistrict}
                  onChange={(e) => setNewBranchDistrict(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  รายละเอียดสถานที่ตั้ง
                </label>
                <input
                  type="text"
                  placeholder="เช่น 1693 ถ.พหลโยธิน ชั้น 2"
                  value={newBranchAddress}
                  onChange={(e) => setNewBranchAddress(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>เพิ่มสาขาใหม่</span>
              </button>
            </div>
          </form>

          {/* Existing Branches Table / Editor */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                รายชื่อสาขาและสถานที่ตั้งทั้งหมด ({branches.length} สาขา)
              </h3>
              <span className="text-xs text-slate-500">
                คลิกปุ่ม &ldquo;แก้ไข&rdquo; เพื่อปรับเปลี่ยนชื่อสาขาหรือสถานที่ตั้ง
              </span>
            </div>

            <div className="divide-y divide-slate-200">
              {branches.map((branch) => {
                const isEditing = editingBranchId === branch.id;
                const branchStaff = employees.filter(
                  (e) => e.branchId === branch.id
                );
                const branchSubCount = submissions.filter(
                  (s) => s.branchId === branch.id
                ).length;

                return (
                  <div key={branch.id} className="p-5">
                    {isEditing ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                              ชื่อสาขา *
                            </label>
                            <input
                              type="text"
                              value={editBranchName}
                              onChange={(e) =>
                                setEditBranchName(e.target.value)
                              }
                              className="w-full px-3 py-2 text-sm font-semibold bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                              รหัสสาขา
                            </label>
                            <input
                              type="text"
                              value={editBranchCode}
                              onChange={(e) =>
                                setEditBranchCode(e.target.value)
                              }
                              className="w-full px-3 py-2 text-sm font-mono bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                              เขต / พื้นที่ตั้ง
                            </label>
                            <input
                              type="text"
                              value={editBranchDistrict}
                              onChange={(e) =>
                                setEditBranchDistrict(e.target.value)
                              }
                              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                              รายละเอียดสถานที่ตั้ง
                            </label>
                            <input
                              type="text"
                              value={editBranchAddress}
                              onChange={(e) =>
                                setEditBranchAddress(e.target.value)
                              }
                              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
                            />
                          </div>
                        </div>

                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingBranchId(null)}
                            className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
                          >
                            ยกเลิก
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveBranchRow(branch.id)}
                            className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>บันทึกการแก้ไข</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-base font-bold text-slate-900">
                              {branch.name}
                            </span>
                            <span className="text-xs font-mono text-slate-500">
                              ({branch.code})
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-slate-400" />
                              {branch.district} — {branch.addressSummary}
                            </span>
                            <span>·</span>
                            <span className="inline-flex items-center gap-1">
                              <Users className="w-3.5 h-3.5 text-slate-400" />
                              ชื่อเล่นพนักงาน {branchStaff.length} ท่าน (
                              {branchStaff.map((s) => s.name).join(', ') ||
                                'ยังไม่มีพนักงาน'}
                              )
                            </span>
                            <span>·</span>
                            <span className="font-mono">
                              ส่ง KPI แล้ว {branchSubCount} รายการ
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => startEditBranchRow(branch)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            <span>แก้ไขสาขา / สถานที่ตั้ง</span>
                          </button>

                          {branches.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveBranchRow(branch)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>ลบสาขา</span>
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Executive Summary Metrics Strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <p className="text-xs font-medium text-slate-500">
                จำนวนการส่งคำตอบทั้งหมด
              </p>
              <p className="mt-1.5 text-2xl font-bold font-mono text-slate-900 tabular-nums">
                {stats.count}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {selectedBranchFilter === 'all'
                  ? `รวมทุกสาขา (${branches.length} สาขา)`
                  : 'เฉพาะสาขาที่เลือก'}
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <p className="text-xs font-medium text-slate-500">
                หมวดหมู่และคำถามในแบบฟอร์ม
              </p>
              <p className="mt-1.5 text-2xl font-bold font-mono text-slate-900 tabular-nums">
                {stats.categoryCount} หมวด · {stats.questionCount} ข้อ
              </p>
              <p className="mt-1 text-xs text-slate-500">
                ปรับแต่งได้ในเมนูจัดการหมวดหมู่และคำถาม
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <p className="text-xs font-medium text-slate-500">
                จำนวนพนักงานในระบบ
              </p>
              <p className="mt-1.5 text-2xl font-bold font-mono text-slate-900 tabular-nums">
                {stats.totalStaff} ท่าน
              </p>
              <p className="mt-1 text-xs text-slate-500">
                รายชื่อชื่อเล่นพนักงานประจำสาขา
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <p className="text-xs font-medium text-slate-500">
                รูปภาพหลักฐานที่แนบ
              </p>
              <p className="mt-1.5 text-2xl font-bold font-mono text-slate-900 tabular-nums">
                {stats.totalPhotos} รูป
              </p>
              <p className="mt-1 text-xs text-slate-500">
                ใบสรุปยอดขายและภาพถ่ายหน้าร้าน
              </p>
            </div>
          </div>

          {/* Optional LINE Webhook Dispatch Log Drawer */}
          {showWebhookDrawer && (
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    ประวัติการส่งแจ้งเตือนผ่าน LINE Webhook
                  </h2>
                  <p className="text-xs text-slate-500">
                    ตรวจสอบข้อมูลที่สร้างโดยฟังก์ชัน{' '}
                    <span className="font-mono">
                      sendLineNotification(formData)
                    </span>{' '}
                    เมื่อพนักงานกดส่งแบบฟอร์ม
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowWebhookDrawer(false)}
                  className="text-xs font-medium text-slate-500 hover:text-slate-900 cursor-pointer"
                >
                  ปิดหน้าต่าง
                </button>
              </div>

              {lineLogs.length === 0 ? (
                <p className="text-xs text-slate-500 py-4">
                  ยังไม่มีรายการส่งแจ้งเตือน LINE ใหม่ในรอบการใช้งานนี้ ท่านสามารถทดลองส่งแบบฟอร์ม KPI จากหน้าสาขาเพื่อดูตัวอย่างข้อความแจ้งเตือน LINE ได้ทันที
                </p>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {lineLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2 text-slate-500 font-mono mb-1.5">
                          <span>
                            {new Date(log.timestamp).toLocaleTimeString('th-TH')}
                          </span>
                          <span>·</span>
                          <span className="text-emerald-700 font-semibold">
                            POST {log.endpointUrl}
                          </span>
                        </div>
                        <pre className="p-2.5 bg-white border border-slate-200 rounded font-mono text-[11px] text-slate-800 whitespace-pre-wrap">
                          {log.formattedMessage}
                        </pre>
                      </div>
                      <div>
                        <div className="text-slate-500 font-mono mb-1.5">
                          ข้อมูล JSON Payload (สำหรับส่งไปยัง Supabase Edge Function):
                        </div>
                        <pre className="p-2.5 bg-slate-900 text-slate-100 rounded font-mono text-[11px] overflow-x-auto max-h-40">
                          {log.payloadJson}
                        </pre>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Filter Bar */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto">
              <button
                type="button"
                onClick={() => setSelectedBranchFilter('all')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  selectedBranchFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ทุกสาขา ({submissions.length})
              </button>
              {branches.map((b) => {
                const count = submissions.filter(
                  (s) => s.branchId === b.id
                ).length;
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setSelectedBranchFilter(b.id)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      selectedBranchFilter === b.id
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {b.name} ({count})
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative flex-1 sm:flex-initial sm:w-60">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="ค้นหาชื่อเล่นพนักงาน หรือคำตอบ..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
                />
              </div>

              <input
                type="date"
                aria-label="กรองข้อมูลตามวันที่ส่งข้อมูล"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 tabular-nums"
              />

              {(searchQuery ||
                dateFilter ||
                selectedBranchFilter !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setDateFilter('');
                    setSelectedBranchFilter('all');
                  }}
                  className="px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  ล้างตัวกรอง
                </button>
              )}

              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
                    viewMode === 'table'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ListFilter className="w-3.5 h-3.5" />
                  <span>ตารางรวม</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('grouped_by_branch')}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
                    viewMode === 'grouped_by_branch'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>แยกตามสาขา</span>
                </button>
              </div>
            </div>
          </div>

          {/* Main Data View */}
          {filteredSubmissions.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
              <p className="text-sm font-semibold text-slate-800">
                ไม่พบข้อมูลการส่งแบบฟอร์ม KPI ที่ตรงกับเงื่อนไขการค้นหา
              </p>
              <p className="text-xs text-slate-500 mt-1">
                กรุณาลองล้างตัวกรองการค้นหา หรือทำรายการส่งข้อมูลใหม่จากหน้าระบบสาขา
              </p>
            </div>
          ) : viewMode === 'table' ? (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold text-slate-600">
                      <th className="px-4 py-3 whitespace-nowrap">
                        วันที่ / เวลาส่งข้อมูล
                      </th>
                      <th className="px-4 py-3 whitespace-nowrap">สาขา</th>
                      <th className="px-4 py-3 whitespace-nowrap">
                        ชื่อเล่นพนักงาน
                      </th>
                      {nonImageQuestions.map((q) => {
                        const catName = categories.find(
                          (c) => c.id === q.categoryId
                        )?.name;
                        return (
                          <th
                            key={q.id}
                            className={`px-4 py-3 whitespace-nowrap ${
                              q.type === 'number' ? 'text-right' : 'text-left'
                            }`}
                          >
                            {catName && (
                              <div className="text-[10px] font-normal text-slate-400">
                                {catName}
                              </div>
                            )}
                            <div>{q.title}</div>
                          </th>
                        );
                      })}
                      <th className="px-4 py-3 whitespace-nowrap">
                        รูปภาพหลักฐานที่อัปโหลด
                      </th>
                      <th className="px-4 py-3 text-right whitespace-nowrap">
                        การจัดการ
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSubmissions.map((sub) => renderSubmissionRow(sub))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {branches
                .filter(
                  (b) =>
                    selectedBranchFilter === 'all' ||
                    b.id === selectedBranchFilter
                )
                .map((branch) => {
                  const branchSubs = filteredSubmissions.filter(
                    (s) => s.branchId === branch.id
                  );
                  const branchStaff = employees.filter(
                    (e) => e.branchId === branch.id
                  );

                  return (
                    <div
                      key={branch.id}
                      className="bg-white border border-slate-200 rounded-xl overflow-hidden"
                    >
                      <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <Building2 className="w-4 h-4 text-slate-600" />
                          <h3 className="text-base font-bold text-slate-900">
                            {branch.name}
                          </h3>
                          <span className="text-xs font-mono text-slate-500">
                            {branch.code} · {branch.district} · พนักงาน{' '}
                            {branchStaff.length} ท่าน · ส่งข้อมูลแล้ว{' '}
                            {branchSubs.length} รายการ
                          </span>
                        </div>
                      </div>

                      {branchSubs.length === 0 ? (
                        <div className="p-6 text-xs text-slate-500">
                          ยังไม่มีรายการส่งแบบฟอร์ม KPI สำหรับ{branch.name}ตามตัวกรองที่เลือก
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="border-b border-slate-200 bg-white text-[11px] font-semibold text-slate-500">
                                <th className="px-4 py-2.5 whitespace-nowrap">
                                  วันที่ / เวลาส่งข้อมูล
                                </th>
                                <th className="px-4 py-2.5 whitespace-nowrap">
                                  สาขา
                                </th>
                                <th className="px-4 py-2.5 whitespace-nowrap">
                                  ชื่อเล่นพนักงาน
                                </th>
                                {nonImageQuestions.map((q) => (
                                  <th
                                    key={q.id}
                                    className={`px-4 py-2.5 whitespace-nowrap ${
                                      q.type === 'number'
                                        ? 'text-right'
                                        : 'text-left'
                                    }`}
                                  >
                                    {q.title}
                                  </th>
                                ))}
                                <th className="px-4 py-2.5 whitespace-nowrap">
                                  รูปภาพหลักฐานที่อัปโหลด
                                </th>
                                <th className="px-4 py-2.5 text-right whitespace-nowrap">
                                  การจัดการ
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {branchSubs.map((sub) =>
                                renderSubmissionRow(sub)
                              )}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          )}

          {/* Footer Reset Utility */}
          <div className="pt-4 flex items-center justify-between text-xs text-slate-500">
            <span>
              แสดงข้อมูล {filteredSubmissions.length} รายการ จากทั้งหมด{' '}
              {submissions.length} รายการ
            </span>
            <button
              type="button"
              onClick={onResetDemoData}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>รีเซ็ตข้อมูลตัวอย่างเริ่มต้น</span>
            </button>
          </div>
        </>
      )}

      {/* High-Resolution Evidence & Full Response Lightbox Modal */}
      {activeSubmissionModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 overflow-y-auto"
          onClick={() => setActiveSubmissionModal(null)}
        >
          <div
            className="bg-white border border-slate-200 rounded-xl w-full max-w-4xl overflow-hidden my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs text-slate-500 font-mono tabular-nums">
                  <span>{activeSubmissionModal.branchName}</span>
                  <span>·</span>
                  <span>วันที่ {activeSubmissionModal.submissionDate}</span>
                  <span>·</span>
                  <span>
                    เวลา{' '}
                    {new Date(
                      activeSubmissionModal.createdAt
                    ).toLocaleTimeString('th-TH', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}{' '}
                    น.
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  ชื่อเล่นพนักงาน: {activeSubmissionModal.employeeName} — รายละเอียดคำตอบและรูปภาพหลักฐาน
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setActiveSubmissionModal(null)}
                aria-label="ปิดหน้าต่างรายละเอียด"
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12">
              {/* Left Column: Image Lightbox */}
              <div className="lg:col-span-7 bg-slate-950 flex flex-col justify-between p-5 min-h-[340px]">
                {activeSubmissionModal.images.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-16">
                    <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
                    <p className="text-xs">
                      ไม่มีรูปภาพหลักฐานการทำงานที่แนบมาในรายการนี้
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="relative flex-1 flex items-center justify-center overflow-hidden rounded-lg bg-slate-900">
                      <img
                        src={
                          activeSubmissionModal.images[activeImageIndex]
                            ?.dataUrl
                        }
                        alt={
                          activeSubmissionModal.images[activeImageIndex]
                            ?.fileName || 'รูปภาพหลักฐาน KPI'
                        }
                        referrerPolicy="no-referrer"
                        className="max-h-[380px] w-auto object-contain"
                      />

                      {activeSubmissionModal.images.length > 1 && (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              setActiveImageIndex((prev) =>
                                prev === 0
                                  ? activeSubmissionModal.images.length - 1
                                  : prev - 1
                              )
                            }
                            aria-label="รูปภาพก่อนหน้า"
                            className="absolute left-3 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors cursor-pointer"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setActiveImageIndex((prev) =>
                                prev ===
                                activeSubmissionModal.images.length - 1
                                  ? 0
                                  : prev + 1
                              )
                            }
                            aria-label="รูปภาพถัดไป"
                            className="absolute right-3 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors cursor-pointer"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-2 text-xs text-slate-300">
                      <span className="font-mono truncate">
                        {
                          activeSubmissionModal.images[activeImageIndex]
                            ?.fileName
                        }{' '}
                        (รูปที่ {activeImageIndex + 1} จาก{' '}
                        {activeSubmissionModal.images.length})
                      </span>

                      <div className="flex items-center gap-1.5">
                        {activeSubmissionModal.images.map((img, i) => (
                          <button
                            key={img.id}
                            type="button"
                            onClick={() => setActiveImageIndex(i)}
                            className={`w-10 h-10 rounded overflow-hidden border-2 transition-all cursor-pointer ${
                              i === activeImageIndex
                                ? 'border-white opacity-100'
                                : 'border-transparent opacity-50 hover:opacity-80'
                            }`}
                          >
                            <img
                              src={img.dataUrl}
                              alt={img.fileName}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Right Column: All Question & Answer Responses */}
              <div className="lg:col-span-5 p-6 space-y-4 max-h-[500px] overflow-y-auto">
                <div className="pb-3 border-b border-slate-200">
                  <span className="text-xs font-semibold text-slate-500 block">
                    คำตอบจากแบบฟอร์มทั้งหมด ({activeSubmissionModal.responses.length} ข้อ)
                  </span>
                </div>

                <div className="space-y-3">
                  {activeSubmissionModal.responses.map((res, idx) => (
                    <div
                      key={res.questionId}
                      className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5"
                    >
                      {res.categoryName && (
                        <div className="text-[11px] font-mono text-slate-500">
                          หมวดหมู่: {res.categoryName}
                        </div>
                      )}
                      <div className="text-xs font-bold text-slate-800">
                        {idx + 1}. {res.questionTitle}
                      </div>
                      <div
                        className={`text-sm ${
                          res.questionType === 'number'
                            ? 'font-mono font-bold text-slate-900 tabular-nums'
                            : 'text-slate-700 leading-relaxed'
                        }`}
                      >
                        {formatAnswerText(res)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Supabase PostgreSQL Schema Reference Modal */}
      {showSchemaModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4"
          onClick={() => setShowSchemaModal(false)}
        >
          <div
            className="bg-white border border-slate-200 rounded-xl w-full max-w-3xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  โครงสร้างฐานข้อมูล Supabase และนโยบายความปลอดภัย (RLS)
                </h3>
                <p className="text-xs text-slate-500">
                  ชุดคำสั่ง SQL สำหรับสร้างตารางข้อมูลบน Supabase ให้ตรงกับโครงสร้างแบบฟอร์มของแอปพลิเคชันนี้
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowSchemaModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <pre className="p-4 bg-slate-900 text-slate-100 rounded-lg font-mono text-xs overflow-x-auto max-h-96 leading-relaxed">
                {SUPABASE_SQL_SCHEMA}
              </pre>

              <div className="mt-4 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
                    setCopiedSchema(true);
                    setTimeout(() => setCopiedSchema(false), 2000);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  {copiedSchema
                    ? 'คัดลอกคำสั่ง SQL แล้ว'
                    : 'คัดลอกคำสั่ง SQL'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
