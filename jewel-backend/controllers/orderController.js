const mongoose = require('mongoose');
const Order = require('../models/order');
const Product = require('../models/product');
const User = require('../models/user'); // Ensure user validation
const axios = require('axios');

exports.getAcceptedOrders = async (req, res) => {
    try {
        // 1. Get and log the incoming user ID
        const { userId } = req.params;
        console.log('[Order Controller] Received userId:', userId);
        console.log('Request details:', {
            method: req.method,
            url: req.originalUrl,
            params: req.params,
            query: req.query
        });

        // 2. Validate the user ID format
        if (!userId) {
            console.error('Missing userId parameter');
            return res.status(400).json({
                success: false,
                message: "User ID is required"
            });
        }

        if (!/^[0-9a-fA-F]{24}$/.test(userId)) {
            console.error('Invalid userId format:', userId);
            return res.status(400).json({
                success: false,
                message: "Invalid user ID format"
            });
        }

        // 3. Log the query being executed
        console.log('Executing query for:', {
            user: userId,
            orderStatus: 'Approved'
        });

        // 4. Fetch orders with additional logging
        const orders = await Order.find({ 
            user: userId,
            orderStatus: 'Approved'
        })
        .populate('orderItems.product', 'name images price')
        .sort({ createdAt: -1 })
        .lean(); // Using lean() for better logging

        console.log(`Found ${orders.length} orders for user ${userId}`);
        if (orders.length > 0) {
            console.log('Sample order:', {
                _id: orders[0]._id,
                status: orders[0].orderStatus,
                itemCount: orders[0].orderItems.length
            });
        }

        // 5. Send response
        res.status(200).json({
            success: true,
            orders
        });

    } catch (error) {
        console.error('[Order Controller] Error:', {
            message: error.message,
            stack: error.stack,
            receivedUserId: req.params.userId
        });
        res.status(500).json({ 
            success: false,
            message: 'Server error while fetching orders',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
exports.createOrder = async (req, res) => {
    try {
        console.log("Request Body:", req.body);  // Debug userId issue

        const { userId, orderItems, shippingInfo, itemsPrice, taxPrice, shippingPrice, totalPrice, modeOfPayment } = req.body;

        // 🔴 Ensure `userId` is present before proceeding
        if (!userId) {
            return res.status(400).json({ success: false, message: "User ID is required" });
        }

        // ✅ Create order
        const newOrder = new Order({
            user: userId,  // ✅ Ensure it uses "user", NOT "userId"
            orderItems,
            shippingInfo,
            itemsPrice,
            taxPrice,
            shippingPrice,
            totalPrice,
            modeOfPayment,
            orderStatus: "Processing",
        });
        

        await newOrder.save();

        return res.status(201).json({ success: true, message: "Order placed successfully!", order: newOrder });
    } catch (error) {
        console.error("Order creation failed:", error);
        return res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
};



exports.getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find()
        .populate('orderItems.product')   
        .populate('user', 'name email');  // ✅ Correct: "user" matches the schema
     // Populating user details
        console.log('Fetched Orders:', orders); // Log the fetched orders to check

        if (!orders || orders.length === 0) {
            return res.status(404).json({ message: 'No orders found.' });
        }

        res.status(200).json({ orders }); // Send orders wrapped in an object
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// exports.updateOrderStatus = async (req, res) => {
//     const { orderId } = req.params;
//     const { status } = req.body;

//     // Validate the status value
//     if (!['Processing', 'Approved', 'Canceled'].includes(status)) {
//         return res.status(400).json({ message: 'Invalid status value. Must be Processing, Approved, or Canceled.' });
//     }

//     try {
//         // Update using correct field name `orderStatus`
//         const updatedOrder = await Order.findByIdAndUpdate(orderId, { orderStatus: status }, { new: true });

//         if (!updatedOrder) {
//             return res.status(404).json({ message: 'Order not found.' });
//         }

//         res.status(200).json({ message: 'Order status updated successfully.', order: updatedOrder });
//     } catch (error) {
//         console.error('Error updating order status:', error);
//         res.status(500).json({ message: 'Server Error' });
//     }
// };

exports.updateOrderStatus = async (req, res) => {
    const { orderId } = req.params;
    const { status, expoPushToken } = req.body; // Receive the push token

    if (!['Processing', 'Approved', 'Canceled'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status value.' });
    }

    try {
        const updatedOrder = await Order.findByIdAndUpdate(orderId, { orderStatus: status }, { new: true });

        if (!updatedOrder) {
            return res.status(404).json({ message: 'Order not found.' });
        }

        // Send push notification
        if (expoPushToken) {
            await axios.post('https://exp.host/--/api/v2/push/send', {
                to: expoPushToken,
                sound: "default",
                title: "Order Status Updated",
                body: `Your order #${orderId} is now ${status}.`,
            });
        }

        res.status(200).json({ message: 'Order status updated successfully.', order: updatedOrder });
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};


exports.deleteOrder = async (req, res) => {
    const { orderId } = req.params;

    try {
        // Find and delete the order
        const deletedOrder = await Order.findByIdAndDelete(orderId);

        if (!deletedOrder) {
            return res.status(404).json({ message: 'Order not found.' });
        }

        res.status(200).json({ message: 'Order deleted successfully.' });
    } catch (error) {
        console.error('Error deleting order:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};


exports.getMonthlySales = async (req, res) => {
    try {
        const salesData = await Order.aggregate([
            {
                $match: {
                    status: 'Completed', // Only consider completed orders
                }
            },
            {
                $group: {
                    _id: { 
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" }
                    },
                    totalSales: { $sum: "$totalPrice" }
                }
            },
            {
                $sort: { "_id.year": 1, "_id.month": 1 } // Sort by year and month
            }
        ]);

        if (!salesData || salesData.length === 0) {
            return res.status(404).json({ message: 'No sales data found.' });
        }

        res.status(200).json({ salesData });
    } catch (error) {
        console.error('Error fetching monthly sales data:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.getUserOrders = async (req, res) => {
    try {
        const userId = req.params.userId; // Get user ID from request params

        // Find orders where the user field matches the given userId
        const orders = await Order.find({ user: userId })
            .populate('orderItems.product')   // Populate product details
            .populate('user', 'name email');  // Populate user details

        if (!orders || orders.length === 0) {
            return res.status(404).json({ message: 'No orders found for this user.' });
        }

        res.status(200).json({ orders }); // Send orders wrapped in an object
    } catch (error) {
        console.error('Error fetching user orders:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// exports.getUserOrder = async (req, res) => {
//     const { userId, status } = req.query;

//     try {
//         // Construct the query object
//         const query = {};
//         if (userId) query.userId = userId; // Filter by userId
//         if (status) query.status = status; // Filter by order status

//         const orders = await Order.find(query)
//             .populate('orderItems.product') // Populate product details
//             .populate('userId', 'name email'); // Populate user details

//         if (!orders || orders.length === 0) {
//             return res.status(404).json({ message: 'No orders found.' });
//         }

//         // Flatten the orders to have one product per row
//         const formattedOrders = orders.flatMap(order =>
//             order.orderItems.map(item => ({
//                 orderId: order._id,
//                 product: item.product, // Populated product details
//                 quantity: item.quantity,
//                 totalPrice: order.totalPrice,
//                 user: order.userId, // Populated user details
//                 status: order.status,
//                 createdAt: order.createdAt,
//             }))
//         );

//         res.status(200).json({ orders: formattedOrders });
//     } catch (error) {
//         console.error('Error fetching orders:', error);
//         res.status(500).json({ message: 'Server Error' });
//     }
// };







