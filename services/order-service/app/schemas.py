from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, Any


class OrderCreate(BaseModel):
    order_number: str
    product_id: Optional[int] = None
    quantity: Optional[int] = None
    items: Optional[Any] = None
    total_price: float = Field(..., gt=0)
    payment_method: str = "cod"
    shipping_address: Optional[str] = None


class OrderResponse(BaseModel):
    id: int
    order_number: str
    username: str
    product_id: Optional[int]
    quantity: Optional[int]
    items_json: Optional[str]
    total_price: float
    payment_method: str
    shipping_address: Optional[str]
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
