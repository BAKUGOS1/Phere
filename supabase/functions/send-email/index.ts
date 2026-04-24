import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const { type, to, data } = await req.json();

    if (!to || !type) {
      return new Response(
        JSON.stringify({ error: "Missing 'to' or 'type'" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    let subject: string;
    let html: string;

    switch (type) {
      case "welcome":
        subject = "🎉 Welcome to Phere — Your Wedding Planning Starts Here!";
        html = `
          <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #FDF8EE; padding: 40px 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #8B1A3A; font-size: 32px; font-family: Georgia, serif; margin: 0;">Phere</h1>
              <p style="color: #C9A961; font-size: 16px; margin: 4px 0;">फेरे</p>
            </div>
            <div style="background: white; border-radius: 16px; padding: 30px; border: 1px solid rgba(201, 169, 97, 0.3);">
              <h2 style="color: #8B1A3A; margin-top: 0;">Welcome${data?.name ? `, ${data.name}` : ""}! 🎊</h2>
              <p style="color: #2B1810; line-height: 1.6;">
                Congratulations on your upcoming wedding! Phere is here to help you track every rupee 
                and every rishta during this beautiful journey.
              </p>
              <p style="color: #6B5050; line-height: 1.6;">
                With Phere, you can:
              </p>
              <ul style="color: #2B1810; line-height: 2;">
                <li>💰 Track expenses across 16 categories</li>
                <li>🎁 Record shagun received</li>
                <li>📒 Manage Lena-Dena (receivables & payables)</li>
                <li>🤖 Use AI assistant to add entries by voice</li>
                <li>📊 Get beautiful charts & reports</li>
              </ul>
              <p style="color: #6B5050; font-size: 14px; margin-top: 20px;">
                Har Rupaya, Har Rishta — Start planning now!
              </p>
            </div>
            <p style="text-align: center; color: #6B5050; font-size: 12px; margin-top: 20px;">
              Made with ❤️ for Indian Weddings
            </p>
          </div>
        `;
        break;

      case "reminder":
        subject = `⏰ Payment Reminder — ${data?.description || "Pending"}`;
        html = `
          <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #FDF8EE; padding: 40px 20px;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h1 style="color: #8B1A3A; font-size: 24px; font-family: Georgia, serif;">Phere Payment Reminder</h1>
            </div>
            <div style="background: white; border-radius: 16px; padding: 30px; border: 1px solid rgba(201, 169, 97, 0.3);">
              <h2 style="color: #C43E3E; margin-top: 0;">⏰ Payment Due!</h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #6B5050;">Description</td>
                  <td style="padding: 8px 0; color: #2B1810; font-weight: 600; text-align: right;">${data?.description || "—"}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6B5050;">Amount</td>
                  <td style="padding: 8px 0; color: #8B1A3A; font-weight: 600; text-align: right;">₹${data?.amount?.toLocaleString("en-IN") || "—"}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6B5050;">Vendor</td>
                  <td style="padding: 8px 0; color: #2B1810; text-align: right;">${data?.vendor || "—"}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6B5050;">Due Date</td>
                  <td style="padding: 8px 0; color: #C43E3E; font-weight: 600; text-align: right;">${data?.dueDate || "—"}</td>
                </tr>
              </table>
            </div>
          </div>
        `;
        break;

      default:
        subject = "Phere Notification";
        html = `<p>${data?.message || "You have a notification from Phere."}</p>`;
    }

    // Send via Resend
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Phere <onboarding@resend.dev>",
        to: [to],
        subject,
        html,
      }),
    });

    const result = await res.json();

    if (!res.ok) {
      return new Response(JSON.stringify({ error: result }), {
        status: res.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, id: result.id }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});
