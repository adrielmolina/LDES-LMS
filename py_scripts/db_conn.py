import os
from dotenv import load_dotenv
from pathlib import Path
from sqlalchemy import create_engine, text, func, extract, distinct
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import sessionmaker, scoped_session
import cryptography
from datetime import date, datetime, timedelta, timezone
from py_scripts import tools
import py_scripts.models as models
from random import randint
import sqlite3

if os.getenv('FLASK_ENV') == 'production' or os.getenv('FLASK_ENV') == 'development':
    DB_CONNECTION_MODE = os.getenv('DB_CONNECTION_MODE', 'aiven').lower()
else:
    current_dir = Path(__file__).parent
    parent_dir = current_dir.parent
    env_loc = parent_dir/'creds.env'

    load_dotenv(env_loc)

    DB_CONNECTION_MODE = os.getenv('DB_CONNECTION_MODE', 'local').lower()
    



# FOR LOCAL DB CONNECTION
SQL_HOST = os.getenv('SQL_HOST')
SQL_USER = os.getenv('SQL_USER')
SQL_PASS = os.getenv('SQL_PASS')
SQL_DB = os.getenv('SQL_DB')


# todo remove on deployment
# print(f'SQL CONNECTION DEBUG\nHost={SQL_HOST}\nUser={SQL_USER}\nPass={SQL_PASS}\nDB={SQL_DB}')

DB_PATH = Path(os.environ.get('DB_PATH', 'sql/LDES-LMS.db'))

def conn_init():
    if not DB_PATH.exists():
        raise FileNotFoundError("Database not found. Run init_db.py first.")
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn
    '''
    try:
        if DB_CONNECTION_MODE == "aiven":
            ca_path = Path(__file__).resolve().parent.parent / "sql" / "aiven" / "ca.pem"
            if not ca_path.exists():
                raise FileNotFoundError(f"SSL certificate not found: {ca_path}")
            
            db_url = f"{AIVEN_URI}&ssl_ca={ca_path}"
            print(f"Connecting to Aiven DB")
        
        elif DB_CONNECTION_MODE == "railway":
            # Convert mysql:// to mysql+pymysql:// for SQLAlchemy
            formatted_url = RAILWAY_URI.replace("mysql://", "mysql+pymysql://")
            db_url = formatted_url
            print("Connecting to Railway DB")
        
        else:  # local connection
            db_url = f"mysql+pymysql://{SQL_USER}:{SQL_PASS}@{SQL_HOST}/{SQL_DB}"
            print(f"Connecting to local DB")
            
        engine = create_engine(db_url, pool_pre_ping=True)
        print('Database Connection Success')
        return engine
    
    except OperationalError as e:
        print(f"Database Connection Failed: {e}")
        return None
    except Exception as e:
        print(f"Unexpected Error: {e}")
        return None
    '''

'''
# not needed anymore
# TODO replace all session binds with SessionLocal
conn = conn_init()
SessionLocal = scoped_session(sessionmaker(bind=conn))
# db_session = SessionLocal() # Use this for queries


def shutdown_session():
    """Remove session (for Flask teardown)"""
    SessionLocal.remove()
'''



if __name__ == '__main__':
    print('do no run this module directly lol')
    print('use initialize_database.py')
    