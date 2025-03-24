import React, { createContext, useState, useEffect, useContext } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { UserContext } from "./UserContext";

export const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { user } = useContext(UserContext);
  const [cart, setCart] = useState([]);

  // Get cart key based on the logged-in user
  const getCartKey = () => {
    return user && (user._id || user.id) ? `cart_${user._id || user.id}` : "cart_guest";
  };

  // Load cart from AsyncStorage for the current user
  const loadCart = async () => {
    try {
      const cartKey = getCartKey();
      const storedCart = await AsyncStorage.getItem(cartKey);
      setCart(storedCart ? JSON.parse(storedCart) : []);
    } catch (error) {
      console.error("Error loading cart:", error);
    }
  };

  // Save cart to AsyncStorage for the current user
  const saveCart = async (updatedCart) => {
    try {
      const cartKey = getCartKey();
      await AsyncStorage.setItem(cartKey, JSON.stringify(updatedCart));
    } catch (error) {
      console.error("Error saving cart:", error);
    }
  };

  // Clear cart for the current user
  const clearCart = async () => {
    try {
      const cartKey = getCartKey();
      await AsyncStorage.removeItem(cartKey);
      setCart([]); // Clear current cart in state
    } catch (error) {
      console.error("Error clearing cart:", error);
    }
  };

  // Sync cart with AsyncStorage whenever user changes
  useEffect(() => {
    const syncCart = async () => {
      if (user) {
        // If a user is logged in, load their cart
        await loadCart();
      } else {
        // If no user is logged in, clear the cart
        setCart([]);
      }
    };

    syncCart();
  }, [user]);

  // Save cart to AsyncStorage whenever it changes
  useEffect(() => {
    if (user) {
      saveCart(cart);
    }
  }, [cart]);

  // Add an item to the cart
  const addToCart = (item) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((cartItem) => cartItem.id === item.id);
      if (existingItem) {
        return prevCart.map((cartItem) =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      } else {
        return [...prevCart, { ...item, quantity: 1 }];
      }
    });
  };

  // Decrease item quantity in the cart
  const decreaseQuantity = (itemId) => {
    setCart((prevCart) =>
      prevCart
        .map((cartItem) =>
          cartItem.id === itemId
            ? { ...cartItem, quantity: cartItem.quantity - 1 }
            : cartItem
        )
        .filter((cartItem) => cartItem.quantity > 0)
    );
  };

  // Get total price of items in the cart
  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        decreaseQuantity,
        getTotalPrice,
        clearCart,
        loadCart,
        setCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
