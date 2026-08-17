import type {
  BasketStatus,
  OffersBoard,
  PromotionalBasket,
  UpsertBasketInput,
} from '../domain/offerEntities'

export type OffersDatasource = {
  getBoard(): Promise<OffersBoard>
  getById(id: string): Promise<PromotionalBasket>
  upsertBasket(input: UpsertBasketInput): Promise<PromotionalBasket>
  setStatus(id: string, status: BasketStatus): Promise<void>
  /** UC-27: تفعيل وإرسال للمندوبين المستهدفين */
  activateBasket(id: string): Promise<void>
  /** UC-33: إنشاء نسخة جديدة من سلة مؤرشفة */
  duplicateBasket(id: string): Promise<PromotionalBasket>
}
