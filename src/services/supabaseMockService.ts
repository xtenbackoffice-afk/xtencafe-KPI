import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  Branch,
  Employee,
  FormQuestionCategory,
  FormQuestion,
  KpiSubmission,
  LineWebhookLog,
} from '../types/kpi';

import proofPosSettlement from '../assets/images/proof_pos_settlement_1791485796167.jpg';
import proofMerchandiseDisplay from '../assets/images/proof_merchandise_display_1791485816500.jpg';
import proofServiceChecklist from '../assets/images/proof_service_checklist_1791485826522.jpg';

export const STORAGE_KEYS = {
  BRANCHES: 'kronokpi_persistent_branches',
  EMPLOYEES: 'kronokpi_persistent_employees',
  QUESTION_CATEGORIES: 'kronokpi_persistent_categories',
  QUESTIONS: 'kronokpi_persistent_questions',
  SUBMISSIONS: 'kronokpi_persistent_submissions',
  LINE_LOGS: 'kronokpi_persistent_line_logs',
  MANAGER_PIN: 'kronokpi_persistent_manager_pin',
  UI_SESSION: 'kronokpi_persistent_ui_session',
  FORM_DRAFT: 'kronokpi_persistent_form_draft',
  SUPABASE_CONFIG: 'kronokpi_persistent_supabase_config',
};

// Legacy keys from previous versions for seamless migration
const LEGACY_KEYS: Record<string, string[]> = {
  [STORAGE_KEYS.BRANCHES]: [
    'kronokpi_supabase_branches_v5_cat_th',
    'kronokpi_supabase_branches_v4_gforms_th',
    'kronokpi_supabase_branches_v3_th',
  ],
  [STORAGE_KEYS.EMPLOYEES]: [
    'kronokpi_supabase_employees_v5_cat_th',
    'kronokpi_supabase_employees_v4_gforms_th',
    'kronokpi_supabase_employees_v3_th',
  ],
  [STORAGE_KEYS.QUESTION_CATEGORIES]: [
    'kronokpi_supabase_qcategories_v5_cat_th',
  ],
  [STORAGE_KEYS.QUESTIONS]: [
    'kronokpi_supabase_questions_v5_cat_th',
    'kronokpi_supabase_questions_v4_gforms_th',
  ],
  [STORAGE_KEYS.SUBMISSIONS]: [
    'kronokpi_supabase_submissions_v5_cat_th',
    'kronokpi_supabase_submissions_v4_gforms_th',
  ],
  [STORAGE_KEYS.LINE_LOGS]: [
    'kronokpi_supabase_line_logs_v5_cat_th',
    'kronokpi_supabase_line_logs_v4_gforms_th',
  ],
  [STORAGE_KEYS.MANAGER_PIN]: [
    'kronokpi_manager_pin_v5_cat_th',
    'kronokpi_manager_pin_v4_gforms_th',
  ],
};

export interface PersistedUiSession {
  activeTab: 'branch_select' | 'employee_workspace' | 'manager_dashboard';
  selectedBranchId: string | null;
  selectedEmployeeIdForForm: string;
  isManagerAuthenticated: boolean;
}

export interface SupabaseConnectionConfig {
  url: string;
  anonKey: string;
  enabled: boolean;
}

export const SAMPLE_PROOF_ASSETS = [
  {
    label: 'ใบสรุปยอดขายเครื่อง POS',
    fileName: 'ใบสรุปยอดขายประจำวัน.jpg',
    fileSize: 184320,
    mimeType: 'image/jpeg',
    dataUrl: proofPosSettlement,
  },
  {
    label: 'ภาพจัดเรียงสินค้าหน้าร้าน',
    fileName: 'ภาพตรวจสอบชั้นวางสินค้า.jpg',
    fileSize: 245760,
    mimeType: 'image/jpeg',
    dataUrl: proofMerchandiseDisplay,
  },
  {
    label: 'ใบเช็กลิสต์มาตรฐานประจำวัน',
    fileName: 'ใบเช็กลิสต์การปฏิบัติงาน.jpg',
    fileSize: 212992,
    mimeType: 'image/jpeg',
    dataUrl: proofServiceChecklist,
  },
];

