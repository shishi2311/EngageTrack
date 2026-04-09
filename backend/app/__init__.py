import os
from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv

from .extensions import db, migrate, ma
from .config import DevConfig, TestConfig, ProdConfig

load_dotenv()

_config_map = {
    "development": DevConfig,
    "testing": TestConfig,
    "production": ProdConfig,
}


def create_app(config=None):
    app = Flask(__name__)

    if config is not None:
        app.config.from_object(config)
    else:
        env = os.getenv("FLASK_ENV", "development")
        app.config.from_object(_config_map.get(env, DevConfig))

    db.init_app(app)
    migrate.init_app(app, db)
    ma.init_app(app)
    CORS(app)

    # Register blueprints
    from .routes import clients, projects, milestones, status_updates, dashboard
    app.register_blueprint(clients.bp)
    app.register_blueprint(projects.bp)
    app.register_blueprint(milestones.bp)
    app.register_blueprint(status_updates.bp)
    app.register_blueprint(dashboard.bp)

    return app
