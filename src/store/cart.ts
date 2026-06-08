import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartProductInput = {
  id: string;
  title: string;
  price: number;
  priceTeam: number;
  preview: string;
  gradient: string;
  image_url?: string | null;
  isFree?: boolean;
  pricingMode?: "paid" | "free" | "contact";
};

export type CartItem = {
  productId: string;
  title: string;
  price: number;
  license: "personal" | "team";
  preview: string;
  gradient: string;
  image_url?: string | null;
  isFree?: boolean;
  pricingMode?: "paid" | "free" | "contact";
};

type CartState = {
  items: CartItem[];
  add: (product: CartProductInput, license: CartItem["license"]) => void;
  remove: (productId: string, license: CartItem["license"]) => void;
  clear: () => void;
  subtotal: () => number;
  count: () => number;
};

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (product, license) =>
        set((s) => {
          if (s.items.some((i) => i.productId === product.id && i.license === license)) return s;
          return {
            items: [
              ...s.items,
              {
                productId: product.id,
                title: product.title,
                price: license === "team" ? product.priceTeam : product.price,
                license,
                preview: product.preview,
                gradient: product.gradient,
                image_url: product.image_url ?? null,
                isFree: product.isFree ?? product.pricingMode === "free",
                pricingMode: product.pricingMode ?? (product.isFree ? "free" : "paid"),
              },
            ],
          };
        }),
      remove: (productId, license) =>
        set((s) => ({ items: s.items.filter((i) => !(i.productId === productId && i.license === license)) })),
      clear: () => set({ items: [] }),
      subtotal: () => get().items.reduce((sum, i) => sum + i.price, 0),
      count: () => get().items.length,
    }),
    { name: "codeforge-cart" }
  )
);
