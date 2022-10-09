import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = window.localStorage.getItem('@RocketShoes:cart')
    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      // TODO
      const {data: product} = await api.get<Product>(`/products/${productId}`)
      if(!product){
        toast.error('Erro na adição do produto');
        return 
      }
    
      const productAlreadyOnCart = cart.find(product => product.id === productId)

      if(productAlreadyOnCart){
        updateProductAmount({
          productId,
          amount: productAlreadyOnCart.amount + 1
        })
        return
      }
      const productIsOnStock = await checkProductIsOnStock(productId, 1)

      if(!productIsOnStock){
        toast.error("Quantidade solicitada fora de estoque")
        return
      }
      const updatedCart = [...cart]
      updatedCart.push({...product, amount: 1})
      setCart(Array(...updatedCart))
      window.localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart))
    } catch {
      // TODO
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      // TODO
      const updatedCart = [...cart]
      const productIndex = updatedCart.findIndex(product => product.id === productId)
      if(productIndex === -1 ) {
        toast.error('Erro na remoção do produto')
        return
      }
      updatedCart.splice(productIndex, 1)

      setCart(updatedCart)
      window.localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart))
    } catch(error) {
      // TODO
      toast.error("'Erro na remoção do produto'")
      
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      // TODO
      const updatedCart = [...cart]
      const productIndex = updatedCart.findIndex(product => product.id === productId)
      if(productIndex === -1){
        toast.error('Erro na alteração de quantidade do produto')
        return
      }
      const product = updatedCart.find(product => product.id === productId) as Product

      const productIsOnStock = await checkProductIsOnStock(productId, product.amount + 1)
      
      if(!productIsOnStock){
        toast.error('Quantidade solicitada fora de estoque')
        return
      }
      
      updatedCart.splice(productIndex,1, {
        ...product,
        amount
        
      })
      setCart([...updatedCart])
      window.localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart))
    } catch {
      // TODO
      toast.error("Erro na alteração de quantidade do produto")
    }
  };

  const checkProductIsOnStock = async (productId: number, requestedAmount: number) => {
    const {data: stock} = await api.get<Stock>(`/stock/${productId}`)
    
    if(stock.amount >= requestedAmount){
      return true
    } else {
      return false
    }
  }

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
