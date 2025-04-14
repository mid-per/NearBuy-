# app/models/transaction_status_history.py
from app import db
from datetime import datetime, timezone

class TransactionStatusHistory(db.Model):
    __tablename__ = 'transaction_status_history'
    id = db.Column(db.Integer, primary_key=True)
    transaction_id = db.Column(db.Integer, db.ForeignKey('transactions.id'))
    from_status = db.Column(db.String(20))
    to_status = db.Column(db.String(20))
    changed_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    changed_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    notes = db.Column(db.Text)