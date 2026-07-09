from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class MachineBase(BaseModel):
    id: str
    location: str
    district: str

class MachineCreate(MachineBase):
    pass

class MachineResponse(MachineBase):
    status: str
    last_heartbeat: datetime
    installation_date: datetime

    model_config = ConfigDict(from_attributes=True)
