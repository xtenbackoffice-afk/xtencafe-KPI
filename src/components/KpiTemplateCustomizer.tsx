import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  RotateCcw,
  Check,
  SlidersHorizontal,
  CheckCircle2,
  AlignLeft,
  FileText,
  Hash,
  Image as ImageIcon,
  ArrowUp,
  ArrowDown,
  Copy,
  FolderPlus,
  Layers,
} from 'lucide-react';
import {
  FormQuestionCategory,
  FormQuestion,
  FormQuestionType,
} from '../types/kpi';
import {
  INITIAL_QUESTION_CATEGORIES,
  INITIAL_FORM_QUESTIONS,
} from '../services/supabaseMockService';

interface KpiTemplateCustomizerProps {
  isOpen: boolean;
  categories: FormQuestionCategory[];
  questions: FormQuestion[];
  onSaveCategories: (updated: FormQuestionCategory[]) => void;
  onSaveQuestions: (updated: FormQuestion[]) => void;
  onClose: () => void;
  embedded?: boolean;
}

const QUESTION_TYPE_OPTIONS: {
  value: FormQuestionType;
  label: string;
}[] = [
  {
    value: 'short_text',
    label: 'ข้อความสั้น (คำตอบสั้นๆ)',
  },
  {
    value: 'paragraph',
    label: 'ข้อความยาว (ย่อหน้า)',
  },
  {
    value: 'number',
    label: 'ตัวเลข / คะแนน',
  },
  {
    value: 'image_upload',
    label: 'อัปโหลดรูปภาพ',
  },
];

