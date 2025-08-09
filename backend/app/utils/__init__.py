# from flask import Flask
# from flask_sqlalchemy import SQLAlchemy
# from flask_migrate import Migrate
# from flask_cors import CORS
# from flask_jwt_extended import JWTManager
# from config import config

# # Initialize extensions
# db = SQLAlchemy()
# migrate = Migrate()
# cors = CORS()
# jwt = JWTManager()

# def create_app(config_name='development'):
#     app = Flask(__name__)
#     app.config.from_object(config[config_name])
    
#     # Initialize extensions with app
#     db.init_app(app)
#     migrate.init_app(app, db)
#     cors.init_app(app, origins=app.config['CORS_ORIGINS'])
#     jwt.init_app(app)
    
#     # Register blueprints
#     from app.routes.api import api_bp
#     from app.routes.auth import auth_bp
    
#     app.register_blueprint(api_bp, url_prefix='/api')
#     app.register_blueprint(auth_bp, url_prefix='/auth')
    
#     # Health check endpoint
#     @app.route('/health')
#     def health_check():
#         return {'status': 'healthy', 'database': 'connected'}, 200
    
#     return app




# from flask import Flask
# from flask_sqlalchemy import SQLAlchemy
# from flask_migrate import Migrate
# from flask_cors import CORS
# from flask_jwt_extended import JWTManager
# from config import config

# # Initialize extensions
# db = SQLAlchemy()
# migrate = Migrate()
# cors = CORS()
# jwt = JWTManager()

# def create_app(config_name='development'):
#     app = Flask(__name__)
#     app.config.from_object(config[config_name])
    
#     # Initialize extensions with app
#     db.init_app(app)
#     migrate.init_app(app, db)
#     cors.init_app(app, origins=app.config['CORS_ORIGINS'])
#     jwt.init_app(app)
    
#     # Register blueprints
#     # from app.routes.api import api_bp


#     from app.routes.auth import auth_bp
#     # from app.routes.auth import auth_bp
    
#     # app.register_blueprint(api_bp, url_prefix='/api')
#     app.register_blueprint(auth_bp, url_prefix='/api')
    
#     # Health check endpoint
#     @app.route('/health')
#     def health_check():
#         return {'status': 'healthy', 'database': 'connected'}, 200
    
#     return app
