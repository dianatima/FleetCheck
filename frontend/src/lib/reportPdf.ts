import { supabase } from '@/lib/supabase'
import { formatDateTime } from '@/lib/dateFormat'

type ReportResult = 'Pass' | 'Fail' | 'Draft'
type PdfImage = {
  name: string
  data: Uint8Array
  width: number
  height: number
}
type PdfPage = {
  ops: string[]
  images: Set<string>
}
type Color = [number, number, number]

const PAGE_WIDTH = 595
const PAGE_HEIGHT = 842
const MARGIN = 40
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2
const FOOTER_Y = 30

const colors = {
  blue: [37, 99, 235] as Color,
  blueLight: [239, 246, 255] as Color,
  green: [22, 163, 74] as Color,
  greenLight: [240, 253, 244] as Color,
  red: [220, 38, 38] as Color,
  redLight: [254, 242, 242] as Color,
  orange: [217, 119, 6] as Color,
  orangeLight: [255, 251, 235] as Color,
  gray900: [17, 24, 39] as Color,
  gray700: [55, 65, 81] as Color,
  gray500: [107, 114, 128] as Color,
  gray300: [209, 213, 219] as Color,
  gray100: [243, 244, 246] as Color,
  gray50: [249, 250, 251] as Color,
  white: [255, 255, 255] as Color,
}

function relation<T = any>(value: T | T[] | null | undefined): T | null {
  if (!value) return null
  return Array.isArray(value) ? value[0] || null : value
}

function relationArray<T = any>(value: T | T[] | null | undefined): T[] {
  if (!value) return []
  return Array.isArray(value) ? value : [value]
}

function text(value: unknown, fallback = '-'): string {
  if (value === null || value === undefined || value === '') return fallback
  return String(value)
}

function vehicleName(vehicle: any): string {
  return `${vehicle?.make || ''} ${vehicle?.model || ''}`.trim() || 'Vehicle'
}

function resultLabel(result: string | null): string {
  if (result === 'pass') return 'Pass'
  if (result === 'fail') return 'Fail'
  if (result === 'not_applicable') return 'N/A'
  return 'Not answered'
}

function severityLabel(severity: string | null): string {
  if (severity === 'low') return 'Low'
  if (severity === 'high') return 'High'
  return 'Medium'
}

function reportResult(status: string, results: any[]): ReportResult {
  if (status === 'draft') return 'Draft'
  return results.some((row) => row.result === 'fail') ? 'Fail' : 'Pass'
}

function reviewStatus(issues: any[]): string {
  if (!issues.length) return 'No review required'
  if (issues.some((issue) => issue.status === 'under-review')) return 'Under Review'
  if (issues.some((issue) => issue.status === 'in-repair')) return 'In Repair'
  if (issues.every((issue) => issue.status === 'fixed')) return 'Fixed'
  if (issues.every((issue) => issue.status === 'rejected')) return 'Rejected'
  return issues.map((issue) => issue.status).filter(Boolean).join(', ') || '-'
}

function badgeColors(label: string): { fill: Color; text: Color } {
  const normalized = label.toLowerCase()
  if (['pass', 'fixed', 'completed', 'active'].includes(normalized)) {
    return { fill: colors.greenLight, text: colors.green }
  }
  if (['fail', 'failed', 'blocked', 'rejected'].includes(normalized)) {
    return { fill: colors.redLight, text: colors.red }
  }
  if (['under review', 'in repair', 'needs review', 'draft'].includes(normalized)) {
    return { fill: colors.orangeLight, text: colors.orange }
  }
  return { fill: colors.gray100, text: colors.gray700 }
}

function fileSafe(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function rgb(color: Color) {
  return color.map((part) => (part / 255).toFixed(3)).join(' ')
}

function pdfTextHex(value: string): string {
  const bytes = [0xfe, 0xff]
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index)
    bytes.push((code >> 8) & 0xff, code & 0xff)
  }
  return `<${bytes.map((byte) => byte.toString(16).padStart(2, '0')).join('')}>`
}

