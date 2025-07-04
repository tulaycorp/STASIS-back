#!/bin/bash

echo "Building STASIS application with Spring Security..."

# Install Maven dependencies and compile
echo "Compiling Spring Boot application..."
./mvnw clean compile

if [ $? -eq 0 ]; then
    echo "✓ Compilation successful!"
    
    echo "Running Spring Boot application..."
    ./mvnw spring-boot:run
else
    echo "✗ Compilation failed!"
    exit 1
fi
