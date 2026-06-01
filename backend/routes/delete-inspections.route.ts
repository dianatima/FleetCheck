import { FastifyPluginAsync } from 'fastify'
import { supabaseAdmin } from '../lib/supabase-admin.js'

const deleteInspectionsRoute: FastifyPluginAsync = async (app) => {
  // Безпечне видалення звітів з підтвердженням пароля
  app.post('/api/admin/delete-inspections', async (request, reply) => {
    const { inspectionIds, adminEmail, adminPassword } = request.body as {
      inspectionIds: string[]
      adminEmail: string
      adminPassword: string
    }

    if (!inspectionIds?.length || !adminEmail || !adminPassword) {
      return reply.code(400).send({ error: 'Missing required fields' })
    }

    // Перевірка email/пароля та ролі через реальний sign-in
    const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
      email: adminEmail,
      password: adminPassword,
    })
    if (authError) {
      return reply.code(403).send({ error: 'Invalid password' })
    }

    const roleFromUserMetadata = String(authData?.user?.user_metadata?.role || '').toLowerCase()
    const roleFromAppMetadata = String(authData?.user?.app_metadata?.role || '').toLowerCase()

    let resolvedRole = roleFromUserMetadata || roleFromAppMetadata
    if (!resolvedRole && authData?.user?.id) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('id', authData.user.id)
        .single()

      resolvedRole = String((profile as any)?.role || '').toLowerCase()
    }

    if (!['owner', 'admin', 'manager'].includes(resolvedRole)) {
      return reply.code(403).send({ error: 'Not enough permissions' })
    }

    // Видалення inspection та всіх пов’язаних даних (каскадно)
    // (inspection_results, inspection_photo_verifications, issues, etc)
    for (const inspectionId of inspectionIds) {
      const photoDelete = await supabaseAdmin.from('inspection_photo_verifications').delete().eq('inspection_id', inspectionId)
      if (photoDelete.error) return reply.code(500).send({ error: photoDelete.error.message })

      const resultsDelete = await supabaseAdmin.from('inspection_results').delete().eq('inspection_id', inspectionId)
      if (resultsDelete.error) return reply.code(500).send({ error: resultsDelete.error.message })

      const issuesDelete = await supabaseAdmin.from('issues').delete().eq('inspection_id', inspectionId)
      if (issuesDelete.error) return reply.code(500).send({ error: issuesDelete.error.message })

      const inspectionDelete = await supabaseAdmin.from('inspections').delete().eq('id', inspectionId)
      if (inspectionDelete.error) return reply.code(500).send({ error: inspectionDelete.error.message })
    }

    // (Опційно) Логування видалення
    // await supabaseAdmin.from('deletion_audit_log').insert({ ... })

    return { success: true, deleted: inspectionIds.length }
  })
}

export default deleteInspectionsRoute
