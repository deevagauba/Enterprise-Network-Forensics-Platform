# Enterprise Network Forensics Platform

Welcome to the **Enterprise Network Forensics Platform**. This platform provides a streamlined approach to network forensics, automated intrusion detection, and traffic simulation through a robust backend and an intuitive frontend dashboard.

## Key Features

- **Traffic Simulation & Analysis:** Monitor simulated network traffic to test detection engines and forensic tools.
- **Intrusion Detection:** Python-based detection engine to automatically identify potential security threats and anomalies.
- **Visual Dashboard:** A modern, React-based UI for visualizing network topologies, flagged hosts, and real-time alerts.

## Project Structure

- `backend/` - Contains the Python backend API, the intrusion detection engine, and traffic simulation scripts.
- `frontend/` - Contains the React + Vite frontend application.
- `data/` - Holds sample forensic logs, PDF reports, and network state configurations.
- `start_app.bat` - A helpful Windows batch script to easily launch both the frontend and backend servers together.

## Prerequisites

To run this platform on your local machine, ensure you have the following installed:
- **Node.js** (v14 or higher) for the frontend.
- **Python** (3.8 or higher) for the backend.

## Getting Started

1. **Clone the repository:**
   ```bash
   git clone https://github.com/deevagauba/Enterprise-Network-Forensics-Platform.git
   cd Enterprise-Network-Forensics-Platform
   ```

2. **Run the Application (Windows):**
   Simply double-click the `start_app.bat` file in the root directory. This script will automatically:
   - Create a Python virtual environment and install backend dependencies.
   - Install all necessary Node.js modules for the frontend.
   - Start both the Python backend and React frontend concurrently.

3. **Access the Dashboard:**
   Once the servers are running, open your web browser and navigate to `http://localhost:5173` (or the URL provided in your terminal) to view the platform.
