# ⚡ FaultLens AI

### See the failure. Trace the cause. Plan the recovery.

**FaultLens AI** is an interactive, AIOps-inspired dashboard designed to demonstrate how cascading service failures can be explored, investigated, and addressed through a unified interface.

Built with React, TypeScript, and Vite, the project brings service topology, incident simulation, log exploration, root-cause analysis, and recovery planning together in one place.

<p align="center">
  <img src="https://img.shields.io/badge/React-UI-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-Type%20Safety-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-Build%20Tool-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/AIOps-Inspired-7C3AED?style=for-the-badge" alt="AIOps Inspired" />
</p>

---

## 📌 Overview

Modern software systems rely on interconnected services. When one critical component becomes overloaded or unavailable, the impact can spread across dependent services, increase latency, and cause request failures.

Investigating such incidents requires understanding service dependencies, examining logs, interpreting metrics, identifying potential root causes, and planning recovery actions.

FaultLens AI explores this workflow through an interactive dashboard that brings these investigation steps together in one place.

## ✨ Key Features

- **📊 Observability Dashboard** — Explore simulated service health, metrics, and incident information.
- **🕸️ Service Topology** — Visualize relationships between interconnected services.
- **🚨 Failure Simulation** — Trigger a demonstration scenario involving database connection-pool exhaustion.
- **📋 Log Explorer** — Inspect simulated application logs to investigate system behavior.
- **🔍 Root Cause Analysis** — Review the explanation and contributing factors associated with the simulated incident.
- **🛠️ Recovery Planner** — Explore suggested troubleshooting and recovery actions.
- **🕒 Incident History** — Review incident information available in the application.
- **🔄 Demo Reset** — Restore the predefined baseline for another demonstration.
- **⚙️ Settings** — Access available application configuration options.
- **📱 Responsive Interface** — Navigate the dashboard across supported screen sizes.

## 🔬 How It Works

FaultLens AI demonstrates a simplified incident-response workflow:

1. **Observe** — Review the current simulated service-health state.
2. **Simulate** — Start the database connection-pool exhaustion scenario.
3. **Investigate** — Explore service dependencies and relevant logs.
4. **Analyze** — Review the root-cause explanation presented by the dashboard.
5. **Plan** — Examine suggested recovery actions.
6. **Reset** — Restore the predefined baseline and prepare for another demonstration.

### Example Scenario: Database Connection-Pool Exhaustion

A database connection pool limits the number of connections an application can use simultaneously. When available connections become exhausted, requests may wait longer, response times may increase, and dependent services may experience errors.

FaultLens AI uses this scenario to demonstrate how an incident can be explored through service health, topology, logs, and recovery planning.

## 🧰 Tech Stack

| Technology | Purpose |
|---|---|
| React | Component-based user interface |
| TypeScript | Typed application logic and improved development-time checks |
| Vite | Development server and build tooling |
| Recharts | Dashboard charts and data visualization, if included in the current implementation |
| CSS and project styling | Layout, visual design, and responsiveness |
| npm | Dependency management and scripts |

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) — use a version compatible with the project dependencies.
- npm — included with Node.js.
- Git — optional, for cloning the repository.

### 1. Clone the repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd faultlens-ai
```

Replace the placeholder with your actual GitHub repository URL and adjust the folder name if needed.

### 2. Install dependencies

```bash
npm install
```

### 3. Start the development server

```bash
npm run dev
```

Open the local URL displayed in your terminal, usually:

```text
http://localhost:5173
```

### 4. Build for production

```bash
npm run build
```

Vite generates the production build in the `dist/` directory when the build succeeds.

### 5. Preview the production build

```bash
npm run preview
```

## 🎮 Try the Demo

1. Open the FaultLens AI dashboard.
2. Explore the service-health overview and topology.
3. Select **Run 3-Min Demo** to start the simulated incident.
4. Inspect the logs and root-cause analysis.
5. Open the Recovery Planner to review suggested actions.
6. Select **Reset Demo** to restore the predefined baseline.

*The exact behavior depends on the current implementation.*


## 🗺️ Future Roadmap

Potential future improvements include:

- [ ] Integration with real application telemetry and logs
- [ ] Live service-health monitoring
- [ ] Configurable incident scenarios
- [ ] Historical incident comparisons
- [ ] AI-backed root-cause analysis
- [ ] Automated recovery workflows
- [ ] Expanded testing and accessibility improvements
- [ ] Publicly hosted interactive demo

These are potential improvements, not claims that the features are already implemented.

## 🎯 Project Objective

FaultLens AI aims to make service-failure investigation easier to visualize and understand by bringing together service dependencies, incident simulation, diagnostic information, and recovery planning.

The project provides a foundation for exploring **observability, incident management, reliability engineering, and AIOps concepts**.

## 🤝 Contributing

Suggestions, improvements, and bug reports are welcome.

1. Fork the repository.
2. Create a feature branch.
3. Make and test your changes.
4. Submit a pull request describing your contribution.

## 🔐 Security

Never commit API keys, passwords, access tokens, or private environment files. Use environment variables and secure configuration practices when integrating external services.

## 📄 License

No license has been specified yet. Add a `LICENSE` file and update this section once you decide how others may reuse the project.

---

<p align="center">
  <strong>FaultLens AI</strong><br/>
  <em>Understand the failure. Find the cause. Plan the recovery.</em>
</p>
