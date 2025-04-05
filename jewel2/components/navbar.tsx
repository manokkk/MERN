import React, { useContext, useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Image,
  Animated,
  Dimensions
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { UserContext } from "../context/UserContext";
import { CartContext } from "../context/CartContext";


// Create a context to manage the sidebar state globally
export const SidebarContext = React.createContext({
  isOpen: false,
  toggleSidebar: () => { },
});

// Create a SidebarProvider component
export const SidebarProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => {
    setIsOpen(prev => !prev);
  };

  return (
    <SidebarContext.Provider value={{ isOpen, toggleSidebar }}>
      {children}
    </SidebarContext.Provider>
  );
};

export function TopNavbar() {
  const router = useRouter();
  const { cart } = useContext(CartContext);
  const { toggleSidebar } = useContext(SidebarContext);
  const [searchQuery, setSearchQuery] = useState("");

  const navigateTo = (path) => {
    if (router?.push) {
      router.push(path);
    } else {
      console.warn("Navigation attempted before the router was ready");
    }
  };

  const handleSearch = () => {
    // Navigate to the product list page with the search query
    router.push("/pages/SearchScreen", { search: searchQuery });
  };

  return (
    <LinearGradient colors={["#ffffff", "#ffffff"]} style={styles.topNavbar}>
      <TouchableOpacity onPress={toggleSidebar} style={styles.hamburgerIcon}>
        <Ionicons name="menu-outline" size={28} color="#000" />
      </TouchableOpacity>

      <View style={styles.logoContainer}>
        <Image source={require("../assets/images/logos.png")} style={styles.logo} />
        <Text style={styles.logoName}>Gadget Galaxy</Text>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={18} color="#888" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search..."
          placeholderTextColor="#aaa"
          value={searchQuery}
          onChangeText={handleSearch}  // Call handleSearch on every keystroke
        />
      </View>

      <TouchableOpacity style={styles.cartContainer} onPress={() => navigateTo("/pages/Cart")}>
        <Ionicons name="cart-outline" size={28} color="#000" />
        {cart && cart.length > 0 && (
          <View style={styles.cartBadge}>
            <Text style={styles.cartBadgeText}>
              {cart.reduce((total, item) => total + item.quantity, 0)}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </LinearGradient>
  );
}

export function Sidebar() {
  const router = useRouter();
  const { user } = useContext(UserContext);
  const { isOpen, toggleSidebar } = useContext(SidebarContext);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeItem, setActiveItem] = useState('home');
  const sidebarAnimation = useState(new Animated.Value(-280))[0];
  const overlayAnimation = useState(new Animated.Value(0))[0];

  const screenHeight = Dimensions.get('window').height;

  useEffect(() => {
    if (user && user.role) {
      setIsAdmin(user.role === "admin");
    } else {
      setIsAdmin(false);
    }
  }, [user]);

  // Control animations based on isOpen state
  useEffect(() => {
    if (isOpen) {
      Animated.parallel([
        Animated.timing(sidebarAnimation, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(overlayAnimation, {
          toValue: 0.5,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(sidebarAnimation, {
          toValue: -280,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(overlayAnimation, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isOpen, sidebarAnimation, overlayAnimation]);

  const navigateTo = (path, itemName) => {
    if (router?.push) {
      setActiveItem(itemName);
      router.push(path);
      toggleSidebar(); // Close sidebar after navigation
    } else {
      console.warn("Navigation attempted before the router was ready");
    }
  };

  const SidebarItem = ({ icon, label, onPress, name }) => (
    <TouchableOpacity
      style={[
        styles.sidebarItem,
        activeItem === name && styles.activeItem
      ]}
      onPress={() => onPress(name)}
    >
      <View style={styles.iconWrapper}>
        <Ionicons name={icon} size={22} color={activeItem === name ? "black" : "#5886c2"} />
      </View>
      <Text style={[
        styles.sidebarText,
        activeItem === name && styles.activeItemText
      ]}>
        {label}
      </Text>
      {activeItem === name && (
        <View style={styles.activeDot} />
      )}
    </TouchableOpacity>
  );

  return (
    <>
      {/* Overlay that appears when sidebar is open */}
      {isOpen && (
        <Animated.View
          style={[
            styles.overlay,
            {
              opacity: overlayAnimation,
              height: screenHeight
            }
          ]}
          onTouchStart={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <Animated.View
        style={[
          styles.sidebar,
          {
            transform: [{ translateX: sidebarAnimation }],
            height: screenHeight
          }
        ]}
      >
        <LinearGradient
          colors={['#ffffff', '#fff2f6']}
          style={styles.sidebarBackground}
        />

        <View style={styles.sidebarHeader}>
          <Image source={require("../assets/images/logos.png")} style={styles.sidebarLogo} />
          <Text style={styles.sidebarTitle}>Gadget Galaxy</Text>
          <TouchableOpacity style={styles.closeButton} onPress={toggleSidebar}>
            <Ionicons name="close-outline" size={28} color="#000" />
          </TouchableOpacity>
        </View>

        {user && (
          <View style={styles.userSection}>
            <View style={styles.avatarContainer}>
              <Image
                source={user.avatar ? { uri: user.profilePicture } : require("../assets/images/adaptive-icon.png")}
                style={styles.avatar}
              />
              <View style={styles.userStatus} />
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user.username || "Guest User"}</Text>
              <Text style={styles.userRole}>{isAdmin ? "Administrator" : "Customer"}</Text>
            </View>
          </View>
        )}

        <View style={styles.divider} />

        <View style={styles.sidebarContent}>
          <SidebarItem
            icon="home-outline"
            label={isAdmin ? "Dashboard" : "Home"}
            onPress={() => navigateTo(isAdmin ? "/pages/admin/AdminDashboard" : "/", "home")}
            name="home"
          />

          {isAdmin ? (
            <>
              <SidebarItem
                icon="cube-outline"
                label="Products"
                onPress={() => navigateTo("/pages/admin/Products", "products")}
                name="products"
              />

              <SidebarItem
                icon="people-outline"
                label="Users"
                onPress={() => navigateTo("/pages/Users", "users")}
                name="users"
              />

              <SidebarItem
                icon="clipboard-outline"
                label="Orders"
                onPress={() => navigateTo("/pages/admin/AdminOrders", "orders")}
                name="orders"
              />
            </>
          ) : (
            <>
              {/* <SidebarItem 
                icon="diamond-outline" 
                label="Collections" 
                onPress={() => navigateTo("/pages/Collections", "collections")} 
                name="collections"
              /> */}

              <SidebarItem
                icon="bookmark-outline"
                label="Favorites"
                onPress={() => navigateTo("/pages/Favorites", "favorites")}
                name="favorites"
              />

              <SidebarItem
                icon="clipboard-outline"
                label="Orders"
                onPress={() => navigateTo("/pages/Orders", "orders")}
                name="orders"
              />
            </>
          )}

          <SidebarItem
            icon="person-outline"
            label="Profile"
            onPress={() => navigateTo(user ? "/pages/UserProfile" : "/pages/SignUpScreen", "profile")}
            name="profile"
          />
          // In your Sidebar component, within the non-admin section
<SidebarItem 
  icon="star-outline" 
  label="Reviews" 
  onPress={() => navigateTo("/pages/Reviews", "reviews")} 
  name="reviews"
/>

          {/* <SidebarItem 
            icon="settings-outline" 
            label="Settings" 
            onPress={() => navigateTo("/pages/Settings", "settings")} 
            name="settings"
          /> */}
        </View>

        {/* <View style={styles.sidebarFooter}>
          <LinearGradient 
            colors={['#ff6b98', '#ff92b3']} 
            style={styles.footerGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons name="diamond" size={20} color="#fff" />
            <Text style={styles.footerText}>Premium Jewels</Text>
            <Ionicons name="chevron-forward" size={16} color="#fff" />
          </LinearGradient>
        </View> */}
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  topNavbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    zIndex: 1,
  },
  hamburgerIcon: {
    padding: 5,
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  logo: {
    width: 30,
    height: 30,
    marginRight: 8,
    borderRadius: 15,
  },
  logoName: {
    color: "#000",
    fontSize: 20,
    fontWeight: "bold",
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f4f4f4",
    borderRadius: 10,
    paddingHorizontal: 10,
    marginLeft: 10,
  },
  searchIcon: {
    marginRight: 5,
  },
  searchInput: {
    flex: 1,
    color: "#000",
    fontSize: 16,
  },
  cartContainer: {
    position: "relative",
    marginLeft: 15,
  },
  cartBadge: {
    position: "absolute",
    top: -5,
    right: -10,
    backgroundColor: "#5886c2",
    borderRadius: 10,
    width: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  cartBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "#000",
    zIndex: 998,
  },
  sidebar: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 280,
    backgroundColor: "white",
    zIndex: 999,
    paddingTop: 40,
    paddingHorizontal: 0,
    shadowColor: "#000",
    shadowOffset: {
      width: 2,
      height: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    overflow: 'hidden',
  },
  sidebarBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  sidebarHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    paddingHorizontal: 15,
    paddingBottom: 10,
  },
  sidebarLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  sidebarTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginLeft: 10,
    flex: 1,
    color: '#153d72',
  },
  closeButton: {
    padding: 5,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#5886c2',
  },
  userStatus: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#fff',
  },
  userInfo: {
    marginLeft: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  userRole: {
    fontSize: 12,
    color: '#153d72',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#5886c2',
    marginHorizontal: 15,
    marginBottom: 15,
  },
  sidebarContent: {
    flex: 1,
    paddingHorizontal: 10,
  },
  sidebarItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 15,
    marginVertical: 4,
    borderRadius: 12,
    position: 'relative',
  },
  activeItem: {
    backgroundColor: '#5886c2',
  },
  iconWrapper: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#fff',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#153d72',
  },
  sidebarText: {
    fontSize: 15,
    color: '#555',
    fontWeight: '500',
  },
  activeItemText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  activeDot: {
    position: 'absolute',
    right: 15,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
  },
  sidebarFooter: {
    padding: 15,
    paddingBottom: 25,
  },
  footerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderRadius: 12,
  },
  footerText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});