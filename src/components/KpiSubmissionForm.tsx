import React, { useState, useRef, useEffect } from 'react';
import {
  Calendar,
  UserCheck,
  SlidersHorizontal,
  Upload,
  X,
  CheckCircle2,
  Send,
  ShieldAlert,
  FileCheck2,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  Layers,
} from 'lucide-react';
import {
  Branch,
  Employee,
  FormQuestionCategory,
  FormQuestion,
  UploadedEvidence,
  FormQuestionResponse,
  KpiSubmission,
} from '../types/kpi';
import {
  STORAGE_KEYS,
} from '../services/supabaseMockService';

interface KpiSubmissionFormProps {
  branch: Branch;
  branchEmployees: Employee[];
  categories: FormQuestionCategory[];
  questions: FormQuestion[];
  selectedEmployeeId: string;
  onSelectEmployeeId: (id: string) => void;
  onOpenCustomizer: () => void;
  onSubmitKpi: (
    submission: Omit<KpiSubmission, 'id' | 'createdAt' | 'lineNotificationSent'>
  ) => Promise<void>;
}

/**
 * ย่อและบีบอัดไฟล์รูปภาพฝั่งเบราว์เซอร์ (Client-Side Image Compression)
 * เพื่อให้บันทึกใน localStorage, IndexedDB และ Supabase ได้อย่างรวดเร็วโดยไม่ติดข้อจำกัดขนาดไฟล์
 */
async function compressImageFile(file: File): Promise<{
  dataUrl: string;
  compressedSize: number;
  mimeType: string;
}> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const rawDataUrl = typeof reader.result === 'string' ? reader.result : '';
      if (!rawDataUrl) {
        resolve({
          dataUrl: '',
          compressedSize: file.size,
          mimeType: file.type || 'image/jpeg',
        });
        return;
      }

      const img = new Image();
      img.onload = () => {
        try {
          const MAX_DIMENSION = 800;
          let width = img.width;
          let height = img.height;

          if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
            if (width >= height) {
              height = Math.round((height * MAX_DIMENSION) / width);
              width = MAX_DIMENSION;
            } else {
              width = Math.round((width * MAX_DIMENSION) / height);
              height = MAX_DIMENSION;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve({
              dataUrl: rawDataUrl,
              compressedSize: file.size,
              mimeType: file.type,
            });
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.68);
          const estimatedBytes = Math.round(
            ((compressedDataUrl.length - 'data:image/jpeg;base64,'.length) *
              3) /
              4
          );
          resolve({
            dataUrl: compressedDataUrl,
            compressedSize: estimatedBytes > 0 ? estimatedBytes : file.size,
            mimeType: 'image/jpeg',
          });
        } catch {
          resolve({
            dataUrl: rawDataUrl,
            compressedSize: file.size,
            mimeType: file.type,
          });
        }
      };
      img.onerror = () => {
        resolve({
          dataUrl: rawDataUrl,
          compressedSize: file.size,
          mimeType: file.type,
        });
      };
      img.src = rawDataUrl;
    };
    reader.onerror = () => {
      resolve({
        dataUrl: '',
        compressedSize: file.size,
        mimeType: file.type,
      });
    };
    reader.readAsDataURL(file);
  });
}

