import os
from datetime import datetime, timezone
from typing import Annotated, Optional

from bson import ObjectId
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, BeforeValidator, ConfigDict, EmailStr, Field

load_dotenv()

MONGO_URL = os.environ.get("MONGO_URL")
DB_NAME = os.environ.get("DB_NAME")
CORS_ORIGINS = os.environ.get("CORS_ORIGINS", "*").split(",")

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

app = FastAPI(title="Zelarion")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _oid(v):
    if isinstance(v, ObjectId):
        return str(v)
    return v


PyObjectId = Annotated[str, BeforeValidator(_oid)]


class DemoRequestIn(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    company: str = Field(min_length=1, max_length=160)
    team_size: str = Field(min_length=1, max_length=60)
    preferred_date: Optional[str] = None
    message: Optional[str] = Field(default=None, max_length=1000)


class DemoRequest(DemoRequestIn):
    model_config = ConfigDict(populate_by_name=True)
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    created_at: str


@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "zelarion"}


@app.post("/api/demo", response_model=DemoRequest, status_code=201)
async def create_demo_request(payload: DemoRequestIn):
    doc = payload.model_dump()
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.demo_requests.insert_one(doc)
    doc["_id"] = result.inserted_id
    return DemoRequest(**doc)


@app.get("/api/demo/count")
async def demo_count():
    return {"count": await db.demo_requests.count_documents({})}
