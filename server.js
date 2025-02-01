const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const app = express();
const { ObjectId } = require('mongodb');
const cors = require("cors");
const FormData = require('form-data');

app.use(express.json());
app.use(cors());


const multer = require('multer');

// Configure multer for file upload
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


const MONGODB_URI = process.env.MONGODB_URI;
const PORT = process.env.PORT || 3000;

// MongoDB connection
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const bcrypt = require('bcrypt');




//code for blogs start



const blogsSchemaNew = new mongoose.Schema({
  url: String,
  title: String,
  text: String,
  blogDate: Date
});

const BlogsTejasvi = mongoose.model('BlogsTejasvi', blogsSchemaNew);

app.post('/uploadBlogFmma', upload.single('image'), async (req, res) => {
  const formData = new FormData();
  const { default: fetch } = await import('node-fetch');
  formData.append('image', req.file.buffer.toString('base64'));

  const response = await fetch('https://api.imgbb.com/1/upload?key=368cbdb895c5bed277d50d216adbfa52', {
    method: 'POST',
    body: formData,
  });

  const data = await response.json();

  const imageUrl = data.data.url;
  const { title, text , blogDate } = req.body; // Destructure title and text from req.body

  // Save the image URL, title, and text to the database
  const newBlog = new BlogsTejasvi({ url: imageUrl, title: title, text: text, blogDate: blogDate });
  await newBlog.save();
  res.status(200).send('Blog uploaded successfully');
});


