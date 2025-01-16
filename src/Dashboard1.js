import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PieController,
  ArcElement,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  ScatterController,
} from 'chart.js';
import { Pie, Bar, Line, Scatter, Heatmap } from 'react-chartjs-2';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import * as d3 from 'd3';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import './App1.css';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  BarElement,
  PieController,
  ScatterController,
  ArcElement,
  Tooltip,
  Legend,
  ChartDataLabels
);

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [geoData, setGeoData] = useState([]);
  const [topAccessedPorts, setTopAccessedPorts] = useState([]);
  
  const calculateTopAccessedPorts = (data) => {
    const portAccessCount = {};

    // Count occurrences of each destination port
    data.forEach(log => {
      const port = log['Destination Port'];
      portAccessCount[port] = (portAccessCount[port] || 0) + 1;
    });

    // Sort ports by access count and get the top 5
    const sortedPorts5 = Object.entries(portAccessCount)
      .sort((a, b) => b[1] - a[1]) // Sort in descending order
      .slice(0, 5); // Get top 5

    setTopAccessedPorts(sortedPorts5);
  };

  // Load the CSV file at runtime
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target.result;
        const parsedData = d3.csvParse(text);
        setData(parsedData);
      };
      reader.readAsText(file);
    }
  };

  

  if (!data) {
    return (
      <div className="dashboard">
        <h1>Firewall Logs Dashboard</h1>
        <input type="file" accept=".csv" onChange={handleFileUpload} />
      </div>
    );
  }

  

  // Calculate overall statistics
  
  // Calculate total rows
  const totalRows = data.length;

  // Calculate total actions (ALLOW and BLOCK)
  const totalActions = d3.rollup(data, (v) => v.length, (d) => d.Action);

  // Calculate total unique protocols
  const totalProtocols = new Set(data.map(d => d.Protocol)).size;

  // Calculate total unique source IPs
  const totalSourceIPs = new Set(data.map(d => d['Source IP'])).size;

  // Calculate total unique users
  const totalUsers = new Set(data.map(d => d.User)).size;

  // Initialize counters for login attempts
  let successfulLoginAttempts = 0;
  let failedLoginAttempts = 0;

  // Initialize port access count and traffic volume by time
  let portAccessCount = {};
  let trafficVolumeByTime = {};

  // Iterate through logs to calculate additional metrics
  data.forEach(log => {
      // Count successful and failed login attempts
      if (log.Action === 'ALLOW' && log.Protocol === 'TCP' && log.DestinationPort === 22) { // Assuming port 22 is for SSH login
          successfulLoginAttempts++;
      } else if (log.Action === 'BLOCK' && log.Protocol === 'TCP' && log.DestinationPort === 22) {
          failedLoginAttempts++;
      }

      // Count accessed ports
      if (log.DestinationPort) {
          portAccessCount[log.DestinationPort] = (portAccessCount[log.DestinationPort] || 0) + 1;
      }

      // Calculate traffic volume by time
      const timeKey = log.Timestamp.split(' ')[0]; // Group by date
      trafficVolumeByTime[timeKey] = (trafficVolumeByTime[timeKey] || 0) + log.Size; // Sum sizes
  });


  // Process name frequency counts
  const processCounts = d3.rollup(data, (v) => v.length, (d) => d['Process Name']);
  
  // Prepare data for visualizations
  const actionCounts = d3.rollup(data, (v) => v.length, (d) => d.Action);
  const protocolCounts = d3.rollup(data, (v) => v.length, (d) => d.Protocol);
  const userCounts = d3.rollup(data, (v) => v.length, (d) => d.User);
  const tcpFlagCounts = d3.rollup(data, (v) => v.length, (d) => d['TCP Flags']);

  // Pie chart data for Actions
  const pieDataActions = {
    labels: Array.from(actionCounts.keys()),
    datasets: [
      {
        data: Array.from(actionCounts.values()),
        backgroundColor: ['#FF6384', '#36A2EB'],
        hoverBackgroundColor: ['#FF6384', '#36A2EB'],
      },
    ],
  };

  // Pie chart data for Protocols
  const pieDataProtocols = {
    labels: Array.from(protocolCounts.keys()),
    datasets: [
      {
        data: Array.from(protocolCounts.values()),
        backgroundColor: ['#4BC0C0', '#9966FF', '#FF9F40'],
        hoverBackgroundColor: ['#4BC0C0', '#9966FF', '#FF9F40'],
      },
    ],
  };

  // Pie chart data for Users
  const pieDataUsers = {
    labels: Array.from(userCounts.keys()),
    datasets: [
      {
        data: Array.from(userCounts.values()),
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'],
        hoverBackgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'],
      },
    ],
  };

  // Pie chart data for Process Names
  const pieDataProcesses = {
    labels: Array.from(processCounts.keys()),
    datasets: [
      {
        data: Array.from(processCounts.values()),
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'],
        hoverBackgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'],
      },
    ],
  };

  const tcpFlagColors = {
    SYN: '#FF6384',
    ACK: '#36A2EB',
    FIN: '#FFCE56',
    RST: '#4BC0C0',
    PSH: '#9966FF',
    NONE: '#FF9F40'
    // Add more flags and their corresponding colors if needed
  };

  const tcpFlagLabels = Array.from(tcpFlagCounts.keys());
  const tcpFlagData = tcpFlagLabels.map(flag => tcpFlagCounts.get(flag));
  const barDataTCPFlags = {
    labels: Array.from(tcpFlagCounts.keys()),
    datasets: [
      {
        label: 'TCP Flags Count',
        data: Array.from(tcpFlagCounts.values()),
        backgroundColor: tcpFlagLabels.map(flag=>tcpFlagColors[flag] || '#CCCCCC'),
      },
    ],
  };

  const generateColors = (count) =>
    Array.from({ length: count }, () => `#${Math.floor(Math.random() * 16777215).toString(16)}`);

  
  

  const ipReputationData = {
    labels: ['Good', 'Suspicious', 'Bad'],
    datasets: [
      {
        label: 'IP Reputation',
        data: [183, 158, 159], // Replace with actual counts
        backgroundColor: ['#4CAF50', '#FFC107', '#F44336'],
        hoverBackgroundColor: ['#66BB6A', '#FFD54F', '#E57373'],
      },
    ],
  };

  const LineCharts = ({ data }) => {
    // Prepare data for line charts
    const [loginData, setLoginData] = useState([]);
    const [connectionData, setConnectionData] = useState([]);
    const [anomalyData, setAnomalyData] = useState([]);
  
    useEffect(() => {
      if (data) {
        // Assuming data has fields: timestamp, loginAttempts, connectionCount, anomalyScore
        const parsedData = data.map(d => ({
          timestamp: new Date(d.Timestamp).toLocaleString(),
          loginAttempts: +d.LoginAttempts || 0,
          connectionCount: +d.ConnectionCount || 0,
          anomalyScore: +d.AnomalyScore || 0,
        }));
  
        setLoginData(parsedData);
        setConnectionData(parsedData);
        setAnomalyData(parsedData);
      }
    }, [data]);

    
  
    // Line chart data for Login Trends
    const loginChartData = {
      labels: loginData.map(d => d.timestamp),
      datasets: [
        {
          label: 'Login Attempts',
          data: loginData.map(d => d.loginAttempts),
          borderColor: 'rgba(75, 192, 192, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          fill: true,
        },
      ],
    };
  
    // Line chart data for Connection Spikes
    const connectionChartData = {
      labels: connectionData.map(d => d.timestamp),
      datasets: [
        {
          label: 'Connection Count',
          data: connectionData.map(d => d.connectionCount),
          borderColor: 'rgba(255, 99, 132, 1)',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          fill: true,
        },
      ],
    };
  
    // Line chart data for Anomaly Scores
    const anomalyChartData = {
      labels: anomalyData.map(d => d.timestamp),
      datasets: [
        {
          label: 'Anomaly Score',
          data: anomalyData.map(d => d.anomalyScore),
          borderColor: 'rgba(255, 206, 86, 1)',
          backgroundColor: 'rgba(255, 206, 86, 0.2)',
          fill: true,
        },
      ],
    };



    return (
      <div className="line-charts">
        <h2></h2>
  
        <div className="chart">
          <h3>Login Trends</h3>
          <Line data={loginChartData} options={{ responsive: true,
            plugins:{
              legend: {
                position: 'top',
                labels:{
                  font:{
                    size:'20',
                  }
                }
              },

            },
            scales: {
              x: {
                ticks: {
                  font: {
                    size: 18 // Set x-axis label font size
                  },
                  color: '#333' // Optional: Set x-axis label color
                }
              },
              y: {
                ticks: {
                  font: {
                    size: 18 // Set y-axis label font size
                  },
                  color: '#333' // Optional: Set y-axis label color
                }
              }
            }

           }} />
        </div>
  
        <div className="chart">
          <h3>Connection Spikes</h3>
          <Line data={connectionChartData} options={{ responsive: true,
            plugins:{
              legend: {
                position: 'top',
                labels:{
                  font:{
                    size:'20',
                  }
                }
              },

            },
            scales: {
              x: {
                ticks: {
                  font: {
                    size: 18 // Set x-axis label font size
                  },
                  color: '#333' // Optional: Set x-axis label color
                }
              },
              y: {
                ticks: {
                  font: {
                    size: 18 // Set y-axis label font size
                  },
                  color: '#333' // Optional: Set y-axis label color
                }
              }
            }
           }} />
        </div>
  
        <div className="chart">
          <h3>Anomaly Scores</h3>
          <Line data={anomalyChartData} options={{ responsive: true,
            plugins:{
              legend: {
                position: 'top',
                labels:{
                  font:{
                    size:'20',
                  }
                }
              },

            },
            scales: {
              x: {
                ticks: {
                  font: {
                    size: 18 // Set x-axis label font size
                  },
                  color: '#333' // Optional: Set x-axis label color
                }
              },
              y: {
                ticks: {
                  font: {
                    size: 18 // Set y-axis label font size
                  },
                  color: '#333' // Optional: Set y-axis label color
                }
              }
            }
           }} />
        </div>
      </div>
    );
  };

  

    // Prepare data for scatter plot
  const suspiciousEvents = data.filter(d => d.Action === 'BLOCK').map(d => ({
    x: +d.Size, // Example: using Size as x-axis
    y: Math.random() * 100, // Example: random anomaly score for suspicious events
  }));

  const normalEvents = data.filter(d => d.Action === 'ALLOW').map(d => ({
    x: +d.Size, // Example: using Size as x-axis
    y: Math.random() * 100, // Example: random anomaly score for normal events
  }));


  // Scatter plot data
  const scatterData = {
    datasets: [
      {
        label: 'Suspicious Events',
        data: suspiciousEvents,
        backgroundColor: 'rgba(255, 99, 132, 0.6)',
        pointRadius: 5,
      },
      {
        label: 'Normal Events',
        data: normalEvents,
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        pointRadius: 5,
      },
    ],
  };


  // Calculate top IPs by activity
  const ipCounts = d3.rollup(data, (v) => v.length, (d) => d['Source IP']);
  const sortedIPs = Array.from(ipCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10); // Top 10 IPs
  const topIPLabels = sortedIPs.map(([ip]) => ip);
  const topIPCounts = sortedIPs.map(([, count]) => count);

  // Bar chart data for Top IPs by Activity
  const barDataTopIPs = {
    labels: topIPLabels,
    datasets: [
      {
        label: 'Top IPs by Activity',
        data: topIPCounts,
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
      },
    ],
  };

  // Calculate most accessed ports
  const portCounts = d3.rollup(data, (v) => v.length, (d) => d['Destination Port']);
  const sortedPorts = Array.from(portCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10); // Top 10 Ports
  const sortedPorts5 = Array.from(portCounts.entries())
  .sort((a, b) => b[1] - a[1])
  .slice(0, 5)
  .map(([port, count]) => `${port}: ${count}`)
  .join(', ');
  const topPortLabels = sortedPorts.map(([port]) => port);
  const topPortCounts = sortedPorts.map(([, count]) => count);

  // Bar chart data for Most Accessed Ports
  const barDataTopPorts = {
    labels: topPortLabels,
    datasets: [
      {
        label: 'Most Accessed Ports',
        data: topPortCounts,
        backgroundColor: 'rgba(255, 206, 86, 0.6)',
      },
    ],
  };

  // Function to calculate traffic by hour
