import psycopg2
from flask import Flask, jsonify, request

# Database connection information
DB_CONFIG = {
    "user": "postgres",
    "password":  "postgres",
    "host": "localhost",
    "port":"5432",
    "database":  "postgres"
}

# Encryption key for XOR cipher
ENCRYPTION_KEY = 5

app = Flask(__name__)

def get_db_connection():
    """
    Establish a connection to the PostgreSQL database
    """
    try:
        conn = psycopg2.connect(
            user=DB_CONFIG["user"],
            password=DB_CONFIG["password"],
            host=DB_CONFIG["host"],
            port=DB_CONFIG["port"],
            database=DB_CONFIG["database"]
        )
        return conn
            
    except psycopg2.Error as e:
        print("Database connection error:", e)
        return None

# Test connection
if __name__ == "__main__":
    conn = get_db_connection()
    if conn:
        print(" Database connection successful!")
        conn.close()
    else:
        print("Database connection failed.")

