import { create } from "zustand";
import { persist } from "zustand/middleware";

type WishlistState = {
  productIds: string[];
  has: (productId: string) => boolean;
  toggle: (productId: string) => void;
  remove: (productId: string) => void;
};

export const useWishlist = create<WishlistState>()(
  persist(
    (set, get) => ({
      productIds: [],
      has: (productId) => get().productIds.includes(productId),
      toggle: (productId) =>
        set((state) => ({
          productIds: state.productIds.includes(productId)
            ? state.productIds.filter((id) => id !== productId)
            : [productId, ...state.productIds],
        })),
      remove: (productId) => set((state) => ({ productIds: state.productIds.filter((id) => id !== productId) })),
    }),
    { name: "codeforges-wishlist" },
  ),
);
