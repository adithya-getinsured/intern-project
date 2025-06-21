# 🗨️ ChatBox – Real-Time Multi-User Chat App

ChatterBox is a real-time chat application built with modern web technologies. It allows users to register, log in, join chat rooms, and exchange messages in real time. With persistent message history and a clean Angular-powered UI, ChatterBox provides a smooth and responsive chat experience.

---

## Features

### Authentication
- Register / Login / Logout flow
- Password hashing with `bcrypt`
- JWT or Express-session based authentication
- Basic user profiles (username, email)

### Real-Time Messaging
- Global chatroom support
- Multiple chat rooms or direct messaging (optional)
- Real-time updates using **Socket.IO**

### Message Persistence
- Messages saved in **MongoDB** or **MySQL**
- Load message history on room join
- Message timestamps and user association

### Frontend
- Built with **Angular**
- Responsive, user-friendly chat interface
- Real-time message input and output
- Authentication forms with validation

---

## Tech Stack

| Area       | Technology           |
|------------|----------------------|
| Frontend   | Angular, HTML, CSS   |
| Backend    | Node.js, Express     |
| Real-Time  | Socket.IO            |
| Database   | MongoDB & MySQL      |
| Auth       | JWT / Express-session|
| Versioning | Git + GitHub         |

---

## Setup & Installation

### 1. Clone the repository
```bash
git clone https://github.com/adithya-getinsured/intern-project.git
cd intern-project
````

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in `/backend`:

```bash
cp .env .env.example
```

Start the server:

```bash
npm run dev
```

### 3. Frontend Setup

```bash
cd ../frontend
npm install
ng serve
```

Visit `http://localhost:4200` to open the app.

---

## Deployment

You can deploy the app using:

* **Frontend**: Vercel, Netlify, Firebase Hosting
* **Backend**: Render, Railway, EC2
* **Database**: MongoDB Atlas, PlanetScale

---

## Contributors

* [Adithya V](https://github.com/adithya-getinsured)

Want to contribute? Pull requests are welcome!