import { FastifyPluginAsync } from 'fastify'

import { sendDriverApprovalEmail, sendDriverInviteEmail } from '../lib/approval-email.js'
import { supabaseAdmin } from '../lib/supabase-admin.js'

type InviteBody = {
    redirectTo?: string
}

type StatusBody = {
    status?: 'active' | 'pending' | 'inactive'
}

type VehicleAttentionBody = {
    inspectionId?: string
}

type InviteMetadata = {
    driver_id?: string
    company_id?: string
    first_name?: string
    last_name?: string
    phone?: string | null
    role?: string
}

type AuthUser = {
    id: string
    email?: string | null
    user_metadata?: Record<string, unknown> | null
}

function bearerToken(header?: string) {
    const [type, token] = header?.split(' ') || []
    return type === 'Bearer' ? token : null
}

function splitName(name: string) {
    const parts = name.trim().split(/\s+/)
    const firstName = parts.shift() || ''
    const lastName = parts.join(' ')
    return { firstName, lastName }
}

function isAlreadyRegisteredInviteError(error: { message?: string } | null) {
    const message = error?.message?.toLowerCase() || ''

    return [
        'already been registered',
        'already registered',
        'already exists',
        'user already',
    ].some((pattern) => message.includes(pattern))
}

function driverInviteMetadata(driver: {
    id: string
    company_id: string
    name?: string | null
    phone?: string | null
}) {
    const { firstName, lastName } = splitName(driver.name || '')

    return {
        role: 'driver',
        driver_id: driver.id,
        company_id: driver.company_id,
        first_name: firstName,
        last_name: lastName,
        phone: driver.phone || null,
    }
}

async function findAuthUserByEmail(email: string) {
    const normalizedEmail = email.trim().toLowerCase()
    let page = 1
    const perPage = 1000

    while (true) {
        const { data, error } = await supabaseAdmin.auth.admin.listUsers({
            page,
            perPage,
        })

        if (error) {
            return { user: null, error }
        }

        const user = data.users.find(
            (candidate) => candidate.email?.trim().toLowerCase() === normalizedEmail
        )

        if (user) {
            return { user: user as AuthUser, error: null }
        }

        if (!data.nextPage || data.users.length < perPage) {
            return { user: null, error: null }
        }

        page = data.nextPage
    }
}

async function sendExistingUserInviteFallbackEmail(args: {
    email: string
    redirectTo?: string
    metadata: InviteMetadata
}) {
    const { error } = await supabaseAdmin.auth.signInWithOtp({
        email: args.email,
        options: {
            emailRedirectTo: args.redirectTo,
            shouldCreateUser: false,
            data: args.metadata,
        },
    })

    return error
}

function inviteFallbackResponse(args: {
    userId: string | null
    invitationSentAt: string
    resent: boolean
    inviteLink: string
}) {
    return {
        user_id: args.userId,
        status: 'pending',
        invitation_sent_at: args.invitationSentAt,
        resent: args.resent,
        inviteLink: args.inviteLink,
        message: 'Email delivery is unavailable. Share the invitation link manually.',
    }
}

