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
} from './mock';
export { MAKER_EXTRAS } from './mock-data';
export type { MakerExtras } from './mock-data';
export type { Me } from './contract';
