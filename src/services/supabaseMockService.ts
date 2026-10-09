import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  writeBatch,
} from 'firebase/firestore';
import {
  db,
  WORKSPACE_ID,
  OperationType,
  handleFirestoreError,
} from '../firebase';
import {
  Branch,
  Employee,
  FormQuestionCategory,
  FormQuestion,
  FormQuestionResponse,
  UploadedEvidence,
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

export interface RealtimeDatabaseCallbacks {
  onBranchesChange?: (branches: Branch[]) => void;
  onEmployeesChange?: (employees: Employee[]) => void;
  onCategoriesChange?: (categories: FormQuestionCategory[]) => void;
  onQuestionsChange?: (questions: FormQuestion[]) => void;
  onSubmissionsChange?: (submissions: KpiSubmission[]) => void;
  onLineLogsChange?: (logs: LineWebhookLog[]) => void;
  onManagerPinChange?: (pin: string) => void;
  onConnectionStatusChange?: (
    status: 'connecting' | 'connected' | 'error',
    messageTh?: string
  ) => void;
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
    createdAt: '2026-01-10T08:01:00.000Z',
  },
  {
    id: 'branch_silom',
    name: 'สาขาสีลม',
    code: 'BKK-SLM',
    district: 'เขตบางรัก กรุงเทพฯ',
    addressSummary: '191 อาคารสีลมคอมเพล็กซ์ ชั้น 2',
    createdAt: '2026-01-10T08:02:00.000Z',
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

export const SUPABASE_SQL_SCHEMA = `-- ระบบฐานข้อมูลคลาวด์เรียลไทม์ (Firebase Firestore + Supabase PostgreSQL)
-- ข้อมูลทั้งหมดถูกซิงก์แบบเรียลไทม์ผ่าน Cloud Firestore (ai-studio-xtencafekpi) อัตโนมัติ

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
  with check (true);`;

// ============================================================================
// DEFENSIVE PAYLOAD SANITIZERS (Matches firebase-blueprint.json & firestore.rules)
// ============================================================================
function sanitizeId(rawId: string, prefix = 'id'): string {
  const cleaned = String(rawId || '')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 128);
  return cleaned.length > 0 ? cleaned : `${prefix}_${Date.now()}`;
}

function sanitizeString(val: unknown, maxLen: number, fallback = ''): string {
  const str = typeof val === 'string' ? val.trim() : String(val ?? '').trim();
  const effective = str.length > 0 ? str : fallback;
  return effective.slice(0, maxLen);
}

function toFirestoreBranch(branch: Branch): Record<string, unknown> {
  const id = sanitizeId(branch.id, 'branch');
  return {
    id,
    workspaceId: WORKSPACE_ID,
    name: sanitizeString(branch.name, 200, 'สาขามาตรฐาน'),
    code: sanitizeString(branch.code, 64, 'BKK-001'),
    district: sanitizeString(branch.district, 200, 'กรุงเทพมหานคร'),
    addressSummary: sanitizeString(
      branch.addressSummary,
      500,
      'จุดให้บริการหน้าร้านมาตรฐาน'
    ),
    createdAt: sanitizeString(
      branch.createdAt,
      64,
      new Date().toISOString()
    ),
  };
}

function toFirestoreEmployee(emp: Employee): Record<string, unknown> {
  const id = sanitizeId(emp.id, 'emp');
  return {
    id,
    workspaceId: WORKSPACE_ID,
    branchId: sanitizeId(emp.branchId, 'branch'),
    name: sanitizeString(emp.name, 120, 'พนักงาน'),
    createdAt: sanitizeString(emp.createdAt, 64, new Date().toISOString()),
  };
}

function toFirestoreCategory(
  cat: FormQuestionCategory,
  sortOrder: number
): Record<string, unknown> {
  const id = sanitizeId(cat.id, 'cat');
  const payload: Record<string, unknown> = {
    id,
    workspaceId: WORKSPACE_ID,
    name: sanitizeString(cat.name, 200, 'หมวดหมู่คำถาม'),
    sortOrder: Number.isFinite(sortOrder)
      ? Math.max(0, Math.min(10000, Math.round(sortOrder)))
      : 0,
  };
  if (cat.description && cat.description.trim().length > 0) {
    payload.description = cat.description.trim().slice(0, 500);
  }
  return payload;
}

const VALID_QUESTION_TYPES = new Set([
  'short_text',
  'paragraph',
  'number',
  'multiple_choice',
  'checkboxes',
  'dropdown',
  'linear_scale',
  'rating',
  'multiple_choice_grid',
  'checkbox_grid',
  'image_upload',
  'date',
  'time',
]);

function toFirestoreQuestion(
  q: FormQuestion,
  sortOrder: number
): Record<string, unknown> {
  const id = sanitizeId(q.id, 'q');
  const safeType = VALID_QUESTION_TYPES.has(q.type) ? q.type : 'short_text';
  const payload: Record<string, unknown> = {
    id,
    workspaceId: WORKSPACE_ID,
    title: sanitizeString(q.title, 400, 'คำถามประเมิน KPI'),
    type: safeType,
    required: Boolean(q.required),
    sortOrder: Number.isFinite(sortOrder)
      ? Math.max(0, Math.min(10000, Math.round(sortOrder)))
      : 0,
  };

  if (q.categoryId && q.categoryId.trim().length > 0) {
    payload.categoryId = sanitizeId(q.categoryId, 'cat');
  }
  if (q.description && q.description.trim().length > 0) {
    payload.description = q.description.trim().slice(0, 600);
  }
  if (Array.isArray(q.options) && q.options.length > 0) {
    payload.options = q.options
      .slice(0, 50)
      .map((opt) => sanitizeString(opt, 200, 'ตัวเลือก'));
  }
  if (Array.isArray(q.rows) && q.rows.length > 0) {
    payload.rows = q.rows
      .slice(0, 50)
      .map((r) => sanitizeString(r, 200, 'รายการ'));
  }
  if (Array.isArray(q.columns) && q.columns.length > 0) {
    payload.columns = q.columns
      .slice(0, 50)
      .map((c) => sanitizeString(c, 200, 'ตัวเลือก'));
  }
  if (typeof q.scaleMin === 'number' && Number.isFinite(q.scaleMin)) {
    payload.scaleMin = q.scaleMin;
  }
  if (typeof q.scaleMax === 'number' && Number.isFinite(q.scaleMax)) {
    payload.scaleMax = q.scaleMax;
  }
  if (q.scaleMinLabel && q.scaleMinLabel.trim().length > 0) {
    payload.scaleMinLabel = q.scaleMinLabel.trim().slice(0, 120);
  }
  if (q.scaleMaxLabel && q.scaleMaxLabel.trim().length > 0) {
    payload.scaleMaxLabel = q.scaleMaxLabel.trim().slice(0, 120);
  }
  if (typeof q.maxScore === 'number' && Number.isFinite(q.maxScore)) {
    payload.maxScore = q.maxScore;
  }
  if (q.unitLabel && q.unitLabel.trim().length > 0) {
    payload.unitLabel = q.unitLabel.trim().slice(0, 64);
  }
  return payload;
}

function cleanUploadedEvidence(img: UploadedEvidence): Record<string, unknown> {
  return {
    id: sanitizeId(img.id, 'img'),
    fileName: sanitizeString(img.fileName, 200, 'image.jpg'),
    fileSize:
      typeof img.fileSize === 'number' && Number.isFinite(img.fileSize)
        ? img.fileSize
        : 0,
    mimeType: sanitizeString(img.mimeType, 64, 'image/jpeg'),
    dataUrl: typeof img.dataUrl === 'string' ? img.dataUrl : '',
  };
}

function cleanResponseItem(resp: FormQuestionResponse): Record<string, unknown> {
  const item: Record<string, unknown> = {
    questionId: sanitizeId(resp.questionId, 'q'),
    questionTitle: sanitizeString(resp.questionTitle, 400, 'คำถาม'),
    questionType: VALID_QUESTION_TYPES.has(resp.questionType)
      ? resp.questionType
      : 'short_text',
  };
  if (resp.categoryId) item.categoryId = sanitizeId(resp.categoryId, 'cat');
  if (resp.categoryName)
    item.categoryName = sanitizeString(resp.categoryName, 200, 'ทั่วไป');
  if (resp.textValue !== undefined)
    item.textValue = String(resp.textValue).slice(0, 5000);
  if (
    typeof resp.numberValue === 'number' &&
    Number.isFinite(resp.numberValue)
  ) {
    item.numberValue = resp.numberValue;
  }
  if (Array.isArray(resp.choiceValues)) {
    item.choiceValues = resp.choiceValues
      .slice(0, 50)
      .map((c) => String(c).slice(0, 300));
  }
  if (resp.gridValues && typeof resp.gridValues === 'object') {
    const cleanGrid: Record<string, string[]> = {};
    for (const [k, v] of Object.entries(resp.gridValues)) {
      if (Array.isArray(v)) {
        cleanGrid[k.slice(0, 200)] = v
          .slice(0, 50)
          .map((x) => String(x).slice(0, 200));
      }
    }
    item.gridValues = cleanGrid;
  }
  if (Array.isArray(resp.images)) {
    item.images = resp.images.slice(0, 10).map(cleanUploadedEvidence);
  }
  if (typeof resp.maxScore === 'number' && Number.isFinite(resp.maxScore)) {
    item.maxScore = resp.maxScore;
  }
  if (resp.unitLabel) {
    item.unitLabel = sanitizeString(resp.unitLabel, 64, '');
  }
  return item;
}

function toFirestoreSubmission(sub: KpiSubmission): Record<string, unknown> {
  const id = sanitizeId(sub.id, 'sub');
  const cleanedResponses = (sub.responses || [])
    .slice(0, 50)
    .map(cleanResponseItem);
  const cleanedImages = (sub.images || [])
    .slice(0, 15)
    .map(cleanUploadedEvidence);

  const candidate = {
    id,
    workspaceId: WORKSPACE_ID,
    branchId: sanitizeId(sub.branchId, 'branch'),
    branchName: sanitizeString(sub.branchName, 200, 'สาขา'),
    employeeId: sanitizeId(sub.employeeId, 'emp'),
    employeeName: sanitizeString(sub.employeeName, 120, 'พนักงาน'),
    submissionDate: sanitizeString(
      sub.submissionDate,
      32,
      new Date().toISOString().split('T')[0]
    ),
    createdAt: sanitizeString(sub.createdAt, 64, new Date().toISOString()),
    responses: cleanedResponses,
    images: cleanedImages,
    lineNotificationSent: Boolean(sub.lineNotificationSent),
  };

  const serializedSize = JSON.stringify(candidate).length;
  if (serializedSize > 800_000) {
    // Keep top-level images lightweight if responses already contain the base64 images
    return {
      ...candidate,
      images: cleanedImages.slice(0, 2),
      responses: cleanedResponses.map((r) =>
        Array.isArray(r.images)
          ? { ...r, images: (r.images as unknown[]).slice(0, 2) }
          : r
      ),
    };
  }
  return candidate;
}

function toFirestoreLineLog(log: LineWebhookLog): Record<string, unknown> {
  const id = sanitizeId(log.id, 'log');
  const validStatus =
    log.status === 'dispatched' ||
    log.status === 'simulated_ok' ||
    log.status === 'error'
      ? log.status
      : 'simulated_ok';
  const payload: Record<string, unknown> = {
    id,
    workspaceId: WORKSPACE_ID,
    submissionId: sanitizeId(log.submissionId, 'sub'),
    timestamp: sanitizeString(log.timestamp, 64, new Date().toISOString()),
    branchName: sanitizeString(log.branchName, 200, 'สาขา'),
    employeeName: sanitizeString(log.employeeName, 120, 'พนักงาน'),
    messagePreview: sanitizeString(
      log.messagePreview,
      5000,
      'แจ้งเตือนการส่ง KPI'
    ),
    status: validStatus,
  };
  if (log.statusMessageTh) {
    payload.statusMessageTh = sanitizeString(log.statusMessageTh, 1000, '');
  }
  if (log.endpointUrl) {
    payload.endpointUrl = sanitizeString(log.endpointUrl, 300, '');
  }
  return payload;
}

// ============================================================================
// CROSS-TAB BROADCAST CHANNEL FOR INSTANT 0ms SAME-BROWSER SYNC
// ============================================================================
const BROADCAST_CHANNEL_NAME = 'xtencafe_kpi_realtime_channel_v1';
let broadcastChannel: BroadcastChannel | null = null;

function getBroadcastChannel(): BroadcastChannel | null {
  if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') {
    return null;
  }
  if (!broadcastChannel) {
    try {
      broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
    } catch {
      return null;
    }
  }
  return broadcastChannel;
}

