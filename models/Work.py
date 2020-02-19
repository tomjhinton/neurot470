from datetime import datetime, timedelta

from pony.orm import Required, Set, Optional
from marshmallow import Schema, fields, post_load, validates_schema, ValidationError
from app import db



class Work(db.Entity):
    dat = Required(str)



class WorkSchema(Schema):
    id = fields.Int(dump_only=True)
    dat = fields.String(required=True)
