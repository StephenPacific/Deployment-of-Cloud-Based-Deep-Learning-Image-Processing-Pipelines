# # import os
# # from app import create_app, db
# # from app.models import User

# # app = create_app(os.getenv('FLASK_ENV', 'development'))

# # @app.shell_context_processor
# # def make_shell_context():
# #     """Make database and models available in flask shell"""
# #     return {'db': db, 'User': User}

# # if __name__ == '__main__':
# #     with app.app_context():
# #         db.create_all()  # Create tables if they don't exist
# #     app.run(debug=True, port=5000)



# from flask import Flask
# from extensions import mongo

# def create_app(config_name='default'):
#     app = Flask(__name__)

#     # 使用 MongoDB Atlas 的远程连接 URI
#     app.config["MONGO_URI"] = (
#         "mongodb+srv://Cluster06853:TkJ4Y2V5VnVk@cluster06853.uyyxvvf.mongodb.net/?retryWrites=true&w=majority&appName=Cluster06853"
#     )

#     # 初始化 MongoDB 和蓝图
#     mongo.init_app(app)

#     return app

# if __name__ == '__main__':
#     app = create_app()
#     app.run(debug=True)




from app import create_app

app = create_app('development')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5005, debug=True)
    