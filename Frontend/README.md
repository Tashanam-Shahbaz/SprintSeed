# SprintSeed UI - AI-Powered SRS Generator

A modern, professional React application for generating Software Requirements Specification (SRS) documents using AI. Built with React, Tailwind CSS, and featuring a clean, polished user interface.

## Features

### 🔐 Authentication
- Clean, modern login interface
- Glass-effect design with smooth animations
- Responsive form validation

### 💬 Chat Interface
- Real-time chat-like interaction with AI
- File attachment support for project requirements
- Multiple AI model selection (Gemini 2.5 Flash variants)
- Chat history management with sidebar navigation

### 📄 SRS Document Generation
- AI-powered SRS document creation
- Download functionality for generated documents
- Document preview and refinement capabilities
- Professional document formatting

### 📧 Email Integration
- Send SRS documents via email
- Custom recipient and message fields
- Automatic document attachment
- Professional email modal interface

### 🎨 Design Features
- Modern, professional UI design
- Sophisticated blue-gray and sage green color palette
- Smooth animations and micro-interactions
- Glass-effect elements and soft shadows
- Fully responsive design
- Dark mode support

## Technology Stack

- **Frontend Framework**: React 19.1.0
- **Styling**: Tailwind CSS 4.1.7
- **UI Components**: Custom components built with Radix UI primitives
- **Icons**: Lucide React
- **Build Tool**: Vite
- **Package Manager**: pnpm

## Project Structure

```
sprintseed-ui/
├── src/
│   ├── components/
│   │   ├── auth/
│   │   │   └── LoginForm.jsx
│   │   ├── chat/
│   │   │   ├── ChatArea.jsx
│   │   │   ├── ChatInput.jsx
│   │   │   └── ChatMessage.jsx
│   │   ├── email/
│   │   │   └── EmailModal.jsx
│   │   ├── layout/
│   │   │   ├── Header.jsx
│   │   │   ├── Layout.jsx
│   │   │   └── Sidebar.jsx
│   │   └── ui/
│   │       ├── Button.jsx
│   │       ├── Card.jsx
│   │       ├── Input.jsx
│   │       ├── Modal.jsx
│   │       └── Textarea.jsx
│   ├── pages/
│   │   ├── ChatPage.jsx
│   │   └── LoginPage.jsx
│   ├── lib/
│   │   └── utils.js
│   ├── App.jsx
│   ├── App.css
│   └── main.jsx
├── tailwind.config.js
├── package.json
└── README.md
```

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- pnpm (recommended) or npm

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd sprintseed-ui
```

2. Install dependencies:
```bash
pnpm install
# or
npm install
```

3. Start the development server:
```bash
pnpm run dev
# or
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

### Building for Production

```bash
pnpm run build
# or
npm run build
```

## Usage

### Login
1. Enter any username and password (demo mode accepts any credentials)
2. Click "LOGIN" to access the main application

### Creating SRS Documents
1. Select an AI model from the available options
2. Type your project requirements or attach a file
3. Click the send button to generate an SRS document
4. Download the generated document using the download button

### Sending Documents via Email
1. Click the "SEND EMAIL" button
2. Enter the recipient's email address
3. Add a custom subject and message (optional)
4. Click "Send Email" to share the document

### Chat Management
- Use "New Chat" to start a fresh conversation
- Switch between chat histories using the sidebar
- Each chat maintains its own message history

## Customization

### Color Scheme
The application uses a sophisticated color palette defined in `tailwind.config.js`:
- **Primary**: Blue-gray tones for professional appearance
- **Accent**: Sage green for interactive elements
- **Secondary**: Warm neutrals for supporting elements

### Styling
Custom styles are defined in `src/App.css` including:
- SprintSeed logo styling
- Animation keyframes
- Component-specific styles
- Glass effects and gradients

### Components
All UI components are modular and reusable:
- Consistent design patterns
- Proper TypeScript support
- Accessible markup
- Responsive design

## API Integration

The application is designed to work with backend APIs. Key integration points:

### Authentication
```javascript
// In LoginPage.jsx
const handleLogin = (credentials) => {
  // Replace with actual API call
  // Example: await authAPI.login(credentials)
};
```

### SRS Generation
```javascript
// In ChatPage.jsx
const handleSendMessage = async (messageData) => {
  // Replace with actual API call
  // Example: await srsAPI.generateDocument(messageData)
};
```

### Email Sending
```javascript
// In App.jsx
const handleEmailSend = async (emailData) => {
  // Replace with actual API call
  // Example: await emailAPI.sendDocument(emailData)
};
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please contact the development team or create an issue in the repository.

