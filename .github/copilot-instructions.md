# Madison 88 HRIS — Copilot Instructions

## System Overview
Madison 88 is a comprehensive Human Resources Information System (HRIS) built with MERN stack.

### Tech Stack
- **Frontend**: React 18, Zustand, Tailwind CSS, Axios
- **Backend**: Node.js, Express, MongoDB, Mongoose
- **Storage**: Supabase for file uploads
- **Authentication**: JWT + Bcrypt

## User Roles & Permissions

User roles: `admin` | `super-admin` | `hr` | `employee` | `applicant`

### Role Hierarchy
- **super-admin**: Full system access, can manage other admins
- **admin**: Core HR operations, hiring, reports
- **hr**: HR-specific functions, benefits, training
- **employee**: Internal employee dashboard and profiles
- **applicant**: Job applications, saved jobs, my applications dashboard
- **applicant**: Job application portal, no employee access

## Architecture Patterns

### Backend
- **Auth**: JWT-based, stored in `req.user` after `verifyToken` middleware
- **Errors**: Always return `{ error: 'string' }`, never expose stack traces
- **Logging**: Winston logger for all errors
- **Models**: Mongoose schemas with validation and pre-save hooks

### Frontend
- **State**: Zustand for auth store, React hooks for component state
- **API**: Axios instance in `lib/api.js` with interceptors for token/error handling
- **Routes**: Protected routes redirect unauthorized users based on role
- **UI**: Tailwind CSS only, no inline styles

## Code Standards

- ES Modules only (`import`/`export`), never `require()`
- `try/catch` on every async function
- Errors as strings, never Error objects in responses
- Ternary conditionals only, never `&&` short-circuit rendering
- `userId` always from `req.user.id`, never from request body
