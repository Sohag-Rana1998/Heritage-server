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
      //   console.log(count);
      res.send({ count });
    });

    app.get("/property/:id", async (req, res) => {
      const id = req.params.id;
      const query = {
        _id: new ObjectId(id),
      };
      const result = await propertiesCollection.findOne(query);
      res.send(result);
    });

    app.post("/add-property", async (req, res) => {
      const property = req.body;
      const result = await propertiesCollection.insertOne(property);
      res.send(result);
    });

    // get wishlist data by query
    app.get("/wishlist", async (req, res) => {
      const email = req.query.email;
      const query = {
        buyerEmail: email,
      };
      const result = await wishlistCollection.find(query).toArray();
      res.send(result);
    });

    // get review data by query
    app.get("/reviews", async (req, res) => {
      const email = req.query.email;
      const query = {
        email: email,
      };
      const result = await reviewsCollection.find(query).toArray();
      res.send(result);
    });

    // add to wishlist
    app.post("/wishlist-property", async (req, res) => {
      const propertyData = req.body;
      const query = {
        propertyId: propertyData?.propertyId,
        buyerEmail: propertyData?.buyerEmail,
      };
      const property = await wishlistCollection.findOne(query);
      // console.log(property);
      if (property) {
        return res.send({ message: "Property already added to your wishlist" });
      }
      const result = await wishlistCollection.insertOne(propertyData);
      res.send(result);
    });

    // add  reviews
    app.post("/add-review", async (req, res) => {
      const review = req.body;
      const result = await reviewsCollection.insertOne(review);
      res.send(result);
    });

    // update a property in db
    app.put("/property/:id", async (req, res) => {
      const id = req.params.id;
      const jobData = req.body;
      const query = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          ...jobData,
        },
      };
      const result = await propertiesCollection.updateOne(
        query,
        updateDoc,
        options
      );
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

    // delete property
    app.delete("/property/:id", async (req, res) => {
      const id = req.params.id;
      const query = {
        _id: new ObjectId(id),
      };
      const result = await propertiesCollection.deleteOne(query);
      res.send(result);
    });

    // remove from wishlist
    app.delete("/wishlist/:id", async (req, res) => {
      const id = req.params.id;
      const query = {
        _id: new ObjectId(id),
      };
      const result = await wishlistCollection.deleteOne(query);
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
