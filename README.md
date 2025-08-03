# Vettam AI - Advanced Document Editor & AI Assistant

## Overview

Vettam AI is a comprehensive, AI-powered document editing platform designed specifically for legal professionals and knowledge workers. Built with modern web technologies, it combines advanced document editing capabilities with artificial intelligence to streamline legal workflows and enhance productivity.

## Technology Stack

- **Frontend**: React 18 with TypeScript
- **Editor**: TipTap (ProseMirror-based rich text editor)
- **AI Integration**: Google Gemini API
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **State Management**: React Context API
- **Storage**: Local Storage with persistence
- **Icons**: Lucide React
- **Notifications**: React Toastify

## Core Features

### Advanced Document Editor

- **Rich Text Editing**: Full-featured WYSIWYG editor with comprehensive formatting options
- **Page Layout Management**: True page breaks with header/footer support
- **Typography Controls**: Multiple font families, sizes, and text styling options
- **Document Structure**: Headings, lists, blockquotes, and code blocks
- **Table Support**: Resizable tables with header rows and advanced formatting
- **Image Integration**: Inline image embedding with URL support
- **Link Management**: Hyperlink creation and editing capabilities

### AI-Powered Capabilities

- **Intelligent Chat Assistant**: Context-aware conversational AI for document assistance
- **Research Assistant**: Comprehensive research with AI-generated insights and suggestions
- **Multi-Language Translation**: Real-time translation supporting 35+ languages
- **Content Generation**: AI-assisted writing and content suggestions
- **Search Suggestions**: Dynamic, context-aware search recommendations

### Document Management

- **Auto-Save Functionality**: Automatic document persistence with timestamp tracking
- **Document History**: Complete revision history with restore capabilities
- **Document Selector**: Advanced document browser with search and filtering
- **Export Options**: Multi-format export (PDF, Word, HTML, Plain Text)
- **Template System**: Pre-built document templates for legal workflows

### Export & Integration

- **PDF Generation**: High-quality PDF export with proper formatting preservation
- **Microsoft Word**: Native .docx file generation with styling support
- **HTML Export**: Clean HTML output with embedded CSS
- **Plain Text**: Formatted text extraction for universal compatibility

### Mobile Responsiveness

- **Adaptive Layout**: Fully responsive design optimized for all screen sizes
- **Touch Interfaces**: Mobile-friendly touch controls and gestures
- **Progressive Enhancement**: Feature-appropriate interfaces across devices
- **Performance Optimization**: Lazy loading and code splitting for mobile performance

## Advanced Technical Features

### Performance Optimizations

- **Code Splitting**: Dynamic imports and lazy loading for optimal bundle sizes
- **Memoization**: React.memo and useMemo for preventing unnecessary re-renders
- **Debounced Operations**: Optimized search and input handling
- **Virtual Rendering**: Efficient handling of large document lists
- **Bundle Optimization**: Tree shaking and dead code elimination

### Error Handling & Reliability

- **Error Boundaries**: Comprehensive error catching and recovery
- **Graceful Degradation**: Fallback mechanisms for failed operations
- **API Rate Limiting**: Intelligent API key management with automatic fallback
- **Local Data Persistence**: Robust local storage with error recovery
- **Toast Notification System**: User-friendly error and success messaging

### Security & Data Management

- **Type Safety**: Full TypeScript implementation for runtime safety
- **Data Validation**: Input sanitization and validation throughout
- **Secure API Integration**: Protected API key management
- **Local Storage Encryption**: Secure client-side data storage

### User Experience Enhancements

- **Real-time Preview**: Live document preview with pagination
- **Keyboard Shortcuts**: Comprehensive keyboard navigation support
- **Contextual Menus**: Dynamic toolbars and context-sensitive options
- **Activity Tracking**: User activity logging and recent document access
- **Search & Filter**: Advanced document search and categorization

## AI Integration Features

### Research Assistant

- **Comprehensive Research**: AI-powered information gathering and synthesis
- **Source Integration**: Multiple data source aggregation
- **Contextual Suggestions**: Topic-relevant research recommendations
- **History Management**: Research session tracking and retrieval

### Translation Engine

- **Multi-Language Support**: 35+ language pairs with high accuracy
- **Context Preservation**: Maintains document formatting during translation
- **Batch Processing**: Multiple document translation capabilities
- **Language Detection**: Automatic source language identification

### Intelligent Chat

- **Conversational AI**: Natural language processing for document assistance
- **Context Awareness**: Document-specific AI responses
- **Session Management**: Persistent chat history and context
- **Export Integration**: Chat results directly integrated into documents

## Installation & Setup

### Prerequisites

- Node.js 18+
- npm or yarn package manager
- Modern web browser with ES2020 support

### Environment Configuration

```bash
VITE_GEMINI_API_KEY=AIzaSyBprm3ELe41fYwme4N8DKO0RCVdGjwbPyg   ||  AIzaSyCtl1SUEJT7KunzfPS14CodlPAm9iJGxjU || AIzaSyB9PGhhGPmnBlfrSDJ5KwhgHYLwMaMnHfg



```

### Installation

1. Install dependencies:

npm install

2. Start the development server:

npm run dev

### Website Live site URL

https://intellidocs-ai.netlify.app/
