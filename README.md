# ⚡ FaultLens AI

### See the failure. Trace the cause. Plan the recovery.

**FaultLens AI** is an interactive, AIOps-inspired dashboard that demonstrates how cascading service failures can be explored, investigated, and addressed through a unified interface.

Built around a simulated microservices environment, FaultLens AI brings service topology, incident simulation, log exploration, root-cause analysis, and recovery planning together in one place.

<p align="center">
  <img src="https://img.shields.io/badge/React-Frontend-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/Vite-Build%20Tool-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/AIOps-Inspired-7C3AED?style=for-the-badge" alt="AIOps Inspired" />
  <img src="https://img.shields.io/badge/Status-In%20Development-0891B2?style=for-the-badge" alt="In Development" />
</p>

---

## 📌 The Problem

Modern applications rely on interconnected services. When one critical component becomes overloaded or unavailable, its failure can affect dependent services, increase latency, and trigger a cascade of errors.

Investigating such incidents often involves examining service dependencies, application logs, performance metrics, and possible recovery strategies.

**FaultLens AI explores how these investigation steps can be brought together in one interactive dashboard.**

## 💡 The Solution

FaultLens AI provides a simulated environment for exploring service health and incident-response workflows.

Instead of presenting monitoring information in isolation, the dashboard connects service status, failure scenarios, logs, root-cause explanations, and recovery recommendations into a single experience.

## ✨ Key Features

- **📊 Observability Dashboard** — Explore a centralized overview of simulated service health, metrics, and incident activity.
- **🕸️ Service Topology** — Visualize interconnected services and understand their dependencies.
- **🚨 Failure Simulation** — Trigger a demonstration scenario involving database connection-pool exhaustion.
- **📋 Log Explorer** — Inspect simulated application logs to investigate system behavior.
- **🔍 Root Cause Analysis** — Review the explanation and contributing factors associated with the simulated incident.
- **🛠️ Recovery Planner** — Explore suggested troubleshooting and recovery actions.
- **🕒 Incident History** — Review incident information available in the application.
- **🔄 Demo Reset** — Reset the demonstration to its predefined baseline.
- **⚙️ Settings** — Access the application's available configuration options.
- **📱 Responsive UI** — Navigate the dashboard across supported screen sizes.

## 🔬 How It Works

FaultLens AI demonstrates a simplified incident-response workflow.

1. **Observe:** Review the current simulated service-health state.
2. **Simulate:** Start the database connection-pool exhaustion scenario.
3. **Investigate:** Explore service relationships and relevant log entries.
4. **Analyze:** Review the root-cause explanation presented by the dashboard.
5. **Plan:** Examine the available recovery recommendations.
6. **Reset:** Restore the predefined baseline and prepare for another demonstration.

### Example Scenario: Database Connection-Pool Exhaustion

A database connection pool controls the number of connections an application can use simultaneously. When available connections become exhausted, requests may wait longer, response times may rise, and dependent services may experience errors.

FaultLens AI uses this scenario to demonstrate how an incident can be explored through service health, topology, logs, and recovery planning.

## 🧰 Tech Stack

| Technology | Purpose |
|---|---|
| React | Component-based user interface |
| Vite | Development server and build tooling |
| JavaScript / JSX | Application logic and interface composition |
| Recharts | Dashboard data visualization |
| CSS and project styling | Layout, visual design, and responsiveness |

## 🚀 Getting Started

Run FaultLens AI locally using the following steps.

### Prerequisites

- [Node.js](https://nodejs.org/)
- npm, included with Node.js
- Git (optional, for cloning the repository)

### 1. Clone the repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd faultlens-ai
```

Replace the placeholder with your actual repository URL and use the correct project folder name.

### 2. Install dependencies

```bash
npm install
```

### 3. Start the development server

```bash
npm run dev
```

Open the local URL printed in your terminal, usually:

```text
http://localhost:5173
```

### 4. Create a production build

```bash
npm run build
```

Vite generates the production build in the `dist/` directory.

### 5. Preview the production build

```bash
npm run preview
```

## 🎮 Try the Demo

1. Open the FaultLens AI dashboard.
2. Explore the service-health overview and topology.
3. Click **Run 3-Min Demo** to start the simulated incident.
4. Inspect the logs and root-cause analysis.
5. Open the Recovery Planner to review suggested actions.
6. Click **Reset Demo** to restore the predefined baseline.

*The exact behavior depends on the current implementation.*

## 🖼️ Screenshots

Screenshots of the actual application can be added here to showcase its interface.

Create a `screenshots/` directory and place your screenshots inside it.

For example:

```md
![FaultLens AI Dashboard](screenshots/dashboard.png)
```

Recommended screenshots:

- Dashboard overview
- Service topology
- Active incident simulation
- Root-cause analysis
- Recovery Planner

## 🗺️ Future Roadmap

Potential improvements for future versions:

- [ ] Integration with real application telemetry and logs
- [ ] Live service-health monitoring
- [ ] Configurable incident scenarios
- [ ] Historical incident comparisons
- [ ] AI-backed root-cause analysis
- [ ] Automated recovery workflows
- [ ] Expanded testing and accessibility improvements
- [ ] Publicly hosted interactive demo

These items represent potential future development, not features claimed to be implemented.

## 🎯 Project Objective

FaultLens AI aims to make service-failure investigation easier to visualize and understand by bringing together service dependencies, incident simulation, diagnostic information, and recovery planning.

The project provides a foundation for exploring concepts in **observability, incident management, reliability engineering, and AIOps**.

## 🤝 Contributing

Suggestions, improvements, and bug reports are welcome.

1. Fork the repository.
2. Create a feature branch.
3. Make and test your changes.
4. Submit a pull request describing your contribution.

## 🔐 Security

Never commit API keys, passwords, access tokens, or private environment files. Use appropriate environment variables and secure configuration practices if external services are introduced.

## 📄 License

No license has been specified yet. Add a `LICENSE` file and update this section once you decide how the project may be reused.

---

<p align="center">
  <strong>FaultLens AI</strong><br/>
  <em>Understand the failure. Find the cause. Plan the recovery.</em>
</p>
