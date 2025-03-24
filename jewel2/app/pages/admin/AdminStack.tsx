import { createStackNavigator } from "@react-navigation/stack";
import AdminDashboard from "./AdminDashboard";
import AddProductScreen from "./AddProduct";
import ProductListScreen from "./Products";
import EditProduct from "./EditProduct";
// import Orders from "./Orders";

const Stack = createStackNavigator();

export default function AdminStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
      <Stack.Screen name="ProductListScreen" component={ProductListScreen} />
      <Stack.Screen name="AddProductScreen" component={AddProductScreen} />
      <Stack.Screen name="EditProductScreen" component={EditProduct} />
      {/* <Stack.Screen name="OrdersScreen" component={Orders} /> */}
    </Stack.Navigator>
  );
}
