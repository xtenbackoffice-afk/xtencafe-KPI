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

const STORAGE_KEYS = {
  BRANCHES: 'kronokpi_supabase_branches_v5_cat_th',
  EMPLOYEES: 'kronokpi_supabase_employees_v5_cat_th',
  QUESTION_CATEGORIES: 'kronokpi_supabase_qcategories_v5_cat_th',
  QUESTIONS: 'kronokpi_supabase_questions_v5_cat_th',
  SUBMISSIONS: 'kronokpi_supabase_submissions_v5_cat_th',
  LINE_LOGS: 'kronokpi_supabase_line_logs_v5_cat_th',
  MANAGER_PIN: 'kronokpi_manager_pin_v5_cat_th',
};

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
create table public.branches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  district text not null,
  address_summary text,
  created_at timestamptz default now()
);

create table public.employees (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid references public.branches(id) on delete cascade,
  nickname text not null,
  created_at timestamptz default now()
);

create table public.form_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  sort_order int default 0,
  created_at timestamptz default now()
);

create table public.form_questions (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.form_categories(id) on delete cascade,
  title text not null,
  description text,
  question_type text not null check (question_type in ('short_text', 'paragraph', 'number', 'image_upload')),
  required boolean default true,
  max_score numeric,
  unit_label text,
  sort_order int default 0,
  created_at timestamptz default now()
);

create table public.kpi_submissions (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid references public.branches(id) on delete set null,
  branch_name text not null,
  employee_id uuid references public.employees(id) on delete set null,
  employee_nickname text not null,
  submission_date date not null,
  responses jsonb not null,
  evidence_urls jsonb default '[]'::jsonb,
  line_notification_sent boolean default false,
  created_at timestamptz default now()
);

alter table public.kpi_submissions enable row level security;

create policy "Employees can insert KPI responses"
  on public.kpi_submissions for insert
  to anon, authenticated
  with check (true);

create policy "Only managers can read KPI responses"
  on public.kpi_submissions for select
  to authenticated
  using (auth.jwt() ->> 'role' = 'manager');`;

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error(`Failed to persist ${key} to localStorage:`, err);
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

  resetAllToDefaults(): void {
    Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
  },
};
