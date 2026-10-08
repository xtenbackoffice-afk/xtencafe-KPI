import { KpiSubmission, LineWebhookLog } from '../types/kpi';

/**
 * Endpoint สำหรับส่งข้อมูลแจ้งเตือนไปยัง Supabase Edge Function เพื่อส่งต่อเข้ากลุ่ม LINE
 */
const SUPABASE_LINE_WEBHOOK_URL =
  import.meta.env.VITE_SUPABASE_LINE_FUNCTION_URL ||
  'https://project-ref.supabase.co/functions/v1/line-kpi-notify';

/**
 * สร้างข้อความแจ้งเตือนภาษาไทยสำหรับส่งเข้ากลุ่ม LINE ของผู้จัดการตามคำตอบในแบบฟอร์ม
 */
export function formatLineNotificationMessage(submission: KpiSubmission): string {
  const responseLines = submission.responses
    .map((res) => {
      if (res.questionType === 'number') {
        const unit = res.unitLabel ? ` ${res.unitLabel}` : '';
        const maxPart = res.maxScore ? `/${res.maxScore}` : '';
        return `• ${res.questionTitle}: ${res.numberValue ?? 0}${maxPart}${unit}`;
      }
      if (res.questionType === 'image_upload') {
        const count = res.images?.length ?? 0;
        return `• ${res.questionTitle}: แนบรูปภาพ ${count} รูป`;
      }
      return `• ${res.questionTitle}: ${res.textValue?.trim() || '-'}`;
    })
    .join('\n');

  return [
    `[แจ้งเตือนการส่งแบบฟอร์ม KPI พนักงาน]`,
    `สาขา: ${submission.branchName}`,
    `ชื่อเล่นพนักงาน: ${submission.employeeName}`,
    `วันที่ส่งข้อมูล: ${submission.submissionDate}`,
    `────────────────────`,
    responseLines,
    `────────────────────`,
    `รูปภาพหลักฐานรวมทั้งหมด: ${submission.images.length} รูป`,
  ]
    .filter(Boolean)
    .join('\n');
}

/**
 * LINE Notification Integration Hook (`sendLineNotification`)
 *
 * เตรียมและจำลองการส่งคำขอ POST ไปยังบริการ Backend เช่น Supabase Edge Function
 * เพื่อแจ้งเตือนกลุ่มแชท LINE ทันทีที่พนักงานกดส่งแบบฟอร์ม KPI
 */
export async function sendLineNotification(
  submission: KpiSubmission
): Promise<LineWebhookLog> {
  const formattedMessage = formatLineNotificationMessage(submission);

  const webhookPayload = {
    event: 'KPI_FORM_RESPONSE_SUBMITTED',
    timestamp: new Date().toISOString(),
    branch: {
      id: submission.branchId,
      name: submission.branchName,
    },
    employee: {
      id: submission.employeeId,
      nickname: submission.employeeName,
    },
    submissionDate: submission.submissionDate,
    responses: submission.responses.map((r) => ({
      questionId: r.questionId,
      questionTitle: r.questionTitle,
      questionType: r.questionType,
      answer:
        r.questionType === 'number'
          ? r.numberValue
          : r.questionType === 'image_upload'
          ? `${r.images?.length ?? 0} รูปภาพ`
          : r.textValue,
    })),
    evidenceCount: submission.images.length,
    lineMessageText: formattedMessage,
  };

  // ============================================================================
  // SUPABASE EDGE FUNCTION / LINE MESSAGING API WEBHOOK INTEGRATION BLOCK
  // ============================================================================
  // try {
  //   await fetch(SUPABASE_LINE_WEBHOOK_URL, {
  //     method: 'POST',
  //     headers: {
  //       'Content-Type': 'application/json',
  //       'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
  //     },
  //     body: JSON.stringify(webhookPayload),
  //   });
  // } catch (error) {
  //   console.error('Failed to trigger LINE notification webhook:', error);
  // }
  // ============================================================================

  await new Promise((resolve) => setTimeout(resolve, 120));

  const logEntry: LineWebhookLog = {
    id: `line_log_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
    branchName: submission.branchName,
    employeeName: submission.employeeName,
    submissionDate: submission.submissionDate,
    responseCount: submission.responses.length,
    imageCount: submission.images.length,
    endpointUrl: SUPABASE_LINE_WEBHOOK_URL,
    status: 'simulated_ok',
    formattedMessage,
    payloadJson: JSON.stringify(webhookPayload, null, 2),
  };

  return logEntry;
}
