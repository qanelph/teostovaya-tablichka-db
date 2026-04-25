import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
}

def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def handler(event: dict, context) -> dict:
    """CRUD для таблицы records: GET — список, POST — создание, PUT — обновление, DELETE — удаление"""

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    method = event.get('httpMethod', 'GET')
    body = {}
    if event.get('body'):
        body = json.loads(event['body'])

    conn = get_conn()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    if method == 'GET':
        cur.execute("SELECT * FROM records ORDER BY created_at DESC")
        rows = cur.fetchall()
        result = []
        for row in rows:
            r = dict(row)
            r['created_at'] = r['created_at'].isoformat() if r['created_at'] else None
            r['updated_at'] = r['updated_at'].isoformat() if r['updated_at'] else None
            result.append(r)
        conn.close()
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps(result, ensure_ascii=False)}

    if method == 'POST':
        name = body.get('name', '')
        description = body.get('description', '')
        status = body.get('status', 'active')
        cur.execute(
            "INSERT INTO records (name, description, status) VALUES (%s, %s, %s) RETURNING *",
            (name, description, status)
        )
        row = dict(cur.fetchone())
        row['created_at'] = row['created_at'].isoformat() if row['created_at'] else None
        row['updated_at'] = row['updated_at'].isoformat() if row['updated_at'] else None
        conn.commit()
        conn.close()
        return {'statusCode': 201, 'headers': CORS_HEADERS, 'body': json.dumps(row, ensure_ascii=False)}

    if method == 'PUT':
        record_id = body.get('id')
        name = body.get('name')
        description = body.get('description')
        status = body.get('status')
        cur.execute(
            "UPDATE records SET name=%s, description=%s, status=%s, updated_at=NOW() WHERE id=%s RETURNING *",
            (name, description, status, record_id)
        )
        row = dict(cur.fetchone())
        row['created_at'] = row['created_at'].isoformat() if row['created_at'] else None
        row['updated_at'] = row['updated_at'].isoformat() if row['updated_at'] else None
        conn.commit()
        conn.close()
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps(row, ensure_ascii=False)}

    if method == 'DELETE':
        record_id = body.get('id')
        cur.execute("DELETE FROM records WHERE id=%s", (record_id,))
        conn.commit()
        conn.close()
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({'ok': True})}

    conn.close()
    return {'statusCode': 405, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Method not allowed'})}
