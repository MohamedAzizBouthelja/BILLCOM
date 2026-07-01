from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Index
from sqlalchemy.sql import func
from app.database import Base

class Order(Base):
    __tablename__ = "orders"

    id               = Column(Integer, primary_key=True, autoincrement=True)
    order_number     = Column(String(50), unique=True, nullable=False)
    username         = Column(String(50), nullable=False)
    product_id       = Column(Integer, nullable=True)
    quantity         = Column(Integer, nullable=True)
    items_json       = Column(Text, nullable=True)
    total_price      = Column(Float, nullable=False)
    payment_method   = Column(String(50), default="cod", nullable=False)
    shipping_address = Column(String(500), nullable=True)
    status           = Column(String(20), default="pending", nullable=False)
    created_at       = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        Index("ix_orders_order_number",  "order_number"),
        Index("ix_orders_username",      "username"),
        Index("ix_orders_status",        "status"),
        Index("ix_orders_created_at",    "created_at"),
        # Composite : liste des commandes d'un user par statut
        Index("ix_orders_user_status",   "username", "status"),
    )
