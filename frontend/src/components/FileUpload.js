import React, { useState } from 'react';
import axios from 'axios';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import mammoth from 'mammoth';

const FileUpload = () => {
  const [file, setFile] = useState(null);
  const [htmlContent, setHtmlContent] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleFileUpload = async () => {
    if (!file) {
      alert('Please upload a file first!');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      setLoading(true);

      // Send file to backend for PDF to DOCX conversion
      const response = await axios.post('http://localhost:5000/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const fileUrl = response.data.filePath;

      // Fetch the DOCX file from the server
      const docxResponse = await axios.get(fileUrl, { responseType: 'arraybuffer' });
      const arrayBuffer = docxResponse.data;

      // Convert DOCX to HTML using Mammoth.js
      mammoth.convertToHtml({ arrayBuffer })
        .then((result) => {
          setHtmlContent(result.value);  // Set the HTML content to be edited
          setLoading(false);
        })
        .catch((error) => {
          console.error('Error converting DOCX to HTML:', error);
          setLoading(false);
        });
    } catch (error) {
      console.error('Error uploading file:', error);
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Upload PDF and Convert to DOCX</h2>
      <input type="file" accept=".pdf" onChange={handleFileChange} />
      <button onClick={handleFileUpload}>Upload and Convert</button>

      {loading && <p>Loading...</p>}

      {htmlContent && (
        <div>
          <h3>Edit the Converted DOCX Content as HTML:</h3>
          <ReactQuill value={htmlContent} onChange={setHtmlContent} />
        </div>
      )}
    </div>
  );
};

export default FileUpload;
