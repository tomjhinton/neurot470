from flask import Blueprint, request, jsonify, abort
from pony.orm import db_session
from marshmallow import ValidationError
from app import db
from models.Work import Work, WorkSchema


router = Blueprint(__name__, 'works')

@router.route('/works', methods=['GET'])
@db_session
def index():
    schema = WorkSchema(many=True)
    works = Work.select()
    return schema.dumps(works)


@router.route('/works', methods=['POST'])
@db_session
def create():

    schema = WorkSchema()

    try:

        data = schema.load(request.get_json())

        work = Work(**data)

        db.commit()
    except ValidationError as err:

        return jsonify({'message': 'Validation failed', 'errors': err.messages}), 422

    return schema.dumps(work), 201


@router.route('/works/<int:work_id>', methods=['GET'])
@db_session
def show(work_id):
    schema = WorkSchema()
    work = Work.get(id=work_id)

    if not work:
        abort(404)

    return schema.dumps(work)


@router.route('/works/<int:work_id>', methods=['PUT'])
@db_session
def update(work_id):
    schema = WorkSchema()
    work = Work.get(id=work_id)

    if not work:
        abort(404)

    try:
        data = schema.load(request.get_json())
        work.set(**data)
        db.commit()
    except ValidationError as err:
        return jsonify({'message': 'Validation failed', 'errors': err.messages}), 422

    return schema.dumps(work)


@router.route('/works/<int:work_id>', methods=['DELETE'])
@db_session
def delete(work_id):
    work = Work.get(id=work_id)

    if not work:
        abort(404)

    work.delete()
    db.commit()

    return '', 204
