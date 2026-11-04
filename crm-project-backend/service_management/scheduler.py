import os
import time
import threading
import logging
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

_scheduler_started = False
_scheduler_lock = threading.Lock()


def start_service_reminder_scheduler():
    """Starts a background thread that automatically checks and sends 2-day service reminders once per day."""
    global _scheduler_started

    with _scheduler_lock:
        if _scheduler_started:
            return
        _scheduler_started = True

    # Avoid running scheduler during Django management commands (like makemigrations, migrate, etc.)
    import sys
    if any(arg in sys.argv for arg in ['makemigrations', 'migrate', 'test', 'shell', 'create_sample_amc_data', 'send_service_reminders']):
        return

    def run_loop():
        logger.info("Service reminder background scheduler thread started.")
        last_run_date = None

        # Give Django 10 seconds to fully initialize
        time.sleep(10)

        while True:
            try:
                now = datetime.now()
                today_date = now.date()

                # Run once per day around 8:00 AM (or immediately on startup if not run today)
                if last_run_date != today_date:
                    from service_management.notifications import process_all_2day_service_reminders
                    target_date = today_date + timedelta(days=2)
                    logger.info(f"[Auto-Scheduler] Running daily 2-day service reminders for target date: {target_date}...")
                    
                    summary = process_all_2day_service_reminders(target_date=target_date, force=False)
                    logger.info(f"[Auto-Scheduler] Completed daily 2-day service reminders: {summary}")
                    
                    last_run_date = today_date

            except Exception as e:
                logger.error(f"[Auto-Scheduler Error]: {e}")

            # Sleep for 1 hour between checks
            time.sleep(3600)

    thread = threading.Thread(target=run_loop, daemon=True, name="ServiceReminderAutoScheduler")
    thread.start()