function estimateWidth(value: string, fontSize: number) {
  return value.length * fontSize * 0.48
}

function wrapText(value: string, maxWidth: number, fontSize: number): string[] {
  const words = text(value, '').split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let current = ''

  for (const word of words) {
    const next = current ? `${current} ${word}` : word
    if (estimateWidth(next, fontSize) > maxWidth && current) {
      lines.push(current)
      current = word
    } else {
      current = next
    }
  }

  if (current) lines.push(current)
  return lines.length ? lines : ['']
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }
  return bytes
}

async function loadImage(url: string | null | undefined, name: string): Promise<PdfImage | null> {
  if (!url) return null

  return new Promise((resolve) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => {
      try {
        const maxSide = 420
        const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight))
        const canvas = document.createElement('canvas')
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale))
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))
        const context = canvas.getContext('2d')

        if (!context) {
          resolve(null)
          return
        }

        context.fillStyle = '#ffffff'
        context.fillRect(0, 0, canvas.width, canvas.height)
        context.drawImage(image, 0, 0, canvas.width, canvas.height)

        const dataUrl = canvas.toDataURL('image/jpeg', 0.82)
        resolve({
          name,
          data: base64ToBytes(dataUrl.split(',')[1] || ''),
          width: canvas.width,
          height: canvas.height,
        })
      } catch {
        resolve(null)
      }
    }
    image.onerror = () => resolve(null)
    image.src = url
  })
}

function encode(value: string) {
  return new TextEncoder().encode(value)
}

function concatBytes(parts: Uint8Array[]) {
  const length = parts.reduce((total, part) => total + part.length, 0)
  const result = new Uint8Array(length)
  let offset = 0
  for (const part of parts) {
    result.set(part, offset)
    offset += part.length
  }
  return result
}

class ReportPdf {
  pages: PdfPage[] = []
  images = new Map<string, PdfImage>()
  y = 0
  generatedAt: string

  constructor(generatedAt: string) {
    this.generatedAt = generatedAt
    this.addPage()
  }

  get page() {
    return this.pages[this.pages.length - 1]
  }

  addPage() {
    this.pages.push({ ops: [], images: new Set() })
    this.y = PAGE_HEIGHT - MARGIN
  }

  ensure(height: number) {
    if (this.y - height < 70) this.addPage()
  }

  op(value: string) {
    this.page.ops.push(value)
  }

  rect(x: number, y: number, width: number, height: number, fill: Color, stroke?: Color) {
    this.op('q')
    this.op(`${rgb(fill)} rg`)
    if (stroke) this.op(`${rgb(stroke)} RG 0.7 w`)
    this.op(`${x} ${y} ${width} ${height} re ${stroke ? 'B' : 'f'}`)
    this.op('Q')
  }

  line(x1: number, y1: number, x2: number, y2: number, color: Color = colors.gray300) {
    this.op(`q ${rgb(color)} RG 0.6 w ${x1} ${y1} m ${x2} ${y2} l S Q`)
  }

  text(value: string, x: number, y: number, options: {
    size?: number
    color?: Color
    bold?: boolean
    maxWidth?: number
  } = {}) {
    const size = options.size || 10
    const color = options.color || colors.gray900
    const font = options.bold ? 'F2' : 'F1'
    const lines = options.maxWidth ? wrapText(value, options.maxWidth, size) : [value]

    lines.forEach((line, index) => {
      this.op(`BT /${font} ${size} Tf ${rgb(color)} rg ${x} ${y - index * (size + 3)} Td ${pdfTextHex(line)} Tj ET`)
    })

    return lines.length * (size + 3)
  }

  badge(label: string, x: number, y: number) {
    const { fill, text: textColor } = badgeColors(label)
    const width = Math.max(44, estimateWidth(label, 9) + 18)
    this.rect(x, y - 13, width, 18, fill)
    this.text(label, x + 9, y - 8, { size: 9, color: textColor, bold: true })
    return width
  }

