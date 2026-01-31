# Frontend - Interview Platform

React frontend for the AI-First Hiring Platform.

## Setup

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## Environment Variables

Create a `.env` file:

```env
VITE_API_URL=http://localhost:8000/api/v1
```

## Project Structure

```
frontend/
├── src/
│   ├── api/          # API client and request handlers
│   ├── auth/         # Login and registration pages
│   ├── hr/           # HR dashboard and management
│   ├── candidate/    # Candidate job browsing and applications
│   ├── components/   # Shared components
│   ├── context/      # React context providers
│   ├── App.jsx       # Main app with routing
│   └── main.jsx      # Entry point
├── package.json
└── README.md
```

## Available Routes

### Public
- `/login` - User login
- `/register` - User registration

### HR (Protected)
- `/hr/dashboard` - HR dashboard
- `/hr/jobs` - Job listings management
- `/hr/jobs/create` - Create new job
- `/hr/applications` - View applications

### Candidate (Protected)
- `/jobs` - Browse job openings
- `/jobs/:id` - Job details
- `/applications` - My applications
- `/interviews` - My interviews

## Technologies

- React 18
- React Router 6
- Axios for API calls
- Vanilla CSS (custom design system)
