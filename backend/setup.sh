#!/bin/bash
echo "Activating virtual environment..."
python3 -m venv env
source env/bin/activate

echo "Installing required packages..."
pip install -r requirements.txt

echo "Setup complete! You can now run the backend server with:"
echo "source env/bin/activate && python main.py"