# Mirage Tenders Tracking System

A comprehensive web application for tracking and managing tenders, built for Mirage Business Solutions. This system replaces traditional Excel-based tracking with a modern, user-friendly interface.

## Features

### Core Functionality
- **User Authentication**: Secure login system with username/password
- **User Management**: Add, edit, delete users with role-based permissions (Admin only)
- **Password Reset**: Reset user passwords with secure validation
- **Role-based Access**: Admin and User roles with different permissions
- **Tender Management**: Add, edit, and delete tender records
- **Status Tracking**: Track tender status (Won, Lost, Under Review, Global Agreement)
- **Financial Analysis**: Cost tracking, selling price, and profit margin calculations
- **Audit Trail**: Track who added/edited each tender with timestamps
- **Search & Filter**: Powerful search and filtering capabilities
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **PDF Reports**: Generate comprehensive PDF reports with multiple formats
- **Print Functionality**: Direct printing of reports from the browser

### Key Components
- **Dashboard Overview**: Statistics and recent tender activity
- **Tender Form**: Comprehensive form for entering tender details
- **Tender List**: Sortable and filterable list of all tenders
- **Statistics**: Visual representation of tender performance
- **Reports Module**: Generate and print PDF reports (Summary, Detailed, Financial)
- **User Management**: Comprehensive user administration (Admin only)

## Company Information

**Mirage Business Solutions**
- Phone: +962 6 569 13 33 | +962 78693 5565
- Email: m.abuosba@miragebs.com
- Website: http://www.miragebs.com/
- Address: Wadi Saqra, P.O.Box 268 Amman 11731 Jordan

## Getting Started

### Prerequisites
- Node.js (version 18 or higher)
- npm (Node Package Manager)

### Installation

1. Clone or download the project
2. Navigate to the project directory
3. Install dependencies:
   ```bash
   npm install
   ```

### Development

To start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Production Build

To create a production build:
```bash
npm run build
npm start
```

## User Management

The system includes a complete user management system with:

- **Administrator Access:** Full access to create, edit, and manage users
- **User Roles:** Admin and User roles with appropriate permissions
- **Secure Authentication:** Password-based authentication with role-based access control
- **User Registration:** Administrators can create new user accounts through the User Management panel

**Default Administrator Account:**
- Username: `admin`
- Password: `admin123`

Use the default admin account to access the system initially, then create additional users as needed through the User Management interface.

## Technology Stack

- **Frontend**: Next.js 15.5.3 with React 18
- **Styling**: Tailwind CSS
- **Language**: TypeScript
- **Icons**: Lucide React
- **PDF Generation**: jsPDF with jsPDF-AutoTable
- **Build Tool**: Next.js built-in bundler

## Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout component
│   └── page.tsx           # Main page component
├── components/            # React components
│   ├── Dashboard.tsx      # Main dashboard
│   ├── Header.tsx         # Navigation header
│   ├── Login.tsx          # Login component
│   ├── Reports.tsx        # PDF reports and analytics
│   ├── Statistics.tsx     # Statistics dashboard
│   ├── TenderForm.tsx     # Add/edit tender form
│   ├── TenderList.tsx     # Tender listing with filters
│   └── UserManagement.tsx # User administration (Admin only)
└── types/                 # TypeScript type definitions
    └── index.ts          # Application types
```

## Features in Detail

### User Management
- Role-based access (Admin/User)
- Session management
- Secure authentication

### Tender Tracking
- Submission dates
- Price requests and responses
- Cost from HP tracking
- Selling price management
- Automatic profit margin calculation
- Competitor analysis
- Bid bond management

### User Management (Admin Only)
- **Add Users**: Create new user accounts with email validation
- **Edit Users**: Update user information and roles
- **Password Reset**: Reset passwords for any user
- **User Status Control**: Activate/deactivate user accounts
- **Role Management**: Assign Admin or User roles
- **User Search & Filter**: Find users by name, email, role, or status
- **Audit Trail**: Track user creation and last login information

### Data Management
- Real-time data updates
- Data validation
- Error handling
- Responsive form design

### Analytics
- Win/loss ratios
- Financial performance
- Profit margin analysis
- Status distribution

### Reports & PDF Generation
- **Summary Reports**: Key statistics and performance overview
- **Detailed Reports**: Complete tender listings with all information
- **Financial Reports**: Revenue, cost, and profit analysis
- **Print Functionality**: Direct browser printing of all report types
- **Customizable Filters**: Date range and status filtering for targeted reports

## Customization

The system is designed to be easily customizable:

1. **Branding**: Update colors and styles in `tailwind.config.js`
2. **Fields**: Add new tender fields in `src/types/index.ts`
3. **Components**: Extend functionality by modifying components
4. **Authentication**: Integrate with existing authentication systems

## Future Enhancements

Potential improvements for future versions:
- Database integration (PostgreSQL, MySQL, etc.)
- File upload capabilities
- Email notifications
- Advanced reporting
- API integration
- Multi-language support
- Advanced user permissions

## Security Considerations

For production deployment:
- Implement proper authentication backend
- Use environment variables for sensitive data
- Enable HTTPS
- Implement proper session management
- Add input sanitization
- Regular security updates

## Support

For technical support or questions about the Mirage Tenders Tracking System, please contact:
- Email: m.abuosba@miragebs.com
- Phone: +962 6 569 13 33

## License

This application is proprietary software developed for Mirage Business Solutions.

---

*Built with ❤️ for Mirage Business Solutions*
