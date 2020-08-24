import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      // TODO LOAD ITEMS FROM ASYNC STORAGE
      const storageProducts = await AsyncStorage.getItem('@GoMarketplace:carts');
    
      if (storageProducts)
        setProducts([...JSON.parse(storageProducts)]);
    }

    loadProducts();
  }, []);

  const addToCart = useCallback(async product => {
    const productExists = products.find(p => p.id === product.id);
    const newProducts: Product[] = !!productExists ?
    products.map(p => p.id === product.id ? { ...p, quantity: p.quantity + 1 } : p) :
    [ ...products, { ...product, quantity: 1 } ];

    setProducts(newProducts);
    await AsyncStorage.setItem('@GoMarketplace:carts', JSON.stringify(newProducts));
  }, [products]);

  const increment = useCallback(async id => {
    const newProducts = products.map(product => product.id === id 
      ? { ...product, quantity: product.quantity + 1 } 
      : product
    );

    setProducts(newProducts);
    await AsyncStorage.setItem('@GoMarketplace:carts', JSON.stringify(newProducts));
  }, [products]);

  const decrement = useCallback(async id => {
    const newProducts: Product[] = [];

    products.map(product => {
      if (product.id === id) {
        if (product.quantity > 1)
          newProducts.push({ ...product, quantity: product.quantity - 1 });

        return
      }

      newProducts.push(product);
    });

    setProducts(newProducts);
    await AsyncStorage.setItem('@GoMarketplace:carts', JSON.stringify(newProducts));
  }, [products]);

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