export const INITIAL_BRANCHES: Branch[] = [
  {
    id: 'branch_rama3',
    name: 'สาขาพระราม 3',
    code: 'BKK-RM3',
    district: 'เขตยานนาวา กรุงเทพฯ',
    addressSummary: '799 ถ.พระรามที่ 3 แขวงบางโพงพาง',
    createdAt: '2026-01-10T08:00:00.000Z',
  },
  {
    id: 'branch_sukhumvit',
    name: 'สาขาสุขุมวิท',
    code: 'BKK-SKV',
    district: 'เขตวัฒนา กรุงเทพฯ',
    addressSummary: '392 สุขุมวิท ซอย 24 แขวงคลองตัน',
    createdAt: '2026-01-10T08:00:00.000Z',
  },
  {
    id: 'branch_silom',
    name: 'สาขาสีลม',
    code: 'BKK-SLM',
    district: 'เขตบางรัก กรุงเทพฯ',
    addressSummary: '191 อาคารสีลมคอมเพล็กซ์ ชั้น 2',
    createdAt: '2026-01-10T08:00:00.000Z',
  },
  {
    id: 'branch_thonglor',
    name: 'สาขาทองหล่อ',
    code: 'BKK-TGL',
    district: 'เขตคลองเตย กรุงเทพฯ',
    addressSummary: '145 ซอยสุขุมวิท 55 (ทองหล่อ 13)',
    createdAt: '2026-02-01T08:00:00.000Z',
  },
];

// รายชื่อพนักงานระบุเฉพาะ "ชื่อเล่น" (ไม่มีตำแหน่งงาน)
export const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: 'emp_rm3_1',
    branchId: 'branch_rama3',
    name: 'นัท',
    createdAt: '2026-01-15T09:00:00.000Z',
  },
  {
    id: 'emp_rm3_2',
    branchId: 'branch_rama3',
    name: 'พิม',
    createdAt: '2026-01-16T09:00:00.000Z',
  },
  {
    id: 'emp_rm3_3',
    branchId: 'branch_rama3',
    name: 'กิต',
    createdAt: '2026-02-01T09:00:00.000Z',
  },
  {
    id: 'emp_skv_1',
    branchId: 'branch_sukhumvit',
    name: 'สุ',
    createdAt: '2026-01-12T09:00:00.000Z',
  },
  {
    id: 'emp_skv_2',
    branchId: 'branch_sukhumvit',
    name: 'นนท์',
    createdAt: '2026-01-20T09:00:00.000Z',
  },
  {
    id: 'emp_skv_3',
    branchId: 'branch_sukhumvit',
    name: 'วุ้น',
    createdAt: '2026-02-11T09:00:00.000Z',
  },
  {
    id: 'emp_slm_1',
    branchId: 'branch_silom',
    name: 'ธัน',
    createdAt: '2026-01-18T09:00:00.000Z',
  },
  {
    id: 'emp_slm_2',
    branchId: 'branch_silom',
    name: 'กัญ',
    createdAt: '2026-01-22T09:00:00.000Z',
  },
  {
    id: 'emp_tgl_1',
    branchId: 'branch_thonglor',
    name: 'อริส',
    createdAt: '2026-02-05T09:00:00.000Z',
  },
  {
    id: 'emp_tgl_2',
    branchId: 'branch_thonglor',
    name: 'พชร',
    createdAt: '2026-02-08T09:00:00.000Z',
  },
];

// หมวดหมู่คำถาม (Categorized Form Sections)
export const INITIAL_QUESTION_CATEGORIES: FormQuestionCategory[] = [
  {
    id: 'cat_sales',
    name: 'ยอดขายและแคชเชียร์',
    description: 'บันทึกตัวเลขยอดขายประจำวันและสินค้าขายดีประจำกะ',
  },
  {
    id: 'cat_service',
    name: 'การบริการและมาตรฐานหน้าร้าน',
    description: 'ประเมินคุณภาพการต้อนรับลูกค้า ความสะอาด และรายงานปัญหาหน้างาน',
  },
  {
    id: 'cat_evidence',
    name: 'รูปภาพหลักฐานการทำงาน',
    description: 'อัปโหลดรูปภาพใบปิดยอดเครื่อง POS ภาพชั้นวางสินค้า หรือเช็กลิสต์',
  },
];

