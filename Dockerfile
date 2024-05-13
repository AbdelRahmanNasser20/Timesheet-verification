# Base image
FROM --platform=linux/amd64 python:3.8-slim

# Working directory inside the container
WORKDIR /app

# Copy the application files to the container
COPY . /app

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Expose a port, this will be overridden by -p in docker run
EXPOSE 8080

# Command to run the Flask application
CMD ["python", "app.py"]
