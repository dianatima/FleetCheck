type ApprovalEmail = {
    driverEmail: string
    driverName: string
}

type DriverInviteEmail = {
    driverEmail: string
    driverName: string
    inviteLink: string
}

function resendConfig() {
    const apiKey = process.env.RESEND_API_KEY
    const from = process.env.APPROVAL_EMAIL_FROM

    if (!apiKey || !from) {
        throw new Error('RESEND_API_KEY and APPROVAL_EMAIL_FROM are required')
    }

    return { apiKey, from }
}

function approvalBody(driverName: string) {
    const loginUrl =
        process.env.APP_LOGIN_URL ||
        (process.env.APP_URL ? `${process.env.APP_URL}/login` : null)

    if (!loginUrl) {
        throw new Error('APP_LOGIN_URL or APP_URL is required for approval email')
    }

    return `Hello ${driverName},

Your FleetCheck driver account has been approved. You can now sign in and access your driver workspace.

Sign in here: ${loginUrl}

Best regards,
FleetCheck Team`
}

export async function sendDriverApprovalEmail({
    driverEmail,
    driverName,
}: ApprovalEmail) {
    const { apiKey, from } = resendConfig()

    const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            from,
            to: [driverEmail],
            subject: 'Your FleetCheck account has been approved',
            text: approvalBody(driverName),
        }),
    })

    if (!response.ok) {
        const details = await response.text()
        throw new Error(`Resend approval email failed (${response.status}): ${details}`)
    }
}

export async function sendDriverInviteEmail({
    driverEmail,
    driverName,
    inviteLink,
}: DriverInviteEmail) {
    const { apiKey, from } = resendConfig()

    const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            from,
            to: [driverEmail],
            subject: 'Complete your FleetCheck driver invitation',
            text: `Hello ${driverName},

You have been invited to join FleetCheck as a driver.

Open this link to accept your invitation and continue setup:
${inviteLink}

If you did not expect this email, you can ignore it.

Best regards,
FleetCheck Team`,
        }),
    })

    if (!response.ok) {
        const details = await response.text()
        throw new Error(`Resend invite email failed (${response.status}): ${details}`)
    }
}
