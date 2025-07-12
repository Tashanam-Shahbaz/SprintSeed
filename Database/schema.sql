-- Create schema
CREATE SCHEMA task_management;

-- Roles Table
CREATE TABLE task_management.roles (
    role_id VARCHAR(100) PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Users Table
CREATE TABLE task_management.users (
    user_id VARCHAR(100) PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    role_id VARCHAR(100) REFERENCES task_management.roles(role_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- Projects Table
CREATE TABLE task_management.projects (
    project_id VARCHAR(100) PRIMARY KEY,
    project_name VARCHAR(100) NOT NULL,
    description TEXT,
    start_date DATE,
    end_date DATE,
    status VARCHAR(20) DEFAULT 'planning',
    created_by VARCHAR(100) REFERENCES task_management.users(user_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tasks Table
CREATE TABLE task_management.tasks (
    task_id VARCHAR(100) PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    project_id VARCHAR(100) REFERENCES task_management.projects(project_id),
    status VARCHAR(20) DEFAULT 'open',
    priority VARCHAR(20) DEFAULT 'medium',
    complexity VARCHAR(20),
    estimated_hours INTEGER,
    created_by VARCHAR(100) REFERENCES task_management.users(user_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    due_date DATE
);

-- Task Assignments Table
CREATE TABLE task_management.task_assignments (
    assignment_id VARCHAR(100) PRIMARY KEY,
    task_id VARCHAR(100) REFERENCES task_management.tasks(task_id),
    assigned_to VARCHAR(100) REFERENCES task_management.users(user_id),
    assigned_by VARCHAR(100) REFERENCES task_management.users(user_id),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'assigned',
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Comments Table
CREATE TABLE task_management.comments (
    comment_id VARCHAR(100) PRIMARY KEY,
    content TEXT NOT NULL,
    task_id VARCHAR(100) REFERENCES task_management.tasks(task_id),
    user_id VARCHAR(100) REFERENCES task_management.users(user_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Notifications Table
CREATE TABLE task_management.notifications (
    notification_id VARCHAR(100) PRIMARY KEY,
    user_id VARCHAR(100) REFERENCES task_management.users(user_id),
    content TEXT NOT NULL,
    related_to VARCHAR(100),
    type VARCHAR(50),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User Availability Table
CREATE TABLE task_management.user_availability (
    availability_id VARCHAR(100) PRIMARY KEY,
    user_id VARCHAR(100) REFERENCES task_management.users(user_id),
    available_from TIMESTAMP WITH TIME ZONE,
    available_to TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'available'
);