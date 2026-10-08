const LINE_PUSH_API_URL = 'https://api.line.me/v2/bot/message/push';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'อนุญาตเฉพาะคำขอแบบ POST เท่านั้น' });
  }

  const channelAccessToken =
    process.env.LINE_CHANNEL_ACCESS_TOKEN ||
    process.env.VITE_LINE_CHANNEL_ACCESS_TOKEN ||
    req.body?.channelAccessToken ||
    '';

  const targetUserId =
    process.env.LINE_TARGET_USER_ID ||
    process.env.VITE_LINE_TARGET_USER_ID ||
    req.body?.targetUserId ||
    '';

  const messageText = req.body?.messageText || '';

  const pushPayload = {
    to: targetUserId || 'LINE_TARGET_USER_ID_NOT_SET',
    messages: [
      {
        type: 'text',
        text: messageText,
      },
    ],
  };

  const isPlaceholderToken =
    !channelAccessToken ||
    channelAccessToken === 'YOUR_LINE_CHANNEL_ACCESS_TOKEN';
  const isPlaceholderTarget =
    !targetUserId || targetUserId === 'YOUR_LINE_USER_OR_GROUP_ID';

  if (isPlaceholderToken || isPlaceholderTarget) {
    return res.status(200).json({
      ok: false,
      status: 'simulated_ok',
      endpointUrl: LINE_PUSH_API_URL,
      statusMessageTh:
        'บันทึกข้อความแจ้งเตือนในระบบแล้ว (กรุณาตั้งค่า LINE_CHANNEL_ACCESS_TOKEN และ LINE_TARGET_USER_ID เพื่อส่งเข้า LINE จริง)',
      pushPayload,
    });
  }

  try {
    const lineResponse = await fetch(LINE_PUSH_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${channelAccessToken.trim()}`,
      },
      body: JSON.stringify(pushPayload),
    });

    if (lineResponse.ok) {
      return res.status(200).json({
        ok: true,
        status: 'dispatched',
        endpointUrl: LINE_PUSH_API_URL,
        statusMessageTh:
          'ส่งข้อความแจ้งเตือนผ่าน LINE Messaging API สำเร็จเรียบร้อยแล้ว',
        pushPayload,
      });
    }

    const errorText = await lineResponse.text();
    return res.status(200).json({
      ok: false,
      status: 'error',
      endpointUrl: LINE_PUSH_API_URL,
      statusMessageTh: `ส่งแจ้งเตือนไปยัง LINE ไม่สำเร็จ (รหัสสถานะ HTTP ${lineResponse.status}): ${errorText || 'กรุณาตรวจสอบ Channel Access Token และ Target User ID'}`,
      pushPayload,
    });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการเชื่อมต่อ';
    return res.status(200).json({
      ok: false,
      status: 'error',
      endpointUrl: LINE_PUSH_API_URL,
      statusMessageTh: `เกิดข้อผิดพลาดขณะเชื่อมต่อ LINE Messaging API: ${errMsg}`,
      pushPayload,
    });
  }
}