  drawImage(image: PdfImage | null, x: number, y: number, width: number, height: number) {
    if (!image) {
      this.rect(x, y, width, height, colors.gray100, colors.gray300)
      this.text('No photo', x + width / 2 - 18, y + height / 2 - 3, { size: 8, color: colors.gray500 })
      return
    }

    this.images.set(image.name, image)
    this.page.images.add(image.name)
    this.op(`q ${width} 0 0 ${height} ${x} ${y} cm /${image.name} Do Q`)
  }

  footer() {
    this.pages.forEach((page, index) => {
      page.ops.push(`q ${rgb(colors.gray300)} RG 0.5 w ${MARGIN} 50 m ${PAGE_WIDTH - MARGIN} 50 l S Q`)
      page.ops.push(`BT /F1 8 Tf ${rgb(colors.gray500)} rg ${MARGIN} ${FOOTER_Y} Td ${pdfTextHex(`Generated by FleetCheck · ${this.generatedAt}`)} Tj ET`)
      page.ops.push(`BT /F1 8 Tf ${rgb(colors.gray500)} rg ${PAGE_WIDTH - MARGIN - 45} ${FOOTER_Y} Td ${pdfTextHex(`Page ${index + 1} / ${this.pages.length}`)} Tj ET`)
    })
  }

