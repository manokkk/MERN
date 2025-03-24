import React, { useState, useContext, useEffect } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Alert, 
  StyleSheet, 
  ScrollView,
  StatusBar,
  ActivityIndicator
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CartContext } from "../../context/CartContext";
import { useDispatch, useSelector } from "react-redux";
import { createOrder, resetOrderStatus } from "../redux/slices/orderSlice";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

export default function CheckoutScreen() {
  const { cart, getTotalPrice, clearCart } = useContext(CartContext);
  const router = useRouter();
  const dispatch = useDispatch();
  const { status, error } = useSelector((state) => state.order);

  const [userId, setUserId] = useState(null);

  // Fetch user ID from AsyncStorage
  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const userData = await AsyncStorage.getItem("user");
        if (userData) {
          const parsedUser = JSON.parse(userData);
          setUserId(parsedUser._id || parsedUser.id);
        }
      } catch (error) {
        console.error("Failed to fetch user data:", error);
      }
    };

    fetchUserId();
  }, []);

  // Ensure price calculations are numbers
  const itemsPrice = parseFloat(getTotalPrice()) || 0;
  const taxPrice = itemsPrice * 0.12;
  const shippingPrice = 50;
  const totalPrice = itemsPrice + taxPrice + shippingPrice;

  // State for user input
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [phoneNo, setPhoneNo] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("");
  const [modeOfPayment, setModeOfPayment] = useState("COD");

  // Prevent auto-ordering by using a state flag
  const [orderPlaced, setOrderPlaced] = useState(false);

  // Handle Order Placement
  const handlePlaceOrder = () => {
    if (!userId) {
      Alert.alert("Error", "User not found. Please log in again.");
      return;
    }

    if (!address || !city || !phoneNo || !postalCode || !country) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }

    if (orderPlaced) return; // Prevent multiple submissions

    setOrderPlaced(true); // Mark order as placed

    const orderData = {
      userId,
      orderItems: cart.map((item) => ({
        product: item.productId || item.id, // Ensures correct product ID
        name: item.name,
        quantity: item.quantity,
        image: item.image,
        price: item.price,
      })),
      shippingInfo: { address, city, phoneNo, postalCode, country },
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
      modeOfPayment,
    };

    dispatch(createOrder(orderData));
  };

  // Handle success or failure
  useEffect(() => {
    if (status === "succeeded" && orderPlaced) {
      Alert.alert("Success", "Order placed successfully!");
      clearCart();
      dispatch(resetOrderStatus());
      setOrderPlaced(false); // Reset order state
      router.push("/pages/Orders");
    } else if (status === "failed" && error && orderPlaced) {
      Alert.alert("Error", error);
      dispatch(resetOrderStatus());
      setOrderPlaced(false); // Reset order state
    }
  }, [status, error]);

  return (
    <View style={styles.mainContainer}>
      {/* <StatusBar backgroundColor="#f56a79" barStyle="light-content" /> */}
      
      {/* Header with Gradient */}
      <LinearGradient
        colors={['#f56a79', '#ff85a1']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Checkout</Text>
        <View style={styles.placeholder} />
      </LinearGradient>
    
      <ScrollView contentContainerStyle={styles.container}>
        {/* Shipping Information Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="location-outline" size={22} color="#f56a79" />
            <Text style={styles.sectionTitle}>Shipping Information</Text>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Address</Text>
            <TextInput 
              style={styles.input} 
              placeholder="Enter your full address" 
              placeholderTextColor="#bbb"
              value={address} 
              onChangeText={setAddress} 
            />
          </View>
          
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
              <Text style={styles.inputLabel}>City</Text>
              <TextInput 
                style={styles.input} 
                placeholder="City" 
                placeholderTextColor="#bbb"
                value={city} 
                onChangeText={setCity} 
              />
            </View>
            
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Postal Code</Text>
              <TextInput 
                style={styles.input} 
                placeholder="Postal Code" 
                placeholderTextColor="#bbb"
                value={postalCode} 
                onChangeText={setPostalCode} 
                keyboardType="number-pad" 
              />
            </View>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Country</Text>
            <TextInput 
              style={styles.input} 
              placeholder="Country" 
              placeholderTextColor="#bbb"
              value={country} 
              onChangeText={setCountry} 
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Phone Number</Text>
            <TextInput 
              style={styles.input} 
              placeholder="Your contact number" 
              placeholderTextColor="#bbb"
              value={phoneNo} 
              onChangeText={setPhoneNo} 
              keyboardType="phone-pad" 
            />
          </View>
        </View>

        {/* Payment Method Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="wallet-outline" size={22} color="#f56a79" />
            <Text style={styles.sectionTitle}>Payment Method</Text>
          </View>
          
          <View style={styles.paymentOptions}>
            <TouchableOpacity 
              onPress={() => setModeOfPayment("COD")} 
              style={[
                styles.paymentButton, 
                modeOfPayment === "COD" && styles.selectedPayment
              ]}
            >
              <Ionicons 
                name="cash-outline" 
                size={24} 
                color={modeOfPayment === "COD" ? "#fff" : "#f56a79"} 
              />
              <Text style={[
                styles.paymentText, 
                modeOfPayment === "COD" && styles.selectedPaymentText
              ]}>
                Cash on Delivery
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={() => setModeOfPayment("Online Payment")} 
              style={[
                styles.paymentButton, 
                modeOfPayment === "Online Payment" && styles.selectedPayment
              ]}
            >
              <Ionicons 
                name="card-outline" 
                size={24} 
                color={modeOfPayment === "Online Payment" ? "#fff" : "#f56a79"} 
              />
              <Text style={[
                styles.paymentText, 
                modeOfPayment === "Online Payment" && styles.selectedPaymentText
              ]}>
                Online Payment
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Order Summary Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="receipt-outline" size={22} color="#f56a79" />
            <Text style={styles.sectionTitle}>Order Summary</Text>
          </View>
          
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Items Subtotal:</Text>
            <Text style={styles.summaryValue}>₱{itemsPrice.toFixed(2)}</Text>
          </View>
          
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Tax (12%):</Text>
            <Text style={styles.summaryValue}>₱{taxPrice.toFixed(2)}</Text>
          </View>
          
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Shipping Fee:</Text>
            <Text style={styles.summaryValue}>₱{shippingPrice.toFixed(2)}</Text>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.summaryItem}>
            <Text style={styles.totalLabel}>Order Total:</Text>
            <Text style={styles.totalValue}>₱{totalPrice.toFixed(2)}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Place Order Button */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.orderButton} 
          onPress={handlePlaceOrder} 
          disabled={status === "loading" || orderPlaced}
        >
          {status === "loading" ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.orderButtonText}>Place Order</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Styles
const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: "#fff"
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 40,
    paddingBottom: 15,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  backButton: {
    padding: 5,
  },
  placeholder: {
    width: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
  },
  container: {
    flexGrow: 1,
    padding: 16,
    paddingBottom: 80,
  },
  section: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#ffecf0",
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginLeft: 8,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#eee",
    backgroundColor: "#fafafa",
    padding: 12,
    borderRadius: 10,
    fontSize: 16,
  },
  row: {
    flexDirection: "row",
  },
  paymentOptions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  paymentButton: {
    flex: 1,
    flexDirection: "row",
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#ffecf0",
    borderRadius: 10,
    marginHorizontal: 5,
    backgroundColor: "#fff",
  },
  selectedPayment: {
    backgroundColor: "#f56a79",
    borderColor: "#f56a79",
  },
  paymentText: {
    color: "#f56a79",
    fontWeight: "bold",
    marginLeft: 8,
  },
  selectedPaymentText: {
    color: "#fff",
  },
  summaryItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 15,
    color: "#666",
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
  },
  divider: {
    height: 1,
    backgroundColor: "#ffecf0",
    marginVertical: 10,
  },
  totalLabel: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#333",
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#f56a79",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#ffecf0",
    elevation: 8,
  },
  orderButton: {
    backgroundColor: "#f56a79",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 15,
    borderRadius: 30,
    elevation: 2,
  },
  orderButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  }
});