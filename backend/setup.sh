#!/bin/bash
echo "Setting up AudioChat backend..."

# Create virtual environment if it doesn't exist
if [ ! -d "env" ]; then
    echo "Creating virtual environment..."
    python3 -m venv env
fi

# Activate virtual environment
source env/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "Creating .env file..."
    cp .env.example .env
    echo "Please edit the .env file with your configuration"
fi

echo "Setup complete!"
echo "To start the server, run: ./run.sh"

# Make run.sh executable
chmod +x run.sh