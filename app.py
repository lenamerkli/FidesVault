from base64 import urlsafe_b64decode
from base64 import urlsafe_b64encode
from datetime import datetime
from datetime import timedelta
from dotenv import load_dotenv
from flask import Flask
from flask import Response
from flask import g
from flask import render_template
from flask import request
from flask import send_from_directory
from flask import session
from hashlib import pbkdf2_hmac
from hashlib import sha3_512
from ipaddress import IPv4Address
from ipaddress import IPv6Address
from ipaddress import ip_address
from json import dumps as json_dumps
from logging import FileHandler as LogFileHandler
from logging import Formatter as LogFormatter
from logging import INFO as LOG_INFO  # noqa
from logging import basicConfig as log_basicConfig
from logging import getLogger as GetLogger
from logging import log as logging_log
from os import environ
from os import urandom
from os.path import exists
from os.path import join
from pyotp import TOTP
from pyotp import random_base32 as totp_random_base32
from requests import request as requests_send
from sqlite3 import Connection as SQLite_Connection
from sqlite3 import connect as sqlite_connect


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
setup_logger('account_creation', join(app.root_path, 'logs', 'account_creation.log'))
account_creation_log = GetLogger('account_creation')


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


@app.route('/api/v1/account/create/totp', methods=['GET', 'POST'])
def r_api_v1_account_create_totp():
    return totp_random_base32()


@app.route('/api/v1/account/create/salt', methods=['GET', 'POST'])
def r_api_v1_account_create_salt():
    return rand_salt()


@app.route('/api/v1/account/create', methods=['POST'])
def r_api_v1_account_create():
    data = dict(request.get_json(force=True, silent=True))
    if (data is None) or (not isinstance(data, dict)):
        return {'error': 'Invalid request'}, 400
    if not all(data.get(i, '') != '' for i in ['firstName', 'lastName', 'email', 'hash', 'salt', 'dateOfBirth', 'title', 'gender', 'country', 'legalNameDifferent', 'legalFirstName', 'legalLastName', 'legalGender', 'additionalInformation', 'cipher', 'totp']):
        return {'error': 'Invalid request'}, 400
    data['ip'] = request.access_route[-1]
    data['browser'] = extract_browser(request.user_agent)
    data['date'] = get_current_time()
    account_creation_log.info(json_dumps(data) + '\n\n')
    return {'success': 'Account awaiting approval'}, 200


@app.route('/api/v1/account/login', methods=['POST'])
def r_api_v1_account_login():
    data = dict(request.get_json(force=True, silent=True))
    if (data is None) or (not isinstance(data, dict)):
        return {'error': 'Invalid request'}, 400
    if not all(data.get(i, '') for i in ['email', 'code', 'password']):
        return {'error': 'Invalid request'}, 400
    error_message = {'error': 'e-mail not found, incorrect password or TOTP mismatch'}, 400
    result = query_db('SELECT totp, hash, salt, cipher FROM users WHERE email=?', (data['email'],), one=True)
    if not result:
        logging_log(LOG_INFO, f"No user with email `{data['email']}` was found.")
        return error_message
    hashed = urlsafe_b64encode(pbkdf2_hmac('sha256', data['password'].encode(), urlsafe_b64decode(result[2]), 100000)).decode('utf-8').replace('=', '')
    if hashed != result[1]:
        logging_log(LOG_INFO, f"A wrong password was entered for the user `{data['email']}`: `{hashed} != {result[1]}`")
        return error_message
    try:
        totp = TOTP(result[0])
        is_valid = totp.verify(data['code'])
    except Exception as e:
        logging_log(LOG_INFO, e)
        return error_message
    if not is_valid:
        logging_log(LOG_INFO, f"A wrong TOTP code was entered for the user `{data['email']}`.")
        return error_message
    return {
        'success': 'success',
        'salt': result[2],
        'cipher': result[3],
    }


@app.errorhandler(404)
def error_handler_404(*_, **__):
    if DEVELOPMENT:
        res = requests_send(
            method=request.method,
            url='http://' + request.url.replace(request.host_url, f'localhost:4200/'),  # noqa
            headers={k: v for k, v in request.headers if k.lower() != 'host'},
            data=request.get_data(),
            cookies=request.cookies,
            allow_redirects=True,
        )
        excluded_headers = ['content-encoding', 'content-length', 'transfer-encoding', 'connection']
        headers = [
            (k, v) for k, v in res.raw.headers.items()
            if k.lower() not in excluded_headers
        ]
        response = Response(res.content, res.status_code, headers)  # noqa
        return response
    else:
        path = request.path
        if path and path.startswith('/'):
            path = path[1:]
        if path != '' and exists(join(app.root_path, 'build', path)):
            return send_from_directory(join(app.root_path, 'build'), path), 200
        else:
            return send_from_directory(join(app.root_path, 'build'), 'index.html'), 200


if __name__ == '__main__':
    app.run('0.0.0.0', port=5000, debug=False)
