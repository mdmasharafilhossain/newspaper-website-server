const express = require('express');
const cors = require('cors');
// const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express();
require('dotenv').config()
const port = process.env.PORT || 5000;

// middleware 
app.use(cors());
app.use(express.json());




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.lzichn4.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection

    // await client.db("admin").command({ ping: 1 });

    const ArticleCollection = client.db('newspaper').collection('articles');
    const UsersCollection = client.db('newspaper').collection('users');
    const PremiumArticleCollection = client.db('newspaper').collection('PremiumArticle');
   
  //   app.get('/article', async(req,res)=>{
  //     // const filter = req.query;
  //     // const query = {
  //     //     title:{$regex:filter.search, $options:'i'}
  //     // }
  //     const cursor = ArticleCollection.find();
  //     const result = await cursor.toArray();
  //     res.send(result);
  // });
  // jwt related API
  // app.post('/jwt', async(req,res)=>{
  //   const user = req.body;
  //   const token = jwt.sign(user,process.env.ACCESS_TOKEN_SECRET,{
  //     expiresIn:'1hr'});
  //     res.send({ token });
  // })
// ACCESS_TOKEN_SECRET=15f485a6a00b73dc30e1b0fa44402b915a97dc766bd1b188bea27274335f4d1d8d8fada936f5b61e3aed6344c5047742258135a92ce1638838b6da58cf7565d4

  // User API 
    app.get('/users',async (req,res)=>{
      const result = await  UsersCollection.find().toArray();
      res.send(result);
    });

    // cheak Admin 

    app.get('/users/admin/:email',async (req,res)=>{
      const email = req.params.email;
      const query = { email: email };
      const user = await UsersCollection.findOne(query);
      let admin = false;
      if(user){
        admin = user?.role == 'admin';
      }
      res.send({ admin });
    })

    // Admin Fucntionality 
    app.patch('/users/admin/:id', async (req,res)=>{
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)};
      const UpdatedDoc = {
        $set :{
          role: 'admin'
        }
      }
      const result = await UsersCollection.updateOne(filter,UpdatedDoc);
      res.send(result);
    } ) 




    app.post('/users', async(req,res)=>{
      const user = req.body;
      // cheaking user 
      const query = {email:user.email}
      const ExistingUser = await UsersCollection.findOne(query);
      if(ExistingUser){
        return res.send({message: 'user Already Exists',insertedId: null})
      }
      const result = await UsersCollection.insertOne(user);
      res.send(result);
    })


    app.get('/article', async(req,res)=>{
        const filter = req.query;
        const searchQuery = filter.search && typeof filter.search === 'string' ? filter.search : '';
        const query = {
            title:{$regex:searchQuery, $options:'i'}
        }
        const cursor = ArticleCollection.find(query);
        const result = await cursor.toArray();
        res.send(result);
    });
    // app.get('/article/:id',async(req,res)=>{
    //   const id =req.params.id;
    //   const query = {_id : new ObjectId(id)}
    //   const result = await ArticleCollection.findOne(query);
    //   res.send(result);
      
    // });
    

    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/',(req,res)=>{
    res.send('Server Running Successfully');
});

app.listen(port,()=>{
    console.log(`Server Running at Port ${port}`)
});