// คำถามแบบ Google Forms ที่จัดกลุ่มตามหมวดหมู่ (Category)
export const INITIAL_FORM_QUESTIONS: FormQuestion[] = [
  {
    id: 'q_sales_today',
    categoryId: 'cat_sales',
    title: 'ยอดขายวันนี้เท่าไหร่?',
    description: 'กรุณาระบุยอดขายรวมประจำกะการทำงานตามใบสรุปยอดเครื่อง POS (ตัวเลข)',
    type: 'number',
    required: true,
    unitLabel: 'บาท',
  },
  {
    id: 'q_best_seller',
    categoryId: 'cat_sales',
    title: 'สินค้าขายดี หรือโปรโมชันที่ลูกค้าสนใจมากที่สุดในวันนี้',
    description: 'ระบุชื่อสินค้าหรือชุดโปรโมชันสั้นๆ',
    type: 'short_text',
    required: true,
  },
  {
    id: 'q_service_score',
    categoryId: 'cat_service',
    title: 'คะแนนความเรียบร้อยและการให้บริการหน้าร้าน (เต็ม 100 คะแนน)',
    description: 'ประเมินความครบถ้วนของมาตรฐานการต้อนรับลูกค้า การจัดเรียงสินค้า และความสะอาด',
    type: 'number',
    required: true,
    maxScore: 100,
    unitLabel: 'คะแนน',
  },
  {
    id: 'q_daily_issues',
    categoryId: 'cat_service',
    title: 'ปัญหาที่พบในวันนี้ หรือข้อเสนอแนะเพิ่มเติมถึงผู้จัดการ',
    description: 'ระบุปัญหาหน้างาน สินค้าใกล้หมด หรือข้อเสนอแนะ (หากไม่มีสามารถเว้นว่างได้)',
    type: 'paragraph',
    required: false,
  },
  {
    id: 'q_work_proof',
    categoryId: 'cat_evidence',
    title: 'อัปโหลดรูปภาพหลักฐานการทำงาน (ใบสรุปยอดขาย POS / ภาพหน้าร้าน)',
    description: 'แนบรูปภาพใบปิดยอดแคชเชียร์ ภาพการจัดเรียงสินค้า หรือใบเช็กลิสต์ประจำวัน',
    type: 'image_upload',
    required: true,
  },
];

