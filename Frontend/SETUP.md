# SprintSeed UI Setup Guide

## Quick Start

### 1. Install Dependencies
```bash
cd sprintseed-ui
pnpm install
```

### 2. Start Development Server
```bash
pnpm run dev
```

### 3. Access the Application
Open your browser and go to `http://localhost:5173`

## Development Workflow

### Running the Application
- **Development**: `pnpm run dev` - Starts dev server with hot reload
- **Build**: `pnpm run build` - Creates production build
- **Preview**: `pnpm run preview` - Preview production build locally

### Testing the Application
1. **Login Screen**: Use any username/password combination
2. **Chat Interface**: Type messages and test file attachment
3. **Email Modal**: Click "SEND EMAIL" and test the form
4. **Download**: Click download buttons on SRS documents

## Customization Guide

### Changing Colors
Edit `tailwind.config.js` to modify the color palette:

```javascript
colors: {
  primary: {
    // Your primary colors
  },
  accent: {
    // Your accent colors
  }
}
```

### Adding New Components
1. Create component in appropriate folder under `src/components/`
2. Follow existing patterns for styling and props
3. Export from component file
4. Import where needed

### Modifying Styles
- Global styles: `src/App.css`
- Component styles: Use Tailwind classes
- Custom animations: Add to `tailwind.config.js`

## API Integration

### Authentication API
Replace the mock login in `src/pages/LoginPage.jsx`:

```javascript
const handleLogin = async (credentials) => {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    const user = await response.json();
    onLogin(user);
  } catch (error) {
    console.error('Login failed:', error);
  }
};
```

### SRS Generation API
Replace the mock response in `src/pages/ChatPage.jsx`:

```javascript
const handleSendMessage = async (messageData) => {
  try {
    const response = await fetch('/api/srs/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(messageData)
    });
    const result = await response.json();
    // Handle the response
  } catch (error) {
    console.error('SRS generation failed:', error);
  }
};
```

### Email API
Replace the mock email sending in `src/App.jsx`:

```javascript
const handleEmailSend = async (emailData) => {
  try {
    const response = await fetch('/api/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(emailData)
    });
    return await response.json();
  } catch (error) {
    console.error('Email sending failed:', error);
    throw error;
  }
};
```

## Deployment

### Build for Production
```bash
pnpm run build
```

### Deploy to Static Hosting
The `dist/` folder contains all static files needed for deployment.

### Environment Variables
Create `.env` file for environment-specific settings:
```
VITE_API_BASE_URL=https://your-api-url.com
VITE_APP_NAME=SprintSeed
```

## Troubleshooting

### Common Issues

1. **Port already in use**
   - Change port: `pnpm run dev --port 3001`

2. **Build errors**
   - Clear node_modules: `rm -rf node_modules && pnpm install`

3. **Styling issues**
   - Check Tailwind config
   - Verify CSS imports in App.css

### Performance Optimization

1. **Code Splitting**: Components are already modular
2. **Image Optimization**: Use WebP format for images
3. **Bundle Analysis**: Run `pnpm run build --analyze`

## File Structure Explanation

```
src/
├── components/          # Reusable UI components
│   ├── auth/           # Authentication components
│   ├── chat/           # Chat interface components
│   ├── email/          # Email functionality
│   ├── layout/         # Layout components
│   └── ui/             # Basic UI components
├── pages/              # Page-level components
├── lib/                # Utility functions
├── App.jsx             # Main application component
├── App.css             # Global styles
└── main.jsx            # Application entry point
```

## Best Practices

1. **Component Design**
   - Keep components small and focused
   - Use proper prop types
   - Follow naming conventions

2. **Styling**
   - Use Tailwind utility classes
   - Create custom classes for repeated patterns
   - Maintain consistent spacing

3. **State Management**
   - Use React hooks for local state
   - Consider Context API for global state
   - Keep state close to where it's used

4. **Performance**
   - Use React.memo for expensive components
   - Implement proper key props for lists
   - Optimize re-renders with useCallback/useMemo

