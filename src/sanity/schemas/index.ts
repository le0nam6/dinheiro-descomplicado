import pautaSugerida from './pautaSugerida'
import { postSchema } from './post'
import { subscriberSchema } from './subscriber'
import { priceAlertSchema } from './priceAlert'
import { commentSchema } from './comment'
import { editionSchema } from './edition'
import { settingsSchema } from './settings'
import { editorialQueueSchema } from './editorialQueue'
export const schemaTypes = [pautaSugerida, postSchema, subscriberSchema, priceAlertSchema, commentSchema, editionSchema, settingsSchema, editorialQueueSchema]
