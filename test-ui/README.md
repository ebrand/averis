# Commerce Context Test Automation & Web UI

This directory contains both automated testing infrastructure and a web-based UI for manually running and monitoring API tests.

## 🎯 **What This Provides**

### **1. 🤖 Automated Testing (CI/CD Integration)**
- **GitHub Actions** - Automated tests on push/PR
- **Git Hooks** - Pre-commit validation
- **Scheduled Testing** - Daily test runs
- **Notification System** - Alerts on test failures

### **2. 🖥️ Manual Test UI (Web Interface)**
- **Visual Test Runner** - Click-to-run tests with real-time results
- **System Status Dashboard** - Check API/Database connectivity
- **Test Result Visualization** - See output, coverage, and timing
- **Individual Test Control** - Run specific test suites or cases

## 🚀 **Quick Start**

### **Web UI Setup**
```bash
# Navigate to test UI directory
cd test-ui

# Install dependencies
npm install

# Start the test UI server
npm run dev

# Open browser to http://localhost:3007
```

### **Automation Setup**

#### **1. GitHub Actions (Repository-Level)**
```bash
# Copy the workflow file to your repository
mkdir -p .github/workflows
cp automation/workflows/github-actions.yml .github/workflows/api-tests.yml

# Commit and push to trigger automated tests
git add .github/workflows/api-tests.yml
git commit -m "Add automated API testing workflow"
git push
```

#### **2. Git Hooks (Local Development)**
```bash
# Install pre-commit hook
cp automation/hooks/pre-commit .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit

# Now tests run automatically before each commit
git commit -m "Your changes"  # Tests run automatically
```

## 📱 **Web UI Features**

### **Dashboard Overview**
The web UI provides a comprehensive testing dashboard at `http://localhost:3007`:

#### **System Status Panel**
- ✅ **API Server Status** - Is the Product MDM API running?
- ✅ **Database Connectivity** - Can we connect to PostgreSQL?
- ✅ **Test Environment** - Are Jest and npm available?
- ✅ **Node.js Version** - Runtime information

#### **Test Suites Tab**
Visual cards for each test category:
- 🧪 **Unit Tests** - User model validation, schema compatibility
- 🔗 **Integration Tests** - Full API endpoint testing
- 📊 **Coverage Report** - Test coverage analysis
- ⚙️ **Configuration Validation** - System configuration checks

#### **Individual Tests Tab**
Granular control over specific test cases:
- 👤 **User Profile Update** - The exact functionality we fixed!
- 🗄️ **Database Schema Compatibility** - Prevents `created_by`/`updated_by` issues
- 📝 **User CRUD Operations** - Complete user management testing
- 📦 **Product CRUD Operations** - Product API testing

### **Real-Time Test Execution**
- **Live Status Indicators** - Running, passed, failed states
- **Execution Timing** - See how long tests take
- **Output Viewing** - Expand to see full test output
- **Error Details** - Specific failure information when tests fail

## 🤖 **Automation Features**

### **GitHub Actions Workflow**
Automatically triggered on:
- **Code Changes** - Push to main/develop branches
- **Pull Requests** - Validate before merge
- **Daily Schedule** - 6 AM UTC daily runs
- **Manual Trigger** - On-demand execution

**Workflow Steps:**
1. **Environment Setup** - PostgreSQL + RabbitMQ services
2. **Configuration Validation** - Check system consistency
3. **Unit Tests** - Model and utility testing
4. **Integration Tests** - API endpoint testing
5. **Coverage Analysis** - Code coverage reporting
6. **Result Notification** - PR comments with test results

### **Pre-Commit Hooks**
Automatically run before each commit:
1. **Configuration Check** - Validate development environment
2. **Unit Tests** - Fast model validation
3. **Integration Tests** - If database is available
4. **Lint/Format** - Code quality checks (if available)

### **Notification System**
- **PR Comments** - Test results posted to pull requests
- **Failure Alerts** - Notifications when main branch tests fail
- **Coverage Reports** - Uploaded to Codecov (if configured)

## 🛠️ **Technical Architecture**

