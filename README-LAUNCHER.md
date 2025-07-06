# STASIS Application Launcher

This document explains how to use the batch files to run the STASIS application with Spring Boot and React frontend.

## Prerequisites

Before running the application, ensure you have the following installed:

1. **Java 17** - Required for Spring Boot
2. **Maven** - For building and running the Spring Boot application
3. **Node.js and npm** - For running the React frontend
4. **PostgreSQL** (for local development only)

## Available Launchers

### 1. `run.bat` - Live Data (Supabase)
Runs the application with live data from Supabase database.

```bash
run.bat
```

**Features:**
- Connects to Supabase PostgreSQL database (live data)
- Spring Boot runs on port 8080
- React frontend runs on port 3000
- Full Spring Boot Actuator endpoints enabled
- VSCode Dashboard integration ready

### 2. `run-local.bat` - Local Development
Runs the application with local PostgreSQL database.

```bash
run-local.bat
```

**Features:**
- Connects to local PostgreSQL database (localhost:5432/stasis)
- Default credentials: postgres/123
- Enhanced debugging and logging
- Spring Boot runs on port 8080
- React frontend runs on port 3000
- Full Spring Boot Actuator endpoints enabled

## What the Launchers Do

1. **Validation**: Check if Maven and npm are installed and available
2. **Backend**: Start Spring Boot application in a separate command window
3. **Frontend**: Start React development server in another command window
4. **Monitoring**: Enable all Spring Boot Actuator endpoints for monitoring

## Access Points

Once both applications are running:

- **Frontend (React)**: http://localhost:3000
- **Backend API**: http://localhost:8080
- **Health Check**: http://localhost:8080/actuator/health
- **Application Info**: http://localhost:8080/actuator/info
- **All Actuator Endpoints**: http://localhost:8080/actuator

## VSCode Spring Boot Dashboard

To use the Spring Boot Dashboard in VSCode:

1. Install the "Spring Boot Dashboard" extension
2. Run either launcher (`run.bat` or `run-local.bat`)
3. The dashboard will automatically detect the running Spring Boot application
4. View live metrics, beans, mappings, health status, and more

### Available Dashboard Features

- **Application Health**: Real-time health status
- **Beans**: View all Spring beans and their dependencies
- **Mappings**: See all REST endpoints and their mappings
- **Metrics**: JVM metrics, HTTP request metrics, database connection pool stats
- **Environment**: View all configuration properties
- **Loggers**: Dynamically change log levels
- **Thread Dump**: Analyze application threads
- **Heap Dump**: Memory analysis (if needed)

## Database Configurations

### Supabase (Live Data)
- **Host**: aws-0-ap-southeast-1.pooler.supabase.com
- **Port**: 5432
- **Database**: postgres
- **SSL**: Required

### Local Development
- **Host**: localhost
- **Port**: 5432
- **Database**: stasis
- **Username**: postgres
- **Password**: 123
- **SSL**: Not required

## Troubleshooting

### Common Issues

1. **Maven not found**: Install Maven and add it to your PATH
2. **npm not found**: Install Node.js which includes npm
3. **Frontend directory not found**: Ensure you're running from the project root
4. **Database connection failed**: 
   - For local: Ensure PostgreSQL is running and database exists
   - For Supabase: Check internet connection

### Port Conflicts

If ports 8080 or 3000 are already in use:
- Stop other applications using these ports
- Or modify the port configurations in the respective configuration files

## Stopping the Applications

To stop the applications:
1. Close the command windows that opened for backend and frontend
2. Or press `Ctrl+C` in each command window

## Development Tips

- Use `run-local.bat` for development with local database
- Use `run.bat` for testing with live data
- Monitor application health via actuator endpoints
- Use VSCode Dashboard for real-time application insights
- Check logs in the respective command windows for debugging

## Configuration Files

- **Spring Boot Local**: `src/main/resources/application-local.properties`
- **Spring Boot Supabase**: `src/main/resources/application-supabase.properties`
- **React**: `frontend/package.json`
