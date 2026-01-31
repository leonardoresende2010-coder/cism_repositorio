import socket
import os
from dotenv import load_dotenv

load_dotenv()

def check_port():
    url = os.getenv("DATABASE_URL")
    if not url:
        print("DATABASE_URL not found")
        return
    
    # Simple parse
    host = url.split('@')[1].split('/')[0].split('?')[0]
    port = 5432
    if ':' in host:
        host, port_str = host.split(':')
        port = int(port_str)
    
    print(f"Checking {host}:{port}...")
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.settimeout(5)
    try:
        s.connect((host, port))
        print("✅ Port is OPEN!")
    except Exception as e:
        print(f"❌ Port is CLOSED or UNREACHABLE: {e}")
    finally:
        s.close()

if __name__ == "__main__":
    check_port()
