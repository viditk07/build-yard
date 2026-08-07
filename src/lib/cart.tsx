import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { PRODUCTS, type Product } from "./catalog";

export type CartLine = { productId: string; qty: number };

type CartContextValue = {
  lines: CartLine[];
  items: { product: Product; qty: number; lineTotal: number }[];
  count: number;
  subtotal: number;
  delivery: number;
  gst: number;
  total: number;
  add: (productId: string, qty: number) => void;
  setQty: (productId: string, qty: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "buildyard.cart.v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setLines(JSON.parse(raw) as CartLine[]);
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  }, [lines, hydrated]);

  const add = useCallback((productId: string, qty: number) => {
    setLines((prev) => {
      const found = prev.find((l) => l.productId === productId);
      if (found) {
        return prev.map((l) =>
          l.productId === productId ? { ...l, qty: l.qty + qty } : l,
        );
      }
      return [...prev, { productId, qty }];
    });
  }, []);

  const setQty = useCallback((productId: string, qty: number) => {
    setLines((prev) =>
      qty <= 0
        ? prev.filter((l) => l.productId !== productId)
        : prev.map((l) => (l.productId === productId ? { ...l, qty } : l)),
    );
  }, []);

  const remove = useCallback((productId: string) => {
    setLines((prev) => prev.filter((l) => l.productId !== productId));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const value = useMemo<CartContextValue>(() => {
    const items = lines
      .map((l) => {
        const product = PRODUCTS.find((p) => p.id === l.productId);
        if (!product) return null;
        return { product, qty: l.qty, lineTotal: product.price * l.qty };
      })
      .filter((x): x is { product: Product; qty: number; lineTotal: number } =>
        Boolean(x),
      );

    const subtotal = items.reduce((s, i) => s + i.lineTotal, 0);
    const delivery = subtotal === 0 ? 0 : subtotal > 100000 ? 0 : 2500;
    const gst = Math.round((subtotal + delivery) * 0.18);

    return {
      lines,
      items,
      count: items.reduce((s, i) => s + i.qty, 0),
      subtotal,
      delivery,
      gst,
      total: subtotal + delivery + gst,
      add,
      setQty,
      remove,
      clear,
    };
  }, [lines, add, setQty, remove, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
