const express = require("express");
const Transaction = require("../models/Transaction");

const router = express.Router();

// Helper function to get month range
const getMonthRange = (month) => {
  const year = new Date().getFullYear();
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);
  return { start, end };
};

// List all transactions with search and pagination

router.get("/transactions", async (req, res) => {
  const { month, search, page = 1, perPage = 10 } = req.query;

  try {
    // Construct the query to filter transactions by month irrespective of year
    const query = {
      $expr: {
        $and: [
          { $eq: [{ $month: "$dateOfSale" }, parseInt(month)] }, // Match month
          // Optionally, match day as well if needed:
          // { $eq: [{ $dayOfMonth: '$dateOfSale' }, dayValue] }
        ],
      },
    };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        // Optionally, add additional fields for search here
      ];
    }

    console.log("Query:", query); // Log the constructed query

    const transactions = await Transaction.find(query)
      .skip((page - 1) * perPage)
      .limit(parseInt(perPage, 10));

    res.status(200).json(transactions);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).send("Error fetching transactions");
  }
});
// Statistics API

router.get("/statistics", async (req, res) => {
  const month = parseInt(req.query.month, 10);

  try {
    const pipeline = [
      {
        $addFields: {
          saleMonth: { $month: "$dateOfSale" }, // Extract month from dateOfSale
        },
      },
      {
        $match: {
          saleMonth: month, // Filter by the specified month
        },
      },
      {
        $group: {
          _id: null,
          totalSaleAmount: {
            $sum: {
              $cond: { if: "$sold", then: "$price", else: 0 },
            },
          },
          totalSoldItems: {
            $sum: {
              $cond: { if: "$sold", then: 1, else: 0 },
            },
          },
          totalNotSoldItems: {
            $sum: {
              $cond: { if: { $not: "$sold" }, then: 1, else: 0 },
            },
          },
        },
      },
    ];

    console.log("Aggregation Pipeline:", JSON.stringify(pipeline)); // Log the aggregation pipeline

    const result = await Transaction.aggregate(pipeline);

    console.log("Aggregation Result:", result); // Log the aggregation result

    if (result.length === 0) {
      // Handle case where no documents match the criteria
      return res
        .status(404)
        .json({ message: "No transactions found for the specified month" });
    }

    // Extract the result from the aggregation response
    const { totalSaleAmount, totalSoldItems, totalNotSoldItems } = result[0];

    res
      .status(200)
      .json({ totalSaleAmount, totalSoldItems, totalNotSoldItems });
  } catch (error) {
    console.error("Error fetching statistics:", error);
    res.status(500).send("Error fetching statistics");
  }
});

router.get("/statistics", async (req, res) => {
  const month = parseInt(req.query.month, 10);
  const { start, end } = getMonthRange(month);

  try {
    const pipeline = [
      {
        $match: {
          dateOfSale: { $gte: start, $lt: end },
        },
      },
      {
        $addFields: {
          saleMonth: { $month: "$dateOfSale" }, // Extract month from dateOfSale
        },
      },
      {
        $match: {
          saleMonth: month, // Filter by the specified month
        },
      },
      {
        $group: {
          _id: null,
          totalSaleAmount: {
            $sum: {
              $cond: { if: "$sold", then: "$price", else: 0 },
            },
          },
          totalSoldItems: {
            $sum: {
              $cond: { if: "$sold", then: 1, else: 0 },
            },
          },
          totalNotSoldItems: {
            $sum: {
              $cond: { if: { $not: "$sold" }, then: 1, else: 0 },
            },
          },
        },
      },
    ];

    console.log("Aggregation Pipeline:", JSON.stringify(pipeline)); // Log the aggregation pipeline

    const result = await Transaction.aggregate(pipeline);

    console.log("Aggregation Result:", result); // Log the aggregation result

    if (result.length === 0) {
      // Handle case where no documents match the criteria
      return res
        .status(404)
        .json({ message: "No transactions found for the specified month" });
    }

    // Extract the result from the aggregation response
    const { totalSaleAmount, totalSoldItems, totalNotSoldItems } = result[0];

    res
      .status(200)
      .json({ totalSaleAmount, totalSoldItems, totalNotSoldItems });
  } catch (error) {
    console.error("Error fetching statistics:", error);
    res.status(500).send("Error fetching statistics");
  }
});

