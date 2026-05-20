import { supabase } from '@/lib/supabase'

function normalizeStorageErrorMessage(bucket: string, message?: string | null) {
  if (!message) {
    return `Unable to upload file to ${bucket}.`
  }

  const normalizedMessage = message.toLowerCase()

  if (normalizedMessage.includes('bucket') && (normalizedMessage.includes('not found') || normalizedMessage.includes('does not exist'))) {
    return `Storage bucket ${bucket} is not configured yet. Run docs/multi-company-schema.sql in Supabase and try again.`
  }

  if (normalizedMessage.includes('row-level security') || normalizedMessage.includes('permission')) {
    return `Storage access for ${bucket} is not configured yet. Run docs/multi-company-schema.sql in Supabase and try again.`
  }

  return message
}

async function uploadPublicAsset(bucket: string, filePath: string, file: File) {
  const { error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
    })

  if (error) {
    throw new Error(normalizeStorageErrorMessage(bucket, error.message))
  }

  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath)

  return data.publicUrl
}

function normalizeOwnerKey(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, '_')
}

export async function uploadVehiclePhoto(file: File) {
  const fileExt = file.name.split('.').pop()
  const fileName = `${crypto.randomUUID()}.${fileExt}`
  const filePath = `vehicles/${fileName}`

  return uploadPublicAsset('vehicle-photos', filePath, file)
}

export async function uploadDriverAvatar(file: File, ownerKey: string) {
  const fileExt = file.name.split('.').pop()
  const fileName = `${crypto.randomUUID()}.${fileExt}`
  const filePath = `${normalizeOwnerKey(ownerKey)}/avatars/${fileName}`

  return uploadPublicAsset('driver-documents', filePath, file)
}

export async function uploadDriverDocument(file: File, ownerKey: string, kind: 'licenses' | 'medical-cards' | 'signatures') {
  const fileExt = file.name.split('.').pop()
  const fileName = `${crypto.randomUUID()}.${fileExt}`
  const filePath = `${normalizeOwnerKey(ownerKey)}/${kind}/${fileName}`

  return uploadPublicAsset('driver-documents', filePath, file)
}