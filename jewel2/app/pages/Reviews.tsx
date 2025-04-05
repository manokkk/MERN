import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  ActivityIndicator,
  Image,
  RefreshControl,
  TouchableOpacity
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface Product {
  _id: string;
  name: string;
  price: number;
  images: string[];
}

interface OrderItem {
  product: Product;
  quantity: number;
}

interface Order {
  _id: string;
  orderItems: OrderItem[];
  createdAt: string;
  totalAmount: number;
}

const ApprovedOrdersScreen = () => {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Hardcoded user ID - replace with your actual user ID
  const userId = '642a1bb5e6f8a9a2f1d3c4e2';

  const fetchApprovedOrders = async () => {
    try {
      setRefreshing(true);
      setError(null);

      const response = await fetch(
        `http://192.168.100.4:4000/api/order/accepted/${userId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setOrders(data.orders || []);
      
    } catch (err: any) {
      console.error('Error fetching orders:', err);
      setError(err.message || 'Failed to load orders');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchApprovedOrders();
  }, []);

  const renderOrderItem = ({ item }: { item: Order }) => (
    <View style={styles.orderCard}>
      <Text style={styles.orderDate}>
        {new Date(item.createdAt).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}
      </Text>
      
      <FlatList
        horizontal
        data={item.orderItems}
        renderItem={({ item: orderItem }) => (
          <View style={styles.productItem}>
            {orderItem.product?.images?.[0] ? (
              <Image 
                source={{ uri: orderItem.product.images[0] }} 
                style={styles.productImage}
                resizeMode="contain"
              />
            ) : (
              <View style={[styles.productImage, styles.imagePlaceholder]}>
                <Ionicons name="image-outline" size={24} color="#ccc" />
              </View>
            )}
            <Text style={styles.productName} numberOfLines={1}>
              {orderItem.product?.name || 'Unknown Product'}
            </Text>
            <Text style={styles.productPrice}>
              ${orderItem.product?.price?.toFixed(2)} × {orderItem.quantity}
            </Text>
          </View>
        )}
        keyExtractor={(_, index) => index.toString()}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.productListContent}
      />
      
      <View style={styles.orderFooter}>
        <Text style={styles.orderTotal}>
          Total: ${item.totalAmount.toFixed(2)}
        </Text>
      </View>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#5886c2" />
        <Text style={styles.loadingText}>Loading your orders...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Ionicons name="warning-outline" size={48} color="#5886c2" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={fetchApprovedOrders}
        >
          <Ionicons name="refresh" size={20} color="#5886c2" />
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Approved Orders</Text>
        <TouchableOpacity onPress={fetchApprovedOrders}>
          <Ionicons name="refresh" size={24} color="#5886c2" />
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={orders}
        renderItem={renderOrderItem}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={fetchApprovedOrders}
            colors={["#5886c2"]}
            tintColor="#5886c2"
          />
        }
        ListEmptyComponent={
          <View style={styles.centered}>
            <Ionicons name="receipt-outline" size={64} color="#acbcd1" />
            <Text style={styles.emptyText}>No approved orders found</Text>
            <TouchableOpacity 
              style={styles.shopButton}
              onPress={() => router.push('/pages/Shop')}
            >
              <Text style={styles.shopButtonText}>Browse Products</Text>
            </TouchableOpacity>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    paddingHorizontal: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 16,
    paddingHorizontal: 8,
  },
  headerText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  loadingText: {
    marginTop: 16,
    color: '#5886c2',
    fontSize: 16,
  },
  errorText: {
    color: '#5886c2',
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#5886c2',
  },
  retryButtonText: {
    color: '#5886c2',
    marginLeft: 8,
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: 24,
  },
  orderCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  orderDate: {
    color: '#666',
    fontSize: 14,
    marginBottom: 12,
  },
  productListContent: {
    paddingBottom: 8,
  },
  productItem: {
    width: 120,
    marginRight: 12,
  },
  productImage: {
    width: '100%',
    height: 100,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f5f5f5',
  },
  imagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee',
  },
  productName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 13,
    color: '#666',
  },
  orderFooter: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'right',
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    marginTop: 16,
    marginBottom: 24,
  },
  shopButton: {
    backgroundColor: '#5886c2',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  shopButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default ApprovedOrdersScreen;