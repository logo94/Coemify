import paramiko

from app.script.settings import settings


def _sanitize(value):
    return value.replace("/", "_").replace("\\", "_").replace("\0", "")


def _make_remote_path(artist, title):
    return f"/music/{_sanitize(artist)} - {_sanitize(title)}.mp3"


def upload_sftp(local_file, artist, title):
    transport = paramiko.Transport((settings.SFTP_HOST, int(settings.SFTP_PORT)))
    try:
        transport.connect(username=settings.SFTP_USER, password=settings.SFTP_PASS)
        sftp = paramiko.SFTPClient.from_transport(transport)
        try:
            sftp.put(str(local_file), _make_remote_path(artist, title))
        finally:
            sftp.close()
    finally:
        transport.close()


def upload_sftp_batch(files):
    """Upload multiple files over a single SFTP connection.
    files: list of (local_path, artist, title) tuples.
    Returns list of error strings (empty if all succeeded).
    """
    errors = []
    transport = paramiko.Transport((settings.SFTP_HOST, int(settings.SFTP_PORT)))
    try:
        transport.connect(username=settings.SFTP_USER, password=settings.SFTP_PASS)
        sftp = paramiko.SFTPClient.from_transport(transport)
        try:
            for local_file, artist, title in files:
                try:
                    sftp.put(str(local_file), _make_remote_path(artist, title))
                except Exception as e:
                    errors.append(f"Errore upload '{title}': {e}")
        finally:
            sftp.close()
    finally:
        transport.close()
    return errors
