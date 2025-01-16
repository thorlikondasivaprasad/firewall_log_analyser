import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Papa from 'papaparse';
import './DeveloperReport.css';

function DeveloperReport({ uploadedData }) {
  const navigate = useNavigate();
  const [reportData, setReportData] = useState(null);

  useEffect(() => {
    if (uploadedData) {
      generateReport(uploadedData);
    }
  }, [uploadedData]);

  const generateReport = (data) => {
    const totalEntries = data.length;
    const blockedPorts = {};
    const allowedPorts = {};
    const vulnerabilities = [];

    data.forEach(row => {
      const action = row.Action?.trim().toLowerCase();
      const destinationPort = row["Destination Port"];

      if (action === "block") {
        blockedPorts[destinationPort] = (blockedPorts[destinationPort] || 0) + 1;
      } else if (action === "allow") {
        allowedPorts[destinationPort] = (allowedPorts[destinationPort] || 0) + 1;
      }
    });

    // Identify vulnerabilities
    if (Object.keys(blockedPorts).length > 0) {
      vulnerabilities.push("Several ports, particularly those associated with UDP traffic, are frequently blocked, which may disrupt normal network operations.");
    }
    if (Object.keys(allowedPorts).length > 0) {
      vulnerabilities.push("Certain ports may be left open without adequate security measures, exposing the network to potential attacks.");
    }

    // Identify commonly used ports based on the dataset
    const commonlyUsedPorts = {
      TCP: [],
      UDP: []
    };

    // Analyze the data to find commonly used ports
    data.forEach(row => {
      const protocol = row.Protocol?.trim();
      const port = row["Destination Port"];
      if (protocol === "TCP" && !commonlyUsedPorts.TCP.includes(port)) {
        commonlyUsedPorts.TCP.push(port);
      } else if (protocol === "UDP" && !commonlyUsedPorts.UDP.includes(port)) {
        commonlyUsedPorts.UDP.push(port);
      }
    });

    // Limit the number of displayed ports
    const maxDisplayedPorts = 5; // Set the maximum number of ports to display
    const limitedBlockedPorts = Object.entries(blockedPorts).slice(0, maxDisplayedPorts);
    const limitedAllowedPorts = Object.entries(allowedPorts).slice(0, maxDisplayedPorts);
    const limitedCommonlyUsedPorts = {
      TCP: commonlyUsedPorts.TCP.slice(0, maxDisplayedPorts),
      UDP: commonlyUsedPorts.UDP.slice(0, maxDisplayedPorts)
    };

    setReportData({
      totalEntries,
      limitedBlockedPorts,
      limitedAllowedPorts,
      vulnerabilities,
      limitedCommonlyUsedPorts,
    });
  };

  return (
    <div className="developer-report">
      <h2>Developer Report</h2>
      <button
        onClick={() => navigate('/firewall-analysis')}
        style={{
          marginTop: '20px',
          padding: '10px 20px',
          backgroundColor: '#007BFF',
          color: '#fff',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
        }}
      >
        ←
      </button>

      {reportData && (
        <>
          <h3>Description of the Logs</h3>
          <p>
            The firewall logs provide a detailed account of network traffic, capturing essential information such as:
          </p>
          <ul>
            <li>Timestamps</li>
            <li>Actions taken (ALLOW or BLOCK)</li>
            <li>Protocols utilized</li>
            <li>Source and destination IP addresses</li>
            <li>Ports involved</li>
            <li>Applications responsible for the traffic</li>
          </ul>

          <h3>Ports Analysis</h3>
          <ul>
            <li>
              <strong>Commonly Used Ports:</strong>
              <ul>
                <li>TCP Ports: {reportData.limitedCommonlyUsedPorts.TCP.join(', ')}</li>
                <li>UDP Ports: {reportData.limitedCommonlyUsedPorts.UDP.join(', ')}</li>
              </ul>
              <p>
                Understanding the usage of these ports is essential for ensuring that legitimate traffic is allowed while blocking potentially harmful connections.
              </p>
            </li>
            <li>
              <strong>Blocked Ports:</strong>
              <ul>
                {reportData.limitedBlockedPorts.map(([port, count]) => (
                  <li key={port}>
                    Port {port}: {count} times blocked
                  </li>
                ))}
              </ul>
            </li>
            <li>
              <strong>Allowed Ports:</strong>
              <ul>
                {reportData.limitedAllowedPorts.map(([port, count]) => (
                  <li key={port}>
                    Port {port}: {count} times allowed
                  </li>
                ))}
              </ul>
            </li>
          </ul>

          <h3>Vulnerabilities</h3>
          <ul>
            {reportData.vulnerabilities.map((vulnerability, index) => (
              <li key={index}>{vulnerability}</li>
            ))}
          </ul>

          <h3>Conclusion</h3>
          <p>
            The analysis of the firewall logs reveals critical insights into the network's security posture. 
            The frequent blocking of certain ports indicates potential vulnerabilities that could disrupt normal operations. 
            Additionally, the presence of open ports without adequate security measures poses a risk of unauthorized access. 
            It is recommended to regularly review and update firewall rules to ensure that only necessary ports are open and that blocked ports are monitored for unusual activity.
          </p>
        </>
      )}
    </div>
  );
}

export default DeveloperReport;
