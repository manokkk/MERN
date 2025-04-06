import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, Image, Alert, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import * as WebBrowser from "expo-web-browser";
import { useAuthRequest, makeRedirectUri } from "expo-auth-session";
import { UserContext } from "../../context/UserContext";
import { CartContext } from "../../context/CartContext";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_CLIENT_ID = "740216799410-uojjhmbufqumhisp275enpcdvlmbh1jt.apps.googleusercontent.com";
const FACEBOOK_APP_ID = "1364898534515169";

export default function SignUpScreen() {
  const router = useRouter();
  const [isRegistering, setIsRegistering] = useState(false);
  const [user, setUser] = useState({ username: "", email: "", password: "" });
  const [profileImage, setProfileImage] = useState(null);
  const [error, setError] = useState("");
  const navigation = useNavigation();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  useEffect(() => {
    const requestPermissions = async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        alert("Camera roll permissions are required!");
      }
    };
    requestPermissions();

    // Check if user is already logged in
    checkLoggedInUser();
  }, []);

  const checkLoggedInUser = async () => {
    try {
      const userData = await AsyncStorage.getItem("user");
      if (userData) {
        const parsedUser = JSON.parse(userData);
        if (parsedUser.role === "admin") {
          router.replace("/pages/admin/AdminDashboard");
        } else {
          router.replace("/pages/UserProfile");
        }
      }
    } catch (error) {
      console.error("Error checking logged-in user:", error);
    }
  };

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setProfileImage(result.assets[0].uri);
      } else {
        console.log("No image selected");
      }
    } catch (error) {
      console.error("Image selection error:", error);
    }
  };

  const handleSubmit = async () => {
    console.log("Sending data:", user.email, user.password); // Debugging
  
    try {
      const url = isRegistering
        ? "http://192.168.0.159:4000/api/auth/register"
        : "http://192.168.0.159:4000/api/auth/login";
  
      let requestData;
  
      if (isRegistering) {
        // No profile picture is being sent
        requestData = {
          username: user.username,
          email: user.email,
          password: user.password,
        };
      } else {
        requestData = { email: user.email, password: user.password };
      }
  
      const response = await axios.post(url, requestData, {
        headers: {
          "Content-Type": "application/json", // Always use JSON for now
        },
      });
  
      console.log("Response:", response.data);
  
      await AsyncStorage.setItem("user", JSON.stringify(response.data.user));
      await AsyncStorage.setItem("token", response.data.token);
  
      Alert.alert("Success", isRegistering ? "Registration successful!" : "Login successful!");
  
      if (!isRegistering) {
        if (response.data.user.role === "admin") {
          router.replace("/pages/admin/AdminDashboard");
        } else {
          router.replace("/pages/UserProfile");
        }
      }
    } catch (error) {
      console.error("Error:", error.response?.data);
      setError(error.response?.data?.message || "Something went wrong");
    }
  };
  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.container}>
            <LinearGradient
              colors={['#ffffff', '#fff0f3']}
              style={styles.gradientBackground}
            />
            
            <View style={styles.headerContainer}>
              <Image 
                source={require('../../assets/images/logos.png')} 
                style={styles.logo}
                resizeMode="contain"
              />
              <Text style={styles.title}>{isRegistering ? "Create Account" : "Welcome Back"}</Text>
              <Text style={styles.subtitle}>
                {isRegistering 
                  ? "Please fill in the details to get started" 
                  : "Sign in to sync your Gadget Galazy"
                }
              </Text>
            </View>

            {isRegistering && (
              <>

<TouchableOpacity style={styles.imagePicker} onPress={handlePickImage}>
                  {profileImage ? (
                    <View style={styles.profileImageContainer}>
                      <Image source={{ uri: profileImage }} style={styles.profileImage} />
                      <View style={styles.editIconContainer}>
                        <Ionicons name="camera" size={16} color="white" />
                      </View>
                    </View>
                  ) : (
                    <View style={styles.emptyProfileContainer}>
                      <Ionicons name="person-add" size={30} color="#5886c2" />
                      <Text style={styles.imagePlaceholder}>Add Photo</Text>
                    </View>
                  )}
                </TouchableOpacity>
                
                <View style={styles.inputContainer}>
                  <Ionicons name="person-outline" size={20} color="#5886c2" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Your name"
                    placeholderTextColor="#aaa"
                    value={user.username}
                    onChangeText={(text) => setUser({ ...user, username: text })}
                  />
                </View>

                
              </>
            )}

            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#5886c2" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#aaa"
                keyboardType="email-address"
                autoCapitalize="none"
                value={user.email}
                onChangeText={(text) => setUser({ ...user, email: text })}
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#5886c2" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#aaa"
                secureTextEntry={!isPasswordVisible}
                value={user.password}
                onChangeText={(text) => setUser({ ...user, password: text })}
              />
              <TouchableOpacity onPress={togglePasswordVisibility} style={styles.eyeIcon}>
                <Ionicons 
                  name={isPasswordVisible ? "eye-off-outline" : "eye-outline"} 
                  size={20} 
                  color="#5886c2" 
                />
              </TouchableOpacity>
            </View>
            
            {!isRegistering && (
              <TouchableOpacity style={styles.forgotPassword}>
                <Text style={styles.forgotPasswordText}>Forgot password?</Text>
              </TouchableOpacity>
            )}

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <TouchableOpacity style={styles.button} onPress={handleSubmit}>
              <LinearGradient
                colors={['#5886c2', '#153d72']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}
              >
                <Text style={styles.buttonText}>{isRegistering ? "Create Account" : "Sign In"}</Text>
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.divider} />
            </View>

            <View style={styles.socialButtonsContainer}>
              <TouchableOpacity style={[styles.socialButton, styles.googleButton]}>
                <Ionicons name="logo-google" size={20} color="#ffffff" />
                <Text style={styles.socialButtonText}>Google</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={[styles.socialButton, styles.facebookButton]}>
                <Ionicons name="logo-facebook" size={20} color="#ffffff" />
                <Text style={styles.socialButtonText}>Facebook</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={styles.toggleContainer} 
              onPress={() => setIsRegistering(!isRegistering)}
            >
              <Text style={styles.toggleTextNormal}>
                {isRegistering ? "Already have an account? " : "Don't have an account? "}
              </Text>
              <Text style={styles.toggleTextBold}>
                {isRegistering ? "Sign In" : "Create Account"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: "#ffffff",
    position: "relative",
  },
  gradientBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#5886c2",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#888",
    textAlign: "center",
    marginBottom: 10,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#f0f0f0",
    height: 54,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  inputIcon: {
    marginLeft: 15,
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 54,
    paddingHorizontal: 5,
    fontSize: 16,
    color: "#333",
  },
  eyeIcon: {
    padding: 10,
    marginRight: 5,
  },
  imagePicker: {
    alignItems: "center",
    marginBottom: 20,
    marginTop: 5,
  },
  profileImageContainer: {
    position: "relative",
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: "#5886c2",
  },
  editIconContainer: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#5886c2",
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#ffffff",
  },
  emptyProfileContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#fff0f3",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#5886c2",
    borderStyle: "dashed",
  },
  imagePlaceholder: {
    fontSize: 14,
    color: "#5886c2",
    marginTop: 5,
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: "#5886c2",
    fontSize: 14,
  },
  button: {
    borderRadius: 12,
    marginTop: 5,
    overflow: "hidden",
    height: 54,
  },
  buttonGradient: {
    height: 54,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  error: {
    color: "#ff3b30",
    textAlign: "center",
    marginBottom: 15,
    fontSize: 14,
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: "#e0e0e0",
  },
  dividerText: {
    color: "#888",
    paddingHorizontal: 10,
    fontSize: 14,
  },
  socialButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  socialButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    width: "48%",
    height: 48,
  },
  googleButton: {
    backgroundColor: "#DB4437",
  },
  facebookButton: {
    backgroundColor: "#1877F2",
  },
  socialButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 8,
  },
  toggleContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 5,
  },
  toggleTextNormal: {
    fontSize: 15,
    color: "#888",
  },
  toggleTextBold: {
    fontSize: 15,
    color: "#5886c2",
    fontWeight: "600",
  }
});