export const INITIAL_SUBMISSIONS: KpiSubmission[] = [
  {
    id: 'sub_seed_1',
    branchId: 'branch_rama3',
    branchName: 'สาขาพระราม 3',
    employeeId: 'emp_rm3_1',
    employeeName: 'นัท',
    submissionDate: '2026-10-08',
    createdAt: '2026-10-08T10:15:00.000Z',
    responses: [
      {
        questionId: 'q_sales_today',
        categoryId: 'cat_sales',
        categoryName: 'ยอดขายและแคชเชียร์',
        questionTitle: 'ยอดขายวันนี้เท่าไหร่?',
        questionType: 'number',
        numberValue: 48500,
        unitLabel: 'บาท',
      },
      {
        questionId: 'q_best_seller',
        categoryId: 'cat_sales',
        categoryName: 'ยอดขายและแคชเชียร์',
        questionTitle: 'สินค้าขายดี หรือโปรโมชันที่ลูกค้าสนใจมากที่สุดในวันนี้',
        questionType: 'short_text',
        textValue: 'ชุดเซรั่มบำรุงผิว Natural Collection (โปรโมชันคู่)',
      },
      {
        questionId: 'q_service_score',
        categoryId: 'cat_service',
        categoryName: 'การบริการและมาตรฐานหน้าร้าน',
        questionTitle: 'คะแนนความเรียบร้อยและการให้บริการหน้าร้าน (เต็ม 100 คะแนน)',
        questionType: 'number',
        numberValue: 95,
        maxScore: 100,
        unitLabel: 'คะแนน',
      },
      {
        questionId: 'q_daily_issues',
        categoryId: 'cat_service',
        categoryName: 'การบริการและมาตรฐานหน้าร้าน',
        questionTitle: 'ปัญหาที่พบในวันนี้ หรือข้อเสนอแนะเพิ่มเติมถึงผู้จัดการ',
        questionType: 'paragraph',
        textValue: 'เหตุการณ์ปกติ เติมสต็อกสินค้าหน้าชั้นวางครบถ้วนและปิดยอดเครื่อง POS เรียบร้อยครับ',
      },
      {
        questionId: 'q_work_proof',
        categoryId: 'cat_evidence',
        categoryName: 'รูปภาพหลักฐานการทำงาน',
        questionTitle: 'อัปโหลดรูปภาพหลักฐานการทำงาน (ใบสรุปยอดขาย POS / ภาพหน้าร้าน)',
        questionType: 'image_upload',
        images: [
          {
            id: 'img_seed_1',
            fileName: 'ใบสรุปยอดขาย_พระราม3.jpg',
            fileSize: 184320,
            mimeType: 'image/jpeg',
            dataUrl: proofPosSettlement,
          },
          {
            id: 'img_seed_2',
            fileName: 'ชั้นวางสินค้า_พระราม3.jpg',
            fileSize: 245760,
            mimeType: 'image/jpeg',
            dataUrl: proofMerchandiseDisplay,
          },
        ],
      },
    ],
    images: [
      {
        id: 'img_seed_1',
        fileName: 'ใบสรุปยอดขาย_พระราม3.jpg',
        fileSize: 184320,
        mimeType: 'image/jpeg',
        dataUrl: proofPosSettlement,
      },
      {
        id: 'img_seed_2',
        fileName: 'ชั้นวางสินค้า_พระราม3.jpg',
        fileSize: 245760,
        mimeType: 'image/jpeg',
        dataUrl: proofMerchandiseDisplay,
      },
    ],
    lineNotificationSent: true,
  },
  {
    id: 'sub_seed_2',
    branchId: 'branch_sukhumvit',
    branchName: 'สาขาสุขุมวิท',
    employeeId: 'emp_skv_1',
    employeeName: 'สุ',
    submissionDate: '2026-10-08',
    createdAt: '2026-10-08T09:42:00.000Z',
    responses: [
      {
        questionId: 'q_sales_today',
        categoryId: 'cat_sales',
        categoryName: 'ยอดขายและแคชเชียร์',
        questionTitle: 'ยอดขายวันนี้เท่าไหร่?',
        questionType: 'number',
        numberValue: 62400,
        unitLabel: 'บาท',
      },
      {
        questionId: 'q_best_seller',
        categoryId: 'cat_sales',
        categoryName: 'ยอดขายและแคชเชียร์',
        questionTitle: 'สินค้าขายดี หรือโปรโมชันที่ลูกค้าสนใจมากที่สุดในวันนี้',
        questionType: 'short_text',
        textValue: 'กลุ่มสินค้าอโรม่าและชุดของขวัญสำหรับลูกค้าต่างชาติ',
      },
      {
        questionId: 'q_service_score',
        categoryId: 'cat_service',
        categoryName: 'การบริการและมาตรฐานหน้าร้าน',
        questionTitle: 'คะแนนความเรียบร้อยและการให้บริการหน้าร้าน (เต็ม 100 คะแนน)',
        questionType: 'number',
        numberValue: 96,
        maxScore: 100,
        unitLabel: 'คะแนน',
      },
      {
        questionId: 'q_daily_issues',
        categoryId: 'cat_service',
        categoryName: 'การบริการและมาตรฐานหน้าร้าน',
        questionTitle: 'ปัญหาที่พบในวันนี้ หรือข้อเสนอแนะเพิ่มเติมถึงผู้จัดการ',
        questionType: 'paragraph',
        textValue: 'ถุงกระดาษไซส์ M เหลือในคลังสาขาประมาณ 40 ใบ ขอเบิกเพิ่มสำหรับรอบสุดสัปดาห์ค่ะ',
      },
      {
        questionId: 'q_work_proof',
        categoryId: 'cat_evidence',
        categoryName: 'รูปภาพหลักฐานการทำงาน',
        questionTitle: 'อัปโหลดรูปภาพหลักฐานการทำงาน (ใบสรุปยอดขาย POS / ภาพหน้าร้าน)',
        questionType: 'image_upload',
        images: [
          {
            id: 'img_seed_3',
            fileName: 'ใบเช็กลิสต์_สุขุมวิท.jpg',
            fileSize: 212992,
            mimeType: 'image/jpeg',
            dataUrl: proofServiceChecklist,
          },
        ],
      },
    ],
    images: [
      {
        id: 'img_seed_3',
        fileName: 'ใบเช็กลิสต์_สุขุมวิท.jpg',
        fileSize: 212992,
        mimeType: 'image/jpeg',
        dataUrl: proofServiceChecklist,
      },
    ],
    lineNotificationSent: true,
  },
  {
    id: 'sub_seed_3',
    branchId: 'branch_silom',
    branchName: 'สาขาสีลม',
    employeeId: 'emp_slm_1',
    employeeName: 'ธัน',
    submissionDate: '2026-10-07',
    createdAt: '2026-10-07T18:30:00.000Z',
    responses: [
      {
        questionId: 'q_sales_today',
        categoryId: 'cat_sales',
        categoryName: 'ยอดขายและแคชเชียร์',
        questionTitle: 'ยอดขายวันนี้เท่าไหร่?',
        questionType: 'number',
        numberValue: 39800,
        unitLabel: 'บาท',
      },
      {
        questionId: 'q_best_seller',
        categoryId: 'cat_sales',
        categoryName: 'ยอดขายและแคชเชียร์',
        questionTitle: 'สินค้าขายดี หรือโปรโมชันที่ลูกค้าสนใจมากที่สุดในวันนี้',
        questionType: 'short_text',
        textValue: 'สเปรย์ปรับอากาศและครีมทามือขนาดพกพา',
      },
      {
        questionId: 'q_service_score',
        categoryId: 'cat_service',
        categoryName: 'การบริการและมาตรฐานหน้าร้าน',
        questionTitle: 'คะแนนความเรียบร้อยและการให้บริการหน้าร้าน (เต็ม 100 คะแนน)',
        questionType: 'number',
        numberValue: 90,
        maxScore: 100,
        unitLabel: 'คะแนน',
      },
      {
        questionId: 'q_daily_issues',
        categoryId: 'cat_service',
        categoryName: 'การบริการและมาตรฐานหน้าร้าน',
        questionTitle: 'ปัญหาที่พบในวันนี้ หรือข้อเสนอแนะเพิ่มเติมถึงผู้จัดการ',
        questionType: 'paragraph',
        textValue: 'ช่วงพักเที่ยงลูกค้าพนักงานออฟฟิศเข้ามาพร้อมกันจำนวนมาก จัดการคิวได้เรียบร้อยไม่มีลูกค้าตกค้างครับ',
      },
      {
        questionId: 'q_work_proof',
        categoryId: 'cat_evidence',
        categoryName: 'รูปภาพหลักฐานการทำงาน',
        questionTitle: 'อัปโหลดรูปภาพหลักฐานการทำงาน (ใบสรุปยอดขาย POS / ภาพหน้าร้าน)',
        questionType: 'image_upload',
        images: [
          {
            id: 'img_seed_4',
            fileName: 'ใบสรุปยอดขาย_สีลม.jpg',
            fileSize: 184320,
            mimeType: 'image/jpeg',
            dataUrl: proofPosSettlement,
          },
        ],
      },
    ],
    images: [
      {
        id: 'img_seed_4',
        fileName: 'ใบสรุปยอดขาย_สีลม.jpg',
        fileSize: 184320,
        mimeType: 'image/jpeg',
        dataUrl: proofPosSettlement,
      },
    ],
    lineNotificationSent: true,
  },
  {
    id: 'sub_seed_4',
    branchId: 'branch_thonglor',
    branchName: 'สาขาทองหล่อ',
    employeeId: 'emp_tgl_1',
    employeeName: 'อริส',
    submissionDate: '2026-10-07',
    createdAt: '2026-10-07T17:15:00.000Z',
    responses: [
      {
        questionId: 'q_sales_today',
        categoryId: 'cat_sales',
        categoryName: 'ยอดขายและแคชเชียร์',
        questionTitle: 'ยอดขายวันนี้เท่าไหร่?',
        questionType: 'number',
        numberValue: 54900,
        unitLabel: 'บาท',
      },
      {
        questionId: 'q_best_seller',
        categoryId: 'cat_sales',
        categoryName: 'ยอดขายและแคชเชียร์',
        questionTitle: 'สินค้าขายดี หรือโปรโมชันที่ลูกค้าสนใจมากที่สุดในวันนี้',
        questionType: 'short_text',
        textValue: 'เอสเซนส์บำรุงผิวสูตรเข้มข้น (ลูกค้าสมาชิกซื้อซ้ำ)',
      },
      {
        questionId: 'q_service_score',
        categoryId: 'cat_service',
        categoryName: 'การบริการและมาตรฐานหน้าร้าน',
        questionTitle: 'คะแนนความเรียบร้อยและการให้บริการหน้าร้าน (เต็ม 100 คะแนน)',
        questionType: 'number',
        numberValue: 98,
        maxScore: 100,
        unitLabel: 'คะแนน',
      },
      {
        questionId: 'q_daily_issues',
        categoryId: 'cat_service',
        categoryName: 'การบริการและมาตรฐานหน้าร้าน',
        questionTitle: 'ปัญหาที่พบในวันนี้ หรือข้อเสนอแนะเพิ่มเติมถึงผู้จัดการ',
        questionType: 'paragraph',
        textValue: 'จัดเรียงดิสเพลย์คอลเลกชันใหม่เสร็จสมบูรณ์พร้อมรับลูกค้าช่วงสุดสัปดาห์ค่ะ',
      },
      {
        questionId: 'q_work_proof',
        categoryId: 'cat_evidence',
        categoryName: 'รูปภาพหลักฐานการทำงาน',
        questionTitle: 'อัปโหลดรูปภาพหลักฐานการทำงาน (ใบสรุปยอดขาย POS / ภาพหน้าร้าน)',
        questionType: 'image_upload',
        images: [
          {
            id: 'img_seed_5',
            fileName: 'ชั้นวางสินค้า_ทองหล่อ.jpg',
            fileSize: 245760,
            mimeType: 'image/jpeg',
            dataUrl: proofMerchandiseDisplay,
          },
          {
            id: 'img_seed_6',
            fileName: 'ใบเช็กลิสต์_ทองหล่อ.jpg',
            fileSize: 212992,
            mimeType: 'image/jpeg',
            dataUrl: proofServiceChecklist,
          },
        ],
      },
    ],
    images: [
      {
        id: 'img_seed_5',
        fileName: 'ชั้นวางสินค้า_ทองหล่อ.jpg',
        fileSize: 245760,
        mimeType: 'image/jpeg',
        dataUrl: proofMerchandiseDisplay,
      },
      {
        id: 'img_seed_6',
        fileName: 'ใบเช็กลิสต์_ทองหล่อ.jpg',
        fileSize: 212992,
        mimeType: 'image/jpeg',
        dataUrl: proofServiceChecklist,
      },
    ],
    lineNotificationSent: true,
  },
];

