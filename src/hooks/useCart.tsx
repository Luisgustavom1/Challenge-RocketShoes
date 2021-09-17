import { error } from 'console';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => any;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart')

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const updateCart = [...cart];
      const productExists = updateCart.find(product => product.id === productId);

      const stock = await api.get(`/stock/${productId}`);
      const stockAmount = stock.data.amount;

      let currentAmount = productExists ? productExists.amount : 0;
      
      if(currentAmount > stockAmount) {
        return toast.error('Quantidade solicitada fora de estoque');
      }

      if(!productExists) {        
        const newProduct = await api.get(`/products/${productId}`);

        const addNewProduct = {
          ...newProduct.data,
          amount: currentAmount + 1
        };
        
        updateCart.push(addNewProduct)
      } else {
        productExists.amount += 1
      }
      setCart(updateCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updateCart));
      
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const cartRemoved = cart.filter(product => product.id !== productId);

      setCart(cartRemoved);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(cartRemoved))
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const cartUpdated = [...cart];
      const product = cartUpdated.find(item => item.id === productId);

      const currentAmount = await api.get(`/stock/${productId}`);

      if(amount > currentAmount.data.amount) {
        return toast.error('Quantidade solicitada fora de estoque');
      }

      if(product) {
        product.amount = amount
      }

      setCart(cartUpdated);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(cartUpdated))

    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
