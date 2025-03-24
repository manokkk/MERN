import React, { useState, useEffect } from "react";
import { View, Text, ActivityIndicator, StyleSheet, ScrollView } from "react-native";
import { LineChart } from "react-native-chart-kit";

export default function AdminDashboard() {
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMonthlySalesData();
  }, []);

  const fetchMonthlySalesData = async () => {
    try {
      const response = await fetch("http://192.168.100.4:4000/api/auth/orders/monthly-sales");
      const data = await response.json();
      if (data.salesData) {
        setSalesData(data.salesData);
      } else {
        alert("No sales data available.");
      }
    } catch (error) {
      console.error("Error fetching sales data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Prepare data for the chart
  const chartData = {
    labels: salesData.map((item) => `${item._id.month}/${item._id.year}`), // Month/Year labels
    datasets: [
      {
        data: salesData.map((item) => item.totalSales), // Total sales per month
        color: () => `rgba(75, 192, 192, 1)`, // Line color
        strokeWidth: 2,
      },
    ],
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Admin Dashboard</Text>

      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Monthly Sales</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#0000ff" />
        ) : salesData.length > 0 ? (
          <LineChart
            data={chartData}
            width={350} // Chart width
            height={250} // Chart height
            yAxisLabel="$"
            chartConfig={{
              backgroundColor: "#ffffff",
              backgroundGradientFrom: "#ffffff",
              backgroundGradientTo: "#ffffff",
              decimalPlaces: 2,
              color: (opacity = 1) => `rgba(75, 192, 192, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              style: { borderRadius: 10 },
              propsForDots: { r: "5", strokeWidth: "2", stroke: "#1f78b4" },
            }}
            bezier
            style={styles.chart}
          />
        ) : (
          <Text style={styles.noDataText}>No sales data available for the selected period.</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  chartContainer: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  chart: {
    borderRadius: 10,
  },
  noDataText: {
    textAlign: "center",
    fontSize: 16,
    color: "#888",
    marginTop: 20,
  },
});
