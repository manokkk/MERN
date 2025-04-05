import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useNavigation } from "@react-navigation/native";
import { useRouter } from "expo-router";
import Toast from "react-native-toast-message";
import * as FileSystem from "expo-file-system";

export default function UserProfile() {
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [newProfilePicture, setNewProfilePicture] = useState<any>(null);

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) {
          navigation.reset({ index: 0, routes: [{ name: "SignupScreen" }] });
          return;
        }

        const response = await axios.post(
          "http://192.168.100.4:4000/api/auth/user",
          { token }
        );

        setUserName(response.data.user.username);
        setUserEmail(response.data.user.email);
        setProfileImage(response.data.user.profilePicture?.url || null);
        setUserId(response.data.user._id);
      } catch (err) {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Failed to fetch user data",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const pickOrCaptureImage = () => {
    Alert.alert("Select Image", "Choose an option", [
      { text: "📷 Take a Picture", onPress: captureImage },
      { text: "🖼️ Choose from Gallery", onPress: pickImage },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  // Function to choose an image from the gallery
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      await handleImageResult(result.assets[0].uri);
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
      await handleImageResult(result.assets[0].uri);
    }
  };

  // Handle image selection and convert to Expo-friendly format
  const handleImageResult = async (uri: string) => {
    const fileType = uri.split(".").pop() || "jpeg";
    const fileName = `profile.${fileType}`;

    // Convert to a format Expo Go can handle
    const fileInfo = await FileSystem.getInfoAsync(uri);
    if (!fileInfo.exists) {
      Alert.alert("Error", "Image file does not exist.");
      return;
    }

    setProfileImage(uri);
    setNewProfilePicture({
      uri: fileInfo.uri,
      name: fileName,
      type: `image/${fileType}`,
    });
  };

  const handleUpdateProfile = async () => {
    const token = await AsyncStorage.getItem("token");
    if (!token) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "No authentication token found.",
      });
      return;
    }

    if (!userId) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "User ID not found.",
      });
      return;
    }

    const formData = new FormData();
    formData.append("username", userName);
    formData.append("email", userEmail);

    if (newProfilePicture) {
      const localUri = newProfilePicture.uri;
      const filename = localUri.split("/").pop();
      const match = /\.(\w+)$/.exec(filename || "");
      const fileType = match ? `image/${match[1]}` : "image/jpeg";

      formData.append("profilePicture", {
        uri: localUri,
        name: filename || "profile.jpg",
        type: fileType,
      });
    }

    try {
      setLoading(true);
      const response = await axios.put(
        `http://192.168.100.4:4000/api/auth/update-profile/${userId}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setProfileImage(`${response.data.user.profilePicture?.url}?t=${Date.now()}`);
      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Profile updated successfully!",
      });
    } catch (err) {
      console.error(
        "Error during user profile update:",
        err.response?.data || err.message
      );
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to update profile.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Logout",
          onPress: async () => {
            await AsyncStorage.removeItem("user");
            await AsyncStorage.removeItem("token");
            router.push("/pages/SignUpScreen");
          },
          style: "destructive"
        }
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5886c2" />
          <Text style={styles.loadingText}>Loading your profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Profile</Text>
        </View>

        <View style={styles.profileSection}>
          <TouchableOpacity onPress={pickOrCaptureImage} style={styles.imageWrapper}>
            <View style={styles.imageContainer}>
              {profileImage ? (
                <Image
                  source={{
                    uri: profileImage,
                  }}
                  style={styles.profileImage}
                />
              ) : (
                <View style={styles.placeholderContainer}>
                  <Text style={styles.placeholderText}>
                    {userName ? userName.charAt(0).toUpperCase() : "U"}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.cameraIconContainer}>
              <Ionicons name="camera" size={18} color="#fff" />
            </View>
          </TouchableOpacity>

          <Text style={styles.displayName}>{userName}</Text>
          <Text style={styles.emailText}>{userEmail}</Text>
        </View>

        <View style={styles.formSection}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Username</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color="#888" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={userName}
                onChangeText={setUserName}
                placeholder="Enter your name"
                placeholderTextColor="#BBBBBB"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email Address</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#888" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={userEmail}
                onChangeText={setUserEmail}
                placeholder="Enter your email"
                keyboardType="email-address"
                placeholderTextColor="#BBBBBB"
                autoCapitalize="none"
              />
            </View>
          </View>

          <TouchableOpacity
            style={styles.updateButton}
            onPress={handleUpdateProfile}
          >
            <Text style={styles.updateButtonText}>Update Profile</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.optionsSection}>
          <TouchableOpacity style={styles.optionItem}>
            <View style={styles.optionIconContainer}>
              <Ionicons name="settings-outline" size={20} color="#5886c2" />
            </View>
            <Text style={styles.optionText}>Settings</Text>
            <Ionicons name="chevron-forward" size={20} color="#CCCCCC" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionItem}>
            <View style={styles.optionIconContainer}>
              <Ionicons name="help-circle-outline" size={20} color="#5886c2" />
            </View>
            <Text style={styles.optionText}>Help & Support</Text>
            <Ionicons name="chevron-forward" size={20} color="#CCCCCC" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={20} color="#5886c2" />
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <Toast />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    color: "#888888",
    fontSize: 16,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#333333",
    alignItems: "center",
    justifyContent: "center",
  },
  profileSection: {
    alignItems: "center",
    paddingVertical: 24,
  },
  imageWrapper: {
    position: "relative",
    marginBottom: 16,
  },
  imageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileImage: {
    width: "100%",
    height: "100%",
    borderRadius: 60,
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  placeholderContainer: {
    width: "100%",
    height: "100%",
    borderRadius: 60,
    backgroundColor: "#FFE5E9",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  placeholderText: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#5886c2",
  },
  cameraIconContainer: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#5886c2",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  displayName: {
    fontSize: 24,
    fontWeight: "700",
    color: "#333333",
    marginBottom: 4,
  },
  emailText: {
    fontSize: 16,
    color: "#888888",
  },
  formSection: {
    paddingHorizontal: 24,
    marginTop: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666666",
    marginBottom: 8,
    paddingLeft: 4,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F8F8",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  inputIcon: {
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: "#333333",
  },
  updateButton: {
    backgroundColor: "#5886c2",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 16,
    shadowColor: "#5886c2",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  updateButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  optionsSection: {
    marginTop: 24,
    paddingHorizontal: 24,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  optionIconContainer: {
    width: 40,
    height: 40,
    backgroundColor: "#acbcd1",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: "#333333",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 24,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "#acbcd1",
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#5886c2",
    marginLeft: 12,
  },
});