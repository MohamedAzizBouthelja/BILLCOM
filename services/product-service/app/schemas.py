from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List

class ProductBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    slug: str = Field(..., min_length=2, max_length=120)
    description: Optional[str] = Field(None, max_length=500)
    price: float = Field(..., gt=0.0)
    old_price: Optional[float] = None
    stock: int = Field(default=0, ge=0)
    image_url: Optional[str] = None
    badge: Optional[str] = ""
    rating: Optional[float] = 0.0
    reviews: Optional[int] = 0
    featured: bool = False
    category: Optional[str] = None
    category_name: Optional[str] = None

class ProductCreate(ProductBase):
    pass

class ProductResponse(ProductBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class ProductListResponse(BaseModel):
    items: List[ProductResponse]
    total: int
    page: int
    per_page: int
    total_pages: int


class ReviewCreate(BaseModel):
    rating: float = Field(..., ge=1.0, le=5.0, description="Note de 1 à 5")
    comment: Optional[str] = Field(None, max_length=1000)

class ReviewResponse(BaseModel):
    id: int
    product_id: int
    user_id: int
    username: str
    rating: float
    comment: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True
