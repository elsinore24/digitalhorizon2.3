import os
from dotenv import load_dotenv
import subprocess
import sys

# Load environment variables from .env file
load_dotenv()

# Get the path to the supabase-mcp-server executable
# Use the full path to the executable to avoid PATH issues
server_command = r"C:\Users\Daniel\.local\bin\supabase-mcp-server.exe"

print(f"Loading environment variables from .env and running {server_command}...")

# Execute the server command
# Pass the current environment including the loaded variables
process = subprocess.Popen([server_command], env=os.environ)

# Wait for the process to finish
process.wait()

print(f"{server_command} finished with exit code {process.returncode}")
sys.exit(process.returncode)