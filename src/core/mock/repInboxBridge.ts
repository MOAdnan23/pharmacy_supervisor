import { gradeLabel } from '../../features/evaluation/domain/evaluationLabels'
import type { EvaluationGrade } from '../../features/evaluation/domain/evaluationEntities'
import { evaluationLabel } from '../../features/plans/domain/planLabels'
import type { EvaluationLevel } from '../../features/plans/domain/planEntities'

export type RepInboxReview = {
  repId: string
  grade: EvaluationGrade
  gradeLabel: string
  note: string
  sentAt: string
  sentBy: string
  from: string
  to: string
  mainRegionId: string | null
  subRegionId: string | null
}

export type RepInboxNotification = {
  id: string
  title: string
  type: 'evaluation' | 'work_plan'
  summary: string
  body: string
  dateTime: string
  isRead: boolean
  referenceId: string
  referenceLabel: string
  actorName: string
  statusText: string
  actionKind: 'evaluation' | 'work_plan'
  actionLabel: string
  gradeLabel?: string
  note?: string
}

export type PlanOfficialNoteShared = {
  id: string
  supervisorPlanId: string
  repPlanId: number
  planName: string
  text: string
  evaluationLevel: EvaluationLevel
  evaluationLabel: string
  authorName: string
  authorRole: string
  createdAt: string
  type: 'evaluation'
}

export type PlanRepReplyShared = {
  id: string
  supervisorPlanId: string
  repPlanId: number
  text: string
  authorName: string
  authorRole: string
  createdAt: string
  replyToEvaluation: boolean
}

type RepInboxFile = {
  supervisorReviews: RepInboxReview[]
  notifications: RepInboxNotification[]
  planOfficialNotes: PlanOfficialNoteShared[]
  planRepReplies: PlanRepReplyShared[]
}

const emptyInbox = (): RepInboxFile => ({
  supervisorReviews: [],
  notifications: [],
  planOfficialNotes: [],
  planRepReplies: [],
})

/** PLAN-001 عند المشرف ↔ الخطة 1 عند المندوب */
export function mapSupervisorPlanToRepId(supervisorPlanId: string): number {
  if (supervisorPlanId === 'PLAN-001') return 1
  const digits = supervisorPlanId.replace(/\D/g, '')
  return Number(digits) || 1
}

let memory: RepInboxFile | null = null

function normalize(raw: Partial<RepInboxFile> | null | undefined): RepInboxFile {
  return {
    supervisorReviews: Array.isArray(raw?.supervisorReviews)
      ? raw!.supervisorReviews
      : [],
    notifications: Array.isArray(raw?.notifications) ? raw!.notifications : [],
    planOfficialNotes: Array.isArray(raw?.planOfficialNotes)
      ? raw!.planOfficialNotes
      : [],
    planRepReplies: Array.isArray(raw?.planRepReplies) ? raw!.planRepReplies : [],
  }
}

async function readInboxFs(): Promise<RepInboxFile> {
  const { readFileSync } = await import('node:fs')
  const { dirname, resolve } = await import('node:path')
  const { fileURLToPath } = await import('node:url')
  const here = dirname(fileURLToPath(import.meta.url))
  const path = resolve(here, '../../../../shared_mock/rep_inbox.json')
  try {
    return normalize(JSON.parse(readFileSync(path, 'utf8')))
  } catch {
    return emptyInbox()
  }
}