router.get("/bar-chart", async (req, res) => {
  const month = parseInt(req.query.month, 10);

  try {
    const pipeline = [
      {
        $addFields: {
          saleMonth: { $month: "$dateOfSale" }, // Extract month from dateOfSale
        },
      },
      {
        $match: {
          saleMonth: month, // Filter by the specified month
        },
      },
      {
        $bucket: {
          groupBy: "$price",
          boundaries: [
            0,
            101,
            201,
            301,
            401,
            501,
            601,
            701,
            801,
            901,
            Infinity,
          ],
          default: "901-above",
          output: {
            count: { $sum: 1 },
          },
        },
      },
      {
        $project: {
          range: {
            $switch: {
              branches: [
                { case: { $eq: ["$_id", 0] }, then: "0-100" },
                { case: { $eq: ["$_id", 101] }, then: "101-200" },
                { case: { $eq: ["$_id", 201] }, then: "201-300" },
                { case: { $eq: ["$_id", 301] }, then: "301-400" },
                { case: { $eq: ["$_id", 401] }, then: "401-500" },
                { case: { $eq: ["$_id", 501] }, then: "501-600" },
                { case: { $eq: ["$_id", 601] }, then: "601-700" },
                { case: { $eq: ["$_id", 701] }, then: "701-800" },
                { case: { $eq: ["$_id", 801] }, then: "801-900" },
                { case: { $eq: ["$_id", 901] }, then: "901-above" },
              ],
              default: "901-above",
            },
          },
          count: 1,
        },
      },
    ];

    console.log("Aggregation Pipeline:", JSON.stringify(pipeline)); // Log the aggregation pipeline

    const result = await Transaction.aggregate(pipeline);

    console.log("Aggregation Result:", result); // Log the aggregation result

    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching bar chart data:", error);
    res.status(500).send("Error fetching bar chart data");
  }
});
// Pie chart API
router.get("/pie-chart", async (req, res) => {
  const month = parseInt(req.query.month, 10);
  const { start, end } = getMonthRange(month);

  try {
    const transactions = await Transaction.find({
      dateOfSale: { $gte: start, $lte: end },
    });
    const categoryCounts = transactions.reduce((acc, transaction) => {
      acc[transaction.category] = (acc[transaction.category] || 0) + 1;
      return acc;
    }, {});

    const pieChart = Object.keys(categoryCounts).map((category) => ({
      category,
      count: categoryCounts[category],
    }));

    res.status(200).json(pieChart);
  } catch (error) {
    res.status(500).send("Error fetching pie chart data");
  }
});

// Combined API
router.get("/combined", async (req, res) => {
  const { month } = req.query;
  try {
    const [transactions, statistics, barChart, pieChart] = await Promise.all([
      axios.get(`${req.protocol}://${req.get("host")}/api/transactions`, {
        params: { month },
      }),
      axios.get(`${req.protocol}://${req.get("host")}/api/statistics`, {
        params: { month },
      }),
      axios.get(`${req.protocol}://${req.get("host")}/api/bar-chart`, {
        params: { month },
      }),
      axios.get(`${req.protocol}://${req.get("host")}/api/pie-chart`, {
        params: { month },
      }),
    ]);

    res.status(200).json({
      transactions: transactions.data,
      statistics: statistics.data,
      barChart: barChart.data,
      pieChart: pieChart.data,
    });
  } catch (error) {
    res.status(500).send("Error fetching combined data");
  }
});

module.exports = router;
