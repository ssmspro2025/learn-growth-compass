# AI Rules & Guidelines

## Tech Stack Overview

- **Frontend Framework**: React with TypeScript
- **UI Library**: shadcn/ui components with Tailwind CSS for styling
- **State Management**: React Query for server state, React Context for client state
- **Routing**: React Router v6
- **Backend**: Supabase (Database, Authentication, Storage, Edge Functions)
- **AI Integration**: Lovable AI Gateway for LLM access
- **OCR Processing**: Tesseract.js for image text extraction
- **PDF Processing**: pdf.js for PDF text extraction
- **Data Visualization**: Recharts for financial reporting
- **Form Handling**: React Hook Form with Zod validation

## Library Usage Rules

### UI & Styling
- **Primary UI Library**: Use shadcn/ui components exclusively for all UI elements
- **Styling**: Use Tailwind CSS classes for all styling needs
- **Icons**: Use Lucide React icons only
- **Responsive Design**: All components must be mobile-responsive using Tailwind's responsive utilities

### Data Management
- **API Calls**: Use Supabase client for all database operations
- **Caching**: Use React Query for all data fetching and caching
- **State Management**: Use React Context for global state, useState for local component state
- **Form Handling**: Use React Hook Form for all forms with Zod for validation

### AI & External Services
- **AI Integration**: Use Lovable AI Gateway exclusively for all AI/LLM interactions
- **OCR**: Use Tesseract.js for image text extraction
- **PDF Processing**: Use pdf.js for PDF text extraction
- **File Storage**: Use Supabase Storage for all file uploads

### Authentication & Authorization
- **Authentication**: Use Supabase Auth with custom session management
- **Authorization**: Implement role-based access control using React Context
- **Password Handling**: Use bcrypt.js for password hashing

### Data Visualization
- **Charts**: Use Recharts for all data visualization needs
- **Financial Reports**: Implement custom components using Recharts for financial dashboards

### File Structure Rules
- **Pages**: Place all page components in `src/pages/`
- **Components**: Place reusable components in `src/components/`
- **UI Components**: Place shadcn/ui components in `src/components/ui/`
- **Finance Components**: Place all finance-related components in `src/components/finance/`
- **Hooks**: Place custom hooks in `src/hooks/`
- **Context**: Place context providers in `src/contexts/`
- **Integrations**: Place integration files in `src/integrations/`
- **Supabase**: Place Supabase client and types in `src/integrations/supabase/`

### Component Development Rules
- **Component Creation**: Create a new file for every new component, no matter how small
- **Component Size**: Aim for components that are 100 lines of code or less
- **Component Props**: Define TypeScript interfaces for all component props
- **Component Reusability**: Design components to be reusable across the application
- **Component Testing**: Ensure components work in isolation and with different data sets

### Database & Migration Rules
- **Database Schema**: Follow the schema defined in Supabase migration files
- **Relationships**: Use proper foreign key relationships as defined in the schema
- **Indexes**: Use indexes for frequently queried columns
- **Constraints**: Implement database constraints for data integrity
- **Migrations**: Write migration files for all schema changes

### Security Rules
- **Input Validation**: Validate all user inputs both client-side and server-side
- **SQL Injection**: Use parameterized queries to prevent SQL injection
- **XSS Prevention**: Sanitize user inputs before rendering
- **Authentication**: Never store passwords in plain text
- **Authorization**: Check user permissions before allowing access to resources

### Performance Rules
- **Bundle Size**: Keep bundle size minimal by code splitting and lazy loading
- **Image Optimization**: Use appropriate image formats and sizes
- **Caching**: Implement proper caching strategies for data and assets
- **Lazy Loading**: Use React.lazy for code splitting
- **Memoization**: Use React.memo for expensive components

### Error Handling Rules
- **Error Boundaries**: Implement error boundaries for catching UI errors
- **Error Logging**: Log errors to console for debugging
- **User Feedback**: Provide clear error messages to users
- **Graceful Degradation**: Ensure app works even when non-critical features fail

### Testing Rules
- **Unit Testing**: Write unit tests for all utility functions
- **Component Testing**: Test components with different props and states
- **Integration Testing**: Test integration between components and services
- **End-to-End Testing**: Implement E2E tests for critical user flows

### Documentation Rules
- **Code Comments**: Write clear comments for complex logic
- **Component Documentation**: Document component props and usage
- **Function Documentation**: Document function parameters and return values
- **Architecture Documentation**: Keep architecture documentation up-to-date