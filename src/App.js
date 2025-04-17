import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [file, setFile] = useState(null);
  const [excelData, setExcelData] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(10);
  const [searchId, setSearchId] = useState('');
  const [totalCount, setTotalCount] = useState(0);
  const [fileUploaded, setFileUploaded] = useState(false);
  const backendUrl = 'https://localhost:8080/api/excel';

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return alert('Please choose a file!');
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${backendUrl}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        alert('File uploaded and saved successfully.');
        setFileUploaded(true);
        setCurrentPage(0);
      } else {
        const errorText = await res.text();
        alert(`Upload failed: ${errorText}`);
      }
    } catch (error) {
      alert(`Upload error: ${error.message}`);
    }
  };

  const fetchData = async (page) => {
    try {
      const response = await fetch(`${backendUrl}/data?page=${page}&size=${pageSize}`);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }
      const rawData = await response.json();

      const parsedData = rawData.content.map((item) => {
        const row = JSON.parse(item.rowData);
        const cleanRow = {};
        for (const key in row) {
          cleanRow[key] = String(row[key]);
        }
        return {
          ...cleanRow,
          _backendId: item.id
        };
      });

      setExcelData(parsedData);
      setTotalCount(rawData.totalElements || 0);
    } catch (error) {
      console.error('Error fetching data:', error.message);
      alert('Error fetching data. Check backend.');
    }
  };

  const handleSearch = () => {
    if (!searchId.trim()) {
      fetchData(currentPage);
      return;
    }

    const filtered = excelData.filter((row) =>
      row['ID']?.toString().toLowerCase().includes(searchId.trim().toLowerCase())
    );

    if (filtered.length === 0) {
      alert('No record found or error occurred.');
    }

    setExcelData(filtered);
    setTotalCount(filtered.length);
    setCurrentPage(0);
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${backendUrl}/delete?id=${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText);
      }

      const updatedData = excelData.filter((row) => row._backendId !== id);
      setExcelData(updatedData);
      setTotalCount(prev => prev - 1);
      fetchData(currentPage);
    } catch (error) {
      alert('Error deleting record: ' + error.message);
    }
  };

  useEffect(() => {
    if (fileUploaded) {
      fetchData(currentPage);
    }
  }, [currentPage, fileUploaded]);

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="container">
      <h2 className="heading">Excel File Upload</h2>

      <input type="file" accept=".xlsx, .csv" onChange={handleFileChange} />
      <br />
      <button className="button" onClick={handleUpload}>Upload</button>
      <button
        className="button"
        onClick={() => {
          fetchData(0);
          setCurrentPage(0);
          setSearchId('');
        }}
      >
        View Data
      </button>

      <div className="search-container">
        <input
          type="text"
          placeholder="Search by ID"
          value={searchId}
          onChange={(e) => setSearchId(e.target.value)}
        />
        <button onClick={handleSearch}>Search</button>

        {/* ✅ Square count with heading */}
        <div className="square-container">
          <div className="square-heading">Total IDs</div>
          <div className="square">{totalCount}</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            {excelData?.length > 0 &&
              Object.keys(excelData[0])
                .filter((key) => key !== "_backendId")
                .map((key, index) => (
                  <th key={index}>{key}</th>
                ))}
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {excelData?.length > 0 ? (
            excelData.map((row, index) => (
              <tr key={index}>
                {Object.entries(row)
                  .filter(([key]) => key !== "_backendId")
                  .map(([key, val], idx) => (
                    <td key={idx}>{val}</td>
                  ))}
                <td>
                  <button onClick={() => handleDelete(row._backendId)}>Delete</button>
                </td>
              </tr>
            ))
          ) : (
            <tr><td colSpan="100%">No data available</td></tr>
          )}
        </tbody>
      </table>

      {totalPages > 1 && (
        <div className="pagination">
          <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 0))} disabled={currentPage === 0}>
            Prev
          </button>
          <span>Page {currentPage + 1} of {totalPages}</span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages - 1))}
            disabled={currentPage >= totalPages - 1}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
