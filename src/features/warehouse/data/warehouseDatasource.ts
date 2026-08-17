import type {
  AddItemNoteInput,
  WarehouseBoard,
} from '../domain/warehouseEntities'

export type WarehouseDatasource = {
  getBoard(): Promise<WarehouseBoard>
  addItemNote(input: AddItemNoteInput): Promise<string>
}
