const express = require('express');
const fileUpload = require('express-fileupload');
const cors = require('cors');  // CORS package to handle cross-origin requests
const path = require('path');
const fs = require('fs');
const convertapi = require('convertapi')('secret_xONdKggEQn2SDPCu');

const app = express();

// Enable CORS to allow requests from 'http://localhost:3000'
app.use(cors({
  origin: 'http://localhost:3000',  // Allow requests from the React frontend
}));

// Middleware to handle file uploads
app.use(fileUpload());
app.use(express.static('uploads'));  // Serve static files

// Route to handle file upload and PDF to DOCX conversion
app.post('/upload', async (req, res) => {
  if (!req.files || !req.files.file) {
    return res.status(400).send('No file uploaded.');
  }

  const pdfFile = req.files.file;
  const uploadPath = path.join(__dirname, 'uploads', pdfFile.name);

  // Save the uploaded PDF file
  pdfFile.mv(uploadPath, async (err) => {
    if (err) {
      return res.status(500).send(err);
    }

    try {
      // Use ConvertAPI to convert PDF to DOCX
      const result = await convertapi.convert('docx', { File: uploadPath }, 'pdf');

      // Save the converted DOCX file to the uploads directory
      const docxFilePath = path.join(__dirname, 'uploads', pdfFile.name.replace('.pdf', '.docx'));
      await result.saveFiles(docxFilePath);

      // Return the download link for the converted DOCX file
      res.json({ filePath: `http://localhost:5000/${path.basename(docxFilePath)}` });

      // Optionally, delete the PDF file after conversion
      fs.unlinkSync(uploadPath);
    } catch (error) {
      console.error('Error during conversion:', error);
      res.status(500).send('Error converting PDF to DOCX.');
    }
  });
});

// Start the server
app.listen(5000, () => {
  console.log('Server running on http://localhost:5000');
});