export const SUPABASE_SQL_SCHEMA = `-- โครงสร้างฐานข้อมูล PostgreSQL สำหรับระบบแบบฟอร์ม KPI พนักงานแบบแบ่งหมวดหมู่ (Supabase)
-- คัดลอกคำสั่งนี้ไปรันในเมนู SQL Editor ของโปรเจกต์ Supabase ของคุณ

create table if not exists public.kronokpi_app_state (
  collection_key text primary key,
  payload jsonb not null,
  updated_at timestamptz default now()
);

alter table public.kronokpi_app_state enable row level security;

create policy "Allow public read/write on kronokpi_app_state"
  on public.kronokpi_app_state for all
  to anon, authenticated
  using (true)
  with check (true);

-- ตารางเชิงสัมพันธ์เพิ่มเติมสำหรับใช้ Query รายงานขั้นสูง
create table if not exists public.branches (
  id text primary key,
  name text not null,
  code text not null,
  district text not null,
  address_summary text,
  created_at timestamptz default now()
);

create table if not exists public.employees (
  id text primary key,
  branch_id text references public.branches(id) on delete cascade,
  nickname text not null,
  created_at timestamptz default now()
);

create table if not exists public.form_categories (
  id text primary key,
  name text not null,
  description text,
  created_at timestamptz default now()
);

create table if not exists public.form_questions (
  id text primary key,
  category_id text references public.form_categories(id) on delete cascade,
  title text not null,
  description text,
  question_type text not null,
  required boolean default true,
  max_score numeric,
  unit_label text
);

create table if not exists public.kpi_submissions (
  id text primary key,
  branch_id text,
  branch_name text not null,
  employee_id text,
  employee_nickname text not null,
  submission_date text not null,
  responses jsonb not null,
  evidence_urls jsonb default '[]'::jsonb,
  line_notification_sent boolean default false,
  created_at timestamptz default now()
);`;

