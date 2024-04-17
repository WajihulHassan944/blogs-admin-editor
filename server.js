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

    // Upload image to ImgBB
    const formData = new FormData();
    const { default: fetch } = await import('node-fetch');
    formData.append('image', req.file.buffer.toString('base64'));

    const response = await fetch('https://api.imgbb.com/1/upload?key=368cbdb895c5bed277d50d216adbfa52', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    const imageUrl = data.data.url;

    // Update the blog fields
    const { title, text, blogDate } = req.body;

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





app.get("/", (req,res) =>{
  res.send("Backend server for Blogs has started running successfully...");
});

const server = app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
  });
  
