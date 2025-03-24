import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Button,
} from "react-native";
import axios from "axios";
import { useRouter } from "expo-router"; // ✅ Use Expo Router

const ProductListScreen = () => {
  const [products, setProducts] = useState([]);
  const router = useRouter(); // ✅ Use Expo Router

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get("http://192.168.100.4:4000/api/product/get");
      console.log("Fetched Products:", response.data.products); // ✅ Debugging Step
      setProducts(response.data.products); // ✅ Extract only the "products" array
    } catch (error) {
      console.error("Error fetching products:", error);
      Alert.alert("Error", "Failed to fetch products.");
    }
  };
  
  

  const handleDelete = async (id) => {
    Alert.alert("Confirm Delete", "Are you sure you want to delete this product?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        onPress: async () => {
          try {
            await axios.delete(`http://192.168.100.4:4000/api/product/delete/${id}`);
            Alert.alert("Success", "Product deleted successfully.");
            fetchProducts(); // Refresh list
          } catch (error) {
            console.error("Error deleting product:", error);
            Alert.alert("Error", "Failed to delete product.");
          }
        },
      },
    ]);
  };

  const handleEdit = (productId) => {
    router.push({ pathname: "/pages/admin/EditProduct", params: { productId } });
  };
  

  return (
    <View style={styles.container}>
      <Button title="Add Product" onPress={() => router.push("/pages/admin/AddProduct")} /> {/* ✅ Fix Navigation */}

      <FlatList
        data={products}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Image 
  source={{ uri: item.images?.[0]?.url || item.image || "https://via.placeholder.com/150" }} 
  style={styles.image} 
/>

            <View style={styles.details}>
              <Text style={styles.name}>{item.name}</Text>
              <Text>Category: {item.category}</Text>
              <Text>Price:  ₱{item.price}</Text>
              <Text>Description: {item.description}</Text>
            </View>
            <View style={styles.actions}>
            <TouchableOpacity onPress={() => handleEdit(item._id)} style={styles.editButton}>
  <Text style={styles.actionText}>✏️ Edit</Text>
</TouchableOpacity>


              <TouchableOpacity onPress={() => handleDelete(item._id)} style={styles.deleteButton}>
                <Text style={styles.actionText}>🗑️ Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10, backgroundColor: "#f8f8f8" },
  row: { flexDirection: "row", backgroundColor: "#fff", padding: 10, marginBottom: 10, borderRadius: 8, alignItems: "center" },
  image: { width: 60, height: 60, borderRadius: 8, marginRight: 10 },
  details: { flex: 1 },
  name: { fontSize: 16, fontWeight: "bold" },
  actions: { flexDirection: "row" },
  editButton: { backgroundColor: "#4CAF50", padding: 8, borderRadius: 5, marginRight: 5 },
  deleteButton: { backgroundColor: "#E53935", padding: 8, borderRadius: 5 },
  actionText: { color: "#fff", fontWeight: "bold" },
});

export default ProductListScreen;
