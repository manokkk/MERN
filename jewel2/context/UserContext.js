import React, { createContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  // Function to load user data from AsyncStorage
  const loadUser = async () => {
    try {
      const storedUser = await AsyncStorage.getItem("user");
      const parsedUser = storedUser ? JSON.parse(storedUser) : null;
      setUser(parsedUser);
    } catch (error) {
      console.error("Error loading user:", error);
      setUser(null);
    }
  };

  // Load user on mount
  useEffect(() => {
    loadUser();
  }, []);

  // Listen for updates when user logs in/out
  useEffect(() => {
    const watchStorage = async () => {
      const storedUser = await AsyncStorage.getItem("user");
      const parsedUser = storedUser ? JSON.parse(storedUser) : null;
      setUser(parsedUser);
    };

    const interval = setInterval(watchStorage, 1000); // Check for changes every second

    return () => clearInterval(interval); // Cleanup on unmount
  }, []);

  // ✅ New Function: Get unique cart key for the logged-in user
  const getCartKey = () => {
    return user && (user._id || user.id) ? `cart_${user._id || user.id}` : "cart_guest";
  };
  

  return (
    <UserContext.Provider value={{ user, setUser, getCartKey }}>
      {children}
    </UserContext.Provider>
  );
};