function notifyBroadcastChannel(key: string): void {
  const channel = getBroadcastChannel();
  if (channel) {
    try {
      channel.postMessage({ key, timestamp: Date.now() });
    } catch {
      // ignore
    }
  }
}

// ============================================================================
// LAYER 2: IndexedDB High-Capacity Persistent Storage
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
        const idb = req.result;
        if (!idb.objectStoreNames.contains(IDB_STORE)) {
          idb.createObjectStore(IDB_STORE);
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
  const idb = await openIndexedDb();
  if (!idb) return;
  return new Promise((resolve) => {
    try {
      const tx = idb.transaction(IDB_STORE, 'readwrite');
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
  const idb = await openIndexedDb();
  if (!idb) return null;
  return new Promise((resolve) => {
    try {
      const tx = idb.transaction(IDB_STORE, 'readonly');
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
  const idb = await openIndexedDb();
  if (!idb) return;
  return new Promise((resolve) => {
    try {
      const tx = idb.transaction(IDB_STORE, 'readwrite');
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
    // ignore
  }
}

// ============================================================================
// LAYER 1: Quota-Resilient Synchronous localStorage Mirror
// ============================================================================
function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw !== null) {
      return JSON.parse(raw) as T;
    }

    const legacyCandidates = LEGACY_KEYS[key] || [];
    for (const oldKey of legacyCandidates) {
      const legacyRaw = localStorage.getItem(oldKey);
      if (legacyRaw !== null) {
        const parsed = JSON.parse(legacyRaw) as T;
        localStorage.setItem(key, legacyRaw);
        return parsed;
      }
    }

    localStorage.setItem(key, JSON.stringify(fallback));
    return fallback;
  } catch {
    return fallback;
  }
}

function writeLocalMirror<T>(key: string, data: T, broadcast = true): void {
  void writeIndexedDb(key, data);
  void pushCollectionToSupabase(key, data);

  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    if (key === STORAGE_KEYS.SUBMISSIONS && Array.isArray(data)) {
      try {
        const light = (data as unknown as KpiSubmission[]).map((sub, idx) => ({
          ...sub,
          images: idx < 4 ? sub.images.slice(0, 1) : [],
          responses: sub.responses.map((r) => ({
            ...r,
            images: idx < 4 ? r.images?.slice(0, 1) : [],
          })),
        }));
        localStorage.setItem(key, JSON.stringify(light));
      } catch {
        // IndexedDB and Cloud Firestore hold the full dataset
      }
    }
  }

  if (broadcast) {
    notifyBroadcastChannel(key);
  }
}

// ============================================================================
// LAYER 0: REAL-TIME FIREBASE FIRESTORE CLOUD SYNC ENGINE
// ============================================================================
let isSeedingCloud = false;

async function seedEmptyFirestoreWorkspaceIfNeeded(): Promise<void> {
  if (isSeedingCloud) return;
  isSeedingCloud = true;

  try {
    const metaRef = doc(db, 'appSettings', 'workspace_meta');
    const metaSnap = await getDoc(metaRef);

    if (metaSnap.exists() && metaSnap.data()?.seeded === true) {
      return;
    }

    const seedBranches = readStorage<Branch[]>(
      STORAGE_KEYS.BRANCHES,
      INITIAL_BRANCHES
    );
    const seedEmployees = readStorage<Employee[]>(
      STORAGE_KEYS.EMPLOYEES,
      INITIAL_EMPLOYEES
    );
    const seedCategories = readStorage<FormQuestionCategory[]>(
      STORAGE_KEYS.QUESTION_CATEGORIES,
      INITIAL_QUESTION_CATEGORIES
    );
    const seedQuestions = readStorage<FormQuestion[]>(
      STORAGE_KEYS.QUESTIONS,
      INITIAL_FORM_QUESTIONS
    );
    const seedSubmissions = readStorage<KpiSubmission[]>(
      STORAGE_KEYS.SUBMISSIONS,
      INITIAL_SUBMISSIONS
    );
    const seedPin = readStorage<string>(STORAGE_KEYS.MANAGER_PIN, '1234');

    // Seed core metadata, branches, employees, categories, and questions
    const coreBatch = writeBatch(db);

    for (const b of seedBranches) {
      const clean = toFirestoreBranch(b);
      coreBatch.set(doc(db, 'branches', String(clean.id)), clean);
    }

    for (const emp of seedEmployees) {
      const clean = toFirestoreEmployee(emp);
      coreBatch.set(doc(db, 'employees', String(clean.id)), clean);
    }

    seedCategories.forEach((cat, idx) => {
      const clean = toFirestoreCategory(cat, idx);
      coreBatch.set(doc(db, 'formCategories', String(clean.id)), clean);
    });

    seedQuestions.forEach((q, idx) => {
      const clean = toFirestoreQuestion(q, idx);
      coreBatch.set(doc(db, 'formQuestions', String(clean.id)), clean);
    });

    coreBatch.set(metaRef, {
      id: 'workspace_meta',
      workspaceId: WORKSPACE_ID,
      managerPin: /^\d{4,16}$/.test(seedPin) ? seedPin : '1234',
      seeded: true,
      updatedAt: new Date().toISOString(),
    });

    await coreBatch.commit();

    // Seed submissions individually so each submission document is committed cleanly
    for (const sub of seedSubmissions) {
      const clean = toFirestoreSubmission(sub);
      await setDoc(doc(db, 'kpiSubmissions', String(clean.id)), clean);
    }
  } catch (error) {
    console.warn('Firestore initial seed notice:', error);
  } finally {
    isSeedingCloud = false;
  }
}

export const supabaseMockDb = {
  getBranches(): Branch[] {
    return readStorage<Branch[]>(STORAGE_KEYS.BRANCHES, INITIAL_BRANCHES);
  },

  saveBranches(branches: Branch[]): void {
    writeLocalMirror(STORAGE_KEYS.BRANCHES, branches);
  },

  getEmployees(): Employee[] {
    return readStorage<Employee[]>(STORAGE_KEYS.EMPLOYEES, INITIAL_EMPLOYEES);
  },

  saveEmployees(employees: Employee[]): void {
    writeLocalMirror(STORAGE_KEYS.EMPLOYEES, employees);
  },

  getQuestionCategories(): FormQuestionCategory[] {
    return readStorage<FormQuestionCategory[]>(
      STORAGE_KEYS.QUESTION_CATEGORIES,
      INITIAL_QUESTION_CATEGORIES
    );
  },

  saveQuestionCategories(categories: FormQuestionCategory[]): void {
    writeLocalMirror(STORAGE_KEYS.QUESTION_CATEGORIES, categories);
  },

  getQuestions(): FormQuestion[] {
    return readStorage<FormQuestion[]>(
      STORAGE_KEYS.QUESTIONS,
      INITIAL_FORM_QUESTIONS
    );
  },

  saveQuestions(questions: FormQuestion[]): void {
    writeLocalMirror(STORAGE_KEYS.QUESTIONS, questions);
  },

  getSubmissions(): KpiSubmission[] {
    return readStorage<KpiSubmission[]>(
      STORAGE_KEYS.SUBMISSIONS,
      INITIAL_SUBMISSIONS
    );
  },

  saveSubmissions(submissions: KpiSubmission[]): void {
    writeLocalMirror(STORAGE_KEYS.SUBMISSIONS, submissions);
  },

  getLineLogs(): LineWebhookLog[] {
    return readStorage<LineWebhookLog[]>(STORAGE_KEYS.LINE_LOGS, []);
  },

  saveLineLogs(logs: LineWebhookLog[]): void {
    writeLocalMirror(STORAGE_KEYS.LINE_LOGS, logs);
  },

  getManagerPin(): string {
    return readStorage<string>(STORAGE_KEYS.MANAGER_PIN, '1234');
  },

  saveManagerPin(pin: string): void {
    writeLocalMirror(STORAGE_KEYS.MANAGER_PIN, pin);
    const cleanPin = /^\d{4,16}$/.test(pin) ? pin : '1234';
    void setDoc(doc(db, 'appSettings', 'workspace_meta'), {
      id: 'workspace_meta',
      workspaceId: WORKSPACE_ID,
      managerPin: cleanPin,
      seeded: true,
      updatedAt: new Date().toISOString(),
    }).catch((err) =>
      handleFirestoreError(err, OperationType.WRITE, 'appSettings/workspace_meta')
    );
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

  // ==========================================================================
  // DIRECT FIRESTORE CLOUD MUTATIONS (Instant Real-Time Persistence)
  // ==========================================================================
  async createBranchInCloud(branch: Branch): Promise<void> {
    const clean = toFirestoreBranch(branch);
    const path = `branches/${clean.id}`;
    try {
      await setDoc(doc(db, 'branches', String(clean.id)), clean);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  },

  async updateBranchInCloud(
    branch: Branch,
    affectedSubmissions: KpiSubmission[]
  ): Promise<void> {
    const clean = toFirestoreBranch(branch);
    const path = `branches/${clean.id}`;
    try {
      const batch = writeBatch(db);
      batch.set(doc(db, 'branches', String(clean.id)), clean);
      for (const sub of affectedSubmissions) {
        const cleanSub = toFirestoreSubmission(sub);
        batch.set(doc(db, 'kpiSubmissions', String(cleanSub.id)), cleanSub);
      }
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  async deleteBranchInCloud(
    branchId: string,
    employeeIdsToDelete: string[]
  ): Promise<void> {
    const cleanId = sanitizeId(branchId, 'branch');
    const path = `branches/${cleanId}`;
    try {
      const batch = writeBatch(db);
      batch.delete(doc(db, 'branches', cleanId));
      for (const empId of employeeIdsToDelete) {
        batch.delete(doc(db, 'employees', sanitizeId(empId, 'emp')));
      }
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  async createEmployeeInCloud(employee: Employee): Promise<void> {
    const clean = toFirestoreEmployee(employee);
    const path = `employees/${clean.id}`;
    try {
      await setDoc(doc(db, 'employees', String(clean.id)), clean);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  },

  async deleteEmployeeInCloud(employeeId: string): Promise<void> {
    const cleanId = sanitizeId(employeeId, 'emp');
    const path = `employees/${cleanId}`;
    try {
      await deleteDoc(doc(db, 'employees', cleanId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  async syncCategoriesInCloud(
    categories: FormQuestionCategory[],
    previousCategoryIds: string[]
  ): Promise<void> {
    const path = 'formCategories';
    try {
      const batch = writeBatch(db);
      const nextIds = new Set<string>();

      categories.forEach((cat, idx) => {
        const clean = toFirestoreCategory(cat, idx);
        const docId = String(clean.id);
        nextIds.add(docId);
        batch.set(doc(db, 'formCategories', docId), clean);
      });

      for (const oldId of previousCategoryIds) {
        const cleanOld = sanitizeId(oldId, 'cat');
        if (!nextIds.has(cleanOld)) {
          batch.delete(doc(db, 'formCategories', cleanOld));
        }
      }

      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async syncQuestionsInCloud(
    questions: FormQuestion[],
    previousQuestionIds: string[]
  ): Promise<void> {
    const path = 'formQuestions';
    try {
      const batch = writeBatch(db);
      const nextIds = new Set<string>();

      questions.forEach((q, idx) => {
        const clean = toFirestoreQuestion(q, idx);
        const docId = String(clean.id);
        nextIds.add(docId);
        batch.set(doc(db, 'formQuestions', docId), clean);
      });

      for (const oldId of previousQuestionIds) {
        const cleanOld = sanitizeId(oldId, 'q');
        if (!nextIds.has(cleanOld)) {
          batch.delete(doc(db, 'formQuestions', cleanOld));
        }
      }

      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async createSubmissionInCloud(submission: KpiSubmission): Promise<void> {
    const clean = toFirestoreSubmission(submission);
    const path = `kpiSubmissions/${clean.id}`;
    try {
      await setDoc(doc(db, 'kpiSubmissions', String(clean.id)), clean);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  },

  async updateSubmissionNotificationStatusInCloud(
    submissionId: string,
    lineNotificationSent: boolean
  ): Promise<void> {
    const cleanId = sanitizeId(submissionId, 'sub');
    const path = `kpiSubmissions/${cleanId}`;
    try {
      await updateDoc(doc(db, 'kpiSubmissions', cleanId), {
        lineNotificationSent: Boolean(lineNotificationSent),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  async deleteSubmissionInCloud(submissionId: string): Promise<void> {
    const cleanId = sanitizeId(submissionId, 'sub');
    const path = `kpiSubmissions/${cleanId}`;
    try {
      await deleteDoc(doc(db, 'kpiSubmissions', cleanId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  async createLineLogInCloud(log: LineWebhookLog): Promise<void> {
    const clean = toFirestoreLineLog(log);
    const path = `lineLogs/${clean.id}`;
    try {
      await setDoc(doc(db, 'lineLogs', String(clean.id)), clean);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  },

  /**
   * Subscribes immediately to real-time updates from Cloud Firestore (onSnapshot)
   * AND cross-tab BroadcastChannel/localStorage events.
   */
  subscribeToRealtimeDatabase(callbacks: RealtimeDatabaseCallbacks): () => void {
    const unsubscribers: Array<() => void> = [];

    callbacks.onConnectionStatusChange?.('connecting');

    // Trigger non-blocking initial workspace seed check in parallel
    void seedEmptyFirestoreWorkspaceIfNeeded();

    // 1. Real-time Branches Listener
    const branchesQuery = query(
      collection(db, 'branches'),
      where('workspaceId', '==', WORKSPACE_ID)
    );
    unsubscribers.push(
      onSnapshot(
        branchesQuery,
        (snapshot) => {
          callbacks.onConnectionStatusChange?.('connected');
          if (snapshot.empty) {
            void seedEmptyFirestoreWorkspaceIfNeeded();
            return;
          }
          const list = snapshot.docs
            .map((d) => {
              const data = d.data();
              return {
                id: String(data.id || d.id),
                name: String(data.name || ''),
                code: String(data.code || ''),
                district: String(data.district || ''),
                addressSummary: String(data.addressSummary || ''),
                createdAt: String(data.createdAt || ''),
              } satisfies Branch;
            })
            .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
          writeLocalMirror(STORAGE_KEYS.BRANCHES, list, false);
          callbacks.onBranchesChange?.(list);
        },
        (error) => {
          handleFirestoreError(error, OperationType.LIST, 'branches');
        }
      )
    );

    // 2. Real-time Employees Listener
    const employeesQuery = query(
      collection(db, 'employees'),
      where('workspaceId', '==', WORKSPACE_ID)
    );
    unsubscribers.push(
      onSnapshot(
        employeesQuery,
        (snapshot) => {
          callbacks.onConnectionStatusChange?.('connected');
          if (snapshot.empty && isSeedingCloud) return;
          const list = snapshot.docs
            .map((d) => {
              const data = d.data();
              return {
                id: String(data.id || d.id),
                branchId: String(data.branchId || ''),
                name: String(data.name || ''),
                createdAt: String(data.createdAt || ''),
              } satisfies Employee;
            })
            .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
          writeLocalMirror(STORAGE_KEYS.EMPLOYEES, list, false);
          callbacks.onEmployeesChange?.(list);
        },
        (error) => {
          handleFirestoreError(error, OperationType.LIST, 'employees');
        }
      )
    );

    // 3. Real-time Form Categories Listener
    const categoriesQuery = query(
      collection(db, 'formCategories'),
      where('workspaceId', '==', WORKSPACE_ID)
    );
    unsubscribers.push(
      onSnapshot(
        categoriesQuery,
        (snapshot) => {
          if (snapshot.empty) return;
          const list = snapshot.docs
            .map((d) => {
              const data = d.data();
              return {
                id: String(data.id || d.id),
                name: String(data.name || ''),
                description: data.description
                  ? String(data.description)
                  : undefined,
                _sortOrder:
                  typeof data.sortOrder === 'number' ? data.sortOrder : 0,
              };
            })
            .sort((a, b) => a._sortOrder - b._sortOrder)
            .map(
              ({ _sortOrder, ...rest }) => rest satisfies FormQuestionCategory
            );
          writeLocalMirror(STORAGE_KEYS.QUESTION_CATEGORIES, list, false);
          callbacks.onCategoriesChange?.(list);
        },
        (error) => {
          handleFirestoreError(error, OperationType.LIST, 'formCategories');
        }
      )
    );

    // 4. Real-time Form Questions Listener
    const questionsQuery = query(
      collection(db, 'formQuestions'),
      where('workspaceId', '==', WORKSPACE_ID)
    );
    unsubscribers.push(
      onSnapshot(
        questionsQuery,
        (snapshot) => {
          if (snapshot.empty) return;
          const list = snapshot.docs
            .map((d) => {
              const data = d.data();
              const q: FormQuestion & { _sortOrder: number } = {
                id: String(data.id || d.id),
                categoryId: data.categoryId
                  ? String(data.categoryId)
                  : undefined,
                title: String(data.title || ''),
                description: data.description
                  ? String(data.description)
                  : undefined,
                type: data.type as FormQuestion['type'],
                required: Boolean(data.required),
                options: Array.isArray(data.options)
                  ? data.options.map(String)
                  : undefined,
                rows: Array.isArray(data.rows)
                  ? data.rows.map(String)
                  : undefined,
                columns: Array.isArray(data.columns)
                  ? data.columns.map(String)
                  : undefined,
                scaleMin:
                  typeof data.scaleMin === 'number' ? data.scaleMin : undefined,
                scaleMax:
                  typeof data.scaleMax === 'number' ? data.scaleMax : undefined,
                scaleMinLabel: data.scaleMinLabel
                  ? String(data.scaleMinLabel)
                  : undefined,
                scaleMaxLabel: data.scaleMaxLabel
                  ? String(data.scaleMaxLabel)
                  : undefined,
                maxScore:
                  typeof data.maxScore === 'number' ? data.maxScore : undefined,
                unitLabel: data.unitLabel ? String(data.unitLabel) : undefined,
                _sortOrder:
                  typeof data.sortOrder === 'number' ? data.sortOrder : 0,
              };
              return q;
            })
            .sort((a, b) => a._sortOrder - b._sortOrder)
            .map(({ _sortOrder, ...rest }) => rest satisfies FormQuestion);
          writeLocalMirror(STORAGE_KEYS.QUESTIONS, list, false);
          callbacks.onQuestionsChange?.(list);
        },
        (error) => {
          handleFirestoreError(error, OperationType.LIST, 'formQuestions');
        }
      )
    );

    // 5. Real-time KPI Submissions Listener
    const submissionsQuery = query(
      collection(db, 'kpiSubmissions'),
      where('workspaceId', '==', WORKSPACE_ID)
    );
    unsubscribers.push(
      onSnapshot(
        submissionsQuery,
        (snapshot) => {
          if (snapshot.empty && isSeedingCloud) return;
          const list = snapshot.docs
            .map((d) => {
              const data = d.data();
              return {
                id: String(data.id || d.id),
                branchId: String(data.branchId || ''),
                branchName: String(data.branchName || ''),
                employeeId: String(data.employeeId || ''),
                employeeName: String(data.employeeName || ''),
                submissionDate: String(data.submissionDate || ''),
                createdAt: String(data.createdAt || ''),
                responses: Array.isArray(data.responses)
                  ? (data.responses as FormQuestionResponse[])
                  : [],
                images: Array.isArray(data.images)
                  ? (data.images as UploadedEvidence[])
                  : [],
                lineNotificationSent: Boolean(data.lineNotificationSent),
              } satisfies KpiSubmission;
            })
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
          writeLocalMirror(STORAGE_KEYS.SUBMISSIONS, list, false);
          callbacks.onSubmissionsChange?.(list);
        },
        (error) => {
          handleFirestoreError(error, OperationType.LIST, 'kpiSubmissions');
        }
      )
    );

    // 6. Real-time LINE Webhook Logs Listener
    const lineLogsQuery = query(
      collection(db, 'lineLogs'),
      where('workspaceId', '==', WORKSPACE_ID)
    );
    unsubscribers.push(
      onSnapshot(
        lineLogsQuery,
        (snapshot) => {
          const list = snapshot.docs
            .map((d) => {
              const data = d.data();
              return {
                id: String(data.id || d.id),
                submissionId: String(data.submissionId || ''),
                timestamp: String(data.timestamp || ''),
                branchName: String(data.branchName || ''),
                employeeName: String(data.employeeName || ''),
                messagePreview: String(data.messagePreview || ''),
                status:
                  (data.status as LineWebhookLog['status']) || 'simulated_ok',
                statusMessageTh: data.statusMessageTh
                  ? String(data.statusMessageTh)
                  : undefined,
                endpointUrl: data.endpointUrl
                  ? String(data.endpointUrl)
                  : undefined,
              } satisfies LineWebhookLog;
            })
            .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
          writeLocalMirror(STORAGE_KEYS.LINE_LOGS, list, false);
          callbacks.onLineLogsChange?.(list);
        },
        (error) => {
          handleFirestoreError(error, OperationType.LIST, 'lineLogs');
        }
      )
    );

    // 7. Real-time Workspace Settings (Manager PIN) Listener
    const metaRef = doc(db, 'appSettings', 'workspace_meta');
    unsubscribers.push(
      onSnapshot(
        metaRef,
        (docSnap) => {
          if (!docSnap.exists()) return;
          const data = docSnap.data();
          if (typeof data.managerPin === 'string' && data.managerPin.length >= 4) {
            writeLocalMirror(STORAGE_KEYS.MANAGER_PIN, data.managerPin, false);
            callbacks.onManagerPinChange?.(data.managerPin);
          }
        },
        (error) => {
          handleFirestoreError(
            error,
            OperationType.GET,
            'appSettings/workspace_meta'
          );
        }
      )
    );

    // Cross-Tab BroadcastChannel & Storage event listener for instant 0ms local tab sync
    const handleKeySync = (key: string | null) => {
      if (!key) return;
      if (key === STORAGE_KEYS.BRANCHES) {
        callbacks.onBranchesChange?.(supabaseMockDb.getBranches());
      } else if (key === STORAGE_KEYS.EMPLOYEES) {
        callbacks.onEmployeesChange?.(supabaseMockDb.getEmployees());
      } else if (key === STORAGE_KEYS.QUESTION_CATEGORIES) {
        callbacks.onCategoriesChange?.(supabaseMockDb.getQuestionCategories());
      } else if (key === STORAGE_KEYS.QUESTIONS) {
        callbacks.onQuestionsChange?.(supabaseMockDb.getQuestions());
      } else if (key === STORAGE_KEYS.SUBMISSIONS) {
        callbacks.onSubmissionsChange?.(supabaseMockDb.getSubmissions());
      } else if (key === STORAGE_KEYS.LINE_LOGS) {
        callbacks.onLineLogsChange?.(supabaseMockDb.getLineLogs());
      } else if (key === STORAGE_KEYS.MANAGER_PIN) {
        callbacks.onManagerPinChange?.(supabaseMockDb.getManagerPin());
      }
    };

    const handleStorage = (e: StorageEvent) => handleKeySync(e.key);
    window.addEventListener('storage', handleStorage);

    const channel = getBroadcastChannel();
    const handleBroadcast = (e: MessageEvent) => {
      if (e.data && typeof e.data.key === 'string') {
        handleKeySync(e.data.key);
      }
    };
    if (channel) {
      channel.addEventListener('message', handleBroadcast);
    }

    return () => {
      unsubscribers.forEach((unsub) => unsub());
      window.removeEventListener('storage', handleStorage);
      if (channel) {
        channel.removeEventListener('message', handleBroadcast);
      }
    };
  },

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

    return result;
  },

  async resetAllToDefaultsInCloud(currentData: {
    branches: Branch[];
    employees: Employee[];
    categories: FormQuestionCategory[];
    questions: FormQuestion[];
    submissions: KpiSubmission[];
    lineLogs: LineWebhookLog[];
  }): Promise<void> {
    Object.values(STORAGE_KEYS).forEach((key) => {
      if (key !== STORAGE_KEYS.SUPABASE_CONFIG) {
        localStorage.removeItem(key);
      }
    });
    Object.values(LEGACY_KEYS)
      .flat()
      .forEach((oldKey) => localStorage.removeItem(oldKey));
    void clearIndexedDb();

    writeLocalMirror(STORAGE_KEYS.BRANCHES, INITIAL_BRANCHES);
    writeLocalMirror(STORAGE_KEYS.EMPLOYEES, INITIAL_EMPLOYEES);
    writeLocalMirror(
      STORAGE_KEYS.QUESTION_CATEGORIES,
      INITIAL_QUESTION_CATEGORIES
    );
    writeLocalMirror(STORAGE_KEYS.QUESTIONS, INITIAL_FORM_QUESTIONS);
    writeLocalMirror(STORAGE_KEYS.SUBMISSIONS, INITIAL_SUBMISSIONS);
    writeLocalMirror(STORAGE_KEYS.LINE_LOGS, []);

    try {
      const batch = writeBatch(db);

      const defaultBranchIds = new Set(INITIAL_BRANCHES.map((b) => b.id));
      for (const b of currentData.branches) {
        if (!defaultBranchIds.has(b.id)) {
          batch.delete(doc(db, 'branches', sanitizeId(b.id, 'branch')));
        }
      }
      for (const b of INITIAL_BRANCHES) {
        const clean = toFirestoreBranch(b);
        batch.set(doc(db, 'branches', String(clean.id)), clean);
      }

      const defaultEmpIds = new Set(INITIAL_EMPLOYEES.map((e) => e.id));
      for (const emp of currentData.employees) {
        if (!defaultEmpIds.has(emp.id)) {
          batch.delete(doc(db, 'employees', sanitizeId(emp.id, 'emp')));
        }
      }
      for (const emp of INITIAL_EMPLOYEES) {
        const clean = toFirestoreEmployee(emp);
        batch.set(doc(db, 'employees', String(clean.id)), clean);
      }

      const defaultCatIds = new Set(
        INITIAL_QUESTION_CATEGORIES.map((c) => c.id)
      );
      for (const cat of currentData.categories) {
        if (!defaultCatIds.has(cat.id)) {
          batch.delete(doc(db, 'formCategories', sanitizeId(cat.id, 'cat')));
        }
      }
      INITIAL_QUESTION_CATEGORIES.forEach((cat, idx) => {
        const clean = toFirestoreCategory(cat, idx);
        batch.set(doc(db, 'formCategories', String(clean.id)), clean);
      });

      const defaultQIds = new Set(INITIAL_FORM_QUESTIONS.map((q) => q.id));
      for (const q of currentData.questions) {
        if (!defaultQIds.has(q.id)) {
          batch.delete(doc(db, 'formQuestions', sanitizeId(q.id, 'q')));
        }
      }
      INITIAL_FORM_QUESTIONS.forEach((q, idx) => {
        const clean = toFirestoreQuestion(q, idx);
        batch.set(doc(db, 'formQuestions', String(clean.id)), clean);
      });

      const defaultSubIds = new Set(INITIAL_SUBMISSIONS.map((s) => s.id));
      for (const sub of currentData.submissions) {
        if (!defaultSubIds.has(sub.id)) {
          batch.delete(doc(db, 'kpiSubmissions', sanitizeId(sub.id, 'sub')));
        }
      }

      for (const log of currentData.lineLogs) {
        batch.delete(doc(db, 'lineLogs', sanitizeId(log.id, 'log')));
      }

      await batch.commit();

      for (const sub of INITIAL_SUBMISSIONS) {
        const clean = toFirestoreSubmission(sub);
        await setDoc(doc(db, 'kpiSubmissions', String(clean.id)), clean);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'resetAllToDefaults');
    }
  },
};
