import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Table
from sqlalchemy.orm import relationship
from app.core.database import Base

class TargetModel(Base):
    __tablename__ = "targets"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(256), nullable=False)
    url = Column(String(2048), nullable=False, index=True)
    description = Column(Text, nullable=True)
    environment = Column(String(64), default="Production") # Production, Staging, Development, Internal
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    last_scan_at = Column(DateTime, nullable=True)
    security_score = Column(Integer, default=100)
    open_findings_count = Column(Integer, default=0)
    status = Column(String(64), default="Active") # Active, Archived

    scans = relationship("ScanResultModel", back_populates="target_rel", cascade="all, delete-orphan")
    findings = relationship("FindingModel", back_populates="target_rel", cascade="all, delete-orphan")

class ScanResultModel(Base):
    __tablename__ = "scans"

    id = Column(Integer, primary_key=True, index=True)
    target_id = Column(Integer, ForeignKey("targets.id", ondelete="SET NULL"), nullable=True)
    target_name = Column(String(256), nullable=True)
    target_url = Column(String(2048), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    scan_profile = Column(String(64), default="Standard") # Quick, Standard, Full
    score = Column(Integer, nullable=False)
    rating = Column(String(64), nullable=False)
    findings_count_critical = Column(Integer, default=0)
    findings_count_high = Column(Integer, default=0)
    findings_count_medium = Column(Integer, default=0)
    findings_count_low = Column(Integer, default=0)
    findings_count_info = Column(Integer, default=0)
    duration_seconds = Column(Integer, default=0)
    result_json = Column(Text, nullable=False)

    target_rel = relationship("TargetModel", back_populates="scans")
    findings = relationship("FindingModel", back_populates="scan_rel", cascade="all, delete-orphan")

class FindingModel(Base):
    __tablename__ = "findings"

    id = Column(Integer, primary_key=True, index=True)
    finding_key = Column(String(256), nullable=False, index=True) # Deterministic key for deduplication
    scan_id = Column(Integer, ForeignKey("scans.id", ondelete="CASCADE"), nullable=True)
    target_id = Column(Integer, ForeignKey("targets.id", ondelete="CASCADE"), nullable=True)
    title = Column(String(512), nullable=False)
    severity = Column(String(32), nullable=False, index=True) # CRITICAL, HIGH, MEDIUM, LOW, INFO
    category = Column(String(128), nullable=False, index=True)
    target_url = Column(String(2048), nullable=False)
    affected_url = Column(String(2048), nullable=False)
    description = Column(Text, nullable=False)
    evidence = Column(Text, nullable=False)
    impact = Column(Text, nullable=False)
    remediation = Column(Text, nullable=False)
    detection_rule = Column(String(256), nullable=False)
    owasp_category = Column(String(256), nullable=True)
    cwe_id = Column(String(128), nullable=True)
    status = Column(String(64), default="Open", index=True) # Open, Triaged, In Progress, Resolved, False Positive, Verified
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    target_rel = relationship("TargetModel", back_populates="findings")
    scan_rel = relationship("ScanResultModel", back_populates="findings")