export const KpiSubmissionForm: React.FC<KpiSubmissionFormProps> = ({
  branch,
  branchEmployees,
  categories,
  questions,
  selectedEmployeeId,
  onSelectEmployeeId,
  onOpenCustomizer,
  onSubmitKpi,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const draftStorageKey = `${STORAGE_KEYS.FORM_DRAFT}_${branch.id}`;

  const [submissionDate, setSubmissionDate] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(draftStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.submissionDate) return parsed.submissionDate;
      }
    } catch {
      // ignore
    }
    return todayStr;
  });

  const [activeCategoryId, setActiveCategoryId] = useState<string>(
    categories[0]?.id || ''
  );

  const [textAnswers, setTextAnswers] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem(draftStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.textAnswers) return parsed.textAnswers;
      }
    } catch {
      // ignore
    }
    return {};
  });

  const [numberAnswers, setNumberAnswers] = useState<Record<string, string>>(
    () => {
      try {
        const saved = localStorage.getItem(draftStorageKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.numberAnswers) return parsed.numberAnswers;
        }
      } catch {
        // ignore
      }
      return {};
    }
  );

  const [imageAnswers, setImageAnswers] = useState<
    Record<string, UploadedEvidence[]>
  >({});

  const [draggingQuestionId, setDraggingQuestionId] = useState<string | null>(
    null
  );
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [submissionSuccessInfo, setSubmissionSuccessInfo] = useState<{
    branchName: string;
    submissionDate: string;
    timestamp: string;
  } | null>(null);

  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // โหลดแบบร่างคำตอบเมื่อสลับสาขา
  useEffect(() => {
    try {
      const saved = localStorage.getItem(draftStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        setSubmissionDate(parsed.submissionDate || todayStr);
        setTextAnswers(parsed.textAnswers || {});
        setNumberAnswers(parsed.numberAnswers || {});
      } else {
        setSubmissionDate(todayStr);
        setTextAnswers({});
        setNumberAnswers({});
      }
    } catch {
      setSubmissionDate(todayStr);
      setTextAnswers({});
      setNumberAnswers({});
    }
    setImageAnswers({});
  }, [draftStorageKey, todayStr]);

  // บันทึกแบบร่างคำตอบที่กำลังพิมพ์ลงใน localStorage อัตโนมัติ (ป้องกันข้อมูลหายเมื่อรีเฟรชหน้าเว็บก่อนกดส่ง)
  useEffect(() => {
    try {
      localStorage.setItem(
        draftStorageKey,
        JSON.stringify({
          submissionDate,
          textAnswers,
          numberAnswers,
        })
      );
    } catch {
      // ignore
    }
  }, [draftStorageKey, submissionDate, textAnswers, numberAnswers]);

  useEffect(() => {
    if (
      categories.length > 0 &&
      !categories.some((c) => c.id === activeCategoryId)
    ) {
      setActiveCategoryId(categories[0].id);
    }
  }, [categories, activeCategoryId]);

  const activeCategoryIndex = Math.max(
    0,
    categories.findIndex((c) => c.id === activeCategoryId)
  );
  const activeCategory = categories[activeCategoryIndex] || categories[0];

  const activeCategoryQuestions = questions.filter((q) => {
    if (!activeCategory) return true;
    const belongsToAny = categories.some((c) => c.id === q.categoryId);
    if (!belongsToAny && activeCategoryIndex === 0) return true;
    return q.categoryId === activeCategory.id;
  });

  const isQuestionAnswered = (q: FormQuestion): boolean => {
    if (q.type === 'short_text' || q.type === 'paragraph') {
      return Boolean((textAnswers[q.id] || '').trim());
    }
    if (q.type === 'number') {
      const raw = numberAnswers[q.id];
      return raw !== undefined && raw.trim() !== '';
    }
    if (q.type === 'image_upload') {
      return (imageAnswers[q.id] || []).length > 0;
    }
    return false;
  };

  const handleTextChange = (questionId: string, value: string) => {
    setErrorMessage('');
    setTextAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleNumberChange = (
    questionId: string,
    rawVal: string,
    maxScore?: number
  ) => {
    setErrorMessage('');
    if (rawVal === '') {
      setNumberAnswers((prev) => ({ ...prev, [questionId]: '' }));
      return;
    }
    const num = Number(rawVal);
    if (Number.isNaN(num)) return;
    const clamped =
      maxScore !== undefined
        ? Math.max(0, Math.min(maxScore, num))
        : Math.max(0, num);
    setNumberAnswers((prev) => ({ ...prev, [questionId]: String(clamped) }));
  };

  const processFilesForQuestion = async (
    questionId: string,
    files: FileList | null
  ) => {
    if (!files || files.length === 0) return;
    setErrorMessage('');

    const fileArray = Array.from(files);
    for (const file of fileArray) {
      if (!file.type.startsWith('image/')) {
        setErrorMessage(
          'กรุณาอัปโหลดเฉพาะไฟล์รูปภาพ (JPG, PNG, WEBP) สำหรับใช้เป็นหลักฐานการทำงาน'
        );
        continue;
      }

      const compressed = await compressImageFile(file);
      if (compressed.dataUrl) {
        const newEvidence: UploadedEvidence = {
          id: `img_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          fileName: file.name,
          fileSize: compressed.compressedSize,
          mimeType: compressed.mimeType,
          dataUrl: compressed.dataUrl,
        };
        setImageAnswers((prev) => ({
          ...prev,
          [questionId]: [...(prev[questionId] || []), newEvidence],
        }));
      }
    }
  };

  const handleRemoveImage = (questionId: string, imageId: string) => {
    setImageAnswers((prev) => ({
      ...prev,
      [questionId]: (prev[questionId] || []).filter(
        (img) => img.id !== imageId
      ),
    }));
  };

  const clearFormState = () => {
    setTextAnswers({});
    setNumberAnswers({});
    setImageAnswers({});
    setErrorMessage('');
    try {
      localStorage.removeItem(draftStorageKey);
    } catch {
      // ignore
    }
    if (categories[0]) {
      setActiveCategoryId(categories[0].id);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!submissionDate) {
      setErrorMessage('กรุณาเลือกวันที่ส่งข้อมูล');
      return;
    }

    const employee = branchEmployees.find(
      (emp) => emp.id === selectedEmployeeId
    );
    if (!employee) {
      setErrorMessage('กรุณาเลือกชื่อเล่นพนักงานจากรายการพนักงานในสาขา');
      return;
    }

    if (questions.length === 0) {
      setErrorMessage(
        'ยังไม่มีคำถามในแบบฟอร์ม กรุณากดปุ่ม "สร้าง / แก้ไขคำถาม" เพื่อเพิ่มคำถาม'
      );
      return;
    }

    const responses: FormQuestionResponse[] = [];
    const allImages: UploadedEvidence[] = [];

    for (const q of questions) {
      const catObj = categories.find((c) => c.id === q.categoryId);
      const catName = catObj?.name || 'ทั่วไป';

      if (q.type === 'short_text' || q.type === 'paragraph') {
        const val = (textAnswers[q.id] || '').trim();
        if (q.required && !val) {
          if (catObj) setActiveCategoryId(catObj.id);
          setErrorMessage(
            `กรุณาตอบคำถาม "${q.title}" ในหมวด "${catName}" ให้ครบถ้วน`
          );
          return;
        }
        responses.push({
          questionId: q.id,
          categoryId: q.categoryId,
          categoryName: catName,
          questionTitle: q.title,
          questionType: q.type,
          textValue: val,
        });
      } else if (q.type === 'number') {
        const raw = numberAnswers[q.id];
        if (q.required && (raw === undefined || raw.trim() === '')) {
          if (catObj) setActiveCategoryId(catObj.id);
          setErrorMessage(
            `กรุณากรอกตัวเลขในหัวข้อ "${q.title}" (หมวด "${catName}")`
          );
          return;
        }
        const numVal =
          raw !== undefined && raw.trim() !== '' ? Number(raw) : undefined;
        if (numVal !== undefined && Number.isNaN(numVal)) {
          if (catObj) setActiveCategoryId(catObj.id);
          setErrorMessage(`ข้อมูลในหัวข้อ "${q.title}" ต้องเป็นตัวเลขเท่านั้น`);
          return;
        }
        if (
          numVal !== undefined &&
          q.maxScore !== undefined &&
          (numVal < 0 || numVal > q.maxScore)
        ) {
          if (catObj) setActiveCategoryId(catObj.id);
          setErrorMessage(
            `ตัวเลขในหัวข้อ "${q.title}" ต้องอยู่ระหว่าง 0 ถึง ${q.maxScore}`
          );
          return;
        }
        responses.push({
          questionId: q.id,
          categoryId: q.categoryId,
          categoryName: catName,
          questionTitle: q.title,
          questionType: 'number',
          numberValue: numVal,
          maxScore: q.maxScore,
          unitLabel: q.unitLabel,
        });
      } else if (q.type === 'image_upload') {
        const imgs = imageAnswers[q.id] || [];
        if (q.required && imgs.length === 0) {
          if (catObj) setActiveCategoryId(catObj.id);
          setErrorMessage(
            `กรุณาอัปโหลดรูปภาพในหัวข้อ "${q.title}" (หมวด "${catName}")`
          );
          return;
        }
        responses.push({
          questionId: q.id,
          categoryId: q.categoryId,
          categoryName: catName,
          questionTitle: q.title,
          questionType: 'image_upload',
          images: imgs,
        });
        allImages.push(...imgs);
      }
    }

    setIsSubmitting(true);
    try {
      await onSubmitKpi({
        branchId: branch.id,
        branchName: branch.name,
        employeeId: employee.id,
        employeeName: employee.name,
        submissionDate,
        responses,
        images: allImages,
      });

      // กฎความเป็นส่วนตัว: ล้างข้อมูลคำตอบทั้งหมดออกจากหน้าจอพนักงานทันทีหลังบันทึกถาวรเสร็จสิ้น
      clearFormState();
      onSelectEmployeeId('');

      setSubmissionSuccessInfo({
        branchName: branch.name,
        submissionDate,
        timestamp: new Date().toLocaleTimeString('th-TH', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submissionSuccessInfo) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="h-2.5 bg-slate-900" />
        <div className="p-8 sm:p-10 text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            บันทึกและส่งข้อมูลประเมิน KPI เรียบร้อยแล้ว!
          </h2>

          <p className="mt-2 text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
            ระบบได้บันทึกคำตอบของ{' '}
            <span className="font-semibold text-slate-900">
              {submissionSuccessInfo.branchName}
            </span>{' '}
            ประจำวันที่ {submissionSuccessInfo.submissionDate} เวลา{' '}
            {submissionSuccessInfo.timestamp} น. ลงฐานข้อมูลถาวรและส่งแจ้งเตือนไปยังกลุ่ม LINE ของผู้จัดการเรียบร้อยแล้ว
          </p>

          <div className="mt-6 max-w-md mx-auto bg-slate-50 border border-slate-200 rounded-lg p-4 text-left">
            <div className="flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-slate-700 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-600 leading-relaxed">
                <span className="font-semibold text-slate-900 block mb-0.5">
                  การคุ้มครองความลับของข้อมูลพนักงาน
                </span>
                ระบบได้ล้างข้อมูลคำตอบทั้งหมดออกจากหน้าจอแล้ว โดยจะไม่แสดงคำตอบหรือผลคะแนนย้อนหลังของพนักงานท่านใดบนหน้าจอนี้ ข้อมูลทั้งหมดถูกจัดเก็บอย่างปลอดภัยและตรวจสอบได้เฉพาะในหน้าสำหรับผู้จัดการเท่านั้น
              </div>
            </div>
          </div>

          <div className="mt-7 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setSubmissionSuccessInfo(null)}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <FileCheck2 className="w-4 h-4" />
              <span>ส่งคำตอบแบบฟอร์มรายการถัดไป</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleFormSubmit} className="space-y-4">
      {/* Google Forms-style Title Card */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="h-2.5 bg-slate-900" />
        <div className="p-6 sm:p-7 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>{branch.name}</span>
              <span>·</span>
              <span>แบบฟอร์มรายงานผลและประเมิน KPI แบ่งตามหมวดหมู่</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
              แบบฟอร์มส่งข้อมูล KPI พนักงาน ({branch.name})
            </h2>
            <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
              เลือกชื่อเล่นของท่าน แล้วคลิกเลือกแต่ละหมวดหมู่ด้านล่างเพื่อตอบคำถามให้ครบถ้วนโดยไม่ต้องเลื่อนหน้าจอยาว
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={clearFormState}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>ล้างคำตอบ</span>
            </button>

            <button
              type="button"
              onClick={onOpenCustomizer}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>สร้าง / แก้ไขคำถาม</span>
            </button>
          </div>
        </div>
      </div>

      {/* Respondent Info Card (Date Picker & Employee Nickname Only) */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label
            htmlFor="kpi-submission-date"
            className="flex items-center gap-1.5 text-sm font-bold text-slate-900 mb-2"
          >
            <Calendar className="w-4 h-4 text-slate-500" />
            <span>วันที่ส่งข้อมูล</span>
            <span className="text-red-600">*</span>
          </label>
          <input
            id="kpi-submission-date"
            type="date"
            value={submissionDate}
            onChange={(e) => {
              setSubmissionDate(e.target.value);
              setErrorMessage('');
            }}
            className="w-full px-3.5 py-2.5 text-sm font-mono bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-colors tabular-nums"
            required
          />
        </div>

        <div>
          <label
            htmlFor="kpi-employee-select"
            className="flex items-center gap-1.5 text-sm font-bold text-slate-900 mb-2"
          >
            <UserCheck className="w-4 h-4 text-slate-500" />
            <span>ชื่อเล่นพนักงาน ({branch.name})</span>
            <span className="text-red-600">*</span>
          </label>
          <select
            id="kpi-employee-select"
            value={selectedEmployeeId}
            onChange={(e) => {
              onSelectEmployeeId(e.target.value);
              setErrorMessage('');
            }}
            className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-colors"
            required
          >
            <option value="">
              -- กรุณาเลือกชื่อเล่นพนักงานใน{branch.name} --
            </option>
            {branchEmployees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Category Tabs Selector (Google Forms Section Navigation) */}
      {categories.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
            <span className="font-semibold text-slate-700 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-slate-500" />
              เลือกหมวดหมู่คำถามที่ต้องการกรอกข้อมูล
            </span>
            <span className="font-mono tabular-nums">
              หมวดที่ {activeCategoryIndex + 1} จาก {categories.length}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {categories.map((cat, idx) => {
              const catQs = questions.filter((q) => q.categoryId === cat.id);
              const answeredCount = catQs.filter((q) =>
                isQuestionAnswered(q)
              ).length;
              const requiredQs = catQs.filter((q) => q.required);
              const allRequiredDone =
                requiredQs.length > 0 &&
                requiredQs.every((q) => isQuestionAnswered(q));
              const isCurrent = activeCategory?.id === cat.id;

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setActiveCategoryId(cat.id);
                    setErrorMessage('');
                  }}
                  className={`p-3 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                    isCurrent
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="min-w-0">
                    <div
                      className={`text-[11px] font-mono ${
                        isCurrent ? 'text-slate-300' : 'text-slate-500'
                      }`}
                    >
                      หมวดที่ {idx + 1}
                    </div>
                    <div className="text-xs font-bold truncate mt-0.5">
                      {cat.name}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {allRequiredDone && (
                      <CheckCircle2
                        className={`w-4 h-4 ${
                          isCurrent ? 'text-emerald-400' : 'text-emerald-600'
                        }`}
                      />
                    )}
                    <span
                      className={`text-xs font-mono tabular-nums ${
                        isCurrent ? 'text-slate-200' : 'text-slate-500'
                      }`}
                    >
                      {answeredCount}/{catQs.length}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Active Category Banner & Questions */}
      {activeCategory && (
        <div className="bg-slate-900 text-white rounded-xl px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-xs font-mono text-slate-300">
              หมวดที่ {activeCategoryIndex + 1} จาก {categories.length}
            </span>
            <h3 className="text-base font-bold">{activeCategory.name}</h3>
            {activeCategory.description && (
              <p className="text-xs text-slate-300 mt-0.5">
                {activeCategory.description}
              </p>
            )}
          </div>
          <span className="text-xs font-mono text-slate-300 tabular-nums shrink-0">
            คำถามในหมวดนี้ {activeCategoryQuestions.length} ข้อ
          </span>
        </div>
      )}

      {/* Questions inside Active Category */}
      {activeCategoryQuestions.map((q, idx) => {
        const imgsForQuestion = imageAnswers[q.id] || [];

        return (
          <div
            key={q.id}
            className="bg-white border border-slate-200 rounded-xl p-6 space-y-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <label
                  htmlFor={`question-input-${q.id}`}
                  className="text-sm sm:text-base font-bold text-slate-900"
                >
                  ข้อที่ {idx + 1}: {q.title}
                  {q.required && <span className="text-red-600 ml-1">*</span>}
                </label>
                {q.description && (
                  <p className="text-xs text-slate-500 mt-1">
                    {q.description}
                  </p>
                )}
              </div>

              <span className="text-xs text-slate-400 shrink-0">
                {q.type === 'short_text' && 'ข้อความสั้น'}
                {q.type === 'paragraph' && 'ข้อความยาว'}
                {q.type === 'number' &&
                  (q.maxScore ? `ตัวเลข (0–${q.maxScore})` : 'ตัวเลข')}
                {q.type === 'image_upload' && 'อัปโหลดรูปภาพ'}
              </span>
            </div>

            {q.type === 'short_text' && (
              <div className="pt-1">
                <input
                  id={`question-input-${q.id}`}
                  type="text"
                  placeholder="พิมพ์คำตอบของคุณ..."
                  value={textAnswers[q.id] || ''}
                  onChange={(e) => handleTextChange(q.id, e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-colors"
                />
              </div>
            )}

            {q.type === 'paragraph' && (
              <div className="pt-1">
                <textarea
                  id={`question-input-${q.id}`}
                  rows={3}
                  placeholder="พิมพ์รายละเอียดคำตอบของคุณ..."
                  value={textAnswers[q.id] || ''}
                  onChange={(e) => handleTextChange(q.id, e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-colors"
                />
              </div>
            )}

            {q.type === 'number' && (
              <div className="pt-1 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="relative flex-1 max-w-sm flex items-center gap-2">
                  <input
                    id={`question-input-${q.id}`}
                    type="number"
                    min={0}
                    max={q.maxScore}
                    step="any"
                    placeholder={
                      q.maxScore
                        ? `กรอกตัวเลข (0 - ${q.maxScore})`
                        : 'กรอกตัวเลขคำตอบของคุณ...'
                    }
                    value={numberAnswers[q.id] ?? ''}
                    onChange={(e) =>
                      handleNumberChange(q.id, e.target.value, q.maxScore)
                    }
                    className="w-full px-3.5 py-2.5 text-sm font-mono font-semibold text-slate-900 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white tabular-nums"
                  />
                  {q.unitLabel && (
                    <span className="text-xs font-semibold text-slate-600 shrink-0">
                      {q.unitLabel}
                    </span>
                  )}
                </div>

                {q.maxScore && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-slate-400 mr-1">
                      เลือกเร็ว:
                    </span>
                    {[0.7, 0.85, 1].map((ratio) => {
                      const presetVal = Math.round(q.maxScore! * ratio);
                      const isSelected =
                        numberAnswers[q.id] === String(presetVal);
                      return (
                        <button
                          key={ratio}
                          type="button"
                          onClick={() =>
                            handleNumberChange(
                              q.id,
                              String(presetVal),
                              q.maxScore
                            )
                          }
                          className={`px-2.5 py-1.5 text-xs font-mono rounded-md border transition-colors cursor-pointer tabular-nums ${
                            isSelected
                              ? 'bg-slate-900 text-white border-slate-900'
                              : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                          }`}
                        >
                          {presetVal}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {q.type === 'image_upload' && (
              <div className="pt-1 space-y-3">
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDraggingQuestionId(q.id);
                  }}
                  onDragLeave={() => setDraggingQuestionId(null)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDraggingQuestionId(null);
                    void processFilesForQuestion(q.id, e.dataTransfer.files);
                  }}
                  onClick={() => fileInputRefs.current[q.id]?.click()}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      fileInputRefs.current[q.id]?.click();
                    }
                  }}
                  className={`border-2 border-dashed rounded-xl p-5 text-center transition-colors cursor-pointer ${
                    draggingQuestionId === q.id
                      ? 'border-slate-900 bg-slate-100/70'
                      : 'border-slate-300 bg-slate-50 hover:border-slate-400 hover:bg-slate-100/50'
                  }`}
                >
                  <input
                    ref={(el) => {
                      fileInputRefs.current[q.id] = el;
                    }}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                      void processFilesForQuestion(q.id, e.target.files);
                      if (fileInputRefs.current[q.id]) {
                        fileInputRefs.current[q.id]!.value = '';
                      }
                    }}
                    className="hidden"
                  />
                  <Upload className="w-5 h-5 text-slate-500 mx-auto mb-1.5" />
                  <p className="text-xs sm:text-sm font-semibold text-slate-800">
                    คลิกเพื่อเพิ่มไฟล์รูปภาพ หรือลากไฟล์มาวางที่นี่
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    รองรับไฟล์รูปภาพ JPG, PNG, WEBP (ระบบปรับขนาดอัตโนมัติเพื่อบันทึกถาวร)
                  </p>
                </div>

                {imgsForQuestion.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-1">
                    {imgsForQuestion.map((img) => (
                      <div
                        key={img.id}
                        className="group relative border border-slate-200 rounded-lg overflow-hidden bg-slate-50"
                      >
                        <div className="aspect-4/3 w-full bg-slate-100 overflow-hidden">
                          <img
                            src={img.dataUrl}
                            alt={img.fileName}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="p-2 flex items-center justify-between gap-1 bg-white">
                          <span className="text-xs font-medium text-slate-700 truncate">
                            {img.fileName}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveImage(q.id, img.id);
                            }}
                            aria-label={`ลบรูปภาพ ${img.fileName}`}
                            className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors cursor-pointer shrink-0"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-700">
          {errorMessage}
        </div>
      )}

      {/* Section Navigation & Final Submit Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {activeCategoryIndex > 0 && (
            <button
              type="button"
              onClick={() =>
                setActiveCategoryId(categories[activeCategoryIndex - 1].id)
              }
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>หมวดก่อนหน้า</span>
            </button>
          )}

          {activeCategoryIndex < categories.length - 1 && (
            <button
              type="button"
              onClick={() =>
                setActiveCategoryId(categories[activeCategoryIndex + 1].id)
              }
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <span>
                ถัดไป: {categories[activeCategoryIndex + 1]?.name}
              </span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center gap-2 px-7 py-3 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
        >
          <Send className="w-4 h-4" />
          <span>
            {isSubmitting ? 'กำลังบันทึกข้อมูลถาวร...' : 'ส่งข้อมูล'}
          </span>
        </button>
      </div>
    </form>
  );
};
