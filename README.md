# Lemtik Security Dashboard

A modern, AI-powered security operations dashboard designed to provide real-time situational awareness, incident coordination, patrol monitoring, and operational intelligence through a unified command interface.

## Overview

The Lemtik Security Dashboard serves as a centralized command center for monitoring security operations. It enables security teams to visualize incidents, coordinate responses, monitor personnel, and gain actionable insights from operational data.

Built with performance, scalability, and usability in mind, the dashboard provides operators with the information they need to make faster, more informed decisions during routine operations and critical incidents.

## Features

- Real-time security operations dashboard
- Incident monitoring and management
- Interactive geospatial map visualization
- Patrol tracking and monitoring
- AI-assisted operational insights
- Live activity feeds
- Security analytics and reporting
- Personnel and asset overview
- Alert and notification system
- Responsive and modern user interface
- Role-based authentication
- Dark and light mode support

## Dashboard Modules

- Overview
- Incident Management
- Command Center
- Patrol Operations
- Intelligence
- Assets
- Personnel
- Reports & Analytics
- Settings

## Tech Stack

- **Frontend:** Next.js
- **Language:** TypeScript
- **UI:** React
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **State Management:** Zustand
- **Backend:** Supabase
- **Maps:** Mapbox
- **Charts:** Recharts
- **Authentication:** Supabase Auth

## Project Structure

```text
src/
├── app/
├── components/
├── features/
├── hooks/
├── layouts/
├── lib/
├── services/
├── store/
├── styles/
├── types/
└── utils/
```

## Getting Started

### Clone the repository

```bash
git clone https://github.com/your-username/lemtik-dashboard.git
```

### Install dependencies

```bash
npm install
```

or

```bash
pnpm install
```

### Configure environment variables

Create a `.env.local` file.

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=

OPENAI_API_KEY=
```

### Start the development server

```bash
npm run dev
```

Visit:

```
http://localhost:3000
```

## Build

```bash
npm run build
```

## Production

```bash
npm start
```

## Design Principles

- Clean and intuitive interface
- Real-time operational awareness
- Fast response workflows
- Scalable architecture
- Mobile-friendly experience
- Accessibility-focused design
- Secure-by-default implementation

## Roadmap

- [ ] AI incident summarization
- [ ] Predictive threat analytics
- [ ] Offline operation mode
- [ ] Advanced geofencing
- [ ] Multi-site command center
- [ ] Custom dashboard widgets
- [ ] Workflow automation
- [ ] Enhanced reporting
- [ ] Multi-language support

## Contributing

Contributions are welcome. Please open an issue to discuss proposed changes before submitting a pull request.

## License

This project is licensed under the MIT License.

---

**Built for faster, smarter, and more coordinated security operations.**
