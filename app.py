from base64 import urlsafe_b64encode
from datetime import datetime
from datetime import timedelta
from dotenv import load_dotenv
from flask import Flask
from flask import g
from flask import render_template
from flask import request
from flask import session
from hashlib import sha3_512
from ipaddress import ip_address
from ipaddress import IPv4Address
from ipaddress import IPv6Address
from logging import FileHandler as LogFileHandler
from logging import Formatter as LogFormatter
from logging import INFO as LOG_INFO  # noqa
from logging import basicConfig as log_basicConfig
from logging import getLogger as GetLogger
from os import environ
from os import urandom
from os.path import exists
from os.path import join
from sqlite3 import connect as sqlite_connect
from sqlite3 import Connection as SQLite_Connection


load_dotenv()

DATE_FORMAT = '%Y-%m-%d_%H-%M-%S'
DEVELOPMENT = environ.get('ENVIRONMENT', '') == 'dev'

app = Flask(__name__)

if not exists(join(app.root_path, 'resources', 'key.bin')):
    with open(join(app.root_path, 'resources', 'key.bin'), 'wb') as _f:
        _f.write(urandom(64))
with open(join(app.root_path, 'resources', 'key.bin'), 'rb') as _f:
    _secret_key = _f.read()
app.secret_key = _secret_key

if DEVELOPMENT:
    app.config.update(
        SESSION_COOKIE_NAME='session',
        SESSION_COOKIE_HTTPONLY=True,
        SESSION_COOKIE_SECURE=False,
        SESSION_COOKIE_SAMESITE='Strict',
        PERMANENT_SESSION_LIFETIME=timedelta(days=128),
    )
else:
    app.config.update(
        SESSION_COOKIE_NAME='__Host-session',
        SESSION_COOKIE_HTTPONLY=True,
        SESSION_COOKIE_SECURE=True,
        SESSION_COOKIE_SAMESITE='Strict',
        PERMANENT_SESSION_LIFETIME=timedelta(days=128),
    )


def setup_logger(name, file):
    """
    Creates a new logging instance
    :param name: the name
    :param file: path to the file to which the contents will be written
    :return:
    """
    logger = GetLogger(name)
    formatter = LogFormatter('%(asctime)s\t%(message)s', datefmt='%Y-%m-%d_%H-%M-%S')
    file_handler = LogFileHandler(file, mode='a')
    file_handler.setFormatter(formatter)
    logger.setLevel(LOG_INFO)
    logger.addHandler(file_handler)
    logger.propagate = False


log_basicConfig(filename='main.log', format='%(asctime)s\t%(message)s', datefmt=DATE_FORMAT, level=LOG_INFO)

setup_logger('access', join(app.root_path, 'logs', 'access.log'))
access_log = GetLogger('access')


def get_db() -> SQLite_Connection:
    """
    Gets the database instance
    :return: a pointer to the database
    """
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = sqlite_connect('database.sqlite')
    return db


@app.teardown_appcontext
def close_connection(exception=None) -> None:  # noqa
    """
    destroys the database point
    :param exception: unused
    :return:
    """
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()


def query_db(query, args=(), one=False) -> list | tuple:
    """
    Runs a SQL query
    :param query: the query as a SQL statement
    :param args: arguments to be inserted into the query
    :param one: if this function should only return one result
    :return: the data from the database
    """
    conn = get_db()
    cur = conn.execute(query, args)
    result = cur.fetchall()
    conn.commit()
    cur.close()
    return (result[0] if result else None) if one else result


with app.app_context():
    with open(join(app.root_path, 'resources/create_database.sql'), 'r') as f:
        _create_db = f.read()
    _conn = get_db()
    _conn.executescript(_create_db)
    _conn.commit()
    _conn.close()

def get_current_time() -> str:
    """
    Returns the current date and time.
    :return: current datetime
    """
    return datetime.now().strftime(DATE_FORMAT)

def rand_base64(digits: int) -> str:
    """
    Generates a new string of random base64 characters
    :param digits: the length of the string to be generated
    :return: a random string of base64 characters
    """
    while True:
        n = urlsafe_b64encode(urandom(digits)).decode()[:digits]
        result = query_db('SELECT * FROM used_ids WHERE id=?', (n,), True)
        if not result:
            query_db('INSERT INTO used_ids VALUES (?, ?)', (n, get_current_time()))
            return n


def rand_base16(digits: int) -> str:
    """
    Generates a new string of random base16 characters
    :param digits: the length of the string to be generated
    :return: a random string of base16 characters
    """
    while True:
        n = urandom(digits).hex()[:digits]
        result = query_db('SELECT * FROM used_ids WHERE id=?', (n,), True)
        if not result:
            query_db('INSERT INTO used_ids VALUES (?, ?)', (n, get_current_time()))
            return n


def rand_salt() -> str:
    """
    Generates a random salt
    :return: a random salt
    """
    return urlsafe_b64encode(urandom(32)).decode()


def hash_ip(ip):
    try:
        ip_obj = ip_address(ip)
        if isinstance(ip_obj, IPv4Address):
            hashed = sha3_512(ip_obj.packed).digest()
        elif isinstance(ip_obj, IPv6Address):
            hashed = sha3_512(ip_obj.packed).digest()
        else:
            raise ValueError("Invalid IP address")
    except ValueError:
        raise ValueError("Invalid IP address")

    return urlsafe_b64encode(hashed).decode()


def extract_browser(agent):
    return f"{agent.platform}-{agent.browser}"


def scan_request():
    ip = request.access_route[-1]
    score = query_db('SELECT score, ip FROM ips WHERE ip = ?', (ip,), True)
    if not score:
        score = 2
        query_db('INSERT INTO ips VALUES (?, ?, ?)', (ip, 2, 'unknown'))
    else:
        score = score[0]
    before = score
    if before != score:
        query_db('UPDATE ips SET score = ? WHERE ip = ?', (score, ip))
    headers = dict(request.headers)
    headers_to_remove = []
    for key in headers:
        if key not in ['Host', 'Accept', 'Accept-Language', 'Accept-Encoding', 'Content-Type']:
            headers_to_remove.append(key)
    for key in headers_to_remove:
        try:
            del headers[key]
        except KeyError:
            pass
    content_length = request.content_length if request.content_length else 0
    if content_length > pow(2, 10 * 3) * 2:
        raise OverflowError('Content too large')
    return score


@app.before_request
def before_request():
    session.permanent = True
    app.permanent_session_lifetime = timedelta(days=92)
    score = scan_request()
    if score == 0:
        return render_template('_banned.html', ip=request.access_route[-1]), 403
    else:
        pass  # noqa


if __name__ == '__main__':
    app.run('0.0.0.0', port=5000, debug=False)
