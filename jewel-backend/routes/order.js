const express = require('express')
const router = express.Router();

const {createOrder, 
    getAllOrders, 
    updateOrderStatus, 
    deleteOrder,
    getMonthlySales,
    getUserOrders, getAcceptedOrders } = require('../controllers/orderController')

router.post('/new',  createOrder);
router.get('/get', getAllOrders);
router.put('/:orderId/status', updateOrderStatus);
router.delete('/:orderId', deleteOrder);
router.get('/monthly-sales', getMonthlySales);  
router.get("/get/:userId", getUserOrders); 
router.get("/accepted", getAcceptedOrders); 
module.exports = router;