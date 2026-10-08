import { KpiSubmission, LineWebhookLog } from '../types/kpi';

/**
 * LINE Messaging API Push Message Endpoint
 */
export const LINE_MESSAGING_API_PUSH_URL =
  'https://api.line.me/v2/bot/message/push';

const CLIENT_LINE_CHANNEL_ACCESS_TOKEN =
  import.meta.env.VITE_LINE_CHANNEL_ACCESS_TOKEN || '';

const CLIENT_LINE_TARGET_USER_ID =
  import.meta.env.VITE_LINE_TARGET_USER_ID || '';

/**
 * สร้างข้อความแจ้งเตือนภาษาไทยที่สุภาพและครบถ้วนสำหรับส่งผ่าน LINE Messaging API
 */
export function formatLineNotificationMessage(
  submission: KpiSubmission
): string {
  const responseLines = submission.responses
    .map((res) => {
      const prefix = res.categoryName ? `[${res.categoryName}] ` : '';
      if (res.questionType === 'number') {
        const formattedVal =
          res.numberValue !== undefined
            ? res.numberValue.toLocaleString('th-TH')
            : '0';
        const unit = res.unitLabel ? ` ${res.unitLabel}` : '';
        const maxPart = res.maxScore ? `/${res.maxScore}` : '';
        return `• ${prefix}${res.questionTitle}: ${formattedVal}${maxPart}${unit}`;
      }
      if (res.questionType === 'image_upload') {
        const count = res.images?.length ?? 0;
        return `• ${prefix}${res.questionTitle}: แนบรูปภาพ ${count} รูป`;
      }
      return `• ${prefix}${res.questionTitle}: ${res.textValue?.trim() || '-'}`;
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
 * ส่งข้อความแจ้งเตือนผ่าน LINE Messaging API (`https://api.line.me/v2/bot/message/push`)
 * โดยเรียกผ่าน Backend Proxy (`/api/line-notify`) หรือส่งตรงจากฝั่ง Client พร้อมบันทึกสถานะลงประวัติ
 */
export async function sendLineNotification(
  submission: KpiSubmission
): Promise<LineWebhookLog> {
  const formattedMessage = formatLineNotificationMessage(submission);

  const linePushPayload = {
    to: CLIENT_LINE_TARGET_USER_ID || 'LINE_TARGET_USER_ID',
    messages: [
      {
        type: 'text',
        text: formattedMessage,
      },
    ],
  };

  let finalStatus: 'dispatched' | 'simulated_ok' | 'error' = 'simulated_ok';
  let statusMessageTh =
    'บันทึกข้อมูลการแจ้งเตือนเรียบร้อยแล้ว (รอการตั้งค่า VITE_LINE_CHANNEL_ACCESS_TOKEN และ VITE_LINE_TARGET_USER_ID)';
  let recordedPayload = linePushPayload;

  try {
    // 1. เรียกใช้งานผ่าน Backend Route (/api/line-notify) เพื่อส่งคำขอไปยัง https://api.line.me/v2/bot/message/push
    const apiResponse = await fetch('/api/line-notify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messageText: formattedMessage,
        channelAccessToken: CLIENT_LINE_CHANNEL_ACCESS_TOKEN || undefined,
        targetUserId: CLIENT_LINE_TARGET_USER_ID || undefined,
        submissionId: submission.id,
      }),
    });

    const contentType = apiResponse.headers.get('content-type') || '';
    if (apiResponse.ok && contentType.includes('application/json')) {
      const data = await apiResponse.json();
      finalStatus = data.status || (data.ok ? 'dispatched' : 'error');
      statusMessageTh =
        data.statusMessageTh ||
        (data.ok
          ? 'ส่งข้อความแจ้งเตือนผ่าน LINE Messaging API สำเร็จเรียบร้อยแล้ว'
          : 'เกิดข้อผิดพลาดในการส่งข้อความแจ้งเตือนไปยัง LINE');
      if (data.pushPayload) {
        recordedPayload = data.pushPayload;
      }
    } else {
      throw new Error('Fallback to direct client LINE Messaging API call');
    }
  } catch {
    // 2. กรณีรันแบบ Static ล้วน ให้ทดลองส่งคำขอไปยัง https://api.line.me/v2/bot/message/push โดยตรงหากมีการตั้งค่าตัวแปรสภาพแวดล้อม
    const hasClientToken =
      Boolean(CLIENT_LINE_CHANNEL_ACCESS_TOKEN.trim()) &&
      CLIENT_LINE_CHANNEL_ACCESS_TOKEN !== 'YOUR_LINE_CHANNEL_ACCESS_TOKEN';
    const hasClientTarget =
      Boolean(CLIENT_LINE_TARGET_USER_ID.trim()) &&
      CLIENT_LINE_TARGET_USER_ID !== 'YOUR_LINE_USER_OR_GROUP_ID';

    if (hasClientToken && hasClientTarget) {
      try {
        const directRes = await fetch(LINE_MESSAGING_API_PUSH_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${CLIENT_LINE_CHANNEL_ACCESS_TOKEN.trim()}`,
          },
          body: JSON.stringify(linePushPayload),
        });

        if (directRes.ok) {
          finalStatus = 'dispatched';
          statusMessageTh =
            'ส่งข้อความแจ้งเตือนผ่าน LINE Messaging API สำเร็จเรียบร้อยแล้ว';
        } else {
          const errText = await directRes.text();
          finalStatus = 'error';
          statusMessageTh = `ส่งแจ้งเตือนไปยัง LINE ไม่สำเร็จ (HTTP ${directRes.status}): ${errText || 'กรุณาตรวจสอบ Channel Access Token และ Target User ID ครับ'}`;
        }
      } catch (directErr) {
        const msg =
          directErr instanceof Error
            ? directErr.message
            : 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ LINE ได้';
        finalStatus = 'error';
        statusMessageTh = `เกิดข้อผิดพลาดขณะส่งแจ้งเตือนไปยัง LINE Messaging API: ${msg}`;
      }
    } else {
      finalStatus = 'simulated_ok';
      statusMessageTh =
        'บันทึกข้อความแจ้งเตือนในระบบแล้ว (กรุณาตั้งค่า VITE_LINE_CHANNEL_ACCESS_TOKEN และ VITE_LINE_TARGET_USER_ID เพื่อส่งเข้า LINE จริง)';
    }
  }

  const logEntry: LineWebhookLog = {
    id: `line_log_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
    branchName: submission.branchName,
    employeeName: submission.employeeName,
    submissionDate: submission.submissionDate,
    responseCount: submission.responses.length,
    imageCount: submission.images.length,
    endpointUrl: LINE_MESSAGING_API_PUSH_URL,
    status: finalStatus,
    statusMessage: statusMessageTh,
    formattedMessage,
    payloadJson: JSON.stringify(recordedPayload, null, 2),
  };

  return logEntry;
}
