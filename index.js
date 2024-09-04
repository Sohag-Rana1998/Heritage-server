const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();

const port = process.env.PORT || 5000;

// middleware
app.use(express.json());

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://heritage-nest-by-sohag.netlify.app",
    ],
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
    // await client.connect();

    const propertiesCollection = client
      .db("RealStateDb")
      .collection("properties");
    const wishlistCollection = client.db("RealStateDb").collection("wishlist");
    const reviewsCollection = client.db("RealStateDb").collection("reviews");

    // Get all property
    app.get("/all-properties", async (req, res) => {
      const result = await propertiesCollection.find().toArray();
      res.send(result);
    });

    // all  property by query
    app.get("/properties", async (req, res) => {
      const page = parseInt(req.query.page) - 1;
      const size = parseInt(req.query.size);
      const search = req.query.search;
      const location = req.query.location;
      const maxPrice = parseInt(req.query.maxPrice);
      const minPrice = parseInt(req.query.minPrice);
      console.log(search, location);
      let query = {};

      if (search) {
        query.title = { $regex: search, $options: "i" };
      }
      if (location) {
        query.location = { $regex: location, $options: "i" };
      }

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
      const count = await propertiesCollection.countDocuments(query);
      res.send({ result, count });
    });

    // Get property by id
    app.get("/property/:id", async (req, res) => {
      const id = req.params.id;
      const query = {
        _id: new ObjectId(id),
      };
      const result = await propertiesCollection.findOne(query);
      res.send(result);
    });

    // Get property by email
    app.get("/seller-properties", async (req, res) => {
      const email = req.query.email;
      const query = {
        sellerEmail: email,
      };
      const result = await propertiesCollection.find(query).toArray();
      res.send(result);
    });

    app.post("/add-property", async (req, res) => {
      const property = req.body;
      const result = await propertiesCollection.insertOne(property);
      res.send(result);
    });

    // update a property in db
    app.put("/property/:id", async (req, res) => {
      const id = req.params.id;
      const propertyData = req.body;
      const query = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          ...propertyData,
        },
      };
      const result = await propertiesCollection.updateOne(
        query,
        updateDoc,
        options
      );
      res.send(result);
    });

    app.delete("/delete-property/:id", async (req, res) => {
      const id = req.params.id;
      const query = {
        _id: new ObjectId(id),
      };
      const result = await propertiesCollection.deleteOne(query);
      res.send(result);
    });

    // all reviews get for public
    app.get("/all-reviews", async (req, res) => {
      const result = await reviewsCollection
        .find()
        .sort({ date: -1 })
        .toArray();
      res.send(result);
    });

    // await client.db("admin").command({ ping: 1 });
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
