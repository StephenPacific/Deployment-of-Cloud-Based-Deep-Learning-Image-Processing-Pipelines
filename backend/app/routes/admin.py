from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from marshmallow import Schema, fields, ValidationError
from bson.objectid import ObjectId
from app import mongo
import bcrypt


# app = create_app()
# mongo.db = mongo.mongo.db

admin_bp = Blueprint('admin_api', __name__)

def serialize_user(user):
    user["_id"] = str(user["_id"])
    return user

@admin_bp.route("/users", methods=["GET"])
def get_users():
    users = list(mongo.db.users.find())
    return jsonify([serialize_user(user) for user in users])

@admin_bp.route("/users/<user_id>", methods=["GET"])
def get_user(user_id):
    user = mongo.db.users.find_one({"_id": ObjectId(user_id)})
    if user:
        return jsonify(serialize_user(user))
    return jsonify({"error": "User not found"}), 404

# @admin_bp.route("/users", methods=["POST"])
# def create_user():
#     data = request.json
#     mongo.db.users.insert_one(data)
#     return jsonify({"message": "User created"}), 201

#@admin_bp.route("/users/<user_id>", methods=["PUT"])
#def update_user(user_id):
#    data = request.json
#    mongo.db.users.update_one({"_id": ObjectId(user_id)}, {"$set": data})
#    return jsonify({"message": "User updated"})

@admin_bp.route("/users/<user_id>", methods=["PUT"])
def update_user(user_id):
    data = request.json
    allowed_fields = {"banned", "username", "email", "organization"}  # 可加入更多字段，只是为了更安全，防止前端误传
    update_fields = {k: v for k, v in data.items() if k in allowed_fields}

    if not update_fields:
        return jsonify({"error": "No valid fields to update"}), 400

    mongo.db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": update_fields}
    )
    return jsonify({"message": "User updated"}), 200

@admin_bp.route("/users/<user_id>", methods=["DELETE"])
def delete_user(user_id):
    mongo.db.users.delete_one({"_id": ObjectId(user_id)})
    return jsonify({"message": "User deleted"})


# ------------------------------
# 历史记录相关API
# user_name联查
def serialize_history(history):
    history["_id"] = str(history["_id"])
    history["user_id"] = str(history["user_id"])
    return history

@admin_bp.route("history", methods=["GET"])
def get_history():
    history_list = list(mongo.db.tweet.find())
    user_ids = list({h["user_id"] for h in history_list})
    users = mongo.db.users.find({"_id": {"$in": [ObjectId(uid) for uid in user_ids]}}, projection={"username": 1})
    user_map = {str(u["_id"]): u["username"] for u in users}

    for h in history_list:
        h["user_name"] = user_map.get(str(h["user_id"]), "Unknown")

    return jsonify([serialize_history(h) for h in history_list])

