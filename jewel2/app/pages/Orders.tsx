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
  StatusBar,
  Alert,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ImageBackground
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDispatch, useSelector } from "react-redux";
import { fetchUserOrders } from "../redux/slices/orderSlice";
import { RootState, AppDispatch } from "../redux/store";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { AntDesign } from '@expo/vector-icons';
import axios from "axios";
import * as ImagePicker from 'expo-image-picker';

type ReviewData = {
  rating: number;
  comment: string;
  productId: string;
  productName: string;
  orderId: string;
  photo: string | null;
};

const OrdersScreen = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { orders = [], status, error } = useSelector((state: RootState) => state.order);
  const [selectedTab, setSelectedTab] = useState("Processing");
  const [userId, setUserId] = useState<string | null>(null);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [reviewData, setReviewData] = useState<ReviewData>({
    rating: 0,
    comment: "",
    productId: "",
    productName: "",
    orderId: "",
    photo: null
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState("");
  const [imageUploading, setImageUploading] = useState(false);

  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const userData = await AsyncStorage.getItem("user");
        if (userData) {
          const parsedUser = JSON.parse(userData);
          const storedUserId = parsedUser._id || parsedUser.id;
          setUserId(storedUserId);
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

  useEffect(() => {
    if (userId) {
      dispatch(fetchUserOrders(userId));
    }
  }, [dispatch, userId]);

  const filteredOrders = orders.filter(
    (order: any) => order.orderStatus === selectedTab
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Processing": return "#FF92A5";
      case "Approved": return "#5E9EFF";
      case "Canceled": return "#7ED957";
      default: return "#FF92A5";
    }
  };

  const openReviewModal = (productId: string, productName: string, orderId: string) => {
    setReviewData({
      rating: 0,
      comment: "",
      productId,
      productName,
      orderId,
      photo: null
    });
    setReviewModalVisible(true);
    setSubmissionError("");
  };

  const handleRatingSelect = (rating: number) => {
    setReviewData(prev => ({
      ...prev,
      rating
    }));
  };

  const handleCommentChange = (text: string) => {
    setReviewData(prev => ({
      ...prev,
      comment: text
    }));
  };

  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert("Permission required", "We need access to your photos to upload images");
        return;
      }

      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });

      if (!pickerResult.canceled && pickerResult.assets && pickerResult.assets.length > 0) {
        setImageUploading(true);
        setReviewData(prev => ({
          ...prev,
          photo: pickerResult.assets[0].uri
        }));
      }
    } catch (error) {
      console.error("Image picker error:", error);
      Alert.alert("Error", "Failed to select image");
    } finally {
      setImageUploading(false);
    }
  };

  const removeImage = () => {
    setReviewData(prev => ({
      ...prev,
      photo: null
    }));
  };

  const submitReview = async () => {
    setIsSubmitting(true);
    setSubmissionError("");
  
    try {
      // 1. Get user data including token
      const userDataString = await AsyncStorage.getItem("user");
      if (!userDataString) {
        throw new Error("Please login to submit a review");
      }
      
      const userData = JSON.parse(userDataString);
      const token = userData.token;
      
      if (!token) {
        throw new Error("Authentication token not found");
      }

      // 2. Validate required fields
      if (reviewData.rating === 0) {
        setSubmissionError("Please select a rating");
        return;
      }

      if (!reviewData.productId || !reviewData.orderId) {
        throw new Error("Product and order information missing");
      }

      // 3. Prepare form data
      const formData = new FormData();
      formData.append('rating', reviewData.rating.toString());
      formData.append('comment', reviewData.comment);
      formData.append('productId', reviewData.productId);
      formData.append('orderId', reviewData.orderId);
      
      // 4. Handle image upload if exists
      if (reviewData.photo) {
        const filename = reviewData.photo.split('/').pop();
        const match = /\.(\w+)$/.exec(filename || '');
        const type = match ? `image/${match[1]}` : 'image';

        formData.append('photo', {
          uri: reviewData.photo,
          name: filename || `review_${Date.now()}.jpg`,
          type
        } as any);
      }

      // 5. Submit to backend
      const response = await axios.post(
        "http://192.168.100.4:4000/api/reviews",
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
          timeout: 15000
        }
      );

      if (response.data.success) {
        Alert.alert("Success", "Review submitted successfully!");
        setReviewModalVisible(false);
        if (userId) {
          dispatch(fetchUserOrders(userId));
        }
      } else {
        throw new Error(response.data.message || "Review submission failed");
      }
    } catch (error: any) {
      console.error("Review submission error:", error);
      
      let errorMessage = "Failed to submit review";
      if (error.response) {
        if (error.response.status === 401) {
          errorMessage = "Session expired. Please login again.";
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setSubmissionError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

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

      <Text style={styles.sectionTitle}>Products</Text>
      {item.orderItems.map((product: any, index: number) => (
        <View key={`${product._id}-${index}`}>
          <View style={styles.productItem}>
            <Image source={{ uri: product.image }} style={styles.productImage} />
            <View style={styles.productDetails}>
              <Text style={styles.productName}>{product.name}</Text>
              <View style={styles.productMetaContainer}>
                <Text style={styles.productQuantity}>{`Qty: ${product.quantity}`}</Text>
                <Text style={styles.productPrice}>{`₱${product.price.toFixed(2)}`}</Text>
              </View>
            </View>
          </View>
          
          {item.orderStatus === "Approved" && (
            <TouchableOpacity 
              style={styles.reviewButton}
              onPress={() => openReviewModal(product._id, product.name, item._id)}
            >
              <Text style={styles.reviewButtonText}>Review This Product</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}

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

  const renderStars = () => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => handleRatingSelect(star)}
            activeOpacity={0.7}
          >
            <AntDesign
              name={star <= reviewData.rating ? "star" : "staro"}
              size={32}
              color={star <= reviewData.rating ? "#FFD700" : "#CCCCCC"}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const ReviewModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={reviewModalVisible}
      onRequestClose={() => {
        setReviewModalVisible(false);
      }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.modalContainer}
      >
        <ScrollView contentContainerStyle={styles.modalScrollContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Review {reviewData.productName}</Text>
              <TouchableOpacity
                onPress={() => setReviewModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.ratingLabel}>Your Rating</Text>
            {renderStars()}
            
            <Text style={styles.commentLabel}>Your Review (Optional)</Text>
            <TextInput
              style={styles.commentInput}
              multiline
              numberOfLines={4}
              placeholder="Share your experience with this product..."
              value={reviewData.comment}
              onChangeText={handleCommentChange}
            />
            
            <Text style={styles.photoLabel}>Add Photo (Optional)</Text>
            {reviewData.photo ? (
              <View style={styles.photoPreviewContainer}>
                <ImageBackground 
                  source={{ uri: reviewData.photo }}
                  style={styles.photoPreview}
                  resizeMode="cover"
                >
                  <TouchableOpacity 
                    style={styles.removePhotoButton}
                    onPress={removeImage}
                  >
                    <Ionicons name="close" size={20} color="#FFF" />
                  </TouchableOpacity>
                </ImageBackground>
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.photoUploadButton}
                onPress={pickImage}
                disabled={imageUploading}
              >
                {imageUploading ? (
                  <ActivityIndicator color="#FF92A5" />
                ) : (
                  <>
                    <MaterialIcons name="add-a-photo" size={24} color="#FF92A5" />
                    <Text style={styles.photoUploadText}>Add Photo</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
            
            {submissionError ? (
              <Text style={styles.errorText}>{submissionError}</Text>
            ) : null}
            
            <TouchableOpacity
              style={styles.submitButton}
              onPress={submitReview}
              disabled={isSubmitting || imageUploading}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.submitButtonText}>Submit Review</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );

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
        
        <ReviewModal />
      </View>
    </SafeAreaView>
  );
};


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
    marginBottom: 8,
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
  },
  reviewButton: {
    marginTop: 4,
    backgroundColor: "#FF92A5",
    padding: 8,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 12,
  },
  reviewButtonText: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: 12
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalScrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  closeButton: {
    padding: 8,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 15,
  },
  ratingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#555',
    marginTop: 10,
    textAlign: 'center',
  },
  commentLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#555',
    marginTop: 20,
    marginBottom: 8,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 15,
  },
  submitButton: {
    backgroundColor: '#FF92A5',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  submitButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  photoLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#555',
    marginTop: 20,
    marginBottom: 8,
  },
  photoUploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FF92A5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
  },
  photoUploadText: {
    color: '#FF92A5',
    marginLeft: 8,
    fontWeight: '600',
  },
  photoPreviewContainer: {
    marginBottom: 15,
    alignItems: 'center',
  },
  photoPreview: {
    width: 200,
    height: 200,
    borderRadius: 8,
    overflow: 'hidden',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  removePhotoButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 8,
  },
});

export default OrdersScreen;