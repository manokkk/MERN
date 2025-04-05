import React, { useEffect, useState, useContext, useRef } from "react";
import { 
  View, 
  Text, 
  FlatList, 
  Image, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator, 
  ScrollView, 
  Dimensions, 
  Animated,
  Easing
} from "react-native";
import axios from "axios";
import { CartContext } from "../context/CartContext";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";

const { width } = Dimensions.get("window");
const cardWidth = (width / 2) - 20;

export default function Index() {
  const { addToCart } = useContext(CartContext);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [addedToCartItems, setAddedToCartItems] = useState({});
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  const categories = [
    { id: "All", icon: "apps-outline", label: "All" },
    { id: "Smartphones", icon: "phone-portrait-outline", label: "Smartphones" },
    { id: "Laptops", icon: "laptop-outline", label: "Laptops" },
    { id: "Cameras", icon: "camera-outline", label: "Cameras" },
    { id: "Wearables", icon: "watch-outline", label: "Wearables" }
  ];

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get("http://192.168.100.4:4000/api/product/get");
        if (response.data.success) {
          setProducts(response.data.products);
          
          // Start entrance animations
          Animated.parallel([
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 600,
              useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
              toValue: 1,
              duration: 600,
              easing: Easing.out(Easing.back(1.5)),
              useNativeDriver: true,
            })
          ]).start();
        } else {
          setProducts([]);
        }
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleAddToCart = (item) => {
    addToCart({ ...item, id: item._id || item.id });
    
    // Set animation state for this item
    setAddedToCartItems(prev => ({
      ...prev,
      [item._id || item.id]: true
    }));
    
    // Reset animation state after animation completes
    setTimeout(() => {
      setAddedToCartItems(prev => ({
        ...prev,
        [item._id || item.id]: false
      }));
    }, 1500);
  };

  const renderLoading = () => (
    <View style={styles.loadingContainer}>
      <LinearGradient
        colors={['#acbcd1', '#c8d5e7', '#acbcd1']}
        style={styles.loadingGradient}
      >
        <ActivityIndicator size="large" color="#153d72" />
        <Text style={styles.loadingText}>Loading Gadgets...</Text>
      </LinearGradient>
    </View>
  );

  const renderImageDots = (images) => {
    if (!Array.isArray(images) || images.length <= 1) return null;
    
    return (
      <View style={styles.imageDots}>
        {images.map((_, index) => (
          <View 
            key={index} 
            style={[
              styles.imageDot,
              index === 0 && styles.activeImageDot
            ]} 
          />
        ))}
      </View>
    );
  };

  if (loading) {
    return renderLoading();
  }

  const filteredProducts = selectedCategory === "All" 
    ? products 
    : products.filter((product) => product.category === selectedCategory);

  return (
    <Animated.View 
      style={[
        styles.container,
        { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }
      ]}
    >
      {/* Featured Banner */}
      <LinearGradient
        colors={['#c8d5e7', '#acbcd1']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.banner}
      >
        <View style={styles.bannerContent}>
          <Text style={styles.bannerTitle}>Latest Tech</Text>
          <Text style={styles.bannerSubtitle}>Get your gadget now!</Text>
        </View>
        <Image 
          source={require('../assets/images/banner.jpg')} 
          style={styles.bannerImage}
        />
      </LinearGradient>

      {/* Category Filter */}
      <View style={styles.categoryContainer}>
        <Text style={styles.sectionTitle}>Categories</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.categoryScrollView}
        >
          {categories.map((category) => (
            <TouchableOpacity 
              key={category.id} 
              style={[
                styles.categoryButton, 
                selectedCategory === category.id && styles.selectedCategoryButton
              ]} 
              onPress={() => setSelectedCategory(category.id)}
            >
              <LinearGradient
                colors={selectedCategory === category.id 
                  ? ['#5886c2', '#153d72'] 
                  : ['#f2f2f2', '#e8e8e8']}
                style={styles.categoryGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons 
                  name={category.icon} 
                  size={18} 
                  color={selectedCategory === category.id ? "#fff" : "#888"} 
                />
                <Text 
                  style={[
                    styles.categoryText, 
                    selectedCategory === category.id && styles.selectedCategoryText
                  ]}
                >
                  {category.label}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Product List */}
      <View style={styles.productsContainer}>
        <Text style={styles.sectionTitle}>
          {selectedCategory === 'All' ? 'All Gadgets' : selectedCategory}
          <Text style={styles.productCount}> ({filteredProducts.length})</Text>
        </Text>
        
        {filteredProducts.length === 0 ? (
          <View style={styles.emptyStateContainer}>
            <Ionicons name="search-outline" size={48} color="#ccc" />
            <Text style={styles.emptyStateText}>No items found</Text>
          </View>
        ) : (
          <FlatList
            data={filteredProducts}
            keyExtractor={(item) => (item._id || item.id).toString()}
            numColumns={2}
            columnWrapperStyle={styles.row}
            showsVerticalScrollIndicator={false}
            renderItem={({ item, index }) => {
              const itemAdded = addedToCartItems[item._id || item.id];
              const images = Array.isArray(item.image) ? item.image : [item.image];
              const validImages = images.filter(img => img);
              
              return (
                <Animated.View
                  style={[
                    styles.productCardContainer,
                    {
                      transform: [{ 
                        translateY: fadeAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [50, 0]
                        })
                      }],
                      opacity: fadeAnim
                    }
                  ]}
                >
                  <TouchableOpacity 
                    style={styles.productCard}
                    activeOpacity={0.9}
                  >
                    <View style={styles.imageContainer}>
                      <ScrollView 
                        horizontal 
                        pagingEnabled
                        showsHorizontalScrollIndicator={false} 
                        style={styles.imageScrollView}
                      >
                        {validImages.map((img, imgIndex) => (
                          <Image 
                            key={imgIndex} 
                            source={{ uri: img }} 
                            style={styles.productImage}
                            resizeMode="cover"
                          />
                        ))}
                      </ScrollView>
                      {renderImageDots(validImages)}
                      <TouchableOpacity style={styles.favoriteButton}>
                        <Ionicons name="heart-outline" size={18} color="#5886c2" />
                      </TouchableOpacity>
                    </View>
                    
                    <View style={styles.productInfo}>
                      <Text style={styles.productName} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text style={styles.productCategory}>
                        {item.category}
                      </Text>
                      <View style={styles.priceRow}>
                        <Text style={styles.productPrice}>
                          ₱{Number(item.price).toLocaleString()}
                        </Text>
                        <TouchableOpacity 
                          style={[
                            styles.addToCartButton,
                            itemAdded && styles.addedToCartButton
                          ]} 
                          onPress={() => handleAddToCart(item)}
                        >
                          <Ionicons 
                            name={itemAdded ? "checkmark" : "cart-outline"} 
                            size={18} 
                            color="#fff" 
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              );
            }}
          />
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fafafa",
    paddingTop: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fafafa',
  },
  loadingGradient: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    width: 200,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: '600',
    color: '#606060',
  },
  banner: {
    height: 120,
    margin: 15,
    marginTop: 5,
    borderRadius: 16,
    flexDirection: 'row',
    overflow: 'hidden',
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  bannerContent: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  bannerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  bannerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  bannerImage: {
    width: 110,
    height: '100%',
    resizeMode: 'cover',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 15,
    marginBottom: 10,
  },
  productCount: {
    fontSize: 15,
    color: '#888',
    fontWeight: 'normal',
  },
  categoryContainer: {
    marginVertical: 10,
  },
  categoryScrollView: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  categoryButton: {
    marginHorizontal: 5,
    borderRadius: 20,
    overflow: 'hidden',
  },
  categoryGradient: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedCategoryButton: {
    elevation: 2,
    shadowColor: "#5886c2",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#888",
    marginLeft: 6,
  },
  selectedCategoryText: {
    color: "#fff",
  },
  productsContainer: {
    flex: 1,
    marginTop: 5,
  },
  row: {
    justifyContent: "space-between",
    paddingHorizontal: 10,
  },
  productCardContainer: {
    width: cardWidth,
    margin: 10,
  },
  productCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 5,
    elevation: 3,
  },
  imageContainer: {
    position: 'relative',
    height: cardWidth,
  },
  imageScrollView: {
    width: cardWidth,
    height: cardWidth,
  },
  productImage: {
    width: cardWidth,
    height: cardWidth,
  },
  imageDots: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.5)',
    marginHorizontal: 3,
  },
  activeImageDot: {
    backgroundColor: '#fff',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  favoriteButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: "bold",
    color: '#333',
    marginBottom: 3,
  },
  productCategory: {
    fontSize: 12,
    color: "#888",
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productPrice: {
    fontSize: 16,
    color: "#333",
    fontWeight: "700",
  },
  addToCartButton: {
    backgroundColor: "#5886c2",
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addedToCartButton: {
    backgroundColor: "#5886c2",
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    marginTop: 10,
    fontSize: 16,
    color: '#888',
  },
});