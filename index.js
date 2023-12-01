const express = require('express');
const cors = require('cors');
// const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express();
require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KET);
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
    const PublisherCollection = client.db('newspaper').collection('publisher');
   
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
// publisher Collection

app.post('/publisher', async(req,res)=>{
  const publisher = req.body;
  const query = {name:publisher.name}
      const ExistingUser = await PublisherCollection.findOne(query);
      if(ExistingUser){
        return res.send({message: 'Publisher Already Exists',insertedId: null})
      }
  const result = await PublisherCollection.insertOne(publisher);
  res.send(result);
})


    app.get('/publisher',async(req,res)=>{
      const result = await  PublisherCollection.find().toArray();
    res.send(result);
    })


  // Premium Article Collection
  app.post('/premiumArticle', async(req,res)=>{
    const article = req.body;
    const query = {title:article.title}
    const ExistingUser = await PremiumArticleCollection.findOne(query);
    if(ExistingUser){
      return res.send({message: 'Article Already Exists',insertedId: null})
    }
    const result = await PremiumArticleCollection.insertOne(article);
    res.send(result);
  })

  app.get('/premiumArticle',async (req,res)=>{
    const result = await  PremiumArticleCollection.find().toArray();
    res.send(result);
  });

  // User API 
    

      
      app.get('/users', async (req,res)=>{
        const result = await  UsersCollection.find().toArray();
        res.send(result);
      })
      app.get('/users/pagination',async (req,res)=>{
        const query = req.query;
        const page = query.page;
        console.log(page);
       const pageNumber = parseInt(page);
        const perPage = 5;
        const skip = pageNumber * perPage ;
        const users = UsersCollection.find().skip(skip).limit(perPage);
      const result = await  users.toArray();
      const UsersCount = await   UsersCollection.countDocuments();
      res.send({result,UsersCount});
    });

    // cheak Admin 
    
    app.get('/users/profile/:email',async (req,res)=>{
      const email = req.params.email;
  
  const result = await UsersCollection.find({email}).toArray();
  res.send(result)
    })
    app.put('/users/profile/:email',async(req,res)=>{
      const email = req.params.email;
      const filter = {email:email}
      const options = {upsert:true}
      const updatedProduct = req.body;

      const Product = {
        $set: {
          name:updatedProduct.name,
          photo:updatedProduct.photo,
          
        }
      }

      const result = await UsersCollection.updateOne(filter,Product,options);
      res.send(result);
    })


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

    app.patch('/users/person/:id', async (req,res)=>{
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)};
      const UpdatedDoc = {
        $set :{
          premium: 'premium'
        }
      }
      const result = await UsersCollection.updateOne(filter,UpdatedDoc);
      res.send(result);
    } ) 

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

    //  Article Part 
   
    // app.get('/article', async (req,res)=>{
    //   const result = await  ArticleCollection.find().toArray();
    //   res.send(result);
    // })

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
    // Add Article
    app.post('/article',async (req,res)=>{
      const item = req.body;
      const result = await ArticleCollection.insertOne(item);
      res.send(result);
    })


    app.get('/article/premium', async(req,res)=>{
      const query = req.query;
      const page = query.page; 
      console.log(page);
      const pageNumber = parseInt(page);
      const perPage = 3;
      
      const skip = pageNumber * perPage ;
      const articles =  ArticleCollection.find().skip(skip).limit(perPage);
      const result = await articles.toArray();
      const ArticleCount = await   ArticleCollection.countDocuments();
      console.log(ArticleCount);
      res.send({result,ArticleCount});
      
  });

  app.delete('/article/premium/:id', async(req,res)=>{
     const id = req.params.id;
     const query = {_id: new ObjectId(id)}
     const result = await ArticleCollection.deleteOne(query);
     res.send(result);
  });

  app.get('/article/add/:email',async (req,res)=>{
    const email = req.params.email;
    const result = await ArticleCollection.find({email}).toArray();
    res.send(result)
  });
  app.delete('/article/add/:id',async(req,res)=>{
    const id = req.params.id;
     const query = {_id: new ObjectId(id)}
     const result = await ArticleCollection.deleteOne(query);
     res.send(result);
  });
  app.put('/article/add/:id',async(req,res)=>{
    const id = req.params.id;
      const filter = {_id:id}
      const options = {upsert:true}
      const updatedProduct = req.body;

      const Product = {
        $set: {
          title:updatedProduct.title,
          
          
        }
      }

      const result = await ArticleCollection.updateOne(filter,Product,options);
      res.send(result);
  })
   
  // Payment Method 
   app.post('/create-payment-intent', async (req,res)=>{
    const { price } = req.body;
    const amount = parseInt(price * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: 'usd',
      payment_method_types: ['card']
    });
    res.send({
      clientSecret: paymentIntent.client_secret
    })
   })
    

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