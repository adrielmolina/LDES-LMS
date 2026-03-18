from sqlalchemy import Column, Integer, String, Date, DECIMAL, Boolean, Text, ForeignKey, Enum, SmallInteger, DateTime, TIMESTAMP, LargeBinary
from sqlalchemy.ext.declarative import declarative_base
from flask_login import UserMixin
from datetime import datetime

Base = declarative_base()

class Report_TvA(Base):
    __tablename__ = 'target_per_year'

    id = Column(Integer, primary_key=True, autoincrement=True, unique=True, nullable=False)
    year = Column(Integer)
    classic = Column(Integer)
    bronze = Column(Integer)
    silver = Column(Integer)
    gold = Column(Integer)
    platinum = Column(Integer)
    safe_card = Column(Integer)
    senior = Column(Integer)
    senior_plus = Column(Integer)
    
    
    
    