# import os
# from dotenv import load_dotenv

# load_dotenv()

# class Config:
#     # Database
#     SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL')
#     SQLALCHEMY_TRACK_MODIFICATIONS = False
#     SQLALCHEMY_ENGINE_OPTIONS = {
#         'pool_pre_ping': True,
#         'pool_recycle': 300,
#     }
    
#     # Security
#     SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key'
#     JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'dev-jwt-secret'
#     JWT_ACCESS_TOKEN_EXPIRES = 3600  # 1 hour
    
#     # CORS
#     CORS_ORIGINS = os.environ.get('CORS_ORIGINS', '').split(',')

# class DevelopmentConfig(Config):
#     DEBUG = True

# class ProductionConfig(Config):
#     DEBUG = False

# class TestingConfig(Config):
#     TESTING = True
#     SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'

# config = {
#     'development': DevelopmentConfig,
#     'production': ProductionConfig,
#     'testing': TestingConfig,
#     'default': DevelopmentConfig
# }




import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # MongoDB
    MONGODB_URI = os.environ.get('MONGODB_URI') or 'mongodb+srv://Cluster06853:TkJ4Y2V5VnVk@cluster06853.uyyxvvf.mongodb.net/9900?retryWrites=true&w=majority&appName=Cluster06853'
    
    # Security
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key'
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'dev-jwt-secret'
    JWT_ACCESS_TOKEN_EXPIRES = 3600  # 1 hour
    
    # CORS
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', '').split(',')

class DevelopmentConfig(Config):
    DEBUG = True

class ProductionConfig(Config):
    DEBUG = False

class TestingConfig(Config):
    TESTING = True
    MONGODB_URI = 'mongodb://localhost:27017/test_db'

config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}