const calculateTrafficByHour = (data) => {
  const trafficCount = new Array(24).fill(0);

  data.forEach((row) => {
    const timestamp = new Date(row.Timestamp);
    const hour = timestamp.getHours();
    trafficCount[hour] += 1;
  });

  return trafficCount.map((count, hour) => ({
    hour: `${hour}:00 - ${hour + 1}:00`,
    count,
  }));
};

function TrafficByHour() {
  const [trafficData, setTrafficData] = useState([]);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => {
          const trafficResult = calculateTrafficByHour(result.data);
          setTrafficData(trafficResult);
        },
      });
    }
  };

  return (
    <div>
      <h2>Traffic by Hour</h2>
      <input type="file" accept=".csv" onChange={handleFileUpload} />
      {trafficData.length > 0 && (
        <table border="1">
          <thead>
            <tr>
              <th>Hour</th>
              <th>Traffic Count</th>
            </tr>
          </thead>
          <tbody>
            {trafficData.map((item, index) => (
              <tr key={index}>
                <td>{item.hour}</td>
                <td>{item.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// Home Component
function Home() {
  return (
    <div className="full-screen home-background">
      <div className="container">
        <div className="welcome-box">
          <h1>Welcome to the Home Page</h1>
        </div>
        <div className="button-group">
          <Link to="/dashboard">
            <button className="nav-button">Dashboard</button>
          </Link>
          <Link to="/report">
            <button className="nav-button">Report</button>
          </Link>
        </div>
      </div>
    </div>
  );
}


  

  
  

  return (
    <div className="dashboard">
      <h1>Firewall Logs Dashboard</h1>
      <Link to="/firewall-analysis">
          <button className="back-button">←</button>
        </Link>

      <input type="file" accept=".csv" onChange={handleFileUpload} />

      {/* Overall View Section */}
      <div className="overview">
        <h2>Overall Dataset Overview</h2>
        <h3>Total no. of logs processed: {totalRows}</h3>
        <h3>Total Actions: {totalActions.get('ALLOW') || 0} ALLOW / {totalActions.get('BLOCK') || 0} BLOCK</h3>
        <h3>Allowed vs. Blocked Traffic Ratio:  {((totalActions.get('ALLOW') || 0) / (totalActions.get('BLOCK') || 1)).toFixed(2)}:1</h3>
        <h3>Total Unique Protocols: {totalProtocols}</h3>
        <h3>Total Unique Source IPs: {totalSourceIPs}</h3>
        <h3>Total Unique Users: {totalUsers}</h3>
        <h3>Total successful Login Attempts:{totalActions.get('ALLOW') || 0} </h3>
        <h3>Total Failed Login Attempts:{totalActions.get('BLOCK') || 1}</h3>
        <h3>Top accessed ports:{sortedPorts5} </h3>
        <TrafficByHour/>
      </div>

      {/* Chart Container */}
      <div className="chart-container">
        <div className="chart">
          <h3>Actions Overview</h3>
          <Pie
            data={pieDataActions}
            options={{
              responsive: true,
              plugins: {
                datalabels: {
                  color: '#fff',
                  formatter: (value) => value,
                  font: {
                    weight: 'bold',
                    size: '26',
                  },
                },
                legend: {
                  position: 'top',
                  labels: {
                    font:{
                      size: '18',
                    },
                    color: '#333',
                  },
                },
              },
            }}
          />
        </div>

        <div className="chart">
          <h3>Protocol Usage</h3>
          <Pie
            data={pieDataProtocols}
            options={{
              responsive: true,
              plugins: {
                datalabels: {
                  color: '#fff',
                  formatter: (value) => value,
                  font: {
                    weight: 'bold',
                    size: '26',
                  },
                },
                legend: {
                  position: 'top',
                  labels:{
                    font:{
                      size: '18',
                    }
                  }
                },
              },
            }}
          />
        </div>

        <div className="chart">
          <h3>User Distribution</h3>
          <Pie
            data={pieDataUsers}
            options={{
              responsive: true,
              plugins: {
                datalabels: {
                  color: '#fff',
                  formatter: (value) => value,
                  font: {
                    weight: 'bold',
                    size: '26',
                  },
                },
                legend: {
                  position: 'top',
                  labels:{
                    font:{
                      size: '18',
                    },
                    color: '#333',
                  }
                },
              },
            }}
          />
        </div>

        <div className="chart">
          <h3>Process Name Distribution</h3>
          <Pie
            data={pieDataProcesses}
            options={{
              responsive: true,
              plugins: {
                datalabels: {
                  color: '#fff',
                  formatter: (value) => `${value} `,
                  font: {
                    weight: 'bold',
                    size: '26',
                  },
                },
                legend: {
                  position: 'top',
                  labels:{
                    font:{
                      size:'20',
                    }
                  }
                },
              },
            }}
          />
        </div>
        
        <div className="chart">
          <h3>TCP Flags Analysis</h3>
          <Bar
            data={barDataTCPFlags}
            options={{
              responsive: true,
              plugins: {
                legend: {
                  position:'top',
                  labels: {
                    font:{
                      size: '18',
                    }
                  },
                },
                datalabels: {
                  color: '#000',
                  anchor: 'end',
                  align: 'end',
                  font: {
                    size: '16', // Increase label font size here
                  },
                },
              },
              scales: {
                x: {
                  ticks: {
                    font: {
                      size: 18 // Set x-axis label font size
                    },
                    color: '#333' // Optional: Set x-axis label color
                  }
                },
                y: {
                  ticks: {
                    font: {
                      size: 18 // Set y-axis label font size
                    },
                    color: '#333' // Optional: Set y-axis label color
                  }
                }
              }
              
            }}
          />
        </div>
        

        <div className="chart">
          <h3>IP Reputation Breakdown</h3>
          <Pie
            data={ipReputationData}
            options={{
              responsive: true,
              plugins: {
                datalabels: {
                  color: '#fff', // Data label text color
                  formatter: (value, context) => `${context.chart.data.labels[context.dataIndex]}: ${value}`, // Format as 'Label: Value'
                  font: {
                    weight: 'bold', // Bold font weight for data labels
                    size: 18, // Font size for data labels
                  },
                },
                legend: {
                  position: 'right', // Positioning the legend on the right
                  labels: {
                    font: {
                      size: 16, // Font size for legend labels
                    },
                  },
                },
                tooltip: {
                  bodyFont: {
                    size: 14, // Font size for tooltip text
                  },
                  titleFont: {
                    size: 16, // Font size for tooltip title
                  },
                },
              },
            }}
          />
        </div>
        
        

        <div className="chart">
          <h3>Suspicious vs Normal Events (Anomaly Scores)</h3>
          <Scatter
            data={scatterData}
            options={{
              responsive: true,
              maintainAspectRatio: true,
              plugins: {
                legend: {
                  display: true,
                  labels: {
                    font: {
                      size: '18',
                    },
                  },
                },
                tooltip: {
                  enabled: true, // Tooltips are disabled for the entire scatter plot
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                },
              },
              scales: {
                x: {
                  title: {
                    display: true,
                    text: 'Size',
                    font: {
                      size: '18',
                    },
                  },
                  ticks: {
                    font: {
                      size: '16',
                    },
                  },
                },
                y: {
                  title: {
                    display: true,
                    text: 'Anomaly Score',
                    font: {
                      size: '18',
                    },
                  },
                  ticks: {
                    font: {
                      size: '16',
                    },
                  },
                },
              },
            }}
          />
        </div>

        <div className="chart">
          <h3>Top IPs by Activity</h3>
          <Bar
            data={barDataTopIPs}
              options={{
              responsive: true,
              maintainAspectRatio: true,
              plugins: {
                legend: {
                  display: true,
                  labels:{
                    font:{
                      size:'18',
                    },
                  },
                },
                tooltip: {
                  callbacks: {
                    label: (context) => {
                      return '${context.dataset.label}: ${context.raw} activities' ;
                    },
                  },
                },
              },
              scales: {
                x: {
                  title: {
                    display: true,
                    text: 'IP Addresses',
                    font:{
                      size:'23',
                    },
                  },
                  ticks:{
                    font:{
                      size:'16',
                    },
                  },
                },
                y: {
                  title: {
                    display: true,
                    text: 'Activity Count',
                    font:{
                      size:'23',
                    },
                  },
                  ticks:{
                    font:{
                      size:'16',
                    },
                  },
                  beginAtZero: true,
                },
              },
            }}
          />
        </div>

        <div className="chart">
          <h3>Most Accessed Ports</h3>
          <Bar
            data={barDataTopPorts}
            options={{
              responsive: true,
              maintainAspectRatio: true,
              plugins: {
                legend: {
                  display: true,
                  labels:{
                    font:{
                      size:'18',
                    },
                  },
                },
                tooltip: {
                  callbacks: {
                    label: (context) => {
                      return '${context.dataset.label}: ${context.raw} accesses';
                    },
                  },
                },
              },
              scales: {
                x: {
                  title: {
                    display: true,
                    text: 'Ports',
                    font:{
                      size:'20',
                    },
                  },
                  ticks:{
                    font:{
                      size:'16',
                    },
                  },
                },
                y: {
                  title: {
                    display: true,
                    text: 'Access Count',
                    font:{
                      size:'20',
                    },
                  },
                  ticks:{
                    font:{
                      size:'16',
                    },
                  },
                  beginAtZero: true,
                },
              },
            }}
          />
        </div>
        
        
        <LineCharts data={data}/>
        
      </div>
    </div>
  );
};

export default Dashboard;