  blob() {
    this.footer()

    const objects: Uint8Array[] = []
    const pageIds = this.pages.map((_, index) => 5 + index * 2)
    const nextId = 5 + this.pages.length * 2
    const imageIds = new Map<string, number>()
    let imageId = nextId

    for (const image of this.images.values()) {
      imageIds.set(image.name, imageId)
      imageId += 1
    }

    objects[1] = encode('<< /Type /Catalog /Pages 2 0 R >>')
    objects[2] = encode(`<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${this.pages.length} >>`)
    objects[3] = encode('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>')
    objects[4] = encode('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>')

    this.pages.forEach((page, index) => {
      const pageId = 5 + index * 2
      const contentId = pageId + 1
      const content = page.ops.join('\n')
      const xObjects = [...page.images]
        .map((name) => `/${name} ${imageIds.get(name)} 0 R`)
        .join(' ')

      objects[pageId] = encode(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> /XObject << ${xObjects} >> >> /Contents ${contentId} 0 R >>`)
      objects[contentId] = encode(`<< /Length ${encode(content).length} >>\nstream\n${content}\nendstream`)
    })

    for (const image of this.images.values()) {
      const id = imageIds.get(image.name)
      if (!id) continue
      objects[id] = concatBytes([
        encode(`<< /Type /XObject /Subtype /Image /Width ${image.width} /Height ${image.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${image.data.length} >>\nstream\n`),
        image.data,
        encode('\nendstream'),
      ])
    }

    const chunks: Uint8Array[] = [encode('%PDF-1.4\n')]
    const offsets: number[] = [0]
    let offset = chunks[0].length

    for (let id = 1; id < objects.length; id += 1) {
      if (!objects[id]) continue
      const prefix = encode(`${id} 0 obj\n`)
      const suffix = encode('\nendobj\n')
      offsets[id] = offset
      chunks.push(prefix, objects[id], suffix)
      offset += prefix.length + objects[id].length + suffix.length
    }

    const xrefOffset = offset
    let xref = `xref\n0 ${objects.length}\n0000000000 65535 f \n`
    for (let id = 1; id < objects.length; id += 1) {
      xref += `${String(offsets[id] || 0).padStart(10, '0')} 00000 n \n`
    }
    xref += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`
    chunks.push(encode(xref))

    return new Blob([concatBytes(chunks)], { type: 'application/pdf' })
  }
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

function drawHeader(pdf: ReportPdf, inspection: any, generatedAt: string) {
  pdf.text('FleetCheck', MARGIN, pdf.y, { size: 18, bold: true, color: colors.blue })
  pdf.text('PRO', MARGIN + 92, pdf.y - 1, { size: 8, bold: true, color: colors.blue })
  pdf.text('Inspection Report', MARGIN, pdf.y - 32, { size: 24, bold: true, color: colors.gray900 })
  pdf.text(`Report ID: ${inspection.id}`, MARGIN, pdf.y - 52, { size: 9, color: colors.gray500 })
  pdf.text(`Generated: ${generatedAt}`, PAGE_WIDTH - MARGIN - 190, pdf.y - 15, { size: 9, color: colors.gray500 })
  pdf.line(MARGIN, pdf.y - 72, PAGE_WIDTH - MARGIN, pdf.y - 72, colors.gray300)
  pdf.y -= 95
}

function drawVehicleSummary(
  pdf: ReportPdf,
  inspection: any,
  vehicle: any,
  driver: any,
  result: ReportResult,
  review: string,
  photo: PdfImage | null,
  language: string
) {
  pdf.ensure(150)
  const top = pdf.y
  const cardHeight = 138
  const y = top - cardHeight
  pdf.rect(MARGIN, y, CONTENT_WIDTH, cardHeight, colors.gray50, colors.gray300)
  pdf.rect(MARGIN, y + cardHeight - 4, CONTENT_WIDTH, 4, colors.blue)
  pdf.drawImage(photo, MARGIN + 16, y + 24, 96, 78)

  const x = MARGIN + 130
  pdf.text(vehicleName(vehicle), x, top - 30, { size: 16, bold: true, color: colors.gray900, maxWidth: 220 })
  pdf.text(`Unit ${text(vehicle?.unit)} · Plate ${text(vehicle?.plate)} · VIN ${text(vehicle?.vin)}`, x, top - 50, { size: 9, color: colors.gray500, maxWidth: 260 })
  pdf.text(`${inspection.type === 'post-trip' ? 'Post-trip' : 'Pre-trip'} · ${formatDateTime(inspection.submitted_at || inspection.created_at, language as any, '-')}`, x, top - 68, { size: 10, color: colors.gray700, maxWidth: 260 })
  pdf.text(`Driver: ${text(driver?.name || driver?.email)}`, x, top - 88, { size: 10, color: colors.gray700, maxWidth: 260 })

  pdf.text('Result', PAGE_WIDTH - MARGIN - 150, top - 30, { size: 8, color: colors.gray500, bold: true })
  pdf.badge(result, PAGE_WIDTH - MARGIN - 150, top - 45)
  pdf.text('Review', PAGE_WIDTH - MARGIN - 150, top - 78, { size: 8, color: colors.gray500, bold: true })
  pdf.badge(review, PAGE_WIDTH - MARGIN - 150, top - 93)

  pdf.y -= cardHeight + 24
}

function drawMetricRow(pdf: ReportPdf, results: any[], issues: any[], photos: string[]) {
  pdf.ensure(58)
  const passed = results.filter((row) => row.result === 'pass').length
  const failed = results.filter((row) => row.result === 'fail').length
  const na = results.filter((row) => row.result === 'not_applicable').length
  const metrics = [
    ['Passed', passed, colors.green],
    ['Failed', failed, colors.red],
    ['N/A', na, colors.gray500],
    ['Issues', issues.length, colors.orange],
    ['Photos', photos.length, colors.blue],
  ] as const
  const gap = 10
  const width = (CONTENT_WIDTH - gap * 4) / 5

  metrics.forEach(([label, value, color], index) => {
    const x = MARGIN + index * (width + gap)
    pdf.rect(x, pdf.y - 48, width, 48, colors.white, colors.gray300)
    pdf.text(String(value), x + 12, pdf.y - 20, { size: 16, bold: true, color })
    pdf.text(label, x + 12, pdf.y - 36, { size: 8, color: colors.gray500, bold: true })
  })

  pdf.y -= 70
}

function drawSectionTitle(pdf: ReportPdf, title: string) {
  pdf.ensure(30)
  pdf.text(title, MARGIN, pdf.y, { size: 14, bold: true, color: colors.gray900 })
  pdf.y -= 20
}

function drawChecklist(pdf: ReportPdf, results: any[]) {
  drawSectionTitle(pdf, 'Checklist Items')

  if (!results.length) {
    pdf.text('No checklist items were recorded for this inspection.', MARGIN, pdf.y, { size: 10, color: colors.gray500 })
    pdf.y -= 24
    return
  }

  results.forEach((row, index) => {
    const item = row.inspection_template_items || {}
    const commentLines = row.comment ? wrapText(row.comment, CONTENT_WIDTH - 120, 9) : []
    const photoCount = row.photo_urls?.length || 0
    const height = Math.max(58, 52 + commentLines.length * 12 + (photoCount ? 12 : 0))
    pdf.ensure(height + 8)
    const y = pdf.y - height

    pdf.rect(MARGIN, y, CONTENT_WIDTH, height, colors.white, colors.gray300)
    pdf.text(`${index + 1}. ${text(item.title, 'Checklist item')}`, MARGIN + 14, pdf.y - 20, { size: 11, bold: true, color: colors.gray900, maxWidth: 330 })
    pdf.text(text(item.inspection_item_categories?.name, 'Checklist'), MARGIN + 14, pdf.y - 37, { size: 8, color: colors.gray500, bold: true })
    if (item.requires_photo) pdf.badge('Photo required', MARGIN + 130, pdf.y - 33)
    pdf.badge(resultLabel(row.result), PAGE_WIDTH - MARGIN - 104, pdf.y - 21)

    if (row.comment) {
      pdf.text(`Notes: ${row.comment}`, MARGIN + 14, pdf.y - 55, { size: 9, color: colors.gray700, maxWidth: CONTENT_WIDTH - 120 })
    }
    if (photoCount) {
      pdf.text(`${photoCount} photo reference${photoCount === 1 ? '' : 's'} attached`, MARGIN + 14, y + 12, { size: 8, color: colors.blue, bold: true })
    }

    pdf.y -= height + 8
  })
}

function drawIssues(pdf: ReportPdf, issues: any[], repairsByIssueId: Map<string, any>) {
  drawSectionTitle(pdf, 'Issues')

  if (!issues.length) {
    pdf.rect(MARGIN, pdf.y - 38, CONTENT_WIDTH, 38, colors.greenLight, colors.gray300)
    pdf.text('No issues were generated for this inspection.', MARGIN + 14, pdf.y - 23, { size: 10, color: colors.green, bold: true })
    pdf.y -= 58
    return
  }

  issues.forEach((issue, index) => {
    const repair = repairsByIssueId.get(issue.id)
    const notes = [issue.description, repair?.description].filter(Boolean).join(' · ')
    const notesLines = notes ? wrapText(notes, CONTENT_WIDTH - 28, 9) : []
    const badgeSpace = repair?.status ? 82 : 58
    const height = Math.max(badgeSpace, 54 + notesLines.length * 12)
    pdf.ensure(height + 8)
    const y = pdf.y - height

    pdf.rect(MARGIN, y, CONTENT_WIDTH, height, colors.orangeLight, colors.gray300)
    pdf.text(`${index + 1}. ${text(issue.title, 'Inspection issue')}`, MARGIN + 14, pdf.y - 20, { size: 11, bold: true, color: colors.gray900, maxWidth: 310 })
    pdf.badge(severityLabel(issue.severity), PAGE_WIDTH - MARGIN - 120, pdf.y - 20)
    pdf.badge(reviewStatus([issue]), PAGE_WIDTH - MARGIN - 120, pdf.y - 45)
    if (repair?.status) pdf.badge(`Repair: ${repair.status}`, PAGE_WIDTH - MARGIN - 120, pdf.y - 70)
    if (notes) {
      pdf.text(`Notes: ${notes}`, MARGIN + 14, pdf.y - 42, { size: 9, color: colors.gray700, maxWidth: CONTENT_WIDTH - 155 })
    }
    pdf.y -= height + 8
  })
}

function drawPhotos(pdf: ReportPdf, photoImages: PdfImage[]) {
  if (!photoImages.length) return

  drawSectionTitle(pdf, 'Photos')
  const size = 76
  const gap = 10
  let x = MARGIN

  photoImages.slice(0, 12).forEach((image) => {
    if (x + size > PAGE_WIDTH - MARGIN) {
      x = MARGIN
      pdf.y -= size + gap
    }
    pdf.ensure(size + 26)
    pdf.drawImage(image, x, pdf.y - size, size, size)
    x += size + gap
  })

  pdf.y -= size + 24
}

export async function downloadInspectionReportPdf(
  inspectionId: string,
  language: string
) {
  const { data, error } = await supabase
    .from('inspections')
    .select(`
      id,
      type,
      status,
      created_at,
      submitted_at,
      vehicle_id,
      driver_id,
      vehicles (
        unit,
        make,
        model,
        plate,
        vin,
        status,
        photo_url
      ),
      drivers (
        name,
        email
      ),
      inspection_results (
        id,
        result,
        comment,
        photo_urls,
        inspection_template_items (
          title,
          description,
          category_id,
          inspection_item_categories (
            id,
            name,
            severity
          ),
          is_required,
          requires_photo,
          sort_order
        )
      ),
      issues (
        id,
        title,
        description,
        severity,
        status,
        photo_urls,
        inspection_result_id
      )
    `)
    .eq('id', inspectionId)
    .single()

  if (error || !data) {
    throw new Error(error?.message || 'Report could not be loaded.')
  }

  const inspection = data as any
  const vehicle = relation(inspection.vehicles)
  const driver = relation(inspection.drivers)
  const results = relationArray(inspection.inspection_results).sort(
    (a: any, b: any) =>
      (a.inspection_template_items?.sort_order || 0) -
      (b.inspection_template_items?.sort_order || 0)
  )
  const issues = relationArray(inspection.issues)
  const photos = [
    ...results.flatMap((row: any) => row.photo_urls || []),
    ...issues.flatMap((issue: any) => issue.photo_urls || []),
  ]
  const dateValue = inspection.submitted_at || inspection.created_at
  const generatedAt = formatDateTime(new Date().toISOString(), language as any, '-')
  const result = reportResult(inspection.status, results)

  const { data: repairs } = issues.length
    ? await supabase
        .from('repairs')
        .select('id, issue_id, status, description, priority')
        .in('issue_id', issues.map((issue: any) => issue.id))
    : { data: [] as any[] }
  const repairsByIssueId = new Map(
    relationArray(repairs).map((repair: any) => [repair.issue_id, repair])
  )

  const [vehiclePhoto, ...photoImages] = await Promise.all([
    loadImage(vehicle?.photo_url, 'ImVehicle'),
    ...photos.slice(0, 12).map((url: string, index: number) =>
      loadImage(url, `ImPhoto${index + 1}`)
    ),
  ])

  const pdf = new ReportPdf(generatedAt)
  drawHeader(pdf, inspection, generatedAt)
  drawVehicleSummary(
    pdf,
    inspection,
    vehicle,
    driver,
    result,
    reviewStatus(issues),
    vehiclePhoto,
    language
  )
  drawMetricRow(pdf, results, issues, photos)
  drawChecklist(pdf, results)
  drawIssues(pdf, issues, repairsByIssueId)
  drawPhotos(pdf, photoImages.filter(Boolean) as PdfImage[])

  const unit = fileSafe(text(vehicle?.unit, 'vehicle'))
  const datePart = dateValue ? String(dateValue).slice(0, 10) : 'report'
  const fileName = unit
    ? `vehicle-${unit}-report-${datePart}.pdf`
    : `report-${inspection.id}.pdf`

  downloadBlob(pdf.blob(), fileName)
}
