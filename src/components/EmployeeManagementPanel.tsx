import React, { useState } from 'react';
import {
  UserPlus,
  Trash2,
  Users,
  CheckCircle2,
  Building2,
  ArrowLeft,
} from 'lucide-react';
import { Branch, Employee } from '../types/kpi';

interface EmployeeManagementPanelProps {
  branch: Branch;
  branchEmployees: Employee[];
  selectedEmployeeId: string;
  onSelectEmployeeForForm: (employeeId: string) => void;
  onAddEmployee: (branchId: string, nickname: string) => Employee;
  onDeleteEmployee: (employeeId: string) => void;
  onBackToBranches: () => void;
}

export const EmployeeManagementPanel: React.FC<EmployeeManagementPanelProps> = ({
  branch,
  branchEmployees,
  selectedEmployeeId,
  onSelectEmployeeForForm,
  onAddEmployee,
  onDeleteEmployee,
  onBackToBranches,
}) => {
  const [newEmployeeNickname, setNewEmployeeNickname] = useState('');
  const [validationError, setValidationError] = useState('');
  const [recentActionMessage, setRecentActionMessage] = useState<string | null>(
    null
  );

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNickname = newEmployeeNickname.trim();
    if (!cleanNickname) {
      setValidationError('กรุณากรอกชื่อเล่นของพนักงาน');
      return;
    }

    const duplicate = branchEmployees.some(
      (emp) => emp.name.toLowerCase() === cleanNickname.toLowerCase()
    );
    if (duplicate) {
      setValidationError(
        `มีชื่อเล่น "${cleanNickname}" อยู่ใน${branch.name}เรียบร้อยแล้ว`
      );
      return;
    }

    const created = onAddEmployee(branch.id, cleanNickname);
    setNewEmployeeNickname('');
    setValidationError('');
    onSelectEmployeeForForm(created.id);
    setRecentActionMessage(
      `เพิ่มชื่อเล่น "${created.name}" ใน${branch.name}เรียบร้อยแล้ว`
    );
    setTimeout(() => setRecentActionMessage(null), 3500);
  };

  const handleRemoveEmployee = (emp: Employee) => {
    onDeleteEmployee(emp.id);
    setRecentActionMessage(
      `ลบรายชื่อ "${emp.name}" ออกจาก${branch.name}เรียบร้อยแล้ว`
    );
    setTimeout(() => setRecentActionMessage(null), 3500);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6">
      {/* Branch Identity Header */}
      <div className="flex items-center justify-between gap-2 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="font-mono font-medium text-slate-700">
              {branch.code}
            </span>
            <span>·</span>
            <span>{branch.district}</span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 mt-0.5 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-slate-500" />
            <span>รายชื่อพนักงาน ({branch.name})</span>
          </h2>
        </div>

        <button
          type="button"
          onClick={onBackToBranches}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>เปลี่ยนสาขา</span>
        </button>
      </div>

      {/* Add New Employee Form (Nickname Only) */}
      <form onSubmit={handleAddSubmit} className="mt-5">
        <label
          htmlFor="add-employee-nickname-input"
          className="block text-xs font-semibold text-slate-800 mb-1.5"
        >
          เพิ่มชื่อเล่นพนักงานใหม่ (ชื่อเล่น)
        </label>
        <div className="flex items-center gap-2">
          <input
            id="add-employee-nickname-input"
            type="text"
            placeholder="ระบุชื่อเล่นพนักงาน (เช่น นัท, พิม, กิต)"
            value={newEmployeeNickname}
            onChange={(e) => {
              setNewEmployeeNickname(e.target.value);
              if (validationError) setValidationError('');
            }}
            className="flex-1 px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-colors"
          />

          <button
            type="submit"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap cursor-pointer shrink-0"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>เพิ่มพนักงาน</span>
          </button>
        </div>

        {validationError && (
          <p className="mt-2 text-xs font-medium text-red-600">
            {validationError}
          </p>
        )}

        {recentActionMessage && (
          <div className="mt-2.5 flex items-center gap-1.5 text-xs font-medium text-emerald-700">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>{recentActionMessage}</span>
          </div>
        )}
      </form>

      {/* Branch Staff List (Nickname Only) */}
      <div className="mt-6 pt-5 border-t border-slate-200">
        <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
          <span className="font-semibold text-slate-700 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            รายชื่อชื่อเล่นพนักงานใน{branch.name}
          </span>
          <span className="font-mono font-semibold text-slate-800 tabular-nums">
            ทั้งหมด {branchEmployees.length} ท่าน
          </span>
        </div>

        {branchEmployees.length === 0 ? (
          <div className="py-8 px-4 text-center border border-dashed border-slate-200 rounded-lg">
            <p className="text-xs font-medium text-slate-600">
              ยังไม่มีรายชื่อพนักงานใน{branch.name}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              กรุณาเพิ่มชื่อเล่นพนักงานใหม่จากช่องกรอกข้อมูลด้านบน
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
            {branchEmployees.map((emp) => {
              const isSelectedForForm = selectedEmployeeId === emp.id;

              return (
                <li
                  key={emp.id}
                  className={`flex items-center justify-between gap-3 px-3.5 py-2.5 text-sm transition-colors ${
                    isSelectedForForm
                      ? 'bg-slate-100/80'
                      : 'bg-white hover:bg-slate-50'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onSelectEmployeeForForm(emp.id)}
                    className="flex-1 text-left min-w-0 cursor-pointer flex items-center gap-2"
                    title="คลิกเพื่อเลือกพนักงานท่านนี้ในแบบฟอร์มประเมิน KPI"
                  >
                    <span className="font-semibold text-slate-900 truncate">
                      {emp.name}
                    </span>
                    {isSelectedForForm && (
                      <span className="text-xs text-slate-600 font-medium shrink-0">
                        · เลือกในฟอร์มแล้ว
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRemoveEmployee(emp)}
                    aria-label={`ลบรายชื่อ ${emp.name}`}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors shrink-0 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>ลบรายชื่อ</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        <p className="mt-3 text-xs text-slate-500 leading-relaxed">
          คลิกที่ชื่อเล่นพนักงานเพื่อเลือกในแบบฟอร์มประเมิน KPI ด้านข้างได้ทันที หรือกดปุ่มลบรายชื่อเมื่อต้องการนำรายชื่อออก
        </p>
      </div>
    </div>
  );
};
