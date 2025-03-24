import { Slot } from "expo-router";
import { View, StyleSheet } from "react-native";
import { Provider } from "react-redux";
import { store } from "./redux/store"; 
import { UserProvider } from "../context/UserContext";
import { CartProvider } from "../context/CartContext";
import { TopNavbar, Sidebar, SidebarProvider } from "../components/navbar";

export default function Layout() {
  return (
    <Provider store={store}>
      <UserProvider>
        <CartProvider>
          <SidebarProvider>
            <View style={styles.container}>
              <TopNavbar />
              <View style={styles.content}>
                <Slot />
              </View>
              <Sidebar />
            </View>
          </SidebarProvider>
        </CartProvider>
      </UserProvider>
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    flex: 1,
  }
});