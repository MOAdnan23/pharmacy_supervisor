/**
 * Remote جاهز لاحقاً — VITE_USE_REMOTE_WAREHOUSE=true
 */
import { apiEndpoints } from '../../../core/api/apiEndpoints'
import {
  httpRequest,
  successMessageFrom,
} from '../../../core/api/httpClient'
import type {
  AddItemNoteInput,
  WarehouseBoard,
} from '../domain/warehouseEntities'
import type { WarehouseDatasource } from './warehouseDatasource'

export const warehouseRemoteDatasource: WarehouseDatasource = {
  async getBoard() {
    const data = await httpRequest<
      { data?: WarehouseBoard } & WarehouseBoard
    >(apiEndpoints.warehouse.board)
    if (data.items && data.summary) return data
    if (data.data?.items) return data.data
    throw new Error('تعذّر قراءة بيانات المستودع من الخادم')
  },

  async addItemNote(input: AddItemNoteInput) {
    const data = await httpRequest<{ message?: string; msg?: string }>(
      apiEndpoints.warehouse.notes,
      {
        method: 'POST',
        body: {
          item_id: input.itemId,
          type: input.type,
          text: input.text,
        },
      },
    )
    return successMessageFrom(data, 'تم حفظ الملاحظة بنجاح')
  },
}
