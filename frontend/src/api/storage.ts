import { supabase } from '@/lib/supabase'

export async function uploadVehiclePhoto(file: File) {
  const fileExt = file.name.split('.').pop()
  const fileName = `${crypto.randomUUID()}.${fileExt}`
  const filePath = `vehicles/${fileName}`

  const { error } = await supabase.storage
    .from('vehicle-photos')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (error) {
    throw error
  }

  const { data } = supabase.storage
    .from('vehicle-photos')
    .getPublicUrl(filePath)

  return data.publicUrl
}

export async function uploadTemplateReferencePhoto(file: File) {
  const fileExt = file.name.split('.').pop()
  const fileName = `${crypto.randomUUID()}.${fileExt}`
  const filePath = `template-reference/${fileName}`

  const { error } = await supabase.storage
    .from('vehicle-photos')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (error) {
    throw error
  }

  const { data } = supabase.storage
    .from('vehicle-photos')
    .getPublicUrl(filePath)

  return data.publicUrl
}