import { FastifyPluginAsync } from 'fastify'

import { supabaseAdmin } from '../lib/supabase-admin.js'

type RegisterCompanyBody = {
    company?: {
        name?: string
        country?: string
        state?: string
        city?: string
        address?: string
        phone?: string
        industry?: string
    }
    owner?: {
        first_name?: string
        last_name?: string
        email?: string
        phone?: string
        password?: string
    }
}

const companyRegistrationRoute: FastifyPluginAsync = async (app) => {
    app.post<{ Body: RegisterCompanyBody }>('/api/register/company', async (request, reply) => {
        const company = request.body?.company
        const owner = request.body?.owner

        if (!company?.name?.trim()) {
            return reply.code(400).send({ error: 'Company name is required' })
        }

        if (!owner?.email?.trim() || !owner?.password || owner.password.length < 8) {
            return reply.code(400).send({ error: 'Valid owner credentials are required' })
        }

        if (!owner?.first_name?.trim() || !owner?.last_name?.trim()) {
            return reply.code(400).send({ error: 'Owner first and last name are required' })
        }

        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: owner.email.trim(),
            password: owner.password,
            email_confirm: true,
            user_metadata: {
                first_name: owner.first_name.trim(),
                last_name: owner.last_name.trim(),
                phone: owner.phone || null,
                role: 'owner',
            },
        })

        if (authError || !authUser.user) {
            return reply.code(400).send({ error: authError?.message || 'Owner account could not be created' })
        }

        const createdAuthUserId = authUser.user.id

        const { data: companyRow, error: companyError } = await supabaseAdmin
            .from('companies')
            .insert({
                name: company.name.trim(),
                country: company.country || null,
                state: company.state || null,
                city: company.city || null,
                address: company.address || null,
                phone: company.phone || null,
                industry: company.industry || null,
            })
            .select('id, name')
            .single()

        if (companyError || !companyRow) {
            await supabaseAdmin.auth.admin.deleteUser(createdAuthUserId)
            return reply.code(400).send({ error: companyError?.message || 'Company could not be created' })
        }

        const { data: profileRow, error: profileError } = await supabaseAdmin
            .from('profiles')
            .insert({
                auth_user_id: createdAuthUserId,
                company_id: companyRow.id,
                role: 'owner',
                first_name: owner.first_name.trim(),
                last_name: owner.last_name.trim(),
                email: owner.email.trim(),
                phone: owner.phone || null,
                status: 'active',
            })
            .select('id')
            .single()

        if (profileError || !profileRow) {
            await supabaseAdmin.from('companies').delete().eq('id', companyRow.id)
            await supabaseAdmin.auth.admin.deleteUser(createdAuthUserId)
            return reply.code(400).send({ error: profileError?.message || 'Owner profile could not be created' })
        }

        const { error: ownerLinkError } = await supabaseAdmin
            .from('company_owners')
            .insert({
                company_id: companyRow.id,
                profile_id: profileRow.id,
            })

        if (ownerLinkError) {
            await supabaseAdmin.from('profiles').delete().eq('id', profileRow.id)
            await supabaseAdmin.from('companies').delete().eq('id', companyRow.id)
            await supabaseAdmin.auth.admin.deleteUser(createdAuthUserId)
            return reply.code(400).send({ error: ownerLinkError.message })
        }

        return reply.code(201).send({
            company_id: companyRow.id,
            company_name: companyRow.name,
            user_id: createdAuthUserId,
        })
    })
}

export default companyRegistrationRoute