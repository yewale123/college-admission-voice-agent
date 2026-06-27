-- College Admission Voice Agent - MySQL Setup
-- Run this script in MySQL Workbench or mysql CLI:
-- mysql -u root -p < setup_database.sql

CREATE DATABASE IF NOT EXISTS college_admission_db
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE college_admission_db;

-- The tables are auto-created by SQLAlchemy on first run.
-- This file just ensures the database exists.

SHOW DATABASES LIKE 'college_admission_db';
