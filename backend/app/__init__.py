import os
import certifi
import shutil            # 新增：后面合并分片可能用到
from flask import Flask, send_from_directory, abort
from flask_pymongo import PyMongo
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from config import config

mongo = PyMongo()
jwt   = JWTManager()

def create_app(config_name: str = "development") -> Flask:
    project_root  = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    FRONTEND_DIST = os.path.join(project_root, "Project_v1.0", "dist")
    print(">>> FRONTEND_DIST =", FRONTEND_DIST)

    # ------------------ ① 创建 Flask 实例 ------------------
    app = Flask(__name__, static_folder=None)
    app.config.from_object(config[config_name])

    # ------------------ ② 数据库 & 上传目录 ------------------
    app.config["MONGO_URI"] = (
        "mongodb+srv://Cluster06853:TkJ4Y2V5VnVk"
        "@cluster06853.uyyxvvf.mongodb.net/9900"
        "?retryWrites=true&w=majority&appName=Cluster06853"
    )

    # 上传根目录
    app.config['UPLOAD_ROOT'] = os.path.join(project_root, 'user_data', 'db')
    os.makedirs(app.config['UPLOAD_ROOT'], exist_ok=True)           # <— 若不存在就创建
    print(">>> UPLOAD_ROOT =", app.config['UPLOAD_ROOT'])

    # ③ 分片大小 & 临时目录 -------------（新增）
    app.config['CHUNK_SIZE']       = 50 * 1024 * 1024              # 50 MB
    app.config['TEMP_CHUNK_DIR']   = os.path.join(app.config['UPLOAD_ROOT'], '__tmp_chunks')
    os.makedirs(app.config['TEMP_CHUNK_DIR'], exist_ok=True)

    # （可选）一次性限制上传总大小（例如 5 GB）
    app.config['MAX_CONTENT_LENGTH'] = 5 * 1024 * 1024 * 1024

    # ------------------ ③ 初始化扩展 ------------------
    CORS(app,
         supports_credentials=True,
         methods=["GET", "POST", "PUT", "DELETE"],
         allow_headers=["Content-Type", "Authorization", "X-Requested-With"])
    mongo.init_app(app, tls=True, tlsCAFile=certifi.where())
    jwt.init_app(app)
    print("MongoDB connected:", mongo.db is not None)

    # ------------------ ④ 注册蓝图 ------------------
    from app.routes import register_blueprints, register_admin
    register_blueprints(app)
    register_admin(app)

    # ------------------ ⑤ 其它路由保持不变 ------------------
    @app.route("/health")
    def health_check():
        return {"status": "healthy", "database": "connected"}, 200

    @app.route("/static/uploads/<path:filepath>")
    def serve_uploads(filepath):
        root = app.config["UPLOAD_ROOT"]
        full = os.path.join(root, filepath)
        if not os.path.isfile(full):
            abort(404)
        return send_from_directory(root, filepath)

    @app.route("/", defaults={"path": ""})
    @app.route("/<path:path>")
    def serve_frontend(path: str):
        full_path = os.path.join(FRONTEND_DIST, path)
        if path and os.path.isfile(full_path):
            return send_from_directory(FRONTEND_DIST, path)
        return send_from_directory(FRONTEND_DIST, "index.html")

    return app
