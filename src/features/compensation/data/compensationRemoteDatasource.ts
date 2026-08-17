/**
 * Remote جاهز لاحقاً — VITE_USE_REMOTE_COMPENSATION=true
 */
import { apiEndpoints } from '../../../core/api/apiEndpoints'
import {
  httpRequest,
  successMessageFrom,
} from '../../../core/api/httpClient'
import type {
  AwardBonusInput,
  CompensationBoard,
  UpsertFixedSalaryInput,
} from '../domain/compensationEntities'
import type { CompensationDatasource } from './compensationDatasource'

type MessageBody = { message?: string; msg?: string }

export const compensationRemoteDatasource: CompensationDatasource = {
  async getBoard() {
    const data = await httpRequest<
      { data?: CompensationBoard } & CompensationBoard
    >(apiEndpoints.compensation.board)
    if (data.reps && data.summary) return data
    if (data.data?.reps) return data.data
    throw new Error('تعذّر قراءة بيانات الرواتب والمكافآت من الخادم')
  },

  async upsertFixedSalary(input: UpsertFixedSalaryInput) {
    const data = await httpRequest<MessageBody>(
      apiEndpoints.compensation.fixedSalary,
      {
        method: 'POST',
        body: {
          rep_id: input.repId,
          amount: input.amount,
          start_date: input.startDate,
          end_date: input.endDate,
          notes: input.notes,
        },
      },
    )
    return successMessageFrom(data, 'تم حفظ الراتب الثابت بنجاح')
  },

  async suspendFixedSalary(repId: string) {
    const data = await httpRequest<MessageBody>(
      apiEndpoints.compensation.suspendSalary(repId),
      { method: 'POST' },
    )
    return successMessageFrom(data, 'تم إيقاف الراتب الثابت بنجاح')
  },

  async awardBonus(input: AwardBonusInput) {
    const data = await httpRequest<MessageBody>(
      apiEndpoints.compensation.bonuses,
      {
        method: 'POST',
        body: {
          rep_ids: input.repIds,
          amount: input.amount,
          reason: input.reason,
        },
      },
    )
    return successMessageFrom(data, 'تم إرسال المكافأة بنجاح')
  },
}