// ============================================================================
// LAYER 2: IndexedDB High-Capacity Persistent Storage (Supports Large Images)
// ============================================================================
const IDB_NAME = 'KronoKpiPersistentDB';
const IDB_VERSION = 1;
const IDB_STORE = 'kv_store';

function openIndexedDb(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    try {
      const req = window.indexedDB.open(IDB_NAME, IDB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function writeIndexedDb<T>(key: string, value: T): Promise<void> {
  const db = await openIndexedDb();
  if (!db) return;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      store.put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

async function readIndexedDb<T>(key: string): Promise<T | null> {
  const db = await openIndexedDb();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const store = tx.objectStore(IDB_STORE);
      const req = store.get(key);
      req.onsuccess = () => {
        resolve(req.result !== undefined ? (req.result as T) : null);
      };
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function clearIndexedDb(): Promise<void> {
  const db = await openIndexedDb();
  if (!db) return;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      store.clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

// ============================================================================
// LAYER 3: Optional Supabase Cloud Client Sync
// ============================================================================
let cachedSupabaseClient: SupabaseClient | null = null;
let cachedConfigKey = '';

export function getSupabaseConfig(): SupabaseConnectionConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SUPABASE_CONFIG);
    if (raw) {
      const parsed = JSON.parse(raw) as SupabaseConnectionConfig;
      if (parsed.url && parsed.anonKey) {
        return parsed;
      }
    }
  } catch {
    // ignore
  }
  const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  return {
    url: envUrl,
    anonKey: envKey,
    enabled: Boolean(envUrl && envKey),
  };
}

export function saveSupabaseConfig(config: SupabaseConnectionConfig): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SUPABASE_CONFIG, JSON.stringify(config));
    cachedSupabaseClient = null;
    cachedConfigKey = '';
  } catch (err) {
    console.error('Failed to save Supabase config:', err);
  }
}

export function getActiveSupabaseClient(): SupabaseClient | null {
  const cfg = getSupabaseConfig();
  if (!cfg.enabled || !cfg.url.trim() || !cfg.anonKey.trim()) {
    return null;
  }
  const key = `${cfg.url.trim()}::${cfg.anonKey.trim()}`;
  if (cachedSupabaseClient && cachedConfigKey === key) {
    return cachedSupabaseClient;
  }
  try {
    cachedSupabaseClient = createClient(cfg.url.trim(), cfg.anonKey.trim());
    cachedConfigKey = key;
    return cachedSupabaseClient;
  } catch {
    return null;
  }
}

async function pushCollectionToSupabase<T>(
  collectionKey: string,
  data: T
): Promise<void> {
  const client = getActiveSupabaseClient();
  if (!client) return;
  try {
    await client.from('kronokpi_app_state').upsert(
      {
        collection_key: collectionKey,
        payload: data,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'collection_key' }
    );
  } catch {
    // Local storage + IndexedDB already persisted the data safely
  }
}

