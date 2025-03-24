import React, { useEffect, useState } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  FlatList, 
  ActivityIndicator, 
  Image,
  SafeAreaView,
  StatusBar
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDispatch, useSelector } from "react-redux";
import { fetchUserOrders } from "../redux/slices/orderSlice";
import { RootState, AppDispatch } from "../redux/store";
import { Ionicons } from "@expo/vector-icons"; // Make sure to install expo vector icons

const OrdersScreen = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { orders = [], status, error } = useSelector((state: RootState) => state.order);
  const [selectedTab, setSelectedTab] = useState("Processing");
  const [userId, setUserId] = useState<string | null>(null);

  // Fetch User ID from AsyncStorage
  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const userData = await AsyncStorage.getItem("user");
        if (userData) {
          const parsedUser = JSON.parse(userData);
          const storedUserId = parsedUser._id || parsedUser.id;
          setUserId(storedUserId);
          console.log("Fetched User ID:", storedUserId);
        } else {
          setUserId(null);
        }
      } catch (error) {
        console.error("Failed to fetch user data:", error);
        setUserId(null);
      }
    };

    fetchUserId();
  }, []);

  // Fetch Orders when user logs in
  useEffect(() => {
    if (userId) {
      dispatch(fetchUserOrders(userId));
    }
  }, [dispatch, userId]);

  // Filter Orders by Selected Tab
  const filteredOrders = orders.filter(
    (order: any) => order.orderStatus === selectedTab
  );

  // Order status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Processing": return "#FF92A5";
      case "Approved": return "#5E9EFF";
      case "Canceled": return "#7ED957";
      default: return "#FF92A5";
    }
  };

  // Render order item
  const renderOrderItem = ({ item }: { item: any }) => (
    <View style={styles.orderItem}>
      <View style={styles.orderHeader}>
        <View>
          <Text style={styles.orderTitle}>{`Order #${item._id.substring(0, 8)}...`}</Text>
          <Text style={styles.orderDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.orderStatus) }]}>
          <Text style={styles.statusText}>{item.orderStatus}</Text>
        </View>
      </View>

      {/* Products */}
      <Text style={styles.sectionTitle}>Products</Text>
      {item.orderItems.map((product: any, index: number) => (
        <View key={index} style={styles.productItem}>
          <Image source={{ uri: product.image }} style={styles.productImage} />
          <View style={styles.productDetails}>
            <Text style={styles.productName}>{product.name}</Text>
            <View style={styles.productMetaContainer}>
              <Text style={styles.productQuantity}>{`Qty: ${product.quantity}`}</Text>
              <Text style={styles.productPrice}>{`₱${product.price.toFixed(2)}`}</Text>
            </View>
          </View>
        </View>
      ))}

      {/* Order Summary */}
      <View style={styles.orderSummary}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total</Text>
          <Text style={styles.summaryValue}>{`₱${item.totalPrice.toFixed(2)}`}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Payment Method</Text>
          <Text style={styles.summaryValue}>{item.modeOfPayment}</Text>
        </View>
      </View>
    </View>
  );

  // Render empty component
  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="cart-outline" size={64} color="#FFCDD2" />
      <Text style={styles.emptyText}>
        {userId ? "No orders found in this category." : "Please log in to view your orders."}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.container}>
        <Text style={styles.screenTitle}>My Orders</Text>
        
        {/* Order Status Tabs */}
        <View style={styles.tabContainer}>
          {["Processing", "Approved", "Canceled"].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabButton, selectedTab === tab && styles.activeTab]}
              onPress={() => setSelectedTab(tab)}
            >
              <Text 
                style={[styles.tabText, selectedTab === tab && styles.activeTabText]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Orders List */}
        {status === "loading" ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#FF92A5" />
            <Text style={styles.loadingText}>Loading your orders...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={64} color="#FF92A5" />
            <Text style={styles.errorText}>
              {typeof error === "string" ? error : "Failed to load orders"}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredOrders}
            renderItem={renderOrderItem}
            keyExtractor={(item) => item._id}
            ListEmptyComponent={renderEmptyComponent}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

// Enhanced styles with white and pink motif
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF"
  },
  container: { 
    flex: 1, 
    backgroundColor: "#FFF", 
    padding: 16,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#333",
    marginBottom: 16,
    marginTop: 8
  },
  tabContainer: {
    flexDirection: "row",
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: "#F5F5F5",
    padding: 4,
  },
  tabButton: { 
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: "center"
  },
  activeTab: { 
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: { 
    fontSize: 14, 
    color: "#888",
    fontWeight: "500"
  },
  activeTabText: { 
    color: "#FF92A5", 
    fontWeight: "bold"
  },
  listContainer: {
    flexGrow: 1,
    paddingBottom: 20
  },
  orderItem: { 
    backgroundColor: "#FFFFFF", 
    padding: 16, 
    borderRadius: 16, 
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: "#FF92A5",
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0"
  },
  orderTitle: { 
    fontSize: 16, 
    fontWeight: "700", 
    color: "#333"
  },
  orderDate: {
    fontSize: 12,
    color: "#888",
    marginTop: 2
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "600"
  },
  sectionTitle: { 
    fontSize: 14, 
    fontWeight: "600", 
    marginBottom: 8,
    color: "#555"
  },
  productItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    backgroundColor: "#FAFAFA",
    padding: 10,
    borderRadius: 10,
  },
  productImage: { 
    width: 60, 
    height: 60,

    borderRadius: 8, 
    marginRight: 12,
    backgroundColor: "#F0F0F0"
  },
  productDetails: { 
    flex: 1,
    justifyContent: "center" 
  },
  productName: { 
    fontSize: 14, 
    fontWeight: "600", 
    color: "#333",
    marginBottom: 4
  },
  productMetaContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  productQuantity: { 
    fontSize: 12, 
    color: "#777"
  },
  productPrice: { 
    fontSize: 14, 
    fontWeight: "700", 
    color: "#FF92A5"
  },
  orderSummary: {
    marginTop: 12,
    backgroundColor: "#FFF5F7",
    padding: 12,
    borderRadius: 10,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4
  },
  summaryLabel: {
    fontSize: 14,
    color: "#555",
    fontWeight: "500"
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FF92A5"
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: { 
    fontSize: 16, 
    color: "#888", 
    textAlign: "center", 
    marginTop: 16
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20
  },
  errorText: { 
    color: "#FF92A5", 
    textAlign: "center", 
    fontSize: 16,
    marginTop: 16
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },
  loadingText: {
    color: "#888",
    marginTop: 12
  }
});

export default OrdersScreen;