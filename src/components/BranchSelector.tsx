import React, { useState } from 'react';
import {
  Building2,
  ArrowRight,
  Users,
  Plus,
  ShieldCheck,
  MapPin,
  Lock,
  Pencil,
  Trash2,
  Check,
  X,
} from 'lucide-react';
import { Branch, Employee } from '../types/kpi';

interface BranchSelectorProps {
  branches: Branch[];
  employees: Employee[];
  selectedBranchId: string | null;
  onSelectBranch: (branchId: string) => void;
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
  onOpenManagerLogin: () => void;
  onRequestPinProtectedAction: (
    description: string,
    onVerified: () => void
  ) => void;
}

export const BranchSelector: React.FC<BranchSelectorProps> = ({
  branches,
  employees,
  selectedBranchId,
  onSelectBranch,
  onAddBranch,
  onUpdateBranch,
  onDeleteBranch,
  onOpenManagerLogin,
  onRequestPinProtectedAction,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  const [newBranchCode, setNewBranchCode] = useState('');
  const [newBranchDistrict, setNewBranchDistrict] = useState('');
  const [newBranchAddress, setNewBranchAddress] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // State สำหรับแก้ไขข้อมูลสาขาและสถานที่ตั้ง
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [editName, setEditName] = useState('');
  const [editCode, setEditCode] = useState('');
  const [editDistrict, setEditDistrict] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3500);
  };

  const handleToggleAddBranchForm = () => {
    if (showAddForm) {
      setShowAddForm(false);
      return;
    }
    onRequestPinProtectedAction(
      'กรุณากรอกรหัส PIN 4 หลักเพื่อเพิ่มสาขาและสถานที่ตั้งใหม่',
      () => {
        setShowAddForm(true);
      }
    );
  };

  const handleCreateBranch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = newBranchName.trim();
    if (!trimmedName) {
      setErrorMsg('กรุณาระบุชื่อสาขา');
      return;
    }
    const generatedCode =
      newBranchCode.trim().toUpperCase() ||
      `BKK-${Math.floor(100 + Math.random() * 900)}`;
    const normalizedName = trimmedName.startsWith('สาขา')
      ? trimmedName
      : `สาขา${trimmedName}`;
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
    setErrorMsg('');
    setShowAddForm(false);
    showToast(`เพิ่ม "${normalizedName}" เรียบร้อยแล้ว`);
  };

  const startEditingBranch = (e: React.MouseEvent, branch: Branch) => {
    e.stopPropagation();
    onRequestPinProtectedAction(
      `กรุณากรอกรหัส PIN 4 หลักเพื่อแก้ไขชื่อสาขาและสถานที่ตั้งของ "${branch.name}"`,
      () => {
        setEditingBranch(branch);
        setEditName(branch.name);
        setEditCode(branch.code);
        setEditDistrict(branch.district);
        setEditAddress(branch.addressSummary);
      }
    );
  };

  const handleSaveEditBranch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBranch) return;
    const cleanName = editName.trim();
    if (!cleanName) return;

    onUpdateBranch(editingBranch.id, {
      name: cleanName,
      code: editCode.trim().toUpperCase() || editingBranch.code,
      district: editDistrict.trim() || 'กรุงเทพมหานคร',
      addressSummary: editAddress.trim() || 'จุดให้บริการหน้าร้านมาตรฐาน',
    });
    setEditingBranch(null);
    showToast(`บันทึกการแก้ไขข้อมูล "${cleanName}" เรียบร้อยแล้ว`);
  };

  const handleRemoveBranch = (e: React.MouseEvent, branch: Branch) => {
    e.stopPropagation();
    if (branches.length <= 1) {
      setErrorMsg('ระบบต้องมีสาขาที่เปิดใช้งานอย่างน้อย 1 สาขา');
      return;
    }
    onRequestPinProtectedAction(
      `กรุณากรอกรหัส PIN 4 หลักเพื่อยืนยันการลบ "${branch.name}"`,
      () => {
        onDeleteBranch(branch.id);
        showToast(`ลบ "${branch.name}" ออกจากระบบเรียบร้อยแล้ว`);
      }
    );
  };

  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Top Hero / Context Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-slate-200">
        <div className="max-w-2xl">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            xtencafe KPI
          </h1>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleToggleAddBranchForm}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{showAddForm ? 'ปิดฟอร์มเพิ่มสาขา' : 'เพิ่มสาขาใหม่'}</span>
          </button>

          <button
            type="button"
            onClick={onOpenManagerLogin}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>หน้าสำหรับผู้ตรวจสอบ</span>
          </button>
        </div>
      </div>

      {/* Status / Error Feedback */}
      {(statusMessage || errorMsg) && (
        <div
          className={`mt-5 px-4 py-3 rounded-xl text-xs font-semibold flex items-center justify-between border ${
            errorMsg
              ? 'bg-red-50 text-red-700 border-red-200'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}
        >
          <span>{errorMsg || statusMessage}</span>
          <button
            type="button"
            onClick={() => {
              setErrorMsg('');
              setStatusMessage(null);
            }}
            className="underline cursor-pointer"
          >
            รับทราบ
          </button>
        </div>
      )}

      {/* Add New Branch Drawer */}
      {showAddForm && (
        <form
          onSubmit={handleCreateBranch}
          className="mt-6 bg-white border border-slate-200 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-900">
              เพิ่มสาขาและสถานที่ตั้งใหม่
            </h2>
            <span className="text-xs text-slate-500">
              แสดงผลในหน้าเลือกสาขาและหน้าสำหรับผู้จัดการทันที
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                ชื่อสาขา *
              </label>
              <input
                type="text"
                placeholder="เช่น สาขาอารีย์ หรือ สาขาบางนา"
                value={newBranchName}
                onChange={(e) => {
                  setNewBranchName(e.target.value);
                  setErrorMsg('');
                }}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                รหัสสาขา
              </label>
              <input
                type="text"
                placeholder="เช่น BKK-ARI"
                value={newBranchCode}
                onChange={(e) => setNewBranchCode(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                เขต / พื้นที่ตั้ง
              </label>
              <input
                type="text"
                placeholder="เช่น เขตพญาไท กรุงเทพฯ"
                value={newBranchDistrict}
                onChange={(e) => setNewBranchDistrict(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                รายละเอียดสถานที่ตั้ง
              </label>
              <input
                type="text"
                placeholder="เช่น พหลโยธิน ซอย 7"
                value={newBranchAddress}
                onChange={(e) => setNewBranchAddress(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>บันทึกสาขาใหม่</span>
            </button>
          </div>
        </form>
      )}

      {/* Edit Existing Branch Modal */}
      {editingBranch && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4"
          onClick={() => setEditingBranch(null)}
        >
          <form
            onSubmit={handleSaveEditBranch}
            onClick={(e) => e.stopPropagation()}
            className="bg-white border border-slate-200 rounded-xl w-full max-w-lg p-6 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  แก้ไขข้อมูลสาขาและสถานที่ตั้ง
                </h3>
                <p className="text-xs text-slate-500">
                  ปรับปรุงชื่อสาขา รหัสสาขา เขตพื้นที่ และที่อยู่ของสาขา
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingBranch(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ชื่อสาขา *
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    รหัสสาขา
                  </label>
                  <input
                    type="text"
                    value={editCode}
                    onChange={(e) => setEditCode(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm font-mono bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    เขต / พื้นที่ตั้ง
                  </label>
                  <input
                    type="text"
                    value={editDistrict}
                    onChange={(e) => setEditDistrict(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  รายละเอียดสถานที่ตั้ง
                </label>
                <input
                  type="text"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingBranch(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>บันทึกการแก้ไข</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Branch Selection Grid */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {branches.map((branch) => {
          const branchStaff = employees.filter((e) => e.branchId === branch.id);
          const isSelected = selectedBranchId === branch.id;

          return (
            <div
              key={branch.id}
              onClick={() => onSelectBranch(branch.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectBranch(branch.id);
                }
              }}
              className={`group bg-white border rounded-xl p-6 transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'border-slate-900 ring-1 ring-slate-900'
                  : 'border-slate-200 hover:border-slate-400'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 text-xs text-slate-500 mb-3">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="font-mono font-medium text-slate-600 shrink-0">
                      {branch.code}
                    </span>
                    <span>·</span>
                    <span className="truncate">{branch.district}</span>
                  </div>

                  {/* Quick Edit / Delete Branch Controls */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => startEditingBranch(e, branch)}
                      title={`แก้ไขข้อมูล${branch.name}`}
                      aria-label={`แก้ไขข้อมูล${branch.name}`}
                      className="p-1 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    {branches.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => handleRemoveBranch(e, branch)}
                        title={`ลบ${branch.name}`}
                        aria-label={`ลบ${branch.name}`}
                        className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-xl font-bold text-slate-900 group-hover:text-slate-700 transition-colors">
                    {branch.name}
                  </h2>
                  <Building2 className="w-5 h-5 text-slate-400 group-hover:text-slate-900 transition-colors shrink-0 mt-0.5" />
                </div>

                <p className="mt-1.5 text-xs text-slate-500 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{branch.addressSummary}</span>
                </p>

                <div className="mt-5 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs text-slate-600 mb-2">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      ชื่อเล่นพนักงานในสาขา
                    </span>
                    <span className="font-mono font-semibold text-slate-900 tabular-nums">
                      {branchStaff.length} ท่าน
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 truncate">
                    {branchStaff.length > 0
                      ? branchStaff.map((s) => s.name).join(' · ')
                      : 'ยังไม่มีรายชื่อพนักงาน — คลิกเพื่อเพิ่มรายชื่อ'}
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-900">
                <span>เข้าสู่ระบบจัดการสาขา</span>
                <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Privacy & Workflow Footer Note */}
      <div className="mt-10 bg-white border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              ระบบรักษาความลับคะแนนประเมิน KPI ของพนักงาน
            </h3>
            <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
              เมื่อพนักงานกดส่งข้อมูลประเมิน KPI แล้ว ระบบจะส่งการแจ้งเตือนไปยังกลุ่ม LINE ของฝ่ายบริหารและล้างข้อมูลบนหน้าจอทันที โดยไม่แสดงคะแนนย้อนหลังของพนักงานท่านใดบนหน้าจอสำหรับพนักงาน
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
