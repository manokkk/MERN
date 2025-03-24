import React, { useContext } from "react";
import { View, Text, FlatList, Image, StyleSheet, TouchableOpacity, StatusBar } from "react-native";
import { CartContext } from "../../context/CartContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

export default function CartScreen() {
  const { cart, addToCart, decreaseQuantity, getTotalPrice } = useContext(CartContext);
  const router = useRouter();
  
  return (
    <View style={styles.container}>
      {/* <StatusBar  barStyle="light-content" /> */}
      
      {/* Header with Gradient */}
      <LinearGradient
        colors={['#f56a79', '#ff85a1']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <Text style={styles.title}>My Shopping Bag</Text>
      </LinearGradient>
      
      {cart.length === 0 ? (
        <View style={styles.emptyCartContainer}>
          <Ionicons name="cart-outline" size={80} color="#f56a79" />
          <Text style={styles.emptyCartText}>Your shopping bag is empty</Text>
          <TouchableOpacity 
            style={styles.shopNowButton}
            onPress={() => router.push("/pages/Products")}
          >
            <Text style={styles.shopNowText}>Shop Now</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={cart}
            keyExtractor={(item) => item.id.toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
            renderItem={({ item }) => (
              <View style={styles.cartItem}>
                <View style={styles.imageContainer}>
                  <Image source={{ uri: item.image }} style={styles.image} />
                </View>
                
                <View style={styles.itemContent}>
                  <View style={styles.details}>
                    <Text style={styles.name}>{item.name}</Text>
                    <Text style={styles.price}>₱{item.price.toFixed(2)}</Text>
                  </View>
                  
                  <View style={styles.bottomRow}>
                    {/* Quantity Controls */}
                    <View style={styles.quantityContainer}>
                      <TouchableOpacity 
                        style={styles.quantityButton}
                        onPress={() => decreaseQuantity(item.id)}
                      >
                        <Ionicons name="remove" size={18} color="#fff" />
                      </TouchableOpacity>
                      
                      <View style={styles.quantityBox}>
                        <Text style={styles.quantity}>{item.quantity}</Text>
                      </View>
                      
                      <TouchableOpacity 
                        style={styles.quantityButton}
                        onPress={() => addToCart(item)}
                      >
                        <Ionicons name="add" size={18} color="#fff" />
                      </TouchableOpacity>
                    </View>
                    
                    {/* Total Price per Product */}
                    <Text style={styles.totalItemPrice}>
                      ₱{(item.price * item.quantity).toFixed(2)}
                    </Text>
                  </View>
                </View>
              </View>
            )}
          />
          
          {/* Total Price Section */}
          <View style={styles.footer}>
            <LinearGradient
              colors={['#fff', '#fff6f8']}
              style={styles.totalContainer}
            >
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Subtotal:</Text>
                <Text style={styles.totalText}>₱{getTotalPrice()}</Text>
              </View>
              
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Shipping:</Text>
                <Text style={styles.totalText}>₱0.00</Text>
              </View>
              
              <View style={[styles.totalRow, styles.grandTotalRow]}>
                <Text style={styles.grandTotalLabel}>Total:</Text>
                <Text style={styles.grandTotalText}>₱{getTotalPrice()}</Text>
              </View>
              
              {/* Checkout Button */}
              <TouchableOpacity 
                style={styles.checkoutButton}
                onPress={() => router.push("/pages/Checkout")}
              >
                <Ionicons name="checkmark-circle" size={20} color="#fff" style={styles.checkoutIcon} />
                <Text style={styles.checkoutText}>Proceed to Checkout</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    paddingTop: 40,
    paddingBottom: 15,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
  },
  emptyCartContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },
  emptyCartText: {
    fontSize: 18,
    color: "#666",
    marginTop: 20,
    marginBottom: 30,
  },
  shopNowButton: {
    backgroundColor: "#f56a79",
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 30,
    elevation: 3,
  },
  shopNowText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  listContainer: {
    padding: 15,
    paddingBottom: 120, // Space for footer
  },
  cartItem: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 15,
    marginBottom: 15,
    padding: 10,
    elevation: 2,
    borderColor: "#ffecf0",
    borderWidth: 1,
  },
  imageContainer: {
    backgroundColor: "#ffecf0",
    padding: 5,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  image: {
    width: 70,
    height: 70,
    borderRadius: 8,
  },
  itemContent: {
    flex: 1,
    justifyContent: "space-between",
  },
  details: {
    marginBottom: 10,
  },
  name: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  price: {
    fontSize: 15,
    color: "#f56a79",
    fontWeight: "600",
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    overflow: "hidden",
  },
  quantityButton: {
    backgroundColor: "#f56a79",
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  quantityBox: {
    backgroundColor: "#ffecf0",
    paddingHorizontal: 15,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  quantity: {
    fontWeight: "bold",
    color: "#f56a79",
  },
  totalItemPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  totalContainer: {
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 20,
    elevation: 8,
    borderTopWidth: 1,
    borderColor: "#ffecf0",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  totalLabel: {
    fontSize: 15,
    color: "#888",
  },
  totalText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
  },
  grandTotalRow: {
    marginTop: 5,
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: "#ffecf0",
    marginBottom: 15,
  },
  grandTotalLabel: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  grandTotalText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#f56a79",
  },
  checkoutButton: {
    backgroundColor: "#f56a79",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 15,
    borderRadius: 30,
    marginTop: 5,
    elevation: 2,
  },
  checkoutIcon: {
    marginRight: 8,
  },
  checkoutText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});