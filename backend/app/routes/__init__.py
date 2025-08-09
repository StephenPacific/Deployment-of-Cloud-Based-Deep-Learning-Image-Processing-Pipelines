from app.routes.auth import auth_bp
from app.routes.admin import admin_bp

def register_blueprints(app):
    app.register_blueprint(auth_bp, url_prefix='/api')

def register_admin(app):
    app.register_blueprint(admin_bp, url_prefix='/admin_api')