const driverInvitationsRoute: FastifyPluginAsync = async (app) => {
    app.post<{ Params: { id: string }; Body: InviteBody }>(
        '/api/drivers/:id/invite',
        async (request, reply) => {
            const token = bearerToken(request.headers.authorization)

            if (!token) {
                return reply.code(401).send({ error: 'Missing access token' })
            }

            const { data: userData, error: userError } =
                await supabaseAdmin.auth.getUser(token)

            if (userError || !userData.user) {
                return reply.code(401).send({ error: 'Invalid access token' })
            }

            const { data: profile, error: profileError } = await supabaseAdmin
                .from('profiles')
                .select('id, role')
                .eq('auth_user_id', userData.user.id)
                .single()

            if (profileError || !profile || profile.role !== 'owner') {
                return reply.code(403).send({ error: 'Only owners can invite drivers' })
            }

            const { data: driver, error: driverError } = await supabaseAdmin
                .from('drivers')
                .select('id, company_id, name, email, phone, status, user_id, invitation_accepted_at')
                .eq('id', request.params.id)
                .single()

            if (driverError || !driver) {
                return reply.code(404).send({ error: 'Driver not found' })
            }

            const { data: ownerCompany, error: ownerCompanyError } =
                await supabaseAdmin
                    .from('company_owners')
                    .select('company_id')
                    .eq('profile_id', profile.id)
                    .eq('company_id', driver.company_id)
                    .maybeSingle()

            if (ownerCompanyError || !ownerCompany) {
                return reply.code(403).send({ error: 'Driver is outside your companies' })
            }

            if (!['new', 'pending'].includes(driver.status)) {
                return reply.code(409).send({ error: 'Only new or pending drivers can be invited' })
            }

            if (driver.invitation_accepted_at) {
                return reply.code(409).send({ error: 'Driver already accepted the invitation' })
            }

            const metadata = driverInviteMetadata(driver)
            let authUserId: string | null = null
            let resent = false
            let fallbackInviteLink: string | null = null

            const { data: inviteData, error: inviteError } =
                await supabaseAdmin.auth.admin.inviteUserByEmail(driver.email, {
                    redirectTo: request.body?.redirectTo,
                    data: metadata,
                })

            if (inviteError) {
                // Supabase may return "already registered" variants OR "email address is invalid"
                // when the user already exists. Always try to look up the user first; only fail
                // with the original error if the user genuinely doesn't exist in auth.
                const { user: existingUser, error: existingUserError } =
                    await findAuthUserByEmail(driver.email)

                if (!existingUser && !existingUserError) {
                    const { data: inviteLinkData, error: inviteLinkError } =
                        await supabaseAdmin.auth.admin.generateLink({
                            type: 'invite',
                            email: driver.email,
                            options: {
                                redirectTo: request.body?.redirectTo,
                                data: metadata,
                            },
                        })

                    if (inviteLinkError || !inviteLinkData?.properties?.action_link) {
                        return reply.code(400).send({ error: inviteError.message })
                    }

                    fallbackInviteLink = inviteLinkData.properties.action_link
                }

                if (existingUserError) {
                    request.log.error(
                        { err: existingUserError, originalInviteError: inviteError.message, driverId: driver.id, driverEmail: driver.email },
                        'Invite failed and existing auth user could not be looked up'
                    )
                    return reply.code(400).send({ error: inviteError.message })
                }

                resent = true

                if (existingUser) {
                    authUserId = existingUser.id

                    const { error: metadataError } =
                        await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
                            user_metadata: {
                                ...(existingUser.user_metadata || {}),
                                ...metadata,
                            },
                        })

                    if (metadataError) {
                        request.log.error(
                            { err: metadataError, driverId: driver.id, driverEmail: driver.email },
                            'Existing driver auth metadata could not be refreshed for invitation resend'
                        )

                        return reply.code(400).send({
                            error: 'Invitation metadata could not be refreshed for the existing user',
                        })
                    }
                } else {
                    request.log.warn(
                        { driverId: driver.id, driverEmail: driver.email },
                        'Invite resend detected existing auth email but the auth user was not returned by listUsers'
                    )
                }

                const { data: magicLinkData, error: magicLinkError } =
                    await supabaseAdmin.auth.admin.generateLink({
                        type: 'magiclink',
                        email: driver.email,
                        options: {
                            redirectTo: request.body?.redirectTo,
                            data: metadata,
                        },
                    })

                if (magicLinkError || !magicLinkData?.properties?.action_link) {
                    return reply.code(400).send({ error: magicLinkError?.message || 'Invitation link could not be generated' })
                }

                fallbackInviteLink = magicLinkData.properties.action_link

                try {
                    await sendDriverInviteEmail({
                        driverEmail: driver.email,
                        driverName: driver.name || 'Driver',
                        inviteLink: magicLinkData.properties.action_link,
                    })
                } catch (inviteEmailError) {
                    request.log.warn(
                        { err: inviteEmailError, driverId: driver.id, driverEmail: driver.email },
                        'Custom invite email failed, falling back to Supabase magic-link email'
                    )

                    const fallbackError = await sendExistingUserInviteFallbackEmail({
                        email: driver.email,
                        redirectTo: request.body?.redirectTo,
                        metadata,
                    })

                    if (fallbackError) {
                        request.log.error(
                            { err: fallbackError, originalErr: inviteEmailError, driverId: driver.id, driverEmail: driver.email },
                            'Existing driver invite email fallback could not be sent'
                        )
                    }
                }
            } else {
                authUserId = inviteData.user?.id || null
            }

            const invitationSentAt = new Date().toISOString()
            const { error: updateError } = await supabaseAdmin
                .from('drivers')
                .update({
                    status: 'pending',
                    invitation_sent_at: invitationSentAt,
                })
                .eq('id', driver.id)

            if (updateError) {
                return reply.code(400).send({ error: updateError.message })
            }

            if (fallbackInviteLink) {
                return inviteFallbackResponse({
                    userId: authUserId,
                    invitationSentAt,
                    resent,
                    inviteLink: fallbackInviteLink,
                })
            }

            return {
                user_id: authUserId,
                status: 'pending',
                invitation_sent_at: invitationSentAt,
                resent,
                message: resent
                    ? 'Invitation email was sent again.'
                    : 'Invitation email was sent.',
            }
        }
    )

    app.post<{ Params: { id: string }; Body: StatusBody }>(
        '/api/drivers/:id/status',
        async (request, reply) => {
            const token = bearerToken(request.headers.authorization)
            const status = request.body?.status

            if (!token) {
                return reply.code(401).send({ error: 'Missing access token' })
            }

            if (!status || !['active', 'pending', 'inactive'].includes(status)) {
                return reply.code(400).send({ error: 'Invalid driver status' })
            }

            const { data: userData, error: userError } =
                await supabaseAdmin.auth.getUser(token)

            if (userError || !userData.user) {
                return reply.code(401).send({ error: 'Invalid access token' })
            }

            const { data: profile, error: profileError } = await supabaseAdmin
                .from('profiles')
                .select('id, role')
                .eq('auth_user_id', userData.user.id)
                .single()

            if (profileError || !profile || profile.role !== 'owner') {
                return reply.code(403).send({ error: 'Only owners can update driver status' })
            }

            const { data: driver, error: driverError } = await supabaseAdmin
                .from('drivers')
                .select('id, company_id, email, name, status, user_id, invitation_accepted_at')
                .eq('id', request.params.id)
                .single()

            if (driverError || !driver) {
                return reply.code(404).send({ error: 'Driver not found' })
            }

            const { data: ownerCompany, error: ownerCompanyError } =
                await supabaseAdmin
                    .from('company_owners')
                    .select('company_id')
                    .eq('profile_id', profile.id)
                    .eq('company_id', driver.company_id)
                    .maybeSingle()

            if (ownerCompanyError || !ownerCompany) {
                return reply.code(403).send({ error: 'Driver is outside your companies' })
            }

            if (status === 'active' && !driver.invitation_accepted_at) {
                return reply
                    .code(409)
                    .send({ error: 'Driver invitation must be accepted before activation' })
            }

            const { error: updateDriverError } = await supabaseAdmin
                .from('drivers')
                .update({ status })
                .eq('id', driver.id)

            if (updateDriverError) {
                return reply.code(400).send({ error: updateDriverError.message })
            }

            const profileStatusQuery = supabaseAdmin
                .from('profiles')
                .update({ status })
                .eq('company_id', driver.company_id)
                .eq('role', 'driver')

            const { error: updateProfileError } = driver.user_id
                ? await profileStatusQuery.eq('id', driver.user_id)
                : await profileStatusQuery.eq('email', driver.email)

            if (updateProfileError) {
                return reply.code(400).send({ error: updateProfileError.message })
            }

            if (status === 'active' && driver.status !== 'active') {
                try {
                    await sendDriverApprovalEmail({
                        driverEmail: driver.email,
                        driverName: driver.name || 'Driver',
                    })
                } catch (emailError) {
                    request.log.error(
                        { err: emailError, driverId: driver.id, driverEmail: driver.email },
                        'Driver activated but approval email was not sent'
                    )
                }
            }

            return { status }
        }
    )

    app.post('/api/drivers/password-completed', async (request, reply) => {
        const token = bearerToken(request.headers.authorization)

        if (!token) {
            return reply.code(401).send({ error: 'Missing access token' })
        }

        const { data: userData, error: userError } =
            await supabaseAdmin.auth.getUser(token)

        if (userError || !userData.user) {
            return reply.code(401).send({ error: 'Invalid access token' })
        }

        const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('id, company_id, role, email')
            .eq('auth_user_id', userData.user.id)
            .single()

        if (profileError || !profile) {
            return reply.code(404).send({ error: 'Driver profile not found' })
        }

        if (profile.role !== 'driver') {
            return { updated: false }
        }

        const { error: updateProfileError } = await supabaseAdmin
            .from('profiles')
            .update({ status: 'active' })
            .eq('id', profile.id)

        if (updateProfileError) {
            return reply.code(400).send({ error: updateProfileError.message })
        }

        const { data: linkedDrivers, error: linkedDriverError } = await supabaseAdmin
            .from('drivers')
            .update({ status: 'active' })
            .eq('company_id', profile.company_id)
            .eq('user_id', profile.id)
            .select('id')

        if (linkedDriverError) {
            return reply.code(400).send({ error: linkedDriverError.message })
        }

        if (!linkedDrivers?.length && profile.email) {
            const { error: emailDriverError } = await supabaseAdmin
                .from('drivers')
                .update({ status: 'active' })
                .eq('company_id', profile.company_id)
                .eq('email', profile.email)

            if (emailDriverError) {
                return reply.code(400).send({ error: emailDriverError.message })
            }
        }

        return { updated: true }
    })

    app.post<{ Params: { id: string }; Body: VehicleAttentionBody }>(
        '/api/driver/vehicles/:id/needs-attention',
        async (request, reply) => {
            const token = bearerToken(request.headers.authorization)
            const inspectionId = request.body?.inspectionId

            if (!token) {
                return reply.code(401).send({ error: 'Missing access token' })
            }

            if (!inspectionId) {
                return reply.code(400).send({ error: 'Inspection ID is required' })
            }

            const { data: userData, error: userError } =
                await supabaseAdmin.auth.getUser(token)

            if (userError || !userData.user) {
                return reply.code(401).send({ error: 'Invalid access token' })
            }

            const { data: profile, error: profileError } = await supabaseAdmin
                .from('profiles')
                .select('id, role')
                .eq('auth_user_id', userData.user.id)
                .single()

            if (profileError || !profile || profile.role !== 'driver') {
                return reply.code(403).send({ error: 'Only drivers can report vehicle attention from inspections' })
            }

            const { data: driver, error: driverError } = await supabaseAdmin
                .from('drivers')
                .select('id, company_id, status, user_id')
                .eq('user_id', profile.id)
                .eq('status', 'active')
                .maybeSingle()

            if (driverError || !driver) {
                return reply.code(403).send({ error: 'Active driver profile was not found' })
            }

            const { data: inspection, error: inspectionError } = await supabaseAdmin
                .from('inspections')
                .select('id, company_id, vehicle_id, driver_id, status')
                .eq('id', inspectionId)
                .eq('vehicle_id', request.params.id)
                .eq('driver_id', driver.id)
                .eq('company_id', driver.company_id)
                .eq('status', 'submitted')
                .maybeSingle()

            if (inspectionError || !inspection) {
                return reply.code(403).send({
                    error: 'Submitted inspection was not found for this driver and vehicle',
                })
            }

            const { count, error: failedResultError } = await supabaseAdmin
                .from('inspection_results')
                .select('id', { count: 'exact', head: true })
                .eq('inspection_id', inspection.id)
                .eq('result', 'fail')

            if (failedResultError) {
                return reply.code(400).send({ error: failedResultError.message })
            }

            if (!count) {
                return reply.code(409).send({ error: 'Inspection does not have failed results' })
            }

            const { error: vehicleError } = await supabaseAdmin
                .from('vehicles')
                .update({ status: 'needs-attention' })
                .eq('id', request.params.id)
                .eq('company_id', driver.company_id)

            if (vehicleError) {
                return reply.code(400).send({ error: vehicleError.message })
            }

            return { status: 'needs-attention' }
        }
    )

    app.get<{ Params: { id: string } }>(
        '/api/drivers/:id/password-status',
        async (request, reply) => {
            const token = bearerToken(request.headers.authorization)

            if (!token) {
                return reply.code(401).send({ error: 'Missing access token' })
            }

            const { data: userData, error: userError } =
                await supabaseAdmin.auth.getUser(token)

            if (userError || !userData.user) {
                return reply.code(401).send({ error: 'Invalid access token' })
            }

            const { data: ownerProfile, error: profileError } = await supabaseAdmin
                .from('profiles')
                .select('id, role')
                .eq('auth_user_id', userData.user.id)
                .single()

            if (profileError || !ownerProfile || ownerProfile.role !== 'owner') {
                return reply.code(403).send({ error: 'Only owners can view driver password status' })
            }

            const { data: driver, error: driverError } = await supabaseAdmin
                .from('drivers')
                .select('id, company_id, email, user_id')
                .eq('id', request.params.id)
                .single()

            if (driverError || !driver) {
                return reply.code(404).send({ error: 'Driver not found' })
            }

            const { data: ownerCompany, error: ownerCompanyError } =
                await supabaseAdmin
                    .from('company_owners')
                    .select('company_id')
                    .eq('profile_id', ownerProfile.id)
                    .eq('company_id', driver.company_id)
                    .maybeSingle()

            if (ownerCompanyError || !ownerCompany) {
                return reply.code(403).send({ error: 'Driver is outside your companies' })
            }

            const passwordStatusQuery = supabaseAdmin
                .from('profiles')
                .select('auth_user_id, password_set_at')
                .eq('company_id', driver.company_id)
                .eq('role', 'driver')

            let { data: driverProfile, error: driverProfileError } = driver.user_id
                ? await passwordStatusQuery.eq('id', driver.user_id).maybeSingle()
                : await passwordStatusQuery.eq('email', driver.email).maybeSingle()

            if (isMissingPasswordSetAtColumn(driverProfileError)) {
                const fallbackProfileQuery = supabaseAdmin
                    .from('profiles')
                    .select('auth_user_id')
                    .eq('company_id', driver.company_id)
                    .eq('role', 'driver')

                const fallbackProfileResult = driver.user_id
                    ? await fallbackProfileQuery.eq('id', driver.user_id).maybeSingle()
                    : await fallbackProfileQuery.eq('email', driver.email).maybeSingle()

                driverProfile = fallbackProfileResult.data
                    ? {
                        ...fallbackProfileResult.data,
                        password_set_at: null,
                    }
                    : null
                driverProfileError = fallbackProfileResult.error
            }

            if (driverProfileError) {
                return reply.code(400).send({ error: driverProfileError.message })
            }

            let passwordSetAt = driverProfile?.password_set_at || null

            if (!passwordSetAt && driverProfile?.auth_user_id) {
                const { data: authUserData, error: authUserError } =
                    await supabaseAdmin.auth.admin.getUserById(driverProfile.auth_user_id)

                if (authUserError) {
                    request.log.error(
                        { err: authUserError, driverId: driver.id },
                        'Driver auth password metadata could not be read'
                    )
                } else {
                    passwordSetAt =
                        authUserData.user?.user_metadata?.password_set_at || null
                }
            }

            return { password_set_at: passwordSetAt }
        }
    )

    app.post('/api/drivers/accept-invite', async (request, reply) => {
        const token = bearerToken(request.headers.authorization)

        if (!token) {
            return reply.code(401).send({ error: 'Missing access token' })
        }

        const { data: userData, error: userError } =
            await supabaseAdmin.auth.getUser(token)

        if (userError || !userData.user) {
            return reply.code(401).send({ error: 'Invalid access token' })
        }

        const user = userData.user
        const metadata = user.user_metadata as InviteMetadata

        if (
            metadata.role !== 'driver' ||
            !metadata.driver_id ||
            !metadata.company_id
        ) {
            return { accepted: false }
        }

        const { data: driver, error: driverError } = await supabaseAdmin
            .from('drivers')
            .select('id, company_id, email, name, phone, avatar_url, status, user_id, invitation_accepted_at')
            .eq('id', metadata.driver_id)
            .eq('company_id', metadata.company_id)
            .single()

        if (
            driverError ||
            !driver ||
            driver.email.toLowerCase() !== user.email?.toLowerCase()
        ) {
            return reply.code(403).send({ error: 'Invitation does not match a driver' })
        }

        const { data: existingProfile, error: existingProfileError } =
            await supabaseAdmin
                .from('profiles')
                .select('id, company_id, role, status, avatar_url')
                .eq('auth_user_id', user.id)
                .maybeSingle()

        if (existingProfileError) {
            return reply.code(400).send({ error: existingProfileError.message })
        }

        const fallbackName = splitName(driver.name || '')

        const pendingProfile = {
            company_id: driver.company_id,
            role: 'driver',
            first_name: metadata.first_name || fallbackName.firstName,
            last_name: metadata.last_name || fallbackName.lastName,
            email: driver.email,
            phone: driver.phone || null,
            avatar_url: driver.avatar_url || null,
            status: 'pending',
        }

        let driverProfileId: string

        if (existingProfile) {
            if (
                existingProfile.role !== 'driver' ||
                existingProfile.company_id !== driver.company_id
            ) {
                return reply.code(409).send({
                    error: 'User already has a profile outside this driver invitation',
                })
            }

            if (driver.user_id && driver.user_id !== existingProfile.id) {
                return reply.code(409).send({ error: 'Driver is linked to another profile' })
            }

            if (
                driver.invitation_accepted_at &&
                (driver.user_id === existingProfile.id || !driver.user_id)
            ) {
                if (!existingProfile.avatar_url && driver.avatar_url) {
                    const { error: avatarError } = await supabaseAdmin
                        .from('profiles')
                        .update({ avatar_url: driver.avatar_url })
                        .eq('id', existingProfile.id)

                    if (avatarError) {
                        return reply.code(400).send({ error: avatarError.message })
                    }
                }

                if (!driver.user_id) {
                    const { error: linkError } = await supabaseAdmin
                        .from('drivers')
                        .update({ user_id: existingProfile.id })
                        .eq('id', driver.id)

                    if (linkError) {
                        if (linkError.code === '23503') {
                            request.log.warn(
                                { err: linkError, driverId: driver.id },
                                'Driver profile link skipped until drivers user FK migration is applied'
                            )

                            return { accepted: true, driver_id: driver.id }
                        }

                        return reply.code(400).send({ error: linkError.message })
                    }
                }

                return { accepted: true, driver_id: driver.id }
            }

            const { error: profileError } = await supabaseAdmin
                .from('profiles')
                .update(pendingProfile)
                .eq('id', existingProfile.id)

            if (profileError) {
                return reply.code(400).send({ error: profileError.message })
            }

            driverProfileId = existingProfile.id
        } else {
            if (driver.user_id) {
                return reply.code(409).send({ error: 'Driver is linked to another profile' })
            }

            const { data: createdProfile, error: profileError } = await supabaseAdmin
                .from('profiles')
                .insert({
                    auth_user_id: user.id,
                    ...pendingProfile,
                })
                .select('id')
                .single()

            if (profileError || !createdProfile) {
                return reply.code(400).send({
                    error: profileError?.message || 'Driver profile could not be created',
                })
            }

            driverProfileId = createdProfile.id
        }

        const invitationAcceptedAt = new Date().toISOString()
        const { error: updateError } = await supabaseAdmin
            .from('drivers')
            .update({
                user_id: driverProfileId,
                status: 'pending',
                invitation_accepted_at: invitationAcceptedAt,
            })
            .eq('id', driver.id)

        if (updateError) {
            if (updateError.code !== '23503') {
                return reply.code(400).send({ error: updateError.message })
            }

            const { error: acceptedAtError } = await supabaseAdmin
                .from('drivers')
                .update({
                    status: 'pending',
                    invitation_accepted_at: invitationAcceptedAt,
                })
                .eq('id', driver.id)

            if (acceptedAtError) {
                return reply.code(400).send({ error: acceptedAtError.message })
            }
        }

        return { accepted: true, driver_id: driver.id }
    })
}

function isMissingPasswordSetAtColumn(error: { code?: string; message?: string } | null) {
    return (
        error?.code === 'PGRST204' ||
        !!error?.message?.includes('password_set_at') ||
        !!error?.message?.includes('schema cache')
    )
}

export default driverInvitationsRoute
