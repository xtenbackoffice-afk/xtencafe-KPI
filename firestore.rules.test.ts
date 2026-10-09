/**
 * Firestore Security Rules Test Specification (Dirty Dozen Verification)
 * Verifies that all 12 adversarial payloads defined in security_spec.md
 * are rejected with PERMISSION_DENIED.
 */

export interface DirtyDozenTestCase {
  id: number;
  name: string;
  collectionPath: string;
  operation: 'create' | 'update' | 'list' | 'get';
  payload: Record<string, unknown>;
  expectedResult: 'PERMISSION_DENIED';
}

export const DIRTY_DOZEN_TEST_CASES: DirtyDozenTestCase[] = [
  {
    id: 1,
    name: 'Shadow Field Injection on Branch Create',
    collectionPath: '/branches/branch_1',
    operation: 'create',
    payload: {
      id: 'branch_1',
      workspaceId: 'xtencafe_kpi_v1',
      name: 'สาขาสยาม',
      code: 'BKK-SYM',
      district: 'ปทุมวัน',
      addressSummary: 'สยามสแควร์',
      createdAt: '2026-10-08T00:00:00.000Z',
      isVerifiedAdmin: true,
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 2,
    name: 'Cross-Tenant Workspace Spoofing on Branch Create',
    collectionPath: '/branches/branch_1',
    operation: 'create',
    payload: {
      id: 'branch_1',
      workspaceId: 'malicious_workspace',
      name: 'สาขาสยาม',
      code: 'BKK-SYM',
      district: 'ปทุมวัน',
      addressSummary: 'สยามสแควร์',
      createdAt: '2026-10-08T00:00:00.000Z',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 3,
    name: 'ID Mismatch / Path Poisoning on Branch Create',
    collectionPath: '/branches/branch_real',
    operation: 'create',
    payload: {
      id: 'branch_fake',
      workspaceId: 'xtencafe_kpi_v1',
      name: 'สาขาสยาม',
      code: 'BKK-SYM',
      district: 'ปทุมวัน',
      addressSummary: 'สยามสแควร์',
      createdAt: '2026-10-08T00:00:00.000Z',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 4,
    name: 'Oversized String Denial-of-Wallet on Employee Create',
    collectionPath: '/employees/emp_1',
    operation: 'create',
    payload: {
      id: 'emp_1',
      workspaceId: 'xtencafe_kpi_v1',
      branchId: 'branch_rama3',
      name: 'ก'.repeat(200),
      createdAt: '2026-10-08T00:00:00.000Z',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 5,
    name: 'Immutable createdAt Tampering on Branch Update',
    collectionPath: '/branches/branch_rama3',
    operation: 'update',
    payload: {
      id: 'branch_rama3',
      workspaceId: 'xtencafe_kpi_v1',
      name: 'สาขาพระราม 3',
      code: 'BKK-RM3',
      district: 'เขตยานนาวา',
      addressSummary: '799 ถ.พระรามที่ 3',
      createdAt: '1999-01-01T00:00:00.000Z',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 6,
    name: 'Invalid Question Type Enum on FormQuestion Create',
    collectionPath: '/formQuestions/q_bad',
    operation: 'create',
    payload: {
      id: 'q_bad',
      workspaceId: 'xtencafe_kpi_v1',
      categoryId: 'cat_sales',
      title: 'คำถามผิดประเภท',
      type: 'arbitrary_script_injection',
      required: true,
      sortOrder: 1,
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 7,
    name: 'Unbounded Array Flooding on KpiSubmission Create',
    collectionPath: '/kpiSubmissions/sub_flood',
    operation: 'create',
    payload: {
      id: 'sub_flood',
      workspaceId: 'xtencafe_kpi_v1',
      branchId: 'branch_rama3',
      branchName: 'สาขาพระราม 3',
      employeeId: 'emp_rm3_1',
      employeeName: 'นัท',
      submissionDate: '2026-10-08',
      createdAt: '2026-10-08T00:00:00.000Z',
      responses: new Array(60).fill({}),
      images: [],
      lineNotificationSent: false,
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 8,
    name: 'Invalid PIN Format on WorkspaceSetting Update',
    collectionPath: '/appSettings/workspace_meta',
    operation: 'update',
    payload: {
      id: 'workspace_meta',
      workspaceId: 'xtencafe_kpi_v1',
      managerPin: 'abcd_non_numeric',
      seeded: true,
      updatedAt: '2026-10-08T12:00:00.000Z',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 9,
    name: 'Unscoped Collection List Query on Foreign Workspace',
    collectionPath: '/branches/foreign_doc',
    operation: 'list',
    payload: {
      workspaceId: 'other_tenant',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 10,
    name: 'Value Poisoning on FormQuestionCategory Update',
    collectionPath: '/formCategories/cat_sales',
    operation: 'update',
    payload: {
      id: 'cat_sales',
      workspaceId: 'xtencafe_kpi_v1',
      name: 'ยอดขายและแคชเชียร์',
      description: 'รายละเอียด',
      sortOrder: 'invalid_string_sort_order',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 11,
    name: 'Invalid Webhook Status Enum on LineWebhookLog Create',
    collectionPath: '/lineLogs/log_1',
    operation: 'create',
    payload: {
      id: 'log_1',
      workspaceId: 'xtencafe_kpi_v1',
      submissionId: 'sub_1',
      timestamp: '2026-10-08T12:00:00.000Z',
      branchName: 'สาขาพระราม 3',
      employeeName: 'นัท',
      messagePreview: 'ข้อความทดสอบ',
      status: 'hacked_status',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 12,
    name: 'Arbitrary Catch-All Collection Write',
    collectionPath: '/undeclaredCollection/doc_1',
    operation: 'create',
    payload: {
      id: 'doc_1',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
];
