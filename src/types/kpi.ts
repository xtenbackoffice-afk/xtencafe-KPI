export interface Branch {
  id: string;
  name: string;
  code: string;
  district: string;
  addressSummary: string;
  createdAt: string;
}

export interface Employee {
  id: string;
  branchId: string;
  name: string; // ชื่อเล่นพนักงานเท่านั้น (Nickname only)
  createdAt: string;
}

export type FormQuestionType =
  | 'short_text'
  | 'paragraph'
  | 'number'
  | 'image_upload';

export interface FormQuestionCategory {
  id: string;
  name: string; // เช่น "หมวดยอดขาย", "หมวดการบริการ", "หมวดรูปภาพหลักฐาน"
  description?: string;
}

export interface FormQuestion {
  id: string;
  categoryId: string; // ผูกกับหมวดหมู่คำถาม (FormQuestionCategory.id)
  title: string;
  description?: string;
  type: FormQuestionType;
  required: boolean;
  maxScore?: number;
  unitLabel?: string;
}

export interface UploadedEvidence {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  dataUrl: string;
}

export interface FormQuestionResponse {
  questionId: string;
  categoryId?: string;
  categoryName?: string;
  questionTitle: string;
  questionType: FormQuestionType;
  textValue?: string;
  numberValue?: number;
  maxScore?: number;
  unitLabel?: string;
  images?: UploadedEvidence[];
}

export interface KpiSubmission {
  id: string;
  branchId: string;
  branchName: string;
  employeeId: string;
  employeeName: string; // ชื่อเล่นพนักงาน
  submissionDate: string; // YYYY-MM-DD
  createdAt: string; // ISO string
  responses: FormQuestionResponse[];
  images: UploadedEvidence[];
  lineNotificationSent: boolean;
}

export interface LineWebhookLog {
  id: string;
  timestamp: string;
  branchName: string;
  employeeName: string;
  submissionDate: string;
  responseCount: number;
  imageCount: number;
  endpointUrl: string;
  status: 'dispatched' | 'simulated_ok' | 'error';
  formattedMessage: string;
  payloadJson: string;
}
