"""Upsert the Moscow calendar day's observed counters from a dashboard snapshot."""
import datetime
import json
import os
import pathlib
import sys
import tempfile
from zoneinfo import ZoneInfo


def upsert(source, destination):
    data = json.loads(source.read_text())
    instant = datetime.datetime.fromisoformat(data['updatedAt'].replace('Z', '+00:00'))
    if instant.tzinfo is None:
        raise ValueError('updatedAt must contain a time zone')
    day = instant.astimezone(ZoneInfo('Europe/Moscow')).date().isoformat()
    history = json.loads(destination.read_text()) if destination.exists() else {'snapshots': []}
    days = {row['date']: row for row in history['snapshots']}
    days[day] = {'date': day, 'channels': [
        {'platform': channel['platform'], 'followers': channel['followers'], 'posts': [
            {'url': post['url'], 'views': post['views']} for post in channel['posts']
        ]} for channel in data['channels']
    ]}
    with tempfile.NamedTemporaryFile(mode='w', dir=destination.parent, delete=False) as temp:
        json.dump({'snapshots': [days[date] for date in sorted(days)]}, temp, ensure_ascii=False, indent=2)
        temp.write('\n')
    os.replace(temp.name, destination)


if __name__ == '__main__':
    upsert(pathlib.Path(sys.argv[1]), pathlib.Path(sys.argv[2]))
