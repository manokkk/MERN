import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  SafeAreaView, 
  StatusBar, 
  ActivityIndicator,
  Image,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';

const BASE_API_URL = "http://192.168.0.159:4000";

type Review = {
  _id: string;
  product: {
    _id: string;
    name: string;
    image: string;
    price: number;
  };
  rating: number;
  comment: string;
  photos: string[];
  createdAt: string;
  verifiedPurchase: boolean;
};

const UserReviewsScreen = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editRating, setEditRating] = useState(0);
  const [editComment, setEditComment] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const navigation = useNavigation();

  const fetchUserReviews = async () => {
    setLoading(true);
    setError('');
    
    try {
      const token = await AsyncStorage.getItem('token');
      
      if (!token) {
        throw new Error('Please login to view your reviews');
      }

      const response = await axios.get(`${BASE_API_URL}/api/reviews/reviewed-products`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setReviews(response.data.reviews);
      } else {
        throw new Error(response.data.message || 'Failed to load reviews');
      }
    } catch (err) {
      console.error('Fetch reviews error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleEditReview = (review: Review) => {
    setEditingReview(review);
    setEditRating(review.rating);
    setEditComment(review.comment);
    setEditModalVisible(true);
  };

  const updateReview = async () => {
    if (!editingReview) return;
    
    setEditLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('Please login to update review');
      }

      const response = await axios.put(
        `${BASE_API_URL}/api/reviews/${editingReview._id}`,
        { rating: editRating, comment: editComment },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        setReviews(reviews.map(r => 
          r._id === editingReview._id ? response.data.review : r
        ));
        setEditModalVisible(false);
        Alert.alert('Success', 'Review updated successfully');
      } else {
        throw new Error(response.data.message || 'Failed to update review');
      }
    } catch (err) {
      console.error('Update review error:', err);
      Alert.alert('Error', err.response?.data?.message || err.message || 'Failed to update review');
    } finally {
      setEditLoading(false);
    }
  };

  useEffect(() => {
    fetchUserReviews();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const renderEditModal = () => (
    <Modal
      visible={editModalVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setEditModalVisible(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Review</Text>
            <TouchableOpacity onPress={() => setEditModalVisible(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          
          {editingReview && (
            <>
              <View style={styles.productHeader}>
                <Image 
                  source={{ uri: editingReview.product.image }} 
                  style={styles.productImage}
                />
                <View style={styles.productInfo}>
                  <Text style={styles.productName}>{editingReview.product.name}</Text>
                  <Text style={styles.productPrice}>${editingReview.product.price.toFixed(2)}</Text>
                </View>
              </View>
              
              <Text style={styles.sectionTitle}>Your Rating</Text>
              <View style={styles.ratingContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => setEditRating(star)}
                  >
                    <Ionicons
                      name={star <= editRating ? 'star' : 'star-outline'}
                      size={32}
                      color="#FFD700"
                    />
                  </TouchableOpacity>
                ))}
              </View>
              
              <Text style={styles.sectionTitle}>Your Review</Text>
              <TextInput
                style={styles.commentInput}
                multiline
                numberOfLines={4}
                value={editComment}
                onChangeText={setEditComment}
                placeholder="Share your thoughts about this product..."
              />
              
              <TouchableOpacity 
                style={styles.submitButton}
                onPress={updateReview}
                disabled={editLoading}
              >
                {editLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitButtonText}>Update Review</Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );

  const renderReviewItem = ({ item }: { item: Review }) => (
    <View style={styles.reviewItem}>
      <View style={styles.productHeader}>
        <Image 
          source={{ uri: item.product.image }} 
          style={styles.productImage}
        />
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{item.product.name}</Text>
          <Text style={styles.productPrice}>${item.product.price.toFixed(2)}</Text>
          {item.verifiedPurchase && (
            <Text style={styles.verifiedBadge}>Verified Purchase</Text>
          )}
        </View>
      </View>
      
      <View style={styles.ratingContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Ionicons
            key={star}
            name={star <= item.rating ? 'star' : 'star-outline'}
            size={20}
            color="#FFD700"
          />
        ))}
        <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
      </View>
      
      <Text style={styles.comment}>{item.comment}</Text>
      
      {item.photos.length > 0 && (
        <FlatList
          horizontal
          data={item.photos}
          renderItem={({ item: photo }) => (
            <TouchableOpacity 
              onPress={() => navigation.navigate('ReviewPhoto', { photoUrl: photo })}
              style={styles.photoContainer}
            >
              <Image source={{ uri: photo }} style={styles.reviewPhoto} />
            </TouchableOpacity>
          )}
          keyExtractor={(photo, index) => index.toString()}
          contentContainerStyle={styles.photosContainer}
          showsHorizontalScrollIndicator={false}
        />
      )}
      
      <View style={styles.reviewFooter}>
        <Text style={styles.date}>
          Reviewed on {formatDate(item.createdAt)}
        </Text>
        
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => handleEditReview(item)}
        >
          <Text style={styles.editButtonText}>Edit Review</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#5886c2" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      <View style={styles.header}>
        <Text style={styles.title}>My Reviews</Text>
        <Text style={styles.subtitle}>{reviews.length} reviewed products</Text>
      </View>
      
      {error ? (
        <View style={styles.centeredContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#e74c3c" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={fetchUserReviews}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : reviews.length === 0 ? (
        <View style={styles.centeredContainer}>
          <Ionicons name="document-text-outline" size={60} color="#ccc" />
          <Text style={styles.emptyText}>You haven't reviewed any products yet</Text>
        </View>
      ) : (
        <FlatList
          data={reviews}
          renderItem={renderReviewItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContainer}
          refreshing={loading}
          onRefresh={fetchUserReviews}
        />
      )}

      {renderEditModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  listContainer: {
    padding: 16,
  },
  reviewItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#F0F0F0',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#5886c2',
    marginTop: 4,
  },
  verifiedBadge: {
    fontSize: 12,
    color: '#93c47d',
    marginTop: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  ratingText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#888',
    fontWeight: '600',
  },
  comment: {
    fontSize: 14,
    color: '#555',
    marginBottom: 12,
    lineHeight: 20,
  },
  photosContainer: {
    marginBottom: 12,
  },
  photoContainer: {
    marginRight: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  reviewPhoto: {
    width: 150,
    height: 150,
    borderRadius: 8,
  },
  reviewFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  date: {
    fontSize: 12,
    color: '#888',
  },
  editButton: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  editButtonText: {
    fontSize: 14,
    color: '#5886c2',
    fontWeight: '600',
  },
  errorText: {
    fontSize: 16,
    color: '#e74c3c',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginTop: 16,
  },
  retryButton: {
    backgroundColor: '#5886c2',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
    marginBottom: 16,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#5886c2',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default UserReviewsScreen;