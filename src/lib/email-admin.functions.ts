import { createServerFn } from '@tanstack/react-start'
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware'

async function assertOwnerOrAdmin(supabase: any, userId: string) {
  const { data: isOwner } = await supabase.rpc('has_role', { _user_id: userId, _role: 'owner' })
  if (isOwner) return
  const { data: isAdmin } = await supabase.rpc('has_role', { _user_id: userId, _role: 'admin' })
  if (!isAdmin) throw new Error('Forbidden')
}

export const listEmailLogFn = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { limit?: number; status?: string | null; template?: string | null }) => input)
  .handler(async ({ data, context }) => {
    await assertOwnerOrAdmin(context.supabase, context.userId)
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')

    // Pull recent rows then dedupe in JS by message_id (latest per id)
    const limit = Math.min(Math.max(data.limit ?? 100, 1), 500)
    let q = supabaseAdmin
      .from('email_send_log')
      .select('id, message_id, template_name, recipient_email, status, error_message, created_at, metadata')
      .order('created_at', { ascending: false })
      .limit(limit * 3)
    if (data.template) q = q.eq('template_name', data.template)
    const { data: rows, error } = await q
    if (error) throw new Error(error.message)

    const seen = new Set<string>()
    const dedup: any[] = []
    for (const r of rows ?? []) {
      const key = r.message_id || `__${r.id}`
      if (seen.has(key)) continue
      seen.add(key)
      if (data.status && r.status !== data.status) continue
      dedup.push(r)
      if (dedup.length >= limit) break
    }

    // Stats over the dedup window
    const stats = { sent: 0, dlq: 0, failed: 0, pending: 0, suppressed: 0, bounced: 0, complained: 0, total: 0 }
    for (const r of dedup) {
      stats.total++
      ;(stats as any)[r.status] = ((stats as any)[r.status] ?? 0) + 1
    }
    return { rows: dedup, stats }
  })

export const sendTestEmailFn = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { recipientEmail: string }) => input)
  .handler(async ({ data, context }) => {
    await assertOwnerOrAdmin(context.supabase, context.userId)
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')

    const messageId = `test-verification-${crypto.randomUUID()}`
    const payload = {
      template_name: 'test-verification',
      recipient_email: data.recipientEmail,
      idempotency_key: messageId,
      message_id: messageId,
      template_data: {
        recipient: data.recipientEmail,
        triggeredAt: new Date().toISOString(),
      },
    }

    const { error } = await supabaseAdmin.rpc('enqueue_email', {
      queue_name: 'transactional_emails',
      payload,
    })
    if (error) throw new Error(error.message)

    await supabaseAdmin.from('email_send_log').insert({
      message_id: messageId,
      template_name: 'test-verification',
      recipient_email: data.recipientEmail,
      status: 'pending',
    })

    return { ok: true, messageId }
  })

export const retryDlqFn = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { queue?: 'transactional_emails' | 'auth_emails'; max?: number }) => input)
  .handler(async ({ data, context }) => {
    await assertOwnerOrAdmin(context.supabase, context.userId)
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')

    const baseQueue = data.queue ?? 'transactional_emails'
    const dlq = `${baseQueue}_dlq`
    const max = Math.min(Math.max(data.max ?? 10, 1), 50)

    const { data: messages, error } = await supabaseAdmin.rpc('read_email_batch', {
      queue_name: dlq,
      batch_size: max,
      vt: 30,
    })
    if (error) throw new Error(error.message)

    let requeued = 0
    for (const m of (messages ?? []) as Array<{ msg_id: number; message: any }>) {
      const { error: enqErr } = await supabaseAdmin.rpc('enqueue_email', {
        queue_name: baseQueue,
        payload: m.message,
      })
      if (enqErr) continue
      await supabaseAdmin.rpc('delete_email', { queue_name: dlq, message_id: m.msg_id })
      requeued++
    }
    return { requeued, scanned: messages?.length ?? 0 }
  })
