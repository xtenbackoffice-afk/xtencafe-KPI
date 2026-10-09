# Firestore Security Specification (`xtencafe KPI`)

## 1. Data Invariants

1. **Workspace Tenant Isolation (`workspaceId`)**: Every document across `/branches/{branchId}`, `/employees/{employeeId}`, `/formCategories/{categoryId}`, `/formQuestions/{questionId}`, `/kpiSubmissions/{submissionId}`, `/lineLogs/{logId}`, and `/appSettings/{settingId}` MUST belong to the canonical workspace (`workspaceId == 'xtencafe_kpi_v1'`).
2. **Path Variable & ID Integrity (`isValidId`)**: Every document ID path variable MUST match `^[a-zA-Z0-9_\-]+$` with length `1 <= size <= 128`, and MUST match `data.id` on creation and update.
3. **Strict Schema & Shadow Field Rejection (`hasAll` & `hasOnly`)**: Every `create` and `update` operation MUST pass the entity's `isValid[Entity](incoming())` blueprint helper enforcing exact allowed keys, required keys, string length boundaries, and array size bounds.
4. **Immutable Creation Metadata**: Fields such as `id`, `workspaceId`, and `createdAt` MUST remain immutable during `update` operations (`incoming().id == existing().id && incoming().workspaceId == existing().workspaceId`).
5. **Relational Branch Consistency**: Every `Employee` document MUST reference a valid `branchId` matching `^[a-zA-Z0-9_\-]+$`, and every `KpiSubmission` MUST reference valid `branchId` and `employeeId` identifiers.
6. **Secure List Queries**: Every `allow list` rule MUST evaluate `resource.data.workspaceId == 'xtencafe_kpi_v1'` so unauthorized unscoped scraping queries are rejected.

---

## 2. The "Dirty Dozen" Adversarial Payloads

1. **Payload 1 (Shadow Field Injection on Branch Create)**:
   ```json
   {
     "id": "branch_1",
     "workspaceId": "xtencafe_kpi_v1",
     "name": "สาขาสยาม",
     "code": "BKK-SYM",
     "district": "ปทุมวัน",
     "addressSummary": "สยามสแควร์",
     "createdAt": "2026-10-08T00:00:00.000Z",
     "isVerifiedAdmin": true
   }
   ```
2. **Payload 2 (Cross-Tenant Workspace Spoofing on Branch Create)**:
   ```json
   {
     "id": "branch_1",
     "workspaceId": "malicious_workspace",
     "name": "สาขาสยาม",
     "code": "BKK-SYM",
     "district": "ปทุมวัน",
     "addressSummary": "สยามสแควร์",
     "createdAt": "2026-10-08T00:00:00.000Z"
   }
   ```
3. **Payload 3 (ID Mismatch / Path Poisoning on Branch Create)**:
   Document path `/branches/branch_real` with payload:
   ```json
   {
     "id": "branch_fake",
     "workspaceId": "xtencafe_kpi_v1",
     "name": "สาขาสยาม",
     "code": "BKK-SYM",
     "district": "ปทุมวัน",
     "addressSummary": "สยามสแควร์",
     "createdAt": "2026-10-08T00:00:00.000Z"
   }
   ```
4. **Payload 4 (Oversized String Denial-of-Wallet on Employee Create)**:
   ```json
   {
     "id": "emp_1",
     "workspaceId": "xtencafe_kpi_v1",
     "branchId": "branch_rama3",
     "name": "A_STRING_EXCEEDING_120_CHARACTERS_LIMIT...",
     "createdAt": "2026-10-08T00:00:00.000Z"
   }
   ```
5. **Payload 5 (Immutable `createdAt` Tampering on Branch Update)**:
   Updating `createdAt` on an existing `/branches/branch_rama3` document to `"1999-01-01T00:00:00.000Z"`.
6. **Payload 6 (Invalid Question Type Enum on FormQuestion Create)**:
   ```json
   {
     "id": "q_bad",
     "workspaceId": "xtencafe_kpi_v1",
     "categoryId": "cat_sales",
     "title": "คำถามผิดประเภท",
     "type": "arbitrary_script_injection",
     "required": true,
     "sortOrder": 1
   }
   ```
7. **Payload 7 (Unbounded Array Flooding on KpiSubmission Create)**:
   Submitting a `KpiSubmission` with `responses` containing > 50 elements or `images` containing > 15 elements.
8. **Payload 8 (Invalid PIN Format on WorkspaceSetting Update)**:
   ```json
   {
     "id": "workspace_meta",
     "workspaceId": "xtencafe_kpi_v1",
     "managerPin": "abcd_non_numeric",
     "seeded": true,
     "updatedAt": "2026-10-08T12:00:00.000Z"
   }
   ```
9. **Payload 9 (Unscoped Collection List Query)**:
   Executing `getDocs(collection(db, 'branches'))` without `where('workspaceId', '==', 'xtencafe_kpi_v1')` against documents from another workspace.
10. **Payload 10 (Value Poisoning on FormQuestionCategory Update)**:
    Updating `sortOrder` to a string `"first"` instead of a `number`.
11. **Payload 11 (Invalid Webhook Status Enum on LineWebhookLog Create)**:
    ```json
    {
      "id": "log_1",
      "workspaceId": "xtencafe_kpi_v1",
      "submissionId": "sub_1",
      "timestamp": "2026-10-08T12:00:00.000Z",
      "branchName": "สาขาพระราม 3",
      "employeeName": "นัท",
      "messagePreview": "ข้อความทดสอบ",
      "status": "hacked_status"
    }
    ```
12. **Payload 12 (Arbitrary Catch-All Collection Write)**:
    Writing to an undeclared path `/undeclaredCollection/doc_1`.
