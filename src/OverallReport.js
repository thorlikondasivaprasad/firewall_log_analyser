import React, { useState, useEffect } from "react";
import './OverallReport.css'; // Import the CSS file for styling
import { Link } from 'react-router-dom';

const FirewallAnalyse = ({ uploadedData }) => {
  const [reportGenerated, setReportGenerated] = useState(false);
  const [selectedHour, setSelectedHour] = useState(null);
  const [data, setData] = useState(uploadedData); // Use uploaded data directly

  useEffect(() => {
    if (uploadedData) {
      setData(uploadedData);
    }
  }, [uploadedData]);

  const generateReport = () => {
    setReportGenerated(true);
  };

  if (!data) {
    return (
      <div className="container">
        <h1>Firewall Log Analysis Report</h1>
        <p>No data available. Please ensure that you have uploaded the CSV file on the previous page.</p>
      </div>
    );
  }

  // Data Analysis
  const topSourceIPs = {};
  const topDestinationPorts = {};
  let allowedPackets = 0;
  let blockedPackets = 0;

  // Initialize hourly log data
  const hourlyLogs = Array.from({ length: 24 }, () => ({
    totalLogs: 0,
    successfulLogs: 0,
    unsuccessfulLogs: 0,
  }));

  data.forEach((row) => {
    const sourceIP = row["Source IP"] || "Unknown";
    const destinationPort = row["Destination Port"] || "Unknown";
    const action = row["Action"];
    const timestamp = new Date(row["Timestamp"]);
    const hour = timestamp.getHours();

    // Update hourly log data
    hourlyLogs[hour].totalLogs++;
    if (action === "ALLOW") {
      allowedPackets++;
      hourlyLogs[hour].successfulLogs++;
    } else if (action === "BLOCK") {
      blockedPackets++;
      hourlyLogs[hour].unsuccessfulLogs++;
    }

    topSourceIPs[sourceIP] = (topSourceIPs[sourceIP] || 0) + 1;
    topDestinationPorts[destinationPort] =
      (topDestinationPorts[destinationPort] || 0) + 1;
  });

  const totalPackets = allowedPackets + blockedPackets;

  // Calculate averages
  const totalHours = hourlyLogs.length;
  const avgLogsPerHour = totalPackets / totalHours;
  const avgSuccessfulLogs = allowedPackets / totalHours;
  const avgUnsuccessfulLogs = blockedPackets / totalHours;

  // Filter logs based on selected hour
  const filteredLogs =
    selectedHour !== null
      ? data.filter((row) => {
          const timestamp = new Date(row["Timestamp"]);
          return timestamp.getHours() === selectedHour;
        })
      : [];

  return (
    <div className="container">
      <h1>Firewall Log Analysis Report</h1>
      <Link to="/firewall-analysis">
        <button className="back-button">←</button>
      </Link>

      <button onClick={generateReport} className="generate-button" disabled={!data}>
        Generate Report
      </button>

      {reportGenerated && (
        <div className="report-section">
          {/* Summary Statistics */}
          <section className="summary">
            <h2>Summary Statistics</h2>
            <p><b>Total Log Entries:</b> {totalPackets}</p>
            <p>
              <b>Allowed Packets:</b> {allowedPackets} ({((allowedPackets / totalPackets) * 100).toFixed(2)}%)
            </p>
            <p>
              <b>Blocked Packets:</b> {blockedPackets} ({((blockedPackets / totalPackets) * 100).toFixed(2)}%)
            </p>
          </section>
          <hr />
          

          {/* Hourly Log Summary */}
          <section className="hourly-summary">
            <h2>Hourly Log Summary</h2>
            <select onChange={(e) => setSelectedHour(Number(e.target.value))} value={selectedHour || ''}>
              <option value="" disabled>Select an hour</option>
              {hourlyLogs.map((_, index) => (
                <option key={index} value={index}>{index}:00 to {index + 1}:00</option>
              ))}
            </select>

            {selectedHour !== null && (
              <div>
                <h3>Hourly Log Data for {selectedHour}:00 to {selectedHour + 1}:00</h3>
                <table className="summary-table">
                  <thead>
                    <tr>
                      <th>Hour Timing</th>
                      <th>No. of Logs</th>
                      <th>No. of Successful Logs</th>
                      <th>No. of Unsuccessful Logs</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>{selectedHour}:00 to {selectedHour + 1}:00</td>
                      <td>{hourlyLogs[selectedHour].totalLogs}</td>
                      <td>{hourlyLogs[selectedHour].successfulLogs}</td>
                      <td>{hourlyLogs[selectedHour].unsuccessfulLogs}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Logs for Selected Hour */}
          {selectedHour !== null && (
            <div>
              <h3>Logs for {selectedHour}:00 to {selectedHour + 1}:00</h3>
              <table className="logs-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Action</th>
                    <th>Source IP</th>
                    <th>Destination Port</th>
                    <th>Process Name</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((row, index) => (
                    <tr key={index}>
                      <td>{row["Timestamp"]}</td>
                      <td>{row["Action"]}</td>
                      <td>{row["Source IP"]}</td>
                      <td>{row["Destination Port"]}</td>
                      <td>{row["Process Name"]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {/* Average Log Information */}
          <section className="average-summary">
            <h2>Average Log Information</h2>
            <p><b>Average Logs Per Hour:</b> {avgLogsPerHour.toFixed(2)}</p>
            <p><b>Average Successful Logs Per Hour:</b> {avgSuccessfulLogs.toFixed(2)}</p>
            <p><b>Average Unsuccessful Logs Per Hour:</b> {avgUnsuccessfulLogs.toFixed(2)}</p>
          </section>
        </div>
      )}
    </div>
  );
};

export default FirewallAnalyse;
