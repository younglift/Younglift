// The only data entry point for UI code: import from '@/lib/data'.
// Day 1: mock data from the prototype. Later the same functions read from Supabase.
export {
  getFeed,
  getMaker,
  getMakerProducts,
  getProduct,
  search,
  getMe,
  saveTaste,
  toggleFollow,
  toggleSave,
  getBoards,
  createBoard,
  addToBoard,
  removeFromBoard,
  getBag,
  addToBag,
  updateBag,
  getOrders,
  getMyMaker,
  updateMyMaker,
  upsertProduct,
  deleteProduct,
  uploadImage,
  markShipped,
  getThreads,
  getMessages,
  sendMessage,
  placeTestOrder,
} from './mock';
export type { ChatMessage } from './mock';
export { MAKER_EXTRAS, PRODUCT_EXTRAS } from './mock-data';
export type { MakerExtras, ProductExtras, PieceStatus } from './mock-data';
export type { Me } from './contract';
