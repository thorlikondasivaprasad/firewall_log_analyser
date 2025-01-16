import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Papa from "papaparse";
import "./SummaryReport.css";

function SummaryReport() {
  const [reportData, setReportData] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const { uploadedData } = location.state || {};

    if (uploadedData) {
      // Generate report directly using the uploaded data
      generateReport(uploadedData);
    } else {
      alert("No uploaded data found. Please upload a file on the previous page.");
      navigate("/upload"); // Redirect back to upload page if no data
    }
  }, [location.state, navigate]);

  const generateReport = (data) => {
    const totalEntries = data.length;
    const allowedConnections = data.filter(
      (row) => row.Action && row.Action.trim().toLowerCase() === "allow"
    ).length;
    const blockedConnections = totalEntries - allowedConnections;

    const protocolCounts = data.reduce((acc, row) => {
      const protocol = row.Protocol?.trim() || "Unknown";
      acc[protocol] = (acc[protocol] || 0) + 1;
      return acc;
    }, {});

    const processCounts = data.reduce((acc, row) => {
      const processName = row["Process Name"]?.trim() || "Unknown";
      acc[processName] = (acc[processName] || 0) + 1;
      return acc;
    }, {});

    const mostBlocked = data
      .filter((row) => row.Action && row.Action.trim().toLowerCase() === "block")
      .reduce((acc, row) => {
        const processName = row["Process Name"]?.trim() || "Unknown";
        acc[processName] = (acc[processName] || 0) + 1;
        return acc;
      }, {});

    const mostBlockedProcess = Object.entries(mostBlocked).sort((a, b) => b[1] - a[1])[0];

    const recommendations = [];
    if (blockedConnections > 0.5 * totalEntries) {
      recommendations.push(
        "Review firewall rules to reduce excessive blocking of legitimate traffic."
      );
    }
    if (protocolCounts["UDP"] > protocolCounts["TCP"]) {
      recommendations.push("Monitor UDP traffic for potential vulnerabilities or misconfigurations.");
    }
    if (mostBlockedProcess && mostBlockedProcess[1] > 0.2 * totalEntries) {
      recommendations.push(
        `Investigate frequent blocks for the process "${mostBlockedProcess[0]}" to ensure it isn't misconfigured.`
      );
    }

    // New recommendations
    const blockedICMPCount = data.filter(row => row.Action && row.Action.trim().toLowerCase() === "block" && row.Protocol === "ICMP").length;
    if (blockedICMPCount > 0.1 * totalEntries) {
      recommendations.push("Review the rules for ICMP traffic to ensure network diagnostics are not hindered.");
    }

    const blockedUDPCount = data.filter(row => row.Action && row.Action.trim().toLowerCase() === "block" && row.Protocol === "UDP").length;
    if (blockedUDPCount > 0.1 * totalEntries) {
      recommendations.push("Investigate the source of blocked UDP traffic for potential security threats.");
    }

    const frequentBlockedIPs = data.reduce((acc, row) => {
      if (row.Action && row.Action.trim().toLowerCase() === "block") {
        acc[row["Source IP"]] = (acc[row["Source IP"]] || 0) + 1;
      }
      return acc;
    }, {});

    const highBlockedIPs = Object.entries(frequentBlockedIPs).filter(([_, count]) => count > 5);
    if (highBlockedIPs.length > 0) {
      recommendations.push("Monitor or blacklist the following frequently blocked IPs: " + highBlockedIPs.map(([ip]) => ip).join(", "));
    }

    const conclusion = `The report highlights a total of ${blockedConnections} blocked connections, which accounts for ${(
      (blockedConnections / totalEntries) *
      100
    ).toFixed(2)}% of all traffic analyzed. This indicates a significant amount of traffic is being blocked, which may impact legitimate user activities. 

    The analysis identifies "${mostBlockedProcess ? mostBlockedProcess[0] : "no significant process"}" as the most frequently blocked process, with ${mostBlockedProcess ? mostBlockedProcess[1] : 0} blocked entries. It is crucial to review the configurations and rules associated with this process to determine if legitimate traffic is being incorrectly blocked.

    In addition, addressing the highlighted recommendations will help enhance overall network performance and security. Monitoring blocked traffic patterns and making necessary adjustments to firewall rules can minimize disruptions while maintaining robust security protocols.`;

    setReportData({
      totalEntries,
      allowedConnections,
      blockedConnections,
      protocols: protocolCounts,
      processes: processCounts,
      mostBlocked: mostBlockedProcess,
      recommendations,
      conclusion,
    });
  };

  return (
    <div className="summary-report">
      <h2>Summary Report</h2>
      <button onClick={() => navigate("/firewall-analysis")}>←</button>

      {reportData ? (
        <div>
          <p>Total Entries: {reportData.totalEntries}</p>
          <p>
            Allowed Connections: {reportData.allowedConnections} (
            {((reportData.allowedConnections / reportData.totalEntries) * 100).toFixed(2)}%)
          </p>
          <p>
            Blocked Connections: {reportData.blockedConnections} (
            {((reportData.blockedConnections / reportData.totalEntries) * 100).toFixed(2)}%)
          </p>

          <h3>Protocol Usage</h3>
          <ul>
            {Object.entries(reportData.protocols || {}).map(([protocol, count]) => (
              <li key={protocol}>
                {protocol}: {count}
              </li>
            ))}
          </ul>

          <h3>Processes</h3>
          <ul>
            {Object.entries(reportData.processes || {}).map(([process, count]) => (
              <li key={process}>
                {process}: {count}
              </li>
            ))}
          </ul>

          <p>
            Most Blocked Process:{" "}
            {reportData.mostBlocked
              ? `${reportData.mostBlocked[0]} (${reportData.mostBlocked[1]} blocked entries)`
              : "N/A"}
          </p>

          <h3>Recommendations</h3>
          <ul>
            {reportData.recommendations && reportData.recommendations.length > 0 ? (
              reportData.recommendations.map((rec, index) => <li key={index}>{rec}</li>)
            ) : (
              <li>No specific recommendations.</li>
            )}
          </ul>

          <h3>Conclusion</h3>
          <p>{reportData.conclusion || "No conclusion available."}</p>
        </div>
      ) : (
        <p>Loading report...</p>
      )}
    </div>
  );
}

export default SummaryReport;
