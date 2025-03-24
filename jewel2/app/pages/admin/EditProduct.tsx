import React, { useEffect, useState } from "react";
import { 
  View, Text, TextInput, Button, Image, Alert, 
  StyleSheet, TouchableOpacity, ScrollView
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Picker } from "@react-native-picker/picker";

const EditProductScreen = () => {
  const { productId } = useLocalSearchParams();
  const router = useRouter();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState([]); // Store existing images
  const [newImages, setNewImages] = useState([]); // Store new images

  useEffect(() => {
    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  const fetchProduct = async () => {
    try {
      const response = await axios.get(`http://192.168.100.4:4000/api/product/${productId}`);
      const productData = response.data.product;

      console.log("Fetched Product:", productData);

      setProduct(productData);
      setName(productData.name);
      setPrice(productData.price.toString());
      setDescription(productData.description);
      setCategory(productData.category || "");
      setImages(productData.images || []);
    } catch (error) {
      console.error("Error fetching product:", error);
      Alert.alert("Error", "Failed to fetch product.");
    } finally {
      setLoading(false);
    }
  };

  const pickOrCaptureImage = () => {
    Alert.alert(
        "Select Image",
        "Choose an option",
        [
            { text: "📷 Take a Picture", onPress: captureImage },
            { text: "🖼️ Choose from Gallery", onPress: pickImages },
            { text: "Cancel", style: "cancel" },
        ]
    );
};

// Function to pick images from gallery
const pickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
    });

    if (!result.canceled) {
        setNewImages([...newImages, ...result.assets.map(asset => ({
            uri: asset.uri,
            name: `product_${Date.now()}.jpg`,
            type: "image/jpeg"
        }))]);
    }
};

// Function to capture an image using the camera
const captureImage = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
        Alert.alert("Permission Denied", "You need to allow camera access.");
        return;
    }

    const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
    });

    if (!result.canceled) {
        setNewImages([...newImages, {
            uri: result.assets[0].uri,
            name: `product_${Date.now()}.jpg`,
            type: "image/jpeg"
        }]);
    }
};


  const handleUpdate = async () => {
    const formData = new FormData();
    formData.append("name", name);
    formData.append("price", price);  
    formData.append("description", description);
    formData.append("category", category);

    newImages.forEach((image, index) => {
      formData.append(`newImages`, {
        uri: image.uri,
        name: `product_image_${index}.jpg`,
        type: "image/jpeg",
      });
    });

    console.log("🔹 FormData before sending:", [...formData.entries()]);

    try {
        const response = await axios.put(
            `http://192.168.100.4:4000/api/product/update/${productId}`,
            formData,
            { headers: { "Content-Type": "multipart/form-data", "Accept": "application/json", } }
        );

        console.log("✅ Update Response:", response.data);
        Alert.alert("Success", "Product updated successfully.");
    } catch (error) {
        console.error("❌ Error updating product:", error.message);
        Alert.alert("Error", "Failed to update product.");
    }
};

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Edit Product</Text>

      {/* Existing Images */}
      <View style={styles.imageGallery}>
        {images.map((img, index) => (
          <Image key={index} source={{ uri: img.url }} style={styles.image} />
        ))}
      </View>

      {/* New Images Preview */}
      <View style={styles.imageGallery}>
        {newImages.map((img, index) => (
          <Image key={index} source={{ uri: img.uri }} style={styles.image} />
        ))}
      </View>

      {/* Image Picker */}
      <TouchableOpacity onPress={pickOrCaptureImage} style={styles.imageContainer}>
    <Ionicons name="camera-outline" size={30} color="#fff" style={styles.cameraIcon} />
</TouchableOpacity>


      <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Product Name" />
      <TextInput style={styles.input} value={price} onChangeText={setPrice} keyboardType="numeric" placeholder="Price" />
      <TextInput style={styles.input} value={description} onChangeText={setDescription} placeholder="Description" />

      <Picker selectedValue={category} onValueChange={(itemValue) => setCategory(itemValue)}>
        <Picker.Item label="Select Category" value="" />
        <Picker.Item label="Necklaces" value="Necklaces" />
        <Picker.Item label="Earrings" value="Earrings" />
        <Picker.Item label="Bracelets" value="Bracelets" />
      </Picker>

      <Button title="Update Product" onPress={handleUpdate} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, backgroundColor: "#f8f8f8" },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 20 },
  imageGallery: { flexDirection: "row", flexWrap: "wrap", marginBottom: 10 },
  imageContainer: { alignSelf: "center", marginBottom: 20 },
  image: { width: 100, height: 100, margin: 5, borderRadius: 10 },
  cameraIcon: { position: "absolute", bottom: 5, right: 5, backgroundColor: "#000", padding: 5, borderRadius: 20 },
  input: { borderWidth: 1, padding: 10, marginBottom: 15, borderRadius: 5, backgroundColor: "#fff" },
});

export default EditProductScreen;
