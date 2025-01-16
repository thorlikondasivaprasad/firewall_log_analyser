import React, { useState, useEffect } from 'react';
import './ExecutiveReport.css';
import { Link } from 'react-router-dom';

// Component to display each section of the report
const Section = ({ title, content }) => {
  return (
    <div className="section">
      <h2>{title}</h2>
      <div className="section-content">{content}</div>
    </div>
  );
};

// ExecutiveReport component that holds the full report
const ExecutiveReport = ({ uploadedData }) => {
  const [reportData, setReportData] = useState(null);

  useEffect(() => {
    if (uploadedData && uploadedData.length > 0) {
      generateReport(uploadedData);
    }
  }, [uploadedData]);

  const generateReport = (data) => {
    const totalEntries = data.length;
    const allowedConnections = data.filter(row => row.Action && row.Action.trim().toLowerCase() === "allow").length;
    const blockedConnections = totalEntries - allowedConnections;

    const icmpBlockedCount = data.filter(row => row.Action && row.Action.trim().toLowerCase() === "block" && row.Protocol === "ICMP").length;
    const firefoxBlockedCount = data.filter(row => row.Action && row.Action.trim().toLowerCase() === "block" && row["Process Name"]?.trim() === "Firefox.exe").length;

    setReportData({
      totalEntries,
      allowedConnections,
      blockedConnections,
      icmpBlockedCount,
      firefoxBlockedCount,
    });
  };

  return (
    <div className="executive-report">
      <h1>Executive Report</h1>
      <Link to="/firewall-analysis">
        <button className="back-button">←</button>
      </Link>

      {reportData && (
        <>
          <Section
            title="Problems Identified"
            content={
              <ul>
                <li>
                  <strong>High Rate of Blocked Connections:</strong> The significant percentage of blocked connections (
                  {((reportData.blockedConnections / reportData.totalEntries) * 100).toFixed(2)}%) suggests that the current firewall configuration may be overly restrictive, impacting network performance and user experience.
                </li>
                <li>
                  <strong>Frequent ICMP Blocks:</strong> A considerable number of ICMP packets are being blocked (
                  {reportData.icmpBlockedCount}). This may impede troubleshooting efforts, making it harder to diagnose network issues.
                </li>
                <li>
                  <strong>Application-Specific Issues:</strong> The high number of blocked connections for Firefox.exe (
                  {reportData.firefoxBlockedCount}) indicates potential misconfigurations, hindering user productivity.
                </li>
              </ul>
            }
          />

          <Section
            title="Areas for Improvement"
            content={
              <ul>
                <li>
                  <strong>Review Firewall Rules:</strong> Conduct a comprehensive review of existing firewall rules to identify and modify overly restrictive policies that may block legitimate traffic.
                </li>
                <li>
                  <strong>Enhance Monitoring Capabilities:</strong> Implement advanced monitoring tools to analyze blocked connections and identify patterns that could indicate security threats or misconfigurations.
                </li>
                <li>
                  <strong>User Education and Training:</strong> Provide training for users on how to effectively use applications and the importance of adhering to established security protocols.
                </li>
              </ul>
            }
          />

          <Section
            title="Recommendations"
            content={
              <ul>
                <li>
                  <strong>Conduct Regular Audits:</strong> Perform regular audits of firewall rules and logs to ensure they align with current security policies and operational needs.
                </li>
                <li>
                  <strong>Whitelist Critical Applications:</strong> Consider whitelisting applications that are critical to business operations but are frequently blocked to improve user access and productivity.
                </li>
                <li>
                  <strong>Implement Alert Systems:</strong> Set up alerts for unusual patterns of blocked connections, enabling quick responses to potential security threats or misconfigurations.
                </li>
              </ul>
            }
          />

          <Section
            title="Conclusion"
            content="This executive report highlights critical issues related to blocked connections and application-specific problems. By implementing the recommended actions, the organization can enhance its security posture, improve user experience, and ensure that legitimate traffic is not hindered. A strategic approach to firewall management will foster a more efficient and secure network environment, ultimately supporting business operations."
          />
        </>
      )}
    </div>
  );
};

export default ExecutiveReport;
