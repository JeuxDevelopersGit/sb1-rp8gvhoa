# ⚡ JeuxBoard - Internal Project Management System

A comprehensive project management system built for development teams with role-based access control, real-time collaboration, and advanced module tracking.

## 🚀 Features

### 🔐 Authentication & Security
- **Supabase Authentication**: Secure email/password authentication
- **Role-Based Access Control**: 6 distinct roles (Admin, Dev, PM, CTO, Lead, Designer)
- **Row Level Security**: Database-level security policies
- **Field-Level Permissions**: Granular control over module field editing

### 📊 Dashboard & Analytics
- **Real-time Statistics**: Live project and module counts
- **Interactive Charts**: Pie charts for status distribution, bar charts for sprint progress
- **Role-based Content**: Personalized dashboard based on user role
- **Performance Metrics**: Track completion rates and team productivity

### 🗂️ Project Management
- **Project Creation**: Complete project setup with team assignment
- **Project Details**: Comprehensive project information with inline editing
- **Search & Filter**: Advanced filtering by status, sprint, and keywords
- **Team Assignment**: Visual team member management

### ⚙️ Module Management (Production-Grade)
- **Complete Lifecycle Tracking**: 13+ fields covering entire development process
- **Inline Editing**: Click-to-edit functionality with real-time updates
- **Workflow Stages**: Design → Development → QA → Review → Client Ready
- **Status Management**: Visual status indicators with emoji support

### 👥 Team Management
- **User Management**: Add, edit, delete team members
- **Role Assignment**: Dynamic role management with permissions
- **Profile Management**: Complete user profiles with avatars
- **Team Visualization**: Beautiful user cards with role indicators

### 🎨 Modern UI/UX
- **Gen-Z Design**: Bold orange theme with modern aesthetics
- **Framer Motion**: Smooth animations and micro-interactions
- **Responsive Design**: Mobile-first approach with breakpoints
- **Toast Notifications**: Real-time feedback system
- **Loading States**: Professional loading indicators

## 🛡️ Security & Permissions

### Role-Based Field Permissions

| Field | Editable By |
|-------|-------------|
| Module Name | Admin |
| Platform Stack | Admin |
| Assigned Developer | Admin |
| Design Locked Date | Designer, Admin |
| Dev Start Date | Assigned Dev, Admin |
| Self QA Date | Assigned Dev, Admin |
| Lead Signoff Date | Lead, Admin |
| PM Review Date | PM, Admin |
| CTO Review Status | CTO, Admin |
| Client Ready Status | PM, Admin |
| Status | Dev, PM, Admin |
| ETA | PM, Admin |
| Sprint | PM, Admin |
| Notes | All Roles |

## 🗄️ Database Schema

### Tables
- **users**: User profiles with role assignments
- **roles**: System roles and permissions
- **projects**: Main project entities
- **project_modules**: Detailed module tracking
- **project_members**: Team assignments

### Security Features
- Row Level Security (RLS) on all tables
- Role-based access policies
- Optimized indexes for performance
- Auto-updating timestamps

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Supabase account
- Modern web browser

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd jeuxboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Create a new Supabase project
   - Run the migration files in order
   - Set up environment variables

4. **Environment Variables**
   Create a `.env` file:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

### Demo Credentials
```
Email: admin@jeux.com
Password: 123123123
```

## 🏗️ Architecture

### Frontend Stack
- **React 18**: Modern React with hooks and context
- **TypeScript**: Full type safety
- **Tailwind CSS**: Utility-first styling
- **Framer Motion**: Smooth animations
- **Recharts**: Interactive data visualization
- **Lucide React**: Beautiful icons

### Backend Stack
- **Supabase**: Backend-as-a-Service
- **PostgreSQL**: Robust relational database
- **Row Level Security**: Database-level security
- **Real-time Subscriptions**: Live data updates

### Key Features
- **Real-time Sync**: Live updates across all users
- **Error Handling**: Comprehensive error management
- **Performance**: Optimized queries and caching
- **Scalability**: Modular architecture
- **Maintainability**: Clean code structure

## 📱 Usage

### For Admins
- Create and manage projects
- Add team members and assign roles
- Full access to all modules and data
- System configuration and user management

### For Project Managers
- Manage project details and timelines
- Review module progress and ETAs
- Assign developers to modules
- Track sprint progress

### For Developers
- Update development progress
- Mark QA completion dates
- Add technical notes and updates
- View assigned modules

### For CTOs/Leads
- Review and approve modules
- Provide technical signoffs
- Monitor overall project health
- Strategic oversight

## 🔧 Development

### Code Structure
```
src/
├── components/          # React components
│   ├── auth/           # Authentication components
│   ├── ui/             # Reusable UI components
│   └── ...             # Feature components
├── contexts/           # React contexts
├── hooks/              # Custom hooks
├── lib/                # Utilities and configurations
└── types/              # TypeScript type definitions
```

### Best Practices
- TypeScript for type safety
- Component composition
- Custom hooks for logic reuse
- Context for state management
- Proper error boundaries

## 🚀 Deployment

The application is production-ready with:
- Environment-based configuration
- Optimized build process
- Security best practices
- Performance optimizations

## 📄 License

This project is proprietary software for internal use.

## 🤝 Contributing

This is an internal project. Please follow the established coding standards and review process.

---

Built with ❤️ by the Jeux development team