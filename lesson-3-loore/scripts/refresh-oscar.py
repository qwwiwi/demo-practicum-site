"""Refresh public Oscar Hartmann social counters with Loore. Usage: LOORE_API_KEY=... python3 refresh-oscar.py path/to/oscar.json"""
import concurrent.futures
import datetime
import json
import os
import pathlib
import sys
import tempfile
import urllib.request
import xml.etree.ElementTree as ET
from zoneinfo import ZoneInfo

HANDLE = 'oskar_hartmann'
CHANNEL_ID = 'UCFJnZHIusOlHr-pbYVHmr-A'
REQUESTS = {
    'yt_channel': {'channel_id': CHANNEL_ID},
    'yt_channel_videos': {'channel_id': CHANNEL_ID, 'sort': 'latest'},
    'yt_channel_shorts': {'channel_id': CHANNEL_ID, 'sort': 'newest'},
    'ig_profile': {'username': HANDLE},
    'ig_user_reels': {'username': HANDLE, 'include_caption': True, 'limit': 24},
    'tg_channel': {'handle': HANDLE},
    'tg_channel_posts': {'handle': HANDLE},
}


def fetch(name, cursor=None):
    args = dict(REQUESTS[name])
    if cursor:
        args["cursor"] = cursor
    request = urllib.request.Request(
        'https://mcp.loore.ai/v1/' + name.replace('_', '-'),
        data=json.dumps(args).encode(),
        headers={'Content-Type': 'application/json', 'Authorization': 'Bearer ' + os.environ['LOORE_API_KEY']},
    )
    with urllib.request.urlopen(request, timeout=80) as response:
        payload = json.load(response)
    if payload.get('status') != 'ok':
        raise RuntimeError(f'{name} returned {payload.get("error")}')
    return payload['result']


MOSCOW = ZoneInfo('Europe/Moscow')
FEED = 'https://www.youtube.com/feeds/videos.xml?channel_id=' + CHANNEL_ID


def youtube_dates(xml):
    return {entry.findtext('{*}videoId'): entry.findtext('{*}published')
            for entry in ET.fromstring(xml).findall('{*}entry')}


def calendar_day(value):
    return datetime.datetime.fromisoformat(value.replace('Z', '+00:00')).astimezone(MOSCOW).date()


def normalize(results, exact_dates):
    updated = datetime.datetime.now(datetime.timezone.utc)
    today = updated.astimezone(MOSCOW).date()
    start = today - datetime.timedelta(days=6)
    channels = []
    sources = [
        ('YouTube', 'yt_channel', 'channel', ['yt_channel_videos', 'yt_channel_shorts'], 'title', 'publishedAt'),
        ('Telegram', 'tg_channel', 'channel', ['tg_channel_posts'], 'text', 'publishedAt'),
        ('Instagram', 'ig_profile', 'profile', ['ig_user_reels'], 'caption', 'takenAt'),
    ]
    for platform, profile_key, profile_field, feeds, title_key, date_key in sources:
        profile = results[profile_key][profile_field]
        posts = {}
        gaps = []
        for feed in feeds:
            page = results[feed]
            cursors = set()
            while True:
                dates = []
                for item in page['items']:
                    stamp = exact_dates.get(item.get('id')) if platform == 'YouTube' else None
                    stamp = stamp or item.get(date_key)
                    if not stamp:
                        gaps.append('Отсутствует дата публикации')
                        continue
                    day = calendar_day(stamp)
                    dates.append(day)
                    if start <= day <= today:
                        if platform == 'YouTube' and item.get('publishedText') and item.get('id') not in exact_dates:
                            gaps.append('Некоторые даты YouTube приблизительные')
                        posts[item['url']] = dict(date=stamp, views=item.get('views'), url=item['url'],
                            title=' '.join((item.get(title_key) or 'Публикация без подписи').split())[:200])
                # Use the page tail, since Instagram can pin older posts at the top.
                if (dates and dates[-1] < start) or not page.get('hasMore'):
                    break
                cursor = page.get('nextCursor')
                if not cursor or cursor in cursors or len(cursors) >= 10:
                    gaps.append('Лента за период получена частично')
                    break
                cursors.add(cursor)
                page = fetch(feed, cursor)
        channels.append(dict(platform=platform, handle='@' + profile.get('handle', HANDLE),
                             url=profile.get('url', 'https://www.instagram.com/oskar_hartmann/'),
                             followers=profile.get('followers', profile.get('subscribers')),
                             coverageGaps=sorted(set(gaps)),
                             posts=sorted(posts.values(), key=lambda post: post['date'], reverse=True)))
    return dict(updatedAt=updated.isoformat(), startDate=start.isoformat(), endDate=today.isoformat(),
                timezone='Europe/Moscow', channels=channels)


def write_snapshot(path, snapshot):
    with tempfile.NamedTemporaryFile(mode='w', encoding='utf-8', dir=path.parent, delete=False) as temp:
        json.dump(snapshot, temp, ensure_ascii=False, indent=2)
    os.replace(temp.name, path)


if __name__ == '__main__':
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
        results = dict(zip(REQUESTS, pool.map(fetch, REQUESTS)))
    with urllib.request.urlopen(FEED, timeout=30) as feed:
        dates = youtube_dates(feed.read())
    write_snapshot(pathlib.Path(sys.argv[1]), normalize(results, dates))
