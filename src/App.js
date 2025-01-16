// Import necessary dependencies
import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Link, useNavigate } from 'react-router-dom';
import Papa from 'papaparse';
import './App.css';
import Dashboard1 from './Dashboard1';
import ExecutiveReport from './ExecutiveReport';
import SummaryReport from './SummaryReport';
import DeveloperReport from './DeveloperReport';
import OverallReport from './OverallReport';
import RawData from './RawData';

// Main Home Page Component
function MainHome() {
  return (
    <div className="full-screen main-home-background">
      <div className="container">
        <h1>Welcome to Firewall Analyzer</h1>
        <div className="button-group">
          <Link to="/upload">
            <button className="nav-button">Firewall Analysis</button>
          </Link>
        </div>
      </div>
    </div>
  );
}

// File Upload Page Component
function FileUploadPage({ setUploadedData }) {
  const [progress, setProgress] = useState(0); // Track file upload progress
  const navigate = useNavigate();

  const simulateProgress = (callback) => {
    let progressValue = 0;
    const interval = setInterval(() => {
      progressValue += 10;
      setProgress(progressValue);
      if (progressValue >= 100) {
        clearInterval(interval);
        callback(); // Callback after progress reaches 100%
      }
    }, 200); // Update progress every 200ms
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];

    if (!file) {
      alert("Please upload a valid CSV file.");
      return;
    }

    setProgress(0); // Reset progress before starting
    simulateProgress(() => {
      // Parse the file after simulated progress completes
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => {
          if (result.errors.length > 0) {
            console.error("CSV Parsing Errors:", result.errors);
            alert("Error parsing the CSV file. Please check the file format.");
            return;
          }
          setUploadedData(result.data); // Save parsed data
          navigate('/firewall-analysis'); // Redirect to the Firewall Analysis Page
        },
      });
    });
  };

  return (
    <div className="full-screen upload-background">
      <div className="container">
        <button className="back-button" onClick={() => navigate("/")}>← Back</button>
        <h2>Upload Firewall Log File</h2>
        <input type="file" accept=".csv" onChange={handleFileUpload} />
        {progress > 0 && (
          <div className="progress-container">
            <progress value={progress} max="100"></progress>
            <span>{progress}%</span>
          </div>
        )}
      </div>
    </div>
  );
}

// Firewall Analysis Component
function FirewallAnalysis({ uploadedData }) {
  const navigate = useNavigate();

  return (
    <div className="full-screen home-background">
      <div className="container">
        <button className="back-button" onClick={() => navigate("/upload")}>← Back</button>
        <div className="welcome-box">
          <h3>Welcome to the Firewall Analysis Page</h3>
        </div>
        <div className="button-group">
          <Link to="/dashboard">
            <button className="nav-button">Dashboard</button>
          </Link>
          <Link to="/raw-data" state={{ uploadedData }}>
            <button className="nav-button">Raw Data</button>
          </Link>
        </div>
        <div className="report-group">
          <h4>Reports</h4>
          <Link to="/report/summary" state={{ uploadedData }}>
            <button className="nav-button">Summary Report</button>
          </Link>
          <Link to="/report/executive" state={{ uploadedData }}>
            <button className="nav-button">Executive Report</button>
          </Link>
          <Link to="/report/developer" state={{ uploadedData }}>
            <button className="nav-button">Developer Report</button>
          </Link>
          <Link to="/report/overall" state={{ uploadedData }}>
            <button className="nav-button">Overall Report</button>
          </Link>
        </div>
        {uploadedData ? (
          <p>Data successfully uploaded. Ready for analysis!</p>
        ) : (
          <p>No data uploaded. Please upload a file first.</p>
        )}
      </div>
    </div>
  );
}

// App Component
function App() {
  const [uploadedData, setUploadedData] = useState(null);

  return (
    <Router>
      <Routes>
        {/* Main Home Page */}
        <Route path="/" element={<MainHome />} />

        {/* File Upload Page */}
        <Route path="/upload" element={<FileUploadPage setUploadedData={setUploadedData} />} />

        {/* Firewall Analysis Page */}
        <Route path="/firewall-analysis" element={<FirewallAnalysis uploadedData={uploadedData} />} />

        {/* Subpages */}
        <Route path="/dashboard" element={<Dashboard1 uploadedData={uploadedData} />} />
        <Route path="/report/summary" element={<SummaryReport uploadedData={uploadedData} />} />
        <Route path="/report/executive" element={<ExecutiveReport uploadedData={uploadedData} />} />
        <Route path="/report/developer" element={<DeveloperReport uploadedData={uploadedData} />} />
        <Route path="/report/overall" element={<OverallReport uploadedData={uploadedData} />} />
        <Route path="/raw-data" element={<RawData uploadedData={uploadedData} />} /> {/* Pass uploaded data */}
      </Routes>
    </Router>
  );
}

export default App;
