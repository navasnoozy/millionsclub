const loadDashboard = async (req, res) => {
  try {
    // Fetch orders statistics
    const totalOrders = await Order.countDocuments();
    
    const pendingOrders = await Order.aggregate([
      {
        $match: { status: "Pending" }
      },
      {
        $group: {
          _id: null,
          orderCount: { $sum: 1 },
          totalAmount: { $sum: "$totalPrice" }
        }
      }
    ]);

    const processingOrders = await Order.countDocuments({ status: "Processing" });
    const deliveredOrders = await Order.countDocuments({ status: "Delivered" });
    
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select("invoiceNumber quantity createdAt customerName totalPrice paymentMethod status");

    res.render("dashboard", {
      title: "Dashboard | Admin",
      totalOrders,
      pendingOrders: pendingOrders[0] || { orderCount: 0, totalAmount: 0 },
      processingOrders,
      deliveredOrders,
      recentOrders,
      // Existing data fetching logic (todayOrders, yesterdayOrders, etc.)
    });
  } catch (error) {
    console.error(error.message);
  }
};
