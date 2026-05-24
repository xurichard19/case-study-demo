from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel


class ClientAccount(BaseModel):
    id: UUID
    name: str
    contact_email: str | None = None


class Driver(BaseModel):
    id: str
    display_name: str | None = None
    active: bool = True


class Order(BaseModel):
    id: str
    client_account_id: UUID
    client_name: str
    order_time: datetime | None = None
    pickup_zip: str | None = None
    delivery_zip: str | None = None
    service_type: str | None = None
    driver_id: str | None = None
    dispatch_time: datetime | None = None
    pickup_time: datetime | None = None
    delivery_time: datetime | None = None
    promised_eta: datetime | None = None
    on_time: bool | None = None
    exception_notes: str | None = None
    driver_idle_min: int | None = None
    fuel_cost_usd: Decimal | None = None
    redelivery_flag: bool = False
    severity: str = "severity three"
    status: str
