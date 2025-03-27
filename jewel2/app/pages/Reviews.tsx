import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  TextInput,
  Image,
  Alert,
  RefreshControl
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

const ReviewsScreen = () => {
  const router = useRouter();
  const [reviews, setReviews] = useState([]);
  const [acceptedOrders, setAcceptedOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [activeTab, setActiveTab] = useState('reviews');

  const fetchData = async (isRefreshing = false) => {
    try {
      isRefreshing ? setRefreshing(true) : setLoading(true);
      const token = await AsyncStorage.getItem("token");
      
      if (!token) {
        throw new Error("Authentication required");
      }

      const [reviewsResponse, ordersResponse] = await Promise.all([
        fetch("http://192.168.100.4:4000/api/review/me", {
          headers: { "Authorization": `Bearer ${token}` }
        }),
        fetch("http://192.168.100.4:4000/api/order/accepted", {
          headers: { "Authorization": `Bearer ${token}` }
        })
      ]);

      // Handle errors
      if (!reviewsResponse.ok || !ordersResponse.ok) {
        const reviewsError = await reviewsResponse.json().catch(() => null);
        const ordersError = await ordersResponse.json().catch(() => null);
        throw new Error(reviewsError?.message || ordersError?.message || "Failed to fetch data");
      }

      // Parse responses
      const reviewsData = await reviewsResponse.json();
      const ordersData = await ordersResponse.json();

      // Ensure we have arrays to work with
      const safeReviews = Array.isArray(reviewsData.reviews) ? reviewsData.reviews : [];
      const safeOrders = Array.isArray(ordersData.orders) ? ordersData.orders : [];

      setReviews(safeReviews);

      // Filter out orders that already have reviews
      const reviewedOrderIds = new Set(
        safeReviews
          .map(review => review?.order?._id)
          .filter(id => id !== undefined && id !== null)
      );

      const ordersWithoutReviews = safeOrders.filter(order => 
        order?._id && !reviewedOrderIds.has(order._id)
      );

      setAcceptedOrders(ordersWithoutReviews);
      setError(null);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.message);
    } finally {
      isRefreshing ? setRefreshing(false) : setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const submitReview = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      
      if (!token || !selectedOrder) {
        throw new Error("Authentication required or no order selected");
      }

      const response = await fetch("http://192.168.100.4:4000/api/review", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ 
          orderId: selectedOrder._id, 
          rating, 
          comment: reviewText 
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Failed to create review");
      }

      Alert.alert("Success", "Thank you for your review!");
      setModalVisible(false);
      setReviewText("");
      setRating(5);
      fetchData(); // Refresh the data
    } catch (err) {
      console.error('Review submission error:', err);
      Alert.alert("Error", err.message || "Failed to submit review");
    }
  };

  const renderReviewItem = ({ item }) => (
    <View style={styles.reviewItem}>
      <View style={styles.reviewHeader}>
        <Text style={styles.reviewOrder}>Order #{item.order?._id?.substring(0, 8) || 'N/A'}</Text>
        <View style={styles.starContainer}>
          {[...Array(5)].map((_, i) => (
            <Ionicons 
              key={i} 
              name={i < item.rating ? "star" : "star-outline"} 
              size={20} 
              color="#FFD700" 
            />
          ))}
        </View>
      </View>
      
      {item.order?.orderItems?.map((orderItem, index) => (
        <View key={index} style={styles.productContainer}>
          {orderItem.product?.image && (
            <Image 
              source={{ uri: orderItem.product.image }} 
              style={styles.productImage}
              onError={() => console.log('Failed to load review product image')}
            />
          )}
          <View style={styles.productDetails}>
            <Text style={styles.productName}>{orderItem.product?.name || 'Product'}</Text>
            <Text style={styles.productPrice}>${orderItem.product?.price?.toFixed(2) || '0.00'}</Text>
            <Text style={styles.productQuantity}>Qty: {orderItem.quantity}</Text>
          </View>
        </View>
      ))}
      
      <Text style={styles.reviewText}>{item.comment}</Text>
      <Text style={styles.reviewDate}>
        {new Date(item.createdAt).toLocaleDateString()}
      </Text>
    </View>
  );
  const renderOrderItem = ({ item }) => {
    if (!item || !item._id) return null; // Skip rendering if item is invalid
  
    return (
      <TouchableOpacity 
        style={styles.orderItem}
        onPress={() => {
          setSelectedOrder(item);
          setModalVisible(true);
        }}
      >
        <Text style={styles.orderNumber}>Order #{item._id.substring(0, 8)}</Text>
        <Text style={styles.orderDate}>
          {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Unknown date'}
        </Text>
        <Text style={styles.orderStatus}>Status: Accepted</Text>
        
        {(item.orderItems || []).map((orderItem, index) => (
          <View key={`${item._id}-${index}`} style={styles.productContainer}>
            {orderItem.product?.image && (
              <Image 
                source={{ uri: orderItem.product.image }} 
                style={styles.productImage}
              />
            )}
            <View style={styles.productDetails}>
              <Text style={styles.productName}>{orderItem.product?.name || 'Product'}</Text>
              <Text style={styles.productPrice}>${orderItem.product?.price?.toFixed(2) || '0.00'}</Text>
              <Text style={styles.productQuantity}>Qty: {orderItem.quantity}</Text>
            </View>
          </View>
        ))}
        
        <View style={styles.reviewButton}>
          <Ionicons name="star" size={16} color="#FFF" />
          <Text style={styles.reviewButtonText}>Write Review</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Ionicons 
        name={activeTab === 'reviews' ? "star-outline" : "clipboard-outline"} 
        size={64} 
        color="#FFCDD2" 
      />
      <Text style={styles.emptyText}>
        {activeTab === 'reviews' 
          ? "No reviews yet" 
          : "No accepted orders available for review"}
      </Text>
      {activeTab === 'reviews' && acceptedOrders.length > 0 && (
        <TouchableOpacity 
          style={styles.addReviewButton}
          onPress={() => setActiveTab('write-review')}
        >
          <Text style={styles.addReviewButtonText}>Write your first review</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity 
        style={styles.refreshButton}
        onPress={() => fetchData(true)}
      >
        <Ionicons name="refresh" size={20} color="#FF92A5" />
        <Text style={styles.refreshButtonText}>Refresh</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>My Reviews</Text>
          <TouchableOpacity onPress={() => fetchData(true)}>
            <Ionicons name="refresh" size={24} color="#FF92A5" />
          </TouchableOpacity>
        </View>
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'reviews' && styles.activeTab]}
            onPress={() => setActiveTab('reviews')}
          >
            <Text style={styles.tabText}>My Reviews</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'write-review' && styles.activeTab]}
            onPress={() => setActiveTab('write-review')}
          >
            <Text style={styles.tabText}>Write Review</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#FF92A5" />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#FF92A5" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={() => fetchData(true)}
          >
            <Ionicons name="refresh" size={20} color="#FF92A5" />
            <Text style={styles.refreshButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : activeTab === 'reviews' ? (
        <FlatList
          data={reviews}
          renderItem={renderReviewItem}
          keyExtractor={(item) => item._id}
          ListEmptyComponent={renderEmptyComponent}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchData(true)}
              colors={["#FF92A5"]}
            />
          }
        />
      ) : (
        <FlatList
          data={acceptedOrders}
          renderItem={renderOrderItem}
          keyExtractor={(item) => item._id}
          ListEmptyComponent={renderEmptyComponent}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchData(true)}
              colors={["#FF92A5"]}
            />
          }
        />
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Review Order #{selectedOrder?._id?.substring(0, 8) || 'N/A'}
            </Text>
            
            {selectedOrder?.orderItems?.map((orderItem, index) => (
              <View key={index} style={styles.modalProduct}>
                {orderItem.product?.image && (
                  <Image 
                    source={{ uri: orderItem.product.image }} 
                    style={styles.modalProductImage}
                  />
                )}
                <View style={styles.modalProductInfo}>
                  <Text style={styles.modalProductName}>{orderItem.product?.name || 'Product'}</Text>
                  <Text style={styles.modalProductPrice}>
                    ${orderItem.product?.price?.toFixed(2) || '0.00'} × {orderItem.quantity}
                  </Text>
                </View>
              </View>
            ))}
            
            <Text style={styles.ratingLabel}>Rating</Text>
            <View style={styles.ratingContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity 
                  key={star} 
                  onPress={() => setRating(star)}
                >
                  <Ionicons 
                    name={star <= rating ? "star" : "star-outline"} 
                    size={32} 
                    color="#FFD700" 
                  />
                </TouchableOpacity>
              ))}
            </View>
            
            <Text style={styles.reviewLabel}>Your Review</Text>
            <TextInput
              style={styles.reviewInput}
              multiline
              numberOfLines={4}
              placeholder="Share your experience..."
              value={reviewText}
              onChangeText={setReviewText}
            />
            
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton]}
                onPress={submitReview}
              >
                <Text style={styles.submitButtonText}>Submit Review</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF",
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  tabs: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#FF92A5',
  },
  tabText: {
    fontSize: 16,
    color: '#555',
  },
  listContainer: {
    padding: 16,
    flexGrow: 1,
  },
  reviewItem: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  reviewOrder: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  starContainer: {
    flexDirection: "row",
  },
  productContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 10,
  },
  productDetails: {
    flex: 1,
  },
  productName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  productPrice: {
    fontSize: 14,
    color: '#FF92A5',
    marginTop: 4,
  },
  productQuantity: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  reviewText: {
    fontSize: 14,
    color: "#555",
    marginVertical: 8,
  },
  reviewDate: {
    fontSize: 12,
    color: "#888",
    textAlign: "right",
  },
  orderItem: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  orderDate: {
    fontSize: 12,
    color: '#888',
    marginBottom: 8,
  },
  orderStatus: {
    fontSize: 14,
    color: '#5E9EFF',
    fontWeight: '600',
    marginBottom: 8,
  },
  reviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF92A5',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  reviewButtonText: {
    color: '#FFF',
    marginLeft: 5,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#888',
    marginTop: 16,
    textAlign: 'center',
  },
  addReviewButton: {
    marginTop: 20,
    backgroundColor: '#FF92A5',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  addReviewButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    padding: 10,
  },
  refreshButtonText: {
    color: '#FF92A5',
    marginLeft: 5,
    fontWeight: '600',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#FF92A5',
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalProduct: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalProductImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 10,
  },
  modalProductInfo: {
    flex: 1,
  },
  modalProductName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  modalProductPrice: {
    fontSize: 14,
    color: '#FF92A5',
    marginTop: 4,
  },
  ratingLabel: {
    fontSize: 16,
    marginBottom: 8,
    color: '#555',
    marginTop: 10,
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  reviewLabel: {
    fontSize: 16,
    marginBottom: 8,
    color: '#555',
  },
  reviewInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
    marginBottom: 20,
    textAlignVertical: 'top',
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
  },
  cancelButtonText: {
    color: '#555',
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#FF92A5',
  },
  submitButtonText: {
    color: '#FFF',
    fontWeight: '600',
  },
});

export default ReviewsScreen;