// ============================================================================
// LAYER 1: Quota-Resilient Synchronous localStorage Read/Write + Migration
// ============================================================================
function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw !== null) {
      return JSON.parse(raw) as T;
    }

    // Check legacy keys and migrate automatically if found
    const legacyCandidates = LEGACY_KEYS[key] || [];
    for (const oldKey of legacyCandidates) {
      const legacyRaw = localStorage.getItem(oldKey);
      if (legacyRaw !== null) {
        const parsed = JSON.parse(legacyRaw) as T;
        localStorage.setItem(key, legacyRaw);
        return parsed;
      }
    }

    // Initialize canonical key with default fallback so it is immediately persisted
    localStorage.setItem(key, JSON.stringify(fallback));
    return fallback;
  } catch {
    return fallback;
  }
}

function writeStorage<T>(key: string, data: T): void {
  // Always persist full data to IndexedDB (unlimited storage for photos)
  void writeIndexedDb(key, data);
  // Also sync to Supabase Cloud if configured
  void pushCollectionToSupabase(key, data);

  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    // If localStorage hits the 5MB browser quota due to high-res base64 images
    // in submissions, keep the newest images in localStorage and trim older base64 blobs
    // (while IndexedDB retains 100% of all images).
    if (key === STORAGE_KEYS.SUBMISSIONS && Array.isArray(data)) {
      try {
        const trimmed = (data as unknown as KpiSubmission[]).map((sub, idx) => {
          if (idx < 8) return sub;
          return {
            ...sub,
            images: sub.images.slice(0, 1),
          };
        });
        localStorage.setItem(key, JSON.stringify(trimmed));
        return;
      } catch {
        // Fallback: store submissions metadata if images still exceed 5MB
        try {
          const light = (data as unknown as KpiSubmission[]).map(
            (sub, idx) => ({
              ...sub,
              images: idx < 3 ? sub.images.slice(0, 1) : [],
              responses: sub.responses.map((r) => ({
                ...r,
                images: idx < 3 ? r.images?.slice(0, 1) : [],
              })),
            })
          );
          localStorage.setItem(key, JSON.stringify(light));
          return;
        } catch {
          console.warn('localStorage quota reached; full data saved in IndexedDB', err);
        }
      }
    }
  }
}

