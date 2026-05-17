import { supabase } from '@/lib/supabase'

async function uploadPublicAsset(bucket: string, filePath: string, file: File) {
  const { error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
    })

  if (error) {
    throw error
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

export async function uploadDriverDocument(file: File, ownerKey: string, kind: 'licenses' | 'medical-cards') {
  const fileExt = file.name.split('.').pop()
  const fileName = `${crypto.randomUUID()}.${fileExt}`
  const filePath = `${normalizeOwnerKey(ownerKey)}/${kind}/${fileName}`

  return uploadPublicAsset('driver-documents', filePath, file)
}