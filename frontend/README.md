# Chat Application Frontend

A modern chat application built with Angular, featuring real-time messaging, room management, and user authentication.

## Features

- User authentication (login, register)
- Real-time messaging with Socket.io
- Public and private chat rooms
- Message editing and deletion
- Modern monochrome UI with Material Design
- Responsive layout for all devices

## Prerequisites

- Node.js (v18 or higher)
- npm (v9 or higher)
- Angular CLI (v17 or higher)

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables:
   - Copy `src/environments/environment.ts` to `environment.prod.ts`
   - Update API URLs in both files to match your backend services

3. Start the development server:
   ```bash
   ng serve
   ```

4. Open your browser and navigate to `http://localhost:4200`

## Build

To build the application for production:

```bash
ng build --configuration production
```

The build artifacts will be stored in the `dist/` directory.

## Running Tests

Run unit tests:
```bash
ng test
```

## Project Structure

```
src/
├── app/
│   ├── core/              # Core module (services, guards, interceptors)
│   ├── features/          # Feature modules (auth, chat)
│   ├── shared/           # Shared module (components, styles)
│   └── app.*            # App root component
├── assets/              # Static assets
└── environments/        # Environment configurations
```

## Dependencies

- @angular/material - Material Design components
- @angular/cdk - Component Development Kit
- socket.io-client - WebSocket client
- @auth0/angular-jwt - JWT handling

## Development

1. Core Module
   - HTTP interceptors for authentication
   - Services for auth, chat, and WebSocket
   - Route guards

2. Auth Module
   - Login and registration components
   - JWT-based authentication
   - Form validation

3. Chat Module
   - Room list and chat room components
   - Real-time messaging with Socket.io
   - Message editing and deletion

4. Shared Module
   - Material Design components
   - Common styles and utilities
   - Monochrome theme

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request