export const supabaseMockDb = {
  getBranches(): Branch[] {
    return readStorage<Branch[]>(STORAGE_KEYS.BRANCHES, INITIAL_BRANCHES);
  },

  saveBranches(branches: Branch[]): void {
    writeStorage(STORAGE_KEYS.BRANCHES, branches);
  },

  getEmployees(): Employee[] {
    return readStorage<Employee[]>(STORAGE_KEYS.EMPLOYEES, INITIAL_EMPLOYEES);
  },

  saveEmployees(employees: Employee[]): void {
    writeStorage(STORAGE_KEYS.EMPLOYEES, employees);
  },

  getQuestionCategories(): FormQuestionCategory[] {
    return readStorage<FormQuestionCategory[]>(
      STORAGE_KEYS.QUESTION_CATEGORIES,
      INITIAL_QUESTION_CATEGORIES
    );
  },

  saveQuestionCategories(categories: FormQuestionCategory[]): void {
    writeStorage(STORAGE_KEYS.QUESTION_CATEGORIES, categories);
  },

  getQuestions(): FormQuestion[] {
    return readStorage<FormQuestion[]>(
      STORAGE_KEYS.QUESTIONS,
      INITIAL_FORM_QUESTIONS
    );
  },

  saveQuestions(questions: FormQuestion[]): void {
    writeStorage(STORAGE_KEYS.QUESTIONS, questions);
  },

  getSubmissions(): KpiSubmission[] {
    return readStorage<KpiSubmission[]>(
      STORAGE_KEYS.SUBMISSIONS,
      INITIAL_SUBMISSIONS
    );
  },

  saveSubmissions(submissions: KpiSubmission[]): void {
    writeStorage(STORAGE_KEYS.SUBMISSIONS, submissions);
  },

  getLineLogs(): LineWebhookLog[] {
    return readStorage<LineWebhookLog[]>(STORAGE_KEYS.LINE_LOGS, []);
  },

  saveLineLogs(logs: LineWebhookLog[]): void {
    writeStorage(STORAGE_KEYS.LINE_LOGS, logs);
  },

  getManagerPin(): string {
    return readStorage<string>(STORAGE_KEYS.MANAGER_PIN, '1234');
  },

  saveManagerPin(pin: string): void {
    writeStorage(STORAGE_KEYS.MANAGER_PIN, pin);
  },

  getUiSession(): PersistedUiSession | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.UI_SESSION);
      if (!raw) return null;
      return JSON.parse(raw) as PersistedUiSession;
    } catch {
      return null;
    }
  },

  saveUiSession(session: PersistedUiSession): void {
    try {
      localStorage.setItem(STORAGE_KEYS.UI_SESSION, JSON.stringify(session));
    } catch {
      // ignore
    }
  },

  /**
   * Hydrates state from IndexedDB and/or Supabase Cloud if available,
   * ensuring large image submissions or cloud records are restored after page refresh.
   */
  async hydrateAllCollections(): Promise<{
    branches?: Branch[];
    employees?: Employee[];
    categories?: FormQuestionCategory[];
    questions?: FormQuestion[];
    submissions?: KpiSubmission[];
    lineLogs?: LineWebhookLog[];
  }> {
    const result: {
      branches?: Branch[];
      employees?: Employee[];
      categories?: FormQuestionCategory[];
      questions?: FormQuestion[];
      submissions?: KpiSubmission[];
      lineLogs?: LineWebhookLog[];
    } = {};

    // 1. Check IndexedDB first (contains full uncompressed/compressed image arrays)
    const [
      idbBranches,
      idbEmployees,
      idbCategories,
      idbQuestions,
      idbSubmissions,
      idbLogs,
    ] = await Promise.all([
      readIndexedDb<Branch[]>(STORAGE_KEYS.BRANCHES),
      readIndexedDb<Employee[]>(STORAGE_KEYS.EMPLOYEES),
      readIndexedDb<FormQuestionCategory[]>(STORAGE_KEYS.QUESTION_CATEGORIES),
      readIndexedDb<FormQuestion[]>(STORAGE_KEYS.QUESTIONS),
      readIndexedDb<KpiSubmission[]>(STORAGE_KEYS.SUBMISSIONS),
      readIndexedDb<LineWebhookLog[]>(STORAGE_KEYS.LINE_LOGS),
    ]);

    if (idbBranches && idbBranches.length > 0) result.branches = idbBranches;
    if (idbEmployees) result.employees = idbEmployees;
    if (idbCategories && idbCategories.length > 0)
      result.categories = idbCategories;
    if (idbQuestions && idbQuestions.length > 0)
      result.questions = idbQuestions;
    if (idbSubmissions) result.submissions = idbSubmissions;
    if (idbLogs) result.lineLogs = idbLogs;

    // 2. If Supabase Cloud is configured, fetch cloud state and merge/hydrate
    const client = getActiveSupabaseClient();
    if (client) {
      try {
        const { data, error } = await client
          .from('kronokpi_app_state')
          .select('collection_key, payload');
        if (!error && data && data.length > 0) {
          for (const row of data) {
            if (
              row.collection_key === STORAGE_KEYS.BRANCHES &&
              Array.isArray(row.payload) &&
              row.payload.length > 0
            ) {
              result.branches = row.payload as Branch[];
            } else if (
              row.collection_key === STORAGE_KEYS.EMPLOYEES &&
              Array.isArray(row.payload)
            ) {
              result.employees = row.payload as Employee[];
            } else if (
              row.collection_key === STORAGE_KEYS.QUESTION_CATEGORIES &&
              Array.isArray(row.payload) &&
              row.payload.length > 0
            ) {
              result.categories = row.payload as FormQuestionCategory[];
            } else if (
              row.collection_key === STORAGE_KEYS.QUESTIONS &&
              Array.isArray(row.payload) &&
              row.payload.length > 0
            ) {
              result.questions = row.payload as FormQuestion[];
            } else if (
              row.collection_key === STORAGE_KEYS.SUBMISSIONS &&
              Array.isArray(row.payload)
            ) {
              result.submissions = row.payload as KpiSubmission[];
            }
          }
        }
      } catch {
        // Fallback to local persistence seamlessly
      }
    }

    return result;
  },

  resetAllToDefaults(): void {
    Object.values(STORAGE_KEYS).forEach((key) => {
      if (key !== STORAGE_KEYS.SUPABASE_CONFIG) {
        localStorage.removeItem(key);
      }
    });
    Object.values(LEGACY_KEYS)
      .flat()
      .forEach((oldKey) => localStorage.removeItem(oldKey));
    void clearIndexedDb();

    // Immediately write clean default records to storage
    writeStorage(STORAGE_KEYS.BRANCHES, INITIAL_BRANCHES);
    writeStorage(STORAGE_KEYS.EMPLOYEES, INITIAL_EMPLOYEES);
    writeStorage(
      STORAGE_KEYS.QUESTION_CATEGORIES,
      INITIAL_QUESTION_CATEGORIES
    );
    writeStorage(STORAGE_KEYS.QUESTIONS, INITIAL_FORM_QUESTIONS);
    writeStorage(STORAGE_KEYS.SUBMISSIONS, INITIAL_SUBMISSIONS);
    writeStorage(STORAGE_KEYS.LINE_LOGS, []);
  },
};
