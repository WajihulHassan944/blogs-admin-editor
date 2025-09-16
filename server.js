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





const productSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  imageUrl: { type: String, required: true },
  imageDeleteId: { type: String, required: true },
});

const Product = mongoose.model('Product', productSchema);

// Create a new product
app.post('/products', upload.single('image'), async (req, res) => {
  try {
    const { title, description, category } = req.body;

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
      category,
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
    const { title, description,category } = req.body;
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
    product.category = category || product.category;

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





app.post("/send-data-myportfolio", (req, res) => {
  const { name, email, message, subject } = req.body;
  const nodemailer = require("nodemailer");

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: 'vascularbundle43@gmail.com',
      pass: 'isolyuxlbwlpdjty',
    },
  });

  const storeMailOptions = {
    from: email,
    to: "marcus@allcountyfl.com",
    subject: `New Inquiry from ${name}: ${subject}`,
    html: `
      <center><img src="https://res.cloudinary.com/dqi6vk2vn/image/upload/v1745166923/g0pa3czkoka36sznjjz1.png" alt="All County Construction Logo" style="width: 170px; "></center>

      <center><h2 style="color: #3A3A3A; font-family: Arial, sans-serif; font-size: 24px; font-weight: bold; margin-bottom: 20px;">New Contact Form Submission</h2></center>

      <p style="color: #3A3A3A; font-family: Arial, sans-serif; font-size: 16px;">You’ve received a new inquiry from the website contact form:</p>
      <p style="color: #3A3A3A; font-family: Arial, sans-serif; font-size: 16px;"><strong>Name:</strong> ${name}</p>
      <p style="color: #3A3A3A; font-family: Arial, sans-serif; font-size: 16px;"><strong>Email:</strong> ${email}</p>
      <p style="color: #3A3A3A; font-family: Arial, sans-serif; font-size: 16px;"><strong>Subject:</strong> ${subject}</p>
      <hr style="border: 0.5px solid #ccc;">
      <p style="color: #3A3A3A; font-family: Arial, sans-serif; font-size: 16px;"><strong>Message:</strong></p>
      <p style="color: #3A3A3A; font-family: Arial, sans-serif; font-size: 16px; line-height: 1.5;">${message}</p>
    `,
  };

  const userMailOptions = {
    from: "marcus@allcountyfl.com",
    to: email,
    subject: "Thank You for Contacting All County Construction",
    html: `
      <center><img src="https://res.cloudinary.com/dqi6vk2vn/image/upload/v1745166923/g0pa3czkoka36sznjjz1.png" alt="All County Construction Logo" style="width: 170px; "></center>

      <center><h2 style="color: #3A3A3A; font-family: Arial, sans-serif; font-size: 24px; font-weight: bold;">Hi ${name},</h2></center>

      <p style="color: #3A3A3A; font-family: Arial, sans-serif; font-size: 16px; line-height: 1.5;">Thank you for reaching out to <strong>All County Construction Services Inc.</strong> We’ve received your message and our team will review it shortly.</p>
      
      <p style="color: #3A3A3A; font-family: Arial, sans-serif; font-size: 16px; margin-top: 10px;"><strong>Your message:</strong></p>
      <p style="color: #3A3A3A; font-family: Arial, sans-serif; font-size: 16px; line-height: 1.5;">"${message}"</p>

      <p style="color: #3A3A3A; font-family: Arial, sans-serif; font-size: 16px; line-height: 1.5;">We appreciate your interest and will get back to you as soon as possible. If you need immediate assistance, feel free to call us directly at +(407) 686 3865.</p>

      <p style="color: #3A3A3A; font-family: Arial, sans-serif; font-size: 16px; line-height: 1.5;">Best regards,<br><strong>All County Construction Services Inc.</strong><br>Winter Haven, FL<br><a href="mailto:marcus@allcountyfl.com" style="color: #149ddd;">marcus@allcountyfl.com</a></p>
    `
  };

  transporter.sendMail(storeMailOptions, function(error, storeInfo) {
    if (error) {
      console.error(error);
      res.status(500).send("Error sending email to store");
    } else {
      console.log("Email sent to store: " + storeInfo.response);

      transporter.sendMail(userMailOptions, function(error, userInfo) {
        if (error) {
          console.error(error);
          res.status(500).send("Error sending email to user");
        } else {
          console.log("Email sent to user: " + userInfo.response);
          res.status(200).send("Form submitted successfully");
        }
      });
    }
  });
});


















const constructionBlogSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  imageUrl: { type: String, required: true },
  imageDeleteId: { type: String, required: true },
});

const ConstructionBlog = mongoose.model('ConstructionBlog', constructionBlogSchema);

// Create a new construction blog
app.post('/api/construction/blogs', upload.single('image'), async (req, res) => {
  try {
    const { title, description, category } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder: 'constructionBlogs' },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      ).end(req.file.buffer);
    });

    const constructionBlog = new ConstructionBlog({
      title,
      description,
      category,
      imageUrl: result.secure_url,
      imageDeleteId: result.public_id,
    });

    await constructionBlog.save();

    res.status(201).json({ message: 'Construction blog created successfully', constructionBlog });
  } catch (error) {
    console.error('Error creating construction blog:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all construction blogs
app.get('/api/construction/blogs', async (req, res) => {
  try {
    const blogs = await ConstructionBlog.find();
    res.status(200).json(blogs);
  } catch (error) {
    console.error('Error fetching construction blogs:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a construction blog by ID
app.get('/api/construction/blogs/:id', async (req, res) => {
  try {
    const blog = await ConstructionBlog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({ message: 'Construction blog not found' });
    }

    res.status(200).json(blog);
  } catch (error) {
    console.error('Error fetching construction blog:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a construction blog by ID
app.put('/api/construction/blogs/:id', upload.single('image'), async (req, res) => {
  try {
    const { title, description, category } = req.body;
    const blog = await ConstructionBlog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({ message: 'Construction blog not found' });
    }

    if (req.file) {
      if (blog.imageDeleteId) {
        await cloudinary.uploader.destroy(blog.imageDeleteId);
      }

      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { folder: 'constructionBlogs' },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        ).end(req.file.buffer);
      });

      blog.imageUrl = result.secure_url;
      blog.imageDeleteId = result.public_id;
    }

    blog.title = title || blog.title;
    blog.description = description || blog.description;
    blog.category = category || blog.category;

    await blog.save();

    res.status(200).json({ message: 'Construction blog updated successfully', blog });
  } catch (error) {
    console.error('Error updating construction blog:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a construction blog by ID
app.delete('/api/construction/blogs/:id', async (req, res) => {
  try {
    const blog = await ConstructionBlog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({ message: 'Construction blog not found' });
    }

    if (blog.imageDeleteId) {
      await cloudinary.uploader.destroy(blog.imageDeleteId);
    }

    await blog.deleteOne();

    res.status(200).json({ message: 'Construction blog deleted successfully' });
  } catch (error) {
    console.error('Error deleting construction blog:', error);
    res.status(500).json({ message: 'Server error' });
  }
});











// ================== Schema ==================
const blogsSchemaDaniel = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  image: { type: String, required: true },
  category: { type: String },
  date: { type: Date, default: Date.now },
});

const BlogDaniel = mongoose.model("BlogDaniel", blogsSchemaDaniel);

// ================== APIs ==================
// 1. Create BlogDaniel
app.post("/daniel/blogs", upload.single("image"), async (req, res) => {
  try {
    const { title, description, category } = req.body;
    let imageUrl = "";

    if (req.file) {
      const uploadResult = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream({ folder: "blogs" }, (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
        stream.end(req.file.buffer); // ✅ fix here
      });
      imageUrl = uploadResult.secure_url;
    } else {
      return res.status(400).json({ error: "Image is required" });
    }

    const blogDaniel = new BlogDaniel({ title, description, image: imageUrl, category });
    await blogDaniel.save();
    res.json(blogDaniel);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Get All BlogDaniel
app.get("/daniel/blogs", async (req, res) => {
  try {
    const blogs = await BlogDaniel.find().sort({ date: -1 });
    res.json(blogs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Get BlogDaniel by ID
app.get("/daniel/blogs/:id", async (req, res) => {
  try {
    const blogDaniel = await BlogDaniel.findById(req.params.id);
    if (!blogDaniel) return res.status(404).json({ error: "BlogDaniel not found" });
    res.json(blogDaniel);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Update BlogDaniel
app.put("/daniel/blogs/:id", upload.single("image"), async (req, res) => {
  try {
    const { title, description, category } = req.body;
    let updateData = { title, description, category };

    if (req.file) {
      const uploadResult = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream({ folder: "blogs" }, (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
        req.file.stream.pipe(stream);
      });
      updateData.image = uploadResult.secure_url;
    }

    const blogDaniel = await BlogDaniel.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!blogDaniel) return res.status(404).json({ error: "BlogDaniel not found" });
    res.json(blogDaniel);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Delete BlogDaniel
app.delete("/daniel/blogs/:id", async (req, res) => {
  try {
    const blogDaniel = await BlogDaniel.findByIdAndDelete(req.params.id);
    if (!blogDaniel) return res.status(404).json({ error: "BlogDaniel not found" });
    res.json({ message: "BlogDaniel deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});








// ================== Schema ==================
const bannerSchemaDaniel = new mongoose.Schema({
  logo: {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
  },
  name: { type: String, required: true },
  description: { type: String, required: true },
  subDescription: { type: String },
  profileImage: {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
  },
  resumePdf: {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
  },
  linkedUrl: { type: String },
  date: { type: Date, default: Date.now },
});

const BannerDaniel = mongoose.model("BannerDaniel", bannerSchemaDaniel);

// ================== APIs ==================

// Helper: upload to Cloudinary
const uploadToCloudinary = (file, folder, resourceType = "auto") => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: resourceType },
      (err, result) => {
        if (err) reject(err);
        else resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    stream.end(file.buffer);
  });
};

// Helper: delete from Cloudinary
const deleteFromCloudinary = async (publicId, resourceType = "image") => {
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  } catch (err) {
    console.error("Cloudinary delete error:", err);
  }
};

// 1. Upsert Banner (always overwrite)
app.post(
  "/daniel/banner",
  upload.fields([
    { name: "logo", maxCount: 1 },
    { name: "profileImage", maxCount: 1 },
    { name: "resumePdf", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const { name, description, subDescription, linkedUrl } = req.body;

      // check existing banner
      const existingBanner = await BannerDaniel.findOne();

      let logo, profileImage, resumePdf;

      if (req.files["logo"]) {
        logo = await uploadToCloudinary(req.files["logo"][0], "banner/logo");
        if (existingBanner?.logo?.publicId) {
          await deleteFromCloudinary(existingBanner.logo.publicId, "image");
        }
      } else if (existingBanner?.logo) {
        logo = existingBanner.logo;
      }

      if (req.files["profileImage"]) {
        profileImage = await uploadToCloudinary(req.files["profileImage"][0], "banner/profile");
        if (existingBanner?.profileImage?.publicId) {
          await deleteFromCloudinary(existingBanner.profileImage.publicId, "image");
        }
      } else if (existingBanner?.profileImage) {
        profileImage = existingBanner.profileImage;
      }

      if (req.files["resumePdf"]) {
        resumePdf = await uploadToCloudinary(req.files["resumePdf"][0], "banner/resume", "raw");
        if (existingBanner?.resumePdf?.publicId) {
          await deleteFromCloudinary(existingBanner.resumePdf.publicId, "raw");
        }
      } else if (existingBanner?.resumePdf) {
        resumePdf = existingBanner.resumePdf;
      }

      const bannerData = {
        logo,
        name,
        description,
        subDescription,
        profileImage,
        resumePdf,
        linkedUrl,
        date: new Date(),
      };

      let banner;
      if (existingBanner) {
        banner = await BannerDaniel.findByIdAndUpdate(existingBanner._id, bannerData, { new: true });
      } else {
        banner = new BannerDaniel(bannerData);
        await banner.save();
      }

      res.json(banner);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// 2. Get Banner
app.get("/daniel/banner", async (req, res) => {
  try {
    const banner = await BannerDaniel.findOne();
    res.json(banner);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Delete Banner (and all Cloudinary files)
app.delete("/daniel/banner", async (req, res) => {
  try {
    const banner = await BannerDaniel.findOne();
    if (!banner) return res.status(404).json({ error: "No banner found" });

    // delete all files from Cloudinary
    if (banner.logo?.publicId) await deleteFromCloudinary(banner.logo.publicId, "image");
    if (banner.profileImage?.publicId) await deleteFromCloudinary(banner.profileImage.publicId, "image");
    if (banner.resumePdf?.publicId) await deleteFromCloudinary(banner.resumePdf.publicId, "raw");

    await BannerDaniel.findByIdAndDelete(banner._id);
    res.json({ message: "Banner deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});












app.get("/", (req,res) =>{
  res.send("Backend server for Blogs has started running successfully...");
});

const server = app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
  });
  
