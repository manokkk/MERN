import React, { useEffect, useState } from "react";
import { 
  View, Text, TextInput, FlatList, TouchableOpacity, ActivityIndicator, 
  StyleSheet, Image 
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import axios from "axios";

const API_URL = "http://192.168.100.4:4000/api/product/search";

const categories = [
  { id: "All", icon: "apps-outline", label: "All" },
  { id: "Necklaces", icon: "flower-outline", label: "Necklaces" },
  { id: "Earrings", icon: "star-outline", label: "Earrings" },
  { id: "Bracelets", icon: "infinite-outline", label: "Bracelets" },
  { id: "Rings", icon: "ellipse-outline", label: "Rings" }
];

const SearchScreen = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(500);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await axios.get(API_URL, {
        params: {
          search: searchQuery,
          category: selectedCategory === "All" ? null : selectedCategory,
          minPrice: Number(minPrice),
          maxPrice: Number(maxPrice)
        }
      });

      console.log("📩 API Response:", response.data);

      if (Array.isArray(response.data)) {
        setProducts(response.data);
      } else if (response.data.success && Array.isArray(response.data.products)) {
        setProducts(response.data.products);
      } else {
        setProducts([]);
      }
    } catch (error) {
      console.error("❌ Error fetching products:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, [searchQuery, selectedCategory, minPrice, maxPrice]);

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={18} color="#888" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search..."
          placeholderTextColor="#aaa"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Category Filter */}
      <View style={styles.categoryContainer}>
        <FlatList
          horizontal
          data={categories}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.categoryButton, selectedCategory === item.id && styles.selectedCategory]}
              onPress={() => setSelectedCategory(item.id)}
            >
              <Ionicons name={item.icon} size={20} color={selectedCategory === item.id ? "#fff" : "#555"} />
              <Text style={[styles.categoryText, selectedCategory === item.id && styles.selectedCategoryText]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
          showsHorizontalScrollIndicator={false}
        />
      </View>

      {/* Price Range Filter */}
      <View style={styles.sliderContainer}>
        <Text style={styles.priceLabel}>Price Range: ₱{minPrice} - ₱{maxPrice}</Text>
        <Slider
          style={{ width: "100%", height: 40 }}
          minimumValue={0}
          maximumValue={500}
          step={10}
          value={maxPrice}
          onValueChange={(value) => setMaxPrice(Math.max(minPrice, value))}
          minimumTrackTintColor="#f56a79"
          maximumTrackTintColor="#ddd"
        />
      </View>

      {/* Product List */}
      {loading ? (
        <ActivityIndicator size="large" color="#f56a79" />
      ) : (
        <FlatList
        data={products}
        keyExtractor={(item) => item._id.toString()}
        numColumns={2}
        columnWrapperStyle={styles.row}
        ListEmptyComponent={<Text style={styles.emptyMessage}>No products found</Text>}
        renderItem={({ item }) => {
          // Extract URLs from images array
          const validImages = item.images?.map((img) => img.url).filter(Boolean);
      
          return (
            <View style={styles.productCard}>
              {/* Product Image */}
              <View style={styles.imageContainer}>
                <Image
                  source={{ uri: validImages?.length > 0 ? validImages[0] : "https://via.placeholder.com/150" }}
                  style={styles.productImage}
                  resizeMode="cover"
                />
              </View>
      
              {/* Product Info */}
              <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.productCategory}>{item.category}</Text>
                <Text style={styles.productPrice}>₱{Number(item.price).toLocaleString()}</Text>
              </View>
            </View>
          );
        }}
      />      
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 20 },
  searchContainer: { flexDirection: "row", alignItems: "center", backgroundColor: "#f2f2f2", borderRadius: 8, padding: 10 },
  searchIcon: { marginRight: 5 },
  searchInput: { flex: 1, fontSize: 14, color: "#333" },
  categoryContainer: { flexDirection: "row", marginVertical: 10 },
  categoryButton: { flexDirection: "row", alignItems: "center", padding: 8, marginRight: 10, backgroundColor: "#f8f8f8", borderRadius: 6 },
  selectedCategory: { backgroundColor: "#f56a79" },
  categoryText: { marginLeft: 5, fontSize: 14, color: "#555" },
  selectedCategoryText: { color: "#fff" },
  sliderContainer: { marginVertical: 10 },
  priceLabel: { fontSize: 16, fontWeight: "bold", marginBottom: 5 },
  row: { flex: 1, justifyContent: "space-between" },
  productCard: { flex: 1, backgroundColor: "#fff", borderRadius: 10, padding: 10, margin: 5, elevation: 3 },
  imageContainer: { width: "100%", height: 150, borderRadius: 10, overflow: "hidden", backgroundColor: "#f2f2f2" },
  productImage: { width: "100%", height: "100%" },
  productInfo: { paddingVertical: 8 },
  productName: { fontSize: 16, fontWeight: "bold", color: "#333" },
  productCategory: { fontSize: 14, color: "#888" },
  productPrice: { fontSize: 16, fontWeight: "bold", color: "#f56a79", marginTop: 5 },
  emptyMessage: { textAlign: "center", color: "#888", marginTop: 20 }
});

export default SearchScreen;