async function writeInboxFs(data: RepInboxFile): Promise<void> {
  const { mkdirSync, writeFileSync } = await import('node:fs')
  const { dirname, resolve } = await import('node:path')
  const { fileURLToPath } = await import('node:url')
  const here = dirname(fileURLToPath(import.meta.url))
  const path = resolve(here, '../../../../shared_mock/rep_inbox.json')
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`, 'utf8')
}

async function readInbox(): Promise<RepInboxFile> {
  if (typeof window === 'undefined') {
    memory = await readInboxFs()
    return memory
  }
  if (memory) return memory
  try {
    const res = await fetch('/__shared_mock/inbox')
    memory = normalize(await res.json())
    return memory
  } catch {
    memory = emptyInbox()
    return memory
  }
}

async function writeInbox(data: RepInboxFile): Promise<void> {
  memory = data
  if (typeof window === 'undefined') {
    await writeInboxFs(data)
    return
  }
  await fetch('/__shared_mock/inbox', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
}

export async function pushSupervisorReviewToRep(input: {
  repId: string
  grade: EvaluationGrade
  note: string
  from: string
  to: string
  mainRegionId: string | null
  subRegionId: string | null
}) {
  const inbox = await readInbox()
  const sentAt = new Date().toISOString()
  const label = gradeLabel(input.grade)
  const review: RepInboxReview = {
    repId: input.repId,
    grade: input.grade,
    gradeLabel: label,
    note: input.note.trim(),
    sentAt,
    sentBy: 'المشرف',
    from: input.from,
    to: input.to,
    mainRegionId: input.mainRegionId,
    subRegionId: input.subRegionId,
  }

  inbox.supervisorReviews = [
    review,
    ...inbox.supervisorReviews.filter((r) => r.repId !== input.repId),
  ]

  const period = `${input.from} → ${input.to}`
  inbox.notifications = [
    {
      id: `notification-supervisor-eval-${Date.now()}`,
      title: 'تقييم من المشرف',
      type: 'evaluation',
      summary: `أرسل المشرف تقييمك: ${label}`,
      body: `تقدير المشرف: ${label}\nالملاحظة: ${input.note.trim()}\nالفترة: ${period}\nافتح شاشة التقييم لمراجعة التفاصيل.`,
      dateTime: sentAt,
      isRead: false,
      referenceId: `EVAL-${input.from}-${input.to}`,
      referenceLabel: `تقييم ${period}`,
      actorName: 'المشرف',
      statusText: label,
      actionKind: 'evaluation',
      actionLabel: 'الانتقال إلى التقييم',
      gradeLabel: label,
      note: input.note.trim(),
    },
    ...inbox.notifications,
  ]

  await writeInbox(inbox)
}

export async function pushPlanEvaluationToRep(input: {
  supervisorPlanId: string
  planName: string
  level: EvaluationLevel
  note: string
}) {
  const inbox = await readInbox()
  const sentAt = new Date().toISOString()
  const label = evaluationLabel(input.level)
  const repPlanId = mapSupervisorPlanToRepId(input.supervisorPlanId)
  const noteText = input.note.trim()
    ? `تقييم الخطة: ${label}\n${input.note.trim()}`
    : `تقييم الخطة: ${label}`

  const entry: PlanOfficialNoteShared = {
    id: `plan-eval-${Date.now()}`,
    supervisorPlanId: input.supervisorPlanId,
    repPlanId,
    planName: input.planName,
    text: noteText,
    evaluationLevel: input.level,
    evaluationLabel: label,
    authorName: 'المشرف',
    authorRole: 'مشرف',
    createdAt: sentAt,
    type: 'evaluation',
  }

  inbox.planOfficialNotes = [
    entry,
    ...inbox.planOfficialNotes.filter(
      (n) => n.supervisorPlanId !== input.supervisorPlanId,
    ),
  ]

  inbox.notifications = [
    {
      id: `notification-plan-eval-${Date.now()}`,
      title: 'تقييم على خطة العمل',
      type: 'work_plan',
      summary: `تقييم المشرف لخطة «${input.planName}»: ${label}`,
      body: `${noteText}\nافتح تفاصيل الخطة → الملاحظات والمتابعة → سجل الخطة.`,
      dateTime: sentAt,
      isRead: false,
      referenceId: String(repPlanId),
      referenceLabel: input.planName,
      actorName: 'المشرف',
      statusText: label,
      actionKind: 'work_plan',
      actionLabel: 'الانتقال إلى خطة العمل',
      gradeLabel: label,
      note: input.note.trim(),
    },
    ...inbox.notifications,
  ]

  await writeInbox(inbox)
}

export async function readPlanRepReplies(
  supervisorPlanId: string,
): Promise<PlanRepReplyShared[]> {
  const inbox = await readInbox()
  return inbox.planRepReplies.filter(
    (r) => r.supervisorPlanId === supervisorPlanId,
  )
}

export async function pushPlanRepReply(input: {
  supervisorPlanId: string
  repPlanId: number
  text: string
  replyToEvaluation?: boolean
}) {
  const inbox = await readInbox()
  const entry: PlanRepReplyShared = {
    id: `plan-reply-${Date.now()}`,
    supervisorPlanId: input.supervisorPlanId,
    repPlanId: input.repPlanId,
    text: input.text.trim(),
    authorName: 'ياسين العمودي',
    authorRole: 'مندوب',
    createdAt: new Date().toISOString(),
    replyToEvaluation: input.replyToEvaluation ?? true,
  }
  inbox.planRepReplies = [entry, ...inbox.planRepReplies]
  await writeInbox(inbox)
}
