import React, { useState } from "react";
import {
    View,
    TextInput,
    TouchableOpacity,
    Image,
    Button,
    StyleSheet,
    Alert,
    Text,
    Platform,
    ScrollView,
} from "react-native";
import axios from "axios";
import * as ImagePicker from "expo-image-picker";
import RNPickerSelect from "react-native-picker-select";

export default function AddProductScreen({ navigation }) {
    const [product, setProduct] = useState({
        name: "",
        category: "Necklaces",
        price: "",
        description: "",
        images: [],
    });

    const categories = ["Smartphones", "Laptops", "Cameras", "Wearables"];

    // Function to pick an image from the gallery
    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
            Alert.alert("Permission Denied", "You need to allow access to your photos.");
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: true,
            quality: 1,
        });

        if (!result.canceled && result.assets?.length > 0) {
            setProduct((prev) => ({
                ...prev,
                images: [...prev.images, ...result.assets],
            }));
        } else {
            Alert.alert("No image selected!");
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
            quality: 1,
        });

        if (!result.canceled && result.assets?.length > 0) {
            setProduct((prev) => ({
                ...prev,
                images: [...prev.images, ...result.assets],
            }));
        } else {
            Alert.alert("No image captured!");
        }
    };

    // Function to show options to the admin (Choose from Gallery or Take Picture)
    const selectImage = () => {
        Alert.alert(
            "Select Image",
            "Choose an option",
            [
                { text: "📷 Take a Picture", onPress: captureImage },
                { text: "🖼️ Choose from Gallery", onPress: pickImage },
                { text: "Cancel", style: "cancel" },
            ]
        );
    };

    // Function to handle product submission
    const handleAddProduct = async () => {
        if (!product.name || !product.category || !product.price || !product.description) {
            Alert.alert("Error", "All fields are required!");
            return;
        }

        if (product.images.length === 0) {
            Alert.alert("Error", "Please select at least one image!");
            return;
        }

        const formData = new FormData();
        formData.append("name", product.name);
        formData.append("category", product.category);
        formData.append("price", product.price);
        formData.append("description", product.description);

        product.images.forEach((image, index) => {
            let uri = image.uri;
            let fileName = uri.split("/").pop();
            let fileType = fileName.includes(".") ? fileName.split(".").pop() : "jpg";

            formData.append(`images`, {
                uri: Platform.OS === "android" ? uri : uri.replace("file://", ""),
                name: `product_image_${index}.${fileType}`,
                type: `image/${fileType}`,
            });
        });

        try {
            const response = await axios.post(
                "http://192.168.100.4:4000/api/product/new",
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                }
            );

            Alert.alert("Success!", "Product added successfully.");
            console.log("✅ Response:", response.data);

            setProduct({
                name: "",
                category: "Necklaces",
                price: "",
                description: "",
                images: [],
            });
        } catch (error) {
            console.error("❌ Error adding product:", error.response?.data || error.message);
            Alert.alert("Error", "Failed to add product. Check console for details.");
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <TextInput
                style={styles.input}
                placeholder="Product Name"
                value={product.name}
                onChangeText={(text) => setProduct({ ...product, name: text })}
            />

            <RNPickerSelect
                onValueChange={(value) => setProduct({ ...product, category: value })}
                items={categories.map((cat) => ({ label: cat, value: cat }))}
                style={{
                    inputIOS: styles.input,
                    inputAndroid: styles.input,
                }}
                placeholder={{ label: "Select a category", value: null }}
                value={product.category}
            />

            <TextInput
                style={styles.input}
                placeholder="Price"
                keyboardType="numeric"
                value={product.price}
                onChangeText={(text) => setProduct({ ...product, price: text })}
            />

            <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Description"
                multiline
                value={product.description}
                onChangeText={(text) => setProduct({ ...product, description: text })}
            />

            <TouchableOpacity style={styles.imagePicker} onPress={selectImage}>
                <Text>Select Image</Text>
            </TouchableOpacity>

            {product.images.map((img, index) => (
                <Image key={index} source={{ uri: img.uri }} style={styles.imagePreview} />
            ))}

            <Button title="Add Product" onPress={handleAddProduct} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flexGrow: 1, padding: 20, justifyContent: "center" },
    input: { borderWidth: 1, borderColor: "#ddd", padding: 10, marginBottom: 10, borderRadius: 5 },
    textArea: { height: 100, textAlignVertical: "top" },
    imagePicker: { padding: 10, backgroundColor: "#ddd", alignItems: "center", marginBottom: 10 },
    imagePreview: { width: 100, height: 100, alignSelf: "center", marginBottom: 10, borderRadius: 10 },
});