app.get('/blogFmma/:objectId', async (req, res) => {
  const { objectId } = req.params;

  try {
    const user = await BlogsTejasvi.findById(objectId);
    if (user) {
      res.status(200).json(user);
    } else {
      res.status(404).json({ message: 'Blog not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});


app.delete('/blogtodeleteFmma/:id', async (req, res) => {
  const { id } = req.params;
  console.log('Received DELETE request for blog ID:', id);
  try {
    const blog = await BlogsTejasvi.findByIdAndDelete(id);
    
    res.status(200).json({ message: 'Data deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});



// Define route for fetching images
app.get('/blogsFmma', async (req, res) => {
  const images = await BlogsTejasvi.find();
  res.send(images);
});

// Define route for updating a blog
app.put('/updateBlogFmma/:id', upload.single('image'), async (req, res) => {
  const { id } = req.params;

  try {
    // Check if the blog exists
    const existingBlog = await BlogsTejasvi.findById(id);
    if (!existingBlog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    // Update the blog fields
    const { title, text, blogDate } = req.body;

    // Check if keepImage flag is set
    let imageUrl;
    if (req.body.keepImage === 'true') {
      imageUrl = existingBlog.url; // Keep the previous image URL
    } else {
      // Upload image to ImgBB
      const formData = new FormData();
      const { default: fetch } = await import('node-fetch');
      formData.append('image', req.file.buffer.toString('base64'));

      const response = await fetch('https://api.imgbb.com/1/upload?key=368cbdb895c5bed277d50d216adbfa52', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      imageUrl = data.data.url;
    }

    existingBlog.url = imageUrl;
    existingBlog.title = title || existingBlog.title;
    existingBlog.text = text || existingBlog.text;
    existingBlog.blogDate = blogDate || existingBlog.blogDate;

    // Save the updated blog
    await existingBlog.save();

    res.status(200).json({ message: 'Blog updated successfully', updatedBlog: existingBlog });
  } catch (error) {
    console.error('Error updating blog:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


//code for blogs end








const tejassviBlogAdminSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  });
const TejassviBlogAdmin = new mongoose.model("TejassviBlogAdmin", tejassviBlogAdminSchema);




//Routes
app.post('/api/login/tejassvi', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await TejassviBlogAdmin.findOne({ email: email });

    if (user) {
      const passwordMatch = await bcrypt.compare(password, user.password);

      if (passwordMatch) {
        const objectId = user._id.toString();
        res.status(200).json({ message: 'Login successful', objectId: objectId });
      } else {
        res.status(401).json({ message: 'Invalid password' });
      }
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/register/tejassvi', async (req, res) => {
  
  const { name, email, password } = req.body; // Destructure title and text from req.body
console.log(name);

  try {
    const existingUser = await TejassviBlogAdmin.findOne({ email: email });

    if (existingUser) {
      res.status(409).json({ message: 'User already exists' });
    } else {
      const hashedPassword = await bcrypt.hash(password, 10); // Hash the password

      const newUser = new TejassviBlogAdmin({
        name: name,
        email: email,
        password: hashedPassword,
        
      });

      await newUser.save();
      res.status(200).json({ message: 'Registration successful', userName: name , userEmail: email });
    }
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

























// Campaign Schema
const campaignSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  imageUrl: { type: String, required: true },
  imageDeleteId: { type: String, required: true }, // For deleting image from Cloudinary
});

const Campaign = mongoose.model('Campaign', campaignSchema);

// Create a new campaign
app.post('/campaigns', upload.single('image'), async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    // Upload image to Cloudinary
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder: 'campaigns' },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      ).end(req.file.buffer);
    });

    // Create a new campaign
    const campaign = new Campaign({
      title,
      description,
      imageUrl: result.secure_url,
      imageDeleteId: result.public_id,
    });

    await campaign.save();

    res.status(201).json({ message: 'Campaign created successfully', campaign });
  } catch (error) {
    console.error('Error creating campaign:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all campaigns
app.get('/campaigns', async (req, res) => {
  try {
    const campaigns = await Campaign.find();
    res.status(200).json(campaigns);
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a campaign by ID
app.get('/campaigns/:id', async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    res.status(200).json(campaign);
  } catch (error) {
    console.error('Error fetching campaign:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a campaign by ID
app.put('/campaigns/:id', upload.single('image'), async (req, res) => {
  try {
    const { title, description } = req.body;
    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    // If a new image is uploaded, replace the old one
    if (req.file) {
      // Delete the old image from Cloudinary
      if (campaign.imageDeleteId) {
        await cloudinary.uploader.destroy(campaign.imageDeleteId);
      }

      // Upload the new image to Cloudinary
      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { folder: 'campaigns' },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        ).end(req.file.buffer);
      });

      // Update image details
      campaign.imageUrl = result.secure_url;
      campaign.imageDeleteId = result.public_id;
    }

    // Update other fields
    campaign.title = title || campaign.title;
    campaign.description = description || campaign.description;

    await campaign.save();

    res.status(200).json({ message: 'Campaign updated successfully', campaign });
  } catch (error) {
    console.error('Error updating campaign:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a campaign by ID
app.delete('/campaigns/:id', async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    // Delete the image from Cloudinary
    if (campaign.imageDeleteId) {
      await cloudinary.uploader.destroy(campaign.imageDeleteId);
    }

    // Delete the campaign from the database
    await campaign.deleteOne();

    res.status(200).json({ message: 'Campaign deleted successfully' });
  } catch (error) {
    console.error('Error deleting campaign:', error);
    res.status(500).json({ message: 'Server error' });
  }
});





// Product Schema
const productSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  imageUrl: { type: String, required: true },
  imageDeleteId: { type: String, required: true }, // For deleting image from Cloudinary
});

const Product = mongoose.model('Product', productSchema);

// Create a new product
app.post('/products', upload.single('image'), async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    // Upload image to Cloudinary
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder: 'products' },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      ).end(req.file.buffer);
    });

    // Create a new product
    const product = new Product({
      title,
      description,
      imageUrl: result.secure_url,
      imageDeleteId: result.public_id,
    });

    await product.save();

    res.status(201).json({ message: 'Product created successfully', product });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all products
app.get('/products', async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a product by ID
app.get('/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.status(200).json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a product by ID
app.put('/products/:id', upload.single('image'), async (req, res) => {
  try {
    const { title, description } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // If a new image is uploaded, replace the old one
    if (req.file) {
      if (product.imageDeleteId) {
        await cloudinary.uploader.destroy(product.imageDeleteId);
      }

      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { folder: 'products' },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        ).end(req.file.buffer);
      });

      product.imageUrl = result.secure_url;
      product.imageDeleteId = result.public_id;
    }

    product.title = title || product.title;
    product.description = description || product.description;

    await product.save();

    res.status(200).json({ message: 'Product updated successfully', product });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a product by ID
app.delete('/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product.imageDeleteId) {
      await cloudinary.uploader.destroy(product.imageDeleteId);
    }

    await product.deleteOne();

    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


















app.get("/", (req,res) =>{
  res.send("Backend server for Blogs has started running successfully...");
});

const server = app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
  });
  