export const KpiTemplateCustomizer: React.FC<KpiTemplateCustomizerProps> = ({
  isOpen,
  categories,
  questions,
  onSaveCategories,
  onSaveQuestions,
  onClose,
  embedded = false,
}) => {
  const [activeCategoryId, setActiveCategoryId] = useState<string>(
    categories[0]?.id || ''
  );
  const [showAddCategoryForm, setShowAddCategoryForm] =
    useState<boolean>(false);
  const [newCategoryName, setNewCategoryName] = useState<string>('');
  const [newCategoryDesc, setNewCategoryDesc] = useState<string>('');

  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  useEffect(() => {
    if (
      categories.length > 0 &&
      !categories.some((c) => c.id === activeCategoryId)
    ) {
      setActiveCategoryId(categories[0].id);
    }
  }, [categories, activeCategoryId]);

  if (!isOpen && !embedded) return null;

  const showToast = (msg: string) => {
    setErrorNotice(null);
    setStatusNotice(msg);
    setTimeout(() => setStatusNotice(null), 3000);
  };

  const activeCategory =
    categories.find((c) => c.id === activeCategoryId) || categories[0] || null;

  const activeCategoryQuestions = activeCategory
    ? questions.filter((q) => q.categoryId === activeCategory.id)
    : [];

  // เพิ่มหมวดหมู่คำถามใหม่ (Category Tab)
  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newCategoryName.trim();
    if (!cleanName) {
      setErrorNotice('กรุณาระบุชื่อหมวดหมู่คำถาม');
      return;
    }

    const newCat: FormQuestionCategory = {
      id: `cat_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: cleanName,
      description:
        newCategoryDesc.trim() || `คำถามในหมวด${cleanName}`,
    };

    const firstQuestion: FormQuestion = {
      id: `q_${Date.now()}_1`,
      categoryId: newCat.id,
      title: `คำถามประจำหมวด${cleanName}`,
      description: '',
      type: 'short_text',
      required: true,
    };

    onSaveCategories([...categories, newCat]);
    onSaveQuestions([...questions, firstQuestion]);
    setActiveCategoryId(newCat.id);
    setNewCategoryName('');
    setNewCategoryDesc('');
    setShowAddCategoryForm(false);
    showToast(`สร้างหมวดหมู่ "${cleanName}" เรียบร้อยแล้ว`);
  };

  // แก้ไขชื่อหรือคำอธิบายของหมวดหมู่ปัจจุบัน
  const handleUpdateCategory = (
    catId: string,
    patch: Partial<FormQuestionCategory>
  ) => {
    const updated = categories.map((c) =>
      c.id === catId ? { ...c, ...patch } : c
    );
    onSaveCategories(updated);
  };

  // ลบหมวดหมู่และคำถามในหมวดหมู่นั้น
  const handleDeleteCategory = (catId: string, catName: string) => {
    if (categories.length <= 1) {
      setErrorNotice('แบบฟอร์มต้องมีหมวดหมู่คำถามอย่างน้อย 1 หมวดหมู่');
      return;
    }
    const remainingCats = categories.filter((c) => c.id !== catId);
    const remainingQuestions = questions.filter((q) => q.categoryId !== catId);
    onSaveCategories(remainingCats);
    onSaveQuestions(remainingQuestions);
    setActiveCategoryId(remainingCats[0]?.id || '');
    showToast(`ลบหมวดหมู่ "${catName}" เรียบร้อยแล้ว`);
  };

  // เพิ่มคำถามใหม่ในหมวดหมู่ที่เลือกอยู่
  const handleAddQuestion = (type: FormQuestionType = 'short_text') => {
    if (!activeCategory) return;

    const defaultTitles: Record<FormQuestionType, string> = {
      short_text: 'คำถามใหม่ (ข้อความสั้น)',
      paragraph: 'ปัญหาที่พบ หรือรายละเอียดเพิ่มเติม',
      number: 'ตัวเลขยอดขาย หรือคะแนนประเมิน',
      image_upload: 'อัปโหลดรูปภาพหลักฐานการทำงาน',
    };

    const newQ: FormQuestion = {
      id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      categoryId: activeCategory.id,
      title: defaultTitles[type],
      description: '',
      type,
      required: true,
      unitLabel: type === 'number' ? 'คะแนน' : undefined,
      maxScore: type === 'number' ? 100 : undefined,
    };

    onSaveQuestions([...questions, newQ]);
    showToast(
      `เพิ่มคำถามใหม่ในหมวด "${activeCategory.name}" เรียบร้อยแล้ว`
    );
  };

  const handleDuplicateQuestion = (questionId: string) => {
    const idx = questions.findIndex((q) => q.id === questionId);
    if (idx === -1) return;
    const source = questions[idx];
    const copy: FormQuestion = {
      ...source,
      id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      title: `${source.title} (สำเนา)`,
    };
    const next = [...questions];
    next.splice(idx + 1, 0, copy);
    onSaveQuestions(next);
    showToast(`คัดลอกคำถาม "${source.title}" เรียบร้อยแล้ว`);
  };

  const handleDeleteQuestion = (id: string, title: string) => {
    if (questions.length <= 1) {
      setErrorNotice('แบบฟอร์มต้องมีคำถามอย่างน้อย 1 ข้อ');
      return;
    }
    onSaveQuestions(questions.filter((q) => q.id !== id));
    showToast(`ลบคำถาม "${title}" ออกจากหมวดหมู่เรียบร้อยแล้ว`);
  };

  const handleMoveQuestionInCategory = (
    questionId: string,
    direction: 'up' | 'down'
  ) => {
    const catQuestions = activeCategoryQuestions;
    const currentPos = catQuestions.findIndex((q) => q.id === questionId);
    const targetPos = direction === 'up' ? currentPos - 1 : currentPos + 1;
    if (currentPos === -1 || targetPos < 0 || targetPos >= catQuestions.length)
      return;

    const currentQ = catQuestions[currentPos];
    const targetQ = catQuestions[targetPos];

    const globalIdxA = questions.findIndex((q) => q.id === currentQ.id);
    const globalIdxB = questions.findIndex((q) => q.id === targetQ.id);
    if (globalIdxA === -1 || globalIdxB === -1) return;

    const next = [...questions];
    next[globalIdxA] = targetQ;
    next[globalIdxB] = currentQ;
    onSaveQuestions(next);
  };

  const handleUpdateQuestion = (
    id: string,
    patch: Partial<FormQuestion>
  ) => {
    const updated = questions.map((q) =>
      q.id === id ? { ...q, ...patch } : q
    );
    onSaveQuestions(updated);
  };

  const handleResetDefaults = () => {
    const defaultCats = JSON.parse(
      JSON.stringify(INITIAL_QUESTION_CATEGORIES)
    ) as FormQuestionCategory[];
    const defaultQs = JSON.parse(
      JSON.stringify(INITIAL_FORM_QUESTIONS)
    ) as FormQuestion[];
    onSaveCategories(defaultCats);
    onSaveQuestions(defaultQs);
    setActiveCategoryId(defaultCats[0]?.id || '');
    showToast('คืนค่าหมวดหมู่และชุดคำถามมาตรฐานเริ่มต้นเรียบร้อยแล้ว');
  };

  const renderQuestionTypePreview = (q: FormQuestion) => {
    if (q.type === 'short_text') {
      return (
        <div className="mt-3 pt-3 border-t border-dashed border-slate-200 flex items-center gap-2 text-xs text-slate-400">
          <AlignLeft className="w-3.5 h-3.5 text-slate-400" />
          <span className="border-b border-slate-300 pb-1 w-64">
            ข้อความคำตอบสั้นๆ ของพนักงาน...
          </span>
        </div>
      );
    }
    if (q.type === 'paragraph') {
      return (
        <div className="mt-3 pt-3 border-t border-dashed border-slate-200 flex items-center gap-2 text-xs text-slate-400">
          <FileText className="w-3.5 h-3.5 text-slate-400" />
          <span className="border-b border-slate-300 pb-1 w-full max-w-md">
            ข้อความคำตอบแบบยาว (ย่อหน้า) สำหรับอธิบายรายละเอียด...
          </span>
        </div>
      );
    }
    if (q.type === 'number') {
      return (
        <div className="mt-3 pt-3 border-t border-dashed border-slate-200 flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-2 text-slate-500">
            <Hash className="w-3.5 h-3.5 text-slate-400" />
            <span>ช่องกรอกตัวเลข</span>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-slate-600 font-medium">
              หน่วย (เช่น บาท / คะแนน):
            </label>
            <input
              type="text"
              placeholder="เช่น บาท, คะแนน"
              value={q.unitLabel || ''}
              onChange={(e) =>
                handleUpdateQuestion(q.id, { unitLabel: e.target.value })
              }
              className="w-28 px-2.5 py-1 text-xs bg-slate-50 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-slate-600 font-medium">
              ค่าสูงสุด/คะแนนเต็ม (เว้นว่างได้หากไม่จำกัด):
            </label>
            <input
              type="number"
              min={1}
              placeholder="ไม่จำกัด"
              value={q.maxScore ?? ''}
              onChange={(e) => {
                const val = e.target.value;
                handleUpdateQuestion(q.id, {
                  maxScore: val === '' ? undefined : Math.max(1, Number(val)),
                });
              }}
              className="w-24 px-2.5 py-1 text-xs font-mono bg-slate-50 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white tabular-nums"
            />
          </div>
        </div>
      );
    }
    return (
      <div className="mt-3 pt-3 border-t border-dashed border-slate-200 flex items-center gap-2 text-xs text-slate-500">
        <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
        <span>
          พนักงานสามารถอัปโหลดไฟล์รูปภาพ (JPG, PNG, WEBP) ได้หนึ่งหรือหลายรูป
        </span>
      </div>
    );
  };

  const builderBody = (
    <div className="space-y-5">
      {/* Status / Error Banner */}
      {(statusNotice || errorNotice) && (
        <div
          className={`px-4 py-3 rounded-xl text-xs font-semibold flex items-center justify-between border ${
            errorNotice
              ? 'bg-red-50 text-red-700 border-red-200'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{errorNotice || statusNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setStatusNotice(null);
              setErrorNotice(null);
            }}
            className="underline cursor-pointer"
          >
            ปิดข้อความ
          </button>
        </div>
      )}

      {/* Section 1: Category Tabs Navigation Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-slate-700" />
            <h3 className="text-sm font-bold text-slate-900">
              หมวดหมู่คำถาม (คลิกเลือกหมวดหมู่เพื่อจัดการคำถามภายในหมวด)
            </h3>
          </div>

          <button
            type="button"
            onClick={() => setShowAddCategoryForm((prev) => !prev)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer self-start sm:self-auto"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>
              {showAddCategoryForm ? 'ยกเลิกการสร้างหมวดหมู่' : '+ เพิ่มหมวดหมู่ใหม่'}
            </span>
          </button>
        </div>

        {/* Category Tabs Strip */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {categories.map((cat, idx) => {
            const count = questions.filter((q) => q.categoryId === cat.id).length;
            const isSelected = activeCategory?.id === cat.id;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategoryId(cat.id)}
                className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-2 ${
                  isSelected
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span>
                  หมวดที่ {idx + 1}: {cat.name}
                </span>
                <span
                  className={`font-mono text-[11px] tabular-nums ${
                    isSelected ? 'text-slate-300' : 'text-slate-500'
                  }`}
                >
                  ({count} ข้อ)
                </span>
              </button>
            );
          })}
        </div>

        {/* Optional Add New Category Inline Form */}
        {showAddCategoryForm && (
          <form
            onSubmit={handleCreateCategory}
            className="pt-3 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-3 items-end"
          >
            <div className="sm:col-span-5">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ชื่อหมวดหมู่ใหม่ *
              </label>
              <input
                type="text"
                placeholder="เช่น หมวดที่ 4: ความปลอดภัยและสต็อกสินค้า"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
              />
            </div>

            <div className="sm:col-span-5">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                คำอธิบายหมวดหมู่ (ไม่บังคับ)
              </label>
              <input
                type="text"
                placeholder="อธิบายรายละเอียดของหมวดหมู่นี้..."
                value={newCategoryDesc}
                onChange={(e) => setNewCategoryDesc(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
              />
            </div>

            <div className="sm:col-span-2">
              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-1 px-3 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>สร้างหมวดหมู่</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Section 2: Active Category Settings & Questions */}
      {activeCategory && (
        <div className="space-y-4">
          {/* Active Category Header Editor */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ชื่อหมวดหมู่คำถามปัจจุบัน *
                  </label>
                  <input
                    type="text"
                    value={activeCategory.name}
                    onChange={(e) =>
                      handleUpdateCategory(activeCategory.id, {
                        name: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 text-sm font-bold text-slate-900 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    คำอธิบายหมวดหมู่
                  </label>
                  <input
                    type="text"
                    placeholder="คำอธิบายสั้นๆ สำหรับหมวดหมู่นี้..."
                    value={activeCategory.description || ''}
                    onChange={(e) =>
                      handleUpdateCategory(activeCategory.id, {
                        description: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 text-xs text-slate-700 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
                  />
                </div>
              </div>

              {categories.length > 1 && (
                <button
                  type="button"
                  onClick={() =>
                    handleDeleteCategory(activeCategory.id, activeCategory.name)
                  }
                  className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors cursor-pointer shrink-0 self-end sm:self-center"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>ลบหมวดหมู่นี้</span>
                </button>
              )}
            </div>

            {/* Quick Add Question Bar for Active Category */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-xs font-semibold text-slate-700">
                เพิ่มคำถามใหม่ลงในหมวด &ldquo;{activeCategory.name}&rdquo;:
              </span>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleAddQuestion('short_text')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  <AlignLeft className="w-3.5 h-3.5 text-slate-600" />
                  <span>+ ข้อความสั้น</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAddQuestion('paragraph')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-600" />
                  <span>+ ข้อความยาว</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAddQuestion('number')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  <Hash className="w-3.5 h-3.5 text-slate-600" />
                  <span>+ ตัวเลข / คะแนน</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAddQuestion('image_upload')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>+ อัปโหลดรูปภาพ</span>
                </button>
              </div>
            </div>
          </div>

          {/* Questions List in Active Category */}
          {activeCategoryQuestions.length === 0 ? (
            <div className="bg-white border border-dashed border-slate-300 rounded-xl p-10 text-center">
              <p className="text-sm font-semibold text-slate-700">
                ยังไม่มีคำถามในหมวด &ldquo;{activeCategory.name}&rdquo;
              </p>
              <p className="text-xs text-slate-500 mt-1">
                คลิกปุ่มเพิ่มคำถามด้านบนเพื่อสร้างคำถามข้อแรกในหมวดหมู่นี้
              </p>
            </div>
          ) : (
            activeCategoryQuestions.map((q, index) => (
              <div
                key={q.id}
                className="bg-white border border-slate-200 rounded-xl overflow-hidden transition-all hover:border-slate-300"
              >
                <div className="p-5 sm:p-6 border-l-4 border-l-slate-900">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-xs font-mono font-semibold text-slate-500">
                      {activeCategory.name} · ข้อที่ {index + 1}
                    </span>
                    {q.required && (
                      <span className="text-xs font-semibold text-red-600">
                        * จำเป็นต้องกรอก
                      </span>
                    )}
                  </div>

                  {/* Row 1: Question Title, Type & Category Assignment */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
                    <div className="md:col-span-6">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        หัวข้อคำถาม *
                      </label>
                      <input
                        type="text"
                        placeholder="เช่น ยอดขายวันนี้เท่าไหร่?"
                        value={q.title}
                        onChange={(e) =>
                          handleUpdateQuestion(q.id, { title: e.target.value })
                        }
                        className="w-full px-3.5 py-2 text-sm font-semibold text-slate-900 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
                      />
                    </div>

                    <div className="md:col-span-3">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        ประเภทคำตอบ
                      </label>
                      <select
                        value={q.type}
                        onChange={(e) => {
                          const nextType = e.target.value as FormQuestionType;
                          handleUpdateQuestion(q.id, {
                            type: nextType,
                            unitLabel:
                              nextType === 'number'
                                ? q.unitLabel || 'บาท'
                                : undefined,
                          });
                        }}
                        className="w-full px-3 py-2 text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
                      >
                        {QUESTION_TYPE_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="md:col-span-3">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        อยู่ในหมวดหมู่
                      </label>
                      <select
                        value={q.categoryId}
                        onChange={(e) =>
                          handleUpdateQuestion(q.id, {
                            categoryId: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
                      >
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Row 2: Optional Description */}
                  <div className="mt-3">
                    <label className="block text-xs font-medium text-slate-500 mb-1">
                      คำอธิบายเพิ่มเติมใต้คำถาม (ไม่บังคับ)
                    </label>
                    <input
                      type="text"
                      placeholder="ระบุคำแนะนำสำหรับพนักงาน..."
                      value={q.description || ''}
                      onChange={(e) =>
                        handleUpdateQuestion(q.id, {
                          description: e.target.value,
                        })
                      }
                      className="w-full px-3 py-1.5 text-xs text-slate-600 bg-slate-50/70 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
                    />
                  </div>

                  {/* Row 3: Type-Specific Preview */}
                  {renderQuestionTypePreview(q)}

                  {/* Row 4: Action Bar */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => handleMoveQuestionInCategory(q.id, 'up')}
                        title="เลื่อนคำถามขึ้น"
                        className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 rounded-md transition-colors cursor-pointer"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        disabled={index === activeCategoryQuestions.length - 1}
                        onClick={() =>
                          handleMoveQuestionInCategory(q.id, 'down')
                        }
                        title="เลื่อนคำถามลง"
                        className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 rounded-md transition-colors cursor-pointer"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>

                      <span className="mx-1 text-slate-200">|</span>

                      <button
                        type="button"
                        onClick={() => handleDuplicateQuestion(q.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>คัดลอกข้อนี้</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteQuestion(q.id, q.title)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>ลบคำถาม</span>
                      </button>
                    </div>

                    <label className="inline-flex items-center gap-2.5 text-xs font-semibold text-slate-700 cursor-pointer select-none">
                      <span>จำเป็นต้องกรอก</span>
                      <input
                        type="checkbox"
                        checked={q.required}
                        onChange={(e) =>
                          handleUpdateQuestion(q.id, {
                            required: e.target.checked,
                          })
                        }
                        className="w-4 h-4 accent-slate-900 rounded cursor-pointer"
                      />
                    </label>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Bottom Reset Button */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={handleResetDefaults}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-300 rounded-lg transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>คืนค่าหมวดหมู่และชุดคำถามเริ่มต้น</span>
        </button>

        <button
          type="button"
          onClick={() => handleAddQuestion('short_text')}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>เพิ่มคำถามใหม่ในหมวดนี้</span>
        </button>
      </div>
    </div>
  );

  if (embedded) {
    return builderBody;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-slate-50 border border-slate-200 rounded-xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        <div className="px-6 py-4 bg-white border-b border-slate-200 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <SlidersHorizontal className="w-5 h-5 text-slate-800" />
            <div>
              <h2 className="text-base font-bold text-slate-900">
                จัดการหมวดหมู่และสร้างคำถามแบบฟอร์ม KPI (รูปแบบ Google Forms)
              </h2>
              <p className="text-xs text-slate-500">
                แบ่งคำถามออกเป็นหมวดหมู่ (แท็บ) เพื่อความเป็นระเบียบและใช้งานง่าย
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="ปิดหน้าต่าง"
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">{builderBody}</div>

        <div className="px-6 py-4 bg-white border-t border-slate-200 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>บันทึกและกลับสู่หน้าแบบฟอร์ม</span>
          </button>
        </div>
      </div>
    </div>
  );
};
