const AUTH_KEY = process.env.MSG91_AUTH_KEY || "";
const TEMPLATE_ID = process.env.MSG91_TEMPLATE_ID || "";

export async function sendOtp(phone: string): Promise<{ success: boolean; requestId?: string }> {
  if (!AUTH_KEY) {
    // Dev mode: log OTP instead of sending
    console.log(`[DEV] OTP would be sent to ${phone}`);
    return { success: true, requestId: "dev-mode" };
  }

  const res = await fetch(
    `https://control.msg91.com/api/v5/otp?template_id=${TEMPLATE_ID}&mobile=${phone}`,
    {
      method: "POST",
      headers: {
        authkey: AUTH_KEY,
        "Content-Type": "application/json",
      },
    }
  );

  const data = await res.json();
  return {
    success: data.type === "success",
    requestId: data.request_id,
  };
}

export async function verifyOtpViaMSG91(
  phone: string,
  otp: string
): Promise<boolean> {
  if (!AUTH_KEY) {
    // Dev mode: accept any OTP
    return true;
  }

  const res = await fetch(
    `https://control.msg91.com/api/v5/otp/verify?mobile=${phone}&otp=${otp}`,
    {
      method: "POST",
      headers: {
        authkey: AUTH_KEY,
      },
    }
  );

  const data = await res.json();
  return data.type === "success";
}
