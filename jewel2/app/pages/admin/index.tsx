import { useRouter } from "expo-router";
import { View, Button } from "react-native";

export default function AdminDashboard() {
  const router = useRouter();

  return (
    <View>
      <Button title="Go to Products" onPress={() => router.push("/pages/admin/Products")} />
      <Button title="Add Product" onPress={() => router.push("/pages/admin/AddProduct")} />
      <Button title="Orders" onPress={() => router.push("/pages/admin/AdminOrders")} />
    </View>
  );
}
