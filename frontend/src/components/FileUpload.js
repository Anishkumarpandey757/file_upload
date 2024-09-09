import React, { useState } from 'react';
import axios from 'axios';
import mammoth from 'mammoth';

const FileUpload = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [header, setHeader] = useState('');  // State to hold the dynamic header
  const [elements, setElements] = useState([]);  // State to hold both paragraphs and tables
  const [remarks, setRemarks] = useState({});  // State to hold remarks for each element

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
          const html = result.value;
          setLoading(false);

          // Parse the HTML content into paragraphs and tables in sequence
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, 'text/html');

          // Extract the header (assuming it's an <h1> or <h2>)
          const headerElement = doc.querySelector('h1') || doc.querySelector('h2');
          const extractedHeader = headerElement ? headerElement.innerText : 'default-header';

          setHeader(extractedHeader);  // Set the extracted header to use as a prefix

          // Create an array to store paragraphs and tables in sequence
          let documentElements = [];

          // Go through all elements in the body and add them in order
          Array.from(doc.body.children).forEach((element, index) => {
            if (element.tagName.toLowerCase() === 'p') {
              // It's a paragraph, assign a paragraph ID
              documentElements.push({
                id: `${extractedHeader.toLowerCase().replace(/\s+/g, '')}${index + 1}`,
                type: 'paragraph',
                content: element.innerText,  // Extract innerText to get clean text without HTML tags
              });
            } else if (element.tagName.toLowerCase() === 'table') {
              // It's a table, assign a single table ID and treat the table as one entity
              const rows = Array.from(element.querySelectorAll('tr')).map((row) => {
                return Array.from(row.querySelectorAll('td')).map((cell) => cell.innerText);  // Extract innerText for table cells
              });
              documentElements.push({
                id: `${extractedHeader.toLowerCase().replace(/\s+/g, '')}${index + 1}`,
                type: 'table',
                rows: rows,
              });
            }
          });

          setElements(documentElements);
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

  // Handle editing a specific paragraph
  const handleParagraphChange = (index, newContent) => {
    const updatedElements = [...elements];
    updatedElements[index].content = newContent;
    setElements(updatedElements);
  };

  // Handle editing a specific table cell
  const handleTableCellChange = (elementIndex, rowIndex, cellIndex, newContent) => {
    const updatedElements = [...elements];
    updatedElements[elementIndex].rows[rowIndex][cellIndex] = newContent;
    setElements(updatedElements);
  };

  // Handle updating remarks
  const handleRemarksChange = (index, newRemarks) => {
    setRemarks((prevRemarks) => ({
      ...prevRemarks,
      [index]: newRemarks,
    }));
  };

  return (
    <div>
      <h2>Upload PDF and Convert to DOCX</h2>
      <input type="file" accept=".pdf" onChange={handleFileChange} />
      <button onClick={handleFileUpload}>Upload and Convert</button>

      {loading && <p>Loading...</p>}

      {header && <h3>Header Detected: {header}</h3>}

      {elements.length > 0 && (
        <div>
          <h3>Document Content (Paragraphs and Tables)</h3>
          <table border="1" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Serial No</th>
                <th>ID</th>
                <th>Content</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {elements.map((element, index) => {
                const serialNo = index + 1;  // Generate serial number
                return (
                  <tr key={element.id}>
                    <td>{serialNo}</td>
                    <td>{element.id}</td>
                    <td>
                      {element.type === 'paragraph' ? (
                        <textarea
                          value={element.content}
                          onChange={(e) => handleParagraphChange(index, e.target.value)}  // Update paragraph content
                          style={{ width: '100%', height: '100px' }}
                        />
                      ) : (
                        <table border="1" style={{ width: '100%' }}>
                          <tbody>
                            {element.rows.map((row, rowIndex) => (
                              <tr key={`${element.id}-row-${rowIndex}`}>
                                {row.map((cell, cellIndex) => (
                                  <td key={`${element.id}-row-${rowIndex}-cell-${cellIndex}`}>
                                    <textarea
                                      value={cell}
                                      onChange={(e) =>
                                        handleTableCellChange(index, rowIndex, cellIndex, e.target.value)
                                      }  // Update table cell content
                                      style={{ width: '100%', height: '50px' }}
                                    />
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </td>
                    <td>
                      <textarea
                        value={remarks[index] || ''}
                        onChange={(e) => handleRemarksChange(index, e.target.value)}  // Update remarks
                        style={{ width: '100%', height: '50px' }}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
