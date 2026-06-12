import os
import shutil
import schedule
import time
import threading
from pathlib import Path
from datetime import datetime


BACKUP_DIR = Path("backups")
DB_PATH = Path(os.environ.get('DB_PATH', 'sql/LDES-LMS.db'))
MAX_BACKUPS = 30


def create_backup():
    """Copy the DB to the backups folder with a timestamped filename."""
    try:
        BACKUP_DIR.mkdir(exist_ok=True)

        timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M")
        filename = f"{timestamp}_LDES_backup.db"
        dest = BACKUP_DIR / filename

        shutil.copy2(DB_PATH, dest)
        print(f"✅ Backup created: {filename}")

        cleanup_old_backups()
        return filename

    except Exception as e:
        print(f"❌ Backup failed: {e}")
        return None


def cleanup_old_backups():
    """Keep only the last MAX_BACKUPS files."""
    files = sorted(BACKUP_DIR.glob("*_LDES_backup.db"))
    if len(files) > MAX_BACKUPS:
        for f in files[:len(files) - MAX_BACKUPS]:
            f.unlink()
            print(f"🗑️ Deleted old backup: {f.name}")


def schedule_backups():
    """Run scheduled backups at 11am and 4pm daily."""
    schedule.every().day.at("11:00").do(create_backup)
    schedule.every().day.at("16:00").do(create_backup)

    print("📅 Backup scheduler started (11:00 and 16:00 daily)")

    def run():
        while True:
            schedule.run_pending()
            time.sleep(30)  # check every 30 seconds

    thread = threading.Thread(target=run, daemon=True)
    thread.start()