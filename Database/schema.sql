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


-- Create or update the conversation table (main conversation metadata)
CREATE TABLE IF NOT EXISTS task_management.conversation (
    conversation_id VARCHAR(100) PRIMARY KEY,
    project_id VARCHAR(100) REFERENCES task_management.projects(project_id),
    chat_type VARCHAR(50) NOT NULL, -- e.g., 'support', 'research', 'planning'
    user_id VARCHAR(100) REFERENCES task_management.users(user_id),
    title VARCHAR(255), -- Optional title for the conversation
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'active' -- 'active', 'archived', 'deleted'
);

-- Create conversation_message table for the actual messages
CREATE TABLE IF NOT EXISTS task_management.conversation_message (
    message_id VARCHAR(100) PRIMARY KEY,
    conversation_id VARCHAR(100) REFERENCES task_management.conversation(conversation_id) ON DELETE CASCADE,
    user_query VARCHAR(5000) NOT NULL, 
    agent_response TEXT NOT NULL,
    model_id VARCHAR(100), -- Required for agent messages, NULL for user messages
    model_type VARCHAR(50), -- e.g., 'text', 'vision'
    tokens_used INTEGER, -- Track token usage
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE
);

-- Create conversation_attachment table for files attached to messages
CREATE TABLE IF NOT EXISTS task_management.conversation_attachment (
    attachment_id VARCHAR(100) PRIMARY KEY,
    message_id VARCHAR(100) REFERENCES task_management.conversation_message(message_id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100) NOT NULL, -- MIME type
    file_size BIGINT NOT NULL, -- in bytes
    file_path VARCHAR(1000) NOT NULL, -- Storage path
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE
);


-- Add unique constraint to username
ALTER TABLE task_management.users
ADD CONSTRAINT unique_username UNIQUE (username);

-- Add unique constraint to email
ALTER TABLE task_management.users
ADD CONSTRAINT unique_email UNIQUE (email);

-- Insert predefined roles with manual role_id values
INSERT INTO task_management.roles (role_id, role_name, description)
VALUES 
  ('1', 'Project Manager', 'Responsible for managing the project and coordinating teams.'),
  ('2', 'Frontend Developer', 'Responsible for UI/UX and client-side application development.'),
  ('3', 'Backend Developer', 'Handles server-side logic, database, and application integration.'),
  ('4', 'Database Manager', 'Manages the database schema, security, and data integrity.');