import { apiEndpoints } from '../../../core/api/apiEndpoints'
import { httpRequest } from '../../../core/api/httpClient'
import type {
  BasketStatus,
  OffersBoard,
  PromotionalBasket,
  UpsertBasketInput,
} from '../domain/offerEntities'
import type { OffersDatasource } from './offersDatasource'

/**
 * Remote جاهز لاحقاً — لن يُستدعى ما دام useRemoteOffers = false.
 */
export const offersRemoteDatasource: OffersDatasource = {
  async getBoard() {
    const data = await httpRequest<{ data?: OffersBoard } & OffersBoard>(
      apiEndpoints.offers.board,
    )
    if (data.baskets && data.summary) return data
    if (data.data?.baskets) return data.data
    throw new Error('رد العروض غير مفهوم')
  },

  async getById(id: string) {
    const data = await httpRequest<
      { basket?: PromotionalBasket; data?: PromotionalBasket } & PromotionalBasket
    >(apiEndpoints.offers.byId(id))
    if (data.id && data.name) return data
    if (data.basket) return data.basket
    if (data.data) return data.data
    throw new Error('رد تفاصيل السلة غير مفهوم')
  },

  async upsertBasket(input: UpsertBasketInput) {
    if (input.id) {
      const data = await httpRequest<{ basket?: PromotionalBasket } & PromotionalBasket>(
        apiEndpoints.offers.byId(input.id),
        { method: 'PATCH', body: input },
      )
      return data.basket ?? data
    }
    const data = await httpRequest<{ basket?: PromotionalBasket } & PromotionalBasket>(
      apiEndpoints.offers.list,
      { method: 'POST', body: input },
    )
    return data.basket ?? data
  },

  async setStatus(id: string, status: BasketStatus) {
    await httpRequest(apiEndpoints.offers.status(id), {
      method: 'POST',
      body: { status },
    })
  },

  async activateBasket(id: string) {
    await httpRequest(apiEndpoints.offers.activate(id), {
      method: 'POST',
    })
  },

  async duplicateBasket(id: string) {
    const data = await httpRequest<{ basket?: PromotionalBasket } & PromotionalBasket>(
      apiEndpoints.offers.duplicate(id),
      { method: 'POST' },
    )
    return data.basket ?? data
  },
}
