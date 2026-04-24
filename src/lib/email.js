/**
 * Email service — calls the Supabase Edge Function to send emails via Resend
 */
import { supabase } from './supabase';

const EDGE_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-email`;

async function callEmailFunction(payload) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.warn('[Email] No session, skipping email');
      return { success: false, error: 'No session' };
    }

    const res = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify(payload)
    });

    const result = await res.json();
    if (!res.ok) throw new Error(JSON.stringify(result.error));
    return { success: true, id: result.id };
  } catch (e) {
    console.warn('[Email] Send failed:', e.message);
    return { success: false, error: e.message };
  }
}

/**
 * Send welcome email after signup
 */
export async function sendWelcomeEmail(email, name) {
  return callEmailFunction({
    type: 'welcome',
    to: email,
    data: { name }
  });
}

/**
 * Send payment reminder email
 */
export async function sendPaymentReminder(email, expense) {
  return callEmailFunction({
    type: 'reminder',
    to: email,
    data: {
      description: expense.description,
      amount: expense.amount,
      vendor: expense.vendor,
      dueDate: expense.dueDate
    }
  });
}