### **Web UI Components**
```
test-ui/
├── server.js              # Express API for test execution
├── src/
│   ├── App.jsx            # Main React application
│   ├── components/        # UI components
│   └── services/          # API communication
├── package.json           # Dependencies and scripts
└── README.md              # This documentation
```

### **Test Execution API**
The web UI includes a Node.js/Express backend that provides:
- `GET /api/test-suites` - List available test suites
- `GET /api/test-cases` - List individual test cases
- `POST /api/run-suite/:id` - Execute a test suite
- `POST /api/run-case/:id` - Execute a specific test
- `GET /api/system-status` - Check system health

### **Security & Isolation**
- **Separate Test Port** - UI runs on port 3007 (different from APIs)
- **Test Environment Variables** - Isolated test configuration
- **Process Sandboxing** - Tests run in separate processes
- **Timeout Protection** - Automatic test timeout (5 minutes)

## 📊 **Test Categories Explained**

### **🧪 Unit Tests**
**Purpose**: Validate individual components
**Focus**: User model database compatibility
**Duration**: 10-30 seconds
**Key Tests**:
- Database schema field mapping
- Data transformation (snake_case ↔ camelCase)
- Validation rules and business logic
- **Critical**: Ensures no `created_by`/`updated_by` references

### **🔗 Integration Tests**
**Purpose**: Full API endpoint testing
**Focus**: End-to-end functionality with database
**Duration**: 30-60 seconds
**Key Tests**:
- **User Profile Update** - The functionality we fixed
- Complete CRUD operations
- Authentication and authorization
- Error handling and edge cases

### **📊 Coverage Analysis**
**Purpose**: Measure test completeness
**Focus**: Code coverage metrics
**Duration**: 60-120 seconds
**Output**: HTML coverage reports

### **⚙️ Configuration Validation**
**Purpose**: Prevent integration issues
**Focus**: System configuration consistency
**Duration**: 5-10 seconds
**Key Validations**:
- Port assignments match YAML configuration
- API endpoints are correctly configured
- Database schema constraints are documented

## 🎯 **How This Prevents Issues**

### **The User Profile Problem (Solved!)**
The test automation would have caught our user profile persistence issue:

```bash
❌ Integration Tests Failed
   PUT /api/users/:id should update user profile
   
   Error: column "updated_by" of relation "users" does not exist
   
   Expected: 200
   Received: 500
```

**Before Fix**: Runtime error during user interaction
**With Tests**: Development-time error with specific solution

### **Configuration Drift Prevention**
The configuration validation catches:
- API port mismatches
- Environment variable inconsistencies  
- Database schema assumptions
- Service dependency issues

## 🚀 **Usage Examples**

### **Daily Development Workflow**
```bash
# Morning: Check system status
open http://localhost:3007

# Before coding: Run relevant tests
# Click "User Profile Update" test to verify current functionality

# After changes: Automated pre-commit testing
git commit -m "Update user validation"  # Tests run automatically

# Pull request: Automated CI testing
git push origin feature-branch  # GitHub Actions runs full test suite
```

### **Debugging Integration Issues**
```bash
# Open test UI
npm run dev

# Check system status panel - is everything running?
# Run configuration validation - any mismatches?
# Run specific failing test to see exact error
# Fix issue and re-run test to verify
```

### **Team Collaboration**
```bash
# New team member setup
npm install
npm run dev

# Verify their environment works by running all tests
# Green = ready to develop
# Red = environment issues to resolve
```

## 📈 **Benefits Achieved**

### **🚀 Speed**
- **Issue Detection**: Seconds instead of hours
- **Root Cause**: Specific error messages, not guesswork
- **Verification**: Instant confirmation that fixes work

### **🛡️ Quality**
- **Regression Prevention**: Issues can't recur undetected
- **Consistency**: All team members run same tests
- **Coverage**: Comprehensive validation of all functionality

### **👥 Collaboration**
- **Visual Interface**: Non-technical stakeholders can run tests
- **PR Integration**: Test results visible in pull requests
- **Documentation**: Tests serve as living examples

The test automation and web UI transform testing from a manual, time-consuming process into an automated, visual, and collaborative experience that prevents the exact type of integration issues we experienced with user profile persistence!