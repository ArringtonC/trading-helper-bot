# Use an official Python runtime as a parent image
FROM python:3.9-slim

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    # Set Flask app for development server (optional, good for debugging outside Gunicorn)
    # FLASK_APP=app.py \
    # Set the port the app will listen on
    PORT=5000

# Set the working directory in the container
WORKDIR /app

# Copy the requirements file into the container at /app
COPY requirements.txt .

# Install any needed packages specified in requirements.txt, including gunicorn
RUN pip install --no-cache-dir -r requirements.txt gunicorn

# Copy the rest of the application code into the container at /app
COPY . .

# Create the models directory (ensure correct permissions if using non-root user later)
RUN mkdir models

# Create a non-root user and set permissions
# Using a simple approach; for production, more complex user/group management might be needed
ARG UID=10001
RUN adduser --disabled-password --gecos "" --uid ${UID} appuser
# Change ownership of the app directory and models directory to the new user
RUN chown -R appuser:appuser /app

# Switch to the non-root user
USER appuser

# Expose the port the app runs on
EXPOSE ${PORT}

# Command to run the application using Gunicorn
# Assuming your Flask app instance is named 'app' in app.py
CMD ["gunicorn", "--bind", "0.0.0.0:${PORT}", "app:app"] 