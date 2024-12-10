const express = require("express");
const { MongoClient, ServerApiVersion } = require("mongodb");
const app = express();
const port = process.env.PORT || 3000;
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();
app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  })
);
app.use(express.json());
const uri = `mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PASSWORD}@cluster0.rgxjhma.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const UserCollection = client.db("Vocabulary_Ninja").collection("Users");

async function run() {
  try {
    // my code

    app.post("/register", async (req, res) => {
      try {
        const { name, email, password } = req.body;
        const existingUser = await UserCollection.findOne({ email });
        if (existingUser) {
          return res.send({ status: 400, message: "Email Already Existed" });
        }

        const hashPassword = await bcrypt.hash(password, 14);
        const newUser = {
          name,
          email,
          password: hashPassword,
          userRole: "user",
        };

        const result = await UserCollection.insertOne(newUser);

        const token = jwt.sign(
          {
            id: result.insertedId,
            email: newUser.email,
            role: newUser.userRole,
          },
          process.env.JWT_SECRET,
          { expiresIn: "1d" }
        );

        res.send({ token, message: "Register Successfully Finish" });
      } catch (error) {
        res.status(500).send({ message: "Internal Server Error" });
      }
    });

    app.get("/login", async (req, res) => {
      try {
        const { email, password } = req.body;
        const existedUser = await UserCollection.findOne({ email });
        if (!existedUser) {
          return res.send({
            message: "Invalid Email or Password",
            status: 400,
          });
        }
        const isMatch = await bcrypt.compare(password, existedUser.password);
        if (!isMatch) {
          return res.send({
            message: "Invalid Email or Password",
            status: 400,
          });
        }
        if (!password === existedUser.password) {
          return res.send({
            message: "Invalid Email or Password",
            status: 400,
          });
        }
        const token = jwt.sign(
          { id: user._id, role: user.role },
          process.env.JWT_SECRET,
          { expiresIn: "1d" }
        );
        res.send({ message: "successfully login", token, status: 200 });
      } catch (error) {
        res.send({ message: "login failed", status: 500 });
      }
    });

    const VerificationToken = (req, res, next) => {
      const authHeader = req.headers["authorization"];
      if (!authHeader) {
        return res
          .status(401)
          .send({ status: 401, message: "No token provided" });
      }

      const token = authHeader.split(" ")[1];
      if (!token) {
        return res
          .status(401)
          .send({ status: 401, message: "Token not found" });
      }

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
      } catch (error) {
        return res.status(403).send({ status: 403, message: "Invalid token" });
      }
    };

    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("vocabulary-ninja is running");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
