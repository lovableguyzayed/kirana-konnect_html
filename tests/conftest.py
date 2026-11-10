import os, sys, tempfile, pytest

_db = tempfile.NamedTemporaryFile(suffix='.db', delete=False).name
os.environ['DATABASE_URL'] = 'sqlite:///' + _db
os.environ['SESSION_SECRET'] = 'test-secret'
os.environ['OWNER_RESET_CODE'] = 'RESET-123456'
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import app as app_module  # noqa: E402


@pytest.fixture(scope='session')
def flask_app():
    return app_module.app


@pytest.fixture
def client(flask_app):
    return flask_app.test_client()


@pytest.fixture(scope='session')
def owner(flask_app):
    c = flask_app.test_client()
    c.post('/signup', data={'owner_name': 'Ramesh', 'phone': '+91 98765-43210',
                            'password': 'secret123', 'shop_name': 'Ramesh General Store'})
    return {'phone': '9876543210', 'password': 'secret123'}


@pytest.fixture
def auth(flask_app, owner):
    c = flask_app.test_client()
    c.post('/signin', data={'identifier': owner['phone'], 'password': owner['password']})
    return c
