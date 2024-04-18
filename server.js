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














app.get("/", (req,res) =>{
  res.send("Backend server for Blogs has started running successfully...");
});

const server = app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
  });
  
