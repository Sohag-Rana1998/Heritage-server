const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();

const port = process.env.PORT || 5000;

// middleware
app.use(express.json());

app.use(
  cors({
    origin: ["http://localhost:5173"],
  })
);

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.iulixph.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const propertiesCollection = client
      .db("RealStateDb")
      .collection("properties");
    const wishlistCollection = client.db("RealStateDb").collection("wishlist");
    const reviewsCollection = client.db("RealStateDb").collection("reviews");

    app.get("/all-properties", async (req, res) => {
      const result = await propertiesCollection.find().toArray();
      res.send(result);
    });

    // all  property by query
    app.get("/properties", async (req, res) => {
      const page = parseInt(req.query.page) - 1;
      const size = parseInt(req.query.size);
      const search = req.query.search;
      const maxPrice = parseInt(req.query.maxPrice);
      const minPrice = parseInt(req.query.minPrice);
      let query = {};
      if (search)
        query = {
          location: { $regex: search, $options: "i" },
        };

      if (maxPrice > 0 && minPrice > 0) {
        query = {
          minimumPrice: { $gte: minPrice },
          maximumPrice: { $lte: maxPrice },
        };
      }
      const result = await propertiesCollection
        .find(query)
        .skip(page * size)
        .limit(size)
        .toArray();
      res.send(result);
    });

    // Get  count for pagination
    app.get("/count-properties", async (req, res) => {
      const status = req.query.status;
      const search = req.query.search;
      const maxPrice = parseInt(req.query.maxPrice);
      const minPrice = parseInt(req.query.minPrice);

      let query = {
        status: status,
      };
      if (search)
        query = {
          location: { $regex: search, $options: "i" },
          status: status,
        };
      if (maxPrice > 0 && minPrice > 0) {
        query = {
          minimumPrice: { $gte: minPrice },
          maximumPrice: { $lte: maxPrice },
        };
      }

      const count = await propertiesCollection.countDocuments(query);
      console.log(count);
      res.send({ count });
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Heritage server is running");
});

app.listen(port, () => {
  console.log(`Heritage server server is running on port ${port}`);
});
